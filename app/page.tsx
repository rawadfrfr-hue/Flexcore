'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
const MovieCard = dynamic(() => import('@/components/MovieCard'), { ssr: false });
import { SkeletonHero, SkeletonGrid } from '@/components/Skeleton';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { Movie, enrichMovieWithTmdb, isSeriesItem, sortNewestFirst, getMoviesCache, setMoviesCache } from '@/lib/movies';

export default function Home() {
  const [movies, setMovies] = useState<Movie[]>(getMoviesCache() || []);
  const [loading, setLoading] = useState(getMoviesCache() === null);

  useEffect(() => {
    const q = query(collection(db, 'movies'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Defer processing slightly to let page transitions run smoothly
      setTimeout(() => {
        const rawMovies = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Movie[];

        const sorted = sortNewestFirst(rawMovies);
        setMovies(sorted);
        setMoviesCache(sorted);
        setLoading(false);

        const currentHero = sorted.find(m => (m as any).isFeatured === true) || (sorted.length > 0 ? sorted[0] : null);

        // Only enrich the hero movie in background for banner backdrop if missing
        if (currentHero && (!currentHero.backdrops || currentHero.backdrops.length === 0)) {
          enrichMovieWithTmdb(currentHero).then(enrichedHero => {
            setMovies(prev => prev.map(m => m.id === enrichedHero.id ? enrichedHero : m));
          });
        }
      }, 50);
    });

    return () => unsubscribe();
  }, []);

  const featuredMovie = movies.find(m => (m as any).isFeatured === true);
  const heroMovie = featuredMovie || (movies.length > 0 ? movies[0] : null);

  const moviesList = movies.filter(m => !isSeriesItem(m));
  const seriesList = movies.filter(m => isSeriesItem(m));

  return (
    <div className="relative min-h-screen flex flex-col font-sans bg-[#08080a] text-white">
      {/* Background Radial Glow */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(circle,rgba(229,9,20,0.15)_0%,transparent_70%)] z-0 pointer-events-none"></div>

      {/* Shared Navbar */}

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
        
        {/* Featured Hero Banner or Skeleton */}
        {loading ? (
          <SkeletonHero />
        ) : heroMovie ? (
          <section className="relative w-full aspect-[21/9] min-h-[320px] md:min-h-[420px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex items-end p-6 md:p-10 group select-none">
            {/* Background Image */}
            <Image
              src={heroMovie.backdrops && heroMovie.backdrops.length > 0 ? heroMovie.backdrops[0] : heroMovie.posterUrl}
              alt={heroMovie.title}
              fill
              priority
              className="object-cover object-top brightness-60 group-hover:scale-105 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#08080a] via-[#08080a]/60 to-transparent"></div>

            {/* Content */}
            <div className="relative z-10 max-w-2xl space-y-3">
              <div className="flex items-center gap-2">
                <span className="bg-accent text-white text-[10px] font-black uppercase px-2.5 py-1 rounded tracking-widest shadow">
                  FEATURED {heroMovie.type === 'series' ? 'SERIES' : 'MOVIE'}
                </span>
                {heroMovie.voteAverage && (
                  <span className="bg-black/90 text-yellow-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-yellow-500/30 shadow-sm">
                    ★ {heroMovie.voteAverage.toFixed(1)}
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-md">
                {heroMovie.title}
              </h1>

              {heroMovie.tagline && (
                <p className="text-accent text-xs sm:text-sm font-semibold italic">
                  &ldquo;{heroMovie.tagline}&rdquo;
                </p>
              )}

              <p className="text-gray-300 text-xs sm:text-sm line-clamp-2 leading-relaxed">
                {heroMovie.description}
              </p>

              <div className="pt-2 flex items-center gap-3">
                <Link
                  href={`/watch/${heroMovie.id}`}
                  className="bg-accent hover:bg-accent/80 text-white font-extrabold px-6 py-3 rounded-xl text-sm flex items-center gap-2 click-effect active:scale-95 shadow-lg shadow-accent/30 touch-manipulation"
                >
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                    <path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445z"/>
                  </svg>
                  <span>Watch Full Screen</span>
                </Link>

                {heroMovie.releaseDate && (
                  <span className="text-xs text-gray-400 bg-white/5 border border-white/10 px-3 py-2 rounded-xl">
                    {heroMovie.releaseDate.substring(0, 4)} • {heroMovie.genre}
                  </span>
                )}
              </div>
            </div>
          </section>
        ) : null}

        {/* Quick Category Pills */}
        <section className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none select-none">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-2">Categories:</span>
          <Link href="/movies/bollywood" className="shrink-0 text-xs bg-white/5 hover:bg-white/10 hover:border-accent text-gray-300 border border-white/10 px-3.5 py-1.5 rounded-full font-semibold click-effect active:scale-95 touch-manipulation">
            🎬 BollyWood
          </Link>
          <Link href="/movies/hollywood" className="shrink-0 text-xs bg-white/5 hover:bg-white/10 hover:border-accent text-gray-300 border border-white/10 px-3.5 py-1.5 rounded-full font-semibold click-effect active:scale-95 touch-manipulation">
            🎥 HollyWood
          </Link>
          <Link href="/movies/hindi-dubbed" className="shrink-0 text-xs bg-white/5 hover:bg-white/10 hover:border-accent text-gray-300 border border-white/10 px-3.5 py-1.5 rounded-full font-semibold click-effect active:scale-95 touch-manipulation">
            🎙️ Hindi Dubbed
          </Link>
          <Link href="/movies/south-hindi" className="shrink-0 text-xs bg-white/5 hover:bg-white/10 hover:border-accent text-gray-300 border border-white/10 px-3.5 py-1.5 rounded-full font-semibold click-effect active:scale-95 touch-manipulation">
            🔥 South Hindi
          </Link>
          <Link href="/movies/web-series" className="shrink-0 text-xs bg-white/5 hover:bg-white/10 hover:border-accent text-gray-300 border border-white/10 px-3.5 py-1.5 rounded-full font-semibold click-effect active:scale-95 touch-manipulation">
            📺 Web Series
          </Link>
        </section>

        {/* Movies Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>🎬</span> Trending Movies
            </h2>
            <Link href="/movies" className="text-xs text-accent hover:underline font-bold click-effect">
              View All Movies →
            </Link>
          </div>

          {loading ? (
            <SkeletonGrid count={6} />
          ) : moviesList.length === 0 ? (
            <div className="text-center py-10 bg-white/5 rounded-xl text-gray-400 text-sm">No movies found.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {moviesList.slice(0, 12).map(movie => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          )}
        </section>

        {/* Web Series Section */}
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>📺</span> Latest Web Series & Shows
            </h2>
            <Link href="/series" className="text-xs text-accent hover:underline font-bold click-effect">
              View All Web Series →
            </Link>
          </div>

          {loading ? (
            <SkeletonGrid count={6} />
          ) : seriesList.length === 0 ? (
            <div className="text-center py-10 bg-white/5 rounded-xl text-gray-400 text-sm">No web series found.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {seriesList.slice(0, 12).map(series => (
                <MovieCard key={series.id} movie={series} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
