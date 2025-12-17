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

export type ViewState = 'HOME' | 'RATINGS' | 'CALENDAR' | 'PROFILE' | 'ADMIN' | 'LOGIN' | 'REGISTER' | 'SERIES_DETAIL';