
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { DiziCard } from './components/DiziCard';
import { RatingsTable } from './components/RatingsTable';
import { SeriesDetail } from './components/SeriesDetail'; 
import { CategoryRow } from './components/CategoryRow'; 
import { AdminPanel } from './pages/Admin';
import { AuthPage } from './pages/Auth';
import { ViewState, User, Series, Actor, SiteConfig } from './types'; 
import { MOCK_SERIES, MOCK_RATINGS } from './constants';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, updateProfile as updateAuthProfile } from 'firebase/auth';
import { collection, onSnapshot, doc, updateDoc, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { tmdb, tmdbInit } from './services/tmdb';
import { omdb, omdbInit } from './services/omdb'; 
import { watchmodeInit } from './services/watchmode';
import { settingsService } from './services/settingsService';
import { 
    Calendar as CalendarIcon, 
    Play, 
    TrendingUp, 
    BarChart2, 
    Clock, 
    ChevronRight,
    PlayCircle,
    Edit2,
    Save,
    X,
    Bell
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('HOME');
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null); 
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [calendarData, setCalendarData] = useState<Series[]>([]);
  const [loadingSeries, setLoadingSeries] = useState(true);
  const [browseTitle, setBrowseTitle] = useState<string | null>(null);
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [detailData, setDetailData] = useState<{ series: Series, cast: Actor[] } | null>(null);
  const [profileForm, setProfileForm] = useState({ name: '', avatar_url: '', location: '', bio: '' });

  // --- INITIALIZE DYNAMIC CONFIG ---
  useEffect(() => {
    const unsubConfig = settingsService.subscribeToConfig((config) => {
        // Find providers
        const tmdbP = config.apiProviders.find(p => p.id === 'tmdb');
        const omdbP = config.apiProviders.find(p => p.id === 'omdb');
        const watchmodeP = config.apiProviders.find(p => p.id === 'watchmode');

        if (tmdbP) tmdbInit(tmdbP.apiKey, tmdbP.isEnabled);
        if (omdbP) omdbInit(omdbP.apiKey, omdbP.isEnabled);
        if (watchmodeP) watchmodeInit(watchmodeP.apiKey, watchmodeP.isEnabled);
    });
    return () => unsubConfig();
  }, []);

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
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const unsub = onSnapshot(doc(db, 'users', user.id), (doc) => {
        if (doc.exists()) setUserProfile(doc.data() as User);
    });
    return () => unsub;
  }, [user?.id]);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingSeries(true);
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
      } catch (e) {
        setSeriesList(MOCK_SERIES);
      } finally {
        setLoadingSeries(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (currentView === 'CALENDAR' && calendarData.length === 0) {
        tmdb.getCalendarShows().then(data => setCalendarData(data));
    }
  }, [currentView]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length > 2) {
        setIsSearching(true);
        setIsBrowsing(false);
        setBrowseTitle(null);
        const results = await tmdb.search(searchQuery);
        setSeriesList(results);
        setIsSearching(false);
      } else if (searchQuery.trim().length === 0 && !loadingSeries && !isBrowsing) {
        const homeData = await tmdb.getTrendingSeries();
        setSeriesList(homeData);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleLogin = (email: string, name: string, role: 'ADMIN' | 'USER') => {
    if (role === 'ADMIN') setCurrentView('ADMIN');
    else setCurrentView('HOME');
  };

  const handleLogout = async () => {
    try { await signOut(auth); setCurrentView('HOME'); } catch (error) {}
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
    if (!user) { setCurrentView('LOGIN'); return; }
    const currentWatchlist = userProfile?.watchlist || [];
    const isAdded = currentWatchlist.includes(id);
    const userRef = doc(db, 'users', user.id);
    try {
        if (isAdded) await updateDoc(userRef, { watchlist: arrayRemove(id) });
        else { await updateDoc(userRef, { watchlist: arrayUnion(id) }); alert('Added to watchlist!'); }
    } catch (error) {}
  };

  const handleSeriesClick = async (id: string) => {
      const isTmdbId = /^\d+$/.test(id);
      if (isTmdbId) {
          try {
              let data = await tmdb.getDetails(id, 'tv');
              if (data.series.imdb_id) {
                  const omdbData = await omdb.getDetails(data.series.imdb_id);
                  if (omdbData) data.series = { ...data.series, ...omdbData };
              }
              setDetailData(data);
          } catch (e) {
               try {
                   let data = await tmdb.getDetails(id, 'movie');
                   if (data.series.imdb_id) {
                      const omdbData = await omdb.getDetails(data.series.imdb_id);
                      if (omdbData) data.series = { ...data.series, ...omdbData };
                   }
                   setDetailData(data);
               } catch (err) {}
          }
      } else {
          const localSeries = seriesList.find(s => s.id === id);
          if (localSeries) setDetailData({ series: localSeries, cast: [] });
      }
      setSelectedSeriesId(id);
      setCurrentView('SERIES_DETAIL');
      window.scrollTo(0, 0); 
  };

  const featuredShow = seriesList.find(s => s.is_featured) || seriesList[0];
  const watchlist = userProfile?.watchlist || [];
  const displayUser = user ? { ...user, ...userProfile } : null;
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  const calendarGrouped = calendarData.reduce((acc, series) => {
      if (series.next_episode?.air_date) {
          const day = new Date(series.next_episode.air_date).toLocaleDateString('en-US', { weekday: 'short' });
          if (!acc[day]) acc[day] = [];
          acc[day].push(series);
      }
      return acc;
  }, {} as Record<string, Series[]>);

  const CATEGORIES = [
    { title: "Trending Anime", endpoint: "discover/tv", params: "with_original_language=ja&with_genres=16&sort_by=popularity.desc" },
    { title: "Spanish Language Hits", endpoint: "discover/tv", params: "with_original_language=es&sort_by=popularity.desc" },
    { title: "Mind-Bending Sci-Fi", endpoint: "discover/movie", params: "with_genres=878&sort_by=vote_average.desc&vote_count.gte=200" },
    { title: "Wholesome Family Night", endpoint: "discover/movie", params: "with_genres=10751,16&sort_by=popularity.desc" },
    { title: "IMDb Top 250", endpoint: "movie/top_rated", params: "page=1" },
  ];

  if (currentView === 'ADMIN') {
    if (!user || user.role !== 'ADMIN') { setCurrentView('LOGIN'); return null; }
    return (
        <div className="relative">
             <button onClick={() => setCurrentView('HOME')} className="fixed bottom-4 right-4 z-50 bg-navy-900 text-white px-4 py-2 rounded-full shadow-lg border border-white/10 hover:bg-purple text-xs">Exit Admin</button>
            <AdminPanel />
        </div>
    );
  }

  if (currentView === 'LOGIN' || currentView === 'REGISTER') {
    return <AuthPage view={currentView} onChangeView={setCurrentView} onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'HOME':
        return (
          <div className="animate-in fade-in duration-500">
            {!searchQuery && !isBrowsing && featuredShow && (
              <div className="relative h-[500px] md:h-[600px] w-full overflow-hidden">
                <div className="absolute inset-0">
                    <img src={featuredShow.banner_url} alt="Hero" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/60 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-navy-900 via-navy-900/40 to-transparent" />
                </div>
                <div className="container mx-auto px-4 relative h-full flex items-end pb-16 md:pb-24">
                  <div className="max-w-2xl space-y-4">
                    <span className="inline-block px-3 py-1 bg-purple text-white text-xs font-bold rounded uppercase tracking-wider">Trending Now</span>
                    <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">{featuredShow.title_tr}</h1>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                        <span className="px-2 py-0.5 border border-gray-500 rounded text-xs">{featuredShow.network}</span>
                        <span>{featuredShow.genres?.slice(0, 3).join(', ')}</span>
                    </div>
                    <p className="text-gray-300 text-lg line-clamp-2 md:line-clamp-3">{featuredShow.synopsis}</p>
                    <div className="flex gap-4 pt-4">
                        <button onClick={() => handleSeriesClick(featuredShow.id)} className="bg-purple hover:bg-purple-light text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 transition-all transform hover:scale-105"><Play className="w-5 h-5 fill-current" />Start Watching</button>
                        <button onClick={() => handleAddToWatchlist(featuredShow.id)} className="bg-white/10 hover:bg-white/20 backdrop-blur text-white px-8 py-3 rounded-lg font-bold transition-all">{watchlist.includes(featuredShow.id) ? '- My List' : '+ My List'}</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="container mx-auto px-4 py-12 space-y-16">
              <section>
                <div className="flex justify-between items-end mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <div className="w-1 h-6 bg-purple rounded-full"></div>
                        {searchQuery ? `Search Results for "${searchQuery}"` : isBrowsing ? browseTitle : 'Global Trending'}
                    </h2>
                    {isBrowsing && (<button onClick={handleClearBrowse} className="text-purple hover:text-white text-sm font-semibold flex items-center"><X className="w-4 h-4 mr-1" /> Clear Filter</button>)}
                </div>
                {isSearching || loadingSeries ? (
                   <div className="text-center py-20 text-gray-500 flex flex-col items-center gap-4"><div className="w-8 h-8 border-2 border-purple border-t-transparent rounded-full animate-spin"></div><span>{isSearching ? 'Searching...' : 'Loading Content...'}</span></div>
                ) : (
                     seriesList.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                        {seriesList.map((series) => (<DiziCard key={series.id} series={series} onAddToWatchlist={handleAddToWatchlist} onClick={() => handleSeriesClick(series.id)} />))}
                        </div>
                    ) : ( <div className="text-center py-20 text-gray-500 border border-white/5 rounded-xl border-dashed">No series found.</div> )
                )}
                {!searchQuery && !isBrowsing && (
                    <div className="space-y-12 mt-12">
                        <div className="pt-8">
                            {CATEGORIES.map((cat, idx) => (
                                <CategoryRow key={idx} title={cat.title} endpoint={cat.endpoint} params={cat.params} onSeriesClick={handleSeriesClick} onAddToWatchlist={handleAddToWatchlist} onViewAll={() => handleBrowse(cat.title, cat.endpoint, cat.params)} />
                            ))}
                        </div>
                    </div>
                )}
              </section>
            </div>
          </div>
        );
      case 'SERIES_DETAIL':
        const displaySeries = detailData?.series || seriesList.find(s => s.id === selectedSeriesId);
        if (!displaySeries) return <div className="p-8 text-center text-white">Series not found</div>;
        return <SeriesDetail series={displaySeries} cast={detailData?.cast || []} onAddToWatchlist={handleAddToWatchlist} isInWatchlist={watchlist.includes(displaySeries.id)} />;
      case 'RATINGS':
        return (<div className="container mx-auto px-4 py-12"><h2 className="text-3xl font-bold mb-8 text-white">Detailed Ratings</h2><RatingsTable ratings={MOCK_RATINGS} series={seriesList} /></div>);
      case 'CALENDAR':
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="flex items-center justify-between mb-8"><div><h2 className="text-3xl font-bold text-white">Broadcast Calendar</h2><p className="text-gray-400 text-sm mt-1">Ongoing dramas airing this week</p></div><span className="text-purple font-mono bg-purple/10 px-3 py-1 rounded">Next 7 Days</span></div>
                {calendarData.length === 0 ? (<div className="text-center py-20"><div className="w-10 h-10 border-4 border-purple border-t-transparent rounded-full animate-spin mx-auto mb-4" /><p className="text-gray-400">Loading schedule...</p></div>) : (
                    <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                        {daysOfWeek.map((day) => {
                            const showsForDay = calendarGrouped[day] || [];
                            return (
                                <div key={day} className="bg-navy-800 rounded-lg p-4 min-h-[300px] border border-white/5 flex flex-col gap-3">
                                    <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-2"><span className="text-gray-500 font-bold uppercase text-xs">{day}</span><span className="text-xs text-gray-600">{showsForDay.length} Shows</span></div>
                                    {showsForDay.map(show => (
                                        <div key={show.id} onClick={() => handleSeriesClick(show.id)} className="bg-navy-700 p-3 rounded group hover:bg-navy-600 transition-colors cursor-pointer relative">
                                            <div className="flex justify-between items-start mb-1"><div className="text-xs text-purple font-bold">{show.next_episode?.air_date.split('-')[1]}/{show.next_episode?.air_date.split('-')[2]}</div><button onClick={(e) => { e.stopPropagation(); alert(`Reminder set!`); }} className="text-gray-500 hover:text-white"><Bell className="w-3 h-3" /></button></div>
                                            <div className="text-sm font-bold text-white leading-tight mb-1 line-clamp-2 group-hover:text-purple">{show.title_tr}</div>
                                        </div>
                                    ))}
                                    {showsForDay.length === 0 && (<div className="text-[10px] text-gray-600 text-center py-4 italic">No shows airing</div>)}
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
          <div className="container mx-auto px-4 py-12 relative">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="bg-navy-800 p-6 rounded-xl border border-white/5 text-center h-fit">
                    <div className="w-32 h-32 bg-purple rounded-full mx-auto mb-4 flex items-center justify-center text-4xl font-bold border-4 border-navy-900 shadow-xl text-white overflow-hidden relative group">{displayUser?.avatar_url ? (<img src={displayUser.avatar_url} alt="Profile" className="w-full h-full object-cover" />) : (user.name.charAt(0).toUpperCase())}</div>
                    <h2 className="text-xl font-bold text-white">{displayUser?.name || user.name}</h2>
                    <p className="text-gray-400 text-sm mb-6">{userProfile?.bio || 'Series Addict'}</p>
                    <button onClick={() => setIsEditingProfile(true)} className="w-full bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"><Edit2 className="w-4 h-4" /> Edit Profile</button>
                </div>
                <div className="md:col-span-3 space-y-8">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-4">My Watchlist</h3>
                        {watchlist.length === 0 ? ( <div className="bg-navy-800 rounded-xl p-12 text-center border border-white/5 border-dashed"><p className="text-gray-400">Your watchlist is empty.</p></div>
                        ) : ( <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{seriesList.filter(s => watchlist.includes(s.id)).map(series => (<DiziCard key={series.id} series={series} onAddToWatchlist={handleAddToWatchlist} />))}</div> )}
                    </div>
                </div>
            </div>
          </div>
        );
      default: return <div>View not found</div>;
    }
  };

  return (<Layout currentView={currentView} onChangeView={setCurrentView} user={displayUser} onLogout={handleLogout} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onBrowse={handleBrowse}>{renderContent()}</Layout>);
}
export default App;
