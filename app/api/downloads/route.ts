import { NextRequest, NextResponse } from 'next/server';

const TMDB_API_KEY = "40997d508f165094637f1d6f8a9ab148";

interface DownloadItem {
  id: string;
  name: string;
  quality: string;
  size: string;
  seeders: number;
  source: string;
  magnetUrl: string;
  torrentUrl?: string;
  webtorUrl: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tmdbId = searchParams.get('tmdbId');
    const title = searchParams.get('title') || '';
    const type = searchParams.get('type') || 'movie';
    const season = searchParams.get('season') || '1';
    const episode = searchParams.get('episode') || '1';

    const isSeries = type === 'series' || type === 'tv';

    let imdbId: string | null = null;

    // Step 1: Fetch IMDb ID from TMDB if tmdbId is present
    if (tmdbId) {
      try {
        const extRes = await fetch(
          `https://api.themoviedb.org/3/${isSeries ? 'tv' : 'movie'}/${tmdbId}/external_ids?api_key=${TMDB_API_KEY}`,
          { next: { revalidate: 3600 } }
        );
        if (extRes.ok) {
          const extData = await extRes.json();
          if (extData.imdb_id) {
            imdbId = extData.imdb_id;
          }
        }
      } catch (err) {
        console.error("Error fetching IMDb ID from TMDB:", err);
      }
    }

    const downloadList: DownloadItem[] = [];

    // Helper to format magnet to Webtor instant web downloader link
    const getWebtorUrl = (magnet: string) => {
      return `https://webtor.io/#/magnet?url=${encodeURIComponent(magnet)}`;
    };

    // Trackers string for magnets
    const defaultTrackers = [
      'udp://tracker.opentrackr.org:1337/announce',
      'udp://open.demonii.com:1337/announce',
      'udp://tracker.openbittorrent.com:80',
      'udp://tracker.coppersurfer.tk:6969',
      'udp://glotorrents.pw:6969/announce',
      'udp://torrent.gresille.org:80/announce',
      'udp://p4p.arenabg.com:1337',
      'udp://tracker.leechers-paradise.org:6969'
    ].map(t => `&tr=${encodeURIComponent(t)}`).join('');

    // Fetching Strategy 1: YTS API (Best for Movies)
    if (!isSeries) {
      try {
        let ytsQuery = imdbId ? imdbId : title;
        const ytsRes = await fetch(`https://yts.mx/api/v2/list_movies.json?query_term=${encodeURIComponent(ytsQuery)}&limit=1`, {
          next: { revalidate: 1800 }
        });
        
        if (ytsRes.ok) {
          const ytsData = await ytsRes.json();
          const movie = ytsData.data?.movies?.[0];
          if (movie && movie.torrents) {
            for (const tor of movie.torrents) {
              const magnet = `magnet:?xt=urn:btih:${tor.hash}&dn=${encodeURIComponent(movie.title + ' ' + tor.quality)}${defaultTrackers}`;
              downloadList.push({
                id: `yts-${tor.hash}`,
                name: `${movie.title} (${tor.quality} ${tor.type.toUpperCase()})`,
                quality: `${tor.quality} ${tor.type.toUpperCase()}`,
                size: tor.size || 'Unknown',
                seeders: tor.seeds || 0,
                source: 'YTS Official',
                magnetUrl: magnet,
                torrentUrl: tor.url,
                webtorUrl: getWebtorUrl(magnet)
              });
            }
          }
        }
      } catch (e) {
        console.error("YTS fetch error:", e);
      }
    }

