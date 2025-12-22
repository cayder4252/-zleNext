import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, User as UserIcon, Menu, X, PlayCircle, LogOut, LogIn, ChevronDown, Zap, Rocket, Calendar, Newspaper, Activity, AlertCircle, Heart, Clock, Trash2, History, Mail, Phone, MapPin } from 'lucide-react';
import { ViewState, User, SiteConfig } from '../types';
import { settingsService, DEFAULT_CONFIG } from '../services/settingsService';

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
  // Initialize from cache immediately to prevent blank screen
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(() => settingsService.getCachedConfig());
  
  const startMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const navItems: { label: string; view: ViewState }[] = [
    { label: 'Home', view: 'HOME' },
    { label: 'Ratings', view: 'RATINGS' },
    { label: 'Calendar', view: 'CALENDAR' },
  ];

  useEffect(() => {
    const unsub = settingsService.subscribeToConfig((config) => {
      setSiteConfig(config);
      document.title = `${config.siteName}${config.siteNamePart2} - Track Turkish Dramas`;
    });

    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
        try {
            const parsed = JSON.parse(savedHistory);
            if (Array.isArray(parsed)) {
                setRecentSearches(parsed.filter((item: any) => typeof item === 'string'));
            }
        } catch (e) {}
    }

    function handleClickOutside(event: MouseEvent) {
      if (startMenuRef.current && !startMenuRef.current.contains(event.target as Node)) {
        setIsStartMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      unsub();
    };
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

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

  const saveSearchTerm = (term: string) => {
      if (typeof term !== 'string') return;
      const cleanTerm = term.trim();
      if (!cleanTerm) return;
      const validHistory = recentSearches.filter(t => typeof t === 'string');
      const newHistory = [cleanTerm, ...validHistory.filter(t => t !== cleanTerm)].slice(0, 10);
      setRecentSearches(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          saveSearchTerm(searchQuery);
          setIsSearchFocused(false);
          setIsMobileMenuOpen(false);
      }
  };

  const handleRecentClick = (term: string) => {
      setSearchQuery(term);
      saveSearchTerm(term);
      setIsSearchFocused(false);
  };

  const deleteRecent = (e: React.MouseEvent, term: string) => {
      e.stopPropagation();
      const newHistory = recentSearches.filter(t => t !== term);
      setRecentSearches(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
      setRecentSearches([]);
      localStorage.removeItem('searchHistory');
  };

  const GENRES_LEFT = [
      { name: 'Action & Adventure', id: 10759 },
      { name: 'Animation', id: 16 },
      { name: 'Comedy', id: 35 },
      { name: 'Crime', id: 80 },
      { name: 'Drama', id: 18 },
      { name: 'Family', id: 10751 },
  ];

  const GENRES_RIGHT = [
      { name: 'Mystery', id: 9648 },
      { name: 'Reality', id: 10764 },
      { name: 'Sci-Fi & Fantasy', id: 10765 },
      { name: 'Soap', id: 10766 },
      { name: 'War & Politics', id: 10768 },
      { name: 'Western', id: 37 },
  ];

  // We no longer return null here. siteConfig is guaranteed to have a value from DEFAULT_CONFIG or cache.

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col font-sans">
      <header className="sticky top-0 z-50 bg-navy-900/90 backdrop-blur-md border-b border-white/10 shadow-lg">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-4 lg:gap-8">
              <div className="flex items-center gap-2 cursor-pointer group select-none" onClick={() => onChangeView('HOME')}>
                {siteConfig.logoUrl ? (
                  <img src={siteConfig.logoUrl} alt="Logo" className="w-8 h-8 rounded-lg object-contain shadow-lg" />
                ) : (
                  <div className="w-8 h-8 bg-purple rounded-lg flex items-center justify-center group-hover:bg-purple-light transition-colors shadow-lg shadow-purple/20">
                    <PlayCircle className="text-white w-5 h-5" fill="currentColor" />
                  </div>
                )}
                <span className="text-xl font-bold tracking-tight text-white group-hover:text-gray-100 transition-colors block">
                  {siteConfig.siteName}<span className="text-purple group-hover:text-purple-light">{siteConfig.siteNamePart2}</span>
                </span>
              </div>

              <div className="hidden lg:block relative" ref={startMenuRef}>
                  <button onClick={() => setIsStartMenuOpen(!isStartMenuOpen)} className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs tracking-wide transition-all border ${isStartMenuOpen ? 'bg-white text-navy-900 border-white' : 'bg-transparent text-white border-white/20 hover:border-white/50'}`}>
                      START HERE <ChevronDown className={`w-3 h-3 transition-transform ${isStartMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isStartMenuOpen && (
                      <div className="absolute top-full left-0 mt-4 w-[85vw] max-w-[900px] bg-navy-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-8 grid grid-cols-4 gap-8 animate-in fade-in slide-in-from-top-2 z-50 ring-1 ring-black/50">
                          <div className="space-y-6 border-r border-white/5 pr-6">
                              <h3 className="text-purple font-bold border-b border-purple/30 pb-2 mb-4 inline-block text-sm uppercase tracking-wider">TV Shows</h3>
                              <ul className="space-y-4">
                                  <li onClick={() => handleCategoryClick('Trending TV Shows', 'trending/tv/day', '')} className="flex items-center gap-3 text-gray-300 hover:text-white cursor-pointer group">
                                      <Zap className="w-4 h-4 text-yellow-500 group-hover:scale-110 transition-transform" />
                                      <span className="text-sm font-medium group-hover:translate-x-1 transition-transform">Trending TV Shows</span>
                                  </li>
                                  <li onClick={() => handleCategoryClick('Most Popular', 'tv/popular', '')} className="flex items-center gap-3 text-gray-300 hover:text-white cursor-pointer group">
                                      <Rocket className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
                                      <span className="text-sm font-medium group-hover:translate-x-1 transition-transform">Most Popular TV Shows</span>
                                  </li>
                                  <li onClick={() => handleCategoryClick('Newest Shows', 'tv/on_the_air', '')} className="flex items-center gap-3 text-gray-300 hover:text-white cursor-pointer group">
                                      <span className="w-4 h-4 flex items-center justify-center font-bold text-[9px] bg-blue-500 text-white rounded group-hover:scale-110 transition-transform">NEW</span>
                                      <span className="text-sm font-medium group-hover:translate-x-1 transition-transform">Newest TV Shows</span>
                                  </li>
                                  <li onClick={() => handleCategoryClick('Upcoming Shows', 'discover/tv', 'first_air_date.gte=2024-12-01&sort_by=popularity.desc')} className="flex items-center gap-3 text-gray-300 hover:text-white cursor-pointer group">
                                      <Calendar className="w-4 h-4 text-green-500 group-hover:scale-110 transition-transform" />
                                      <span className="text-sm font-medium group-hover:translate-x-1 transition-transform">Upcoming TV Shows</span>
                                  </li>
                              </ul>
                              <div className="h-px bg-white/5 my-4" />
                              <button onClick={() => handleCategoryClick('Explore All Shows', 'discover/tv', 'sort_by=popularity.desc')} className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-2.5 rounded-lg mt-2 transition-all shadow-lg shadow-red-900/20 text-xs tracking-wide">
                                  EXPLORE SHOWS
                              </button>
                          </div>
                          <div>
                              <h3 className="text-purple font-bold border-b border-purple/30 pb-2 mb-4 inline-block text-sm uppercase tracking-wider">Top Genres</h3>
                              <ul className="space-y-2">
                                  {GENRES_LEFT.map(g => (
                                      <li key={g.name} onClick={() => handleGenreClick(g.name, g.id)} className="text-gray-400 hover:text-white cursor-pointer text-sm transition-colors hover:translate-x-1 duration-200">{g.name}</li>
                                  ))}
                              </ul>
                          </div>
                          <div className="pt-10"> 
                              <ul className="space-y-2">
                                  {GENRES_RIGHT.map(g => (
                                      <li key={g.name} onClick={() => handleGenreClick(g.name, g.id)} className="text-gray-400 hover:text-white cursor-pointer text-sm transition-colors hover:translate-x-1 duration-200">{g.name}</li>
                                  ))}
                              </ul>
                          </div>
                           <div className="border-l border-white/5 pl-6">
                              <h3 className="text-purple font-bold border-b border-purple/30 pb-2 mb-4 inline-block text-sm uppercase tracking-wider">Quick Links</h3>
                              <ul className="space-y-3">
                                  {[
                                      {label: 'Curated For You', icon: <Heart className="w-3.5 h-3.5 text-pink-500" />, action: () => handleCategoryClick('Curated For You', 'tv/top_rated', '')},
                                      {label: 'Cancellation Buzz', icon: <AlertCircle className="w-3.5 h-3.5 text-orange-500" />, action: () => handleCategoryClick('Cancellation Buzz', 'discover/tv', 'vote_average.lte=6&sort_by=popularity.desc')},
                                  ].map((link, i) => (
                                      <li key={i} onClick={link.action} className="flex items-center gap-3 text-gray-400 hover:text-white cursor-pointer text-sm group">
                                          <span className="opacity-70 group-hover:opacity-100 transition-opacity">{link.icon}</span>
                                          <span>{link.label}</span>
                                      </li>
                                  ))}
                              </ul>
                              <div className="flex gap-2 mt-auto pt-8">
                                  {['twitter', 'instagram', 'facebook', 'youtube'].map(social => (
                                    siteConfig.socialLinks[social as keyof typeof siteConfig.socialLinks] && (
                                      <a key={social} href={siteConfig.socialLinks[social as keyof typeof siteConfig.socialLinks]} target="_blank" className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center cursor-pointer transition-colors text-[10px] font-bold text-gray-400 hover:text-white border border-white/5 uppercase">
                                          {social.charAt(0)}
                                      </a>
                                    )
                                  ))}
                              </div>
                           </div>
                      </div>
                  )}
              </div>
          </div>

          <div className="hidden md:flex flex-1 max-w-xl mx-8 relative group z-50">
            <div className={`absolute inset-0 bg-purple/20 rounded-full blur-md transition-opacity duration-300 ${isSearchFocused ? 'opacity-100' : 'opacity-0'}`} />
            <input
              type="text"
              placeholder="Search series, actors..."
              className="relative w-full bg-navy-800/80 border border-white/10 text-white px-5 py-2.5 pl-11 pr-10 rounded-full focus:outline-none focus:border-purple/50 focus:bg-navy-800 transition-all text-sm placeholder:text-gray-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              onKeyDown={handleSearchKeyDown}
            />
            <Search className="absolute left-4 top-2.5 w-4 h-4 text-gray-500 group-focus-within:text-purple transition-colors z-10" />
            {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-gray-400 hover:text-white transition-colors z-10"><X className="w-4 h-4" /></button>
            )}
            {isSearchFocused && !searchQuery && recentSearches.length > 0 && (
                <div className="absolute top-full left-4 right-4 bg-navy-800/95 backdrop-blur-xl border border-white/10 rounded-xl mt-3 py-2 shadow-2xl overflow-hidden ring-1 ring-black/50" onMouseDown={(e) => e.preventDefault()}>
                    <div className="flex justify-between items-center px-4 py-2 text-[10px] text-gray-500 uppercase font-bold border-b border-white/5 tracking-wider">
                        <span className="flex items-center gap-1.5"><History className="w-3 h-3" /> Recent History</span>
                        <button onClick={clearHistory} className="hover:text-red-400 transition-colors">Clear All</button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                        {recentSearches.map((term, idx) => (
                            <div key={idx} onClick={() => handleRecentClick(term)} className="flex items-center justify-between px-4 py-3 hover:bg-white/5 cursor-pointer text-sm text-gray-300 hover:text-white transition-colors group/item">
                                <span className="flex items-center gap-3"><Clock className="w-3.5 h-3.5 text-purple/50 group-hover/item:text-purple transition-colors" />{term}</span>
                                <button onClick={(e) => deleteRecent(e, term)} className="text-gray-600 hover:text-red-400 p-1.5 rounded-md hover:bg-white/5 opacity-0 group-hover/item:opacity-100 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
          </div>

          <nav className="hidden md:flex items-center gap-2 lg:gap-6">
            {navItems.map((item) => (
              <button key={item.label} onClick={() => onChangeView(item.view)} className={`text-sm font-semibold transition-colors px-3 py-1.5 rounded-full hover:bg-white/5 ${currentView === item.view ? 'text-purple' : 'text-gray-300 hover:text-white'}`}>{item.label}</button>
            ))}
            <div className="h-6 w-px bg-white/10 mx-2" />
            {user ? (
              <>
                <button className="text-gray-300 hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors"><Bell className="w-5 h-5" /></button>
                <button onClick={() => onChangeView('PROFILE')} className={`flex items-center gap-2 px-2 py-1 rounded-full border border-transparent hover:border-purple/30 hover:bg-white/5 transition-all ${currentView === 'PROFILE' ? 'border-purple/50 bg-purple/10 text-purple' : 'text-gray-300'}`}>
                    {user.avatar_url ? (
                        <img src={user.avatar_url} alt="Avatar" className="w-7 h-7 rounded-full object-cover border border-purple/50" />
                    ) : (
                        <div className="w-7 h-7 bg-purple rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-inner">{user.name.charAt(0).toUpperCase()}</div>
                    )}
                    <span className="text-xs font-semibold max-w-[80px] truncate hidden xl:block">{user.name}</span>
                </button>
                {user.role === 'ADMIN' && (
                  <button onClick={() => onChangeView('ADMIN')} className={`text-[10px] font-bold px-2 py-1 bg-navy-800 rounded border border-white/10 hover:bg-navy-700 hover:border-purple/50 transition-all ml-2 ${currentView === 'ADMIN' ? 'border-purple text-purple' : 'text-gray-400'}`}>ADMIN</button>
                )}
                <button onClick={onLogout} title="Logout" className="text-gray-400 hover:text-red-400 transition-colors ml-2 p-2 rounded-full hover:bg-white/5"><LogOut className="w-5 h-5" /></button>
              </>
            ) : (
              <button onClick={() => onChangeView('LOGIN')} className="flex items-center gap-2 bg-white text-navy-900 hover:bg-gray-100 px-5 py-2 rounded-full transition-all text-sm font-bold shadow-lg shadow-white/5">
                <LogIn className="w-4 h-4" />Login
              </button>
            )}
          </nav>
          <button className="md:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden flex flex-col pt-16 animate-in slide-in-from-top-5 duration-200">
            <div className="absolute inset-0 bg-navy-900/95 backdrop-blur-xl" ref={mobileMenuRef} />
            <div className="relative flex-1 overflow-y-auto p-4 space-y-6">
               <div className="relative">
                <input type="text" placeholder="Search..." className="w-full bg-navy-800 border border-white/10 text-white px-10 py-3 rounded-xl focus:outline-none focus:border-purple focus:ring-1 focus:ring-purple/50 transition-all text-base placeholder:text-gray-500" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleSearchKeyDown} autoFocus />
                <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-500" />
                 {searchQuery && (<button onClick={() => setSearchQuery('')} className="absolute right-3 top-3 p-1 text-gray-400 bg-white/5 rounded-full"><X className="w-4 h-4" /></button>)}
                 {!searchQuery && recentSearches.length > 0 && (
                    <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                        <div className="flex justify-between items-center px-1 mb-2">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2"><History className="w-3 h-3" /> Recent Searches</h4>
                            <button onClick={clearHistory} className="text-xs text-red-400 font-medium px-2 py-1 rounded hover:bg-white/5">Clear All</button>
                        </div>
                        <div className="space-y-1">
                            {recentSearches.slice(0, 5).map((term, idx) => (
                                <div key={idx} onClick={() => { handleRecentClick(term); setIsMobileMenuOpen(false); }} className="flex justify-between items-center p-3 bg-navy-800/50 border border-white/5 rounded-lg active:bg-white/10 active:scale-[0.98] transition-all">
                                    <span className="flex items-center gap-3 text-gray-200 text-sm"><Clock className="w-4 h-4 text-purple" /> {term}</span>
                                    <button onClick={(e) => deleteRecent(e, term)} className="p-2 -mr-2 text-gray-500 active:text-red-400"><X className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                 )}
               </div>
              <div className="space-y-1">
                  {navItems.map((item) => (
                    <button key={item.label} onClick={() => { onChangeView(item.view); setIsMobileMenuOpen(false); }} className={`w-full text-left p-4 rounded-xl font-bold text-lg flex justify-between items-center transition-all active:scale-[0.98] ${currentView === item.view ? 'bg-purple text-white shadow-lg shadow-purple/20' : 'bg-navy-800 text-gray-300 hover:bg-navy-700'}`}>
                      {item.label}<ChevronDown className={`w-5 h-5 -rotate-90 ${currentView === item.view ? 'text-white' : 'text-gray-600'}`} />
                    </button>
                  ))}
              </div>
              <div className="pt-4 border-t border-white/10">
                  {user ? (
                    <div className="space-y-3">
                       <button onClick={() => { onChangeView('PROFILE'); setIsMobileMenuOpen(false); }} className="w-full bg-navy-800 p-4 rounded-xl flex items-center gap-4 border border-white/5 active:bg-navy-700 transition-colors">
                         {user.avatar_url ? (<img src={user.avatar_url} alt="Profile" className="w-10 h-10 rounded-full object-cover border border-purple" />) : (<div className="w-10 h-10 rounded-full bg-purple flex items-center justify-center font-bold text-white">{user.name.charAt(0)}</div>)}
                         <div className="text-left"><div className="font-bold text-white">{user.name}</div><div className="text-xs text-gray-400">View Profile</div></div>
                         <ChevronDown className="w-5 h-5 -rotate-90 ml-auto text-gray-500" />
                      </button>
                      <button onClick={() => { onLogout(); setIsMobileMenuOpen(false); }} className="w-full text-center text-red-400 font-semibold py-3 flex items-center justify-center gap-2 hover:bg-white/5 rounded-xl transition-colors"><LogOut className="w-4 h-4" /> Sign Out</button>
                    </div>
                  ) : (
                    <button onClick={() => { onChangeView('LOGIN'); setIsMobileMenuOpen(false); }} className="w-full bg-white text-navy-900 font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform"><LogIn className="w-5 h-5" /> Login / Register</button>
                  )}
              </div>
            </div>
          </div>
      )}

      <main className="flex-grow">{children}</main>

      <footer className="bg-navy-800 pt-16 pb-8 border-t border-white/5 mt-auto">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2 cursor-pointer group" onClick={() => onChangeView('HOME')}>
                {siteConfig.logoUrl ? (
                  <img src={siteConfig.logoUrl} alt="Logo" className="w-6 h-6 object-contain" />
                ) : (
                  <div className="w-6 h-6 bg-purple rounded flex items-center justify-center group-hover:bg-purple-light transition-colors">
                    <PlayCircle className="text-white w-4 h-4" fill="currentColor" />
                  </div>
                )}
                <span className="text-lg font-bold text-white">{siteConfig.siteName}{siteConfig.siteNamePart2}</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">The ultimate destination for Drama enthusiasts. Track your shows and discover the next big hit.</p>
              <div className="flex flex-col gap-2 pt-2">
                <div className="flex items-center gap-3 text-xs text-gray-500"><Mail className="w-3.5 h-3.5 text-purple" /> {siteConfig.contactEmail}</div>
                <div className="flex items-center gap-3 text-xs text-gray-500"><Phone className="w-3.5 h-3.5 text-purple" /> {siteConfig.contactPhone}</div>
                <div className="flex items-center gap-3 text-xs text-gray-500"><MapPin className="w-3.5 h-3.5 text-purple" /> {siteConfig.address}</div>
              </div>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Discover</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-purple transition-colors">Trending Shows</a></li>
                <li><a href="#" className="hover:text-purple transition-colors">New Releases</a></li>
                <li><a href="#" className="hover:text-purple transition-colors">Calendar</a></li>
              </ul>
            </div>
             <div>
              <h3 className="text-white font-bold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-purple transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-purple transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-purple transition-colors">DMCA</a></li>
              </ul>
            </div>
             <div>
              <h3 className="text-white font-bold mb-4">Social Presence</h3>
              <div className="flex gap-4">
                 {Object.entries(siteConfig.socialLinks).map(([name, url]) => url && (
                   <a key={name} href={url} target="_blank" className="p-2 bg-navy-900 rounded-lg hover:bg-purple/20 border border-white/5 transition-colors group">
                     <span className="text-gray-400 group-hover:text-white capitalize text-xs">{name}</span>
                   </a>
                 ))}
              </div>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 text-center text-gray-500 text-sm">© 2024 {siteConfig.siteName}{siteConfig.siteNamePart2} Media. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};