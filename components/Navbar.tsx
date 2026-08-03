'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/Logo';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { Movie } from '@/lib/movies';
import { motion, AnimatePresence } from 'motion/react';

export const MOVIE_CATEGORIES = [
  { slug: 'hindi', label: 'Hindi Movies' },
  { slug: 'hollywood', label: 'Hollywood Movies' },
  { slug: 'hindi-dubbed', label: 'Hindi Dubbed' },
  { slug: 'south-indian', label: 'South Indian' },
  { slug: 'bangla', label: 'Bangla Movies' },
];

export const SERIES_CATEGORIES = [
  { slug: 'bangla', label: 'Bangla Series' },
  { slug: 'hollywood', label: 'Hollywood Series' },
  { slug: 'anime', label: 'Anime Series' },
  { slug: 'hindi', label: 'Hindi Series' },
  { slug: 'bangla-dubbed', label: 'Bangla Dubbed' },
  { slug: 'k-drama', label: 'K-Drama' },
];

export default function Navbar() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Left Navigation Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex">
            {/* Backdrop Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsDrawerOpen(false)}
            ></motion.div>

            {/* Drawer Content */}
            <motion.div 
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-80 max-w-[85vw] bg-[#0d0d12]/95 backdrop-blur-xl border-r border-white/10 h-full flex flex-col z-10 p-6 overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <Link 
                href="/" 
                onClick={() => setIsDrawerOpen(false)}
                className="flex items-center gap-2 click-effect active:scale-95"
              >
                <Logo size="sm" />
                <span className="text-[9px] bg-accent/20 border border-accent/40 text-accent px-1.5 py-0.5 rounded uppercase font-semibold">MENU</span>
              </Link>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            <nav className="space-y-6 flex-1">
              {/* Home Link */}
              <Link
                href="/"
                onClick={() => setIsDrawerOpen(false)}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${
                  pathname === '/'
                    ? 'bg-accent text-white shadow'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span>🏠</span> All Content (Home)
              </Link>

              {/* Search Link */}
              <Link
                href="/search"
                onClick={() => setIsDrawerOpen(false)}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${
                  pathname === '/search'
                    ? 'bg-accent text-white shadow'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span>🔍</span> Search & Explore
              </Link>

              {/* MOVIES Section */}
              <div>
                <div className="text-xs font-black tracking-wider text-accent uppercase px-3 mb-2 flex items-center gap-1.5">
                  <span>🎬</span> MOVIES
                </div>
                <div className="space-y-1 pl-2">
                  <Link
                    href="/movies"
                    onClick={() => setIsDrawerOpen(false)}
                    className={`block w-full text-left px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
                      pathname === '/movies'
                        ? 'bg-accent/20 text-accent border border-accent/30 font-bold'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    All Movies
                  </Link>
                  {MOVIE_CATEGORIES.map(cat => {
                    const href = `/movies/${cat.slug}`;
                    const isActive = pathname === href;
                    return (
                      <Link
                        key={cat.slug}
                        href={href}
                        onClick={() => setIsDrawerOpen(false)}
                        className={`block w-full text-left px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
                          isActive
                            ? 'bg-accent text-white font-bold'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {cat.label}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* SERIES Section */}
              <div>
                <div className="text-xs font-black tracking-wider text-accent uppercase px-3 mb-2 flex items-center gap-1.5">
                  <span>📺</span> WEB SERIES
                </div>
                <div className="space-y-1 pl-2">
                  <Link
                    href="/series"
                    onClick={() => setIsDrawerOpen(false)}
                    className={`block w-full text-left px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
                      pathname === '/series'
                        ? 'bg-accent/20 text-accent border border-accent/30 font-bold'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    All Web Series
                  </Link>
                  {SERIES_CATEGORIES.map(cat => {
                    const href = `/series/${cat.slug}`;
                    const isActive = pathname === href;
                    return (
                      <Link
                        key={cat.slug}
                        href={href}
                        onClick={() => setIsDrawerOpen(false)}
                        className={`block w-full text-left px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
                          isActive
                            ? 'bg-accent text-white font-bold'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {cat.label}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Admin Link */}
              <div className="pt-2 border-t border-white/10">
                <a
                  href="/admin.html"
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full text-left px-4 py-2 rounded-lg text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  ⚙️ Admin Dashboard
                </a>
              </div>
            </nav>

            <div className="pt-4 border-t border-white/10 text-[11px] text-gray-500 text-center">
              ViewR Streaming Platform
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* Main Header */}
      <header className="h-[75px] md:h-[80px] sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 md:px-10 bg-[#08080a]/90 backdrop-blur-md border-b border-white/10 select-none">
        <div className="flex items-center gap-3 sm:gap-4">
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/20 text-white border border-white/10 transition-all click-effect touch-manipulation cursor-pointer"
            aria-label="Open Navigation Menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          <Link href="/" className="click-effect active:scale-95">
            <Logo size="md" showTag />
          </Link>

          {/* Quick Nav Links */}
          <div className="hidden md:flex items-center gap-1 ml-4 border-l border-white/10 pl-4 text-xs font-bold text-gray-300">
            <Link 
              href="/" 
              className={`px-3 py-1.5 rounded-lg transition-all click-effect ${pathname === '/' ? 'text-white bg-white/10' : 'hover:text-white hover:bg-white/5'}`}
            >
              Home
            </Link>
            <Link 
              href="/movies" 
              className={`px-3 py-1.5 rounded-lg transition-all click-effect ${pathname.startsWith('/movies') ? 'text-white bg-white/10' : 'hover:text-white hover:bg-white/5'}`}
            >
              Movies
            </Link>
            <Link 
              href="/series" 
              className={`px-3 py-1.5 rounded-lg transition-all click-effect ${pathname.startsWith('/series') ? 'text-white bg-white/10' : 'hover:text-white hover:bg-white/5'}`}
            >
              Series
            </Link>
          </div>
        </div>

        {/* Search Icon (All screens) */}
        <div className="flex items-center gap-2">
          <Link
            href="/search"
            className="p-2.5 sm:p-3 rounded-full bg-white/5 hover:bg-white/10 active:bg-white/20 text-white border border-white/10 transition-all click-effect touch-manipulation cursor-pointer shadow-sm hover:shadow-accent/20 hover:border-accent/50"
            aria-label="Search"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </Link>
        </div>
      </header>
    </>
  );
}
