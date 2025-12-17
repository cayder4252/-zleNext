import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, User as UserIcon, Menu, X, PlayCircle, LogOut, LogIn, ChevronDown, Zap, Rocket, Calendar, Newspaper, Activity, AlertCircle, Heart } from 'lucide-react';
import { ViewState, User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  user: User | null;
  onLogout: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onBrowse: (title: string, endpoint: string, params: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentView, 
  onChangeView, 
  user, 
  onLogout,
  searchQuery,
  setSearchQuery,
  onBrowse
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const startMenuRef = useRef<HTMLDivElement>(null);

  const navItems: { label: string; view: ViewState }[] = [
    { label: 'Home', view: 'HOME' },
    { label: 'Ratings', view: 'RATINGS' },
    { label: 'Calendar', view: 'CALENDAR' },
  ];

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (startMenuRef.current && !startMenuRef.current.contains(event.target as Node)) {
        setIsStartMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGenreClick = (genreName: string, id: number) => {
      onBrowse(`${genreName} Series`, 'discover/tv', `with_genres=${id}&sort_by=popularity.desc`);
      setIsStartMenuOpen(false);
      onChangeView('HOME');
  };

  const handleCategoryClick = (title: string, endpoint: string, params: string) => {
      onBrowse(title, endpoint, params);
      setIsStartMenuOpen(false);
      onChangeView('HOME');
  };

  const GENRES_LEFT = [
      { name: 'Action & Adventure', id: 10759 },
      { name: 'Animation', id: 16 },
      { name: 'Comedy', id: 35 },
      { name: 'Crime', id: 80 },
      { name: 'Drama', id: 18 },
      { name: 'Family', id: 10751 },
      { name: 'History', id: 36 },
      { name: 'Legal', id: 18 }, // TMDb doesn't have specific Legal, mapping to Drama
      { name: 'Music', id: 10402 },
      { name: 'Period Drama', id: 10764 }, // Mapping to Reality/Costume generic
      { name: 'Romance', id: 10749 },
      { name: 'Sci-Fi & Fantasy', id: 10765 },
  ];

  const GENRES_RIGHT = [
      { name: 'Action', id: 28 }, // Movie Action (often used for TV too in mixed lists)
      { name: 'Horror', id: 27 },
      { name: 'Medical', id: 18 }, // Mapping to Drama
      { name: 'Mystery', id: 9648 },
      { name: 'Reality', id: 10764 },
      { name: 'Romantic Comedy', id: 35 }, // Mapping to Comedy
      { name: 'Sci-Fi', id: 10765 },
      { name: 'Soap', id: 10766 },
      { name: 'Teen', id: 18 },
      { name: 'Thriller', id: 53 },
      { name: 'War & Politics', id: 10768 },
      { name: 'Western', id: 37 },
  ];

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-navy-900/95 backdrop-blur-sm border-b border-white/10 shadow-lg">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-6">
              {/* Logo / Homepage Button */}
              <div 
                className="flex items-center gap-2 cursor-pointer group" 
                onClick={() => onChangeView('HOME')}
                title="Go to Homepage"
              >
                <div className="w-8 h-8 bg-purple rounded-lg flex items-center justify-center group-hover:bg-purple-light transition-colors shadow-lg shadow-purple/20">
                  <PlayCircle className="text-white w-5 h-5" fill="currentColor" />
                </div>
                <span className="text-xl font-bold tracking-tight text-white group-hover:text-gray-100 transition-colors hidden sm:block">
                  İZLE<span className="text-purple group-hover:text-purple-light">NEXT</span>
                </span>
              </div>

              {/* START HERE BUTTON */}
              <div className="relative" ref={startMenuRef}>
                  <button 
                    onClick={() => setIsStartMenuOpen(!isStartMenuOpen)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all border ${isStartMenuOpen ? 'bg-white text-navy-900 border-white' : 'bg-transparent text-white border-white/30 hover:border-white'}`}
                  >
                      START HERE <ChevronDown className={`w-4 h-4 transition-transform ${isStartMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* MEGA MENU POPUP */}
                  {isStartMenuOpen && (
                      <div className="absolute top-full left-0 mt-4 w-[90vw] max-w-[1000px] bg-navy-800 border border-white/10 rounded-xl shadow-2xl p-8 grid grid-cols-1 md:grid-cols-4 gap-8 animate-in fade-in slide-in-from-top-2 z-50">
                          
                          {/* Column 1: TV Shows Lists */}
                          <div className="space-y-6 border-r border-white/5 pr-6">
                              <h3 className="text-purple font-bold border-b border-purple/30 pb-2 mb-4 inline-block">TV Shows</h3>
                              <ul className="space-y-4">
                                  <li onClick={() => handleCategoryClick('Trending TV Shows', 'trending/tv/day', '')} className="flex items-center gap-3 text-gray-300 hover:text-white cursor-pointer group">
                                      <Zap className="w-4 h-4 text-yellow-500" />
                                      <span className="text-sm font-medium group-hover:translate-x-1 transition-transform">Trending TV Shows</span>
                                  </li>
                                  <li onClick={() => handleCategoryClick('Most Popular', 'tv/popular', '')} className="flex items-center gap-3 text-gray-300 hover:text-white cursor-pointer group">
                                      <Rocket className="w-4 h-4 text-red-500" />
                                      <span className="text-sm font-medium group-hover:translate-x-1 transition-transform">Most Popular TV Shows</span>
                                  </li>
                                  <li onClick={() => handleCategoryClick('Newest Shows', 'tv/on_the_air', '')} className="flex items-center gap-3 text-gray-300 hover:text-white cursor-pointer group">
                                      <span className="w-4 h-4 flex items-center justify-center font-bold text-[10px] bg-blue-500 text-white rounded">NEW</span>
                                      <span className="text-sm font-medium group-hover:translate-x-1 transition-transform">Newest TV Shows</span>
                                  </li>
                                  <li onClick={() => handleCategoryClick('Upcoming Shows', 'discover/tv', 'first_air_date.gte=2024-12-01&sort_by=popularity.desc')} className="flex items-center gap-3 text-gray-300 hover:text-white cursor-pointer group">
                                      <Calendar className="w-4 h-4 text-green-500" />
                                      <span className="text-sm font-medium group-hover:translate-x-1 transition-transform">Upcoming TV Shows</span>
                                  </li>
                              </ul>

                              <div className="h-px bg-white/5 my-4" />

                              <ul className="space-y-3">
                                  <li onClick={() => alert('News module coming soon!')} className="flex items-center gap-3 text-gray-400 hover:text-white cursor-pointer text-sm">
                                      <Newspaper className="w-4 h-4" /> Latest Dizi News
                                  </li>
                                  <li onClick={() => handleCategoryClick('Curated For You', 'tv/top_rated', '')} className="flex items-center gap-3 text-gray-400 hover:text-white cursor-pointer text-sm">
                                      <Heart className="w-4 h-4 text-pink-500" /> Curated For You
                                  </li>
                                  <li onClick={() => handleCategoryClick('Cancellation Buzz', 'discover/tv', 'vote_average.lte=6&sort_by=popularity.desc')} className="flex items-center gap-3 text-gray-400 hover:text-white cursor-pointer text-sm">
                                      <AlertCircle className="w-4 h-4 text-orange-500" /> Cancellation Buzz
                                  </li>
                                  <li onClick={() => alert('Activity feed requires login.')} className="flex items-center gap-3 text-gray-400 hover:text-white cursor-pointer text-sm">
                                      <Activity className="w-4 h-4" /> Activity Feed
                                  </li>
                              </ul>

                              <button 
                                onClick={() => handleCategoryClick('Explore All Shows', 'discover/tv', 'sort_by=popularity.desc')}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded mt-4 transition-colors text-sm"
                              >
                                  EXPLORE SHOWS
                              </button>
                          </div>

                          {/* Column 2: Genres Left */}
                          <div>
                              <h3 className="text-purple font-bold border-b border-purple/30 pb-2 mb-4 inline-block">Top Genres</h3>
                              <ul className="space-y-2">
                                  {GENRES_LEFT.map(g => (
                                      <li key={g.name} onClick={() => handleGenreClick(g.name, g.id)} className="text-gray-400 hover:text-purple cursor-pointer text-sm transition-colors">
                                          {g.name}
                                      </li>
                                  ))}
                              </ul>
                          </div>

                          {/* Column 3: Genres Right */}
                          <div className="pt-10"> 
                              <ul className="space-y-2">
                                  {GENRES_RIGHT.map(g => (
                                      <li key={g.name} onClick={() => handleGenreClick(g.name, g.id)} className="text-gray-400 hover:text-purple cursor-pointer text-sm transition-colors">
                                          {g.name}
                                      </li>
                                  ))}
                              </ul>
                          </div>

                           {/* Column 4: Quick Links */}
                           <div className="border-l border-white/5 pl-6">
                              <h3 className="text-purple font-bold border-b border-purple/30 pb-2 mb-4 inline-block">Quick Links</h3>
                              <ul className="space-y-4">
                                  {[
                                      {label: 'Upcoming Birthdays', icon: '🎂'},
                                      {label: 'About Dizilah', icon: '📰'},
                                      {label: 'Request a Show', icon: '🎬'},
                                      {label: 'Contact Us', icon: '💬'},
                                      {label: 'Terms of Use', icon: '📋'},
                                      {label: 'Privacy Policy', icon: '🔒'},
                                  ].map((link) => (
                                      <li key={link.label} onClick={() => alert(`${link.label} page is under construction.`)} className="flex items-center gap-3 text-gray-400 hover:text-white cursor-pointer text-sm group">
                                          <span className="grayscale group-hover:grayscale-0">{link.icon}</span>
                                          <span>{link.label}</span>
                                      </li>
                                  ))}
                              </ul>
                              
                              <div className="flex gap-2 mt-8">
                                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-white hover:text-black cursor-pointer transition-colors text-xs font-bold">X</div>
                                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-pink-600 cursor-pointer transition-colors text-xs font-bold">IG</div>
                                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-blue-600 cursor-pointer transition-colors text-xs font-bold">FB</div>
                                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-red-600 cursor-pointer transition-colors text-xs font-bold">YT</div>
                              </div>
                           </div>
                      </div>
                  )}
              </div>
          </div>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8 relative">
            <input
              type="text"
              placeholder="Search series, actors..."
              className="w-full bg-navy-800 border border-navy-700 text-white px-4 py-2 pl-10 pr-10 rounded-full focus:outline-none focus:border-purple transition-colors text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            
            {/* Clear Search Button */}
            {searchQuery && (
                <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-white transition-colors"
                    title="Clear search"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => onChangeView(item.view)}
                className={`text-sm font-semibold transition-colors ${
                  currentView === item.view ? 'text-purple' : 'text-gray-300 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
            
            <div className="h-6 w-px bg-white/10 mx-2" />
            
            {user ? (
              <>
                {/* User Logged In State */}
                <button className="text-gray-300 hover:text-white">
                  <Bell className="w-5 h-5" />
                </button>
                
                <button 
                  onClick={() => onChangeView('PROFILE')}
                  className={`flex items-center gap-2 px-2 py-1 rounded-full border border-transparent hover:border-purple/50 transition-all ${currentView === 'PROFILE' ? 'border-purple text-purple' : 'text-gray-300'}`}
                >
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="Avatar" className="w-6 h-6 rounded-full object-cover border border-purple" />
                  ) : (
                    <div className="w-6 h-6 bg-purple rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-semibold max-w-[80px] truncate">{user.name}</span>
                </button>

                {user.role === 'ADMIN' && (
                  <button 
                    onClick={() => onChangeView('ADMIN')}
                    className={`text-xs px-3 py-1 bg-navy-800 rounded border border-white/10 hover:bg-navy-700 ${currentView === 'ADMIN' ? 'border-purple text-purple' : 'text-gray-400'}`}
                  >
                    Admin
                  </button>
                )}

                <button 
                  onClick={onLogout}
                  title="Logout"
                  className="text-gray-400 hover:text-red-400 transition-colors ml-2"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              /* Guest State */
              <button 
                onClick={() => onChangeView('LOGIN')}
                className="flex items-center gap-2 bg-purple/10 hover:bg-purple/20 text-purple px-4 py-2 rounded-full transition-colors text-sm font-bold border border-purple/20"
              >
                <LogIn className="w-4 h-4" />
                Login
              </button>
            )}
          </nav>

          {/* Mobile Toggle */}
          <button 
            className="md:hidden text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-navy-800 border-b border-white/10 p-4 absolute w-full animate-in slide-in-from-top-2 z-50 shadow-2xl">
            <div className="flex flex-col gap-4">
               <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full bg-navy-900 border border-navy-700 text-white px-4 py-2 rounded-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                 {searchQuery ? (
                    <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-2.5 text-gray-400"
                    >
                        <X className="w-4 h-4" />
                    </button>
                 ) : (
                    <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                 )}
               </div>
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    onChangeView(item.view);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`text-left font-semibold ${
                    currentView === item.view ? 'text-purple' : 'text-gray-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <div className="h-px bg-white/10 my-2" />
              
              {user ? (
                <>
                   <button 
                    onClick={() => { onChangeView('PROFILE'); setIsMobileMenuOpen(false); }}
                    className="text-left text-gray-300 font-semibold flex items-center gap-2"
                  >
                    <UserIcon className="w-4 h-4" /> My Profile
                  </button>
                  {user.role === 'ADMIN' && (
                    <button 
                      onClick={() => { onChangeView('ADMIN'); setIsMobileMenuOpen(false); }}
                      className="text-left text-purple font-semibold"
                    >
                      Admin Panel
                    </button>
                  )}
                  <button 
                    onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
                    className="text-left text-red-400 font-semibold flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => { onChangeView('LOGIN'); setIsMobileMenuOpen(false); }}
                  className="text-left text-purple font-bold flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" /> Login / Register
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-navy-700 pt-16 pb-8 border-t border-white/5 mt-auto">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            
            {/* Column 1: About */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 cursor-pointer group" onClick={() => onChangeView('HOME')}>
                <div className="w-6 h-6 bg-purple rounded flex items-center justify-center group-hover:bg-purple-light transition-colors">
                  <PlayCircle className="text-white w-4 h-4" fill="currentColor" />
                </div>
                <span className="text-lg font-bold text-white">İZLENEXT</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                The ultimate destination for Turkish Drama enthusiasts. Track your shows, check daily ratings, and discover the next big hit.
              </p>
            </div>

            {/* Column 2: Navigation */}
            <div>
              <h3 className="text-white font-bold mb-4">Discover</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-purple transition-colors">Trending Shows</a></li>
                <li><a href="#" className="hover:text-purple transition-colors">New Releases</a></li>
                <li><a href="#" className="hover:text-purple transition-colors">Actors & Cast</a></li>
                <li><a href="#" className="hover:text-purple transition-colors">Calendar</a></li>
              </ul>
            </div>

             {/* Column 3: Legal */}
             <div>
              <h3 className="text-white font-bold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-purple transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-purple transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-purple transition-colors">DMCA</a></li>
                <li><a href="#" className="hover:text-purple transition-colors">Cookie Policy</a></li>
              </ul>
            </div>

             {/* Column 4: Download */}
             <div>
              <h3 className="text-white font-bold mb-4">Get the App</h3>
              <div className="flex flex-col gap-3">
                <button className="bg-navy-900 hover:bg-navy-800 border border-white/10 rounded-lg p-2 flex items-center gap-3 transition-colors">
                  <div className="w-8 h-8 bg-gray-700 rounded-full" /> {/* Placeholder for Apple Icon */}
                  <div className="text-left">
                    <div className="text-[10px] text-gray-400 uppercase">Download on the</div>
                    <div className="text-sm font-bold text-white">App Store</div>
                  </div>
                </button>
                 <button className="bg-navy-900 hover:bg-navy-800 border border-white/10 rounded-lg p-2 flex items-center gap-3 transition-colors">
                  <div className="w-8 h-8 bg-gray-700 rounded-full" /> {/* Placeholder for Play Store Icon */}
                  <div className="text-left">
                    <div className="text-[10px] text-gray-400 uppercase">Get it on</div>
                    <div className="text-sm font-bold text-white">Google Play</div>
                  </div>
                </button>
              </div>
            </div>

          </div>
          
          <div className="border-t border-white/5 pt-8 text-center text-gray-500 text-sm">
            © 2024 İzleNext Media. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};