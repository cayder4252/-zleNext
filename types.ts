
export interface Series {
  id: string;
  title_tr: string;
  title_en: string;
  synopsis: string;
  status: 'Airing' | 'Ended';
  network: string;
  poster_url: string;
  banner_url: string;
  rating: number;
  episodes_total: number;
  episodes_aired: number;
  is_featured?: boolean;
  
  // Detailed Fields
  release_year?: number;
  genres?: string[];
  schedule?: string;
  runtime?: string;
  trailer_url?: string;
  social_links?: {
    instagram?: string;
    youtube?: string;
    facebook?: string;
    official_site?: string;
  };
  
  // Episode Data
  latest_episode?: Episode;
  next_episode?: Episode;
  seasons?: Season[];
  reviews?: Review[];

  // OMDb / External Data
  imdb_id?: string;
  imdb_rating?: string;
  imdb_votes?: string;
  awards?: string;
  director?: string;
  writer?: string;
  metascore?: string;
}

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: { name: string };
}

export interface Episode {
  id: number;
  name: string;
  episode_number: number;
  season_number: number;
  air_date: string;
  overview: string;
  still_path: string | null;
  vote_average?: number;
}

export interface Season {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  air_date?: string;
  poster_path?: string;
  overview?: string;
}

export interface Review {
  id: string;
  author: string;
  content: string;
  created_at: string;
  rating?: number;
  avatar_path?: string;
}

export interface Actor {
  id: string;
  name: string;
  role_type: 'Lead' | 'Supporting';
  photo_url: string;
  character_name: string;
}

export interface RatingRecord {
  id: string;
  rank: number;
  previous_rank: number;
  series_id: string;
  category: 'Total' | 'AB' | 'ABC1';
  rating: number;
  share: number;
  trend: 'up' | 'down' | 'stable';
  date?: string;
}

export interface UserStats {
  total_watched_hours: number;
  shows_completed: number;
  episodes_watched: number;
  favorite_genre: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  avatar_url?: string;
  createdAt?: string;
  bio?: string;
  location?: string;
  watchlist?: string[];
}

export interface ApiProvider {
  id: string;
  name: string;
  apiKey: string;
  isEnabled: boolean;
  description: string;
}

export interface SiteConfig {
  siteName: string;
  siteNamePart2: string; // The "NEXT" part
  logoUrl?: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
  apiProviders: ApiProvider[];
}

export type ViewState = 'HOME' | 'RATINGS' | 'CALENDAR' | 'PROFILE' | 'ADMIN' | 'LOGIN' | 'REGISTER' | 'SERIES_DETAIL';
