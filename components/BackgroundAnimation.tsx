
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const Shape = ({ type, size, left, top, delay, duration, rotationSpeed }: any) => {
  const variants = {
    animate: {
      y: [-20, 20, -20],
      x: [-10, 10, -10],
      rotate: [0, 360],
      transition: {
        duration: duration,
        repeat: Infinity,
        ease: "linear",
        delay: delay
      }
    },
    spin: {
      rotateY: [0, 360],
      transition: {
        duration: rotationSpeed,
        repeat: Infinity,
        ease: "linear",
        delay: delay
      }
    }
  };

  const renderShape = () => {
    const color = "#FF3B3B";
    const opacity = 0.2; // 20% opacity

    switch (type) {
      case 'circle':
        return (
          <div 
            style={{ 
              width: size, 
              height: size, 
              borderRadius: '50%', 
              border: `2px solid ${color}`,
              opacity: opacity
            }} 
          />
        );
      case 'square':
        return (
          <div 
            style={{ 
              width: size, 
              height: size, 
              border: `2px solid ${color}`,
              opacity: opacity
            }} 
          />
        );
      case 'triangle':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" style={{ opacity: opacity, fill: 'none', stroke: color, strokeWidth: 2 }}>
            <path d="M12 2L2 22H22L12 2Z" />
          </svg>
        );
      case 'cube':
        return (
          <div className="relative" style={{ width: size, height: size, opacity: opacity }}>
            <div className="absolute inset-0 border-2" style={{ borderColor: color }} />
            <div className="absolute inset-0 border-2 transform translate-x-1 translate-y-1" style={{ borderColor: color }} />
          </div>
        );
      case 'coin':
        return (
          <motion.div 
            variants={variants}
            animate="spin"
            style={{ 
              width: size, 
              height: size, 
              borderRadius: '50%', 
              border: `2px solid ${color}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: opacity
            }}
          >
            <div style={{ width: size * 0.6, height: size * 0.6, borderRadius: '50%', border: `1px solid ${color}` }} />
          </motion.div>
        );
      case 'diamond':
        return (
          <div 
            style={{ 
              width: size, 
              height: size, 
              border: `2px solid ${color}`,
              transform: 'rotate(45deg)',
              opacity: opacity
            }} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      variants={variants}
      animate="animate"
      className="absolute pointer-events-none"
      style={{ left: `${left}%`, top: `${top}%` }}
    >
      {renderShape()}
    </motion.div>
  );
};

const BackgroundAnimation: React.FC = () => {
  const shapes = useMemo(() => {
    const types = ['circle', 'square', 'triangle', 'cube', 'coin', 'diamond'];
    return Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      type: types[i % types.length],
      size: Math.random() * 30 + 15,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 5,
      duration: Math.random() * 10 + 15,
      rotationSpeed: Math.random() * 3 + 2
    }));
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-[#FAF9F6]">
      {shapes.map((shape) => (
        <Shape key={shape.id} {...shape} />
      ))}
    </div>
  );
};

export default BackgroundAnimation;
