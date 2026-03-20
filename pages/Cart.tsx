import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { cart, removeFromCart, addOrder, user, bdtRate } = useStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const total = cart.reduce((acc, item) => acc + item.price, 0);

  const handleCheckout = async () => {
    try {
      if (!user) {
        alert("Please login to place an order.");
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
        transactionId: 'PENDING_ZINIPAY',
        paymentMethod: 'ZiniPay'
      };

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
        orderData.transactionId = data.invoiceId || data.payment_id || orderId;
        
        const success = await addOrder(orderData);
        if (!success) {
          alert("Failed to save order. Please try again.");
          setIsProcessing(false);
          return;
        }
        window.location.href = data.payment_url;
        return;
      } else {
        alert("Failed to initialize payment gateway: " + (data.error || data.message || JSON.stringify(data)));
        setIsProcessing(false);
        return;
      }
    } catch (error: any) {
      alert("Checkout Error: " + (error.message || "Unknown error occurred"));
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-4xl font-display font-bold text-slate-900">My Cart</h1>
          <button 
            onClick={() => {
              navigate('/');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-sm font-bold text-red-600 uppercase tracking-widest flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Shop
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-6">
            {showSuccess ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-10 rounded-[2.5rem] border border-black/5 shadow-xl text-center"
              >
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-display font-bold mb-2 text-slate-900">Order Successful</h3>
                <p className="text-slate-500 text-sm mb-8 px-6 font-medium leading-relaxed">
                  We have received your payment intel. Deployment usually starts within 5-30 minutes. You can track this in your profile history.
                </p>
                <button onClick={() => {
                  navigate('/profile');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }} className="w-full py-4 bg-green-600 hover:bg-green-700 text-[#FAF9F6] font-bold rounded-2xl transition-all shadow-xl shadow-green-600/20 uppercase tracking-widest text-xs">View Order History</button>
              </motion.div>
            ) : cart.length === 0 ? (
              <div className="bg-white p-20 rounded-[2.5rem] border border-black/5 shadow-sm text-center">
                <div className="w-20 h-20 border-2 border-dashed border-black/20 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-900">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-slate-900 font-bold mb-4">Your cart is empty.</p>
                <button onClick={() => {
                  navigate('/');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }} className="text-red-600 font-bold hover:underline">Browse Games</button>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <motion.div 
                    layout
                    key={item.cartId}
                    className="bg-white p-6 rounded-[2rem] flex items-center gap-6 border border-black/5 shadow-sm group"
                  >
                    <img src={item.image} className="w-20 h-20 rounded-2xl object-cover" alt={item.gameTitle} referrerPolicy="no-referrer" />
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-slate-900">{item.gameTitle}</h4>
                      <p className="text-sm text-slate-500 mb-1">{item.packageName}</p>
                      <p className="text-xs font-mono text-red-600">ID: {item.playerId}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg mb-1 text-slate-900">৳{item.price.toFixed(0)}</p>
                      {bdtRate > 0 && (
                        <p className="text-[10px] font-bold text-slate-400 mb-2">
                          ${(item.price / bdtRate).toFixed(2)} USDT
                        </p>
                      )}
                      <button 
                        onClick={() => removeFromCart(item.cartId)}
                        className="text-slate-300 hover:text-red-600 transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-xl sticky top-24">
              <h3 className="text-xl font-display font-bold mb-6 text-slate-900">Order Summary</h3>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-bold text-slate-900">৳{total.toFixed(0)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Processing Fee</span>
                  <span className="font-bold text-green-600">FREE</span>
                </div>
                <div className="pt-4 border-t border-black/5 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900">Total</span>
                    {bdtRate > 0 && (
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        ${(total / bdtRate).toFixed(2)} USDT
                      </span>
                    )}
                  </div>
                  <span className="text-2xl font-display font-bold text-red-600">৳{total.toFixed(0)}</span>
                </div>
              </div>

              <button 
                disabled={cart.length === 0 || isProcessing}
                onClick={handleCheckout}
                className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-slate-200 text-[#FAF9F6] font-bold rounded-2xl shadow-xl shadow-red-600/20 transition-all flex items-center justify-center space-x-2"
              >
                <span>{isProcessing ? 'Processing...' : 'Secure Checkout'}</span>
                {!isProcessing && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
