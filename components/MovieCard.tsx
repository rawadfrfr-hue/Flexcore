'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Movie, formatRuntime } from '@/lib/movies';

export default function MovieCard({ movie }: { movie: Movie }) {
  return (
    <Link href={`/watch/${movie.id}`} className="group flex flex-col">
      <div className="w-full aspect-[2/3] bg-[#1a1a20] rounded-xl relative overflow-hidden border border-white/10 shadow-lg group-hover:border-accent/60 transition-all duration-300">
        <Image 
          src={movie.posterUrl} 
          alt={movie.title}
          fill
          className="object-cover group-hover:scale-105 transition-all duration-300 brightness-90 group-hover:brightness-100"
          referrerPolicy="no-referrer"
        />
        
        {/* Top rating badge */}
        {movie.voteAverage && (
          <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md text-yellow-400 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-yellow-500/30 shadow">
            ★ {movie.voteAverage.toFixed(1)}
          </div>
        )}

        {/* Release year badge */}
        {movie.releaseDate && (
          <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md text-white/90 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-white/20">
            {movie.releaseDate.substring(0, 4)}
          </div>
        )}

        {/* Type / Category badge */}
        {movie.type && (
          <div className="absolute bottom-2 left-2 bg-accent/90 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider shadow">
            {movie.type}
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
          <span className="bg-accent text-white text-xs font-bold py-1.5 px-3 rounded w-full text-center shadow">
            ▶ Watch Now
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
    </Link>
  );
}
