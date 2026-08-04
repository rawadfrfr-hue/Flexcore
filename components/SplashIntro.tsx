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
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          onClick={handleDismiss}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#050508] text-white cursor-pointer select-none overflow-hidden"
        >
          {/* Ambient Glowing Lens Flare Beam */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [0.8, 1.3, 1.1], opacity: [0.2, 0.6, 0.45] }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute w-[350px] h-[350px] sm:w-[500px] sm:h-[500px] rounded-full bg-radial from-red-600/30 via-red-900/10 to-transparent blur-3xl pointer-events-none"
          />

          {/* Secondary Purple Beam depth */}
          <motion.div
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: [0.5, 1.2, 1], opacity: [0.1, 0.3, 0.2] }}
            transition={{ duration: 2.2, ease: "easeOut" }}
            className="absolute w-[280px] h-[280px] sm:w-[400px] sm:h-[400px] rounded-full bg-radial from-purple-700/20 via-transparent to-transparent blur-2xl pointer-events-none"
          />

          {/* Central Logo Container */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Animated Lens Play Emblem */}
            <motion.div
              initial={{ scale: 0, rotate: -20, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative mb-4 flex items-center justify-center"
            >
              {/* Outer Pulsing Glow Ring */}
              <motion.div
                animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.9, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full border border-red-500/40 bg-red-600/10 blur-sm"
              />

              {/* Play Emblem Icon Box */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-red-700 via-red-600 to-rose-500 p-0.5 shadow-[0_0_35px_rgba(220,38,38,0.6)] flex items-center justify-center">
                <div className="w-full h-full bg-[#0a0a0f] rounded-[14px] flex items-center justify-center">
                  <motion.svg
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="w-8 h-8 sm:w-10 sm:h-10 text-red-500 ml-1 drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]"
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
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
              className="flex items-center text-4xl sm:text-6xl font-black tracking-tight"
            >
              <span className="text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">View</span>
              <motion.span
                animate={{ textShadow: ["0 0 10px rgba(220,38,38,0.5)", "0 0 25px rgba(220,38,38,1)", "0 0 15px rgba(220,38,38,0.7)"] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="text-red-600 font-extrabold ml-0.5"
              >
                R
              </motion.span>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="text-[10px] sm:text-xs font-semibold tracking-[0.35em] text-gray-400 uppercase mt-2"
            >
              Cinematic Experience
            </motion.p>

            {/* Progress Lens Beam Line */}
            <div className="w-36 sm:w-48 h-[2px] bg-gray-800 rounded-full mt-6 overflow-hidden relative">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "0%" }}
                transition={{ duration: 1.8, ease: "easeInOut" }}
                className="w-full h-full bg-gradient-to-r from-red-700 via-red-500 to-rose-400 shadow-[0_0_10px_#ef4444]"
              />
            </div>
          </div>

          {/* Tap to skip hint */}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 1.2, duration: 0.4 }}
            className="absolute bottom-6 text-[10px] text-gray-500 uppercase tracking-widest"
          >
            Tap anywhere to skip
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
