'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
const InfiniteMovieGrid = dynamic(() => import('@/components/InfiniteMovieGrid'), { ssr: false });
import { SkeletonGrid } from '@/components/Skeleton';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { Movie, sortNewestFirst } from '@/lib/movies';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQ = searchParams.get('q') || '';

  const [inputVal, setInputVal] = useState(initialQ);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQ);
  
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce user input (300ms delay for better performance)
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = inputVal.trim();
      setDebouncedQuery(trimmed);
      
      // Silently update URL without triggering heavy Next.js re-renders
      if (trimmed) {
        window.history.replaceState(null, '', `/search?q=${encodeURIComponent(trimmed)}`);
      } else {
        window.history.replaceState(null, '', '/search');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputVal]);

  // Fetch Firestore movies snapshot
  useEffect(() => {
    const firestoreQuery = query(collection(db, 'movies'));
    const unsubscribe = onSnapshot(firestoreQuery, (snapshot) => {
      const rawMovies = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Movie[];

      setAllMovies(sortNewestFirst(rawMovies));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter movies based on search query
  const queryLower = debouncedQuery.toLowerCase();
  
  const searchResults = allMovies.filter(m => {
    if (!queryLower) return true;

    const titleMatch = (m.title || '').toLowerCase().includes(queryLower);
    const genreMatch = (m.genre || '').toLowerCase().includes(queryLower);
    const catMatch = (m.category || '').toLowerCase().includes(queryLower);
    const directorMatch = (m.director || '').toLowerCase().includes(queryLower);
    return titleMatch || genreMatch || catMatch || directorMatch;
  });

  const handleClear = () => {
    setInputVal('');
    setDebouncedQuery('');
    router.replace('/search', { scroll: false });
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">
      
      {/* Sticky Top Search Header Box */}
      <div className="sticky top-16 sm:top-20 z-30 bg-[#0d0d12]/95 border border-white/10 rounded-2xl md:rounded-3xl p-3.5 md:p-5 shadow-xl backdrop-blur-md transition-all">
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xl md:text-2xl">🔍</span>
            <h1 className="text-lg md:text-xl font-extrabold text-white tracking-tight">
              Search
            </h1>
          </div>
          {debouncedQuery && (
            <span className="text-xs font-bold text-accent bg-accent/15 border border-accent/30 px-3 py-1 rounded-full">
              {searchResults.length} {searchResults.length === 1 ? 'Result' : 'Results'}
            </span>
          )}
        </div>

        {/* Prominent Search Input Box */}
        <div className="relative flex items-center">
          <svg 
            className="w-5 h-5 text-accent absolute left-4 pointer-events-none" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>

          <input
            ref={inputRef}
            type="text"
            autoFocus
            placeholder="Search movies, web series, genre..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="w-full bg-black/70 border-2 border-white/15 focus:border-accent text-white placeholder-gray-400 font-medium text-sm md:text-base rounded-xl md:rounded-2xl py-3 pl-12 pr-12 focus:outline-none focus:ring-4 focus:ring-accent/20 transition-all shadow-inner"
          />

          {inputVal && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white text-xs transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Results Grid */}
      <div className="space-y-4 pt-1">
        {debouncedQuery && (
          <div className="text-sm font-semibold text-gray-300 flex items-center justify-between px-1">
            <span>Showing results for &ldquo;<span className="text-white font-bold">{debouncedQuery}</span>&rdquo;</span>
            <span className="text-xs text-gray-500">{searchResults.length} found</span>
          </div>
        )}

        {loading ? (
          <SkeletonGrid count={12} />
        ) : searchResults.length === 0 ? (
          <div className="text-center py-20 bg-[#0d0d12] rounded-3xl border border-white/10 p-8 space-y-3">
            <div className="text-4xl">🎬</div>
            <h3 className="text-lg font-bold text-white">No matches found</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              We couldn&apos;t find any movies or web series matching &ldquo;{debouncedQuery}&rdquo;. Try searching with another keyword.
            </p>
            <button
              onClick={handleClear}
              className="mt-2 px-5 py-2 bg-accent hover:bg-accent/80 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer inline-block"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <InfiniteMovieGrid movies={searchResults} />
        )}
      </div>
    </main>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-[#08080a] text-white flex flex-col font-sans">
      <Suspense fallback={<div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8"><SkeletonGrid count={12} /></div>}>
        <SearchContent />
      </Suspense>
    </div>
  );
}
