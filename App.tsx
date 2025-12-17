import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { DiziCard } from './components/DiziCard';
import { RatingsTable } from './components/RatingsTable';
import { AdminPanel } from './pages/Admin';
import { AuthPage } from './pages/Auth';
import { ViewState, User } from './types';
import { MOCK_SERIES, MOCK_RATINGS } from './constants';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
    Calendar as CalendarIcon, 
    Play, 
    TrendingUp, 
    BarChart2, 
    Clock, 
    ChevronRight,
    PlayCircle
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('HOME');
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);

  // Monitor Firebase Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Determine role based on email pattern or existing custom claim if available
        // For this demo, we maintain the simple check
        const role = firebaseUser.email?.toLowerCase().includes('admin') ? 'ADMIN' : 'USER';
        
        setUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email || '',
          role: role
        });
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = (email: string, name: string, role: 'ADMIN' | 'USER') => {
    // This function is now mainly a callback to handle navigation after auth success
    // The actual user state is set by the useEffect hook above
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

  const handleAddToWatchlist = (id: string) => {
    if (!user) {
        // If not logged in, prompt to login
        setCurrentView('LOGIN');
        return;
    }
    if (!watchlist.includes(id)) {
      setWatchlist([...watchlist, id]);
      alert('Added to watchlist!');
    }
  };

  const featuredShow = MOCK_SERIES.find(s => s.id === '1');

  // Dedicated Route Handling

  // 1. Admin Logic
  if (currentView === 'ADMIN') {
    // Basic protection: if not logged in or not admin, kick them out
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

  // 2. Auth Page Logic (Standalone Layout)
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
            {/* Hero Slider Section */}
            {featuredShow && (
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
                        <button className="bg-purple hover:bg-purple-light text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 transition-all transform hover:scale-105">
                            <Play className="w-5 h-5 fill-current" />
                            Start Watching
                        </button>
                        <button 
                            onClick={() => handleAddToWatchlist(featuredShow.id)}
                            className="bg-white/10 hover:bg-white/20 backdrop-blur text-white px-8 py-3 rounded-lg font-bold transition-all"
                        >
                            + My List
                        </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="container mx-auto px-4 py-12 space-y-16">
              {/* Featured Section */}
              <section>
                <div className="flex justify-between items-end mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <div className="w-1 h-6 bg-purple rounded-full"></div>
                        Featured Series
                    </h2>
                    <a href="#" className="text-purple hover:text-white text-sm font-semibold flex items-center">
                        View All <ChevronRight className="w-4 h-4" />
                    </a>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  {MOCK_SERIES.map((series) => (
                    <DiziCard 
                        key={series.id} 
                        series={series} 
                        onAddToWatchlist={handleAddToWatchlist}
                    />
                  ))}
                </div>
              </section>

              {/* Ratings Preview Section */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <RatingsTable ratings={MOCK_RATINGS} series={MOCK_SERIES} />
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
            </div>
          </div>
        );

      case 'RATINGS':
        return (
          <div className="container mx-auto px-4 py-12">
            <h2 className="text-3xl font-bold mb-8">Detailed Ratings</h2>
            <RatingsTable ratings={MOCK_RATINGS} series={MOCK_SERIES} />
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
                            
                            {/* Mock logic to place cards */}
                            {i === 4 && (
                                <div className="mt-4 bg-navy-700 p-2 rounded border-l-2 border-purple">
                                    <div className="text-xs text-purple font-bold">20:00</div>
                                    <div className="text-sm font-bold text-white truncate">Kızılcık Şerbeti</div>
                                    <div className="text-[10px] text-gray-400">Show TV</div>
                                </div>
                            )}
                            {i === 4 && (
                                <div className="mt-2 bg-navy-700 p-2 rounded border-l-2 border-blue-500">
                                    <div className="text-xs text-blue-400 font-bold">20:00</div>
                                    <div className="text-sm font-bold text-white truncate">Yalı Çapkını</div>
                                    <div className="text-[10px] text-gray-400">Star TV</div>
                                </div>
                            )}
                             {i === 6 && (
                                <div className="mt-4 bg-navy-700 p-2 rounded border-l-2 border-orange-500">
                                    <div className="text-xs text-orange-400 font-bold">20:00</div>
                                    <div className="text-sm font-bold text-white truncate">Yargı</div>
                                    <div className="text-[10px] text-gray-400">Kanal D</div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );

      case 'PROFILE':
        // Protected Route check
        if (!user) {
             setCurrentView('LOGIN');
             return null;
        }

        return (
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Profile Sidebar */}
                <div className="bg-navy-800 p-6 rounded-xl border border-white/5 text-center h-fit">
                    <div className="w-32 h-32 bg-purple rounded-full mx-auto mb-4 flex items-center justify-center text-4xl font-bold border-4 border-navy-900 shadow-xl text-white">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <h2 className="text-xl font-bold text-white">{user.name}</h2>
                    <p className="text-gray-400 text-sm mb-6">Series Addict • Istanbul</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-navy-900 p-3 rounded-lg">
                            <div className="text-xl font-bold text-white">142</div>
                            <div className="text-[10px] text-gray-500 uppercase">Hours</div>
                        </div>
                         <div className="bg-navy-900 p-3 rounded-lg">
                            <div className="text-xl font-bold text-white">12</div>
                            <div className="text-[10px] text-gray-500 uppercase">Series</div>
                        </div>
                    </div>
                    
                    <button className="w-full bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg text-sm font-semibold transition-colors">
                        Edit Profile
                    </button>
                </div>

                {/* Main Dashboard */}
                <div className="md:col-span-3 space-y-8">
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-purple-900 to-navy-800 p-6 rounded-xl border border-white/10 relative overflow-hidden">
                            <BarChart2 className="absolute right-[-10px] bottom-[-10px] w-24 h-24 text-white/5" />
                            <h3 className="text-gray-300 text-sm font-medium">Favorite Genre</h3>
                            <p className="text-2xl font-bold text-white mt-1">Drama & Romance</p>
                        </div>
                        <div className="bg-navy-800 p-6 rounded-xl border border-white/5 relative overflow-hidden">
                             <Clock className="absolute right-[-10px] bottom-[-10px] w-24 h-24 text-white/5" />
                            <h3 className="text-gray-300 text-sm font-medium">Time Watched</h3>
                            <p className="text-2xl font-bold text-white mt-1">142h 30m</p>
                        </div>
                        <div className="bg-navy-800 p-6 rounded-xl border border-white/5 relative overflow-hidden">
                             <PlayCircle className="absolute right-[-10px] bottom-[-10px] w-24 h-24 text-white/5" />
                            <h3 className="text-gray-300 text-sm font-medium">Episodes</h3>
                            <p className="text-2xl font-bold text-white mt-1">345</p>
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
                                {MOCK_SERIES.filter(s => watchlist.includes(s.id)).map(series => (
                                    <DiziCard key={series.id} series={series} onAddToWatchlist={() => {}} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
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
        user={user}
        onLogout={handleLogout}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;