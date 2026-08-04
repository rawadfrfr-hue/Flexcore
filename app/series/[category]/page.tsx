'use client';

import { useState, useEffect, use } from 'react';
import dynamic from 'next/dynamic';
const InfiniteMovieGrid = dynamic(() => import('@/components/InfiniteMovieGrid'), { ssr: false });
import { SkeletonGrid } from '@/components/Skeleton';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { Movie, isSeriesItem, matchesCategory, sortNewestFirst } from '@/lib/movies';

const SERIES_CATEGORY_NAMES: Record<string, string> = {
  'bollywood': 'BollyWood',
  'hollywood': 'HollyWood',
  'hindi-dubbed': 'Hindi Dubbed',
  'south-hindi': 'South Hindi',
  'web-series': 'Web Series',
};

export default function SeriesCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = use(params);
  const [series, setSeries] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  const categoryTitle = SERIES_CATEGORY_NAMES[category.toLowerCase()] || `${category.toUpperCase()}`;

  useEffect(() => {
    const q = query(collection(db, 'movies'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const rawMovies = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Movie[];

      const filtered = rawMovies.filter(m => {
        return matchesCategory(m, category);
      });

      const sorted = sortNewestFirst(filtered);
      setSeries(sorted);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [category]);

  return (
    <div className="min-h-screen bg-[#08080a] text-white flex flex-col font-sans">
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <span>📺</span> {categoryTitle}
            </h1>
            <p className="text-xs text-gray-400 mt-1">Direct URL route: /series/{category}</p>
          </div>
          <span className="text-xs font-bold text-accent bg-accent/15 border border-accent/30 px-3 py-1 rounded-full">
            {series.length} Items
          </span>
        </div>

        {loading ? (
          <SkeletonGrid count={12} />
        ) : series.length === 0 ? (
          <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10 text-gray-400 text-sm">
            No series found in this category.
          </div>
        ) : (
          <InfiniteMovieGrid movies={series} />
        )}
      </main>
    </div>
  );
}
