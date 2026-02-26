
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { sendOrderNotification } from '../services/mailService';
import { sendTelegramNotification } from '../services/telegramService';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const MERCHANT_NUMBER = "+8801878666388";

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { cart, removeFromCart, addOrder, user, clearCart } = useStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [copied, setCopied] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const total = cart.reduce((acc, item) => acc + item.price, 0);

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(MERCHANT_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCheckout = async () => {
    if (!paymentMethod || !transactionId) {
      alert("Please complete the payment details.");
      return;
    }

    setIsProcessing(true);
    
    const orderData = {
      id: 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      userId: user?.id || 'guest',
      items: [...cart],
      totalAmount: total,
      status: 'PENDING' as const,
      createdAt: new Date().toISOString()
    };

    const success = await addOrder(orderData);
    
    if (success) {
      // Send email notification in background
      if (user?.email) {
        sendOrderNotification(orderData, user.email, user.name || 'Valued Customer')
          .then(sent => console.log(sent ? "Order email dispatched" : "Order email failed"));
      }

      // Send telegram notification to admin
      sendTelegramNotification(orderData)
        .then(sent => console.log(sent ? "Telegram notification dispatched" : "Telegram notification failed"));
      
      setShowSuccess(true);
      clearCart();
      setShowPayment(false);
    }
    
    setIsProcessing(false);
  };

  const resetDrawer = () => {
    setShowPayment(false);
    setPaymentMethod(null);
    setTransactionId('');
    setShowSuccess(false);
    onClose();
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
            className="fixed top-0 right-0 h-full w-full max-w-md glass-dark border-l border-white/10 z-[70] shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-red-950/20">
              <h2 className="text-2xl font-display font-bold flex items-center gap-3 text-white">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {showSuccess ? 'Success' : showPayment ? 'Secure Payment' : 'My Cart'}
              </h2>
              <button onClick={resetDrawer} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white">
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
                      <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-display font-bold mb-2 text-white">Order Received</h3>
                    <p className="text-white/40 text-sm mb-8 px-6 font-medium leading-relaxed">
                      We have received your payment intel. Deployment usually starts within 5-30 minutes. You can track this in your profile history.
                    </p>
                    <button onClick={resetDrawer} className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-green-600/20 uppercase tracking-widest text-xs">Understood</button>
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
                        <div className="w-20 h-20 border-2 border-dashed border-white/20 rounded-full flex items-center justify-center mb-4 text-white">
                          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="text-white">Your cart is empty.</p>
                        <button onClick={onClose} className="mt-4 text-red-500 font-bold hover:underline">Browse Games</button>
                      </div>
                    ) : (
                      cart.map((item) => (
                        <motion.div 
                          layout
                          key={item.cartId}
                          className="glass p-4 rounded-2xl flex items-center gap-4 relative overflow-hidden group border border-white/5"
                        >
                          <img src={item.image} className="w-16 h-16 rounded-xl object-cover" alt={item.gameTitle} />
                          <div className="flex-1">
                            <h4 className="font-bold text-sm leading-tight text-white">{item.gameTitle}</h4>
                            <p className="text-xs text-white/60 mb-1">{item.packageName}</p>
                            <p className="text-[10px] font-mono text-red-400 truncate max-w-[150px]">ID: {item.playerId}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm mb-2 text-white">৳{item.price.toFixed(0)}</p>
                            <button 
                              onClick={() => removeFromCart(item.cartId)}
                              className="text-white/20 hover:text-red-500 transition-colors"
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
                      className="text-xs font-bold text-red-500 uppercase tracking-widest flex items-center gap-2 hover:text-red-400 transition-colors mb-4"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                      </svg>
                      Back to Cart
                    </button>

                    <div className="space-y-4">
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Select Gateway</p>
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => setPaymentMethod('bkash')}
                          className={`p-4 rounded-2xl border transition-all font-bold ${paymentMethod === 'bkash' ? 'bg-pink-600/20 border-pink-600 text-pink-500 shadow-lg shadow-pink-600/10' : 'bg-white/5 border-white/5 hover:border-white/10 text-white/60'}`}
                        >
                          bKash
                        </button>
                        <button 
                          onClick={() => setPaymentMethod('nagad')}
                          className={`p-4 rounded-2xl border transition-all font-bold ${paymentMethod === 'nagad' ? 'bg-orange-600/20 border-orange-600 text-orange-500 shadow-lg shadow-orange-600/10' : 'bg-white/5 border-white/5 hover:border-white/10 text-white/60'}`}
                        >
                          Nagad
                        </button>
                      </div>
                    </div>

                    <div className="glass p-5 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Merchant Number (Send Money)</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-display font-bold text-white tracking-widest">{MERCHANT_NUMBER}</span>
                        <button 
                          onClick={handleCopyNumber}
                          className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all uppercase tracking-widest ${copied ? 'bg-green-600/20 text-green-500' : 'bg-red-600/20 text-red-500 hover:bg-red-600/30'}`}
                        >
                          {copied ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Transaction ID</label>
                      <input 
                        type="text" 
                        placeholder="Enter the transaction code..."
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-sm font-medium focus:outline-none focus:border-red-600 focus:bg-white/[0.08] transition-all placeholder:text-white/20 text-white"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {cart.length > 0 && !showSuccess && (
              <div className="p-6 bg-red-950/20 border-t border-white/5 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/60">Cart Value ({cart.length} items)</span>
                  <span className="font-bold text-white">৳{total.toFixed(0)}</span>
                </div>
                <div className="flex justify-between items-center text-lg">
                  <span className="font-display font-bold text-white">Payable Total</span>
                  <span className="font-display font-bold text-red-500 shadow-sm shadow-red-500/20">৳{total.toFixed(0)}</span>
                </div>
                
                {!showPayment ? (
                  <button 
                    onClick={() => setShowPayment(true)}
                    className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-xl shadow-red-600/20 transition-all flex items-center justify-center space-x-2"
                  >
                    <span>Secure Checkout</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                ) : (
                  <button 
                    disabled={isProcessing || !paymentMethod || !transactionId}
                    onClick={handleCheckout}
                    className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center space-x-2 ${isProcessing || !paymentMethod || !transactionId ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5' : 'bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-600/20'}`}
                  >
                    {isProcessing ? (
                      <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <>
                        <span>Submit Operation</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </>
                    )}
                  </button>
                )}

                <div className="flex justify-center items-center gap-2 text-[9px] text-white/30 uppercase tracking-widest font-bold">
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
