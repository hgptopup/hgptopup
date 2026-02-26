
import React from 'react';
import { motion } from 'framer-motion';

interface HelpCenterProps {
  onBack: () => void;
  onOpenSupport: () => void;
}

const HelpCenter: React.FC<HelpCenterProps> = ({ onBack, onOpenSupport }) => {
  const faqCategories = [
    {
      id: 'orders',
      title: 'Orders & Delivery',
      icon: '📦',
      questions: [
        {
          q: "How long does delivery take after placing an order?",
          a: "Orders are usually delivered within 5–30 minutes after payment confirmation. In rare cases, delivery may take longer due to high demand or technical issues."
        },
        {
          q: "I made a payment but did not receive my order. What should I do?",
          a: "Please contact our support team with your Order ID and payment proof for immediate assistance."
        },
        {
          q: "Where can I check my order status?",
          a: "Log in to your account and visit the “My Orders” section to track your order status."
        }
      ]
    },
    {
      id: 'payments',
      title: 'Payment Issues',
      icon: '💳',
      questions: [
        {
          q: "What payment methods do you accept?",
          a: "We accept Bank Card, Virtual Card, and other available payment options shown at checkout (bKash, Nagad, etc.)."
        },
        {
          q: "My payment was deducted but no order was created.",
          a: "Please wait 10–15 minutes. If the issue persists, contact support with payment proof."
        }
      ]
    },
    {
      id: 'refunds',
      title: 'Refund & Replacement',
      icon: '🔄',
      questions: [
        {
          q: "Am I eligible for a refund?",
          a: "Refunds are provided if an incorrect code was delivered due to our mistake, or if payment was completed but the order wasn't delivered within the specified time."
        },
        {
          q: "Can I get a refund if I entered the wrong Player ID / UID?",
          a: "No. We are not responsible for incorrect account details provided by the customer. Please double-check before submission."
        }
      ]
    },
    {
      id: 'game-issues',
      title: 'Game & Account Issues',
      icon: '🎮',
      questions: [
        {
          q: "My account was banned. What can I do?",
          a: "We are not responsible for bans or restrictions imposed by the game developer or third parties. We only provide the top-up service."
        },
        {
          q: "Why are my coins delayed?",
          a: "Delays may occur due to game server maintenance, technical issues, or high traffic on the game's official platform."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-6">
        <button 
          onClick={onBack} 
          className="flex items-center space-x-2 text-white/60 hover:text-red-500 mb-8 transition-colors group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-bold uppercase tracking-widest text-xs">Back to Arena</span>
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-4">
            Help <span className="text-red-600">Center</span>
          </h1>
          <p className="text-white/40 max-w-2xl mx-auto font-medium">
            Everything you need to know about the Hasibul Game Point protocols. If you can't find your answer here, our elite support team is ready to assist.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {faqCategories.map((category, idx) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="glass p-8 rounded-[2.5rem] border border-white/5 hover:border-red-500/20 transition-all shadow-xl"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="text-3xl bg-red-600/10 w-14 h-14 rounded-2xl flex items-center justify-center border border-red-500/20 shadow-lg neon-glow-red">
                  {category.icon}
                </div>
                <h2 className="text-2xl font-display font-bold text-white">{category.title}</h2>
              </div>

              <div className="space-y-6">
                {category.questions.map((faq, fIdx) => (
                  <div key={fIdx} className="group">
                    <h4 className="text-red-500 font-bold text-sm mb-2 group-hover:text-red-400 transition-colors">
                      Q: {faq.q}
                    </h4>
                    <p className="text-white/50 text-xs leading-relaxed font-medium">
                      A: {faq.a}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-20 p-10 glass rounded-[3rem] border border-red-500/10 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-red-600/5 to-transparent pointer-events-none"></div>
          <h3 className="text-2xl font-display font-bold mb-4">Still need assistance?</h3>
          <p className="text-white/40 mb-8 max-w-md mx-auto">Our human operators are online daily from 10:00 AM – 12:00 AM to solve your tactical issues.</p>
          <button 
             onClick={onOpenSupport}
             className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-red-600/20 uppercase tracking-widest text-xs"
          >
            Contact Elite Ops
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default HelpCenter;
