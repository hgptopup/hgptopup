import React from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';

interface SplashScreenProps {
  message?: string;
  onBack?: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ message, onBack }) => {
  const { logoUrl } = useStore();
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] bg-[#FAF9F6] flex items-center justify-center overflow-hidden"
    >
      {/* Background Glow */}
      <div 
        className="absolute inset-0 opacity-50" 
        style={{ 
          background: 'radial-gradient(circle at center, rgba(220, 38, 38, 0.05) 0%, transparent 80%)' 
        }} 
      />

      {/* Unique Vibe: Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              opacity: 0,
              x: Math.random() * 100 + "%",
              y: Math.random() * 100 + "%"
            }}
            animate={{ 
              opacity: [0, 0.3, 0],
              y: [0, -100]
            }}
            transition={{ 
              duration: Math.random() * 2 + 2,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 2
            }}
            className="absolute w-1 h-1 bg-red-600 rounded-full"
          />
        ))}
      </div>
      
      <div className="relative flex flex-col items-center">
        {/* Logo Animation */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            duration: 0.2, 
            ease: "easeOut",
            delay: 0.05
          }}
          className="mb-8"
        >
          <div className="w-24 h-24 flex items-center justify-center relative group">
            <img src={logoUrl || "https://i.imgur.com/VjpTmnL.png"} alt="Hasibul Game Point Logo" className="w-full h-full object-cover rounded-full border-4 border-red-600/30" />
            <div className="absolute inset-0 rounded-3xl border-2 border-red-600/20 animate-ping opacity-20" />
          </div>
        </motion.div>

        {/* Text Animation */}
        <div className="overflow-hidden px-4 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center"
          >
            <motion.h1 
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ 
                duration: 0.2, 
                ease: [0.16, 1, 0.3, 1],
                delay: 0.1
              }}
              className="text-2xl md:text-4xl font-display font-black text-slate-900 uppercase tracking-[0.2em] italic leading-none"
            >
              Hasibul
            </motion.h1>
            <motion.h1 
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ 
                duration: 0.2, 
                ease: [0.16, 1, 0.3, 1],
                delay: 0.15
              }}
              className="text-3xl md:text-5xl font-display font-black text-red-600 uppercase tracking-[0.15em] italic mt-1"
            >
              Game Point
            </motion.h1>
          </motion.div>
        </div>

        {/* Unique Vibe: Scanning Line */}
        <motion.div 
          initial={{ top: "-10%" }}
          animate={{ top: "110%" }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 right-0 h-[1px] bg-red-600/10 z-10 pointer-events-none shadow-[0_0_10px_rgba(220,38,38,0.1)]"
        />

        {/* Subtitle / Loading Bar */}
        <motion.div 
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: "100%" }}
          transition={{ duration: 0.2, delay: 0.2, ease: "easeInOut" }}
          className="mt-6 h-[2px] bg-[#FAF9F6] relative overflow-hidden max-w-[200px]"
        >
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.4)]"
          />
        </motion.div>

        {message && (
          <div className="flex flex-col items-center">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mt-4 text-sm font-medium text-slate-500 tracking-widest uppercase"
            >
              {message}
            </motion.p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SplashScreen;
