import { Series, RatingRecord, Actor } from './types';

export const MOCK_SERIES: Series[] = [
  {
    id: '1',
    title_tr: 'Yalı Çapkını',
    title_en: 'Golden Boy',
    synopsis: 'Ferit, the son of a wealthy family, is famous for his debauchery. His grandfather Halis Agha decides to marry him off to a girl from Gaziantep to discipline him.',
    status: 'Airing',
    network: 'Star TV',
    poster_url: 'https://picsum.photos/300/450?random=1',
    banner_url: 'https://picsum.photos/1200/600?random=1',
    rating: 8.5,
    episodes_total: 60,
    episodes_aired: 58,
    is_featured: true
  },
  {
    id: '2',
    title_tr: 'Kızılcık Şerbeti',
    title_en: 'Cranberry Sorbet',
    synopsis: 'A love story between two extreme families with the same truth but different methods.',
    status: 'Airing',
    network: 'Show TV',
    poster_url: 'https://picsum.photos/300/450?random=2',
    banner_url: 'https://picsum.photos/1200/600?random=2',
    rating: 9.1,
    episodes_total: 55,
    episodes_aired: 55,
    is_featured: true
  },
  {
    id: '3',
    title_tr: 'Yargı',
    title_en: 'Family Secrets',
    synopsis: 'A lawyer and a prosecutor, whose paths cross with a murder case, will have to work together to find the murderer.',
    status: 'Ended',
    network: 'Kanal D',
    poster_url: 'https://picsum.photos/300/450?random=3',
    banner_url: 'https://picsum.photos/1200/600?random=3',
    rating: 8.8,
    episodes_total: 95,
    episodes_aired: 95
  },
  {
    id: '4',
    title_tr: 'Gaddar',
    title_en: 'No Mercy',
    synopsis: 'Dağhan returns from the military to find his life turned upside down.',
    status: 'Airing',
    network: 'NOW',
    poster_url: 'https://picsum.photos/300/450?random=4',
    banner_url: 'https://picsum.photos/1200/600?random=4',
    rating: 7.4,
    episodes_total: 20,
    episodes_aired: 12
  },
  {
    id: '5',
    title_tr: 'Bahar',
    title_en: 'Bahar',
    synopsis: 'Bahar faces a serious illness and wakes up to a new life, realizing her "perfect" family isn\'t what it seems.',
    status: 'Airing',
    network: 'Show TV',
    poster_url: 'https://picsum.photos/300/450?random=5',
    banner_url: 'https://picsum.photos/1200/600?random=5',
    rating: 9.5,
    episodes_total: 10,
    episodes_aired: 8,
    is_featured: true
  }
];

export const MOCK_RATINGS: RatingRecord[] = [
  { id: '1', rank: 1, previous_rank: 1, series_id: '2', category: 'Total', rating: 9.85, share: 22.40, trend: 'stable' },
  { id: '2', rank: 2, previous_rank: 3, series_id: '5', category: 'Total', rating: 8.90, share: 19.10, trend: 'up' },
  { id: '3', rank: 3, previous_rank: 2, series_id: '1', category: 'Total', rating: 7.20, share: 16.50, trend: 'down' },
  { id: '4', rank: 4, previous_rank: 5, series_id: '4', category: 'Total', rating: 5.40, share: 12.20, trend: 'up' },
];

export const MOCK_ACTORS: Actor[] = [
  { id: '1', name: 'Afra Saraçoğlu', role_type: 'Lead', character_name: 'Seyran', photo_url: 'https://picsum.photos/100/100?random=10' },
  { id: '2', name: 'Mert Ramazan Demir', role_type: 'Lead', character_name: 'Ferit', photo_url: 'https://picsum.photos/100/100?random=11' },
];
