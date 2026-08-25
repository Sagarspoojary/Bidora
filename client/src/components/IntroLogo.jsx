import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

export function IntroLogo({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
    exit: { 
      opacity: 0,
      scale: 0.95,
      filter: 'blur(10px)',
      transition: { ease: 'easeInOut', duration: 0.8 } 
    }
  };

  const letterVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', damping: 12, stiffness: 100 }
    }
  };

  const glowVariants = {
    animate: {
      scale: [1, 1.05, 0.98, 1.02, 1],
      opacity: [0.35, 0.5, 0.4, 0.6, 0.35],
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <motion.div 
      className="intro-viewport"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={containerVariants}
    >
      {/* Cinematic Background elements */}
      <motion.div 
        className="intro-glow-circle circle-blue"
        variants={glowVariants}
        animate="animate"
      />
      <motion.div 
        className="intro-glow-circle circle-purple"
        variants={glowVariants}
        animate="animate"
        custom={1}
      />

      <div className="intro-content">
        {/* Animated Glass Emblem */}
        <motion.div 
          className="glass-emblem"
          initial={{ scale: 0.8, rotate: -35, opacity: 0 }}
          animate={{ scale: 1, rotate: [0, -10, 0], opacity: 1 }}
          transition={{ 
            type: 'spring', 
            damping: 12, 
            stiffness: 90, 
            duration: 1.5,
            rotate: {
              delay: 1.2,
              duration: 0.5,
              repeat: 1,
              repeatType: "reverse"
            }
          }}
        >
          <div className="emblem-inner">
            <div className="glass-reflection"></div>
            <svg width="60" height="60" viewBox="0 0 100 100" fill="none" className="gavel-svg">
              {/* Left 'B' loops */}
              <path d="M 43,22 C 32,22 24,28 24,37 C 24,46 32,50 43,50 C 35,48 29,44 29,37 C 29,30 35,24 43,22 Z" fill="url(#gold-gradient)" />
              <path d="M 43,50 C 32,50 24,54 24,63 C 24,72 32,78 43,78 C 35,76 29,72 29,63 C 29,54 35,52 43,50 Z" fill="url(#gold-gradient)" />
              
              {/* Center Serif Stem */}
              <path d="M 47,22 H 53 V 78 H 47 Z" fill="url(#gold-gradient)" />
              {/* Top Serif */}
              <path d="M 42,22 H 58 V 25 H 42 Z" fill="url(#gold-gradient)" />
              {/* Bottom Serif */}
              <path d="M 42,75 H 58 V 78 H 42 Z" fill="url(#gold-gradient)" />
              
              {/* Right 'D' loop */}
              <path d="M 57,22 C 72,22 81,33 81,50 C 81,67 72,78 57,78 C 66,74 74,63 74,50 C 74,37 66,26 57,22 Z" fill="url(#gold-gradient)" />
              
              <defs>
                <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fef08a" /> {/* bright luxury gold */}
                  <stop offset="50%" stopColor="#ca8a04" /> {/* rich gold */}
                  <stop offset="100%" stopColor="#854d0e" /> {/* bronze shadow */}
                </linearGradient>
              </defs>
            </svg>
          </div>
        </motion.div>

        {/* Brand Text Staggered Animation */}
        <motion.div className="brand-text-container">
          {["B", "I", "D", "O", "R", "A"].map((char, index) => (
            <motion.span 
              key={index} 
              className="intro-char"
              variants={letterVariants}
            >
              {char}
            </motion.span>
          ))}
        </motion.div>

        {/* Tagline */}
        <motion.p 
          className="intro-tagline"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 1 }}
        >
          Every Bid. One Winner.
        </motion.p>

        {/* Skipping/Interactive Progress Dot */}
        <motion.div 
          className="intro-loader-bar"
          initial={{ width: 0 }}
          animate={{ width: '120px' }}
          transition={{ delay: 0.5, duration: 3.2, ease: "linear" }}
        />

        <motion.button 
          className="btn-skip-intro"
          onClick={onComplete}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          whileHover={{ opacity: 1, scale: 1.05 }}
          transition={{ delay: 2.2 }}
        >
          Enter Arena ➔
        </motion.button>
      </div>
    </motion.div>
  );
}

export default IntroLogo;
