import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';

export interface Movie {
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

export async function enrichMovieWithTmdb(movie: Movie): Promise<Movie> {
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
    const isSeries = movie.type === 'series' || movie.genre.toLowerCase().includes('series') || movie.genre.toLowerCase().includes('drama') || movie.genre.toLowerCase().includes('anime');
    const endpoint = isSeries ? 'search/tv' : 'search/movie';
    const detailsEndpoint = isSeries ? 'tv' : 'movie';

    const searchRes = await fetch(
      `https://api.themoviedb.org/3/${endpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(movie.title)}`
    );
    const searchData = await searchRes.json();

    if (searchData.results && searchData.results.length > 0) {
      const tmdbId = searchData.results[0].id;
      const detailsRes = await fetch(
        `https://api.themoviedb.org/3/${detailsEndpoint}/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=credits,images`
      );
      const details = await detailsRes.json();

      const directorObj = details.credits?.crew?.find((c: any) => c.job === 'Director' || c.job === 'Executive Producer');
      const topCast = details.credits?.cast
        ? details.credits.cast.slice(0, 8).map((c: any) => c.name)
        : undefined;
      const backdrops = details.images?.backdrops
        ? details.images.backdrops.slice(0, 8).map((img: any) => `https://image.tmdb.org/t/p/w1280${img.file_path}`)
        : undefined;

      return {
        ...movie,
        runtime: movie.runtime || details.runtime || (details.episode_run_time ? details.episode_run_time[0] : undefined),
        voteAverage: movie.voteAverage || details.vote_average || undefined,
        voteCount: movie.voteCount || details.vote_count || undefined,
        releaseDate: movie.releaseDate || details.release_date || details.first_air_date || undefined,
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

export function formatRuntime(mins?: number) {
  if (!mins) return null;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return hrs > 0 ? `${hrs}h ${remMins}m` : `${remMins}m`;
}
