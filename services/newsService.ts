
import { NewsArticle } from '../types';

const API_KEY = 'ec59e231fdab4a539f1e9aefcc573d82';
const BASE_URL = 'https://newsapi.org/v2';

export const newsService = {
  getLatestTurkishNews: async (): Promise<NewsArticle[]> => {
    try {
      // Fetching top headlines for Turkey related to entertainment and general
      const response = await fetch(`${BASE_URL}/top-headlines?country=tr&category=entertainment&apiKey=${API_KEY}`);
      const data = await response.json();
      
      if (data.status === 'ok') {
        return data.articles.filter((a: any) => a.title && a.urlToImage);
      }
      
      // Fallback to a general search if headlines are empty
      const fallback = await fetch(`${BASE_URL}/everything?q=dizi+haberleri&language=tr&sortBy=publishedAt&apiKey=${API_KEY}`);
      const fallbackData = await fallback.json();
      return fallbackData.articles?.filter((a: any) => a.title && a.urlToImage).slice(0, 10) || [];
    } catch (error) {
      console.error("News API error:", error);
      return [];
    }
  }
};
