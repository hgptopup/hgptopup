
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Game, GamePackage, CartItem } from '../types';
import { useStore } from '../store/useStore';

interface GameDetailProps {
  game: Game;
  onBack: () => void;
  onOpenAuth: () => void;
}

const LOGIN_METHODS = [
  { id: 'uid', label: 'UID', fieldLabel: 'Player UID', hasPassword: false, hasWhatsapp: false, hasVault: false, type: 'text' },
  { id: 'vault', label: 'Vault System', fieldLabel: 'Game Email/ID', hasPassword: true, hasWhatsapp: true, hasVault: true, type: 'email' },
  { id: 'konami', label: 'Konami Mail', fieldLabel: 'Konami Email', hasPassword: true, hasWhatsapp: true, hasVault: false, type: 'email' },
  { id: 'supercell', label: 'Supercell mail', fieldLabel: 'Supercell Email', hasPassword: false, hasWhatsapp: true, hasVault: false, type: 'email' },
  { id: 'facebook', label: 'Facebook Login', fieldLabel: 'Facebook Email/Phone', hasPassword: true, hasWhatsapp: false, hasVault: false, type: 'text' },
  { id: 'gmail', label: 'Gmail Login', fieldLabel: 'Gmail Address', hasPassword: true, hasWhatsapp: false, hasVault: false, type: 'email' }
];

const MERCHANT_NUMBER = "+8801878666388";

