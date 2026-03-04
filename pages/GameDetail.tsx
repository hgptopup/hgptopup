
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Game, GamePackage, CartItem } from '../types';
import { useStore } from '../store/useStore';

interface GameDetailProps {
  game: Game;
  onBack: () => void;
  onOpenAuth: () => void;
}

const LOGIN_METHODS = [
  { id: 'uid', label: 'UID', fieldLabel: 'Player UID', hasPassword: false, hasWhatsapp: false, type: 'text' },
  { id: 'konami', label: 'Konami Mail', fieldLabel: 'Konami Email', hasPassword: true, hasWhatsapp: true, type: 'email' },
  { id: 'supercell', label: 'Supercell mail', fieldLabel: 'Supercell Email', hasPassword: false, hasWhatsapp: true, type: 'email' },
  { id: 'facebook', label: 'Facebook Login', fieldLabel: 'Facebook Email/Phone', hasPassword: true, hasWhatsapp: true, type: 'text' },
  { id: 'gmail', label: 'Gmail Login', fieldLabel: 'Gmail Address', hasPassword: true, hasWhatsapp: true, type: 'email' },
  { id: 'twitter', label: 'Twitter Login', fieldLabel: 'Twitter Username/Email', hasPassword: true, hasWhatsapp: true, type: 'text' },
  { id: 'vk', label: 'VK Login', fieldLabel: 'VK Email/Phone', hasPassword: true, hasWhatsapp: true, type: 'text' },
  { id: 'username', label: 'Username Login', fieldLabel: 'Username', hasPassword: true, hasWhatsapp: true, type: 'text' }
];

