'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import Image from 'next/image';

interface Movie {
  id: string;
  title: string;
  genre: string;
  description: string;
  posterUrl: string;
  videoUrl: string;
  type?: 'movie' | 'series' | string;
  category?: string;
  runtime?: number;
  voteAverage?: number;
  voteCount?: number;
  releaseDate?: string;
  director?: string;
  tagline?: string;
  topCast?: string[];
  backdrops?: string[];
}

const TMDB_API_KEY = "40997d508f165094637f1d6f8a9ab148";

async function enrichMovieWithTmdb(movie: Movie): Promise<Movie> {
  // If movie already has complete TMDB metadata, return as is
  if (
    movie.backdrops &&
    movie.backdrops.length > 0 &&
    movie.topCast &&
    movie.topCast.length > 0 &&
    movie.runtime &&
    movie.director
  ) {
    return movie;
  }

  try {
    const searchRes = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(movie.title)}`
    );
    const searchData = await searchRes.json();

    if (searchData.results && searchData.results.length > 0) {
      const tmdbId = searchData.results[0].id;
      const detailsRes = await fetch(
        `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=credits,images`
      );
      const details = await detailsRes.json();

      const directorObj = details.credits?.crew?.find((c: any) => c.job === 'Director');
      const topCast = details.credits?.cast
        ? details.credits.cast.slice(0, 8).map((c: any) => c.name)
        : undefined;
      const backdrops = details.images?.backdrops
        ? details.images.backdrops.slice(0, 8).map((img: any) => `https://image.tmdb.org/t/p/w1280${img.file_path}`)
        : undefined;

      return {
        ...movie,
        runtime: movie.runtime || details.runtime || undefined,
        voteAverage: movie.voteAverage || details.vote_average || undefined,
        voteCount: movie.voteCount || details.vote_count || undefined,
        releaseDate: movie.releaseDate || details.release_date || undefined,
        tagline: movie.tagline || details.tagline || undefined,
        director: movie.director || directorObj?.name || undefined,
        topCast: movie.topCast && movie.topCast.length > 0 ? movie.topCast : topCast,
        backdrops: movie.backdrops && movie.backdrops.length > 0 ? movie.backdrops : backdrops,
      };
    }
  } catch (err) {
    console.warn("TMDB enrichment failed for:", movie.title, err);
  }

  return movie;
}

