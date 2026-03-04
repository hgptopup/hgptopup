import React, { useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const Joystick3D: React.FC = () => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 150 };
  const rotateX = useSpring(useTransform(y, [-100, 100], [30, -30]), springConfig);
  const rotateY = useSpring(useTransform(x, [-100, 100], [-30, 30]), springConfig);
  
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(event.clientX - centerX);
    y.set(event.clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div 
      className="relative w-64 h-64 flex items-center justify-center perspective-1000"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Base of the joystick */}
      <div className="absolute w-48 h-48 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border-4 border-red-600/20 shadow-[0_0_50px_rgba(220,38,38,0.1)]" />
      
      {/* The Stick */}
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="relative w-32 h-32 flex items-center justify-center cursor-pointer"
      >
        {/* Shaft shadow */}
        <div className="absolute w-4 h-24 bg-black/10 blur-md translate-y-4" />
        
        {/* Shaft */}
        <div className="absolute w-6 h-24 bg-gradient-to-b from-slate-300 via-slate-400 to-slate-500 rounded-full border-x border-black/5" />
        
        {/* Top Knob */}
        <motion.div 
          className="absolute -top-4 w-20 h-20 rounded-full bg-gradient-to-br from-red-600 via-red-700 to-red-900 border-2 border-red-600/50 shadow-[0_0_30px_rgba(220,38,38,0.5)] flex items-center justify-center overflow-hidden"
          style={{ translateZ: 40 }}
        >
          {/* Inner glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent)]" />
          
          {/* Neon Ring */}
          <div className="w-12 h-12 rounded-full border border-red-400/30 animate-pulse" />
        </motion.div>
      </motion.div>

      {/* Ambient Lights */}
      <div className="absolute -inset-20 bg-red-600/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute -inset-20 bg-red-600/5 blur-[100px] rounded-full pointer-events-none translate-x-20" />
    </div>
  );
};

export default Joystick3D;
