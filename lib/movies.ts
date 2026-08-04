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

// Global cache to prevent Skeleton flashes and lags during page transitions
let globalMoviesCache: Movie[] | null = null;
export function getMoviesCache(): Movie[] | null {
  return globalMoviesCache;
}
export function setMoviesCache(movies: Movie[]) {
  globalMoviesCache = movies;
}

export function isSeriesItem(m: Movie): boolean {
  if (!m) return false;
  const cat = (m.category || '').toLowerCase().trim();
  const type = (m.type || '').toLowerCase().trim();
  const genre = (m.genre || '').toLowerCase().trim();
  const title = (m.title || '').toLowerCase().trim();

  // Explicit check for Web Series category, type, genre, or title markers
  if (
    cat === 'web series' ||
    cat === 'web-series' ||
    cat === 'series' ||
    cat.includes('web series') ||
    cat.includes('series') ||
    cat.includes('web')
  ) {
    return true;
  }

  if (type === 'series' || type === 'tv') {
    return true;
  }

  if (m.seasonsCount && m.seasonsCount > 0 && type !== 'movie') {
    return true;
  }

  if (
    genre.includes('tv series') ||
    genre.includes('web series') ||
    genre.includes('tv show') ||
    genre.includes('drama series')
  ) {
    return true;
  }

  if (
    title.includes('season 1') ||
    title.includes('season 2') ||
    title.includes('season 3') ||
    title.includes('s01') ||
    title.includes('s02')
  ) {
    return true;
  }

  return false;
}

export function matchesCategory(m: Movie, categorySlug: string): boolean {
  if (!m || !categorySlug) return false;

  let target = '';
  try {
    target = decodeURIComponent(categorySlug).toLowerCase().trim();
  } catch {
    target = categorySlug.toLowerCase().trim();
  }
  target = target.replace(/_/g, '-').replace(/\s+/g, '-');

  const cat = (m.category || '').toLowerCase().trim();
  const genre = (m.genre || '').toLowerCase().trim();
  const title = (m.title || '').toLowerCase().trim();

  const seriesFlag = isSeriesItem(m);

  // Web Series Category matching
  if (target === 'web-series' || target === 'web series' || target === 'series') {
    return seriesFlag || cat.includes('web') || cat.includes('series');
  }

  // If item is identified as a series item, strictly exclude it from movie categories
  if (seriesFlag || cat.includes('series') || cat.includes('web')) {
    return false;
  }

  // South Hindi Category matching
  if (target === 'south-hindi' || target === 'south') {
    return cat.includes('south') || genre.includes('south');
  }

  // Bollywood Category matching - STRICT EXCLUSIONS
  if (target === 'bollywood' || target === 'hindi') {
    if (cat.includes('south') || cat.includes('dubbed') || cat.includes('series') || cat.includes('web')) {
      return false;
    }
    return cat === 'bollywood' || cat.includes('bollywood') || (cat === 'hindi' && !cat.includes('dubbed'));
  }

  // Hollywood Category matching
  if (target === 'hollywood') {
    return cat === 'hollywood' || cat.includes('hollywood');
  }

  // Hindi Dubbed Category matching
  if (target === 'hindi-dubbed' || target === 'dubbed') {
    return cat.includes('hindi dubbed') || cat.includes('dubbed') || genre.includes('dubbed');
  }

  // Fallback matching
  const catNorm = cat.replace(/-/g, ' ');
  const targetNorm = target.replace(/-/g, ' ');
  return catNorm.includes(targetNorm) || genre.includes(targetNorm) || title.includes(targetNorm);
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
