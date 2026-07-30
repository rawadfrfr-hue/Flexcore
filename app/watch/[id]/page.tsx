'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import MovieCard from '@/components/MovieCard';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, query, limit } from 'firebase/firestore';
import { Movie, enrichMovieWithTmdb, formatRuntime } from '@/lib/movies';

export default function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [relatedMovies, setRelatedMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  useEffect(() => {
    async function loadMovie() {
      setLoading(true);
      try {
        const docRef = doc(db, 'movies', id);
        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {
          const rawMovie = { id: snapshot.id, ...snapshot.data() } as Movie;
          const enriched = await enrichMovieWithTmdb(rawMovie);
          setMovie(enriched);
        }

        // Fetch related movies
        const q = query(collection(db, 'movies'), limit(12));
        const allSnap = await getDocs(q);
        const rel = allSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as Movie))
          .filter(m => m.id !== id);
        setRelatedMovies(rel.slice(0, 6));
      } catch (err) {
        console.error("Error loading movie:", err);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadMovie();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08080a] text-white flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400 text-sm animate-pulse">Loading Full Screen Movie Player...</p>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-[#08080a] text-white flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-2">Movie Not Found</h1>
          <p className="text-gray-400 text-sm mb-6">The requested movie or series could not be located in our library.</p>
          <Link href="/" className="bg-accent hover:bg-accent/80 text-white font-bold px-6 py-2.5 rounded-lg text-sm transition-colors">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080a] text-white flex flex-col font-sans">
      <Navbar />

      {/* Main Full-Screen Watch Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Back Button Bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-xs md:text-sm font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/10 transition-colors"
          >
            ← Back to Browse
          </Link>

          <span className="text-xs text-accent font-bold bg-accent/15 border border-accent/30 px-3 py-1 rounded-full uppercase tracking-wider">
            {movie.type === 'series' ? 'Web Series' : 'Movie'} • {movie.category || 'Featured'}
          </span>
        </div>

        {/* Full Theater Mode Video Player */}
        <section className="relative w-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/15">
          <div className="w-full aspect-video md:aspect-[21/9] bg-black relative flex items-center justify-center">
            <video 
              src={movie.videoUrl} 
              controls 
              autoPlay 
              controlsList="nodownload"
              className="w-full h-full object-contain"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </section>

        {/* Movie Info & Detail Header */}
        <section className="bg-[#0f0f14] rounded-2xl p-6 md:p-8 border border-white/10 shadow-xl space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 border-b border-white/10">
            <div className="space-y-3 flex-1">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight">
                {movie.title}
              </h1>

              {movie.tagline && (
                <p className="text-accent text-sm md:text-base font-semibold italic">
                  &ldquo;{movie.tagline}&rdquo;
                </p>
              )}

              {/* Badges and Ratings */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs md:text-sm">
                <span className="bg-accent/20 border border-accent/40 text-accent font-bold px-3 py-1 rounded-md">
                  {movie.genre}
                </span>

                {movie.releaseDate && (
                  <span className="bg-white/10 text-white font-medium px-3 py-1 rounded-md">
                    📅 {movie.releaseDate.substring(0, 4)}
                  </span>
                )}

                {movie.runtime && (
                  <span className="bg-white/10 text-white font-medium px-3 py-1 rounded-md">
                    ⏱ {formatRuntime(movie.runtime)}
                  </span>
                )}

                {movie.voteAverage && (
                  <span className="flex items-center gap-1.5 bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-md border border-yellow-500/40 font-bold">
                    ★ {movie.voteAverage.toFixed(1)} {movie.voteCount ? `(${movie.voteCount.toLocaleString()} votes)` : ''}
                  </span>
                )}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3 shrink-0">
              <a 
                href={movie.videoUrl} 
                download 
                target="_blank"
                rel="noreferrer"
                className="bg-accent hover:bg-accent/80 text-white px-6 py-3 rounded-xl text-sm font-extrabold transition-all shadow-lg shadow-accent/20 flex items-center gap-2"
              >
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                  <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                </svg>
                Download MP4
              </a>
            </div>
          </div>

          {/* Overview Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-black tracking-wider text-gray-400 uppercase">Overview</h3>
            <p className="text-gray-200 text-sm sm:text-base leading-relaxed max-w-4xl">
              {movie.description}
            </p>
          </div>

          {/* Director & Cast Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/10">
            {movie.director && (
              <div>
                <h3 className="text-xs font-black tracking-wider text-gray-400 uppercase mb-1">Director / Creator</h3>
                <p className="text-white font-bold text-base">{movie.director}</p>
              </div>
            )}

            {movie.topCast && movie.topCast.length > 0 && (
              <div>
                <h3 className="text-xs font-black tracking-wider text-gray-400 uppercase mb-2">Top Cast</h3>
                <div className="flex flex-wrap gap-2">
                  {movie.topCast.map((actor, idx) => (
                    <span key={idx} className="bg-white/5 border border-white/10 text-gray-200 text-xs px-3 py-1 rounded-full font-medium">
                      {actor}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Screenshots Gallery */}
          {movie.backdrops && movie.backdrops.length > 0 && (
            <div className="pt-6 border-t border-white/10 space-y-3">
              <h3 className="text-xs font-black tracking-wider text-gray-400 uppercase">Screenshots & Movie Scenes</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {movie.backdrops.map((img, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setLightboxImg(img)}
                    className="aspect-video relative rounded-xl overflow-hidden border border-white/10 cursor-pointer hover:border-accent transition-all group"
                  >
                    <Image 
                      src={img} 
                      alt={`${movie.title} screenshot ${idx + 1}`} 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform" 
                      referrerPolicy="no-referrer" 
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold text-white">
                      🔍 Expand
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Related Content */}
        {relatedMovies.length > 0 && (
          <section className="space-y-4 pt-4">
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              More Movies & Series You Might Like
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {relatedMovies.map(rel => (
                <MovieCard key={rel.id} movie={rel} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Lightbox Modal for Screenshots */}
      {lightboxImg && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 cursor-pointer"
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
