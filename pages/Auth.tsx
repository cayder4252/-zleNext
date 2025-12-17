import React, { useState } from 'react';
import { PlayCircle, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { ViewState } from '../types';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

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
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      let userCredential;
      const role = email.toLowerCase().includes('admin') ? 'ADMIN' : 'USER';

      if (view === 'REGISTER') {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Update Display Name
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName: name });
        }

        // Create User Document in Firestore for Stats
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          name: name,
          email: email,
          role: role,
          createdAt: new Date().toISOString(),
          watchlist: []
        });

      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Ensure Firestore document exists
        const userDocRef = doc(db, 'users', userCredential.user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
             // Create it if missing (recovery for existing auth users without docs)
             const displayName = userCredential.user.displayName || email.split('@')[0];
             await setDoc(userDocRef, {
                 uid: userCredential.user.uid,
                 name: displayName,
                 email: email,
                 role: role,
                 createdAt: new Date().toISOString(),
                 watchlist: []
             }, { merge: true });
        }
      }

      // Success
      const displayName = userCredential.user.displayName || name || email.split('@')[0];
      onLogin(email, displayName, role);

    } catch (err: any) {
      console.error("Auth Error:", err);
      setError(err.message || "An authentication error occurred.");
    } finally {
      setIsLoading(false);
    }
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
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

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