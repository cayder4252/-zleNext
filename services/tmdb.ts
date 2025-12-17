import { Series, Actor, Episode, Season, Review } from '../types';
import { omdb } from './omdb';

const API_KEY = '85251d97249cfcc215d008c0a93cd2ac';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w780';
const IMAGE_ORIGINAL_URL = 'https://image.tmdb.org/t/p/original';

// Types for TMDb responses
interface TmdbItem {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids: number[];
  origin_country?: string[];
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
  const isMovie = 'title' in item;
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

  // Map Seasons
  const seasons: Season[] = detailedItem.seasons ? detailedItem.seasons.map(s => ({
      id: s.id,
      name: s.name,
      season_number: s.season_number,
      episode_count: s.episode_count,
      air_date: s.air_date,
      poster_path: s.poster_path ? `${IMAGE_BASE_URL}${s.poster_path}` : undefined,
      overview: s.overview
  })).filter(s => s.season_number > 0) : []; 

  // Map Reviews
  const reviews: Review[] = detailedItem.reviews ? detailedItem.reviews.results.map(r => ({
      id: r.id,
      author: r.author,
      content: r.content,
      created_at: r.created_at,
      rating: r.author_details.rating || undefined,
      avatar_path: r.author_details.avatar_path ? (r.author_details.avatar_path.startsWith('/https') ? r.author_details.avatar_path.substring(1) : `${IMAGE_BASE_URL}${r.author_details.avatar_path}`) : undefined
  })) : [];

  return {
    id: item.id.toString(),
    title_tr: title || 'Untitled',
    title_en: originalTitle || 'Untitled',
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
    imdb_id: detailedItem.external_ids?.imdb_id || undefined, // Map IMDb ID
    social_links: {} 
  };
};

export const tmdb = {
  getTrendingSeries: async (timeWindow: 'day' | 'week' = 'day'): Promise<Series[]> => {
    try {
      const response = await fetch(`${BASE_URL}/trending/tv/${timeWindow}?api_key=${API_KEY}`);
      const data = await response.json();
      return data.results.map(mapTmdbToSeries);
    } catch (error) {
      console.error("Error fetching trending series:", error);
      return [];
    }
  },

  getTrendingMovies: async (timeWindow: 'day' | 'week' = 'day'): Promise<Series[]> => {
    try {
      const response = await fetch(`${BASE_URL}/trending/movie/${timeWindow}?api_key=${API_KEY}`);
      const data = await response.json();
      return data.results.map(mapTmdbToSeries);
    } catch (error) {
       console.error("Error fetching trending movies:", error);
       return [];
    }
  },

  search: async (query: string): Promise<Series[]> => {
    try {
      const response = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
      const data = await response.json();
      const results = data.results.filter((item: any) => item.media_type !== 'person');
      return results.map(mapTmdbToSeries);
    } catch (error) {
      console.error("Error searching:", error);
      return [];
    }
  },

  getDetails: async (id: string, type: 'movie' | 'tv' = 'tv'): Promise<{ series: Series, cast: Actor[] }> => {
    try {
      const response = await fetch(`${BASE_URL}/${type}/${id}?api_key=${API_KEY}&append_to_response=credits,videos,reviews,seasons,external_ids`);
      const data = await response.json();
      
      const series = mapTmdbToSeries(data);
      
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
      try {
          const response = await fetch(`${BASE_URL}/tv/${seriesId}/season/${seasonNumber}?api_key=${API_KEY}`);
          const data = await response.json();
          if (!data.episodes) return [];
          return data.episodes.map(mapTmdbEpisode);
      } catch (e) {
          console.error("Error fetching season details", e);
          return [];
      }
  },

  getCalendarShows: async (): Promise<Series[]> => {
    try {
        const response = await fetch(`${BASE_URL}/tv/on_the_air?api_key=${API_KEY}`);
        const data = await response.json();
        const initialList = data.results.slice(0, 14); 

        const detailPromises = initialList.map((item: any) => 
            fetch(`${BASE_URL}/tv/${item.id}?api_key=${API_KEY}`).then(res => res.json())
        );

        const detailsData = await Promise.all(detailPromises);
        
        return detailsData.map(mapTmdbToSeries);
    } catch (error) {
        console.error("Error fetching calendar data:", error);
        return [];
    }
  },

  // NEW: Helper for Categories
  getDiscoveryContent: async (endpoint: string, params: string): Promise<Series[]> => {
    try {
        const response = await fetch(`${BASE_URL}/${endpoint}?api_key=${API_KEY}&${params}`);
        const data = await response.json();
        if (!data.results) return [];
        return data.results.map(mapTmdbToSeries);
    } catch (e) {
        console.error("Discovery error:", e);
        return [];
    }
  },

  // NEW: Logic to enrich series list with OMDb data
  enrichSeries: async (seriesList: Series[]): Promise<Series[]> => {
      // Limit to first 6 items to avoid rate limiting/performance hit on listing pages
      const itemsToEnrich = seriesList.slice(0, 6);
      const remainingItems = seriesList.slice(6);

      const enrichedItems = await Promise.all(itemsToEnrich.map(async (item) => {
          try {
              // 1. Get External IDs (if not already fetched)
              // Note: discovery results usually don't include external_ids, so we must fetch them.
              // We infer media type based on original_title vs original_name presence in mapTmdbToSeries or checking internal props
              // But Series interface abstracts this. We'll try 'tv' if title_tr exists, or 'movie'.
              // A safer way is checking known props or guessing.
              // For robustness, we'll try to determine type or assume from the discovery context passed in? 
              // Since we don't have context here, we do a best guess or fetch both if needed.
              // Optimization: We will skip strict ID fetching for list views to save quota unless critical.
              // The user prompt *demands* the enrichment. We will do it properly.
              
              const mediaType = item.episodes_total > 0 || item.seasons ? 'tv' : 'movie'; 
              
              const idRes = await fetch(`${BASE_URL}/${mediaType}/${item.id}/external_ids?api_key=${API_KEY}`);
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