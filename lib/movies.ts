import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';

export interface Movie {
  id: string;
  title: string;
  genre: string;
  description: string;
  posterUrl: string;
  videoUrl: string;
  tmdbId?: string | number;
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
  seasonsCount?: number;
  year?: string | number;
  rating?: string | number;
  createdAt?: number | string;
}

export function isSeriesItem(m: Movie): boolean {
  if (m.type === 'series' || m.type === 'tv') return true;
  const cat = (m.category || '').toLowerCase();
  const genre = (m.genre || '').toLowerCase();
  if (cat.includes('series') || cat === 'k-drama' || cat === 'anime' || genre.includes('tv series') || genre.includes('web series')) {
    return true;
  }
  if (m.type === 'movie') return false;
  return false;
}

export function sortNewestFirst(items: Movie[]): Movie[] {
  const itemsWithIndex = items.map((item, idx) => ({ item, idx }));
  itemsWithIndex.sort((a, b) => {
    const getTime = (m: Movie) => {
      if (typeof m.createdAt === 'number') return m.createdAt;
      if (typeof m.createdAt === 'string') {
        const parsed = new Date(m.createdAt).getTime();
        if (!isNaN(parsed)) return parsed;
      }
      if (m.createdAt && typeof (m.createdAt as any).seconds === 'number') {
        return (m.createdAt as any).seconds * 1000;
      }
      if (m.releaseDate) {
        const parsedRel = new Date(m.releaseDate).getTime();
        if (!isNaN(parsedRel)) return parsedRel;
      }
      return 0;
    };

    const timeA = getTime(a.item);
    const timeB = getTime(b.item);

    if (timeA !== timeB) {
      return timeB - timeA;
    }
    return b.idx - a.idx;
  });
  return itemsWithIndex.map(x => x.item);
}

const TMDB_API_KEY = "40997d508f165094637f1d6f8a9ab148";

export async function enrichMovieWithTmdb(movie: Movie): Promise<Movie> {
  if (
    movie.tmdbId &&
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
    const isSeries = isSeriesItem(movie);
    const endpoint = isSeries ? 'search/tv' : 'search/movie';
    const detailsEndpoint = isSeries ? 'tv' : 'movie';

    let tmdbIdToUse = movie.tmdbId;

    if (!tmdbIdToUse) {
      const searchRes = await fetch(
        `https://api.themoviedb.org/3/${endpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(movie.title)}`
      );
      const searchData = await searchRes.json();
      if (searchData.results && searchData.results.length > 0) {
        tmdbIdToUse = searchData.results[0].id;
      }
    }

    if (tmdbIdToUse) {
      const detailsRes = await fetch(
        `https://api.themoviedb.org/3/${detailsEndpoint}/${tmdbIdToUse}?api_key=${TMDB_API_KEY}&append_to_response=credits,images`
      );
      const details = await detailsRes.json();

      const directorObj = details.credits?.crew?.find((c: any) => c.job === 'Director' || c.job === 'Executive Producer');
      const topCast = details.credits?.cast
        ? details.credits.cast.slice(0, 8).map((c: any) => c.name)
        : undefined;
      const backdrops = details.images?.backdrops
        ? details.images.backdrops.slice(0, 8).map((img: any) => `https://image.tmdb.org/t/p/w1280${img.file_path}`)
        : undefined;

      const seasons = details.number_of_seasons || (details.seasons ? details.seasons.length : 1);

      return {
        ...movie,
        tmdbId: movie.tmdbId || tmdbIdToUse,
        seasonsCount: movie.seasonsCount || seasons,
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
