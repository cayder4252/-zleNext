
import { db } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { SiteConfig, ApiProvider } from '../types';

const DEFAULT_CONFIG: SiteConfig = {
  siteName: 'İZLE',
  siteNamePart2: 'NEXT',
  contactEmail: 'support@izlenext.com',
  contactPhone: '+90 212 000 00 00',
  address: 'Levent, Istanbul, Turkey',
  socialLinks: {},
  apiProviders: [
    { id: 'tmdb', name: 'TMDb', apiKey: '85251d97249cfcc215d008c0a93cd2ac', isEnabled: true, description: 'Main database for series and movies.' },
    { id: 'omdb', name: 'OMDb', apiKey: 'trilogy', isEnabled: true, description: 'Enriches data with IMDb ratings and awards.' },
    { id: 'watchmode', name: 'Watchmode', apiKey: 'ldDCNifAdxxUu7UMXMXhWo1AUNHsP0QLnxrUnmzI', isEnabled: true, description: 'Provides streaming availability info.' }
  ]
};

export const settingsService = {
  async getConfig(): Promise<SiteConfig> {
    const docRef = doc(db, 'settings', 'global');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as SiteConfig;
    }
    // Initialize with defaults if empty
    await setDoc(docRef, DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  },

  async updateConfig(config: SiteConfig): Promise<void> {
    const docRef = doc(db, 'settings', 'global');
    await setDoc(docRef, config, { merge: true });
  },

  subscribeToConfig(callback: (config: SiteConfig) => void) {
    return onSnapshot(doc(db, 'settings', 'global'), (doc) => {
      if (doc.exists()) {
        callback(doc.data() as SiteConfig);
      } else {
        callback(DEFAULT_CONFIG);
      }
    });
  }
};
