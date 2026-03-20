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
  const [paymentStep, setPaymentStep] = useState<'NONE' | 'SELECT' | 'DETAILS'>('NONE');
  const [selectedPaymentType, setSelectedPaymentType] = useState<'BDT' | 'USDT' | null>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotError, setScreenshotError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const { addToCart, isAuthenticated, addOrder, user, bdtRate } = useStore();

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size too large. Max 5MB.");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshot(reader.result as string);
      setScreenshotError(false);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
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
    
    setPaymentStep('SELECT');
  };

  const handleSubmitOrder = async (type?: 'BDT' | 'USDT') => {
    const paymentType = type || selectedPaymentType;
    if (!paymentType) return;

    try {
      if (!user) {
        alert("Please login to place an order.");
        return;
      }
      if (!validateInputs()) return;
      
      if (paymentType === 'USDT' && !screenshot) {
        setScreenshotError(true);
        return;
      }
      
      setIsProcessingOrder(true);
      
      const item = getCartItem();
      const orderId = 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      
      // Calculate amount based on payment type
      const finalAmount = paymentType === 'USDT' ? (item.price / bdtRate) : item.price;
      
      const orderData = {
        id: orderId,
        userId: user.id,
        customerName: user.name,
        items: [item],
        totalAmount: finalAmount,
        status: 'PENDING' as const,
        createdAt: new Date().toISOString(),
        transactionId: paymentType === 'BDT' ? 'PENDING_ZINIPAY' : 'PENDING_USDT',
        paymentMethod: paymentType === 'BDT' ? 'ZiniPay' : 'USDT (Binance)',
        screenshot: screenshot || undefined
      };

      console.log(`HGP DEBUG: Submitting ${paymentType} order from GameDetail:`, orderId);

      if (paymentType === 'BDT') {
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
        
        if (!response.ok) {
          const text = await response.text();
          console.error("HGP Server Error Response:", text);
          throw new Error(`Server returned ${response.status}: ${text.slice(0, 100)}...`);
        }
        
        const data = await response.json();
        
        if (data.status && data.payment_url) {
          // Use the invoiceId from ZiniPay if available, otherwise fallback to orderId
          (orderData as any).transactionId = data.invoiceId || data.payment_id || orderId;
          
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
      } else {
        // USDT Flow
        const success = await addOrder(orderData);
        if (success) {
          setShowSuccess(true);
        } else {
          alert("Failed to save order. Please try again.");
        }
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
                    {bdtRate > 0 && (
                      <div className="text-[10px] font-bold text-slate-500 mt-1">
                        ${(pkg.price / bdtRate).toFixed(2)} USDT
                      </div>
                    )}
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
                <AnimatePresence mode="wait">
                  {showSuccess ? (
                    <motion.div 
                      key="success-message"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
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
                  ) : paymentStep === 'SELECT' ? (
                    <motion.div 
                      key="payment-selection"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-display font-bold text-slate-900 uppercase tracking-widest">Select Payment Method</h3>
                        <button onClick={() => setPaymentStep('NONE')} className="text-[10px] font-bold text-red-600 uppercase tracking-widest hover:underline">Cancel</button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSelectedPaymentType('BDT');
                            handleSubmitOrder('BDT');
                          }}
                          className="p-6 bg-white border border-black/5 rounded-2xl flex flex-col items-center gap-3 hover:border-red-600/30 transition-all group shadow-sm"
                        >
                          <div className="w-12 h-12 bg-red-600/10 rounded-xl flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-slate-900">BDT Payment</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ZiniPay Method</div>
                          </div>
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSelectedPaymentType('USDT');
                            setPaymentStep('DETAILS');
                          }}
                          className="p-6 bg-white border border-black/5 rounded-2xl flex flex-col items-center gap-3 hover:border-red-600/30 transition-all group shadow-sm"
                        >
                          <div className="w-12 h-12 bg-red-600/10 rounded-xl flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-slate-900">USDT Payment</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Binance Details</div>
                          </div>
                        </motion.button>
                      </div>
                    </motion.div>
                  ) : paymentStep === 'DETAILS' ? (
                    <motion.div 
                      key="payment-details"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-display font-bold text-slate-900 uppercase tracking-widest">Binance Payment Details</h3>
                        <button onClick={() => setPaymentStep('SELECT')} className="text-[10px] font-bold text-red-600 uppercase tracking-widest hover:underline">Back</button>
                      </div>
                      <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm space-y-4">
                        <div className="flex items-center justify-between p-4 bg-[#FAF9F6] rounded-xl border border-black/5">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Binance ID</p>
                            <p className="font-mono font-bold text-slate-900">1056966023</p>
                          </div>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText('1056966023');
                              alert('Binance ID copied!');
                            }}
                            className="p-2 bg-red-600/10 text-red-600 rounded-lg hover:bg-red-600/20 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Please send the exact USDT amount to the Binance ID above. After payment, click "Confirm Order" to submit your request.
                        </p>

                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Payment Screenshot (Required)</label>
                          <div className="relative">
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={handleFileChange}
                              className="hidden"
                              id="screenshot-upload"
                            />
                            <label 
                              htmlFor="screenshot-upload"
                              className="w-full flex items-center justify-center gap-3 p-4 bg-[#FAF9F6] border border-dashed border-black/20 rounded-xl cursor-pointer hover:border-red-600/50 transition-all group"
                            >
                              {screenshot ? (
                                <div className="flex items-center gap-2 text-green-600 font-bold text-xs">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Screenshot Attached
                                </div>
                              ) : isUploading ? (
                                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <svg className="w-5 h-5 text-slate-400 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span className="text-xs font-bold text-slate-500 group-hover:text-red-600 transition-colors">Upload Proof</span>
                                </>
                              )}
                            </label>
                            {screenshot && (
                              <button 
                                onClick={() => setScreenshot(null)}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-700 transition-all"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                          {screenshotError && (
                            <motion.p 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-red-600 text-[10px] font-bold uppercase tracking-widest mt-2 flex items-center gap-2"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              Please upload proof of payment to continue
                            </motion.p>
                          )}
                        </div>

                        <button 
                          onClick={() => handleSubmitOrder('USDT')}
                          disabled={isProcessingOrder}
                          className="w-full py-4 bg-red-600 text-white font-bold rounded-xl uppercase tracking-widest text-[10px] shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                        >
                          {isProcessingOrder ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            "Confirm Order"
                          )}
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="initial-buttons"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col sm:flex-row gap-4"
                    >
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameDetail;
