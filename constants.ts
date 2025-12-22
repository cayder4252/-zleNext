
import { Series, RatingRecord, Actor } from './types';

export const MOCK_SERIES: Series[] = [
  {
    id: 'tv_114479',
    media_type: 'tv',
    title_tr: 'Yalı Çapkını',
    title_en: 'Golden Boy',
    synopsis: 'Ferit, the son of a wealthy family, is famous for his debauchery. His grandfather Halis Agha decides to marry him off to a girl from Gaziantep to discipline him.',
    status: 'Airing',
    network: 'Star TV',
    poster_url: 'https://image.tmdb.org/t/p/w780/7N7R53YlW9F69kYcAn2Xh9q90.jpg',
    banner_url: 'https://image.tmdb.org/t/p/original/m99T1E67l6tW9oF3RzY4o9v4o5.jpg',
    rating: 8.5,
    episodes_total: 60,
    episodes_aired: 58,
    is_featured: true
  },
  {
    id: 'tv_152345',
    media_type: 'tv',
    title_tr: 'Kızılcık Şerbeti',
    title_en: 'Cranberry Sorbet',
    synopsis: 'A love story between two extreme families with the same truth but different methods.',
    status: 'Airing',
    network: 'Show TV',
    poster_url: 'https://image.tmdb.org/t/p/w780/8u9z3G3C5oY6W6W6W6W6W6W6.jpg',
    banner_url: 'https://image.tmdb.org/t/p/original/9iW6W6W6W6W6W6W6W6W6.jpg',
    rating: 9.1,
    episodes_total: 55,
    episodes_aired: 55,
    is_featured: true
  },
  {
    id: 'tv_133604',
    media_type: 'tv',
    title_tr: 'Yargı',
    title_en: 'Family Secrets',
    synopsis: 'A lawyer and a prosecutor, whose paths cross with a murder case, will have to work together to find the murderer.',
    status: 'Ended',
    network: 'Kanal D',
    poster_url: 'https://image.tmdb.org/t/p/w780/6W6W6W6W6W6W6W6W6W6.jpg',
    banner_url: 'https://image.tmdb.org/t/p/original/7W6W6W6W6W6W6W6W6W6.jpg',
    rating: 8.8,
    episodes_total: 95,
    episodes_aired: 95
  },
  {
    id: 'tv_241517',
    media_type: 'tv',
    title_tr: 'Bahar',
    title_en: 'Bahar',
    synopsis: 'Bahar faces a serious illness and wakes up to a new life, realizing her "perfect" family isn\'t what it seems.',
    status: 'Airing',
    network: 'Show TV',
    poster_url: 'https://image.tmdb.org/t/p/w780/bahar_poster.jpg',
    banner_url: 'https://image.tmdb.org/t/p/original/bahar_banner.jpg',
    rating: 9.5,
    episodes_total: 10,
    episodes_aired: 8,
    is_featured: true
  }
];

export const MOCK_RATINGS: RatingRecord[] = [
  { id: '1', rank: 1, previous_rank: 1, series_id: 'tv_152345', category: 'Total', rating: 9.85, share: 22.40, trend: 'stable' },
  { id: '2', rank: 2, previous_rank: 3, series_id: 'tv_241517', category: 'Total', rating: 8.90, share: 19.10, trend: 'up' },
  { id: '3', rank: 3, previous_rank: 2, series_id: 'tv_114479', category: 'Total', rating: 7.20, share: 16.50, trend: 'down' },
];

export const MOCK_ACTORS: Actor[] = [
  { id: '1', name: 'Afra Saraçoğlu', role_type: 'Lead', character_name: 'Seyran', photo_url: 'https://picsum.photos/100/100?random=10' },
  { id: '2', name: 'Mert Ramazan Demir', role_type: 'Lead', character_name: 'Ferit', photo_url: 'https://picsum.photos/100/100?random=11' },
];
