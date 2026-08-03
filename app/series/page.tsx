'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
const InfiniteMovieGrid = dynamic(() => import('@/components/InfiniteMovieGrid'), { ssr: false });
import { SkeletonGrid } from '@/components/Skeleton';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { Movie, isSeriesItem, sortNewestFirst, getMoviesCache, setMoviesCache } from '@/lib/movies';

export default function SeriesPage() {
  const cached = getMoviesCache();
  const initialSeries = cached ? sortNewestFirst(cached.filter(m => isSeriesItem(m))) : [];
  const [series, setSeries] = useState<Movie[]>(initialSeries);
  const [loading, setLoading] = useState(cached === null);

  useEffect(() => {
    const q = query(collection(db, 'movies'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTimeout(() => {
        const rawMovies = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Movie[];
        setMoviesCache(rawMovies);

        // Filter only web series
        const seriesOnly = rawMovies.filter(m => isSeriesItem(m));

        const sorted = sortNewestFirst(seriesOnly);
        setSeries(sorted);
        setLoading(false);
      }, 50);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-[#08080a] text-white flex flex-col font-sans">

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <span>📺</span> All Web Series
            </h1>
            <p className="text-xs text-gray-400 mt-1">Browse all web series, K-Dramas, Anime & TV shows</p>
          </div>
          <span className="text-xs font-bold text-accent bg-accent/15 border border-accent/30 px-3 py-1 rounded-full">
            {series.length} Series
          </span>
        </div>

        {loading ? (
          <SkeletonGrid count={12} />
        ) : series.length === 0 ? (
          <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10 text-gray-400 text-sm">
            No web series found.
          </div>
        ) : (
          <InfiniteMovieGrid movies={series} />
        )}
      </main>
    </div>
  );
}
