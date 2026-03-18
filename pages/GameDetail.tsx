import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Game, GamePackage, CartItem } from '../types';
import { useStore } from '../store/useStore';
import { LOGIN_METHODS } from '../constants';

interface GameDetailProps {
  game: Game;
  onBack: () => void;
  onOpenAuth: () => void;
}

const GameDetail: React.FC<GameDetailProps> = ({ game, onBack, onOpenAuth }) => {
  const availableLoginMethods = game.loginMethods && game.loginMethods.length > 0 
    ? LOGIN_METHODS.filter(m => game.loginMethods?.includes(m.id))
    : LOGIN_METHODS;

  const [selectedPackage, setSelectedPackage] = useState<GamePackage | null>(null);
  const [loginMethod, setLoginMethod] = useState(availableLoginMethods[0]?.id || LOGIN_METHODS[0].id);
  const [accountIdentifier, setAccountIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  
  // Validation State
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const currentMethod = availableLoginMethods.find(m => m.id === loginMethod) || availableLoginMethods[0] || LOGIN_METHODS[0];
  
  const [isAdded, setIsAdded] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const { addToCart, isAuthenticated, addOrder, user } = useStore();

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

  const isVerificationComplete = useMemo(() => {
    if (!accountIdentifier.trim()) return false;
    if (currentMethod.hasPassword && !password.trim()) return false;
    if (currentMethod.hasWhatsapp && !whatsapp.trim()) return false;
    return true;
  }, [accountIdentifier, password, whatsapp, currentMethod]);

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
    
    setIsAddingToCart(true);
    
    // Simulate a small delay for the animation
    setTimeout(() => {
      addToCart(getCartItem());
      setIsAddingToCart(false);
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
    }, 600);
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      onOpenAuth();
      return;
    }
    if (!validateInputs()) return;
    
    await handleSubmitOrder();
  };

  const handleSubmitOrder = async () => {
    try {
      if (!user) {
        alert("Please login to place an order.");
        return;
      }
      if (!validateInputs()) return;
      
      setIsProcessingOrder(true);
      
      const item = getCartItem();
      const orderId = 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      
      const orderData = {
        id: orderId,
        userId: user.id,
        customerName: user.name,
        items: [item],
        totalAmount: item.price,
        status: 'PENDING' as const,
        createdAt: new Date().toISOString(),
        transactionId: 'PENDING_ZINIPAY',
        paymentMethod: 'ZiniPay'
      };

      console.log("HGP DEBUG: Submitting order from GameDetail:", orderId);

      const redirectUrl = `${window.location.origin}/payment/success?orderId=${orderId}`;
      const cancelUrl = `${window.location.origin}/payment/cancel?orderId=${orderId}`;
      
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: item.price,
          redirect_url: redirectUrl,
          cancel_url: cancelUrl,
          webhook_url: `${window.location.origin}/api/payment/webhook`,
          cus_email: user.email || 'guest@example.com',
          cus_name: user.name || 'Guest',
          metadata: { orderId }
        })
      });
      
      const data = await response.json();
      
      if (data.status && data.payment_url) {
        const success = await addOrder(orderData);
        if (!success) {
          alert("Failed to save order. Please try again.");
          setIsProcessingOrder(false);
          return;
        }
        sessionStorage.setItem('hgp_return_state', JSON.stringify({
          selectedGame: game
        }));
        window.location.href = data.payment_url;
        return;
      } else {
        console.error("ZiniPay Error Data:", data);
        alert("Failed to initialize payment gateway: " + (data.error || data.message || JSON.stringify(data)));
        setIsProcessingOrder(false);
        return;
      }
    } catch (error: any) {
      console.error("HGP Order Submission Error:", error);
      alert("Order Error: " + (error.message || "Unknown error occurred"));
    } finally {
      setIsProcessingOrder(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-32 md:pb-20 bg-[#FAF9F6]">
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
              className="bg-[#FAF9F6] rounded-lg overflow-hidden border-2 border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)] sticky top-32"
            >
              <div className="relative aspect-[4/5]">
                <img src={game.image} className="w-full h-full object-cover" alt={game.title} referrerPolicy="no-referrer" />
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
            {/* Step 1: Select Package */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#FAF9F6] p-6 sm:p-8 rounded-lg border-2 border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)]">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 bg-red-600 text-[#FAF9F6] rounded-xl flex items-center justify-center font-display font-bold text-lg shadow-lg shadow-red-600/20">1</div>
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
                      // Automatically scroll to verification area
                      const verificationArea = document.getElementById('verification-area');
                      if (verificationArea) {
                        verificationArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    className={`p-5 rounded-2xl border transition-all text-left ${selectedPackage?.id === pkg.id ? 'bg-red-600/10 border-red-600' : 'bg-[#FAF9F6] border-black/5 hover:border-black/10'}`}
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

            {/* Step 2: Verification Intel (Only visible if package selected) */}
            <AnimatePresence>
              {selectedPackage && (
                <motion.div 
                  id="verification-area"
                  initial={{ opacity: 0, y: 20, height: 0 }} 
                  animate={{ opacity: 1, y: 0, height: 'auto' }} 
                  exit={{ opacity: 0, y: 20, height: 0 }}
                  className="bg-[#FAF9F6] p-6 sm:p-8 rounded-lg border-2 border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)] overflow-hidden"
                >
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-10 h-10 bg-red-600 text-[#FAF9F6] rounded-xl flex items-center justify-center font-display font-bold text-lg shadow-lg shadow-red-600/20">2</div>
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
                        className="w-full bg-[#FAF9F6] border border-black/10 rounded-2xl py-4 px-5 text-sm font-bold focus:outline-none focus:border-red-600 transition-all text-slate-900 cursor-pointer"
                      >
                        {availableLoginMethods.map((method) => (
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
                          className={`w-full bg-[#FAF9F6] border rounded-2xl py-4 px-5 text-sm font-medium focus:outline-none transition-all text-slate-900 ${errors.identifier ? 'border-red-600 bg-red-600/5' : 'border-black/10 focus:border-red-600'}`}
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
                            className={`w-full bg-[#FAF9F6] border rounded-2xl py-4 px-5 text-sm font-medium focus:outline-none transition-all text-slate-900 ${errors.password ? 'border-red-600 bg-red-600/5' : 'border-black/10 focus:border-red-600'}`}
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
                            className={`w-full bg-[#FAF9F6] border rounded-2xl py-4 px-5 text-sm font-medium focus:outline-none transition-all text-slate-900 ${errors.whatsapp ? 'border-red-600 bg-red-600/5' : 'border-black/10 focus:border-[#25D366]'}`}
                          />
                          {errors.whatsapp && (
                            <p className="text-[10px] text-red-600 font-bold mt-2 ml-1 uppercase tracking-wider">{errors.whatsapp}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Checkout Area */}
            {selectedPackage && isVerificationComplete && (
              <motion.div 
                id="checkout-area"
                initial={{ opacity: 0, y: 20, height: 0 }} 
                animate={{ opacity: 1, y: 0, height: 'auto' }} 
                exit={{ opacity: 0, y: 20, height: 0 }}
                className="bg-[#FAF9F6] p-6 sm:p-8 rounded-lg border-2 border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)] overflow-hidden"
              >
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
                    <button onClick={onBack} className="w-full py-4 bg-green-600 hover:bg-green-700 text-[#FAF9F6] font-bold rounded-2xl transition-all shadow-xl shadow-green-600/20 uppercase tracking-widest text-xs">Return to Arena</button>
                  </motion.div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAddToCart} 
                      disabled={isAddingToCart || isProcessingOrder}
                      className="flex-1 py-4 bg-[#FAF9F6] border border-black/10 rounded-2xl font-bold hover:bg-[#F0F0F0] text-slate-900 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                    >
                      {isAddingToCart ? (
                        <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                      ) : isAdded ? (
                        "Added!"
                      ) : (
                        "Add to Cart"
                      )}
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleBuyNow} 
                      disabled={isAddingToCart || isProcessingOrder}
                      className="flex-1 py-4 bg-red-600 rounded-2xl font-bold hover:bg-red-700 text-[#FAF9F6] shadow-xl shadow-red-600/20 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                    >
                      {isProcessingOrder ? (
                        <div className="w-4 h-4 border-2 border-[#FAF9F6] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        "Buy Now"
                      )}
                    </motion.button>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameDetail;
