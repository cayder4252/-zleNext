
let API_KEY = '21053517d9msh7be6afdfd60a909p1f8df1jsn98c1905098be';
let IS_ENABLED = true;

const BASE_URL = 'https://moviesdatabase.p.rapidapi.com';

export const moviesDatabaseInit = (key: string, enabled: boolean) => {
  API_KEY = key;
  IS_ENABLED = enabled;
};

export const moviesDatabase = {
  getMainActors: async (imdbId: string) => {
    if (!IS_ENABLED || !imdbId) return null;
    try {
      const response = await fetch(`${BASE_URL}/titles/${imdbId}/main_actors`, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': API_KEY,
          'x-rapidapi-host': 'moviesdatabase.p.rapidapi.com'
        }
      });

      if (!response.ok) throw new Error(`MoviesDatabase Error: ${response.status}`);
      
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.warn("MoviesDatabase fetch failed:", error);
      return null;
    }
  },

  getTitleDetails: async (imdbId: string) => {
    if (!IS_ENABLED || !imdbId) return null;
    try {
      const response = await fetch(`${BASE_URL}/titles/${imdbId}`, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': API_KEY,
          'x-rapidapi-host': 'moviesdatabase.p.rapidapi.com'
        }
      });
      
      if (!response.ok) throw new Error(`MoviesDatabase Detail Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn("MoviesDatabase Title Detail fetch failed:", error);
      return null;
    }
  }
};
