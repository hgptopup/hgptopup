
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

const Payment: React.FC = () => {
  const navigate = useNavigate();
  const { bdtRate } = useStore();
  const [copiedMethod, setCopiedMethod] = useState<string | null>(null);

  const handleCopy = (method: string, number: string) => {
    navigator.clipboard.writeText(number);
    setCopiedMethod(method);
    setTimeout(() => setCopiedMethod(null), 2000);
  };

  const paymentMethods = [
    { name: 'bKash', number: '+8801878666388', type: 'Personal' },
    { name: 'Nagad', number: '+8801878666388', type: 'Personal' },
    { name: 'Binance', number: '1056966023', type: 'Binance ID' }
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-4xl font-display font-bold text-slate-900">Payment Information</h1>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-xl">
              <h3 className="text-xl font-display font-bold mb-6 text-slate-900">Manual Payment</h3>
              <div className="mb-6 p-4 bg-red-600/5 rounded-2xl border border-red-600/10">
                <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1">Current Exchange Rate</p>
                <p className="text-lg font-display font-bold text-slate-900">1 USD/USDT = {bdtRate || 125} BDT</p>
              </div>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                If you prefer manual payment, please send the total amount to any of the numbers below. After payment, enter the Transaction ID in your cart during checkout.
              </p>
              
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div key={method.name} className="p-4 bg-[#FAF9F6] rounded-2xl border border-black/5 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900">{method.name}</h4>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest">{method.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono font-bold text-slate-900">{method.number}</p>
                      <button 
                        onClick={() => handleCopy(method.name, method.number)}
                        className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${
                          copiedMethod === method.name ? 'text-green-600' : 'text-red-600 hover:underline'
                        }`}
                      >
                        {copiedMethod === method.name ? 'Copied!' : 'Copy Number'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-red-600 p-8 rounded-[2.5rem] text-[#FAF9F6] shadow-xl shadow-red-600/20">
              <h3 className="text-xl font-display font-bold mb-4">Automatic Payment</h3>
              <p className="text-red-100 text-sm mb-6 leading-relaxed">
                We also support automatic payments via Bkash/Nagad. Simply select "Bkash/Nagad (Auto)" in your cart to pay instantly using your preferred method.
              </p>
              <button 
                onClick={() => {
                  navigate('/cart');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full py-4 bg-white text-red-600 font-bold rounded-2xl uppercase tracking-widest text-xs hover:bg-red-50 transition-colors"
              >
                Go to Cart
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-xl">
              <h3 className="text-xl font-display font-bold mb-6 text-slate-900">Payment Instructions</h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Select Items</h4>
                    <p className="text-xs text-slate-500">Add your desired game packages to the cart.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Choose Method</h4>
                    <p className="text-xs text-slate-500">Go to checkout and select your preferred payment method.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Complete Payment</h4>
                    <p className="text-xs text-slate-500">Follow the instructions for manual or automatic payment.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">4</div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Submit Order</h4>
                    <p className="text-xs text-slate-500">Enter TrxID (for manual) or complete the auto-payment flow.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-[#FAF9F6] shadow-xl">
              <h3 className="text-xl font-display font-bold mb-4">Need Help?</h3>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                If you encounter any issues during payment, our support team is available 24/7 to assist you.
              </p>
              <button 
                onClick={() => {
                  navigate('/support');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl uppercase tracking-widest text-xs transition-all"
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
