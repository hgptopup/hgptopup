
import React from 'react';
import { motion } from 'framer-motion';

interface TermsOfServiceProps {
  onBack: () => void;
}

const TermsOfService: React.FC<TermsOfServiceProps> = ({ onBack }) => {
  const sections = [
    {
      title: "Service Type",
      content: "Hasibul Game Point provides digital game top-ups, in-game currencies, diamonds, UC, CP, and various gift card services. All products are delivered as digital redeem codes or instant top-ups."
    },
    {
      title: "Orders and Payment",
      content: "Payments accepted via bKash, Nagad, Rocket, Upay, and other supported methods. Orders are processed after successful payment. Customers are responsible for providing accurate information."
    },
    {
      title: "Delivery Policy",
      content: "Delivery typically takes 5–30 minutes. Delays may occur due to server issues, maintenance, or technical problems. Redeem codes/top-ups will be sent to email, phone, or order history. If not received within 30 minutes, contact support."
    },
    {
      title: "After-Sales Support",
      content: "We provide support for: Invalid or unusable redeem codes, Orders not delivered, Payment successful but order not processed, and Top-up not reflected. Support hours: 10:00 AM – 12:00 AM daily."
    },
    {
      title: "Usage Policy",
      content: "Services for users 18 years or older only. Digital codes cannot be sold or transferred. Fraudulent activity may result in order cancellation or account suspension."
    },
    {
      title: "Limitation of Liability",
      content: "Hasibul Game Point is not responsible for account suspension/bans due to user mistakes. We are not liable for server issues, maintenance, or technical faults. Third-party game/platform decisions are final and beyond our control."
    },
    {
      title: "Changes",
      content: "Hasibul Game Point reserves the right to modify, amend, or update these terms at any time. Updated terms are effective immediately upon publication."
    }
  ];

  return (
    <div className="min-h-screen pt-24 pb-32 md:pb-20 bg-[#0B0B0F]">
      <div className="max-w-4xl mx-auto px-6">
        <button 
          onClick={onBack} 
          className="flex items-center space-x-2 text-slate-400 hover:text-[#FAF9F6] mb-8 transition-colors group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-bold uppercase tracking-widest text-xs">Back to Home</span>
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#FAF9F6]/5 backdrop-blur-xl p-10 md:p-16 rounded-[2.5rem] border border-[#FAF9F6]/10 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
          
          <div className="text-center mb-16 relative z-10">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 text-[#FAF9F6]">
              Hasibul <span className="neon-text-red">Game Point</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em] mb-12">Terms of Service Protocol</p>
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-red-600 to-transparent mx-auto"></div>
          </div>

          <div className="space-y-12 relative z-10">
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

          <div className="mt-20 pt-10 border-t border-[#FAF9F6]/10 text-center relative z-10">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Operational Compliance • Hasibul Game Point HQ</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsOfService;
