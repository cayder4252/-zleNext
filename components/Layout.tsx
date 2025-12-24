
import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, Bell, User as UserIcon, Menu, X, PlayCircle, LogOut, LogIn, 
  ChevronDown, Zap, Rocket, Calendar, Newspaper, Activity, AlertCircle, 
  Heart, Clock, Trash2, History, Mail, Phone, MapPin, Globe, Film, Tv, 
  Flame, Ghost, Smile, Swords, Skull, Star, Monitor, Play, Clapperboard
} from 'lucide-react';
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
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(() => settingsService.getCachedConfig());
  const [logoError, setLogoError] = useState(false);
  
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
      setLogoError(false); 
      
      document.title = `${config.siteName}${config.siteNamePart2} - Every Story, Tracked.`;
      
      const favicon = document.getElementById('dynamic-favicon') as HTMLLinkElement;
      if (favicon && config.logoUrl) {
        favicon.href = config.logoUrl;
      }
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

  const GLOBAL_NATIONS = [
      { name: 'Turkish Dizi', country: 'TR', flag: '🇹🇷' },
      { name: 'K-Drama Wave', country: 'KR', flag: '🇰🇷' },
      { name: 'Bollywood (India)', country: 'IN', flag: '🇮🇳' },
      { name: 'Pinoy (Philippines)', country: 'PH', flag: '🇵🇭' },
      { name: 'C-Drama (China)', country: 'CN', flag: '🇨🇳' },
      { name: 'J-Drama (Japan)', country: 'JP', flag: '🇯🇵' },
  ];

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col font-sans">
      <header className="sticky top-0 z-50 bg-navy-900/90 backdrop-blur-md border-b border-white/10 shadow-lg">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-4 lg:gap-8">
              <div className="flex items-center gap-2 cursor-pointer group select-none" onClick={() => onChangeView('HOME')}>
                {siteConfig.logoUrl && !logoError ? (
                  <img 
                    src={siteConfig.logoUrl} 
                    alt="Logo" 
                    className="h-8 w-auto object-contain shadow-lg" 
                    onError={() => setLogoError(true)}
                  />
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
                      <div className="absolute top-full left-0 mt-4 w-[85vw] max-w-[1000px] bg-navy-800/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 grid grid-cols-4 gap-10 animate-in fade-in slide-in-from-top-2 z-50 ring-1 ring-black/50">
                          {/* Col 1: Discovery */}
                          <div className="space-y-6">
                              <h3 className="text-purple font-black border-l-4 border-purple pl-3 mb-6 inline-block text-[11px] uppercase tracking-[0.2em]">TV Shows</h3>
                              <ul className="space-y-4">
                                  <li onClick={() => handleCategoryClick('Trending TV', 'trending/tv/day', '')} className="flex items-center gap-3 text-gray-300 hover:text-white cursor-pointer group">
                                      <Zap className="w-4 h-4 text-yellow-500 group-hover:scale-110 transition-transform" />
                                      <span className="text-sm font-bold group-hover:translate-x-1 transition-transform">Trending TV Shows</span>
                                  </li>
                                  <li onClick={() => handleCategoryClick('Most Popular TV', 'tv/popular', '')} className="flex items-center gap-3 text-gray-300 hover:text-white cursor-pointer group">
                                      <Rocket className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
                                      <span className="text-sm font-bold group-hover:translate-x-1 transition-transform">Most Popular TV Shows</span>
                                  </li>
                                  <li onClick={() => handleCategoryClick('Newest TV Shows', 'tv/on_the_air', '')} className="flex items-center gap-3 text-gray-300 hover:text-white cursor-pointer group">
                                      <Flame className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
                                      <span className="text-sm font-bold group-hover:translate-x-1 transition-transform">Newest TV Shows</span>
                                  </li>
                                  <li onClick={() => handleCategoryClick('Upcoming TV', 'tv/airing_today', '')} className="flex items-center gap-3 text-gray-300 hover:text-white cursor-pointer group">
                                      <Calendar className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                                      <span className="text-sm font-bold group-hover:translate-x-1 transition-transform">Upcoming TV Shows</span>
                                  </li>
                              </ul>
                              <div className="h-px bg-white/5 my-4" />
                              <button onClick={() => handleCategoryClick('Explore All Shows', 'discover/tv', 'sort_by=popularity.desc')} className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black py-4 rounded-xl mt-2 transition-all shadow-lg shadow-red-900/20 text-[10px] tracking-[0.2em] uppercase">
                                  EXPLORE SHOWS
                              </button>
                          </div>

                          {/* Col 2: Global Nations */}
                          <div className="space-y-6 border-x border-white/5 px-6">
                              <h3 className="text-purple font-black border-l-4 border-purple pl-3 mb-6 inline-block text-[11px] uppercase tracking-[0.2em]">Global Hubs</h3>
                              <ul className="space-y-3">
                                  {GLOBAL_NATIONS.map(nation => (
                                      <li key={nation.country} onClick={() => handleCategoryClick(nation.name, 'discover/tv', `with_origin_country=${nation.country}&sort_by=popularity.desc`)} className="flex items-center justify-between text-gray-400 hover:text-white cursor-pointer text-sm font-bold transition-all hover:translate-x-1 group">
                                          <div className="flex items-center gap-3">
                                              <span className="text-lg opacity-80 group-hover:opacity-100 filter grayscale group-hover:grayscale-0 transition-all">{nation.flag}</span>
                                              <span>{nation.name}</span>
                                          </div>
                                          <ChevronDown className="w-3 h-3 -rotate-90 opacity-0 group-hover:opacity-50" />
                                      </li>
                                  ))}
                              </ul>
                              <div className="h-px bg-white/5 my-4" />
                              <li onClick={() => handleCategoryClick('Filipino Cinema', 'discover/movie', 'with_origin_country=PH&sort_by=popularity.desc')} className="flex items-center gap-3 text-gray-400 hover:text-white cursor-pointer text-sm font-bold group">
                                  <Clapperboard className="w-4 h-4 text-purple" />
                                  <span>Pinoy Movies</span>
                              </li>
                          </div>

                          {/* Col 3: Specials & Adult */}
                          <div className="space-y-6">
                              <h3 className="text-purple font-black border-l-4 border-purple pl-3 mb-6 inline-block text-[11px] uppercase tracking-[0.2em]">Specials</h3>
                              <ul className="space-y-4">
                                  <li onClick={() => handleCategoryClick('Anime Collection', 'discover/tv', 'with_genres=16&sort_by=popularity.desc')} className="flex items-center gap-3 text-gray-300 hover:text-white cursor-pointer group">
                                      <div className="w-8 h-8 bg-pink-500/10 rounded-lg flex items-center justify-center group-hover:bg-pink-500/30 transition-colors border border-pink-500/20">
                                          <Smile className="w-4 h-4 text-pink-500" />
                                      </div>
                                      <div className="flex flex-col">
                                          <span className="text-sm font-bold">Anime Library</span>
                                          <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Global Animation</span>
                                      </div>
                                  </li>
                                  <li onClick={() => handleCategoryClick('Adult Series', 'discover/tv', 'include_adult=true&sort_by=popularity.desc')} className="flex items-center gap-3 text-gray-300 hover:text-white cursor-pointer group">
                                      <div className="w-8 h-8 bg-red-600/10 rounded-lg flex items-center justify-center group-hover:bg-red-600/30 transition-colors border border-red-600/20">
                                          <Skull className="w-4 h-4 text-red-600" />
                                      </div>
                                      <div className="flex flex-col">
                                          <span className="text-sm font-bold">Adult Content</span>
                                          <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Restricted 18+</span>
                                      </div>
                                  </li>
                                  <li onClick={() => handleCategoryClick('Top Bollywood', 'discover/movie', 'with_original_language=hi&sort_by=popularity.desc')} className="flex items-center gap-3 text-gray-300 hover:text-white cursor-pointer group">
                                      <div className="w-8 h-8 bg-yellow-500/10 rounded-lg flex items-center justify-center group-hover:bg-yellow-500/30 transition-colors border border-yellow-500/20">
                                          <Star className="w-4 h-4 text-yellow-500" />
                                      </div>
                                      <div className="flex flex-col">
                                          <span className="text-sm font-bold">Bollywood Hits</span>
                                          <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Hindi Cinema</span>
                                      </div>
                                  </li>
                              </ul>
                          </div>

                          {/* Col 4: Links */}
                          <div className="border-l border-white/5 pl-10">
                              <h3 className="text-purple font-black border-l-4 border-purple pl-3 mb-6 inline-block text-[11px] uppercase tracking-[0.2em]">Quick Links</h3>
                              <ul className="space-y-4">
                                  <li onClick={() => handleCategoryClick('Curated For You', 'tv/top_rated', '')} className="flex items-center gap-3 text-gray-400 hover:text-white cursor-pointer text-sm group font-bold">
                                      <Heart className="w-4 h-4 text-pink-500" />
                                      <span>Curated For You</span>
                                  </li>
                                  <li onClick={() => handleCategoryClick('Cancellation Buzz', 'discover/tv', 'vote_average.lte=6&sort_by=popularity.desc')} className="flex items-center gap-3 text-gray-400 hover:text-white cursor-pointer text-sm group font-bold">
                                      <AlertCircle className="w-4 h-4 text-orange-500" />
                                      <span>Cancellation Buzz</span>
                                  </li>
                              </ul>
                              
                              <div className="mt-12 space-y-4">
                                  <div className="flex items-center gap-4">
                                      <div className="w-1 h-6 bg-purple rounded-full" />
                                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Connect</span>
                                  </div>
                                  <div className="flex gap-3">
                                      {['twitter', 'instagram', 'facebook', 'youtube'].map(social => (
                                        siteConfig.socialLinks[social as keyof typeof siteConfig.socialLinks] && (
                                          <a key={social} href={siteConfig.socialLinks[social as keyof typeof siteConfig.socialLinks]} target="_blank" className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center cursor-pointer transition-all text-xs font-black text-gray-400 hover:text-white border border-white/5 hover:border-purple/30 group">
                                              <div className="group-hover:scale-110 transition-transform">{social.charAt(0).toUpperCase()}</div>
                                          </a>
                                        )
                                      ))}
                                  </div>
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
              className="relative w-full bg-navy-800/80 border border-white/10 text-white px-5 py-2.5 pl-11 pr-10 rounded-full focus:outline-none focus:border-purple/50 focus:bg-navy-800 transition-all text-sm placeholder:text-gray-500 font-medium"
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
                    <div className="flex justify-between items-center px-4 py-2 text-[10px] text-gray-500 uppercase font-black border-b border-white/5 tracking-wider">
                        <span className="flex items-center gap-1.5"><History className="w-3 h-3" /> Recent History</span>
                        <button onClick={clearHistory} className="hover:text-red-400 transition-colors">Clear All</button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                        {recentSearches.map((term, idx) => (
                            <div key={idx} onClick={() => handleRecentClick(term)} className="flex items-center justify-between px-4 py-3 hover:bg-white/5 cursor-pointer text-sm text-gray-300 hover:text-white transition-colors group/item font-medium">
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
              <button key={item.label} onClick={() => onChangeView(item.view)} className={`text-xs font-black uppercase tracking-widest transition-all px-4 py-2 rounded-full hover:bg-white/5 ${currentView === item.view ? 'text-purple bg-purple/5' : 'text-gray-400 hover:text-white'}`}>{item.label}</button>
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
                    <span className="text-xs font-bold max-w-[80px] truncate hidden xl:block">{user.name}</span>
                </button>
                {user.role === 'ADMIN' && (
                  <button onClick={() => onChangeView('ADMIN')} className={`text-[9px] font-black tracking-widest px-2 py-1 bg-navy-800 rounded border border-white/10 hover:bg-navy-700 hover:border-purple/50 transition-all ml-2 uppercase ${currentView === 'ADMIN' ? 'border-purple text-purple' : 'text-gray-400'}`}>ADMIN</button>
                )}
                <button onClick={onLogout} title="Logout" className="text-gray-400 hover:text-red-400 transition-colors ml-2 p-2 rounded-full hover:bg-white/5"><LogOut className="w-5 h-5" /></button>
              </>
            ) : (
              <button onClick={() => onChangeView('LOGIN')} className="flex items-center gap-2 bg-white text-navy-900 hover:bg-gray-100 px-6 py-2.5 rounded-full transition-all text-xs font-black uppercase tracking-widest shadow-lg shadow-white/5">
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
                <input type="text" placeholder="Search..." className="w-full bg-navy-800 border border-white/10 text-white px-10 py-3 rounded-xl focus:outline-none focus:border-purple focus:ring-1 focus:ring-purple/50 transition-all text-base placeholder:text-gray-500 font-medium" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleSearchKeyDown} autoFocus />
                <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-500" />
                 {searchQuery && (<button onClick={() => setSearchQuery('')} className="absolute right-3 top-3 p-1 text-gray-400 bg-white/5 rounded-full"><X className="w-4 h-4" /></button>)}
                 {!searchQuery && recentSearches.length > 0 && (
                    <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                        <div className="flex justify-between items-center px-1 mb-2">
                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><History className="w-3 h-3" /> Recent Searches</h4>
                            <button onClick={clearHistory} className="text-xs text-red-400 font-medium px-2 py-1 rounded hover:bg-white/5">Clear All</button>
                        </div>
                        <div className="space-y-1">
                            {recentSearches.slice(0, 5).map((term, idx) => (
                                <div key={idx} onClick={() => { handleRecentClick(term); setIsMobileMenuOpen(false); }} className="flex justify-between items-center p-3 bg-navy-800/50 border border-white/5 rounded-lg active:bg-white/10 active:scale-[0.98] transition-all">
                                    <span className="flex items-center gap-3 text-gray-200 text-sm font-medium"><Clock className="w-4 h-4 text-purple" /> {term}</span>
                                    <button onClick={(e) => deleteRecent(e, term)} className="p-2 -mr-2 text-gray-500 active:text-red-400"><X className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                 )}
               </div>
              <div className="space-y-1">
                  {navItems.map((item) => (
                    <button key={item.label} onClick={() => { onChangeView(item.view); setIsMobileMenuOpen(false); }} className={`w-full text-left p-4 rounded-xl font-black text-lg flex justify-between items-center transition-all active:scale-[0.98] uppercase tracking-tighter ${currentView === item.view ? 'bg-purple text-white shadow-lg shadow-purple/20' : 'bg-navy-800 text-gray-300 hover:bg-navy-700'}`}>
                      {item.label}<ChevronDown className={`w-5 h-5 -rotate-90 ${currentView === item.view ? 'text-white' : 'text-gray-600'}`} />
                    </button>
                  ))}
              </div>
              <div className="pt-4 border-t border-white/10">
                  {user ? (
                    <div className="space-y-3">
                       <button onClick={() => { onChangeView('PROFILE'); setIsMobileMenuOpen(false); }} className="w-full bg-navy-800 p-4 rounded-xl flex items-center gap-4 border border-white/5 active:bg-navy-700 transition-colors">
                         {user.avatar_url ? (<img src={user.avatar_url} alt="Profile" className="w-10 h-10 rounded-full object-cover border border-purple" />) : (<div className="w-10 h-10 rounded-full bg-purple flex items-center justify-center font-bold text-white">{user.name.charAt(0)}</div>)}
                         <div className="text-left"><div className="font-black text-white uppercase">{user.name}</div><div className="text-[10px] text-gray-400 uppercase tracking-widest">View Profile</div></div>
                         <ChevronDown className="w-5 h-5 -rotate-90 ml-auto text-gray-500" />
                      </button>
                      <button onClick={() => { onLogout(); setIsMobileMenuOpen(false); }} className="w-full text-center text-red-400 font-black py-3 flex items-center justify-center gap-2 hover:bg-white/5 rounded-xl transition-all uppercase text-xs tracking-[0.2em]"><LogOut className="w-4 h-4" /> Sign Out</button>
                    </div>
                  ) : (
                    <button onClick={() => { onChangeView('LOGIN'); setIsMobileMenuOpen(false); }} className="w-full bg-white text-navy-900 font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform uppercase text-xs tracking-[0.2em]"><LogIn className="w-5 h-5" /> Login / Register</button>
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
                {siteConfig.logoUrl && !logoError ? (
                  <img 
                    src={siteConfig.logoUrl} 
                    alt="Logo" 
                    className="h-8 w-auto object-contain" 
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div className="w-6 h-6 bg-purple rounded flex items-center justify-center group-hover:bg-purple-light transition-colors">
                    <PlayCircle className="text-white w-4 h-4" fill="currentColor" />
                  </div>
                )}
                <span className="text-lg font-black text-white uppercase tracking-tighter">{siteConfig.siteName}{siteConfig.siteNamePart2}</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed font-medium">The ultimate destination for Drama enthusiasts. Track your shows and discover the next big hit.</p>
              <div className="flex flex-col gap-2 pt-2">
                <div className="flex items-center gap-3 text-[10px] font-black text-gray-500 uppercase tracking-widest"><Mail className="w-3.5 h-3.5 text-purple" /> {siteConfig.contactEmail}</div>
                <div className="flex items-center gap-3 text-[10px] font-black text-gray-500 uppercase tracking-widest"><Phone className="w-3.5 h-3.5 text-purple" /> {siteConfig.contactPhone}</div>
                <div className="flex items-center gap-3 text-[10px] font-black text-gray-500 uppercase tracking-widest"><MapPin className="w-3.5 h-3.5 text-purple" /> {siteConfig.address}</div>
              </div>
            </div>
            <div>
              <h3 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-6">Discover</h3>
              <ul className="space-y-3 text-sm text-gray-400 font-medium">
                <li><a href="#" className="hover:text-purple transition-colors">Trending Shows</a></li>
                <li><a href="#" className="hover:text-purple transition-colors">New Releases</a></li>
                <li><a href="#" className="hover:text-purple transition-colors">Calendar</a></li>
              </ul>
            </div>
             <div>
              <h3 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-6">Legal</h3>
              <ul className="space-y-3 text-sm text-gray-400 font-medium">
                <li><a href="#" className="hover:text-purple transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-purple transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-purple transition-colors">DMCA</a></li>
              </ul>
            </div>
             <div>
              <h3 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-6">Social</h3>
              <div className="flex flex-wrap gap-3">
                 {Object.entries(siteConfig.socialLinks).map(([name, url]) => url && (
                   <a key={name} href={url} target="_blank" className="px-4 py-2 bg-navy-900 rounded-xl hover:bg-purple/20 border border-white/5 transition-all group">
                     <span className="text-gray-400 group-hover:text-white capitalize text-[10px] font-black uppercase tracking-widest">{name}</span>
                   </a>
                 ))}
              </div>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 text-center text-gray-500 text-[10px] font-black uppercase tracking-[0.4em]">© 2025 {siteConfig.siteName}{siteConfig.siteNamePart2} Media. Every Story, Tracked.</div>
        </div>
      </footer>
    </div>
  );
};
