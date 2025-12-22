
import { NewsArticle } from '../types';

const API_KEY = 'ec59e231fdab4a539f1e9aefcc573d82';
const BASE_URL = 'https://newsapi.org/v2';

// High-quality fallback news for when the API is blocked by CORS (common for NewsAPI on client-side)
const MOCK_NEWS: NewsArticle[] = [
  {
    title: "Yalı Çapkını'nda Büyük Sürpriz: Yeni Sezon Hazırlıkları Başladı",
    description: "Star TV'nin reyting rekortmeni dizisi Yalı Çapkını'nın yeni sezonunda kadroya katılacak isimler belli olmaya başladı.",
    url: "#",
    urlToImage: "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?auto=format&fit=crop&q=80&w=800",
    publishedAt: new Date().toISOString(),
    source: { name: "Dizi Haber" }
  },
  {
    title: "Kızılcık Şerbeti'nde Ayrılık Rüzgarları: Başrol Oyuncusu Veda Ediyor",
    description: "Show TV'nin sevilen dizisi Kızılcık Şerbeti'nde izleyicileri şaşırtacak bir ayrılık yaşanacak.",
    url: "#",
    urlToImage: "https://images.unsplash.com/photo-1533488765986-dfa2a9939acd?auto=format&fit=crop&q=80&w=800",
    publishedAt: new Date().toISOString(),
    source: { name: "TV Gündem" }
  },
  {
    title: "Bahar Dizisi Reytingleri Alt Üst Etti: Türk Dizileri Dünyayı Sarıyor",
    description: "Dememet Evgar'ın başrolünde yer aldığı Bahar dizisi, sadece Türkiye'de değil dünya listelerinde de zirvede.",
    url: "#",
    urlToImage: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&q=80&w=800",
    publishedAt: new Date().toISOString(),
    source: { name: "Medya Takip" }
  }
];

export const newsService = {
  getLatestTurkishNews: async (): Promise<NewsArticle[]> => {
    try {
      // NewsAPI often blocks client-side requests from browsers with "426 Upgrade Required" or CORS issues
      const response = await fetch(`${BASE_URL}/top-headlines?country=tr&category=entertainment&apiKey=${API_KEY}`, {
          mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error("API Limit reached or CORS restriction");
      }

      const data = await response.json();
      
      if (data.status === 'ok' && data.articles && data.articles.length > 0) {
        return data.articles.filter((a: any) => a.title && a.urlToImage);
      }
      
      return MOCK_NEWS;
    } catch (error) {
      console.warn("News API failed (likely CORS or API Key limit), using fallback data.");
      return MOCK_NEWS;
    }
  }
};