export default function Home() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<{ type?: 'movie' | 'series' | 'all'; category?: string; label?: string }>({ type: 'all' });

  useEffect(() => {
    const q = query(collection(db, 'movies'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const rawMovies = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Movie[];

      const reversed = rawMovies.reverse();
      setMovies(reversed);

      // Async enrichment step
      const enrichedPromises = reversed.map(m => enrichMovieWithTmdb(m));
      const enrichedMovies = await Promise.all(enrichedPromises);
      setMovies(enrichedMovies);
    });

    return () => unsubscribe();
  }, []);

  const filteredMovies = movies.filter(movie => {
    // 1. Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = movie.title.toLowerCase().includes(q);
      const matchGenre = movie.genre.toLowerCase().includes(q);
      const matchCategory = movie.category && movie.category.toLowerCase().includes(q);
      if (!matchTitle && !matchGenre && !matchCategory) return false;
    }

    // 2. Type filter
    if (activeFilter.type === 'movie') {
      if (movie.type && movie.type !== 'movie') return false;
    } else if (activeFilter.type === 'series') {
      const isSeriesGenre = movie.genre.toLowerCase().includes('series') || movie.genre.toLowerCase().includes('anime') || movie.genre.toLowerCase().includes('drama');
      if (movie.type !== 'series' && !isSeriesGenre) return false;
    }

    // 3. Category filter
    if (activeFilter.category) {
      const targetCat = activeFilter.category.toLowerCase();
      const movieCat = (movie.category || '').toLowerCase();
      const movieGenre = (movie.genre || '').toLowerCase();
      const movieTitle = (movie.title || '').toLowerCase();

      const matchesCat = movieCat === targetCat || 
                         movieGenre.includes(targetCat) || 
                         movieTitle.includes(targetCat);
      if (!matchesCat) return false;
    }

    return true;
  });

  // Top movie for hero section
  const heroMovie = movies.length > 0 ? movies[0] : null;

  const formatRuntime = (mins?: number) => {
    if (!mins) return null;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return hrs > 0 ? `${hrs}h ${remMins}m` : `${remMins}m`;
  };

  return (
    <div className="relative min-h-screen flex flex-col font-sans bg-[#08080a] text-white">
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(circle,rgba(229,9,20,0.15)_0%,transparent_70%)] z-0 pointer-events-none"></div>
      
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
              <div className="text-xl font-black text-accent tracking-tight flex items-center gap-2">
                <span>FLIXCORE</span>
                <span className="text-[9px] bg-accent/20 border border-accent/40 text-accent px-1.5 py-0.5 rounded uppercase">MENU</span>
              </div>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>

            <nav className="space-y-6 flex-1">
              {/* Home All Option */}
              <button
                onClick={() => {
                  setActiveFilter({ type: 'all' });
                  setIsDrawerOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${
                  activeFilter.type === 'all' && !activeFilter.category
                    ? 'bg-accent text-white shadow'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span>🏠</span> All Content
              </button>

              {/* MOVIES Section */}
              <div>
                <div className="text-xs font-black tracking-wider text-accent uppercase px-3 mb-2 flex items-center gap-1.5">
                  <span>🎬</span> MOVIES
                </div>
                <div className="space-y-1 pl-2">
                  <button
                    onClick={() => {
                      setActiveFilter({ type: 'movie', label: 'All Movies' });
                      setIsDrawerOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
                      activeFilter.type === 'movie' && !activeFilter.category
                        ? 'bg-accent/20 text-accent border border-accent/30'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    All Movies
                  </button>
                  {['HINDI', 'HOLLYWOOD', 'HINDI DUBBED', 'SOUTH INDIAN', 'BANGLA'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => {
                        setActiveFilter({ type: 'movie', category: cat, label: `Movies > ${cat}` });
                        setIsDrawerOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
                        activeFilter.type === 'movie' && activeFilter.category === cat
                          ? 'bg-accent text-white font-bold'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* SERIES Section */}
              <div>
                <div className="text-xs font-black tracking-wider text-accent uppercase px-3 mb-2 flex items-center gap-1.5">
                  <span>📺</span> SERIES
                </div>
                <div className="space-y-1 pl-2">
                  <button
                    onClick={() => {
                      setActiveFilter({ type: 'series', label: 'All Series' });
                      setIsDrawerOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
                      activeFilter.type === 'series' && !activeFilter.category
                        ? 'bg-accent/20 text-accent border border-accent/30'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    All Series
                  </button>
                  {['BANGLA', 'HOLLYWOOD', 'Anime', 'HINDI', 'BANGLA DUBBED', 'K-DRAMA'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => {
                        setActiveFilter({ type: 'series', category: cat, label: `Series > ${cat}` });
                        setIsDrawerOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
                        activeFilter.type === 'series' && activeFilter.category === cat
                          ? 'bg-accent text-white font-bold'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </nav>

            <div className="pt-4 border-t border-white/10 text-[11px] text-gray-500 text-center">
              FlixCore Streaming Platform
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-[80px] flex items-center justify-between px-6 md:px-10 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors cursor-pointer"
              aria-label="Open Menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>

            <div className="text-[22px] md:text-[26px] font-black tracking-tighter text-accent flex items-center gap-2 cursor-pointer" onClick={() => setActiveFilter({ type: 'all' })}>
              <span>FLIXCORE</span>
              <span className="text-[10px] bg-accent/20 border border-accent/40 text-accent font-semibold px-2 py-0.5 rounded tracking-normal uppercase hidden sm:inline-block">TMDB Enhanced</span>
            </div>
          </div>
          
          <div className="hidden md:flex bg-white/5 border border-white/10 rounded-lg px-5 py-2.5 w-[400px] items-center gap-2.5 backdrop-blur-md focus-within:border-accent/60 transition-colors">
            <svg width="16" height="16" fill="rgba(255,255,255,0.5)" viewBox="0 0 16 16">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
            </svg>
            <input 
              type="text" 
              placeholder="Search movies, genres..." 
              className="bg-transparent border-none text-white w-full outline-none text-sm placeholder-white/40"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        {/* Mobile Search */}
        <div className="md:hidden px-6 pt-2 pb-4 relative z-10">
           <div className="flex bg-white/5 border border-white/10 rounded-lg px-4 py-2 items-center gap-2 backdrop-blur-md">
             <svg width="14" height="14" fill="rgba(255,255,255,0.5)" viewBox="0 0 16 16">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
            </svg>
            <input 
              type="text" 
              placeholder="Search movies or genres..." 
              className="bg-transparent border-none text-white w-full outline-none text-sm placeholder-white/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
           </div>
        </div>

        {/* Hero Banner Section */}
        {heroMovie && !searchQuery && (
          <main className="relative min-h-[460px] md:min-h-[520px] px-6 md:px-[60px] flex flex-col justify-end pb-10 my-4">
            <div className="absolute inset-0 z-[-1] overflow-hidden rounded-2xl mx-4 md:mx-10 border border-white/10">
               <Image 
                 src={(heroMovie.backdrops && heroMovie.backdrops.length > 0) ? heroMovie.backdrops[0] : heroMovie.posterUrl} 
                 alt="Hero background" 
                 fill 
                 priority
                 className="object-cover brightness-75 scale-105 filter blur-[1px]" 
                 referrerPolicy="no-referrer" 
               />
               <div className="absolute inset-0 bg-gradient-to-t from-[#08080a] via-[#08080a]/70 to-transparent"></div>
               <div className="absolute inset-0 bg-gradient-to-r from-[#08080a] via-[#08080a]/50 to-transparent"></div>
            </div>

            <div className="max-w-[750px] relative z-10 pt-20">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-accent text-white px-2.5 py-1 text-[10px] md:text-xs font-extrabold rounded tracking-wider uppercase">
                  FEATURED MOVIE
                </span>
                {heroMovie.releaseDate && (
                  <span className="bg-white/10 text-white/90 text-[10px] md:text-xs px-2 py-0.5 rounded font-medium">
                    {heroMovie.releaseDate.substring(0, 4)}
                  </span>
                )}
              </div>

              <h1 className="text-[36px] sm:text-[48px] md:text-[60px] font-black leading-tight mb-2 drop-shadow-md text-white">
                {heroMovie.title}
              </h1>

              {heroMovie.tagline && (
                <p className="text-accent text-xs md:text-sm font-semibold italic mb-3">
                  &ldquo;{heroMovie.tagline}&rdquo;
                </p>
              )}

              {/* Meta Badges */}
              <div className="flex flex-wrap items-center gap-3 text-white/80 text-xs md:text-sm mb-4 font-medium">
                <span className="bg-accent/20 border border-accent/40 text-accent font-semibold px-2.5 py-0.5 rounded">
                  {heroMovie.genre}
                </span>
                {heroMovie.runtime && (
                  <span className="flex items-center gap-1">
                    ⏱ {formatRuntime(heroMovie.runtime)}
                  </span>
                )}
                {heroMovie.voteAverage && (
                  <span className="flex items-center gap-1 bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded border border-yellow-500/30">
                    <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                    {heroMovie.voteAverage.toFixed(1)} / 10
                  </span>
                )}
                {heroMovie.director && (
                  <span className="text-gray-300">
                    Director: <strong className="text-white">{heroMovie.director}</strong>
                  </span>
                )}
              </div>

              {heroMovie.topCast && heroMovie.topCast.length > 0 && (
                <div className="text-xs text-gray-300 mb-4 line-clamp-1">
                  <span className="text-gray-400 font-semibold uppercase tracking-wider mr-1.5">Cast:</span>
                  {heroMovie.topCast.join(', ')}
                </div>
              )}

              <p className="text-white/70 leading-relaxed mb-6 text-sm md:text-base line-clamp-3 max-w-[650px]">
                {heroMovie.description}
              </p>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedMovie(heroMovie)}
                  className="bg-accent text-white px-8 py-3 rounded-lg font-bold cursor-pointer hover:bg-accent/80 transition-all flex items-center gap-2 shadow-lg shadow-accent/25"
                >
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                    <path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445z"/>
                  </svg>
                  Watch Movie
                </button>
              </div>
            </div>
          </main>
        )}

        {/* Movie Section / Grid */}
        <section className="flex-1 px-6 md:px-[50px] mt-6 pb-20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl md:text-2xl text-white font-bold tracking-tight">
                {searchQuery 
                  ? `Search Results for "${searchQuery}"` 
                  : activeFilter.label 
                    ? activeFilter.label 
                    : 'All Movies & Series'}
              </h2>
              {(activeFilter.type !== 'all' || activeFilter.category || searchQuery) && (
                <button 
                  onClick={() => {
                    setActiveFilter({ type: 'all' });
                    setSearchQuery('');
                  }}
                  className="text-xs bg-accent/20 hover:bg-accent/30 text-accent border border-accent/40 px-2.5 py-1 rounded-full font-semibold transition-colors flex items-center gap-1"
                >
                  Clear Filter ✕
                </button>
              )}
            </div>
            <span className="text-xs text-gray-400 bg-white/5 px-3 py-1 rounded-full border border-white/10 self-start sm:self-auto">
              {filteredMovies.length} Items
            </span>
          </div>
          
          {filteredMovies.length === 0 ? (
            <div className="text-white/40 text-sm py-12 text-center bg-white/5 rounded-xl border border-white/10">
              No movies or series found matching your criteria.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {filteredMovies.map(movie => (
                <div 
                  key={movie.id} 
                  className="cursor-pointer group flex flex-col"
                  onClick={() => setSelectedMovie(movie)}
                >
                  <div className="w-full aspect-[2/3] bg-[#1a1a20] rounded-xl relative overflow-hidden border border-white/10 shadow-lg group-hover:border-accent/50 transition-all duration-300">
                    <Image 
                      src={movie.posterUrl} 
                      alt={movie.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-all duration-300 brightness-90 group-hover:brightness-100"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Top rating badge */}
                    {movie.voteAverage && (
                      <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md text-yellow-400 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-yellow-500/30">
                        ★ {movie.voteAverage.toFixed(1)}
                      </div>
                    )}

                    {movie.releaseDate && (
                      <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md text-white/90 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-white/20">
                        {movie.releaseDate.substring(0, 4)}
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <span className="bg-accent text-white text-xs font-bold py-1.5 px-3 rounded w-full text-center shadow">
                        Watch Now
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5">
                    <div className="text-sm font-bold truncate text-white/90 group-hover:text-accent transition-colors">
                      {movie.title}
                    </div>
                    <div className="text-xs text-gray-400 flex items-center justify-between gap-1 mt-1">
                      <span className="truncate">{movie.genre}</span>
                      {movie.runtime && (
                        <span className="shrink-0 text-gray-400 text-[11px]">
                          {formatRuntime(movie.runtime)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Movie Details & Watch Modal */}
      {selectedMovie && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
          <div className="w-full max-w-[900px] bg-[#0f0f13] rounded-2xl border border-white/15 flex flex-col overflow-hidden shadow-2xl my-auto max-h-[92vh]">
            
            {/* Video Player Header */}
            <div className="relative w-full aspect-video bg-black shrink-0">
              <video 
                src={selectedMovie.videoUrl} 
                controls 
                autoPlay 
                className="w-full h-full object-contain"
                controlsList="nodownload"
              >
                Your browser does not support the video tag.
              </video>
            </div>
            
            {/* Content Details */}
            <div className="p-5 md:p-6 overflow-y-auto space-y-4">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-2xl font-black text-white mb-1.5">{selectedMovie.title}</h3>
                  
                  {selectedMovie.tagline && (
                    <p className="text-accent text-xs md:text-sm font-semibold italic mb-2">
                      &ldquo;{selectedMovie.tagline}&rdquo;
                    </p>
                  )}

                  <div className="flex items-center gap-2 flex-wrap text-xs md:text-sm text-gray-300">
                    <span className="text-xs text-accent font-bold px-2.5 py-0.5 bg-accent/15 border border-accent/30 rounded-md">
                      {selectedMovie.genre}
                    </span>
                    {selectedMovie.releaseDate && (
                      <span className="bg-white/10 px-2 py-0.5 rounded text-xs text-white">
                        {selectedMovie.releaseDate.substring(0, 4)}
                      </span>
                    )}
                    {selectedMovie.runtime && (
                      <span className="bg-white/10 px-2 py-0.5 rounded text-xs text-white">
                        ⏱ {formatRuntime(selectedMovie.runtime)}
                      </span>
                    )}
                    {selectedMovie.voteAverage && (
                      <span className="flex items-center gap-1 bg-yellow-500/20 text-yellow-300 px-2.5 py-0.5 rounded-md border border-yellow-500/30 text-xs font-bold">
                        <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                        {selectedMovie.voteAverage.toFixed(1)} {selectedMovie.voteCount ? `(${selectedMovie.voteCount.toLocaleString()} votes)` : ''}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <a 
                    href={selectedMovie.videoUrl} 
                    download 
                    target="_blank"
                    rel="noreferrer"
                    className="bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shadow"
                  >
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                      <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                    </svg>
                    Download
                  </a>
                  <button 
                    onClick={() => setSelectedMovie(null)}
                    className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-1">Overview</span>
                <p className="text-white/80 text-sm leading-relaxed">
                  {selectedMovie.description}
                </p>
              </div>

              {/* Director */}
              {selectedMovie.director && (
                <div>
                  <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-1">Director</span>
                  <p className="text-white font-medium text-sm">{selectedMovie.director}</p>
                </div>
              )}
              
              {/* Top Cast */}
              {selectedMovie.topCast && selectedMovie.topCast.length > 0 && (
                <div>
                  <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Top Cast</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedMovie.topCast.map((actor, idx) => (
                      <span key={idx} className="bg-white/5 border border-white/10 text-gray-200 text-xs px-3 py-1 rounded-full">
                        {actor}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Screenshots Gallery */}
              {selectedMovie.backdrops && selectedMovie.backdrops.length > 0 && (
                <div>
                  <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Screenshots & Scenes</span>
                  <div className="flex gap-3 overflow-x-auto pb-2 snap-x hide-scrollbar">
                    {selectedMovie.backdrops.map((img, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => setLightboxImg(img)}
                        className="shrink-0 w-56 sm:w-64 aspect-video relative rounded-lg overflow-hidden snap-start border border-white/10 cursor-pointer hover:border-accent transition-all group"
                      >
                        <Image 
                          src={img} 
                          alt={`${selectedMovie.title} scene ${idx + 1}`} 
                          fill 
                          className="object-cover group-hover:scale-105 transition-transform" 
                          referrerPolicy="no-referrer" 
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold text-white">
                          🔍 Click to Expand
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Screenshots */}
      {lightboxImg && (
        <div 
          className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightboxImg(null)}
        >
          <div className="relative max-w-[1200px] w-full aspect-video rounded-xl overflow-hidden border border-white/20">
            <Image src={lightboxImg} alt="Enlarged screenshot" fill className="object-contain" referrerPolicy="no-referrer" />
          </div>
        </div>
      )}
    </div>
  );
}