    // Fetching Strategy 2: Torrentio API (Scrapes 1337x, TorrentGalaxy, PirateBay, RARBG, etc.)
    if (imdbId) {
      try {
        const streamEndpoint = isSeries
          ? `https://torrentio.strem.fun/stream/series/${imdbId}:${season}:${episode}.json`
          : `https://torrentio.strem.fun/stream/movie/${imdbId}.json`;

        const torrentioRes = await fetch(streamEndpoint, { next: { revalidate: 1800 } });
        if (torrentioRes.ok) {
          const tData = await torrentioRes.json();
          if (tData.streams && Array.isArray(tData.streams)) {
            tData.streams.slice(0, 10).forEach((stream: any, index: number) => {
              if (stream.infoHash) {
                const magnet = `magnet:?xt=urn:btih:${stream.infoHash}&dn=${encodeURIComponent(title || 'Download')}${defaultTrackers}`;
                
                // Parse details from stream title/name
                const lines = (stream.title || '').split('\n');
                const sourceProvider = lines[2] ? lines[2].replace('⚙️', '').trim() : 'Torrent Galaxy / 1337x';
                const qualityMatch = (stream.name || '').match(/\d{3,4}p|4k|hdr|bluray|web-dl/i);
                const quality = qualityMatch ? qualityMatch[0].toUpperCase() : '1080p HD';
                
                // Parse seeders and size if present
                let size = 'HD Quality';
                let seeds = 100;
                if (lines[1]) {
                  const seedMatch = lines[1].match(/👤\s*(\d+)/);
                  if (seedMatch) seeds = parseInt(seedMatch[1], 10);
                  const sizeMatch = lines[1].match(/💾\s*([\d\.]+\s*[G|M]B)/i);
                  if (sizeMatch) size = sizeMatch[1];
                }

                downloadList.push({
                  id: `torrentio-${stream.infoHash}-${index}`,
                  name: lines[0] || `${title} [${quality}]`,
                  quality: quality,
                  size: size,
                  seeders: seeds,
                  source: sourceProvider || 'Automated Torrent Mirror',
                  magnetUrl: magnet,
                  webtorUrl: getWebtorUrl(magnet)
                });
              }
            });
          }
        }
      } catch (e) {
        console.error("Torrentio fetch error:", e);
      }
    }

    // Fetching Strategy 3: EZTV API (Best Backup for TV Series)
    if (isSeries && imdbId) {
      try {
        const numericImdb = imdbId.replace('tt', '');
        const eztvRes = await fetch(`https://eztv.re/api/get-torrents?imdb_id=${numericImdb}&limit=50`, {
          next: { revalidate: 1800 }
        });
        if (eztvRes.ok) {
          const eztvData = await eztvRes.json();
          if (eztvData.torrents && Array.isArray(eztvData.torrents)) {
            const targetS = parseInt(season, 10);
            const targetE = parseInt(episode, 10);

            const filteredTorrents = eztvData.torrents.filter((tor: any) => {
              const sNum = parseInt(tor.season, 10);
              const eNum = parseInt(tor.episode, 10);
              return sNum === targetS && eNum === targetE;
            });

            filteredTorrents.forEach((tor: any, idx: number) => {
              if (tor.magnet_url) {
                const sizeMb = tor.size_bytes ? (parseInt(tor.size_bytes, 10) / (1024 * 1024)).toFixed(1) + ' MB' : 'HD';
                downloadList.push({
                  id: `eztv-${tor.id || idx}`,
                  name: tor.title || `Season ${season} Episode ${episode}`,
                  quality: tor.title.includes('1080p') ? '1080p HD' : tor.title.includes('720p') ? '720p HD' : 'HD',
                  size: sizeMb,
                  seeders: tor.seeds || 50,
                  source: 'EZTV TV Releases',
                  magnetUrl: tor.magnet_url,
                  torrentUrl: tor.torrent_url,
                  webtorUrl: getWebtorUrl(tor.magnet_url)
                });
              }
            });
          }
        }
      } catch (e) {
        console.error("EZTV fetch error:", e);
      }
    }

    // Sort downloads by seeders descending
    downloadList.sort((a, b) => b.seeders - a.seeders);

    return NextResponse.json({
      success: true,
      count: downloadList.length,
      downloads: downloadList,
      imdbId: imdbId
    });

  } catch (error: any) {
    console.error("Download route API error:", error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
