import React, { useState } from 'react';
import { Search, Bell, User as UserIcon, Menu, X, PlayCircle, LogOut, LogIn } from 'lucide-react';
import { ViewState, User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  user: User | null;
  onLogout: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentView, 
  onChangeView, 
  user, 
  onLogout,
  searchQuery,
  setSearchQuery
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: { label: string; view: ViewState }[] = [
    { label: 'Home', view: 'HOME' },
    { label: 'Ratings', view: 'RATINGS' },
    { label: 'Calendar', view: 'CALENDAR' },
  ];

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-navy-900/95 backdrop-blur-sm border-b border-white/10 shadow-lg">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo / Homepage Button */}
          <div 
            className="flex items-center gap-2 cursor-pointer group" 
            onClick={() => onChangeView('HOME')}
            title="Go to Homepage"
          >
            <div className="w-8 h-8 bg-purple rounded-lg flex items-center justify-center group-hover:bg-purple-light transition-colors shadow-lg shadow-purple/20">
              <PlayCircle className="text-white w-5 h-5" fill="currentColor" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-gray-100 transition-colors">
              İZLE<span className="text-purple group-hover:text-purple-light">NEXT</span>
            </span>
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