
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { cart, removeFromCart, addOrder, user, clearCart, bdtRate } = useStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'ZiniPay' | 'bKash' | 'Nagad' | 'Binance' | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  
  const total = cart.reduce((acc, item) => acc + item.price, 0);
  const totalUsd = bdtRate > 0 ? total / bdtRate : 0;

  const handleCheckout = async () => {
    try {
      if (!user) {
        alert("Please login to place an order.");
        return;
      }
      if (!paymentMethod) {
        alert("Please select a payment method.");
        return;
      }
      if (paymentMethod !== 'ZiniPay' && !transactionId) {
        alert("Please enter Transaction ID.");
        return;
      }

      setIsProcessing(true);
      const orderId = 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      
      const orderData = {
        id: orderId,
        userId: user.id,
        customerName: user.name,
        items: [...cart],
        totalAmount: total,
        status: 'PENDING' as const,
        createdAt: new Date().toISOString(),
        transactionId: paymentMethod === 'ZiniPay' ? 'PENDING_ZINIPAY' : transactionId,
        paymentMethod: paymentMethod
      };

      console.log("HGP DEBUG: Initiating checkout for order:", orderId);
      
      if (paymentMethod === 'ZiniPay') {
        const redirectUrl = `${window.location.origin}/payment/success?orderId=${orderId}`;
        const cancelUrl = `${window.location.origin}/payment/cancel?orderId=${orderId}`;
        
        const response = await fetch('/api/payment/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: total,
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
          // Use the invoiceId from ZiniPay if available, otherwise fallback to orderId
          (orderData as any).transactionId = data.invoiceId || data.payment_id || orderId;
          
          // Save order to DB before redirecting
          const success = await addOrder(orderData);
          if (!success) {
            alert("Failed to save order. Please try again.");
            setIsProcessing(false);
            return;
          }
          sessionStorage.setItem('hgp_return_state', JSON.stringify({
            isCartOpen: true
          }));
          window.location.href = data.payment_url;
          return;
        } else {
          console.error("ZiniPay Error Data:", data);
          alert("Failed to initialize payment gateway: " + (data.error || data.message || JSON.stringify(data)));
          setIsProcessing(false);
          return;
        }
      }

      const success = await addOrder(orderData);
      
      if (success) {
        setShowSuccess(true);
        clearCart();
      } else {
        alert("Failed to place order. Please check your connection and try again.");
      }
    } catch (error: any) {
      console.error("HGP Checkout Error:", error);
      alert("Checkout Error: " + (error.message || "Unknown error occurred"));
    } finally {
      if (paymentMethod !== 'ZiniPay') {
        setIsProcessing(false);
      }
    }
  };

  const resetDrawer = () => {
    setShowPayment(false);
    setShowSuccess(false);
    setPaymentMethod(null);
    setTransactionId('');
    onClose();
  };

  const paymentNumbers = {
    bKash: "+8801878666388",
    Nagad: "+8801878666388",
    Binance: "1056966023"
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={resetDrawer}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-[#FAF9F6] border-l border-black/10 z-[70] shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-black/5 flex justify-between items-center bg-red-600/5">
              <h2 className="text-2xl font-display font-bold flex items-center gap-3 text-slate-900">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {showSuccess ? 'Success' : showPayment ? 'Secure Payment' : 'My Cart'}
              </h2>
              <button onClick={resetDrawer} className="p-2 hover:bg-black/5 rounded-full transition-colors text-slate-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <AnimatePresence mode="wait">
                {showSuccess ? (
                  <motion.div 
                    key="success-message"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="h-full flex flex-col items-center justify-center text-center py-10"
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
                    <button onClick={resetDrawer} className="w-full py-4 bg-green-600 hover:bg-green-700 text-[#FAF9F6] font-bold rounded-2xl transition-all shadow-xl shadow-green-600/20 uppercase tracking-widest text-xs">Understood</button>
                  </motion.div>
                ) : !showPayment ? (
                  <motion.div 
                    key="cart-list"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    {cart.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
                        <div className="w-20 h-20 border-2 border-dashed border-black/20 rounded-full flex items-center justify-center mb-4 text-slate-900">
                          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="text-slate-900">Your cart is empty.</p>
                        <button onClick={onClose} className="mt-4 text-red-600 font-bold hover:underline">Browse Games</button>
                      </div>
                    ) : (
                      cart.map((item) => (
                        <motion.div 
                          layout
                          key={item.cartId}
                          className="bg-white p-4 rounded-2xl flex items-center gap-4 relative overflow-hidden group border border-black/5 shadow-sm"
                        >
                          <img src={item.image} className="w-16 h-16 rounded-xl object-cover" alt={item.gameTitle} referrerPolicy="no-referrer" />
                          <div className="flex-1">
                            <h4 className="font-bold text-sm leading-tight text-slate-900">{item.gameTitle}</h4>
                            <p className="text-xs text-slate-500 mb-1">{item.packageName}</p>
                            <p className="text-[10px] font-mono text-red-600 truncate max-w-[150px]">ID: {item.playerId}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm mb-1 text-slate-900">৳{item.price.toFixed(0)}</p>
                            {bdtRate > 0 && (
                              <p className="text-[9px] font-bold text-slate-400 mb-2">
                                ${(item.price / bdtRate).toFixed(2)} USDT
                              </p>
                            )}
                            <button 
                              onClick={() => removeFromCart(item.cartId)}
                              className="text-slate-300 hover:text-red-600 transition-colors"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="payment-step"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    <button 
                      onClick={() => setShowPayment(false)}
                      className="text-xs font-bold text-red-600 uppercase tracking-widest flex items-center gap-2 hover:text-red-700 transition-colors mb-4"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                      </svg>
                      Back to Cart
                    </button>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        {(['ZiniPay', 'bKash', 'Nagad', 'Binance'] as const).map((method) => (
                          <button
                            key={method}
                            onClick={() => setPaymentMethod(method)}
                            className={`p-3 rounded-xl border transition-all text-xs font-bold ${
                              paymentMethod === method 
                                ? 'bg-red-600 border-red-600 text-[#FAF9F6]' 
                                : 'bg-[#FAF9F6] border-black/10 text-slate-500 hover:border-black/20'
                            }`}
                          >
                            {method === 'ZiniPay' ? 'Bkash/Nagad (Auto)' : method}
                          </button>
                        ))}
                      </div>

                      {paymentMethod && paymentMethod !== 'ZiniPay' && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white p-4 rounded-2xl border border-black/10 space-y-3 shadow-sm"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">{paymentMethod === 'Binance' ? 'Binance ID:' : 'Send Money to:'}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono text-slate-900 font-bold">{paymentNumbers[paymentMethod]}</span>
                              <button 
                                onClick={() => copyToClipboard(paymentNumbers[paymentMethod])}
                                className={`p-1.5 rounded-lg transition-colors ${isCopied ? 'bg-green-500/10 text-green-600' : 'bg-[#FAF9F6] hover:bg-[#F0F0F0] text-red-600'}`}
                                title="Copy Number"
                              >
                                {isCopied ? (
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                  </svg>
                                )}
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
                              className="w-full bg-[#FAF9F6] border border-black/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-red-600 transition-all text-slate-900 font-mono"
                            />
                          </div>
                        </motion.div>
                      )}

                      <div className="bg-white p-4 rounded-2xl border border-black/5 text-center space-y-2 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-900">Manual Payment</h3>
                        <p className="text-slate-500 text-[10px] leading-relaxed">
                          Please send the total amount to the number above and provide the Transaction ID. Our team will verify and process your order manually.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

             {cart.length > 0 && !showSuccess && (
              <div className="p-6 bg-red-600/5 border-t border-black/5 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Cart Value ({cart.length} items)</span>
                  <span className="font-bold text-slate-900">৳{total.toFixed(0)}</span>
                </div>
                <div className="flex justify-between items-center text-lg">
                  <span className="font-display font-bold text-slate-900">Payable Total</span>
                  <div className="text-right">
                    <span className="font-display font-bold text-red-600 shadow-sm shadow-red-600/20 block">৳{total.toFixed(0)}</span>
                    {bdtRate > 0 && (
                      <span className="text-[10px] text-slate-400 font-mono">≈ ${totalUsd.toFixed(2)} USDT</span>
                    )}
                  </div>
                </div>
                
                {!showPayment ? (
                  <button 
                    onClick={() => setShowPayment(true)}
                    className="w-full py-4 bg-red-600 hover:bg-red-700 text-[#FAF9F6] font-bold rounded-2xl shadow-xl shadow-red-600/20 transition-all flex items-center justify-center space-x-2"
                  >
                    <span>Secure Checkout</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                ) : (
                  <button 
                    disabled={isProcessing}
                    onClick={handleCheckout}
                    className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center space-x-2 ${isProcessing ? 'bg-[#F0F0F0] text-slate-400 cursor-not-allowed border border-black/5' : 'bg-red-600 hover:bg-red-700 text-[#FAF9F6] shadow-xl shadow-red-600/20'}`}
                  >
                    {isProcessing ? (
                      <svg className="animate-spin h-5 w-5 text-slate-400" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <>
                        <span>Pay Now</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </>
                    )}
                  </button>
                )}

                <div className="flex justify-center items-center gap-2 text-[9px] text-slate-400 uppercase tracking-widest font-bold">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                  Encrypted Protocol Active
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
