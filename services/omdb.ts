
import { Series } from '../types';

let API_KEY = 'trilogy';
let IS_ENABLED = true;

const BASE_URL = 'https://www.omdbapi.com';

export const omdbInit = (key: string, enabled: boolean) => {
  API_KEY = key;
  IS_ENABLED = enabled;
};

export const omdb = {
  getDetails: async (imdbId: string): Promise<Partial<Series> | null> => {
    if (!IS_ENABLED) return null;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(`${BASE_URL}/?apikey=${API_KEY}&i=${imdbId}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
          return null;
      }

      const data = await response.json();
      
      if (data.Response === 'False') {
          return null;
      }

      return {
        awards: data.Awards !== 'N/A' ? data.Awards : undefined,
        director: data.Director !== 'N/A' ? data.Director : undefined,
        writer: data.Writer !== 'N/A' ? data.Writer : undefined,
        metascore: data.Metascore !== 'N/A' ? data.Metascore : undefined,
        imdb_rating: data.imdbRating !== 'N/A' ? data.imdbRating : undefined,
        imdb_votes: data.imdbVotes !== 'N/A' ? data.imdbVotes : undefined,
      };
    } catch (error: any) {
      if (error.name !== 'AbortError') {
          console.warn(`OMDb enrichment skipped for ${imdbId}: ${error.message}`);
      }
      return null;
    }
  }
};
