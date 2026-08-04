'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import MovieCard from './MovieCard';
import { Movie } from '@/lib/movies';

export default function InfiniteMovieGrid({ movies }: { movies: Movie[] }) {
  const [displayCount, setDisplayCount] = useState(24);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentTarget = observerTarget.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setDisplayCount((prev) => Math.min(prev + 24, movies.length));
        }
      },
      { rootMargin: '400px' }
    );

    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [movies.length]);

  const displayedMovies = useMemo(() => movies.slice(0, displayCount), [movies, displayCount]);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {displayedMovies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
      {displayCount < movies.length && (
        <div ref={observerTarget} className="h-10 w-full mt-4" />
      )}
    </>
  );
}
