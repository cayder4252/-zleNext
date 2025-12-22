
import React, { useState, useEffect } from 'react';
import { Series, Actor, Episode, Review, User } from '../types';
import { tmdb } from '../services/tmdb';
import { omdb } from '../services/omdb';
import { moviesDatabase } from '../services/moviesDatabase'; // Imported the new service
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, query, orderBy, doc, updateDoc, increment } from 'firebase/firestore';
import { StreamingAvailability } from './StreamingAvailability';
import { 
  Play, 
  Plus, 
  Check, 
  Facebook, 
  Instagram, 
  Youtube, 
  Link as LinkIcon, 
  Calendar, 
  Clock, 
  Star, 
  Share2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Eye,
  User as UserIcon,
  MessageSquare,
  Trophy,
  Film,
  PenTool,
  X,
  ThumbsUp,
  ThumbsDown,
  Send,
  Loader2,
  PlayCircle,
  Database // Added for API source visualization
} from 'lucide-react';

interface SeriesDetailProps {
  series: Series;
  cast: Actor[];
  onAddToWatchlist: (id: string) => void;
  isInWatchlist: boolean;
  user: User | null;
}

export const SeriesDetail: React.FC<SeriesDetailProps> = ({ series, cast, onAddToWatchlist, isInWatchlist, user }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'EPISODES' | 'CAST' | 'REVIEWS'>('OVERVIEW');
  const [expandedSeason, setExpandedSeason] = useState<number | null>(null);
  const [seasonEpisodes, setSeasonEpisodes] = useState<Record<number, Episode[]>>({});
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [isPlayingTrailer, setIsPlayingTrailer] = useState(false);
  
  // Community Review State
  const [communityReviews, setCommunityReviews] = useState<Review[]>([]);
  const [isLoadingCommunityReviews, setIsLoadingCommunityReviews] = useState(true);
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(10);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // External Data State
  const [enrichedData, setEnrichedData] = useState<Partial<Series>>({});
  const [moviesDbActors, setMoviesDbActors] = useState<any[]>([]);

  useEffect(() => {
    setIsPlayingTrailer(false);
    setEnrichedData({}); 
    setMoviesDbActors([]);

    const fetchExternalData = async () => {
        if (series.imdb_id) {
            // 1. OMDb Enrichment
            if (!series.awards || !series.director || !series.metascore) {
                const data = await omdb.getDetails(series.imdb_id);
                if (data) setEnrichedData(data);
            }
            
            // 2. MoviesDatabase (RapidAPI) Test/Fetch
            try {
                const actors = await moviesDatabase.getMainActors(series.imdb_id);
                if (actors) {
                    console.log("MoviesDatabase Actors Received:", actors);
                    setMoviesDbActors(actors);
                }
            } catch (e) {
                console.warn("MoviesDatabase integration check failed:", e);
            }
        }
    };

    fetchExternalData();

    setIsLoadingCommunityReviews(true);
    const reviewsRef = collection(db, 'series', series.id, 'reviews');
    const q = query(reviewsRef, orderBy('created_at', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
        setCommunityReviews(reviews);
        setIsLoadingCommunityReviews(false);
    }, (error) => {
        console.error("Firestore reviews fetch error", error);
        setIsLoadingCommunityReviews(false);
    });

    return () => unsubscribe();
  }, [series.id, series.imdb_id]);

  const getField = <K extends keyof Series>(key: K): Series[K] | undefined => {
      return series[key] || (enrichedData[key] as Series[K]);
  };

  const toggleSeason = async (seasonNumber: number) => {
      if (expandedSeason === seasonNumber) {
          setExpandedSeason(null);
          return;
      }
      setExpandedSeason(seasonNumber);
      if (!seasonEpisodes[seasonNumber]) {
          setLoadingEpisodes(true);
          const eps = await tmdb.getSeasonDetails(series.id, seasonNumber);
          setSeasonEpisodes(prev => ({...prev, [seasonNumber]: eps}));
          setLoadingEpisodes(false);
      }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || !newReviewText.trim()) return;
      setIsSubmittingReview(true);
      try {
          const reviewsRef = collection(db, 'series', series.id, 'reviews');
          await addDoc(reviewsRef, {
              author: user.name,
              userId: user.id,
              content: newReviewText,
              rating: newReviewRating,
              avatar_path: user.avatar_url || null,
              created_at: new Date().toISOString(),
              likes: 0,
              dislikes: 0,
              votedBy: {}
          });
          setNewReviewText('');
          setNewReviewRating(10);
      } catch (err) {
          console.error("Failed to post review:", err);
      } finally {
          setIsSubmittingReview(false);
      }
  };

  const handleVote = async (reviewId: string, type: 'like' | 'dislike') => {
      if (!user) return;
      const review = communityReviews.find(r => r.id === reviewId);
      if (!review) return;
      const userVote = review.votedBy?.[user.id];
      const reviewRef = doc(db, 'series', series.id, 'reviews', reviewId);
      const updates: any = {};
      if (userVote === type) {
          updates[`votedBy.${user.id}`] = null;
          updates[type === 'like' ? 'likes' : 'dislikes'] = increment(-1);
      } else {
          if (userVote) updates[userVote === 'like' ? 'likes' : 'dislikes'] = increment(-1);
          updates[`votedBy.${user.id}`] = type;
          updates[type === 'like' ? 'likes' : 'dislikes'] = increment(1);
      }
      try { await updateDoc(reviewRef, updates); } catch (err) {}
  };

  const metascore = getField('metascore');
  const awards = getField('awards');
  const director = getField('director');
  const writer = getField('writer');
  const imdbRating = getField('imdb_rating');

  const allReviews = [...communityReviews, ...(series.reviews || [])];

  return (
    <div className="bg-navy-900 min-h-screen pb-12">
      <div className="relative w-full h-[400px] md:h-[500px]">
        <div className="absolute inset-0">
            <img src={series.banner_url} alt="Banner" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-navy-900 via-navy-900/40 to-transparent" />
        </div>
        <div className="container mx-auto px-4 h-full relative z-10 flex flex-col justify-end pb-8">
            <div className="flex flex-col md:flex-row gap-8 items-end">
                <div className="hidden md:block w-48 lg:w-64 flex-shrink-0 -mb-16 rounded-lg overflow-hidden shadow-2xl border-4 border-navy-800">
                    <img src={series.poster_url} alt={series.title_tr} className="w-full h-auto" />
                </div>
                <div className="flex-1 space-y-4 mb-4">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                        <div className="flex items-center gap-1 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
                            <Star className="w-3 h-3 fill-current" />
                            {series.rating.toFixed(1)}/10
                        </div>
                        {imdbRating && (
                            <div className="flex items-center gap-1 bg-[#F5C518] text-black px-2 py-1 rounded text-xs font-bold">
                                <span className="font-black">IMDb</span>
                                {imdbRating}
                            </div>
                        )}
                        {moviesDbActors.length > 0 && (
                            <div className="flex items-center gap-1 bg-purple text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-purple/20">
                                <Database className="w-3 h-3" /> MDB Verified
                            </div>
                        )}
                    </div>
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white leading-none mb-2">{series.title_tr}</h1>
                        <h2 className="text-xl text-gray-400 font-serif italic">{series.title_en}</h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300 font-medium">
                        <span>{series.release_year || 'Unknown'}</span>
                        <span className="w-1 h-1 bg-gray-500 rounded-full" />
                        <span>{series.status}</span>
                        <span className="w-1 h-1 bg-gray-500 rounded-full" />
                        <span className="text-white border-b border-white/30">{series.network}</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="border-b border-white/10 bg-navy-900 sticky top-16 z-30 shadow-lg">
          <div className="container mx-auto px-4 pl-0 md:pl-[300px]"> 
              <nav className="flex overflow-x-auto no-scrollbar gap-8 text-sm font-bold">
                  {(['OVERVIEW', 'EPISODES', 'CAST', 'REVIEWS'] as const).map((tab) => (
                      <button key={tab} onClick={() => setActiveTab(tab)} className={`py-4 border-b-2 whitespace-nowrap transition-colors ${activeTab === tab ? 'border-red-600 text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>
                          {tab}
                      </button>
                  ))}
              </nav>
          </div>
      </div>

      <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1 space-y-10 min-h-[500px]">
                  {activeTab === 'OVERVIEW' && (
                    <div className="animate-in fade-in duration-300 space-y-10">
                        <section>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-1 h-6 bg-red-600 rounded-full" />
                                <h3 className="text-white font-bold text-lg">Synopsis</h3>
                            </div>
                            <p className="text-gray-300 leading-relaxed text-sm md:text-base">{series.synopsis}</p>
                        </section>
                        {awards && (
                             <section className="bg-navy-800/50 p-6 rounded-xl border border-white/10 flex items-start gap-5">
                                <Trophy className="w-10 h-10 text-[#F5C518] flex-shrink-0" />
                                <div>
                                    <h4 className="text-[#F5C518] font-bold text-xs uppercase tracking-widest mb-1">Awards</h4>
                                    <p className="text-white font-medium text-sm leading-snug">{awards}</p>
                                </div>
                             </section>
                        )}
                    </div>
                  )}

                  {activeTab === 'EPISODES' && (
                      <div className="animate-in fade-in duration-300 space-y-6">
                           <div className="flex items-center gap-2 mb-4">
                                <div className="w-1 h-6 bg-red-600 rounded-full" />
                                <h3 className="text-white font-bold text-lg">Seasons</h3>
                           </div>
                           {series.seasons?.map((season) => (
                               <div key={season.id} className="bg-navy-800 rounded-xl overflow-hidden border border-white/5">
                                    <div onClick={() => toggleSeason(season.season_number)} className="flex flex-col sm:flex-row cursor-pointer hover:bg-navy-750">
                                        <div className="w-full sm:w-32 aspect-[2/3] sm:aspect-auto"><img src={season.poster_path || series.poster_url} className="w-full h-full object-cover" /></div>
                                        <div className="p-5 flex-1 flex flex-col justify-center">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="text-xl font-bold text-white mb-1">{season.name}</h4>
                                                    <div className="bg-white/5 p-2 rounded-full">{expandedSeason === season.season_number ? <ChevronUp className="w-5 h-5 text-purple" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}</div>
                                                </div>
                                                <p className="text-gray-400 text-sm">{season.overview}</p>
                                        </div>
                                    </div>
                                    {expandedSeason === season.season_number && (
                                        <div className="border-t border-white/5 bg-navy-900/50 p-4">
                                            {(seasonEpisodes[season.season_number] || []).map((ep) => (
                                                <div key={ep.id} className="flex gap-4 p-3 rounded hover:bg-white/5 items-center">
                                                    <div className="w-32 aspect-video bg-navy-800 rounded overflow-hidden">
                                                        {ep.still_path ? <img src={ep.still_path} className="w-full h-full object-cover" /> : <Film className="w-full h-full p-6 opacity-10" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h5 className="font-bold text-white truncate text-sm"><span className="text-purple mr-2">{ep.episode_number}.</span>{ep.name}</h5>
                                                        <p className="text-gray-400 text-xs line-clamp-1">{ep.overview}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                               </div>
                           ))}
                      </div>
                  )}

                  {activeTab === 'CAST' && (
                      <div className="animate-in fade-in duration-300 space-y-6">
                           <div className="flex items-center gap-2 mb-4">
                                <div className="w-1 h-6 bg-red-600 rounded-full" />
                                <h3 className="text-white font-bold text-lg">Cast & Metadata</h3>
                           </div>
                           
                           {/* Display source badge if MoviesDatabase responded */}
                           {moviesDbActors.length > 0 && (
                               <div className="bg-purple/10 border border-purple/20 p-4 rounded-xl flex items-center justify-between mb-4">
                                   <div className="flex items-center gap-3">
                                       <Database className="w-5 h-5 text-purple" />
                                       <span className="text-sm font-bold text-gray-300">Verified Actor Data via MoviesDatabase API</span>
                                   </div>
                               </div>
                           )}

                           <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                               {cast.map((actor) => (
                                   <div key={actor.id} className="bg-navy-800 rounded-lg overflow-hidden border border-white/5">
                                       <div className="aspect-[2/3] overflow-hidden"><img src={actor.photo_url} className="w-full h-full object-cover" /></div>
                                       <div className="p-3">
                                           <div className="text-sm font-bold text-white truncate">{actor.name}</div>
                                           <div className="text-xs text-gray-400 truncate">{actor.character_name}</div>
                                       </div>
                                   </div>
                               ))}
                           </div>
                      </div>
                  )}

                  {activeTab === 'REVIEWS' && (
                      <div className="animate-in fade-in duration-300 space-y-10">
                          <section>
                              <div className="flex items-center gap-2 mb-6">
                                    <div className="w-1 h-6 bg-purple rounded-full shadow-lg" />
                                    <h3 className="text-white font-black text-lg uppercase">Community Pulse</h3>
                              </div>
                              {user ? (
                                  <div className="bg-navy-800/50 p-6 rounded-2xl border border-white/5">
                                      <form onSubmit={handleSubmitReview} className="space-y-4">
                                          <textarea 
                                              value={newReviewText}
                                              onChange={(e) => setNewReviewText(e.target.value)}
                                              placeholder="Share your thoughts..."
                                              className="w-full bg-navy-900 border border-white/5 text-white px-5 py-4 rounded-xl text-sm resize-none"
                                              rows={4}
                                          />
                                          <div className="flex justify-between items-center">
                                              <div className="flex gap-0.5">
                                                  {[1,2,3,4,5,6,7,8,9,10].map(num => (
                                                      <button key={num} type="button" onClick={() => setNewReviewRating(num)} className={`w-6 h-6 rounded text-[10px] font-black ${newReviewRating >= num ? 'bg-purple text-white' : 'bg-white/5 text-gray-500'}`}>{num}</button>
                                                  ))}
                                              </div>
                                              <button disabled={isSubmittingReview || !newReviewText.trim()} className="bg-purple text-white px-8 py-2.5 rounded-xl font-black text-xs uppercase flex items-center gap-2">
                                                  {isSubmittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Post</>}
                                              </button>
                                          </div>
                                      </form>
                                  </div>
                              ) : <div className="text-center p-10 bg-navy-800/30 rounded-2xl border border-white/5 border-dashed"><p className="text-gray-500 text-sm">Sign in to share your review.</p></div>}
                          </section>
                          <div className="space-y-6">
                            {allReviews.map((review) => (
                                <div key={review.id} className="bg-navy-800/40 p-8 rounded-[2.5rem] border border-white/5">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-purple flex items-center justify-center text-white font-black">{review.author.charAt(0)}</div>
                                            <div>
                                                <div className="font-black text-white uppercase text-base">{review.author}</div>
                                                <div className="text-[10px] text-gray-500 uppercase">{new Date(review.created_at).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        {review.rating && <div className="bg-navy-900 border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2"><Star className="w-4 h-4 text-yellow-500 fill-current" /><span className="text-white font-black text-lg">{review.rating}</span></div>}
                                    </div>
                                    <div className="text-gray-300 text-sm leading-relaxed">{review.content}</div>
                                </div>
                            ))}
                          </div>
                      </div>
                  )}
              </div>
              <div className="w-full lg:w-[320px] space-y-8">
                  <div className="grid grid-cols-3 gap-4">
                      <button className="flex flex-col items-center gap-2 group"><div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg"><Share2 className="w-5 h-5" /></div><span className="text-[10px] font-bold text-gray-300 uppercase">Share</span></button>
                      <button onClick={() => onAddToWatchlist(series.id)} className="flex flex-col items-center gap-2 group"><div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg ${isInWatchlist ? 'bg-green-600' : 'bg-gray-700'}`}>{isInWatchlist ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}</div><span className="text-[10px] font-bold text-gray-300 uppercase">Watchlist</span></button>
                      <button className="flex flex-col items-center gap-2 group"><div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-white shadow-lg"><Eye className="w-5 h-5" /></div><span className="text-[10px] font-bold text-gray-300 uppercase">Track</span></button>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-2xl">
                       <h3 className="text-navy-900 font-black border-l-4 border-red-600 pl-3 mb-6 uppercase">VITAL DATA</h3>
                       <div className="space-y-4 text-sm">
                           <InfoRow label="Status" value={series.status} />
                           <InfoRow label="Runtime" value={series.runtime || "-"} />
                           <InfoRow label="Network" value={series.network} />
                       </div>
                  </div>
                  <StreamingAvailability imdbId={series.imdb_id} />
              </div>
          </div>
      </div>
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string, value: string }) => (
    <div className="flex justify-between py-3 border-b border-gray-100 last:border-0">
        <span className="font-black text-navy-900 text-[10px] uppercase">{label}</span>
        <span className="text-gray-600 text-xs font-bold">{value}</span>
    </div>
);
