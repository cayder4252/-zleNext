import React, { useState } from 'react';
import { PlayCircle, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { ViewState } from '../types';

interface AuthProps {
  view: 'LOGIN' | 'REGISTER';
  onChangeView: (view: ViewState) => void;
  onLogin: (email: string, name: string, role: 'ADMIN' | 'USER') => void;
}

export const AuthPage: React.FC<AuthProps> = ({ view, onChangeView, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Mock logic: if email contains 'admin', grant admin role
      const role = email.toLowerCase().includes('admin') ? 'ADMIN' : 'USER';
      const displayName = name || email.split('@')[0];
      onLogin(email, displayName, role);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple/20 rounded-full blur-[128px]" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[128px]" />
      </div>

      <div className="w-full max-w-md bg-navy-800 border border-white/10 rounded-2xl shadow-2xl p-8 relative z-10 animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4 cursor-pointer" onClick={() => onChangeView('HOME')}>
             <div className="w-10 h-10 bg-purple rounded-xl flex items-center justify-center shadow-lg shadow-purple/30">
                <PlayCircle className="text-white w-6 h-6" fill="currentColor" />
             </div>
             <span className="text-2xl font-bold tracking-tight text-white">
               İZLE<span className="text-purple">NEXT</span>
             </span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {view === 'LOGIN' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-gray-400 text-sm">
            {view === 'LOGIN' 
              ? 'Enter your credentials to access your account' 
              : 'Join the community of Turkish Drama fans'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {view === 'REGISTER' && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300 ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                <input 
                  type="text" 
                  required
                  placeholder="John Doe"
                  className="w-full bg-navy-900 border border-navy-700 text-white px-4 py-2.5 pl-10 rounded-xl focus:outline-none focus:border-purple focus:ring-1 focus:ring-purple transition-colors"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-300 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input 
                type="email" 
                required
                placeholder="name@example.com"
                className="w-full bg-navy-900 border border-navy-700 text-white px-4 py-2.5 pl-10 rounded-xl focus:outline-none focus:border-purple focus:ring-1 focus:ring-purple transition-colors"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {/* Hint for demo purposes */}
             <p className="text-[10px] text-gray-500 px-1">
               *Hint: Use an email containing "admin" to test Admin features.
             </p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-300 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input 
                type="password" 
                required
                placeholder="••••••••"
                className="w-full bg-navy-900 border border-navy-700 text-white px-4 py-2.5 pl-10 rounded-xl focus:outline-none focus:border-purple focus:ring-1 focus:ring-purple transition-colors"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {view === 'LOGIN' && (
            <div className="flex justify-end">
              <button type="button" className="text-sm text-purple hover:text-purple-light transition-colors">
                Forgot password?
              </button>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-purple hover:bg-purple-dark text-white font-bold py-3 rounded-xl shadow-lg shadow-purple/25 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
                <>
                    {view === 'LOGIN' ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="w-4 h-4" />
                </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            {view === 'LOGIN' ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => onChangeView(view === 'LOGIN' ? 'REGISTER' : 'LOGIN')}
              className="text-purple font-bold hover:underline"
            >
              {view === 'LOGIN' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};