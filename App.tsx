
import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { DiziCard } from './components/DiziCard';
import { RatingsTable } from './components/RatingsTable';
import { SeriesDetail } from './components/SeriesDetail'; 
import { CategoryRow } from './components/CategoryRow'; 
import { AdminPanel } from './pages/Admin';
import { AuthPage } from './pages/Auth';
import { ViewState, User, Series, Actor, SiteConfig, NewsArticle } from './types'; 
import { MOCK_SERIES, MOCK_RATINGS } from './constants';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, updatePassword, updateProfile as updateAuthProfile } from 'firebase/auth';
import { collection, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { tmdb, tmdbInit } from './services/tmdb';
import { omdb, omdbInit } from './services/omdb'; 
import { watchmodeInit } from './services/watchmode';
import { settingsService } from './services/settingsService';
import { newsService } from './services/newsService';
import { 
    Play, 
    X,
    Bell,
    Edit2,
    Save,
    Lock,
    User as UserIcon,
    Link as LinkIcon,
    CheckCircle,
    AlertCircle,
    Heart,
    Plus,
    Globe,
    Filter,
    Clapperboard,
    Tv as TvIcon,
    Calendar,
    ChevronDown,
    ExternalLink,
    Newspaper,
    Sparkles,
    TrendingUp,
    Clock,
    Search,
    ChevronLeft,
    ChevronRight,
    Flame,
    Zap,
    Skull,
    Camera,
    Trophy,
    History
} from 'lucide-react';

const SERIES_CACHE_KEY = 'izlenext_series_cache';

const LANGUAGES = [
    { code: 'all', name: 'All Languages', flag: '🌐' },
    { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
];

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('HOME');
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null); 
  const [user, setUser] = useState<User | null>(null);
  
  // Persist userProfile in localStorage to bridge refresh/load times
  const [userProfile, setUserProfile] = useState<User | null>(() => {
    const saved = localStorage.getItem('izlenext_user_profile');
    return saved ? JSON.parse(saved) : null;
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const [seriesList, setSeriesList] = useState<Series[]>(() => {
    const cached = localStorage.getItem(SERIES_CACHE_KEY);
    return cached ? JSON.parse(cached) : MOCK_SERIES;
  });

  const [calendarData, setCalendarData] = useState<Series[]>([]);
  const [calendarLanguage, setCalendarLanguage] = useState('all');
  const [calendarType, setCalendarType] = useState<'tv' | 'movie'>('tv');
  const [loadingCalendar, setLoadingCalendar] = useState(false);

  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);

  const [loadingSeries, setLoadingSeries] = useState(false);
  const [browseTitle, setBrowseTitle] = useState<string | null>(null);
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [detailData, setDetailData] = useState<{ series: Series, cast: Actor[] } | null>(null);
  
  const [localWatchlist, setLocalWatchlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('user_watchlist');
    return saved ? JSON.parse(saved) : [];
  });

  const [profileForm, setProfileForm] = useState({ name: '', bio: '', avatar_url: '', newPassword: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideInterval = useRef<number | null>(null);

  useEffect(() => {
    const unsubConfig = settingsService.subscribeToConfig((config) => {
        config.apiProviders.forEach(p => {
          if (p.id === 'tmdb') tmdbInit(p.apiKey, p.isEnabled);
          if (p.id === 'omdb') omdbInit(p.apiKey, p.isEnabled);
          if (p.id === 'watchmode') watchmodeInit(p.apiKey, p.isEnabled);
        });
    });
    return () => unsubConfig();
  }, []);

  useEffect(() => {
    const fetchNews = async () => {
      setLoadingNews(true);
      try {
        const latest = await newsService.getLatestTurkishNews();
        setNews(latest);
      } catch (e) {
        console.error("News fetch error in App", e);
      } finally {
        setLoadingNews(false);
      }
    };
    fetchNews();
  }, []);

  // Sync watchlist to localStorage
  useEffect(() => {
    localStorage.setItem('user_watchlist', JSON.stringify(localWatchlist));
  }, [localWatchlist]);

  // Sync userProfile to localStorage for instant hydration on next load
  useEffect(() => {
    if (userProfile) {
      localStorage.setItem('izlenext_user_profile', JSON.stringify(userProfile));
    } else {
      localStorage.removeItem('izlenext_user_profile');
    }
  }, [userProfile]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const role = firebaseUser.email?.toLowerCase().includes('admin') ? 'ADMIN' : 'USER';
        const userData: User = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email || '',
          role: role,
          avatar_url: firebaseUser.photoURL || undefined
        };
        setUser(userData);
      } else {
        setUser(null);
        setUserProfile(null);
        localStorage.removeItem('izlenext_user_profile');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const unsub = onSnapshot(doc(db, 'users', user.id), (docSnapshot) => {
        if (docSnapshot.exists()) {
          const profile = docSnapshot.data() as User;
          setUserProfile(profile);
          setProfileForm(prev => ({
              ...prev,
              name: profile.name || user.name,
              bio: profile.bio || '',
              avatar_url: profile.avatar_url || '',
          }));
          if (profile.watchlist) {
            setLocalWatchlist(prev => Array.from(new Set([...prev, ...profile.watchlist!])));
          }
        }
    });
    return () => unsub();
  }, [user?.id]);

  useEffect(() => {
    const fetchData = async () => {
      if (seriesList.length === 0 || seriesList === MOCK_SERIES) setLoadingSeries(true);
      const firestorePromise = new Promise<Series[]>((resolve) => {
         const unsub = onSnapshot(collection(db, 'series'), (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Series[];
            resolve(list);
         }, () => resolve([]));
      });
      const tmdbPromise = tmdb.getTrendingSeries();
      try {
        const [firestoreData, tmdbData] = await Promise.all([firestorePromise, tmdbPromise]);
        let combined = [...firestoreData, ...tmdbData];
        if (combined.length === 0) combined = MOCK_SERIES;
        setSeriesList(combined);
        localStorage.setItem(SERIES_CACHE_KEY, JSON.stringify(combined));
      } catch (e) {} finally { setLoadingSeries(false); }
    };
    fetchData();
  }, []);

  // --- SEARCH LOGIC ---
  useEffect(() => {
    const performSearch = async () => {
      const trimmedQuery = searchQuery.trim();
      
      // If query is empty, restore trending data
      if (!trimmedQuery) {
        if (isBrowsing) return; // Keep browsing results if browsing
        setIsSearching(false);
        setLoadingSeries(true);
        try {
          const trending = await tmdb.getTrendingSeries();
          setSeriesList(trending);
        } catch (e) {} finally {
          setLoadingSeries(false);
        }
        return;
      }

      setIsSearching(true);
      setLoadingSeries(true);
      setIsBrowsing(false); // Search overrides browsing
      
      try {
        const results = await tmdb.search(trimmedQuery);
        setSeriesList(results);
      } catch (e) {
        console.error("Search failed:", e);
      } finally {
        setIsSearching(false);
        setLoadingSeries(false);
      }
    };

    const timeoutId = setTimeout(performSearch, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    if (currentView !== 'CALENDAR') return;
    const fetchCalendar = async () => {
        setLoadingCalendar(true);
        try {
            const data = await tmdb.getCalendarData(calendarType, calendarLanguage);
            setCalendarData(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingCalendar(false);
        }
    };
    fetchCalendar();
  }, [currentView, calendarLanguage, calendarType]);

  // Carousel Logic
  const trendingForSlides = seriesList.filter(s => s.is_featured || s.rating > 7).slice(0, 10);
  
  useEffect(() => {
    if (currentView === 'HOME' && !searchQuery && !isBrowsing && trendingForSlides.length > 1) {
      slideInterval.current = window.setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % trendingForSlides.length);
      }, 5000);
    }
    return () => {
      if (slideInterval.current) clearInterval(slideInterval.current);
    };
  }, [currentView, searchQuery, isBrowsing, trendingForSlides.length]);

  const handleLogin = (email: string, name: string, role: 'ADMIN' | 'USER') => {
    if (role === 'ADMIN') setCurrentView('ADMIN');
    else setCurrentView('HOME');
  };

  const handleLogout = async () => {
    try { 
        await signOut(auth); 
        setCurrentView('HOME'); 
        localStorage.removeItem('izlenext_user_profile');
        localStorage.removeItem('user_watchlist');
    } catch (error) {}
  };

  const handleBrowse = async (title: string, endpoint: string, params: string) => {
      setLoadingSeries(true);
      setSearchQuery('');
      setBrowseTitle(title);
      setIsBrowsing(true);
      window.scrollTo(0, 0);
      try {
          const results = await tmdb.getDiscoveryContent(endpoint, params);
          setSeriesList(results);
      } catch (e) {} finally { setLoadingSeries(false); }
  };

  const handleClearBrowse = async () => {
      setIsBrowsing(false);
      setBrowseTitle(null);
      setLoadingSeries(true);
      const homeData = await tmdb.getTrendingSeries();
      setSeriesList(homeData);
      setLoadingSeries(false);
  };

  const handleAddToWatchlist = async (id: string) => {
    const isAdded = localWatchlist.includes(id);
    const updatedWatchlist = isAdded 
        ? localWatchlist.filter(item => item !== id)
        : [...localWatchlist, id];
        
    setLocalWatchlist(updatedWatchlist);

    if (user) {
      const userRef = doc(db, 'users', user.id);
      try {
          if (isAdded) await updateDoc(userRef, { watchlist: arrayRemove(id) });
          else await updateDoc(userRef, { watchlist: arrayUnion(id) });
      } catch (error) { console.error("Watchlist sync failed", error); }
    }
  };

  const handleSeriesClick = async (id: string) => {
      // Internal ID is now standardized as tv_id or movie_id
      const isInternalId = id.includes('_');
      if (isInternalId) {
          try {
              const [type, rawId] = id.split('_');
              let data = await tmdb.getDetails(rawId, type as 'movie' | 'tv');
              if (data.series.imdb_id) {
                  const omdbData = await omdb.getDetails(data.series.imdb_id);
                  if (omdbData) data.series = { ...data.series, ...omdbData };
              }
              setDetailData(data);
          } catch (e) {
               console.error("Detail fetch failed", e);
          }
      } else {
          // Fallback for legacy numeric IDs (assume TV) or local series
          const isNumeric = /^\d+$/.test(id);
          if (isNumeric) {
               try {
                  let data = await tmdb.getDetails(id, 'tv');
                  setDetailData(data);
               } catch (e) {}
          } else {
              const localSeries = seriesList.find(s => s.id === id);
              if (localSeries) setDetailData({ series: localSeries, cast: [] });
          }
      }
      setSelectedSeriesId(id);
      setCurrentView('SERIES_DETAIL');
      window.scrollTo(0, 0); 
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || !auth.currentUser) return;
      setIsSavingProfile(true);
      setProfileMessage(null);
      
      const originalProfile = { ...userProfile };
      
      const newProfileData = { 
        ...userProfile, 
        name: profileForm.name, 
        bio: profileForm.bio, 
        avatar_url: profileForm.avatar_url 
      } as User;
      
      setUserProfile(newProfileData);
      localStorage.setItem('izlenext_user_profile', JSON.stringify(newProfileData));

      try {
          const updatePromises: Promise<any>[] = [];
          const userRef = doc(db, 'users', user.id);
          updatePromises.push(updateDoc(userRef, {
              name: profileForm.name,
              bio: profileForm.bio,
              avatar_url: profileForm.avatar_url
          }));
          updatePromises.push(updateAuthProfile(auth.currentUser, {
              displayName: profileForm.name,
              photoURL: profileForm.avatar_url
          }));
          await Promise.all(updatePromises);
          if (profileForm.newPassword) {
              try {
                  await updatePassword(auth.currentUser, profileForm.newPassword);
              } catch (pwdErr: any) {
                  if (pwdErr.code === 'auth/requires-recent-login') {
                      throw new Error('For security, password changes require you to log out and log back in first.');
                  }
                  throw pwdErr;
              }
          }
          setProfileMessage({ type: 'success', text: 'Identity updated successfully!' });
          setProfileForm(prev => ({ ...prev, newPassword: '' }));
          setTimeout(() => {
              setIsEditingProfile(false);
              setProfileMessage(null);
          }, 1500);
      } catch (err: any) {
          setUserProfile(originalProfile);
          if (originalProfile) localStorage.setItem('izlenext_user_profile', JSON.stringify(originalProfile));
          else localStorage.removeItem('izlenext_user_profile');
          setProfileMessage({ type: 'error', text: err.message || 'Update failed.' });
      } finally {
          setIsSavingProfile(false);
      }
  };

  const watchlist = localWatchlist;
  const displayUser = user ? { ...user, ...userProfile } : null;
  
  const calendarGrouped = calendarData.reduce((acc, series) => {
      if (series.next_episode?.air_date) {
          const dateStr = series.next_episode.air_date;
          if (!acc[dateStr]) acc[dateStr] = [];
          acc[dateStr].push(series);
      }
      return acc;
  }, {} as Record<string, Series[]>);

  const sortedDates = Object.keys(calendarGrouped).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  const CATEGORIES = [
    { title: "Bosphorus Romances", endpoint: "discover/tv", params: "with_original_language=tr&with_genres=10766&sort_by=popularity.desc" },
    { title: "Midnight in Istanbul Thrillers", endpoint: "discover/tv", params: "with_original_language=tr&with_genres=80&sort_by=popularity.desc" },
    { title: "Classic Turkish Legends", endpoint: "discover/tv", params: "with_original_language=tr&sort_by=vote_count.desc" },
    { title: "Modern Turkish Cinema", endpoint: "discover/movie", params: "with_original_language=tr&sort_by=release_date.desc" },
    { title: "K-Drama Wave", endpoint: "discover/tv", params: "with_original_language=ko&sort_by=popularity.desc" },
    { title: "Trending Anime Peaks", endpoint: "discover/tv", params: "with_original_language=ja&with_genres=16&sort_by=popularity.desc" },
    { title: "Spanish Language Hits", endpoint: "discover/tv", params: "with_original_language=es&sort_by=popularity.desc" },
    { title: "Bollywood Beats", endpoint: "discover/movie", params: "with_original_language=hi&sort_by=popularity.desc" },
    { title: "Edge-of-Your-Seat Thrillers", endpoint: "discover/movie", params: "with_genres=53&sort_by=vote_average.desc&vote_count.gte=1000" },
    { title: "Cyberpunk Odyssey", endpoint: "discover/movie", params: "with_genres=878&sort_by=popularity.desc" },
    { title: "Spine-Chilling Horror", endpoint: "discover/movie", params: "with_genres=27&sort_by=popularity.desc" },
    { title: "Medieval & Epic Fantasy", endpoint: "discover/tv", params: "with_genres=10765&sort_by=popularity.desc" },
    { title: "Laughter Therapy (Comedy)", endpoint: "discover/tv", params: "with_genres=35&sort_by=vote_average.desc&vote_count.gte=500" },
    { title: "True Crime Investigations", endpoint: "discover/tv", params: "with_genres=80&sort_by=vote_average.desc" },
    { title: "Historical Masterpieces", endpoint: "discover/movie", params: "with_genres=36&sort_by=vote_average.desc" },
    { title: "Strong Female Leads", endpoint: "discover/tv", params: "with_genres=18&sort_by=popularity.desc" },
    { title: "Based on True Stories", endpoint: "discover/movie", params: "with_genres=18,36&sort_by=popularity.desc" },
    { title: "Family Night Essentials", endpoint: "discover/movie", params: "with_genres=10751,16&sort_by=popularity.desc" },
    { title: "Mind-Bending Puzzles", endpoint: "discover/movie", params: "with_genres=9648,878&sort_by=vote_average.desc" },
    { title: "Supernatural Encounters", endpoint: "discover/tv", params: "with_genres=10765&sort_by=vote_average.desc" },
    { title: "IMDb Top Rated 250", endpoint: "movie/top_rated", params: "page=1" },
    { title: "Critics' Choice (TV)", endpoint: "tv/top_rated", params: "page=1" },
    { title: "Box Office Monsters", endpoint: "movie/popular", params: "page=1" },
    { title: "Hidden Indie Gems", endpoint: "discover/movie", params: "vote_count.lte=500&vote_average.gte=7&sort_by=popularity.desc" },
    { title: "Nostalgic 90s Rewind", endpoint: "discover/tv", params: "first_air_date.gte=1990-01-01&first_air_date.lte=1999-12-31" },
    { title: "The 2000s Hits", endpoint: "discover/tv", params: "first_air_date.gte=2000-01-01&first_air_date.lte=2010-12-31" },
    { title: "Short-Form Binge (30min)", endpoint: "discover/tv", params: "with_runtime.lte=30&sort_by=popularity.desc" },
    { title: "Epic Cinematic Runtimes", endpoint: "discover/movie", params: "with_runtime.gte=150&sort_by=popularity.desc" },
    { title: "Reality TV Obsession", endpoint: "discover/tv", params: "with_genres=10764&sort_by=popularity.desc" },
    { title: "War & Strategy", endpoint: "discover/tv", params: "with_genres=10768&sort_by=popularity.desc" },
    { title: "Musical Magic", endpoint: "discover/movie", params: "with_genres=10402&sort_by=popularity.desc" },
    { title: "The Western Frontier", endpoint: "discover/movie", params: "with_genres=37&sort_by=popularity.desc" },
    { title: "Coming-of-Age Journeys", endpoint: "discover/tv", params: "with_genres=18,10751&sort_by=vote_average.desc" },
  ];

  if (currentView === 'ADMIN') {
    if (!user || user.role !== 'ADMIN') { setCurrentView('LOGIN'); return null; }
    return <div className="relative"><button onClick={() => setCurrentView('HOME')} className="fixed bottom-4 right-4 z-50 bg-navy-900 text-white px-4 py-2 rounded-full shadow-lg border border-white/10 hover:bg-purple text-xs">Exit Admin</button><AdminPanel /></div>;
  }

  if (currentView === 'LOGIN' || currentView === 'REGISTER') {
    return <AuthPage view={currentView} onChangeView={setCurrentView} onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'HOME':
        return (
          <div className="animate-in fade-in duration-500">
            {!searchQuery && !isBrowsing && trendingForSlides.length > 0 && (
              <div className="relative h-[500px] md:h-[600px] w-full overflow-hidden bg-navy-900">
                {trendingForSlides.map((show, index) => (
                  <div 
                    key={show.id} 
                    className={`absolute inset-0 transition-all duration-1000 ease-in-out transform ${
                      index === currentSlide ? 'opacity-100 translate-x-0 scale-100 z-10' : 'opacity-0 translate-x-full scale-105 z-0'
                    }`}
                  >
                    <div className="absolute inset-0">
                        <img src={show.banner_url} alt={show.title_tr} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/60 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-navy-900 via-navy-900/40 to-transparent" />
                    </div>
                    <div className="container mx-auto px-4 relative h-full flex items-end pb-16 md:pb-24">
                      <div className={`max-w-2xl space-y-4 transition-all duration-700 delay-300 ${index === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                        <div className="flex items-center gap-2 text-white text-[10px] font-black uppercase tracking-[0.3em] drop-shadow-2xl">
                          <Sparkles className="w-3.5 h-3.5 text-purple fill-purple/20" /> 
                          Trending Global
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-xl">{show.title_tr}</h1>
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                            <span className="px-2 py-0.5 border border-white/20 rounded text-[10px] font-bold uppercase">{show.network}</span>
                            <span className="w-1 h-1 bg-white/20 rounded-full" />
                            <span className="font-medium">{show.genres?.slice(0, 3).join(', ')}</span>
                        </div>
                        <p className="text-gray-300 text-base md:text-lg line-clamp-2 md:line-clamp-3 font-medium leading-relaxed max-w-xl">{show.synopsis}</p>
                        <div className="flex gap-4 pt-4">
                            <button onClick={() => handleSeriesClick(show.id)} className="bg-purple hover:bg-purple-light text-white px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all transform hover:scale-105 shadow-2xl shadow-purple/30"><Play className="w-5 h-5 fill-current" /> Watch Now</button>
                            <button onClick={() => handleAddToWatchlist(show.id)} className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all border border-white/10">{watchlist.includes(show.id) ? '- Remove' : '+ Watchlist'}</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="absolute bottom-8 right-4 md:right-12 z-20 flex items-center gap-3">
                    {trendingForSlides.map((_, i) => (
                        <button 
                            key={i} 
                            onClick={() => setCurrentSlide(i)}
                            className={`h-1.5 transition-all duration-500 rounded-full ${i === currentSlide ? 'w-8 bg-purple' : 'w-2 bg-white/30 hover:bg-white/50'}`} 
                        />
                    ))}
                </div>
                
                <div className="absolute top-1/2 -translate-y-1/2 left-4 md:left-8 z-20 hidden md:block">
                    <button onClick={() => setCurrentSlide(prev => (prev - 1 + trendingForSlides.length) % trendingForSlides.length)} className="p-3 rounded-full bg-black/20 backdrop-blur-md border border-white/5 text-white hover:bg-purple transition-all">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                </div>
                <div className="absolute top-1/2 -translate-y-1/2 right-4 md:right-8 z-20 hidden md:block">
                    <button onClick={() => setCurrentSlide(prev => (prev + 1) % trendingForSlides.length)} className="p-3 rounded-full bg-black/20 backdrop-blur-md border border-white/5 text-white hover:bg-purple transition-all">
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>
              </div>
            )}

            {!searchQuery && !isBrowsing && news.length > 0 && (
              <div className="bg-navy-800/80 backdrop-blur border-y border-white/5 py-3 overflow-hidden relative group">
                <div className="container mx-auto px-4 flex items-center gap-6">
                  <div className="flex items-center gap-2 text-red-500 font-black text-[10px] uppercase tracking-tighter whitespace-nowrap animate-pulse">
                    <div className="w-2.5 h-2.5 bg-red-600 rounded-full shadow-lg shadow-red-500/50" /> LIVE UPDATES
                  </div>
                  <div className="flex-1 overflow-hidden relative h-6">
                    <div className="flex gap-16 animate-marquee whitespace-nowrap hover:pause-animation">
                      {[...news, ...news].map((item, idx) => (
                        <a key={idx} href={item.url} target="_blank" className="text-xs font-medium text-gray-300 hover:text-purple transition-colors flex items-center gap-2">
                           <span className="text-purple bg-purple/10 px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">{item.source.name}</span> 
                           {item.title}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="container mx-auto px-4 py-12 space-y-24">
              <section>
                <div className="flex justify-between items-end mb-10">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-purple rounded-full shadow-lg shadow-purple/50"></div>
                        <h2 className="text-4xl font-black text-white tracking-tighter uppercase">
                            {searchQuery ? `Searching for "${searchQuery}"` : isBrowsing ? browseTitle : 'Global Charts'}
                        </h2>
                    </div>
                    {isBrowsing && (<button onClick={handleClearBrowse} className="text-purple bg-purple/10 px-6 py-2 rounded-full hover:bg-purple/20 text-xs font-black uppercase tracking-widest flex items-center transition-all border border-purple/20"><X className="w-3 h-3 mr-2" /> Clear Filters</button>)}
                </div>
                {isSearching || (loadingSeries && seriesList.length === 0) ? (
                   <div className="text-center py-24 text-gray-500 flex flex-col items-center gap-6">
                       <div className="w-12 h-12 border-4 border-purple border-t-transparent rounded-full animate-spin shadow-lg shadow-purple/20"></div>
                       <span className="font-bold tracking-widest text-xs uppercase">{isSearching ? 'Querying Global Database...' : 'Initializing Stream...'}</span>
                   </div>
                ) : (
                     seriesList.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10">
                        {seriesList.map((series) => (<DiziCard key={series.id} series={series} onAddToWatchlist={handleAddToWatchlist} onClick={() => handleSeriesClick(series.id)} />))}
                        </div>
                    ) : ( <div className="text-center py-32 text-gray-600 border border-white/5 rounded-[2.5rem] border-dashed bg-navy-800/30 flex flex-col items-center gap-4 shadow-inner">
                        <Search className="w-16 h-16 opacity-10" />
                        <span className="font-black text-sm uppercase tracking-widest">No entries found matching your query</span>
                    </div> )
                )}
                {!searchQuery && !isBrowsing && (
                    <div className="space-y-24 mt-24">
                        {CATEGORIES.map((cat, idx) => (
                            <CategoryRow key={idx} title={cat.title} endpoint={cat.endpoint} params={cat.params} onSeriesClick={handleSeriesClick} onAddToWatchlist={handleAddToWatchlist} onViewAll={() => handleBrowse(cat.title, cat.endpoint, cat.params)} />
                        ))}
                    </div>
                )}
              </section>

              {!searchQuery && !isBrowsing && news.length > 0 && (
                <section className="pt-20 animate-in slide-in-from-bottom-10 duration-1000">
                   <div className="flex items-center justify-between mb-10 border-t border-white/5 pt-20">
                        <div className="flex items-center gap-4">
                            <div className="w-2 h-10 bg-purple rounded-full shadow-lg shadow-purple/50"></div>
                            <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Media & Press</h2>
                        </div>
                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-[0.4em] bg-white/5 px-5 py-2 rounded-full border border-white/5">Industry Intel</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                      {news.slice(0, 3).map((item, i) => (
                        <a key={i} href={item.url} target="_blank" className="group bg-navy-800/40 backdrop-blur-md rounded-[2.5rem] overflow-hidden border border-white/5 hover:border-purple/40 transition-all flex flex-col hover:shadow-[0_20px_50px_rgba(123,44,191,0.15)] hover:-translate-y-2">
                           <div className="aspect-[16/9] relative overflow-hidden">
                              <img src={item.urlToImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" />
                              <div className="absolute inset-0 bg-gradient-to-t from-navy-900/90 via-transparent to-transparent" />
                              <div className="absolute top-6 left-6 bg-purple/95 backdrop-blur-2xl text-white text-[9px] font-black px-4 py-2 rounded-2xl uppercase tracking-widest shadow-2xl border border-white/10">{item.source.name}</div>
                           </div>
                           <div className="p-8 flex-1 flex flex-col">
                              <h3 className="text-xl text-white font-black leading-tight group-hover:text-purple transition-colors line-clamp-2 mb-4 drop-shadow-xl">{item.title}</h3>
                              <p className="text-gray-400 text-sm line-clamp-2 mb-8 font-medium leading-relaxed opacity-80">{item.description}</p>
                              <div className="flex justify-between items-center mt-auto pt-6 border-t border-white/5">
                                <div className="flex items-center gap-3">
                                    <Clock className="w-4 h-4 text-purple" />
                                    <span className="text-[11px] text-gray-500 font-black uppercase tracking-widest">{new Date(item.publishedAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-black text-purple uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all translate-x-6 group-hover:translate-x-0">
                                    Full Story <ExternalLink className="w-3.5 h-3.5" />
                                </div>
                              </div>
                           </div>
                        </a>
                      ))}
                    </div>
                </section>
              )}
            </div>
          </div>
        );
      case 'SERIES_DETAIL':
        const displaySeries = detailData?.series || seriesList.find(s => s.id === selectedSeriesId);
        if (!displaySeries) return <div className="p-24 text-center text-white flex flex-col items-center gap-4"><AlertCircle className="w-12 h-12 text-red-500" /> Series not found</div>;
        return <SeriesDetail series={displaySeries} cast={detailData?.cast || []} onAddToWatchlist={handleAddToWatchlist} isInWatchlist={watchlist.includes(displaySeries.id)} user={displayUser} />;
      case 'RATINGS':
        return (<div className="container mx-auto px-4 py-12"><h2 className="text-3xl font-black mb-10 text-white flex items-center gap-3 uppercase tracking-tighter"><TrendingUp className="text-purple w-8 h-8" /> Market Analytics</h2><RatingsTable ratings={MOCK_RATINGS} series={seriesList} /></div>);
      case 'CALENDAR':
        return (
            <div className="container mx-auto px-4 py-12 max-w-7xl">
                <div className="bg-navy-800/40 backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] border border-white/5 mb-16 flex flex-col md:flex-row md:items-center justify-between gap-10 shadow-2xl shadow-black/50 overflow-hidden relative group">
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-purple/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-purple/20 transition-colors duration-1000" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-purple/20 text-purple text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.3em] border border-purple/30">Release Radar</span>
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-white flex items-center gap-4 tracking-tighter uppercase">
                            <Calendar className="w-12 h-12 text-purple" />
                            Broadcast <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple to-purple-light">Pulse</span>
                        </h2>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-8 relative z-10">
                        <div className="flex flex-col gap-3">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] ml-1 flex items-center gap-2">
                                <Globe className="w-3.5 h-3.5 text-purple" /> Origin
                            </label>
                            <div className="relative group/select">
                                <select value={calendarLanguage} onChange={(e) => setCalendarLanguage(e.target.value)} className="w-full min-w-[180px] bg-navy-900/80 border border-white/10 text-white px-6 py-4 rounded-2xl focus:outline-none focus:border-purple transition-all text-sm font-black uppercase tracking-widest pr-12">
                                    {LANGUAGES.map(lang => (<option key={lang.code} value={lang.code} className="bg-navy-900">{lang.flag} {lang.name}</option>))}
                                </select>
                                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] ml-1 flex items-center gap-2">
                                <Filter className="w-3.5 h-3.5 text-purple" /> Format
                            </label>
                            <div className="relative group/select">
                                <select value={calendarType} onChange={(e) => setCalendarType(e.target.value as any)} className="w-full min-w-[200px] bg-navy-900/80 border border-white/10 text-white px-6 py-4 rounded-2xl focus:outline-none focus:border-purple transition-all text-sm font-black uppercase tracking-widest pr-12">
                                    <option value="tv" className="bg-navy-900">Broadcast Series</option>
                                    <option value="movie" className="bg-navy-900">Cinematic Film</option>
                                </select>
                                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>

                {loadingCalendar ? (
                    <div className="flex flex-col items-center justify-center py-48 space-y-8 animate-in fade-in duration-500">
                        <div className="w-20 h-20 border-[6px] border-purple border-t-transparent rounded-full animate-spin shadow-[0_0_50px_rgba(123,44,191,0.4)]" />
                        <p className="text-white font-black text-sm uppercase tracking-[0.5em] animate-pulse">Establishing Node Link</p>
                    </div>
                ) : sortedDates.length === 0 ? (
                    <div className="bg-navy-800/30 rounded-[4rem] p-40 text-center border border-white/5 border-dashed shadow-2xl flex flex-col items-center gap-8">
                        <AlertCircle className="w-12 h-12 text-gray-700" />
                        <p className="text-white font-black text-2xl uppercase tracking-tighter">No Upcoming Signals</p>
                        <button onClick={() => setCalendarLanguage('all')} className="mt-6 bg-purple text-white px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-purple-light transition-all shadow-[0_15px_30px_rgba(123,44,191,0.3)]">Expand Broadcast Range</button>
                    </div>
                ) : (
                    <div className="space-y-24 animate-in slide-in-from-bottom-10 duration-1000">
                        {sortedDates.map((dateStr) => {
                            const showsForDate = calendarGrouped[dateStr] || [];
                            const formattedDate = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
                            const isToday = dateStr === new Date().toISOString().split('T')[0];

                            return (
                                <div key={dateStr} className="space-y-10">
                                    <div className="flex items-center gap-8 px-6">
                                        <div className="flex flex-col">
                                            {isToday && (<span className="text-red-500 text-[10px] font-black uppercase tracking-[0.4em] mb-1 animate-pulse">Releasing Today</span>)}
                                            <div className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter">{formattedDate}</div>
                                        </div>
                                        <div className="h-[2px] bg-gradient-to-r from-purple/40 to-transparent flex-1"></div>
                                        <div className="text-[11px] text-gray-500 font-black uppercase tracking-[0.5em]">{showsForDate.length} PREMIERES</div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-12 px-2">
                                        {showsForDate.map(show => (
                                            <div key={show.id} onClick={() => handleSeriesClick(show.id)} className="group relative aspect-[2/3] rounded-[2.5rem] overflow-hidden bg-navy-800 border border-white/5 cursor-pointer hover:border-purple/50 transition-all duration-700 hover:-translate-y-3">
                                                <img src={show.poster_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-75 group-hover:opacity-100" alt={show.title_tr} />
                                                <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/10 to-transparent opacity-95" />
                                                <div className="absolute top-6 left-6 z-20">
                                                    <div className="bg-purple/95 backdrop-blur-2xl text-white text-[9px] font-black px-4 py-2 rounded-2xl uppercase tracking-widest shadow-2xl border border-white/10 flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Coming Soon</div>
                                                </div>
                                                <div className="absolute bottom-0 left-0 w-full p-8 z-20">
                                                    <div className="space-y-3 transform translate-y-6 group-hover:translate-y-0 transition-transform duration-700">
                                                        <div className="flex items-center gap-2 text-[10px] font-black text-purple uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {calendarType === 'tv' ? <TvIcon className="w-3.5 h-3.5" /> : <Clapperboard className="w-3.5 h-3.5" />}
                                                            {calendarType === 'tv' ? 'Series' : 'Film'}
                                                        </div>
                                                        <h3 className="text-2xl font-black text-white leading-none line-clamp-2 uppercase tracking-tighter">{show.title_tr}</h3>
                                                        <p className="text-[11px] text-gray-400 font-black uppercase tracking-[0.2em] truncate opacity-60">{show.network} • Premiere</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
      case 'PROFILE':
        if (!user) { setCurrentView('LOGIN'); return null; }
        return (
          <div className="container mx-auto px-4 py-12 relative animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                <div className="bg-navy-800/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 text-center h-fit shadow-2xl">
                    <div className="w-36 h-36 bg-purple rounded-full mx-auto mb-6 flex items-center justify-center text-5xl font-black border-4 border-navy-900 shadow-2xl text-white overflow-hidden relative group">
                        {displayUser?.avatar_url ? <img src={displayUser.avatar_url} alt="Profile" className="w-full h-full object-cover" /> : user.name.charAt(0).toUpperCase()}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer" onClick={() => setIsEditingProfile(true)}><Edit2 className="w-8 h-8 text-white" /></div>
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2 truncate uppercase tracking-tighter">{displayUser?.name || user.name}</h2>
                    <p className="text-gray-500 text-xs mb-4 font-black uppercase tracking-widest">{displayUser?.email}</p>
                    <p className="text-gray-400 text-sm mb-8 px-2 font-medium italic line-clamp-4 leading-relaxed">{userProfile?.bio || 'No status set. Update your bio to share your drama taste.'}</p>
                    {!isEditingProfile && <button onClick={() => setIsEditingProfile(true)} className="w-full bg-white/5 hover:bg-purple text-white py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 border border-white/10"><Edit2 className="w-4 h-4" /> Edit Profile</button>}
                </div>
                <div className="md:col-span-3 space-y-12">
                    {isEditingProfile ? (
                        <div className="bg-navy-800/50 backdrop-blur-xl p-10 rounded-[3rem] border border-white/5 shadow-2xl animate-in slide-in-from-right-8 duration-500">
                            <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
                                <h3 className="text-3xl font-black text-white flex items-center gap-4 uppercase tracking-tighter"><UserIcon className="w-8 h-8 text-purple" /> Identity Settings</h3>
                                <button onClick={() => setIsEditingProfile(false)} className="bg-white/5 text-gray-400 hover:text-white p-3 rounded-2xl transition-all"><X className="w-6 h-6" /></button>
                            </div>
                            <form onSubmit={handleSaveProfile} className="space-y-8">
                                {profileMessage && <div className={`p-5 rounded-2xl flex items-center gap-4 text-sm font-bold animate-in zoom-in-95 ${profileMessage.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>{profileMessage.type === 'success' ? <CheckCircle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}{profileMessage.text}</div>}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] ml-1">Alias / Name</label>
                                        <input type="text" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} className="w-full bg-navy-900 border border-white/5 text-white px-6 py-4 rounded-2xl focus:outline-none focus:border-purple transition-all text-sm font-bold" />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] ml-1">Avatar Origin URL</label>
                                        <input type="text" placeholder="https://image-link.jpg" value={profileForm.avatar_url} onChange={e => setProfileForm({...profileForm, avatar_url: e.target.value})} className="w-full bg-navy-900 border border-white/5 text-white px-6 py-4 rounded-2xl focus:outline-none focus:border-purple transition-all text-sm font-bold" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] ml-1">User Status / Bio</label>
                                    <textarea rows={4} value={profileForm.bio} onChange={e => setProfileForm({...profileForm, bio: e.target.value})} placeholder="Express your passion for storytelling..." className="w-full bg-navy-900 border border-white/5 text-white px-6 py-4 rounded-2xl focus:outline-none focus:border-purple transition-all text-sm font-medium leading-relaxed resize-none" />
                                </div>
                                <div className="pt-6 border-t border-white/5">
                                    <h4 className="text-xs font-black text-white mb-6 flex items-center gap-3 uppercase tracking-widest"><Lock className="w-4 h-4 text-red-600" /> Vault Security</h4>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] ml-1">Update Password</label>
                                        <input type="password" placeholder="••••••••" value={profileForm.newPassword} onChange={e => setProfileForm({...profileForm, newPassword: e.target.value})} className="w-full bg-navy-900 border border-white/5 text-white px-6 py-4 rounded-2xl focus:outline-none focus:border-purple transition-all text-sm font-bold" />
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-6 pt-6">
                                    <button type="submit" disabled={isSavingProfile} className="flex-1 bg-purple hover:bg-purple-light text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 uppercase text-xs tracking-widest">{isSavingProfile ? <span className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-5 h-5" /> Synchronize Changes</>}</button>
                                    <button type="button" onClick={() => setIsEditingProfile(false)} className="px-12 bg-white/5 hover:bg-white/10 text-white font-black py-5 rounded-2xl transition-all border border-white/10 uppercase text-xs tracking-widest">Abort</button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="flex justify-between items-center mb-10">
                                <h3 className="text-3xl font-black text-white flex items-center gap-4 uppercase tracking-tighter"><Heart className="w-10 h-10 text-red-600" /> Watch-Collection</h3>
                                <span className="text-[10px] text-gray-500 font-black uppercase tracking-[0.4em] bg-white/5 px-5 py-2 rounded-full border border-white/5">{watchlist.length} ITEMS</span>
                            </div>
                            {watchlist.length === 0 ? ( 
                                <div className="bg-navy-800/30 rounded-[3rem] p-32 text-center border border-white/5 border-dashed flex flex-col items-center gap-8">
                                    <Plus className="w-10 h-10 text-gray-700" />
                                    <p className="text-white font-black uppercase tracking-widest text-lg">Empty Collection</p>
                                    <button onClick={() => setCurrentView('HOME')} className="mt-4 bg-purple/10 text-purple hover:bg-purple/20 px-10 py-3 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all border border-purple/20">Explore Library</button>
                                </div>
                            ) : ( 
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
                                    {seriesList.filter(s => watchlist.includes(s.id)).map(series => <DiziCard key={series.id} series={series} onAddToWatchlist={handleAddToWatchlist} onClick={() => handleSeriesClick(series.id)} />)}
                                </div> 
                            )}
                        </div>
                    )}
                </div>
            </div>
            <style>{`
              @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
              .animate-marquee { display: inline-flex; animation: marquee 50s linear infinite; width: max-content; }
              .pause-animation { animation-play-state: paused; }
            `}</style>
          </div>
        );
      default: return <div>View not found</div>;
    }
  };

  return <Layout currentView={currentView} onChangeView={setCurrentView} user={displayUser} onLogout={handleLogout} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onBrowse={handleBrowse}>{renderContent()}</Layout>;
}
export default App;
