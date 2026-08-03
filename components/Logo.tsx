'use client';

import React from 'react';

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
          <svg
            className={`absolute left-1/2 -translate-x-1/2 text-accent fill-current drop-shadow-[0_0_8px_rgba(229,9,20,0.9)] ${playSizes[size]}`}
            viewBox="0 0 24 24"
          >
            <polygon points="6,3 20,12 6,21" />
          </svg>
          <span className="inline-block leading-none pt-[0.25em]">ı</span>
        </span>

        {/* ew */}
        <span className="text-white font-extrabold">ew</span>

        {/* R (vibrant glowing cinematic red with slightly thinner weight) */}
        <span className="text-accent font-bold drop-shadow-[0_0_12px_rgba(229,9,20,0.7)] ml-0">
          R
        </span>
      </div>

      {showTag && (
        <span className="text-[10px] bg-accent/20 border border-accent/40 text-accent font-semibold px-2 py-0.5 rounded tracking-wider uppercase hidden sm:inline-block">
          TMDB
        </span>
      )}
    </div>
  );
}
