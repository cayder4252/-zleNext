import { Series } from '../types';

const API_KEY = 'trilogy'; // Common free API key for educational use
const BASE_URL = 'https://www.omdbapi.com';

export const omdb = {
  getDetails: async (imdbId: string): Promise<Partial<Series> | null> => {
    try {
      const response = await fetch(`${BASE_URL}/?apikey=${API_KEY}&i=${imdbId}`);
      const data = await response.json();
      
      if (data.Response === 'False') {
          console.warn('OMDb Error:', data.Error);
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
    } catch (error) {
      console.error("OMDb fetch error:", error);
      return null;
    }
  }
};
