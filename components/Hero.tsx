
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';

const DEFAULT_SLIDES = [
  {
    id: 'default-1',
    title: "Legendary Game Top-Ups",
    tag: "Official Store",
    image_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop"
  }
];

const Hero: React.FC = () => {
  const { heroBanners, fetchHeroBanners } = useStore();
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
  }, [fetchHeroBanners]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="relative min-h-[85vh] pt-32 pb-20 flex items-center justify-center overflow-hidden">
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] animate-pulse"></div>
      
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center relative z-10 w-full">
        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="order-2 lg:order-1"
        >
          <div className="inline-flex items-center space-x-2 px-4 py-2 glass rounded-full text-red-500 font-bold text-[10px] mb-8 border border-red-500/20 uppercase tracking-[0.2em]">
            <span className="flex h-2 w-2 rounded-full bg-red-600 animate-ping"></span>
            <span>Crimson Protocol Active</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold leading-[1.1] mb-6 text-white">
            Fuel Your <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-rose-400 to-red-800 relative inline-block min-h-[1.2em]">
              {displayText}
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="inline-block w-[4px] h-[0.8em] bg-red-500 ml-1 align-middle shadow-[0_0_8px_rgba(239,68,68,0.8)]"
              />
            </span>
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-red-600 to-transparent mb-8 rounded-full"></div>
          <p className="text-lg text-white/50 mb-10 max-w-lg leading-relaxed font-medium">
            Instant top-ups for the most competitive titles. Get your diamonds, UC, and credits through our premium secure marketplace.
          </p>
        </motion.div>

        {/* Dynamic Slider */}
        <div className="order-1 lg:order-2 relative w-full h-[380px] md:h-[480px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={slides[currentSlide].id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 glass-dark"
            >
              <img 
                src={slides[currentSlide].image_url} 
                alt={slides[currentSlide].title}
                className="w-full h-full object-cover opacity-60 grayscale-[10%]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
              
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                <div className="glass-dark p-6 rounded-[2rem] border border-white/10 backdrop-blur-3xl">
                  {slides[currentSlide].tag && (
                    <p className="text-red-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">
                      {slides[currentSlide].tag}
                    </p>
                  )}
                  <div className="flex justify-between items-end">
                    <h3 className="text-lg md:text-2xl font-display font-bold text-white max-w-[80%] leading-tight">
                      {slides[currentSlide].title}
                    </h3>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          
          {/* Dots */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
             {slides.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentSlide ? 'w-8 bg-red-600' : 'w-2 bg-white/20'}`} />
             ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
