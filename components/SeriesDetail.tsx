
import React, { useState, useEffect } from 'react';
import { Series, Actor, Episode, Review, User } from '../types';
import { tmdb } from '../services/tmdb';
import { omdb } from '../services/omdb';
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
  PlayCircle
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
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(10);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Local state for OMDb enrichment data
  const [enrichedData, setEnrichedData] = useState<Partial<Series>>({});

  useEffect(() => {
    setIsPlayingTrailer(false);
    setEnrichedData({}); 

    const fetchOmdbEnrichment = async () => {
        if (series.imdb_id) {
            if (!series.awards || !series.director || !series.metascore) {
                const data = await omdb.getDetails(series.imdb_id);
                if (data) {
                    setEnrichedData(data);
                }
            }
        }
    };

    fetchOmdbEnrichment();

    // Fetch Community Reviews from Firestore - Standardized path ensures all users see them
    const reviewsRef = collection(db, 'series', series.id, 'reviews');
    const q = query(reviewsRef, orderBy('created_at', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
        setCommunityReviews(reviews);
    }, (error) => {
        console.error("Firestore reviews subscription error:", error);
    });

    return () => {
        unsubscribe();
    };
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
      if (!user) {
          alert("Please login to vote on reviews.");
          return;
      }

      const review = communityReviews.find(r => r.id === reviewId);
      if (!review) return;

      const userVote = review.votedBy?.[user.id];
      const reviewRef = doc(db, 'series', series.id, 'reviews', reviewId);

      const updates: any = {};

      if (userVote === type) {
          updates[`votedBy.${user.id}`] = null;
          updates[type === 'like' ? 'likes' : 'dislikes'] = increment(-1);
      } else {
          if (userVote) {
              updates[userVote === 'like' ? 'likes' : 'dislikes'] = increment(-1);
          }
          updates[`votedBy.${user.id}`] = type;
          updates[type === 'like' ? 'likes' : 'dislikes'] = increment(1);
      }

      try {
          await updateDoc(reviewRef, updates);
      } catch (err) {
          console.error("Voting failed:", err);
      }
  };

  const metascore = getField('metascore');
  const awards = getField('awards');
  const director = getField('director');
  const writer = getField('writer');
  const imdbRating = getField('imdb_rating');
  const imdbVotes = getField('imdb_votes');

  const allReviews = [...communityReviews, ...(series.reviews || [])];

  return (
    <div className="bg-navy-900 min-h-screen pb-12">
      <div className="relative w-full h-[400px] md:h-[500px]">
        <div className="absolute inset-0">
            <img 
                src={series.banner_url} 
                alt="Banner" 
                className="w-full h-full object-cover"
            />
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
                        <span className="text-gray-400 text-sm border-r border-gray-600 pr-3">TMDb</span>
                        
                        {imdbRating && (
                            <>
                                <div className="flex items-center gap-1 bg-[#F5C518] text-black px-2 py-1 rounded text-xs font-bold">
                                    <span className="font-black">IMDb</span>
                                    {imdbRating}
                                </div>
                                {imdbVotes && <span className="text-gray-400 text-xs">{imdbVotes} votes</span>}
                            </>
                        )}
                        {metascore && (
                            <div className="flex items-center gap-1 bg-[#66CC33] text-white px-2 py-1 rounded text-xs font-bold">
                                <span>Metascore</span>
                                {metascore}
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
                        <span className="text-white border-b border-white/30 hover:border-white transition-colors cursor-pointer">{series.network}</span>
                        <span className="w-1 h-1 bg-gray-500 rounded-full" />
                        <span>{series.genres?.join(', ') || 'Drama'}</span>
                    </div>

                    <div className="flex gap-2 pt-2">
                        {series.social_links?.facebook && (
                            <a href={series.social_links.facebook} target="_blank" rel="noreferrer" className="w-8 h-8 bg-[#3b5998] rounded flex items-center justify-center text-white hover:opacity-90">
                                <Facebook className="w-4 h-4" fill="currentColor" />
                            </a>
                        )}
                        {series.social_links?.instagram && (
                            <a href={series.social_links.instagram} target="_blank" rel="noreferrer" className="w-8 h-8 bg-gradient-to-tr from-[#f09433] to-[#bc1888] rounded flex items-center justify-center text-white hover:opacity-90">
                                <Instagram className="w-4 h-4" />
                            </a>
                        )}
                        {series.social_links?.youtube && (
                            <a href={series.social_links.youtube} target="_blank" rel="noreferrer" className="w-8 h-8 bg-[#FF0000] rounded flex items-center justify-center text-white hover:opacity-90">
                                <Youtube className="w-4 h-4" fill="currentColor" />
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="border-b border-white/10 bg-navy-900 sticky top-16 z-30 shadow-lg">
          <div className="container mx-auto px-4 pl-0 md:pl-[300px]"> 
              <nav className="flex overflow-x-auto no-scrollbar gap-8 text-sm font-bold">
                  {(['OVERVIEW', 'EPISODES', 'CAST', 'REVIEWS'] as const).map((tab) => (
                      <button 
                        key={tab} 
                        onClick={() => setActiveTab(tab)}
                        className={`py-4 border-b-2 whitespace-nowrap transition-colors ${activeTab === tab ? 'border-red-600 text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                      >
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
                            <p className="text-gray-300 leading-relaxed text-sm md:text-base">
                                {series.synopsis}
                            </p>
                        </section>

                         {awards && (
                             <section className="bg-navy-800/50 p-6 rounded-xl border border-white/10 flex items-start gap-5 shadow-inner">
                                <Trophy className="w-10 h-10 text-[#F5C518] flex-shrink-0 drop-shadow-lg" />
                                <div>
                                    <h4 className="text-[#F5C518] font-bold text-xs uppercase tracking-widest mb-1">Awards & Recognition</h4>
                                    <p className="text-white font-medium text-sm md:text-base leading-snug">{awards}</p>
                                </div>
                             </section>
                         )}

                        {series.latest_episode && (
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-1 h-6 bg-red-600 rounded-full" />
                                    <h3 className="text-white font-bold text-lg">Latest Episode</h3>
                                </div>
                                <div className="bg-navy-800 rounded-lg overflow-hidden border border-white/5 flex flex-col md:flex-row">
                                    <div className="md:w-64 relative aspect-video md:aspect-auto">
                                        <img 
                                            src={series.latest_episode.still_path || series.banner_url} 
                                            alt="Episode" 
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                            <PlayCircle className="w-10 h-10 text-white opacity-80" />
                                        </div>
                                    </div>
                                    <div className="p-4 flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="text-white font-bold text-lg">{series.latest_episode.name || `Episode ${series.latest_episode.episode_number}`}</h4>
                                                <p className="text-purple text-xs font-bold">Season {series.latest_episode.season_number} • Episode {series.latest_episode.episode_number}</p>
                                            </div>
                                            <span className="text-gray-400 text-xs bg-white/5 px-2 py-1 rounded">{series.latest_episode.air_date}</span>
                                        </div>
                                        <p className="text-gray-400 text-sm line-clamp-3">
                                            {series.latest_episode.overview || "No overview available for this episode."}
                                        </p>
                                    </div>
                                </div>
                            </section>
                        )}

                        {series.trailer_url && (
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-1 h-6 bg-red-600 rounded-full" />
                                    <h3 className="text-white font-bold text-lg">Trailers & Videos</h3>
                                </div>
                                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-2xl relative group ring-1 ring-white/10">
                                    {!isPlayingTrailer ? (
                                        <div 
                                            className="w-full h-full cursor-pointer relative"
                                            onClick={() => setIsPlayingTrailer(true)}
                                        >
                                            <img 
                                                src={series.banner_url || series.poster_url} 
                                                alt="Trailer Thumbnail" 
                                                className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-300"
                                            />
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <div className="w-16 h-16 md:w-20 md:h-20 bg-red-600 rounded-full flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform duration-300">
                                                    <Play className="w-6 h-6 md:w-8 md:h-8 text-white fill-current ml-1" />
                                                </div>
                                                <span className="mt-4 text-white font-bold text-sm md:text-lg tracking-wide uppercase drop-shadow-md">Watch Trailer</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full h-full animate-in fade-in zoom-in-95 duration-500 relative">
                                            <button 
                                                onClick={() => setIsPlayingTrailer(false)}
                                                className="absolute top-4 right-4 z-20 bg-black/60 hover:bg-red-600 text-white p-2 rounded-full backdrop-blur-md transition-colors shadow-lg"
                                                title="Close Trailer"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                            <iframe 
                                                src={`${series.trailer_url.replace('watch?v=', 'embed/')}?autoplay=1`} 
                                                title="Trailer" 
                                                className="w-full h-full" 
                                                frameBorder="0" 
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                                allowFullScreen 
                                            />
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}
                        
                         {cast.length > 0 && (
                            <section>
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-6 bg-red-600 rounded-full" />
                                        <h3 className="text-white font-bold text-lg">Top Cast</h3>
                                    </div>
                                    <button onClick={() => setActiveTab('CAST')} className="text-xs text-purple font-bold hover:underline">View All</button>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {cast.slice(0, 4).map((actor) => (
                                        <div key={actor.id} className="bg-navy-800 rounded-lg p-2 flex items-center gap-3">
                                            <img src={actor.photo_url} alt={actor.name} className="w-10 h-10 rounded-full object-cover" />
                                            <div className="overflow-hidden">
                                                <div className="text-sm font-bold text-white truncate">{actor.name}</div>
                                                <div className="text-xs text-gray-400 truncate">{actor.character_name}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                         )}
                    </div>
                  )}

                  {activeTab === 'EPISODES' && (
                      <div className="animate-in fade-in duration-300 space-y-6">
                           <div className="flex items-center gap-2 mb-4">
                                <div className="w-1 h-6 bg-red-600 rounded-full" />
                                <h3 className="text-white font-bold text-lg">Seasons & Episodes</h3>
                           </div>
                           {series.seasons && series.seasons.length > 0 ? (
                               <div className="space-y-4">
                                   {series.seasons.map((season) => (
                                       <div key={season.id} className="bg-navy-800 rounded-xl overflow-hidden border border-white/5 transition-colors">
                                            <div 
                                                onClick={() => toggleSeason(season.season_number)}
                                                className="flex flex-col sm:flex-row cursor-pointer hover:bg-navy-750"
                                            >
                                                <div className="w-full sm:w-32 aspect-[2/3] sm:aspect-auto">
                                                    <img 
                                                        src={season.poster_path || series.poster_url} 
                                                        alt={season.name} 
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="p-5 flex-1 flex flex-col justify-center">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h4 className="text-xl font-bold text-white mb-1">{season.name}</h4>
                                                                <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                                                                    <span className="font-bold text-purple">{season.episode_count} Episodes</span>
                                                                    <span>•</span>
                                                                    <span>{season.air_date ? new Date(season.air_date).getFullYear() : 'Unknown Year'}</span>
                                                                </div>
                                                            </div>
                                                            <div className="bg-white/5 p-2 rounded-full">
                                                                {expandedSeason === season.season_number ? <ChevronUp className="w-5 h-5 text-purple" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                                                            </div>
                                                        </div>
                                                        <p className="text-gray-400 text-sm line-clamp-2">
                                                            {season.overview || `Season ${season.season_number} of ${series.title_en || series.title_tr}.`}
                                                        </p>
                                                </div>
                                            </div>

                                            {expandedSeason === season.season_number && (
                                                <div className="border-t border-white/5 bg-navy-900/50 p-4 animate-in slide-in-from-top-2">
                                                    {loadingEpisodes && !seasonEpisodes[season.season_number] ? (
                                                        <div className="text-center py-8 text-gray-400 flex items-center justify-center gap-2">
                                                            <div className="w-4 h-4 border-2 border-purple border-t-transparent rounded-full animate-spin" />
                                                            Loading Episodes...
                                                        </div>
                                                    ) : seasonEpisodes[season.season_number] && seasonEpisodes[season.season_number].length > 0 ? (
                                                        <div className="space-y-2">
                                                            {seasonEpisodes[season.season_number].map((ep) => (
                                                                <div key={ep.id} className="flex gap-4 p-3 rounded hover:bg-white/5 transition-colors items-center">
                                                                    <div className="w-32 aspect-video bg-navy-800 rounded overflow-hidden flex-shrink-0">
                                                                        {ep.still_path ? (
                                                                            <img src={ep.still_path} alt="" className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            <div className="w-full h-full flex items-center justify-center bg-navy-800 text-gray-600">
                                                                                <Film className="w-6 h-6" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex justify-between items-baseline mb-1">
                                                                            <h5 className="font-bold text-white truncate text-sm">
                                                                                <span className="text-purple mr-2">{ep.episode_number}.</span> 
                                                                                {ep.name}
                                                                            </h5>
                                                                            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">{ep.air_date}</span>
                                                                        </div>
                                                                        <p className="text-gray-400 text-xs line-clamp-2">{ep.overview || "No overview available."}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-4 text-gray-500 text-sm italic">
                                                            No episodes found for this season.
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                       </div>
                                   ))}
                               </div>
                           ) : (
                               <div className="text-center py-20 text-gray-500 bg-navy-800 rounded-xl border border-white/5 border-dashed">
                                   No season information available.
                               </div>
                           )}
                      </div>
                  )}

                  {activeTab === 'CAST' && (
                      <div className="animate-in fade-in duration-300 space-y-6">
                           <div className="flex items-center gap-2 mb-4">
                                <div className="w-1 h-6 bg-red-600 rounded-full" />
                                <h3 className="text-white font-bold text-lg">Full Cast & Crew</h3>
                           </div>
                           {cast.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
                                    {cast.map((actor) => (
                                        <div key={actor.id} className="group bg-navy-800 rounded-lg overflow-hidden hover:bg-navy-700 transition-colors cursor-pointer border border-white/5">
                                            <div className="aspect-[2/3] overflow-hidden">
                                                <img 
                                                    src={actor.photo_url} 
                                                    alt={actor.name} 
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                                />
                                            </div>
                                            <div className="p-3">
                                                <div className="text-sm font-bold text-white leading-tight mb-1 truncate">{actor.name}</div>
                                                <div className="text-xs text-gray-400 truncate">{actor.character_name}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                           ) : (
                                <div className="text-center py-20 text-gray-500 bg-navy-800 rounded-xl border border-white/5 border-dashed">
                                    No cast information available.
                                </div>
                           )}
                      </div>
                  )}

                  {activeTab === 'REVIEWS' && (
                      <div className="animate-in fade-in duration-300 space-y-10">
                          <section>
                              <div className="flex items-center gap-2 mb-6">
                                    <div className="w-1 h-6 bg-purple rounded-full shadow-lg shadow-purple/50" />
                                    <h3 className="text-white font-black text-lg uppercase tracking-tighter">Community Pulse</h3>
                              </div>
                              {user ? (
                                  <div className="bg-navy-800/50 backdrop-blur-xl p-6 rounded-2xl border border-white/5 shadow-xl">
                                      <div className="flex items-center gap-3 mb-4">
                                          <div className="w-10 h-10 rounded-full bg-purple flex items-center justify-center font-bold text-white overflow-hidden">
                                              {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : user.name.charAt(0)}
                                          </div>
                                          <div>
                                              <div className="text-sm font-bold text-white">{user.name}</div>
                                              <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Share your thoughts</div>
                                          </div>
                                      </div>
                                      <form onSubmit={handleSubmitReview} className="space-y-4">
                                          <textarea 
                                              value={newReviewText}
                                              onChange={(e) => setNewReviewText(e.target.value)}
                                              placeholder="What do you think about this series? Write your review here..."
                                              className="w-full bg-navy-900 border border-white/5 text-white px-5 py-4 rounded-xl focus:outline-none focus:border-purple/50 transition-all text-sm resize-none"
                                              rows={4}
                                          />
                                          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                              <div className="flex items-center gap-3">
                                                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Your Rating:</span>
                                                  <div className="flex gap-1">
                                                      {[1,2,3,4,5,6,7,8,9,10].map(num => (
                                                          <button 
                                                            key={num} 
                                                            type="button"
                                                            onClick={() => setNewReviewRating(num)}
                                                            className={`w-6 h-6 rounded text-[10px] font-bold transition-all ${newReviewRating >= num ? 'bg-purple text-white' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
                                                          >
                                                              {num}
                                                          </button>
                                                      ))}
                                                  </div>
                                              </div>
                                              <button 
                                                disabled={isSubmittingReview || !newReviewText.trim()}
                                                className="bg-purple hover:bg-purple-light text-white px-8 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-purple/20"
                                              >
                                                  {isSubmittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Post Review</>}
                                              </button>
                                          </div>
                                      </form>
                                  </div>
                              ) : (
                                  <div className="bg-navy-800/30 p-8 rounded-2xl border border-white/5 border-dashed text-center flex flex-col items-center gap-4">
                                      <p className="text-gray-400 text-sm font-medium">Want to share your opinion? Log in to leave a review.</p>
                                      <button className="text-purple bg-purple/10 px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.2em] border border-purple/20 hover:bg-purple/20 transition-all">Login Required</button>
                                  </div>
                              )}
                          </section>

                          <div className="space-y-6">
                            {allReviews.length > 0 ? (
                                allReviews.map((review) => {
                                    const isCommunityReview = !!review.userId;
                                    const userVote = user ? review.votedBy?.[user.id] : null;

                                    return (
                                        <div key={review.id} className={`group bg-navy-800/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/5 transition-all hover:border-purple/30 ${isCommunityReview ? 'ring-1 ring-purple/5' : ''}`}>
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple to-purple-dark flex items-center justify-center text-white font-black overflow-hidden shadow-xl">
                                                        {review.avatar_path ? (
                                                            <img src={review.avatar_path} alt={review.author} className="w-full h-full object-cover" />
                                                        ) : (
                                                            review.author.charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="font-black text-white uppercase tracking-tighter text-base">{review.author}</div>
                                                            {isCommunityReview && (
                                                                <span className="bg-purple/20 text-purple text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-purple/30">Community</span>
                                                            )}
                                                        </div>
                                                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                                                            {new Date(review.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </div>
                                                    </div>
                                                </div>
                                                {review.rating && (
                                                    <div className="bg-navy-900/50 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-2xl">
                                                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                                        <span className="text-white font-black text-lg tracking-tighter">{review.rating}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-line mb-8 font-medium opacity-90">
                                                {review.content}
                                            </div>

                                            {isCommunityReview && (
                                                <div className="flex items-center gap-6 pt-6 border-t border-white/5">
                                                    <button 
                                                        onClick={() => handleVote(review.id, 'like')}
                                                        className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${userVote === 'like' ? 'text-green-500' : 'text-gray-500 hover:text-white'}`}
                                                    >
                                                        <ThumbsUp className={`w-4 h-4 ${userVote === 'like' ? 'fill-current' : ''}`} /> {review.likes || 0}
                                                    </button>
                                                    <button 
                                                        onClick={() => handleVote(review.id, 'dislike')}
                                                        className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${userVote === 'dislike' ? 'text-red-500' : 'text-gray-500 hover:text-white'}`}
                                                    >
                                                        <ThumbsDown className={`w-4 h-4 ${userVote === 'dislike' ? 'fill-current' : ''}`} /> {review.dislikes || 0}
                                                    </button>
                                                    
                                                    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button className="text-[10px] font-black text-purple uppercase tracking-widest hover:underline">Report Review</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-24 text-gray-500 bg-navy-800/20 rounded-[3rem] border border-white/5 border-dashed flex flex-col items-center gap-6">
                                    <div className="w-20 h-20 bg-navy-800 rounded-full flex items-center justify-center border border-white/5 shadow-inner">
                                        <MessageSquare className="w-10 h-10 text-gray-700" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-white font-black text-lg uppercase tracking-tighter">No Voices Yet</p>
                                        <p className="text-sm font-medium text-gray-500 max-w-xs mx-auto">This series hasn't received community feedback yet. Be the first to share your experience!</p>
                                    </div>
                                </div>
                            )}
                          </div>
                      </div>
                  )}

              </div>

              <div className="w-full lg:w-[320px] space-y-8">
                  
                  <div className="grid grid-cols-3 gap-4">
                      <button className="flex flex-col items-center gap-2 group">
                          <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/30 group-hover:scale-110 transition-transform">
                              <Share2 className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-bold text-gray-300 uppercase">Share</span>
                      </button>
                      <button onClick={() => onAddToWatchlist(series.id)} className="flex flex-col items-center gap-2 group">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110 ${isInWatchlist ? 'bg-green-600 shadow-green-600/30' : 'bg-gray-700 hover:bg-gray-600'}`}>
                              {isInWatchlist ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                          </div>
                          <span className="text-[10px] font-bold text-gray-300 uppercase">
                              {isInWatchlist ? 'In List' : 'Add To List'}
                          </span>
                      </button>
                      <button className="flex flex-col items-center gap-2 group">
                          <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-white shadow-lg group-hover:scale-110 hover:bg-gray-600 transition-transform">
                              <Eye className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-bold text-gray-300 uppercase">Track</span>
                      </button>
                  </div>

                  <div className="bg-white rounded-lg p-6 shadow-sm">
                       <h3 className="text-navy-900 font-bold border-l-4 border-red-600 pl-2 mb-4">INFORMATION</h3>
                       <div className="space-y-3 text-sm">
                           <InfoRow label="Status" value={series.status} />
                           {series.latest_episode && (
                                <InfoRow label="Last Air Date" value={series.latest_episode.air_date} />
                           )}
                           <InfoRow label="Runtime" value={series.runtime || "-"} />
                           <InfoRow label="Original Title" value={series.title_en || series.title_tr} />
                           {director && (
                               <InfoRow label="Director" value={director} />
                           )}
                           {writer && (
                               <InfoRow label="Writer" value={writer} />
                           )}
                           <div className="flex justify-between py-2 border-b border-gray-100">
                               <span className="font-bold text-navy-900 text-xs uppercase">Genres</span>
                               <div className="flex flex-col items-end gap-1">
                                   {series.genres?.map(g => (
                                       <span key={g} className="text-red-600 text-xs hover:underline cursor-pointer">{g}</span>
                                   )) || <span className="text-gray-500">-</span>}
                               </div>
                           </div>
                           <div className="flex justify-between py-2 border-b border-gray-100">
                               <span className="font-bold text-navy-900 text-xs uppercase">Links</span>
                               <a href={series.social_links?.official_site || "#"} target="_blank" rel="noreferrer" className="text-red-600 text-xs flex items-center gap-1 hover:underline">
                                   Official Website <LinkIcon className="w-3 h-3" />
                               </a>
                           </div>
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
    <div className="flex justify-between py-2 border-b border-gray-100">
        <span className="font-bold text-navy-900 text-xs uppercase">{label}</span>
        <span className="text-gray-600 text-xs font-medium max-w-[150px] truncate text-right">{value}</span>
    </div>
);
