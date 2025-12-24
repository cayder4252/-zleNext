
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
import { moviesDatabaseInit } from './services/moviesDatabase';
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
    History,
    Loader2,
    Radio,
    Rss,
    Cpu,
    ArrowRight
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
  
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [localWatchlist, setLocalWatchlist] = useState<string[]>([]);
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const [seriesList, setSeriesList] = useState<Series[]>(() => {
    const cached = localStorage.getItem(SERIES_CACHE_KEY);
    return cached ? JSON.parse(cached) : MOCK_SERIES;
  });

  // Browse & Pagination States
  const [browseEndpoint, setBrowseEndpoint] = useState<string | null>(null);
  const [browseParams, setBrowseParams] = useState<string | null>(null);
  const [browseTitle, setBrowseTitle] = useState<string | null>(null);
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [calendarData, setCalendarData] = useState<Series[]>([]);
  const [calendarLanguage, setCalendarLanguage] = useState('all');
  const [calendarType, setCalendarType] = useState<'tv' | 'movie'>('tv');
  const [loadingCalendar, setLoadingCalendar] = useState(false);

  const [news, setNews] = useState<NewsArticle[]>([]);
  const [pulseNews, setPulseNews] = useState<any[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);

  const [loadingSeries, setLoadingSeries] = useState(false);
  const [detailData, setDetailData] = useState<{ series: Series, cast: Actor[] } | null>(null);

  const [profileForm, setProfileForm] = useState({ name: '', bio: '', avatar_url: '', newPassword: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const slideInterval = useRef<number | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const unsubConfig = settingsService.subscribeToConfig((config) => {
        config.apiProviders.forEach(p => {
          if (p.id === 'tmdb') tmdbInit(p.apiKey, p.isEnabled);
          if (p.id === 'omdb') omdbInit(p.apiKey, p.isEnabled);
          if (p.id === 'watchmode') watchmodeInit(p.apiKey, p.isEnabled);
          if (p.id === 'moviesdatabase') moviesDatabaseInit(p.apiKey, p.isEnabled);
        });
    });
    return () => unsubConfig();
  }, []);

  // Pulse Feed Integration (10s Live Refresh)
  useEffect(() => {
    const fetchPulseNews = async () => {
        try {
            const res = await fetch(`https://newsdata.io/api/1/news?apikey=pub_e7764909bff04a3f9bf72d384e687756&q=dizi&language=tr,en`);
            const data = await res.json();
            if (data.results) setPulseNews(data.results);
        } catch (e) {
            console.error("Pulse news signal lost", e);
        }
    };
    
    fetchPulseNews();
    const interval = setInterval(fetchPulseNews, 10000); 

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchNews = async () => {
      setLoadingNews(true);
      try {
        const latest = await newsService.getLatestTurkishNews();
        setNews(latest);
      } catch (e) {
        console.error("News fetch error", e);
      } finally {
        setLoadingNews(false);
      }
    };
    fetchNews();
  }, []);

  useEffect(() => {
    if (news.length === 0) return;
    const interval = setInterval(() => {
      setCurrentNewsIndex(prev => (prev + 1) % news.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [news.length]);

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

        const cachedProfile = localStorage.getItem(`izlenext_profile_${firebaseUser.uid}`);
        if (cachedProfile) {
            const parsed = JSON.parse(cachedProfile);
            setUserProfile(parsed);
            setProfileForm({ name: parsed.name || '', bio: parsed.bio || '', avatar_url: parsed.avatar_url || '', newPassword: '' });
        }

        const cachedWatchlist = localStorage.getItem(`izlenext_watchlist_${firebaseUser.uid}`);
        if (cachedWatchlist) setLocalWatchlist(JSON.parse(cachedWatchlist));

      } else {
        setUser(null);
        setUserProfile(null);
        setLocalWatchlist([]);
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
          localStorage.setItem(`izlenext_profile_${user.id}`, JSON.stringify(profile));
          
          setProfileForm(prev => ({
              ...prev,
              name: profile.name || user.name,
              bio: profile.bio || '',
              avatar_url: profile.avatar_url || '',
          }));
          
          if (profile.watchlist) {
            setLocalWatchlist(profile.watchlist);
            localStorage.setItem(`izlenext_watchlist_${user.id}`, JSON.stringify(profile.watchlist));
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

  useEffect(() => {
    const performSearch = async () => {
      const trimmedQuery = searchQuery.trim();
      if (!trimmedQuery) {
        if (isBrowsing) return;
        setIsSearching(false);
        setLoadingSeries(true);
        try {
          const trending = await tmdb.getTrendingSeries();
          setSeriesList(trending);
          setTotalPages(1);
          setCurrentPage(1);
        } catch (e) {} finally { setLoadingSeries(false); }
        return;
      }

      setIsSearching(true);
      setLoadingSeries(true);
      setIsBrowsing(false);
      try {
        const p1 = (currentPage - 1) * 3 + 1;
        const p2 = p1 + 1;
        const p3 = p1 + 2;

        const [r1, r2, r3] = await Promise.all([
            tmdb.search(trimmedQuery, p1),
            tmdb.search(trimmedQuery, p2),
            tmdb.search(trimmedQuery, p3)
        ]);
        
        const combined = [...r1.results, ...r2.results, ...r3.results];
        setSeriesList(combined);
        setTotalPages(Math.ceil(r1.total_pages / 3));
      } catch (e) {
        console.error("Search error", e);
      } finally {
        setIsSearching(false);
        setLoadingSeries(false);
      }
    };

    const timeoutId = setTimeout(performSearch, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, currentPage]);

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
    } catch (error) {}
  };

  const handleBrowse = async (title: string, endpoint: string, params: string, pageNum: number = 1) => {
      setLoadingSeries(true);
      setSearchQuery('');
      setBrowseTitle(title);
      setBrowseEndpoint(endpoint);
      setBrowseParams(params);
      setIsBrowsing(true);
      setCurrentPage(pageNum);
      window.scrollTo(0, 0);
      try {
          const p1 = (pageNum - 1) * 3 + 1;
          const p2 = p1 + 1;
          const p3 = p1 + 2;

          const [batch1, batch2, batch3] = await Promise.all([
              tmdb.getDiscoveryContent(endpoint, params, p1),
              tmdb.getDiscoveryContent(endpoint, params, p2),
              tmdb.getDiscoveryContent(endpoint, params, p3)
          ]);
          
          setSeriesList([...batch1.results, ...batch2.results, ...batch3.results]);
          setTotalPages(Math.ceil(batch1.total_pages / 3));
      } catch (e) {} finally { setLoadingSeries(false); }
  };

  const handleClearBrowse = async () => {
      setIsBrowsing(false);
      setBrowseTitle(null);
      setBrowseEndpoint(null);
      setBrowseParams(null);
      setLoadingSeries(true);
      setCurrentPage(1);
      setTotalPages(1);
      const homeData = await tmdb.getTrendingSeries();
      setSeriesList(homeData);
      setLoadingSeries(false);
  };

  const handlePageChange = (newPage: number) => {
      if (newPage < 1 || newPage > totalPages) return;
      window.scrollTo(0, 0);
      if (searchQuery) {
          setCurrentPage(newPage);
      } else if (isBrowsing && browseTitle && browseEndpoint && browseParams) {
          handleBrowse(browseTitle, browseEndpoint, browseParams, newPage);
      }
  };

  const handleAddToWatchlist = async (id: string) => {
    const isAdded = localWatchlist.includes(id);
    const updatedWatchlist = isAdded 
        ? localWatchlist.filter(item => item !== id)
        : [...localWatchlist, id];
        
    setLocalWatchlist(updatedWatchlist);
    if (user) {
        localStorage.setItem(`izlenext_watchlist_${user.id}`, JSON.stringify(updatedWatchlist));
        const userRef = doc(db, 'users', user.id);
        try {
            if (isAdded) await updateDoc(userRef, { watchlist: arrayRemove(id) });
            else await updateDoc(userRef, { watchlist: arrayUnion(id) });
        } catch (error) { console.error("Watchlist sync failed", error); }
    }
  };

  const handleSeriesClick = async (id: string) => {
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
          } catch (e) { console.error("Detail fetch failed", e); }
      } else {
          const localSeries = seriesList.find(s => s.id === id);
          if (localSeries) setDetailData({ series: localSeries, cast: [] });
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
      localStorage.setItem(`izlenext_profile_${user.id}`, JSON.stringify(newProfileData));

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
              await updatePassword(auth.currentUser, profileForm.newPassword);
          }
          setProfileMessage({ type: 'success', text: 'Identity updated successfully!' });
          setProfileForm(prev => ({ ...prev, newPassword: '' }));
          setTimeout(() => { setIsEditingProfile(false); setProfileMessage(null); }, 1500);
      } catch (err: any) {
          setUserProfile(originalProfile);
          if (originalProfile) localStorage.setItem(`izlenext_profile_${user.id}`, JSON.stringify(originalProfile));
          setProfileMessage({ type: 'error', text: err.message || 'Update failed.' });
      } finally { setIsSavingProfile(false); }
  };

  const displayUser = user ? { ...user, ...userProfile } : null;
  const watchlist = localWatchlist;
  
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
    { title: "K-Drama Wave", endpoint: "discover/tv", params: "with_original_language=ko&sort_by=popularity.desc" },
    { title: "Trending Anime Peaks", endpoint: "discover/tv", params: "with_original_language=ja&with_genres=16&sort_by=popularity.desc" },
    { title: "Edge-of-Your-Seat Thrillers", endpoint: "discover/movie", params: "with_genres=53&sort_by=vote_average.desc&vote_count.gte=1000" },
    { title: "Spine-Chilling Horror", endpoint: "discover/movie", params: "with_genres=27&sort_by=popularity.desc" },
    { title: "Medieval & Epic Fantasy", endpoint: "discover/tv", params: "with_genres=10765&sort_by=popularity.desc" },
    { title: "IMDb Top Rated 250", endpoint: "movie/top_rated", params: "page=1" },
    { title: "Critics' Choice (TV)", endpoint: "tv/top_rated", params: "page=1" },
    { title: "Box Office Monsters", endpoint: "movie/popular", params: "page=1" }
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
                  <div key={show.id} className={`absolute inset-0 transition-all duration-1000 ease-in-out transform ${index === currentSlide ? 'opacity-100 translate-x-0 scale-100 z-10' : 'opacity-0 translate-x-full scale-105 z-0'}`}>
                    <div className="absolute inset-0">
                        <img src={show.banner_url} alt={show.title_tr} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/60 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-navy-900 via-navy-900/40 to-transparent" />
                    </div>
                    <div className="container mx-auto px-4 relative h-full flex items-end pb-16 md:pb-24">
                      <div className={`max-w-2xl space-y-4 transition-all duration-700 delay-300 ${index === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                        <div className="flex items-center gap-2 text-white text-[10px] font-black uppercase tracking-[0.3em] drop-shadow-2xl">
                          <Sparkles className="w-3.5 h-3.5 text-purple fill-purple/20" /> Trending Global
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-xl">{show.title_tr}</h1>
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
                    {trendingForSlides.map((_, i) => (<button key={i} onClick={() => setCurrentSlide(i)} className={`h-1.5 transition-all duration-500 rounded-full ${i === currentSlide ? 'w-8 bg-purple' : 'w-2 bg-white/30'}`} />))}
                </div>
              </div>
            )}

            {!searchQuery && !isBrowsing && news.length > 0 && (
              <div className="bg-navy-800/80 backdrop-blur border-y border-white/5 py-3 overflow-hidden relative group h-[48px] flex items-center">
                <div className="container mx-auto px-4 flex items-center gap-6">
                  <div className="flex items-center gap-2 text-red-500 font-black text-[10px] uppercase tracking-tighter shrink-0">
                    <div className="w-2.5 h-2.5 bg-red-600 rounded-full shadow-lg animate-pulse" /> LIVE UPDATES
                  </div>
                  <div className="flex-1 overflow-hidden relative h-6">
                    <div className="relative h-full w-full">
                      {news.map((item, idx) => (
                        <a 
                          key={idx} 
                          href={item.url} 
                          target="_blank" 
                          className={`absolute inset-0 text-xs font-medium text-gray-300 hover:text-purple flex items-center gap-2 transition-all duration-700 ease-in-out transform ${idx === currentNewsIndex ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-4 pointer-events-none'}`}
                        >
                          <span className="text-purple bg-purple/10 px-1.5 py-0.5 rounded text-[10px] font-black shrink-0">{item.source.name}</span> 
                          <span className="truncate">{item.title}</span>
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
                        <div className="w-2 h-10 bg-purple rounded-full shadow-lg"></div>
                        <h2 className="text-4xl font-black text-white tracking-tighter uppercase">{searchQuery ? `Searching for "${searchQuery}"` : isBrowsing ? browseTitle : 'Global Charts'}</h2>
                    </div>
                    {isBrowsing && (<button onClick={handleClearBrowse} className="text-purple bg-purple/10 px-6 py-2 rounded-full hover:bg-purple/20 text-xs font-black uppercase tracking-widest transition-all border border-purple/20 flex items-center gap-2"><X className="w-3 h-3" /> Clear Filters</button>)}
                </div>
                {isSearching || (loadingSeries && seriesList.length === 0) ? (
                   <div className="text-center py-24 text-gray-500 flex flex-col items-center gap-6">
                       <Loader2 className="w-12 h-12 animate-spin text-purple" />
                       <span className="font-bold tracking-widest text-xs uppercase">{isSearching ? 'Querying Global Database...' : 'Initializing Stream...'}</span>
                   </div>
                ) : (
                     <div className="space-y-16">
                         {seriesList.length > 0 ? (
                             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10">
                                 {seriesList.map((series) => (
                                     <DiziCard key={series.id} series={series} onAddToWatchlist={handleAddToWatchlist} onClick={() => handleSeriesClick(series.id)} />
                                 ))}
                             </div>
                         ) : (
                             <div className="text-center py-32 text-gray-600 border border-white/5 rounded-[2.5rem] bg-navy-800/30 flex flex-col items-center gap-4">
                                 <Search className="w-16 h-16 opacity-10" />
                                 <span className="font-black text-sm uppercase">No entries found</span>
                             </div>
                         )}

                         {totalPages > 1 && (
                             <div className="flex justify-center items-center gap-2 pt-12 pb-24">
                                 <button 
                                     onClick={() => handlePageChange(currentPage - 1)}
                                     disabled={currentPage === 1}
                                     className="w-10 h-10 rounded-full bg-navy-800 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-purple disabled:opacity-30 disabled:hover:text-gray-400 transition-all"
                                 >
                                     <ChevronLeft className="w-5 h-5" />
                                 </button>
                                 
                                 {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                                     let pageNum = currentPage <= 3 ? i + 1 : (currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i);
                                     if (pageNum <= 0) pageNum = i + 1;
                                     if (pageNum > totalPages) return null;
                                     
                                     return (
                                         <button 
                                             key={pageNum}
                                             onClick={() => handlePageChange(pageNum)}
                                             className={`w-10 h-10 rounded-full font-black text-xs transition-all border ${currentPage === pageNum ? 'bg-purple text-white border-purple shadow-lg shadow-purple/20' : 'bg-navy-800 text-gray-400 border-white/10 hover:text-white hover:border-purple'}`}
                                         >
                                             {pageNum}
                                         </button>
                                     );
                                 })}
                                 
                                 <button 
                                     onClick={() => handlePageChange(currentPage + 1)}
                                     disabled={currentPage === totalPages}
                                     className="w-10 h-10 rounded-full bg-navy-800 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-purple disabled:opacity-30 transition-all"
                                 >
                                     <ChevronRight className="w-5 h-5" />
                                 </button>
                             </div>
                         )}
                     </div>
                )}
                {!searchQuery && !isBrowsing && (<div className="space-y-24 mt-24">{CATEGORIES.map((cat, idx) => (<CategoryRow key={idx} title={cat.title} endpoint={cat.endpoint} params={cat.params} onSeriesClick={handleSeriesClick} onAddToWatchlist={handleAddToWatchlist} onViewAll={() => handleBrowse(cat.title, cat.endpoint, cat.params)} />))}</div>)}
              </section>
            </div>
          </div>
        );
      case 'SERIES_DETAIL':
        const displaySeries = detailData?.series || seriesList.find(s => s.id === selectedSeriesId);
        if (!displaySeries) return <div className="p-24 text-center text-white"><AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" /> Series not found</div>;
        return <SeriesDetail series={displaySeries} cast={detailData?.cast || []} onAddToWatchlist={handleAddToWatchlist} isInWatchlist={watchlist.includes(displaySeries.id)} user={displayUser} />;
      case 'CALENDAR':
        return (
            <div className="container mx-auto px-4 py-12 max-w-7xl">
                {/* Side-by-Side Header Dashboard */}
                <div className="flex flex-col lg:flex-row gap-8 mb-16">
                    {/* Compact Broadcast Pulse Header & Live High-Density Feed (Left) */}
                    <div className="lg:w-1/3 bg-navy-800/60 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/10 flex flex-col shadow-2xl relative overflow-hidden group">
                        <div className="absolute -right-20 -top-20 w-48 h-48 bg-purple/10 rounded-full blur-[80px]" />
                        <div className="relative z-10 space-y-8 flex-1 flex flex-col">
                            <div className="flex items-start justify-between">
                                <div className="space-y-3">
                                    <span className="inline-block bg-purple/20 text-purple text-[9px] font-black px-4 py-1 rounded-full uppercase tracking-[0.3em] border border-purple/30 shadow-lg shadow-purple/10">Release Radar</span>
                                    <h2 className="text-3xl font-black text-white flex items-center gap-3 tracking-tighter uppercase leading-none">
                                        <Calendar className="w-9 h-9 text-purple" /> Broadcast<br/>Pulse
                                    </h2>
                                </div>
                                <div className="w-12 h-12 bg-navy-900/50 rounded-2xl flex items-center justify-center border border-white/5">
                                    <Radio className="w-6 h-6 text-purple animate-pulse" />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.4em] ml-1">Origin Node</label>
                                    <select value={calendarLanguage} onChange={(e) => setCalendarLanguage(e.target.value)} className="w-full bg-navy-900 border border-white/10 text-white px-4 py-3 rounded-2xl focus:outline-none focus:border-purple transition-all text-xs font-black uppercase tracking-widest cursor-pointer">
                                        {LANGUAGES.map(lang => (<option key={lang.code} value={lang.code} className="bg-navy-900">{lang.flag} {lang.name}</option>))}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.4em] ml-1">Format</label>
                                    <select value={calendarType} onChange={(e) => setCalendarType(e.target.value as any)} className="w-full bg-navy-900 border border-white/10 text-white px-4 py-3 rounded-2xl focus:outline-none focus:border-purple transition-all text-xs font-black uppercase tracking-widest cursor-pointer">
                                        <option value="tv" className="bg-navy-900">Broadcast Series</option>
                                        <option value="movie" className="bg-navy-900">Cinematic Film</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex-1 mt-6 border-t border-white/5 pt-8 overflow-hidden">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.5em] flex items-center gap-2"><Rss className="w-3 h-3 text-purple" /> Live Signals</h4>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
                                        <span className="text-[8px] font-black text-red-500 uppercase">10S Cycle</span>
                                    </div>
                                </div>
                                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                    {pulseNews.length > 0 ? (
                                        pulseNews.slice(0, 10).map((article, idx) => (
                                            <a 
                                                key={idx} 
                                                href={article.link} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="bg-navy-900/50 border border-white/5 p-3 rounded-xl flex items-center gap-3 group/feed hover:border-purple/30 transition-all animate-in slide-in-from-right-2 duration-300"
                                                style={{ animationDelay: `${idx * 50}ms` }}
                                            >
                                                <div className="w-10 h-10 bg-navy-800 rounded-lg flex items-center justify-center shrink-0 border border-white/10 group-hover/feed:border-purple/50 transition-colors">
                                                    <Cpu className="w-4 h-4 text-gray-600 group-hover/feed:text-purple transition-colors" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-[8px] font-black text-purple uppercase mb-0.5 truncate">{article.source_id}</div>
                                                    <div className="text-[11px] font-bold text-gray-200 line-clamp-1 group-hover/feed:text-white transition-colors">
                                                        {article.title}
                                                    </div>
                                                    <div className="text-[8px] font-black text-gray-600 uppercase tracking-tighter flex items-center gap-1.5 mt-1">
                                                        <Clock className="w-2 h-2" /> {new Date(article.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </a>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-24 gap-4 bg-navy-900/30 rounded-2xl border border-dashed border-white/10">
                                            <Loader2 className="w-8 h-8 animate-spin text-purple opacity-20" />
                                            <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Scanning Frequencies...</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Integrated Ratings Table (Right) */}
                    <div className="lg:w-2/3">
                        <RatingsTable ratings={MOCK_RATINGS} series={seriesList} />
                    </div>
                </div>

                {loadingCalendar ? (<div className="flex flex-col items-center justify-center py-48 gap-8 animate-in fade-in"><Loader2 className="w-20 h-20 animate-spin text-purple" /><p className="text-white font-black text-sm uppercase animate-pulse">Establishing Node Link</p></div>) 
                : sortedDates.length === 0 ? (<div className="bg-navy-800/30 rounded-[4rem] p-40 text-center border border-white/5 border-dashed flex flex-col items-center justify-center animate-in fade-in duration-700">
                    <AlertCircle className="w-16 h-16 text-gray-700 mb-6" />
                    <p className="text-white font-black text-2xl uppercase tracking-tighter">No Upcoming Signals</p>
                    <p className="text-gray-500 text-xs font-bold mt-2 uppercase tracking-widest">Try adjusting filters or checking back later.</p>
                </div>) 
                : (
                    <div className="space-y-20 animate-in slide-in-from-bottom-10 duration-1000">
                        {sortedDates.map((dateStr) => {
                            const showsForDate = calendarGrouped[dateStr] || [];
                            const dateObj = new Date(dateStr);
                            const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase();
                            
                            return (
                                <div key={dateStr} className="space-y-6">
                                    {/* Date Header One-Liner */}
                                    <div className="flex items-center gap-4 px-2">
                                        <h2 className="text-xl md:text-2xl font-black text-white tracking-tighter whitespace-nowrap">{formattedDate}</h2>
                                        <div className="h-px bg-white/10 flex-1" />
                                        <div className="text-[9px] font-black text-gray-500 uppercase tracking-[0.4em] whitespace-nowrap">{showsForDate.length} PREMIERES</div>
                                    </div>

                                    {/* Vertical List of Shows */}
                                    <div className="flex flex-col gap-4 px-2">
                                        {showsForDate.map(show => (
                                            <div 
                                                key={show.id} 
                                                onClick={() => handleSeriesClick(show.id)} 
                                                className="group relative flex items-center gap-6 p-4 bg-navy-800/30 hover:bg-navy-800/60 border border-white/5 hover:border-purple/30 rounded-2xl transition-all cursor-pointer shadow-lg overflow-hidden"
                                            >
                                                {/* Hover Glow */}
                                                <div className="absolute inset-0 bg-gradient-to-r from-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                
                                                {/* Compact Thumbnail */}
                                                <div className="w-16 h-24 shrink-0 overflow-hidden rounded-xl border border-white/10 shadow-xl relative z-10">
                                                    <img src={show.poster_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={show.title_tr} />
                                                </div>

                                                {/* Info Stack */}
                                                <div className="flex-1 min-w-0 relative z-10">
                                                    <div className="flex items-center gap-3 mb-1.5">
                                                        <span className="text-purple font-black text-[10px] tracking-widest uppercase">20:00 Slot</span>
                                                        <span className="w-1 h-1 bg-gray-700 rounded-full" />
                                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{show.network}</span>
                                                    </div>
                                                    <h3 className="text-lg md:text-xl font-black text-white leading-none truncate uppercase tracking-tighter group-hover:text-purple transition-colors">{show.title_tr}</h3>
                                                    <p className="text-xs text-gray-400 font-medium line-clamp-1 mt-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                        {show.synopsis || "No description available for this premiere signal."}
                                                    </p>
                                                </div>

                                                {/* Action Metadata */}
                                                <div className="hidden sm:flex flex-col items-end gap-3 shrink-0 relative z-10">
                                                    <div className="px-3 py-1 bg-purple/10 text-purple rounded-full text-[8px] font-black uppercase tracking-widest border border-purple/20">Official Premiere</div>
                                                    <button className="flex items-center gap-2 text-[10px] font-black text-gray-500 hover:text-white transition-colors group/btn">
                                                        TRACK SIGNAL <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                                                    </button>
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
                                    <button type="submit" disabled={isSavingProfile} className="flex-1 bg-purple hover:bg-purple-light text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 uppercase text-xs tracking-widest">{isSavingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Synchronize Changes</>}</button>
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
                                <div className="bg-navy-800/30 rounded-[3rem] p-32 text-center border border-white/5 border-dashed flex flex-col items-center gap-8"><Plus className="w-10 h-10 text-gray-700" /><p className="text-white font-black uppercase tracking-widest text-lg">Empty Collection</p><button onClick={() => setCurrentView('HOME')} className="mt-4 bg-purple/10 text-purple hover:bg-purple/20 px-10 py-3 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all border border-purple/20">Explore Library</button></div>
                            ) : ( 
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-10">{seriesList.filter(s => watchlist.includes(s.id)).map(series => <DiziCard key={series.id} series={series} onAddToWatchlist={handleAddToWatchlist} onClick={() => handleSeriesClick(series.id)} />)}</div> 
                            )}
                        </div>
                    )}
                </div>
            </div>
          </div>
        );
      default: return <div>View not found</div>;
    }
  };

  return <Layout currentView={currentView} onChangeView={setCurrentView} user={displayUser} onLogout={handleLogout} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onBrowse={handleBrowse}>{renderContent()}</Layout>;
}
export default App;
