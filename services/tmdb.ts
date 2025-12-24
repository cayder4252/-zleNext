
import { Series, Actor, Episode, Season, Review } from '../types';
import { omdb } from './omdb';

let API_KEY = '85251d97249cfcc215d008c0a93cd2ac';
let IS_ENABLED = true;

const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w780';
const IMAGE_ORIGINAL_URL = 'https://image.tmdb.org/t/p/original';

export const tmdbInit = (key: string, enabled: boolean) => {
  API_KEY = key;
  IS_ENABLED = enabled;
};

// Types for TMDb responses
interface TmdbItem {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  original_language?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids: number[];
  origin_country?: string[];
  media_type?: string;
}

interface TmdbDetail extends TmdbItem {
  genres: { id: number; name: string }[];
  runtime?: number;
  episode_run_time?: number[];
  status: string;
  videos: { results: { key: string; type: string; site: string }[] };
  credits: { cast: { id: number; name: string; character: string; profile_path: string | null }[] };
  networks?: { name: string }[];
  last_episode_to_air?: TmdbEpisode;
  next_episode_to_air?: TmdbEpisode;
  seasons?: TmdbSeason[];
  reviews?: { results: TmdbReview[] };
  external_ids?: { imdb_id: string | null };
}

interface TmdbSeason {
  air_date: string;
  episode_count: number;
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
}

interface TmdbReview {
  author: string;
  author_details: {
    name: string;
    username: string;
    avatar_path: string | null;
    rating: number | null;
  };
  content: string;
  created_at: string;
  id: string;
  updated_at: string;
  url: string;
}

interface TmdbEpisode {
  id: number;
  name: string;
  episode_number: number;
  season_number: number;
  air_date: string;
  overview: string;
  still_path: string | null;
  vote_average: number;
}

const mapTmdbEpisode = (ep: TmdbEpisode): Episode => ({
    id: ep.id,
    name: ep.name,
    episode_number: ep.episode_number,
    season_number: ep.season_number,
    air_date: ep.air_date,
    overview: ep.overview,
    still_path: ep.still_path ? `${IMAGE_BASE_URL}${ep.still_path}` : null,
    vote_average: ep.vote_average
});

const mapTmdbToSeries = (item: TmdbItem | TmdbDetail): Series => {
  const isMovie = 'title' in item || item.media_type === 'movie';
  const type: 'tv' | 'movie' = isMovie ? 'movie' : 'tv';
  const title = isMovie ? item.title : item.name;
  const originalTitle = isMovie ? item.original_title : item.original_name;
  const date = isMovie ? item.release_date : item.first_air_date;
  
  const detailedItem = item as TmdbDetail;
  const network = detailedItem.networks && detailedItem.networks.length > 0 ? detailedItem.networks[0].name : (item.origin_country?.[0] || 'TMDb');
  
  let trailerUrl = undefined;
  if (detailedItem.videos && detailedItem.videos.results) {
    const trailer = detailedItem.videos.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
    if (trailer) trailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
  }

  const genreNames = detailedItem.genres ? detailedItem.genres.map(g => g.name) : [];
  const runtimeString = detailedItem.runtime ? `${detailedItem.runtime} min` : (detailedItem.episode_run_time?.[0] ? `${detailedItem.episode_run_time[0]} min` : undefined);

  let episodesTotal = 0;
  let episodesAired = 0;
  let latestEpisode: Episode | undefined = undefined;
  let nextEpisode: Episode | undefined = undefined;

  if (detailedItem.last_episode_to_air) {
      episodesAired = detailedItem.last_episode_to_air.episode_number; 
      episodesTotal = episodesAired + (detailedItem.next_episode_to_air ? 1 : 0);
      latestEpisode = mapTmdbEpisode(detailedItem.last_episode_to_air);
  }
  if (detailedItem.next_episode_to_air) {
      nextEpisode = mapTmdbEpisode(detailedItem.next_episode_to_air);
  }

  const seasons: Season[] = detailedItem.seasons ? detailedItem.seasons.map(s => ({
      id: s.id,
      name: s.name,
      season_number: s.season_number,
      episode_count: s.episode_count,
      air_date: s.air_date,
      poster_path: s.poster_path ? `${IMAGE_BASE_URL}${s.poster_path}` : undefined,
      overview: s.overview
  })).filter(s => s.season_number > 0) : []; 

  const reviews: Review[] = detailedItem.reviews ? detailedItem.reviews.results.map(r => ({
      id: r.id,
      author: r.author,
      content: r.content,
      created_at: r.created_at,
      rating: r.author_details.rating || undefined,
      avatar_path: r.author_details.avatar_path ? (r.author_details.avatar_path.startsWith('/https') ? r.author_details.avatar_path.substring(1) : `${IMAGE_BASE_URL}${r.author_details.avatar_path}`) : undefined
  })) : [];

  return {
    id: `${type}_${item.id}`,
    media_type: type,
    title_tr: title || 'Untitled',
    title_en: originalTitle || 'Untitled',
    original_language: item.original_language,
    synopsis: item.overview || 'No synopsis available.',
    status: detailedItem.status === 'Ended' || detailedItem.status === 'Canceled' ? 'Ended' : 'Airing',
    network: network,
    poster_url: item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Poster',
    banner_url: item.backdrop_path ? `${IMAGE_ORIGINAL_URL}${item.backdrop_path}` : 'https://via.placeholder.com/1200x600?text=No+Image',
    rating: item.vote_average,
    episodes_total: episodesTotal || 0,
    episodes_aired: episodesAired || 0,
    is_featured: item.vote_average > 8.0, 
    release_year: date ? new Date(date).getFullYear() : undefined,
    genres: genreNames,
    runtime: runtimeString,
    trailer_url: trailerUrl,
    latest_episode: latestEpisode,
    next_episode: nextEpisode,
    seasons: seasons,
    reviews: reviews,
    imdb_id: detailedItem.external_ids?.imdb_id || undefined,
    social_links: {} 
  };
};

