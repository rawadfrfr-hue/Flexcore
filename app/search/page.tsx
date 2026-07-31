'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import MovieCard from '@/components/MovieCard';
import { SkeletonGrid } from '@/components/Skeleton';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { Movie, sortNewestFirst } from '@/lib/movies';

function SearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const firestoreQuery = query(collection(db, 'movies'));
    const unsubscribe = onSnapshot(firestoreQuery, async (snapshot) => {
      const rawMovies = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Movie[];

      const queryLower = q.toLowerCase();
      const filtered = rawMovies.filter(m => {
        if (!q) return true;
        const titleMatch = m.title.toLowerCase().includes(queryLower);
        const genreMatch = m.genre.toLowerCase().includes(queryLower);
        const catMatch = (m.category || '').toLowerCase().includes(queryLower);
        const directorMatch = (m.director || '').toLowerCase().includes(queryLower);
        return titleMatch || genreMatch || catMatch || directorMatch;
      });

      const sorted = sortNewestFirst(filtered);
      setMovies(sorted);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [q]);

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <span>🔍</span> Search Results {q ? `for "${q}"` : ''}
          </h1>
          <p className="text-xs text-gray-400 mt-1">Direct URL route: /search?q={q}</p>
        </div>
        <span className="text-xs font-bold text-accent bg-accent/15 border border-accent/30 px-3 py-1 rounded-full">
          {movies.length} Results
        </span>
      </div>

      {loading ? (
        <SkeletonGrid count={12} />
      ) : movies.length === 0 ? (
        <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10 text-gray-400 text-sm">
          No movies or series matching &ldquo;{q}&rdquo; found.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {movies.map(item => (
            <MovieCard key={item.id} movie={item} />
          ))}
        </div>
      )}
    </main>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-[#08080a] text-white flex flex-col font-sans">
      <Navbar />
      <Suspense fallback={<div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8"><SkeletonGrid count={12} /></div>}>
        <SearchContent />
      </Suspense>
    </div>
  );
}