const GameDetail: React.FC<GameDetailProps> = ({ game, onBack, onOpenAuth }) => {
  const [selectedPackage, setSelectedPackage] = useState<GamePackage | null>(null);
  const [loginMethod, setLoginMethod] = useState(LOGIN_METHODS[0].id);
  const [accountIdentifier, setAccountIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  
  // Validation State
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [isAdded, setIsAdded] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'bKash' | 'Nagad' | 'Rocket' | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  
  const { addToCart, isAuthenticated, addOrder, user } = useStore();

  const paymentNumbers = {
    bKash: "+8801878666388",
    Nagad: "+8801878666388",
    Rocket: "+8801878666388"
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Number copied to clipboard!");
  };

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

  const handleSubmitOrder = async () => {
    try {
      if (!validateInputs()) return;
      
      if (!paymentMethod || !transactionId) {
        alert("Please select a payment method and enter Transaction ID.");
        return;
      }

      setIsProcessingOrder(true);
      
      const item = getCartItem();
      const orderId = 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      
      const orderData = {
        id: orderId,
        userId: user?.id || 'guest',
        items: [item],
        totalAmount: item.price,
        status: 'PENDING' as const,
        createdAt: new Date().toISOString(),
        transactionId: transactionId,
        paymentMethod: paymentMethod
      };

      console.log("HGP DEBUG: Submitting order from GameDetail:", orderId);
      const success = await addOrder(orderData);
      
      if (success) {
        setShowSuccess(true);
      } else {
        alert("Failed to place order. Please check your connection and try again.");
      }
    } catch (error: any) {
      console.error("HGP Order Submission Error:", error);
      alert("Order Error: " + (error.message || "Unknown error occurred"));
    } finally {
      setIsProcessingOrder(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6">
        <button onClick={onBack} className="flex items-center space-x-2 text-slate-500 hover:text-red-600 mb-8 transition-colors group">
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
              className="bg-white rounded-lg overflow-hidden border-2 border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)] sticky top-32"
            >
              <div className="relative aspect-[4/5]">
                <img src={game.image} className="w-full h-full object-cover" alt={game.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              </div>
              <div className="p-6">
                <h1 className="text-3xl font-display font-bold mb-2 text-slate-900">{game.title}</h1>
                <p className="text-red-600 text-[10px] font-bold uppercase tracking-widest mb-4">{game.category}</p>
                <p className="text-slate-500 text-sm leading-relaxed line-clamp-3">
                  {game.description}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Form Area */}
          <div className="md:col-span-2 space-y-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 sm:p-8 rounded-lg border-2 border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)]">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 bg-red-600 text-white rounded-xl flex items-center justify-center font-display font-bold text-lg shadow-lg shadow-red-600/20">1</div>
                <h2 className="text-xl font-bold text-slate-900">Verification Intel</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Login Method</label>
                  <select 
                    value={loginMethod}
                    onChange={(e) => {
                        setLoginMethod(e.target.value);
                        setAccountIdentifier('');
                        setPassword('');
                        setWhatsapp('');
                        setErrors({});
                    }}
                    className="w-full bg-white border border-black/10 rounded-2xl py-4 px-5 text-sm font-bold focus:outline-none focus:border-red-600 transition-all text-slate-900 cursor-pointer"
                  >
                    {LOGIN_METHODS.map((method) => (
                      <option key={method.id} value={method.id}>{method.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-[0.2em] mb-3 ml-1 transition-colors ${errors.identifier ? 'text-red-600' : 'text-slate-400'}`}>
                      {currentMethod.fieldLabel}
                    </label>
                    <input 
                      type={currentMethod.type} 
                      placeholder={`Enter ${currentMethod.fieldLabel.toLowerCase()}...`}
                      value={accountIdentifier}
                      onChange={(e) => handleInputChange('identifier', e.target.value, setAccountIdentifier)}
                      className={`w-full bg-slate-50 border rounded-2xl py-4 px-5 text-sm font-medium focus:outline-none transition-all text-slate-900 ${errors.identifier ? 'border-red-600 bg-red-600/5' : 'border-black/10 focus:border-red-600'}`}
                    />
                    {errors.identifier && (
                      <p className="text-[10px] text-red-600 font-bold mt-2 ml-1 uppercase tracking-wider">{errors.identifier}</p>
                    )}
                  </div>
                  
                  {currentMethod.hasPassword && (
                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-[0.2em] mb-3 ml-1 transition-colors ${errors.password ? 'text-red-600' : 'text-slate-400'}`}>Password</label>
                      <input 
                        type="password" 
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => handleInputChange('password', e.target.value, setPassword)}
                        className={`w-full bg-slate-50 border rounded-2xl py-4 px-5 text-sm font-medium focus:outline-none transition-all text-slate-900 ${errors.password ? 'border-red-600 bg-red-600/5' : 'border-black/10 focus:border-red-600'}`}
                      />
                      {errors.password && (
                        <p className="text-[10px] text-red-600 font-bold mt-2 ml-1 uppercase tracking-wider">{errors.password}</p>
                      )}
                    </div>
                  )}

                  {currentMethod.hasWhatsapp && (
                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-[0.2em] mb-3 ml-1 transition-colors ${errors.whatsapp ? 'text-red-600' : 'text-slate-400'}`}>WhatsApp No</label>
                      <input 
                        type="tel" 
                        placeholder="01XXXXXXXXX"
                        value={whatsapp}
                        onChange={(e) => handleInputChange('whatsapp', e.target.value, setWhatsapp)}
                        className={`w-full bg-slate-50 border rounded-2xl py-4 px-5 text-sm font-medium focus:outline-none transition-all text-slate-900 ${errors.whatsapp ? 'border-red-600 bg-red-600/5' : 'border-black/10 focus:border-red-600'}`}
                      />
                      {errors.whatsapp && (
                        <p className="text-[10px] text-red-600 font-bold mt-2 ml-1 uppercase tracking-wider">{errors.whatsapp}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Step 2: Select Package */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 sm:p-8 rounded-lg border-2 border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)]">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 bg-red-600 text-white rounded-xl flex items-center justify-center font-display font-bold text-lg shadow-lg shadow-red-600/20">2</div>
                <h2 className="text-xl font-bold text-slate-900">Select Package</h2>
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
                    className={`p-5 rounded-2xl border transition-all text-left ${selectedPackage?.id === pkg.id ? 'bg-red-600/10 border-red-600' : 'bg-slate-50 border-black/5 hover:border-black/10'}`}
                  >
                    <div className="text-xl font-display font-bold mb-1 text-slate-900">{pkg.amount}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">{pkg.unit}</div>
                    <div className="text-sm font-bold text-red-600">৳{pkg.price.toFixed(0)}</div>
                  </button>
                ))}
              </div>
              {errors.package && (
                <p className="text-[10px] text-red-600 font-bold mt-4 text-center uppercase tracking-widest">{errors.package}</p>
              )}
            </motion.div>

            {/* Checkout Area */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 sm:p-8 rounded-lg border-2 border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)]">
              <AnimatePresence mode="wait">
                {showSuccess ? (
                  <motion.div 
                    key="success-message"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center text-center py-10"
                  >
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 border border-green-500/30">
                      <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-display font-bold mb-2 text-slate-900">Order Successful</h3>
                    <p className="text-slate-500 text-sm mb-8 px-6 font-medium leading-relaxed">
                      We have received your payment intel. Deployment usually starts within 5-30 minutes. You can track this in your profile history.
                    </p>
                    <button onClick={onBack} className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-green-600/20 uppercase tracking-widest text-xs">Return to Arena</button>
                  </motion.div>
                ) : !showPayment ? (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button onClick={handleAddToCart} className="flex-1 py-4 bg-slate-50 border border-black/10 rounded-2xl font-bold hover:bg-slate-100 text-slate-900 transition-all uppercase tracking-widest text-xs">Add to Cart</button>
                    <button onClick={handleBuyNow} className="flex-1 py-4 bg-red-600 rounded-2xl font-bold hover:bg-red-700 text-white shadow-xl shadow-red-600/20 transition-all uppercase tracking-widest text-xs">Buy Now</button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="text-center space-y-4">
                      <button 
                        onClick={() => setShowPayment(false)}
                        className="text-xs font-bold text-red-600 uppercase tracking-widest flex items-center gap-2 hover:text-red-700 transition-colors mb-4"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                        Change Details
                      </button>
                      
                      <div className="grid grid-cols-3 gap-3">
                        {(['bKash', 'Nagad', 'Rocket'] as const).map((method) => (
                          <button
                            key={method}
                            onClick={() => setPaymentMethod(method)}
                            className={`p-3 rounded-xl border transition-all text-xs font-bold ${
                              paymentMethod === method 
                                ? 'bg-red-600 border-red-600 text-white' 
                                : 'bg-slate-50 border-black/10 text-slate-500 hover:border-black/20'
                            }`}
                          >
                            {method}
                          </button>
                        ))}
                      </div>

                      {paymentMethod && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="glass p-6 rounded-2xl border border-black/10 space-y-4 text-left"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">Send Money to:</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono text-slate-900 font-bold">{paymentNumbers[paymentMethod]}</span>
                              <button 
                                onClick={() => copyToClipboard(paymentNumbers[paymentMethod])}
                                className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-red-600"
                                title="Copy Number"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block">Transaction ID</label>
                            <input
                              type="text"
                              value={transactionId}
                              onChange={(e) => setTransactionId(e.target.value)}
                              placeholder="Enter TrxID after payment"
                              className="w-full bg-slate-50 border border-black/10 rounded-xl py-4 px-5 text-sm focus:outline-none focus:border-red-600 transition-all text-slate-900 font-mono"
                            />
                          </div>
                        </motion.div>
                      )}

                      <div className="glass p-6 rounded-2xl border border-black/5 text-center space-y-2">
                        <h3 className="text-lg font-bold text-slate-900">Manual Verification</h3>
                        <p className="text-slate-500 text-xs leading-relaxed">
                          Please send ৳{selectedPackage?.price} to the number above and provide the Transaction ID.
                        </p>
                      </div>
                    </div>

                    <button disabled={isProcessingOrder} onClick={handleSubmitOrder} className="w-full py-5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-red-600/20 flex items-center justify-center gap-3 uppercase tracking-widest text-xs">
                      {isProcessingOrder ? (
                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <>
                          <span>Submit Order</span>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameDetail;
