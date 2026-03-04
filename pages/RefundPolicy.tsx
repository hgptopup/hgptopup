
import React from 'react';
import { motion } from 'framer-motion';

interface RefundPolicyProps {
  onBack: () => void;
}

const RefundPolicy: React.FC<RefundPolicyProps> = ({ onBack }) => {
  const sections = [
    {
      title: "Non-Refundable Items",
      content: "The following digital products are non-refundable once delivery is completed: Redeem codes, In-game currency / top-ups, and Gift cards. Digital products cannot be returned or exchanged once delivered or redeemed."
    },
    {
      title: "Refund Eligibility",
      content: "Refunds or replacements are granted only if: Wrong code was delivered due to our mistake, or Payment was successfully made but the order was not delivered within the specified timeframe. We will conduct a thorough investigation for each claim."
    },
    {
      title: "Refund Process",
      content: "To initiate a claim, contact support via WhatsApp, our Facebook Page, or email. You must provide your Order ID, valid proof of payment, and detailed information about the issue. We will inform you of the resolution after verification."
    },
    {
      title: "Limitations",
      content: "We are not liable for: Incorrect Player ID / UID / Account details provided by the customer, Account bans due to developer or third-party issues, Game server maintenance, or cases where the customer redeems a code on the wrong account."
    }
  ];

  return (
    <div className="min-h-screen pt-24 pb-20 bg-[#0B0B0F]">
      <div className="max-w-4xl mx-auto px-6">
        <button 
          onClick={onBack} 
          className="flex items-center space-x-2 text-slate-400 hover:text-white mb-8 transition-colors group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-bold uppercase tracking-widest text-xs">Back to Home</span>
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl p-10 md:p-16 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
          
          <div className="text-center mb-16 relative z-10">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 text-white">
              Refund <span className="neon-text-red">Policy</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em] mb-12">Purchase Protection Protocol</p>
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-red-600 to-transparent mx-auto"></div>
          </div>

          <div className="space-y-12 relative z-10 mb-16">
            {sections.map((section, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <h3 className="text-red-600 font-display font-bold text-xl mb-4 flex items-center gap-3">
                  <span className="w-1.5 h-6 bg-red-600 rounded-full"></span>
                  {section.title}
                </h3>
                <p className="text-slate-400 leading-relaxed text-sm md:text-base font-medium">
                  {section.content}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Special Comparison Section */}
          <div className="relative z-10 grid md:grid-cols-2 gap-6 mt-12">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 rounded-3xl bg-green-500/5 border border-green-500/20"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">💰</span>
                <h4 className="font-display font-bold text-green-600 text-lg">100% Safe</h4>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                <strong className="text-white block mb-2">Bank Card Purchase:</strong>
                Approved by official game platforms (e.g., Konami). No risk, full guarantee, coins are safe, and Red Coin issues are impossible.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 rounded-3xl bg-red-600/5 border border-red-600/20"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">⚠️</span>
                <h4 className="font-display font-bold text-red-600 text-lg">95% Safe</h4>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                <strong className="text-white block mb-2">Virtual Card Purchase:</strong>
                Generally safe, but in rare cases, coins may be lost. No guarantee from our end, though coins can sometimes be reimbursed later.
              </p>
            </motion.div>
          </div>

          <div className="mt-20 pt-10 border-t border-white/10 text-center relative z-10">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Operational Compliance • Hasibul Game Point HQ</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RefundPolicy;
