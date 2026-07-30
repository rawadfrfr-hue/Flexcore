'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

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
  const [searchVal, setSearchVal] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchVal.trim())}`);
      setIsDrawerOpen(false);
    }
  };

  return (
    <>
      {/* Left Navigation Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop Overlay */}
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          ></div>

          {/* Drawer Content */}
          <div className="relative w-80 max-w-[85vw] bg-[#0d0d12] border-r border-white/10 h-full flex flex-col z-10 p-6 overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <Link 
                href="/" 
                onClick={() => setIsDrawerOpen(false)}
                className="text-xl font-black text-accent tracking-tight flex items-center gap-2"
              >
                <span>FLIXCORE</span>
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

            {/* Mobile Search inside Drawer */}
            <form onSubmit={handleSearchSubmit} className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search title, genre, cast..."
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl py-2.5 pl-9 pr-4 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-accent"
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </form>

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
              FlixCore Streaming Platform
            </div>
          </div>
        </div>
      )}

      {/* Main Header */}
      <header className="h-[75px] md:h-[80px] sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 md:px-10 bg-[#08080a]/90 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-3 sm:gap-4">
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors cursor-pointer"
            aria-label="Open Navigation Menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          <Link href="/" className="text-[20px] sm:text-[22px] md:text-[26px] font-black tracking-tighter text-accent flex items-center gap-2">
            <span>FLIXCORE</span>
            <span className="text-[10px] bg-accent/20 border border-accent/40 text-accent font-semibold px-2 py-0.5 rounded tracking-normal uppercase hidden sm:inline-block">TMDB</span>
          </Link>

          {/* Quick Nav Links */}
          <div className="hidden md:flex items-center gap-1 ml-4 border-l border-white/10 pl-4 text-xs font-bold text-gray-300">
            <Link 
              href="/" 
              className={`px-3 py-1.5 rounded-lg transition-colors ${pathname === '/' ? 'text-white bg-white/10' : 'hover:text-white hover:bg-white/5'}`}
            >
              Home
            </Link>
            <Link 
              href="/movies" 
              className={`px-3 py-1.5 rounded-lg transition-colors ${pathname.startsWith('/movies') ? 'text-white bg-white/10' : 'hover:text-white hover:bg-white/5'}`}
            >
              Movies
            </Link>
            <Link 
              href="/series" 
              className={`px-3 py-1.5 rounded-lg transition-colors ${pathname.startsWith('/series') ? 'text-white bg-white/10' : 'hover:text-white hover:bg-white/5'}`}
            >
              Series
            </Link>
          </div>
        </div>

        {/* Search Bar on Header */}
        <form onSubmit={handleSearchSubmit} className="relative hidden sm:block w-48 md:w-72">
          <input
            type="text"
            placeholder="Search movies, series..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full bg-white/5 border border-white/15 rounded-full py-1.5 pl-9 pr-4 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-accent focus:bg-black/60 transition-all"
          />
          <svg className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </form>
      </header>
    </>
  );
}
