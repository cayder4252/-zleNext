
import { db } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { SiteConfig, ApiProvider } from '../types';

export const DEFAULT_CONFIG: SiteConfig = {
  siteName: 'İZLE',
  siteNamePart2: 'NEXT',
  logoUrl: '', // Reset to empty to start with default icon branding
  contactEmail: 'support@izlenext.com',
  contactPhone: '+90 212 000 00 00',
  address: 'Levent, Istanbul, Turkey',
  socialLinks: {},
  apiProviders: [
    { id: 'tmdb', name: 'TMDb', apiKey: '85251d97249cfcc215d008c0a93cd2ac', isEnabled: true, description: 'Main database for series and movies.' },
    { id: 'omdb', name: 'OMDb', apiKey: 'trilogy', isEnabled: true, description: 'Enriches data with IMDb ratings and awards.' },
    { id: 'watchmode', name: 'Watchmode', apiKey: 'ldDCNifAdxxUu7UMXMXhWo1AUNHsP0QLnxrUnmzI', isEnabled: true, description: 'Provides streaming availability info.' },
    { id: 'moviesdatabase', name: 'MoviesDatabase (RapidAPI)', apiKey: '21053517d9msh7be6afdfd60a909p1f8df1jsn98c1905098be', isEnabled: true, description: 'Extends title metadata and actor database.' }
  ]
};

const CACHE_KEY = 'izlenext_site_config';

export const settingsService = {
  getCachedConfig(): SiteConfig {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        return DEFAULT_CONFIG;
      }
    }
    return DEFAULT_CONFIG;
  },

  async getConfig(): Promise<SiteConfig> {
    const docRef = doc(db, 'settings', 'global');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as SiteConfig;
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      return data;
    }
    await setDoc(docRef, DEFAULT_CONFIG);
    localStorage.setItem(CACHE_KEY, JSON.stringify(DEFAULT_CONFIG));
    return DEFAULT_CONFIG;
  },

  async updateConfig(config: SiteConfig): Promise<void> {
    const docRef = doc(db, 'settings', 'global');
    localStorage.setItem(CACHE_KEY, JSON.stringify(config));
    await setDoc(docRef, config, { merge: true });
  },

  subscribeToConfig(callback: (config: SiteConfig) => void) {
    return onSnapshot(doc(db, 'settings', 'global'), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as SiteConfig;
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        callback(data);
      } else {
        callback(DEFAULT_CONFIG);
      }
    });
  }
};
