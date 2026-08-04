'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function SplashIntro() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Lock scroll while intro is showing
    document.body.style.overflow = 'hidden';

    const timer = setTimeout(() => {
      setIsVisible(false);
      document.body.style.overflow = '';
    }, 2400);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = '';
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    document.body.style.overflow = '';
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          onClick={handleDismiss}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#050508] text-white cursor-pointer select-none overflow-hidden transform-gpu will-change-[opacity,transform]"
        >
          {/* Ambient Glowing Lens Flare Beams (Opacity-only GPU animation to prevent blur-re-rasterization lag) */}
          <motion.div
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: [0.2, 0.55, 0.4] }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute w-[350px] h-[350px] sm:w-[500px] sm:h-[500px] rounded-full bg-red-600/25 blur-[100px] pointer-events-none transform-gpu will-change-[opacity]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: [0.1, 0.3, 0.2] }}
            transition={{ duration: 2.2, ease: "easeOut" }}
            className="absolute w-[280px] h-[280px] sm:w-[400px] sm:h-[400px] rounded-full bg-purple-600/20 blur-[80px] pointer-events-none transform-gpu will-change-[opacity]"
          />

          {/* Central Logo Container */}
          <div className="relative z-10 flex flex-col items-center transform-gpu">
            {/* Animated Lens Play Emblem */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative mb-4 flex items-center justify-center transform-gpu will-change-[transform,opacity]"
            >
              {/* Outer Pulsing Glow Ring (GPU opacity transition) */}
              <motion.div
                animate={{ opacity: [0.4, 0.85, 0.4], scale: [0.98, 1.05, 0.98] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                className="absolute inset-[-4px] rounded-2xl bg-red-600/30 blur-md transform-gpu will-change-[opacity,transform]"
              />

              {/* Play Emblem Icon Box */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-red-700 via-red-600 to-rose-500 p-0.5 shadow-[0_0_30px_rgba(220,38,38,0.5)] flex items-center justify-center transform-gpu">
                <div className="w-full h-full bg-[#0a0a0f] rounded-[14px] flex items-center justify-center">
                  <motion.svg
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="w-8 h-8 sm:w-10 sm:h-10 text-red-500 ml-1 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)] transform-gpu"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </motion.svg>
                </div>
              </div>
            </motion.div>

            {/* Brand Title: ViewR */}
            <motion.div
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center text-4xl sm:text-6xl font-black tracking-tight transform-gpu will-change-[transform,opacity]"
            >
              <span className="text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.15)]">View</span>
              <div className="relative ml-0.5 inline-block">
                <span className="text-red-600 font-extrabold relative z-10 drop-shadow-[0_0_12px_rgba(220,38,38,0.8)]">
                  R
                </span>
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  className="absolute inset-0 text-red-500 font-extrabold blur-[3px] z-0 transform-gpu pointer-events-none"
                  aria-hidden="true"
                >
                  R
                </motion.span>
              </div>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.35 }}
              className="text-[10px] sm:text-xs font-semibold tracking-[0.35em] text-gray-400 uppercase mt-2"
            >
              Cinematic Experience
            </motion.p>

            {/* Progress Lens Beam Line (Hardware-accelerated scaleX animation) */}
            <div className="w-36 sm:w-48 h-[2px] bg-gray-800/80 rounded-full mt-6 overflow-hidden relative">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                style={{ originX: 0 }}
                transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
                className="w-full h-full bg-gradient-to-r from-red-700 via-red-500 to-rose-400 transform-gpu will-change-transform shadow-[0_0_8px_#ef4444]"
              />
            </div>
          </div>

          {/* Tap to skip hint */}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 1, duration: 0.4 }}
            className="absolute bottom-6 text-[10px] text-gray-500 uppercase tracking-widest pointer-events-none"
          >
            Tap anywhere to skip
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
