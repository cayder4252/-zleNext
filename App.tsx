import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { DiziCard } from './components/DiziCard';
import { RatingsTable } from './components/RatingsTable';
import { SeriesDetail } from './components/SeriesDetail'; // Import new component
import { AdminPanel } from './pages/Admin';
import { AuthPage } from './pages/Auth';
import { ViewState, User, Series } from './types';
import { MOCK_SERIES, MOCK_RATINGS } from './constants';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, updateProfile as updateAuthProfile } from 'firebase/auth';
import { collection, onSnapshot, doc, updateDoc, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
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
    X
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('HOME');
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null); // Track selected series
  const [user, setUser] = useState<User | null>(null);
  
  // Real-time user profile data (bio, location, watchlist from Firestore)
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Data State
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [loadingSeries, setLoadingSeries] = useState(true);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
      name: '',
      avatar_url: '',
      location: '',
      bio: ''
  });

  // Monitor Firebase Auth State
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

  // Monitor Real-time User Data (Firestore)
  useEffect(() => {
    if (!user?.id) return;

    const unsub = onSnapshot(doc(db, 'users', user.id), (doc) => {
        if (doc.exists()) {
            const data = doc.data() as User;
            setUserProfile(data);
            // Sync local form state when data loads
            setProfileForm({
                name: data.name || user.name,
                avatar_url: data.avatar_url || '',
                location: data.location || '',
                bio: data.bio || ''
            });
        }
    });
    return () => unsub;
  }, [user?.id]);

  // Fetch Series Data from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'series'), (snapshot) => {
        const list = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Series[];
        setSeriesList(list);
        setLoadingSeries(false);
    }, (error) => {
        console.error("Error fetching series:", error);
        setSeriesList(MOCK_SERIES);
        setLoadingSeries(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = (email: string, name: string, role: 'ADMIN' | 'USER') => {
    if (role === 'ADMIN') {
      setCurrentView('ADMIN');
    } else {
      setCurrentView('HOME');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentView('HOME');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  // Add/Remove from Watchlist via Firestore
  const handleAddToWatchlist = async (id: string) => {
    if (!user) {
        setCurrentView('LOGIN');
        return;
    }
    const currentWatchlist = userProfile?.watchlist || [];
    const isAdded = currentWatchlist.includes(id);
    const userRef = doc(db, 'users', user.id);

    try {
        if (isAdded) {
            await updateDoc(userRef, { watchlist: arrayRemove(id) });
        } else {
            await updateDoc(userRef, { watchlist: arrayUnion(id) });
            alert('Added to watchlist!');
        }
    } catch (error) {
        console.error("Error updating watchlist", error);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;

      try {
          // Update Firestore
          const userRef = doc(db, 'users', user.id);
          
          // Use setDoc with merge: true to handle both update and create scenarios
          // This fixes issues where the user document might not exist yet
          await setDoc(userRef, {
              name: profileForm.name,
              avatar_url: profileForm.avatar_url,
              location: profileForm.location,
              bio: profileForm.bio,
              updatedAt: new Date().toISOString()
          }, { merge: true });
          
          // Update Auth Profile (Display Name / Photo)
          if (auth.currentUser) {
              await updateAuthProfile(auth.currentUser, {
                  displayName: profileForm.name,
                  photoURL: profileForm.avatar_url
              });
              // Optimistically update local user state
              setUser(prev => prev ? ({ ...prev, name: profileForm.name, avatar_url: profileForm.avatar_url }) : null);
          }

          setIsEditingProfile(false);
          alert("Profile updated successfully!");
      } catch (error: any) {
          console.error("Error updating profile:", error);
          alert("Failed to update profile: " + error.message);
      }
  };

  const handleSeriesClick = (id: string) => {
      setSelectedSeriesId(id);
      setCurrentView('SERIES_DETAIL');
      window.scrollTo(0, 0); // Scroll to top
  };

  // Filter Series based on Search Query
  const allSeries = seriesList.length > 0 ? seriesList : MOCK_SERIES;
  const filteredSeries = allSeries.filter(s => 
      s.title_tr.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.title_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.network.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const featuredShow = filteredSeries.find(s => s.is_featured) || filteredSeries[0];
  // Calculate Stats based on Watchlist
  const watchlist = userProfile?.watchlist || [];
  const watchedSeries = allSeries.filter(s => watchlist.includes(s.id));
  const totalEpisodes = watchedSeries.reduce((acc, curr) => acc + (curr.episodes_aired || 0), 0);
  const totalHours = Math.round(totalEpisodes * 2.2); // Avg 2.2 hours per episode

  // 1. Admin Logic
  if (currentView === 'ADMIN') {
    if (!user || user.role !== 'ADMIN') {
        setCurrentView('LOGIN');
        return null;
    }
    return (
        <div className="relative">
             <button 
                onClick={() => setCurrentView('HOME')} 
                className="fixed bottom-4 right-4 z-50 bg-navy-900 text-white px-4 py-2 rounded-full shadow-lg border border-white/10 hover:bg-purple text-xs"
             >
                Exit Admin
             </button>
            <AdminPanel />
        </div>
    );
  }

  // 2. Auth Logic
  if (currentView === 'LOGIN' || currentView === 'REGISTER') {
    return (
        <AuthPage 
            view={currentView} 
            onChangeView={setCurrentView} 
            onLogin={handleLogin} 
        />
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case 'HOME':
        return (
          <div className="animate-in fade-in duration-500">
            {/* Show Featured only if not searching */}
            {!searchQuery && featuredShow && (
              <div className="relative h-[500px] md:h-[600px] w-full overflow-hidden">
                <div className="absolute inset-0">
                    <img 
                        src={featuredShow.banner_url} 
                        alt="Hero" 
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/60 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-navy-900 via-navy-900/40 to-transparent" />
                </div>
                
                <div className="container mx-auto px-4 relative h-full flex items-end pb-16 md:pb-24">
                  <div className="max-w-2xl space-y-4">
                    <span className="inline-block px-3 py-1 bg-purple text-white text-xs font-bold rounded uppercase tracking-wider">
                        Trending Now
                    </span>
                    <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
                        {featuredShow.title_tr}
                    </h1>
                    <p className="text-gray-300 text-lg line-clamp-2 md:line-clamp-3">
                        {featuredShow.synopsis}
                    </p>
                    <div className="flex gap-4 pt-4">
                        <button 
                            onClick={() => handleSeriesClick(featuredShow.id)}
                            className="bg-purple hover:bg-purple-light text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 transition-all transform hover:scale-105"
                        >
                            <Play className="w-5 h-5 fill-current" />
                            Start Watching
                        </button>
                        <button 
                            onClick={() => handleAddToWatchlist(featuredShow.id)}
                            className="bg-white/10 hover:bg-white/20 backdrop-blur text-white px-8 py-3 rounded-lg font-bold transition-all"
                        >
                           {watchlist.includes(featuredShow.id) ? '- My List' : '+ My List'}
                        </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="container mx-auto px-4 py-12 space-y-16">
              {/* Featured / Search Results */}
              <section>
                <div className="flex justify-between items-end mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <div className="w-1 h-6 bg-purple rounded-full"></div>
                        {searchQuery ? `Search Results for "${searchQuery}"` : 'Featured Series'}
                    </h2>
                    {!searchQuery && (
                        <a href="#" className="text-purple hover:text-white text-sm font-semibold flex items-center">
                            View All <ChevronRight className="w-4 h-4" />
                        </a>
                    )}
                </div>
                
                {filteredSeries.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {filteredSeries.map((series) => (
                        <DiziCard 
                            key={series.id} 
                            series={series} 
                            onAddToWatchlist={handleAddToWatchlist}
                            onClick={() => handleSeriesClick(series.id)}
                        />
                    ))}
                    </div>
                ) : (
                    <div className="text-center py-20 text-gray-500 border border-white/5 rounded-xl border-dashed">
                        No series found matching "{searchQuery}".
                    </div>
                )}
              </section>

              {/* Ratings Preview Section (Only show if not searching) */}
              {!searchQuery && (
                  <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <RatingsTable ratings={MOCK_RATINGS} series={allSeries} />
                    </div>
                    <div className="bg-navy-800 rounded-xl p-6 border border-white/5">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                            <TrendingUp className="text-purple" /> Market Share Analysis
                        </h3>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={MOCK_RATINGS}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                    <XAxis dataKey="category" stroke="#9ca3af" fontSize={12} />
                                    <YAxis stroke="#9ca3af" fontSize={12} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1F1F1F', border: '1px solid #333' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Bar dataKey="rating" fill="#7B2CBF" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="text-xs text-gray-400 mt-4 text-center">
                            *Data based on Total audience share from yesterday.
                        </p>
                    </div>
                  </section>
              )}
            </div>
          </div>
        );

      case 'SERIES_DETAIL':
        const series = allSeries.find(s => s.id === selectedSeriesId);
        if (!series) return <div className="p-8 text-center text-white">Series not found</div>;
        
        return (
            <SeriesDetail 
                series={series} 
                onAddToWatchlist={handleAddToWatchlist}
                isInWatchlist={watchlist.includes(series.id)}
            />
        );

      case 'RATINGS':
        return (
          <div className="container mx-auto px-4 py-12">
            <h2 className="text-3xl font-bold mb-8 text-white">Detailed Ratings</h2>
            <RatingsTable ratings={MOCK_RATINGS} series={allSeries} />
          </div>
        );

      case 'CALENDAR':
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-bold text-white">Broadcast Calendar</h2>
                    <span className="text-purple font-mono">Dec 2023</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                        <div key={day} className="bg-navy-800 rounded-lg p-4 min-h-[200px] border border-white/5 relative">
                            <span className="text-gray-500 font-bold uppercase text-xs">{day}</span>
                            {i === 4 && (
                                <div className="mt-4 bg-navy-700 p-2 rounded border-l-2 border-purple">
                                    <div className="text-xs text-purple font-bold">20:00</div>
                                    <div className="text-sm font-bold text-white truncate">Kızılcık Şerbeti</div>
                                    <div className="text-[10px] text-gray-400">Show TV</div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );

      case 'PROFILE':
        if (!user) {
             setCurrentView('LOGIN');
             return null;
        }

        return (
          <div className="container mx-auto px-4 py-12 relative">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Profile Sidebar */}
                <div className="bg-navy-800 p-6 rounded-xl border border-white/5 text-center h-fit">
                    <div className="w-32 h-32 bg-purple rounded-full mx-auto mb-4 flex items-center justify-center text-4xl font-bold border-4 border-navy-900 shadow-xl text-white overflow-hidden relative group">
                        {userProfile?.avatar_url ? (
                            <img src={userProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            user.name.charAt(0).toUpperCase()
                        )}
                    </div>
                    
                    <h2 className="text-xl font-bold text-white">{userProfile?.name || user.name}</h2>
                    <p className="text-gray-400 text-sm mb-6">
                        {userProfile?.bio || 'Series Addict'} • {userProfile?.location || 'Istanbul'}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-navy-900 p-3 rounded-lg">
                            <div className="text-xl font-bold text-white">{totalHours}</div>
                            <div className="text-[10px] text-gray-500 uppercase">Hours</div>
                        </div>
                         <div className="bg-navy-900 p-3 rounded-lg">
                            <div className="text-xl font-bold text-white">{watchlist.length}</div>
                            <div className="text-[10px] text-gray-500 uppercase">Series</div>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => setIsEditingProfile(true)}
                        className="w-full bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                        <Edit2 className="w-4 h-4" /> Edit Profile
                    </button>
                </div>

                {/* Main Dashboard */}
                <div className="md:col-span-3 space-y-8">
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-purple-900 to-navy-800 p-6 rounded-xl border border-white/10 relative overflow-hidden">
                            <BarChart2 className="absolute right-[-10px] bottom-[-10px] w-24 h-24 text-white/5" />
                            <h3 className="text-gray-300 text-sm font-medium">Favorite Genre</h3>
                            <p className="text-2xl font-bold text-white mt-1">Drama</p>
                        </div>
                        <div className="bg-navy-800 p-6 rounded-xl border border-white/5 relative overflow-hidden">
                             <Clock className="absolute right-[-10px] bottom-[-10px] w-24 h-24 text-white/5" />
                            <h3 className="text-gray-300 text-sm font-medium">Time Watched</h3>
                            <p className="text-2xl font-bold text-white mt-1">{totalHours}h 30m</p>
                        </div>
                        <div className="bg-navy-800 p-6 rounded-xl border border-white/5 relative overflow-hidden">
                             <PlayCircle className="absolute right-[-10px] bottom-[-10px] w-24 h-24 text-white/5" />
                            <h3 className="text-gray-300 text-sm font-medium">Episodes</h3>
                            <p className="text-2xl font-bold text-white mt-1">{totalEpisodes}</p>
                        </div>
                    </div>

                    {/* Watchlist */}
                    <div>
                        <h3 className="text-xl font-bold text-white mb-4">My Watchlist</h3>
                        {watchlist.length === 0 ? (
                             <div className="bg-navy-800 rounded-xl p-12 text-center border border-white/5 border-dashed">
                                <p className="text-gray-400">Your watchlist is empty. Go explore!</p>
                                <button 
                                    onClick={() => setCurrentView('HOME')}
                                    className="text-purple font-bold mt-2 hover:underline"
                                >
                                    Browse Shows
                                </button>
                             </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {allSeries.filter(s => watchlist.includes(s.id)).map(series => (
                                    <DiziCard key={series.id} series={series} onAddToWatchlist={handleAddToWatchlist} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* EDIT PROFILE MODAL */}
            {isEditingProfile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-navy-800 border border-white/10 rounded-xl shadow-2xl w-full max-w-md">
                        <div className="flex justify-between items-center p-6 border-b border-white/10">
                            <h3 className="text-xl font-bold text-white">Edit Profile</h3>
                            <button onClick={() => setIsEditingProfile(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Display Name</label>
                                <input 
                                    type="text" 
                                    value={profileForm.name} 
                                    onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                                    className="w-full bg-navy-900 border border-navy-700 text-white rounded p-2 focus:border-purple outline-none" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Avatar URL</label>
                                <input 
                                    type="url" 
                                    value={profileForm.avatar_url} 
                                    onChange={e => setProfileForm({...profileForm, avatar_url: e.target.value})}
                                    placeholder="https://..."
                                    className="w-full bg-navy-900 border border-navy-700 text-white rounded p-2 focus:border-purple outline-none" 
                                />
                                {profileForm.avatar_url && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <img src={profileForm.avatar_url} className="w-10 h-10 rounded-full object-cover border border-white/20" alt="Preview" />
                                        <span className="text-xs text-green-500">Preview</span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Location</label>
                                <input 
                                    type="text" 
                                    value={profileForm.location} 
                                    onChange={e => setProfileForm({...profileForm, location: e.target.value})}
                                    placeholder="e.g. Istanbul"
                                    className="w-full bg-navy-900 border border-navy-700 text-white rounded p-2 focus:border-purple outline-none" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Bio / Tagline</label>
                                <textarea 
                                    rows={2}
                                    value={profileForm.bio} 
                                    onChange={e => setProfileForm({...profileForm, bio: e.target.value})}
                                    placeholder="Tell us about your favorite shows..."
                                    className="w-full bg-navy-900 border border-navy-700 text-white rounded p-2 focus:border-purple outline-none" 
                                />
                            </div>
                            <div className="pt-4 flex justify-end">
                                <button type="submit" className="bg-purple hover:bg-purple-light text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2">
                                    <Save className="w-4 h-4" /> Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
          </div>
        );

      default:
        return <div>View not found</div>;
    }
  };

  return (
    <Layout 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        user={userProfile || user}
        onLogout={handleLogout}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;