
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import Joystick3D from './Joystick3D';

const DEFAULT_SLIDES = [
  {
    id: 'default-1',
    title: "Legendary Game Top-Ups",
    tag: "Official Store",
    image_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop"
  }
];

const Hero: React.FC = () => {
  const { heroBanners, fetchHeroBanners, floatingIcons, fetchFloatingIcons } = useStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Typewriter state
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(100);

  const words = ["Battle Spirit", "Game Currency"];

  useEffect(() => {
    const handleType = () => {
      const i = loopNum % words.length;
      const fullText = words[i];

      setDisplayText(isDeleting 
        ? fullText.substring(0, displayText.length - 1) 
        : fullText.substring(0, displayText.length + 1)
      );

      setTypingSpeed(isDeleting ? 50 : 150);

      if (!isDeleting && displayText === fullText) {
        setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && displayText === '') {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
      }
    };

    const timer = setTimeout(handleType, typingSpeed);
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, loopNum, typingSpeed]);

  // Use DB slides if available, otherwise fallback to default
  const slides = heroBanners && heroBanners.length > 0 ? heroBanners : DEFAULT_SLIDES;

  useEffect(() => {
    fetchHeroBanners();
    fetchFloatingIcons();
  }, [fetchHeroBanners, fetchFloatingIcons]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="relative min-h-[90vh] pt-32 pb-20 flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-red-600/5 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-red-600/5 rounded-full blur-[120px] animate-pulse delay-1000"></div>
      
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center relative z-10 w-full">
        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="order-2 lg:order-1"
        >
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-50 border border-red-600/20 rounded-full text-red-600 font-bold text-[10px] mb-8 uppercase tracking-[0.2em] shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-red-600 animate-ping"></span>
            <span>Neural Network Online</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold leading-[1.1] mb-6 text-slate-900">
            Fuel Your <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-600 via-red-800 to-red-600 relative inline-block min-h-[1.2em]">
              {displayText}
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="inline-block w-[4px] h-[0.8em] bg-red-600 ml-1 align-middle"
              />
            </span>
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-red-600 to-transparent mb-8 rounded-full"></div>
          <p className="text-lg text-slate-500 mb-10 max-w-lg leading-relaxed font-medium">
            Instant top-ups for the most competitive titles. Get your diamonds, UC, and credits through our premium secure marketplace.
          </p>
        </motion.div>

        {/* 3D Joystick and Visuals */}
        <div className="order-1 lg:order-2 relative flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative"
          >
            <Joystick3D />
            
            {/* Floating Elements */}
            {floatingIcons && floatingIcons.length > 0 ? (
              floatingIcons.map((icon, idx) => {
                const positionClasses: Record<string, string> = {
                  'top-left': '-top-2 -left-2 md:-top-10 md:-left-10',
                  'top-right': '-top-2 -right-2 md:-top-10 md:-right-10',
                  'bottom-left': '-bottom-2 -left-2 md:-bottom-10 md:-left-10',
                  'bottom-right': '-bottom-2 -right-2 md:-bottom-10 md:-right-10',
                  'center-left': 'top-1/2 -left-6 md:-left-20 -translate-y-1/2',
                  'center-right': 'top-1/2 -right-6 md:-right-20 -translate-y-1/2',
                };
                
                return (
                  <motion.div 
                    key={icon.id}
                    animate={{ y: [0, idx % 2 === 0 ? -20 : 20, 0] }}
                    transition={{ 
                      duration: Number(icon.duration) || 4, 
                      repeat: Infinity, 
                      ease: "easeInOut",
                      delay: (Number(icon.delay) || 0) + (idx * 0.2)
                    }}
                    className={`absolute ${positionClasses[icon.position || 'top-right']} w-16 h-16 md:w-20 md:h-20 bg-white/40 backdrop-blur-md rounded-2xl border border-slate-200 flex items-center justify-center shadow-xl z-20`}
                  >
                    <div className="text-2xl md:text-3xl">
                      {icon.icon.startsWith('http') || icon.icon.startsWith('data:image/') ? (
                        <img src={icon.icon} className="w-10 h-10 md:w-12 md:h-12 object-contain" alt="" />
                      ) : (
                        icon.icon
                      )}
                    </div>
                    {icon.label && (
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-bold uppercase tracking-widest text-red-600 opacity-50">
                        {icon.label}
                      </div>
                    )}
                  </motion.div>
                );
              })
            ) : (
              <>
                <motion.div 
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-4 -right-4 md:-top-10 md:-right-10 w-16 h-16 md:w-24 md:h-24 bg-white/40 backdrop-blur-md rounded-2xl border border-slate-200 flex items-center justify-center shadow-xl"
                >
                  <div className="text-2xl md:text-3xl">💎</div>
                </motion.div>
                
                <motion.div 
                  animate={{ y: [0, 20, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="absolute -bottom-4 -left-4 md:-bottom-10 md:-left-10 w-16 h-16 md:w-24 md:h-24 bg-white/40 backdrop-blur-md rounded-2xl border border-slate-200 flex items-center justify-center shadow-xl"
                >
                  <div className="text-2xl md:text-3xl">🎮</div>
                </motion.div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
