'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import MovieCard from '@/components/MovieCard';
import { SkeletonWatch } from '@/components/Skeleton';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, query, limit } from 'firebase/firestore';
import { Movie, enrichMovieWithTmdb, formatRuntime } from '@/lib/movies';

type ServerSource = 'vidsrc' | 'autoembed' | 'vidlink' | 'twoembed' | 'smashystream' | 'vidsrc_icu' | 'direct';

export default function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [relatedMovies, setRelatedMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  // VidSrc & Multi-Provider Streaming States
  const [selectedServer, setSelectedServer] = useState<ServerSource>('vidsrc');
  const [selectedSubServer, setSelectedSubServer] = useState<number>(1);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);
  const [showDownloadModal, setShowDownloadModal] = useState<boolean>(false);
  const [downloadOptions, setDownloadOptions] = useState<any[]>([]);
  const [downloadLoading, setDownloadLoading] = useState<boolean>(false);

  // Fetch Automated Downloads when modal is opened or season/episode changes
  useEffect(() => {
    if (showDownloadModal && movie) {
      const currentMovie = movie;
      async function fetchDownloads() {
        setDownloadLoading(true);
        try {
          const res = await fetch(
            `/api/downloads?tmdbId=${currentMovie.tmdbId || ''}&title=${encodeURIComponent(currentMovie.title)}&type=${currentMovie.type || 'movie'}&season=${selectedSeason}&episode=${selectedEpisode}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data.downloads) {
              setDownloadOptions(data.downloads);
            }
          }
        } catch (err) {
          console.error("Failed to fetch download links:", err);
        } finally {
          setDownloadLoading(false);
        }
      }
      fetchDownloads();
    }
  }, [showDownloadModal, movie, selectedSeason, selectedEpisode]);

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
        <SkeletonWatch />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-[#08080a] text-white flex flex-col font-sans">
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

  const isSeries = movie.type === 'series' || movie.type === 'tv' || (movie.type !== 'movie' && (movie.category?.toLowerCase().includes('series') || movie.category?.toLowerCase() === 'k-drama' || movie.category?.toLowerCase() === 'anime'));
  const tmdbId = movie.tmdbId;

  // Build Multi-Provider & Sub-Server Embed URL
  function getEmbedUrl(
    provider: ServerSource,
    subServer: number,
    idVal: string | number,
    seriesFlag: boolean,
    season: number,
    episode: number
  ): string {
    if (seriesFlag) {
      switch (provider) {
        case 'vidsrc':
          if (subServer === 2) return `https://vidsrc.me/embed/tv?tmdb=${idVal}&season=${season}&episode=${episode}`;
          if (subServer === 3) return `https://vidsrc.cc/v2/embed/tv/${idVal}/${season}/${episode}`;
          if (subServer === 4) return `https://vidsrc.pro/embed/tv/${idVal}/${season}/${episode}`;
          if (subServer === 5) return `https://vidsrc.xyz/embed/tv/${idVal}/${season}/${episode}`;
          return `https://vidsrc.to/embed/tv/${idVal}/${season}/${episode}`;
        case 'autoembed':
          if (subServer === 2) return `https://player.autoembed.cc/embed/tv/${idVal}/${season}/${episode}`;
          return `https://embed.su/embed/tv/${idVal}/${season}/${episode}`;
        case 'vidlink':
          if (subServer === 2) return `https://vidlink.pro/tv/${idVal}/${season}/${episode}?primaryColor=e11d48`;
          return `https://vidlink.pro/tv/${idVal}/${season}/${episode}`;
        case 'twoembed':
          if (subServer === 2) return `https://www.2embed.skin/embedtv/${idVal}&s=${season}&e=${episode}`;
          return `https://www.2embed.cc/embedtv/${idVal}&s=${season}&e=${episode}`;
        case 'smashystream':
          if (subServer === 2) return `https://smashystream.com/playere.php?tmdb=${idVal}&s=${season}&e=${episode}`;
          return `https://embed.smashystream.com/playere.php?tmdb=${idVal}&s=${season}&e=${episode}`;
        case 'vidsrc_icu':
          if (subServer === 2) return `https://vidsrc.net/embed/tv/${idVal}/${season}/${episode}`;
          return `https://vidsrc.icu/embed/tv/${idVal}/${season}/${episode}`;
        default:
          return `https://vidsrc.to/embed/tv/${idVal}/${season}/${episode}`;
      }
    } else {
      switch (provider) {
        case 'vidsrc':
          if (subServer === 2) return `https://vidsrc.me/embed/movie?tmdb=${idVal}`;
          if (subServer === 3) return `https://vidsrc.cc/v2/embed/movie/${idVal}`;
          if (subServer === 4) return `https://vidsrc.pro/embed/movie/${idVal}`;
          if (subServer === 5) return `https://vidsrc.xyz/embed/movie/${idVal}`;
          return `https://vidsrc.to/embed/movie/${idVal}`;
        case 'autoembed':
          if (subServer === 2) return `https://player.autoembed.cc/embed/movie/${idVal}`;
          return `https://embed.su/embed/movie/${idVal}`;
        case 'vidlink':
          if (subServer === 2) return `https://vidlink.pro/movie/${idVal}?primaryColor=e11d48`;
          return `https://vidlink.pro/movie/${idVal}`;
        case 'twoembed':
          if (subServer === 2) return `https://www.2embed.skin/embed/${idVal}`;
          return `https://www.2embed.cc/embed/${idVal}`;
        case 'smashystream':
          if (subServer === 2) return `https://smashystream.com/playere.php?tmdb=${idVal}`;
          return `https://embed.smashystream.com/playere.php?tmdb=${idVal}`;
        case 'vidsrc_icu':
          if (subServer === 2) return `https://vidsrc.net/embed/movie/${idVal}`;
          return `https://vidsrc.icu/embed/movie/${idVal}`;
        default:
          return `https://vidsrc.to/embed/movie/${idVal}`;
      }
    }
  }

  let embedUrl: string | null = null;
  if (tmdbId && selectedServer !== 'direct') {
    embedUrl = getEmbedUrl(selectedServer, selectedSubServer, tmdbId, isSeries, selectedSeason, selectedEpisode);
  }

  const seasonsList = Array.from({ length: movie.seasonsCount || 5 }, (_, i) => i + 1);
  const episodesList = Array.from({ length: 24 }, (_, i) => i + 1);

  // Define sub-servers available per provider
  const getSubServersList = (p: ServerSource) => {
    switch (p) {
      case 'vidsrc':
        return [
          { id: 1, name: 'Server 1 (VidSrc.to)' },
          { id: 2, name: 'Server 2 (VidSrc.me)' },
          { id: 3, name: 'Server 3 (VidSrc.cc)' },
          { id: 4, name: 'Server 4 (VidSrc.pro)' },
          { id: 5, name: 'Server 5 (VidSrc.xyz)' },
        ];
      case 'autoembed':
        return [
          { id: 1, name: 'Server 1 (Embed.su)' },
          { id: 2, name: 'Server 2 (AutoEmbed.cc)' },
        ];
      case 'vidlink':
        return [
          { id: 1, name: 'Server 1 (VidLink Pro)' },
          { id: 2, name: 'Server 2 (VidLink Mirror)' },
        ];
      case 'twoembed':
        return [
          { id: 1, name: 'Server 1 (2Embed.cc)' },
          { id: 2, name: 'Server 2 (2Embed.skin)' },
        ];
      case 'smashystream':
        return [
          { id: 1, name: 'Server 1 (Smashy Primary)' },
          { id: 2, name: 'Server 2 (Smashy Mirror)' },
        ];
      case 'vidsrc_icu':
        return [
          { id: 1, name: 'Server 1 (VidSrc ICU)' },
          { id: 2, name: 'Server 2 (VidSrc Net)' },
        ];
      default:
        return [];
    }
  };

  const subServers = getSubServersList(selectedServer);

  return (
    <div className="min-h-screen bg-[#08080a] text-white flex flex-col font-sans select-none">

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



        {/* Multi-Provider Streaming Server Selector */}
        <div className="bg-[#0f0f14] p-4.5 rounded-2xl border border-white/10 space-y-4 shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs font-extrabold text-gray-200">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>1. Choose Streaming Provider:</span>
              <span className="text-[10px] text-gray-400 font-normal hidden sm:inline">(Select a provider first, then choose a server mirror below)</span>
            </div>
            <span className="text-[10px] bg-accent/20 text-accent font-bold px-2.5 py-0.5 rounded-full border border-accent/30">
              Auto-Multi Provider
            </span>
          </div>

          {/* Provider Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-white/10">
            {tmdbId && (
              <>
                <button
                  onClick={() => { setSelectedServer('vidsrc'); setSelectedSubServer(1); }}
                  className={`shrink-0 text-xs px-3.5 py-2 rounded-xl font-bold transition-all click-effect touch-manipulation border flex items-center gap-1.5 ${
                    selectedServer === 'vidsrc'
                      ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20 scale-[1.02]'
                      : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <span>⚡ VidSrc (5 Servers)</span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">1080p</span>
                </button>

                <button
                  onClick={() => { setSelectedServer('autoembed'); setSelectedSubServer(1); }}
                  className={`shrink-0 text-xs px-3.5 py-2 rounded-xl font-bold transition-all click-effect touch-manipulation border flex items-center gap-1.5 ${
                    selectedServer === 'autoembed'
                      ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20 scale-[1.02]'
                      : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <span>🚀 AutoEmbed</span>
                  <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono">Ultra HD</span>
                </button>

                <button
                  onClick={() => { setSelectedServer('vidlink'); setSelectedSubServer(1); }}
                  className={`shrink-0 text-xs px-3.5 py-2 rounded-xl font-bold transition-all click-effect touch-manipulation border flex items-center gap-1.5 ${
                    selectedServer === 'vidlink'
                      ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20 scale-[1.02]'
                      : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <span>🎬 VidLink</span>
                  <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-mono">Auto-Subs</span>
                </button>

                <button
                  onClick={() => { setSelectedServer('twoembed'); setSelectedSubServer(1); }}
                  className={`shrink-0 text-xs px-3.5 py-2 rounded-xl font-bold transition-all click-effect touch-manipulation border flex items-center gap-1.5 ${
                    selectedServer === 'twoembed'
                      ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20 scale-[1.02]'
                      : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <span>🌐 2Embed</span>
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">Multi-Lang</span>
                </button>

                <button
                  onClick={() => { setSelectedServer('smashystream'); setSelectedSubServer(1); }}
                  className={`shrink-0 text-xs px-3.5 py-2 rounded-xl font-bold transition-all click-effect touch-manipulation border flex items-center gap-1.5 ${
                    selectedServer === 'smashystream'
                      ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20 scale-[1.02]'
                      : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <span>✨ SmashyStream</span>
                  <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-mono">Fast Mirror</span>
                </button>

                <button
                  onClick={() => { setSelectedServer('vidsrc_icu'); setSelectedSubServer(1); }}
                  className={`shrink-0 text-xs px-3.5 py-2 rounded-xl font-bold transition-all click-effect touch-manipulation border flex items-center gap-1.5 ${
                    selectedServer === 'vidsrc_icu'
                      ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20 scale-[1.02]'
                      : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <span>🍿 VidSrc ICU</span>
                  <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-mono">Sub/Dub</span>
                </button>
              </>
            )}

            <button
              onClick={() => setSelectedServer('direct')}
              className={`shrink-0 text-xs px-3.5 py-2 rounded-xl font-bold transition-all click-effect touch-manipulation border flex items-center gap-1.5 ${
                selectedServer === 'direct'
                  ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20 scale-[1.02]'
                  : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
              }`}
            >
              <span>📽️ Direct MP4</span>
              <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-mono">Upload</span>
            </button>
          </div>

          {/* Sub-Server / Mirror Selector */}
          {selectedServer !== 'direct' && subServers.length > 0 && (
            <div className="pt-3 border-t border-white/10 space-y-2">
              <div className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                <span>2. Select Server Mirror for <strong className="text-accent uppercase">{selectedServer}</strong>:</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {subServers.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSubServer(s.id)}
                    className={`shrink-0 text-xs px-3 py-1.5 rounded-lg font-bold transition-all click-effect touch-manipulation border ${
                      selectedSubServer === s.id
                        ? 'bg-white text-black border-white shadow-md font-extrabold'
                        : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}
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

      {/* Automated Torrent & Direct Download Options Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#12121a] border border-white/15 rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <button 
              onClick={() => setShowDownloadModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all"
            >
              ✕
            </button>

            <div className="space-y-1">
              <span className="text-xs font-bold text-accent uppercase tracking-wider">Automated Multi-Source Downloader</span>
              <h2 className="text-xl sm:text-2xl font-black text-white">Download {movie.title}</h2>
              <p className="text-xs text-gray-400">
                {isSeries ? `Selected: Season ${selectedSeason}, Episode ${selectedEpisode}` : 'High-speed automated download sources (YTS, 1337x, TorrentGalaxy, EZTV)'}
              </p>
            </div>

            <div className="overflow-y-auto space-y-3 pr-1 flex-1 scrollbar-thin scrollbar-thumb-white/10">
              {downloadLoading ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs text-gray-400 font-bold">Scraping fast download links from YTS, 1337x & TorrentGalaxy...</p>
                </div>
              ) : downloadOptions.length > 0 ? (
                downloadOptions.map((opt) => (
                  <div
                    key={opt.id}
                    className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-accent/20 border border-accent/40 text-accent">
                            {opt.quality}
                          </span>
                          <span className="text-xs font-bold text-gray-300">
                            💾 {opt.size}
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            🌱 {opt.seeders} Seeds
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1.5 line-clamp-1">{opt.name}</h4>
                        <span className="text-[10px] text-gray-400 font-medium">Source: {opt.source}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
                      {/* WebTor 1-Click Web Downloader */}
                      <a
                        href={opt.webtorUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 min-w-[140px] text-center text-xs px-3.5 py-2 rounded-xl font-bold bg-accent text-white hover:bg-accent/80 transition-all shadow-md shadow-accent/20 flex items-center justify-center gap-1.5 click-effect"
                      >
                        ⚡ 1-Click Web Download
                      </a>

                      {/* Magnet Link */}
                      <a
                        href={opt.magnetUrl}
                        className="text-xs px-3.5 py-2 rounded-xl font-bold bg-white/10 hover:bg-white/20 text-gray-200 transition-all border border-white/10 flex items-center gap-1.5 click-effect"
                      >
                        🧲 Magnet Link
                      </a>

                      {/* Torrent File if available */}
                      {opt.torrentUrl && (
                        <a
                          href={opt.torrentUrl}
                          download
                          className="text-xs px-3.5 py-2 rounded-xl font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-all flex items-center gap-1.5 click-effect"
                        >
                          📄 .Torrent File
                        </a>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center space-y-3 bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-sm text-gray-300 font-semibold">No automated torrent sources found for this title.</p>
                  <p className="text-xs text-gray-400">You can use direct video streaming or try another server.</p>
                </div>
              )}

              {movie.videoUrl && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-2 mt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Direct Video Source</span>
                      <h4 className="text-sm font-bold text-white">Direct MP4 Video File</h4>
                    </div>
                    <a
                      href={movie.videoUrl}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold bg-emerald-500 text-black px-4 py-2 rounded-xl hover:bg-emerald-400 transition-all shadow-md click-effect"
                    >
                      Download MP4 ➔
                    </a>
                  </div>
                </div>
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
