import { Series, Actor, Episode } from '../types';

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

// Mapper function to convert TMDb data to your App's Series interface
const mapTmdbToSeries = (item: TmdbItem | TmdbDetail): Series => {
  const isMovie = 'title' in item;
  const title = isMovie ? item.title : item.name;
  const originalTitle = isMovie ? item.original_title : item.original_name;
  const date = isMovie ? item.release_date : item.first_air_date;
  
  // Default values for detailed fields that might be missing in list view
  const detailedItem = item as TmdbDetail;
  const network = detailedItem.networks && detailedItem.networks.length > 0 ? detailedItem.networks[0].name : 'TMDb';
  
  let trailerUrl = undefined;
  if (detailedItem.videos && detailedItem.videos.results) {
    const trailer = detailedItem.videos.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
    if (trailer) trailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
  }

  const genreNames = detailedItem.genres ? detailedItem.genres.map(g => g.name) : [];
  // Approximate runtime for lists if not available
  const runtimeString = detailedItem.runtime ? `${detailedItem.runtime} min` : (detailedItem.episode_run_time?.[0] ? `${detailedItem.episode_run_time[0]} min` : undefined);

  // Episode calculations
  let episodesTotal = 0;
  let episodesAired = 0;
  let latestEpisode: Episode | undefined = undefined;
  let nextEpisode: Episode | undefined = undefined;

  if (detailedItem.last_episode_to_air) {
      episodesAired = detailedItem.last_episode_to_air.episode_number; // Approximation using last ep number
      episodesTotal = episodesAired + (detailedItem.next_episode_to_air ? 1 : 0); // basic logic
      latestEpisode = mapTmdbEpisode(detailedItem.last_episode_to_air);
  }
  if (detailedItem.next_episode_to_air) {
      nextEpisode = mapTmdbEpisode(detailedItem.next_episode_to_air);
  }

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
    is_featured: item.vote_average > 7.5,
    release_year: date ? new Date(date).getFullYear() : undefined,
    genres: genreNames,
    runtime: runtimeString,
    trailer_url: trailerUrl,
    latest_episode: latestEpisode,
    next_episode: nextEpisode,
    social_links: {} 
  };
};

export const tmdb = {
  // A. Fetch Trending (Using Discover for Turkish Dramas to fit the app theme, falling back to trending)
  getTurkishSeries: async (): Promise<Series[]> => {
    try {
      // Prioritize Turkish TV shows for "İzleNext"
      const response = await fetch(`${BASE_URL}/discover/tv?api_key=${API_KEY}&with_original_language=tr&sort_by=popularity.desc`);
      const data = await response.json();
      return data.results.map(mapTmdbToSeries);
    } catch (error) {
      console.error("Error fetching Turkish series:", error);
      return [];
    }
  },

  getTrendingMovies: async (): Promise<Series[]> => {
    try {
      const response = await fetch(`${BASE_URL}/trending/movie/day?api_key=${API_KEY}`);
      const data = await response.json();
      return data.results.map(mapTmdbToSeries);
    } catch (error) {
       console.error("Error fetching trending movies:", error);
       return [];
    }
  },

  // B. Search
  search: async (query: string): Promise<Series[]> => {
    try {
      const response = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
      const data = await response.json();
      // Filter out 'person' results
      const results = data.results.filter((item: any) => item.media_type !== 'person');
      return results.map(mapTmdbToSeries);
    } catch (error) {
      console.error("Error searching:", error);
      return [];
    }
  },

  // C. Get Details
  getDetails: async (id: string, type: 'movie' | 'tv' = 'tv'): Promise<{ series: Series, cast: Actor[] }> => {
    try {
      const response = await fetch(`${BASE_URL}/${type}/${id}?api_key=${API_KEY}&append_to_response=credits,videos`);
      const data = await response.json();
      
      const series = mapTmdbToSeries(data);
      
      const cast: Actor[] = data.credits.cast.slice(0, 15).map((c: any) => ({
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
  }
};
