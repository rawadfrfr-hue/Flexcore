'use client';

import React from 'react';
import { motion } from 'motion/react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTag?: boolean;
}

export default function Logo({ size = 'md', className = '', showTag = false }: LogoProps) {
  const textSizes = {
    sm: 'text-lg tracking-tight',
    md: 'text-2xl tracking-tight',
    lg: 'text-3xl tracking-tight',
    xl: 'text-4xl tracking-tighter',
  };

  const playSizes = {
    sm: 'w-2 h-2 -top-1.5',
    md: 'w-2.5 h-2.5 -top-1.5',
    lg: 'w-3 h-3 -top-2',
    xl: 'w-3.5 h-3.5 -top-2.5',
  };

  return (
    <motion.div 
      whileHover="hover"
      className={`inline-flex items-center gap-2 select-none ${className}`}
    >
      {/* ViewR Vector Typography Logo */}
      <div className={`font-sans font-black flex items-center leading-none relative overflow-hidden py-1 px-0.5 ${textSizes[size]}`}>
        {/* Subtle Light Streak Sweep Effect */}
        <motion.div
          initial={{ x: '-120%', opacity: 0 }}
          animate={{ x: '200%', opacity: [0, 0.5, 0] }}
          transition={{ delay: 0.8, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-y-0 z-20 w-1/2 bg-gradient-to-r from-transparent via-white/35 to-transparent skew-x-[-25deg] pointer-events-none transform-gpu"
        />

        {/* V */}
        <span className="text-white font-extrabold">V</span>

        {/* i with red play triangle dot */}
        <span className="relative inline-flex flex-col items-center justify-end text-white font-extrabold">
          <motion.div
            className={`absolute left-1/2 ${playSizes[size]} transform-gpu pointer-events-none`}
            initial={{ x: "-50%", y: -10, scale: 0, opacity: 0 }}
            animate={{ 
              x: "-50%",
              y: [-10, 0, -2, 0],
              scale: [0, 1.3, 0.95, 1],
              opacity: 1
            }}
            transition={{ 
              duration: 0.8, 
              delay: 0.2,
              ease: [0.34, 1.56, 0.64, 1] 
            }}
            variants={{
              hover: {
                y: -5,
                scale: 1.4,
                rotate: 15,
                transition: { type: "spring", stiffness: 350, damping: 12 }
              }
            }}
          >
            {/* Continuous floating & glowing animation loop */}
            <motion.svg
              animate={{ 
                y: [0, -3, 0],
                scale: [1, 1.08, 1],
                filter: [
                  'drop-shadow(0 0 6px rgba(229,9,20,0.7))',
                  'drop-shadow(0 0 14px rgba(229,9,20,1))',
                  'drop-shadow(0 0 6px rgba(229,9,20,0.7))'
                ]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 2, 
                ease: "easeInOut" 
              }}
              className="w-full h-full text-accent fill-current transform-gpu"
              viewBox="0 0 24 24"
            >
              <polygon points="6,3 20,12 6,21" />
            </motion.svg>
          </motion.div>

          <span className="inline-block leading-none pt-[0.25em]">ı</span>
        </span>

        {/* ew */}
        <span className="text-white font-extrabold">ew</span>

        {/* R (vibrant glowing cinematic red) */}
        <motion.span 
          animate={{
            textShadow: [
              '0 0 8px rgba(229,9,20,0.6)',
              '0 0 16px rgba(229,9,20,0.95)',
              '0 0 8px rgba(229,9,20,0.6)'
            ]
          }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          className="text-accent font-bold ml-0"
        >
          R
        </motion.span>
      </div>

      {showTag && (
        <span className="text-[10px] bg-accent/20 border border-accent/40 text-accent font-semibold px-2 py-0.5 rounded tracking-wider uppercase hidden sm:inline-block">
          TMDB
        </span>
      )}
    </motion.div>
  );
}
