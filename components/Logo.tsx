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
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* ViewR Vector Typography Logo */}
      <div className={`font-sans font-black flex items-center leading-none ${textSizes[size]}`}>
        {/* V */}
        <span className="text-white font-extrabold">V</span>

        {/* i with red play triangle dot */}
        <span className="relative inline-flex flex-col items-center justify-end text-white font-extrabold">
          <motion.svg
            initial={{ y: -9, opacity: 0, scale: 0.5 }}
            animate={{ 
              y: 0, 
              opacity: 1, 
              scale: [0.5, 1.25, 1] 
            }}
            transition={{ 
              duration: 0.75, 
              delay: 0.6,
              ease: [0.34, 1.56, 0.64, 1] 
            }}
            className={`absolute left-1/2 -translate-x-1/2 text-accent fill-current drop-shadow-[0_0_10px_rgba(229,9,20,0.95)] ${playSizes[size]} transform-gpu will-change-transform`}
            viewBox="0 0 24 24"
          >
            <motion.polygon 
              animate={{ opacity: [0.85, 1, 0.85] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
              points="6,3 20,12 6,21" 
            />
          </motion.svg>
          <span className="inline-block leading-none pt-[0.25em]">ı</span>
        </span>

        {/* ew */}
        <span className="text-white font-extrabold">ew</span>

        {/* R (vibrant glowing cinematic red) */}
        <motion.span 
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-accent font-bold drop-shadow-[0_0_12px_rgba(229,9,20,0.7)] ml-0"
        >
          R
        </motion.span>
      </div>

      {showTag && (
        <span className="text-[10px] bg-accent/20 border border-accent/40 text-accent font-semibold px-2 py-0.5 rounded tracking-wider uppercase hidden sm:inline-block">
          TMDB
        </span>
      )}
    </div>
  );
}
