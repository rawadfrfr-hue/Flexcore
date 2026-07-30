'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import MovieCard from '@/components/MovieCard';
import { SkeletonWatch } from '@/components/Skeleton';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, query, limit } from 'firebase/firestore';
import { Movie, enrichMovieWithTmdb, formatRuntime } from '@/lib/movies';

type ServerSource = 'vidsrc_to' | 'vidsrc_xyz' | 'vidsrc_me' | 'vidsrc_pro' | 'vidsrc_cc' | 'direct';

export default function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [relatedMovies, setRelatedMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  // VidSrc Streaming States
  const [selectedServer, setSelectedServer] = useState<ServerSource>('vidsrc_to');
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);
  const [showDownloadModal, setShowDownloadModal] = useState<boolean>(false);

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
        <SkeletonWatch />
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

  const isSeries = movie.type === 'series' || movie.genre.toLowerCase().includes('series') || movie.genre.toLowerCase().includes('drama') || movie.genre.toLowerCase().includes('anime');
  const tmdbId = movie.tmdbId;

  // Build VidSrc URL
  let embedUrl: string | null = null;
  if (tmdbId && selectedServer !== 'direct') {
    if (isSeries) {
      switch (selectedServer) {
        case 'vidsrc_to':
          embedUrl = `https://vidsrc.to/embed/tv/${tmdbId}/${selectedSeason}/${selectedEpisode}`;
          break;
        case 'vidsrc_xyz':
          embedUrl = `https://vidsrc.xyz/embed/tv/${tmdbId}/${selectedSeason}/${selectedEpisode}`;
          break;
        case 'vidsrc_me':
          embedUrl = `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${selectedSeason}&episode=${selectedEpisode}`;
          break;
        case 'vidsrc_pro':
          embedUrl = `https://vidsrc.pro/embed/tv/${tmdbId}/${selectedSeason}/${selectedEpisode}`;
          break;
        case 'vidsrc_cc':
          embedUrl = `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${selectedSeason}/${selectedEpisode}`;
          break;
        default:
          embedUrl = `https://vidsrc.to/embed/tv/${tmdbId}/${selectedSeason}/${selectedEpisode}`;
      }
    } else {
      switch (selectedServer) {
        case 'vidsrc_to':
          embedUrl = `https://vidsrc.to/embed/movie/${tmdbId}`;
          break;
        case 'vidsrc_xyz':
          embedUrl = `https://vidsrc.xyz/embed/movie/${tmdbId}`;
          break;
        case 'vidsrc_me':
          embedUrl = `https://vidsrc.me/embed/movie?tmdb=${tmdbId}`;
          break;
        case 'vidsrc_pro':
          embedUrl = `https://vidsrc.pro/embed/movie/${tmdbId}`;
          break;
        case 'vidsrc_cc':
          embedUrl = `https://vidsrc.cc/v2/embed/movie/${tmdbId}`;
          break;
        default:
          embedUrl = `https://vidsrc.to/embed/movie/${tmdbId}`;
      }
    }
  }

  const seasonsList = Array.from({ length: movie.seasonsCount || 5 }, (_, i) => i + 1);
  const episodesList = Array.from({ length: 24 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-[#08080a] text-white flex flex-col font-sans select-none">
      <Navbar />

      {/* Main Full-Screen Watch Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Back Button Bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-xs md:text-sm font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/10 transition-all click-effect touch-manipulation"
          >
            ← Back to Browse
          </Link>

          <span className="text-xs text-accent font-bold bg-accent/15 border border-accent/30 px-3 py-1 rounded-full uppercase tracking-wider">
            {isSeries ? `Web Series • S${selectedSeason} E${selectedEpisode}` : 'Movie'} • {movie.category || 'Featured'}
          </span>
        </div>

        {/* Server Selection Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0f0f14] p-3.5 rounded-2xl border border-white/10">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-300 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
            Streaming Server:
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {tmdbId && (
              <>
                <button
                  onClick={() => setSelectedServer('vidsrc_to')}
                  className={`shrink-0 text-xs px-3.5 py-1.5 rounded-xl font-bold transition-all click-effect touch-manipulation border ${
                    selectedServer === 'vidsrc_to'
                      ? 'bg-accent text-white border-accent shadow-md shadow-accent/20'
                      : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                  }`}
                >
                  ⚡ VidSrc Server 1
                </button>

                <button
                  onClick={() => setSelectedServer('vidsrc_xyz')}
                  className={`shrink-0 text-xs px-3.5 py-1.5 rounded-xl font-bold transition-all click-effect touch-manipulation border ${
                    selectedServer === 'vidsrc_xyz'
                      ? 'bg-accent text-white border-accent shadow-md shadow-accent/20'
                      : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                  }`}
                >
                  🚀 VidSrc Server 2
                </button>

                <button
                  onClick={() => setSelectedServer('vidsrc_me')}
                  className={`shrink-0 text-xs px-3.5 py-1.5 rounded-xl font-bold transition-all click-effect touch-manipulation border ${
                    selectedServer === 'vidsrc_me'
                      ? 'bg-accent text-white border-accent shadow-md shadow-accent/20'
                      : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                  }`}
                >
                  🎬 VidSrc Server 3
                </button>

                <button
                  onClick={() => setSelectedServer('vidsrc_pro')}
                  className={`shrink-0 text-xs px-3.5 py-1.5 rounded-xl font-bold transition-all click-effect touch-manipulation border ${
                    selectedServer === 'vidsrc_pro'
                      ? 'bg-accent text-white border-accent shadow-md shadow-accent/20'
                      : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                  }`}
                >
                  🌐 VidSrc Server 4
                </button>
              </>
            )}

            <button
              onClick={() => setSelectedServer('direct')}
              className={`shrink-0 text-xs px-3.5 py-1.5 rounded-xl font-bold transition-all click-effect touch-manipulation border ${
                selectedServer === 'direct'
                  ? 'bg-accent text-white border-accent shadow-md shadow-accent/20'
                  : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
              }`}
            >
              📽️ Direct MP4
            </button>
          </div>
        </div>

        {/* Series Season & Episode Controls */}
        {isSeries && tmdbId && (
          <div className="bg-[#0f0f14] p-4 rounded-2xl border border-white/10 space-y-4">
            {/* Seasons Row */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                Select Season:
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {seasonsList.map(sNum => (
                  <button
                    key={sNum}
                    onClick={() => {
                      setSelectedSeason(sNum);
                      setSelectedEpisode(1);
                    }}
                    className={`shrink-0 text-xs px-4 py-1.5 rounded-lg font-bold transition-all click-effect touch-manipulation ${
                      selectedSeason === sNum
                        ? 'bg-white text-black font-extrabold shadow-md'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    Season {sNum}
                  </button>
                ))}
              </div>
            </div>

            {/* Episodes Grid */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                Select Episode (Season {selectedSeason}):
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {episodesList.map(eNum => (
                  <button
                    key={eNum}
                    onClick={() => setSelectedEpisode(eNum)}
                    className={`shrink-0 min-w-[44px] h-9 text-xs rounded-lg font-bold transition-all flex items-center justify-center click-effect touch-manipulation ${
                      selectedEpisode === eNum
                        ? 'bg-accent text-white font-extrabold shadow-md border border-accent'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    EP {eNum}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Full Theater Mode Video Player */}
        <section className="relative w-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/15">
          <div className="w-full aspect-video md:aspect-[21/9] bg-black relative flex items-center justify-center">
            {embedUrl && selectedServer !== 'direct' ? (
              <iframe
                src={embedUrl}
                className="w-full h-full border-0"
                allowFullScreen
                allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                referrerPolicy="origin"
                title={movie.title}
              />
            ) : (
              <video 
                src={movie.videoUrl} 
                controls 
                autoPlay 
                controlsList="nodownload"
                className="w-full h-full object-contain"
              >
                Your browser does not support the video tag.
              </video>
            )}
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
              <button 
                onClick={() => setShowDownloadModal(true)}
                className="bg-accent hover:bg-accent/80 text-white px-6 py-3 rounded-xl text-sm font-extrabold transition-all shadow-lg shadow-accent/20 flex items-center gap-2 click-effect active:scale-95 touch-manipulation cursor-pointer"
              >
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                  <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                </svg>
                Download Options 📥
              </button>
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
                    className="aspect-video relative rounded-xl overflow-hidden border border-white/10 cursor-pointer hover:border-accent transition-all group click-effect touch-manipulation"
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

      {/* Automated VidSrc Download Options Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#12121a] border border-white/15 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowDownloadModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all"
            >
              ✕
            </button>

            <div className="space-y-1">
              <span className="text-xs font-bold text-accent uppercase tracking-wider">Automated Downloads</span>
              <h2 className="text-xl sm:text-2xl font-black text-white">Download {movie.title}</h2>
              <p className="text-xs text-gray-400">
                {isSeries ? `Selected: Season ${selectedSeason}, Episode ${selectedEpisode}` : 'Select a fast automated server source below.'}
              </p>
            </div>

            <div className="space-y-3">
              {tmdbId ? (
                <>
                  <a
                    href={isSeries ? `https://vidsrc.to/embed/tv/${tmdbId}/${selectedSeason}/${selectedEpisode}` : `https://vidsrc.to/embed/movie/${tmdbId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-between p-3.5 bg-white/5 hover:bg-accent/20 border border-white/10 hover:border-accent/40 rounded-2xl transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-xl bg-accent/20 border border-accent/40 text-accent font-extrabold flex items-center justify-center text-sm">
                        1080p
                      </span>
                      <div className="text-left">
                        <div className="text-xs font-bold text-white group-hover:text-accent transition-colors">⚡ VidSrc Fast Server 1</div>
                        <div className="text-[10px] text-gray-400">Full HD Stream & Download Link</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-accent bg-accent/10 px-3 py-1.5 rounded-xl border border-accent/20">Download ➔</span>
                  </a>

                  <a
                    href={isSeries ? `https://vidsrc.xyz/embed/tv/${tmdbId}/${selectedSeason}/${selectedEpisode}` : `https://vidsrc.xyz/embed/movie/${tmdbId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-between p-3.5 bg-white/5 hover:bg-accent/20 border border-white/10 hover:border-accent/40 rounded-2xl transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400 font-extrabold flex items-center justify-center text-sm">
                        720p
                      </span>
                      <div className="text-left">
                        <div className="text-xs font-bold text-white group-hover:text-accent transition-colors">🚀 VidSrc Server 2 (High Speed)</div>
                        <div className="text-[10px] text-gray-400">HD Fast Multi-Mirror</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-accent bg-accent/10 px-3 py-1.5 rounded-xl border border-accent/20">Download ➔</span>
                  </a>

                  <a
                    href={isSeries ? `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${selectedSeason}&episode=${selectedEpisode}` : `https://vidsrc.me/embed/movie?tmdb=${tmdbId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-between p-3.5 bg-white/5 hover:bg-accent/20 border border-white/10 hover:border-accent/40 rounded-2xl transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400 font-extrabold flex items-center justify-center text-sm">
                        480p
                      </span>
                      <div className="text-left">
                        <div className="text-xs font-bold text-white group-hover:text-accent transition-colors">🎬 VidSrc Server 3</div>
                        <div className="text-[10px] text-gray-400">Standard Quality Direct Stream</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-accent bg-accent/10 px-3 py-1.5 rounded-xl border border-accent/20">Download ➔</span>
                  </a>
                </>
              ) : null}

              {movie.videoUrl && (
                <a
                  href={movie.videoUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-between p-3.5 bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/40 rounded-2xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-extrabold flex items-center justify-center text-sm">
                      MP4
                    </span>
                    <div className="text-left">
                      <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">📁 Direct File Download</div>
                      <div className="text-[10px] text-gray-400">Direct MP4 Link</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">Direct File ➔</span>
                </a>
              )}
            </div>

            <div className="pt-2 border-t border-white/10 text-center">
              <button 
                onClick={() => setShowDownloadModal(false)}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