export const tmdb = {
  getTrendingSeries: async (timeWindow: 'day' | 'week' = 'day'): Promise<Series[]> => {
    if (!IS_ENABLED) return [];
    try {
      const response = await fetch(`${BASE_URL}/trending/tv/${timeWindow}?api_key=${API_KEY}`);
      const data = await response.json();
      return data.results.map((item: any) => mapTmdbToSeries({ ...item, media_type: 'tv' }));
    } catch (error) {
      console.error("Error fetching trending series:", error);
      return [];
    }
  },

  getTrendingMovies: async (timeWindow: 'day' | 'week' = 'day'): Promise<Series[]> => {
    if (!IS_ENABLED) return [];
    try {
      const response = await fetch(`${BASE_URL}/trending/movie/${timeWindow}?api_key=${API_KEY}`);
      const data = await response.json();
      return data.results.map((item: any) => mapTmdbToSeries({ ...item, media_type: 'movie' }));
    } catch (error) {
       console.error("Error fetching trending movies:", error);
       return [];
    }
  },

  search: async (query: string, page: number = 1): Promise<{ results: Series[], total_pages: number }> => {
    if (!IS_ENABLED) return { results: [], total_pages: 0 };
    try {
      const response = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}`);
      const data = await response.json();
      const results = (data.results || [])
        .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
        .map(mapTmdbToSeries);
      return { results, total_pages: data.total_pages || 1 };
    } catch (error) {
      console.error("Error searching:", error);
      return { results: [], total_pages: 0 };
    }
  },

  getDetails: async (id: string, type: 'movie' | 'tv' = 'tv'): Promise<{ series: Series, cast: Actor[] }> => {
    if (!IS_ENABLED) throw new Error("TMDb is disabled");
    try {
      const rawId = id.includes('_') ? id.split('_')[1] : id;
      const response = await fetch(`${BASE_URL}/${type}/${rawId}?api_key=${API_KEY}&append_to_response=credits,videos,reviews,seasons,external_ids`);
      const data = await response.json();
      
      const series = mapTmdbToSeries({ ...data, media_type: type });
      
      const cast: Actor[] = data.credits.cast.slice(0, 20).map((c: any) => ({
        id: c.id.toString(),
        name: c.name,
        role_type: c.order < 3 ? 'Lead' : 'Supporting',
        photo_url: c.profile_path ? `${IMAGE_BASE_URL}${c.profile_path}` : 'https://via.placeholder.com/150x150?text=No+Img',
        character_name: c.character
      }));

      return { series, cast };
    } catch (error) {
      console.error("Error fetching details:", error);
      throw error;
    }
  },
  
  getSeasonDetails: async (seriesId: string, seasonNumber: number): Promise<Episode[]> => {
      if (!IS_ENABLED) return [];
      try {
          const rawId = seriesId.includes('_') ? seriesId.split('_')[1] : seriesId;
          const response = await fetch(`${BASE_URL}/tv/${rawId}/season/${seasonNumber}?api_key=${API_KEY}`);
          const data = await response.json();
          if (!data.episodes) return [];
          return data.episodes.map(mapTmdbEpisode);
      } catch (e) {
          console.error("Error fetching season details", e);
          return [];
      }
  },

  getCalendarData: async (type: 'tv' | 'movie', language: string): Promise<Series[]> => {
    if (!IS_ENABLED) return [];
    try {
        const today = new Date().toISOString().split('T')[0];
        const rangeEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        let url = `${BASE_URL}/discover/${type}?api_key=${API_KEY}`;
        if (type === 'tv') {
            url += `&air_date.gte=${today}&air_date.lte=${rangeEnd}&sort_by=popularity.desc`;
        } else {
            url += `&primary_release_date.gte=${today}&primary_release_date.lte=${rangeEnd}&sort_by=primary_release_date.asc`;
        }
        
        if (language !== 'all') {
            url += `&with_original_language=${language}`;
        }

        const response = await fetch(url);
        const data = await response.json();
        const results = data.results?.slice(0, 50) || [];

        const detailPromises = results.map((item: any) => 
            fetch(`${BASE_URL}/${type}/${item.id}?api_key=${API_KEY}`).then(res => res.json())
        );

        const detailsData = await Promise.all(detailPromises);
        return detailsData.map((d: any) => {
            const series = mapTmdbToSeries({ ...d, media_type: type });
            if (type === 'movie' && !series.next_episode && d.release_date) {
                series.next_episode = {
                    air_date: d.release_date,
                    id: 0,
                    name: 'Theatrical Release',
                    episode_number: 1,
                    season_number: 1,
                    overview: d.overview,
                    still_path: null
                };
            }
            return series;
        }).filter(s => !!s.next_episode);
    } catch (error) {
        console.error("Error fetching calendar data:", error);
        return [];
    }
  },

  getDiscoveryContent: async (endpoint: string, params: string, page: number = 1): Promise<{ results: Series[], total_pages: number }> => {
    if (!IS_ENABLED) return { results: [], total_pages: 0 };
    try {
        const response = await fetch(`${BASE_URL}/${endpoint}?api_key=${API_KEY}&${params}&page=${page}`);
        const data = await response.json();
        if (!data.results) return { results: [], total_pages: 0 };
        const type = endpoint.includes('movie') ? 'movie' : 'tv';
        const results = data.results.map((item: any) => mapTmdbToSeries({ ...item, media_type: item.media_type || type }));
        return { results, total_pages: data.total_pages || 1 };
    } catch (e) {
        console.error("Discovery error:", e);
        return { results: [], total_pages: 0 };
    }
  },

  enrichSeries: async (seriesList: Series[]): Promise<Series[]> => {
      if (!IS_ENABLED) return seriesList;
      const itemsToEnrich = seriesList.slice(0, 4); // Reduced for performance
      const remainingItems = seriesList.slice(4);

      const enrichedItems = await Promise.all(itemsToEnrich.map(async (item) => {
          try {
              const rawId = item.id.includes('_') ? item.id.split('_')[1] : item.id;
              const mediaType = item.media_type || (item.episodes_total > 0 ? 'tv' : 'movie'); 
              const idRes = await fetch(`${BASE_URL}/${mediaType}/${rawId}/external_ids?api_key=${API_KEY}`);
              const ids = await idRes.json();
              
              if (ids.imdb_id) {
                  const omdbData = await omdb.getDetails(ids.imdb_id);
                  if (omdbData) {
                      return { ...item, ...omdbData };
                  }
              }
              return item;
          } catch (e) {
              return item;
          }
      }));

      return [...enrichedItems, ...remainingItems];
  }
};