const GameDetail: React.FC<GameDetailProps> = ({ game, onBack, onOpenAuth }) => {
  const [selectedPackage, setSelectedPackage] = useState<GamePackage | null>(null);
  const [loginMethod, setLoginMethod] = useState(LOGIN_METHODS[0].id);
  const [accountIdentifier, setAccountIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [vaultGmail, setVaultGmail] = useState('');
  const [vaultNumber, setVaultNumber] = useState('');
  
  // Validation State
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [isAdded, setIsAdded] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const { addToCart, isAuthenticated, addOrder, user } = useStore();

  const currentMethod = LOGIN_METHODS.find(m => m.id === loginMethod) || LOGIN_METHODS[0];

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone: string) => /^\d{10,15}$/.test(phone);

  const validateInputs = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedPackage) {
      newErrors.package = "Please select a package.";
    }
    
    // Validate email-based identifiers
    if (currentMethod.type === 'email' && !validateEmail(accountIdentifier)) {
      newErrors.identifier = `Invalid email format.`;
    } else if (!accountIdentifier || accountIdentifier.trim().length < 3) {
      newErrors.identifier = `Min 3 characters required.`;
    }

    if (currentMethod.hasPassword && password.length < 4) {
      newErrors.password = "Min 4 characters required.";
    }

    if (currentMethod.hasWhatsapp && !validatePhone(whatsapp)) {
      newErrors.whatsapp = "Enter valid digits (10-15).";
    }

    if (currentMethod.hasVault) {
        if (!validateEmail(vaultGmail)) {
            newErrors.vaultGmail = "Invalid gmail format.";
        }
        if (!vaultNumber || !/^\d+$/.test(vaultNumber)) {
            newErrors.vaultNumber = "Digits only required.";
        }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Clear specific error when user types
  const handleInputChange = (field: string, value: string, setter: (val: string) => void) => {
    setter(value);
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const getCartItem = (): CartItem => {
    return {
      cartId: Math.random().toString(36).substr(2, 9),
      gameId: game.id,
      gameTitle: game.title,
      packageId: selectedPackage!.id,
      packageName: `${selectedPackage!.amount} ${selectedPackage!.unit}`,
      price: selectedPackage!.price,
      playerId: accountIdentifier,
      loginMethod: currentMethod.label,
      password: currentMethod.hasPassword ? password : undefined,
      whatsapp: currentMethod.hasWhatsapp ? whatsapp : undefined,
      vaultGmail: currentMethod.hasVault ? vaultGmail : undefined,
      vaultNumber: currentMethod.hasVault ? vaultNumber : undefined,
      image: game.image
    };
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      onOpenAuth();
      return;
    }
    if (!validateInputs()) return;
    addToCart(getCartItem());
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      onOpenAuth();
      return;
    }
    if (!validateInputs()) return;
    setShowPayment(true);
  };

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(MERCHANT_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitOrder = async () => {
    if (!paymentMethod || !transactionId) {
      alert("Please select payment method and enter Transaction ID");
      return;
    }

    setIsProcessingOrder(true);
    
    const item = getCartItem();
    const orderData = {
      id: 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      userId: user?.id || 'guest',
      items: [item],
      totalAmount: item.price,
      status: 'PENDING' as const,
      createdAt: new Date().toISOString()
    };

    const success = await addOrder(orderData);
    setIsProcessingOrder(false);
    
    if (success) {
      setShowPayment(false);
      setShowSuccessPopup(true);
      setTransactionId('');
      setPaymentMethod(null);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-6">
        <button onClick={onBack} className="flex items-center space-x-2 text-white/60 hover:text-red-500 mb-8 transition-colors group">
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-bold uppercase tracking-widest text-xs">Back to Arena</span>
        </button>

        <div className="grid md:grid-cols-3 gap-12">
          {/* Game Info */}
          <div className="md:col-span-1">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl overflow-hidden glass border border-white/10 sticky top-32"
            >
              <div className="relative aspect-[4/5]">
                <img src={game.image} className="w-full h-full object-cover" alt={game.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              </div>
              <div className="p-6">
                <h1 className="text-3xl font-display font-bold mb-2">{game.title}</h1>
                <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mb-4">{game.category}</p>
                <p className="text-white/40 text-sm leading-relaxed line-clamp-3">
                  {game.description}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Form Area */}
          <div className="md:col-span-2 space-y-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-8 rounded-3xl border border-white/5">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center font-display font-bold text-lg shadow-lg shadow-red-600/20">1</div>
                <h2 className="text-xl font-bold">Verification Intel</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-3 ml-1">Login Method</label>
                  <select 
                    value={loginMethod}
                    onChange={(e) => {
                        setLoginMethod(e.target.value);
                        setAccountIdentifier('');
                        setPassword('');
                        setWhatsapp('');
                        setVaultGmail('');
                        setVaultNumber('');
                        setErrors({});
                    }}
                    className="w-full bg-neutral-900 border border-white/10 rounded-2xl py-4 px-5 text-sm font-bold focus:outline-none focus:border-red-600 transition-all text-white cursor-pointer"
                  >
                    {LOGIN_METHODS.map((method) => (
                      <option key={method.id} value={method.id}>{method.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-[0.2em] mb-3 ml-1 transition-colors ${errors.identifier ? 'text-red-500' : 'text-white/40'}`}>
                      {currentMethod.fieldLabel}
                    </label>
                    <input 
                      type={currentMethod.type} 
                      placeholder={`Enter ${currentMethod.fieldLabel.toLowerCase()}...`}
                      value={accountIdentifier}
                      onChange={(e) => handleInputChange('identifier', e.target.value, setAccountIdentifier)}
                      className={`w-full bg-white/5 border rounded-2xl py-4 px-5 text-sm font-medium focus:outline-none transition-all text-white ${errors.identifier ? 'border-red-500 bg-red-500/5' : 'border-white/10 focus:border-red-600'}`}
                    />
                    {errors.identifier && (
                      <p className="text-[10px] text-red-500 font-bold mt-2 ml-1 uppercase tracking-wider">{errors.identifier}</p>
                    )}
                  </div>
                  
                  {currentMethod.hasPassword && (
                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-[0.2em] mb-3 ml-1 transition-colors ${errors.password ? 'text-red-500' : 'text-white/40'}`}>Password</label>
                      <input 
                        type="password" 
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => handleInputChange('password', e.target.value, setPassword)}
                        className={`w-full bg-white/5 border rounded-2xl py-4 px-5 text-sm font-medium focus:outline-none transition-all text-white ${errors.password ? 'border-red-500 bg-red-500/5' : 'border-white/10 focus:border-red-600'}`}
                      />
                      {errors.password && (
                        <p className="text-[10px] text-red-500 font-bold mt-2 ml-1 uppercase tracking-wider">{errors.password}</p>
                      )}
                    </div>
                  )}

                  {currentMethod.hasWhatsapp && (
                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-[0.2em] mb-3 ml-1 transition-colors ${errors.whatsapp ? 'text-red-500' : 'text-white/40'}`}>WhatsApp No</label>
                      <input 
                        type="tel" 
                        placeholder="01XXXXXXXXX"
                        value={whatsapp}
                        onChange={(e) => handleInputChange('whatsapp', e.target.value, setWhatsapp)}
                        className={`w-full bg-white/5 border rounded-2xl py-4 px-5 text-sm font-medium focus:outline-none transition-all text-white ${errors.whatsapp ? 'border-red-500 bg-red-500/5' : 'border-white/10 focus:border-red-600'}`}
                      />
                      {errors.whatsapp && (
                        <p className="text-[10px] text-red-500 font-bold mt-2 ml-1 uppercase tracking-wider">{errors.whatsapp}</p>
                      )}
                    </div>
                  )}

                  {currentMethod.hasVault && (
                    <>
                      <div>
                        <label className={`block text-[10px] font-bold uppercase tracking-[0.2em] mb-3 ml-1 transition-colors ${errors.vaultGmail ? 'text-red-500' : 'text-white/40'}`}>Vault Gmail</label>
                        <input 
                          type="email" 
                          placeholder="vault@gmail.com"
                          value={vaultGmail}
                          onChange={(e) => handleInputChange('vaultGmail', e.target.value, setVaultGmail)}
                          className={`w-full bg-white/5 border rounded-2xl py-4 px-5 text-sm font-medium focus:outline-none transition-all text-white ${errors.vaultGmail ? 'border-red-500 bg-red-500/5' : 'border-white/10 focus:border-red-600'}`}
                        />
                        {errors.vaultGmail && (
                          <p className="text-[10px] text-red-500 font-bold mt-2 ml-1 uppercase tracking-wider">{errors.vaultGmail}</p>
                        )}
                      </div>
                      <div>
                        <label className={`block text-[10px] font-bold uppercase tracking-[0.2em] mb-3 ml-1 transition-colors ${errors.vaultNumber ? 'text-red-500' : 'text-white/40'}`}>Vault Number</label>
                        <input 
                          type="text" 
                          placeholder="Vault Code"
                          value={vaultNumber}
                          onChange={(e) => handleInputChange('vaultNumber', e.target.value, setVaultNumber)}
                          className={`w-full bg-white/5 border rounded-2xl py-4 px-5 text-sm font-medium focus:outline-none transition-all text-white ${errors.vaultNumber ? 'border-red-500 bg-red-500/5' : 'border-white/10 focus:border-red-600'}`}
                        />
                        {errors.vaultNumber && (
                          <p className="text-[10px] text-red-500 font-bold mt-2 ml-1 uppercase tracking-wider">{errors.vaultNumber}</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Step 2: Select Package */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-8 rounded-3xl border border-white/5">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center font-display font-bold text-lg shadow-lg shadow-red-600/20">2</div>
                <h2 className="text-xl font-bold">Select Package</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {game.packages.map((pkg) => (
                  <button
                    key={pkg.id}
                    onClick={() => {
                      setSelectedPackage(pkg);
                      if (errors.package) {
                        setErrors(prev => {
                          const next = { ...prev };
                          delete next.package;
                          return next;
                        });
                      }
                    }}
                    className={`p-5 rounded-2xl border transition-all text-left ${selectedPackage?.id === pkg.id ? 'bg-red-600/10 border-red-500' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                  >
                    <div className="text-xl font-display font-bold mb-1">{pkg.amount}</div>
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">{pkg.unit}</div>
                    <div className="text-sm font-bold text-red-500">৳{pkg.price.toFixed(0)}</div>
                  </button>
                ))}
              </div>
              {errors.package && (
                <p className="text-[10px] text-red-500 font-bold mt-4 text-center uppercase tracking-widest">{errors.package}</p>
              )}
            </motion.div>

            {/* Checkout Area */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-8 rounded-3xl border border-red-500/10">
              <AnimatePresence mode="wait">
                {!showPayment ? (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button onClick={handleAddToCart} className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-white/10 text-white transition-all uppercase tracking-widest text-xs">Add to Cart</button>
                    <button onClick={handleBuyNow} className="flex-1 py-4 bg-red-600 rounded-2xl font-bold hover:bg-red-700 text-white shadow-xl shadow-red-600/20 transition-all uppercase tracking-widest text-xs">Buy Now</button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => setPaymentMethod('bkash')} className={`p-4 rounded-2xl border font-bold transition-all ${paymentMethod === 'bkash' ? 'bg-pink-600/20 border-pink-600 text-pink-500' : 'bg-white/5 border-white/5 text-white/40'}`}>bKash</button>
                      <button onClick={() => setPaymentMethod('nagad')} className={`p-4 rounded-2xl border font-bold transition-all ${paymentMethod === 'nagad' ? 'bg-orange-600/20 border-orange-600 text-orange-500' : 'bg-white/5 border-white/5 text-white/40'}`}>Nagad</button>
                    </div>
                    <div className="glass p-5 rounded-2xl border border-white/5 flex justify-between items-center">
                      <span className="text-xl font-display font-bold text-white">{MERCHANT_NUMBER}</span>
                      <button onClick={handleCopyNumber} className="px-4 py-2 bg-red-600/20 text-red-500 rounded-xl text-xs font-bold">{copied ? 'Copied' : 'Copy'}</button>
                    </div>
                    <input type="text" placeholder="Transaction ID" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-sm font-medium text-white focus:border-red-600" />
                    <button disabled={!paymentMethod || !transactionId || isProcessingOrder} onClick={handleSubmitOrder} className="w-full py-5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-red-600/20">{isProcessingOrder ? "Processing..." : "Confirm Payment"}</button>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSuccessPopup && (
          <div className="fixed inset-0 flex items-center justify-center z-[500] p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="glass-dark border border-green-500/30 rounded-[3rem] p-10 max-w-md w-full relative z-10 text-center shadow-[0_0_50px_rgba(34,197,94,0.15)] overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-green-500/10 rounded-full blur-[80px] -mt-32"></div>
              
              <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-500/30">
                <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h2 className="text-3xl font-display font-bold mb-4">Transmission <span className="text-green-500">Successful</span></h2>
              <p className="text-white/40 text-sm font-medium mb-8 leading-relaxed">
                Your order has been logged into the crimson network. Our operators are verifying the transaction. Your items will arrive within 5-30 minutes.
              </p>

              <div className="space-y-3">
                <button onClick={() => setShowSuccessPopup(false)} className="w-full py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold rounded-2xl transition-all uppercase tracking-widest text-xs">Dismiss Intel</button>
                <button onClick={() => { setShowSuccessPopup(false); onBack(); }} className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-green-600/20 uppercase tracking-widest text-xs">Return to Arena</button>
              </div>
              
              <p className="mt-8 text-[9px] font-bold text-green-500/40 uppercase tracking-[0.4em]">Verified Security Node • HGP Secure</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameDetail;
