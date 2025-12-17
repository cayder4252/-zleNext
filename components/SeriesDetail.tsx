import React, { useState } from 'react';
import { Series, Actor } from '../types';
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
  Eye,
  User as UserIcon,
  MessageSquare,
  Trophy,
  Film,
  PenTool
} from 'lucide-react';

interface SeriesDetailProps {
  series: Series;
  cast: Actor[];
  onAddToWatchlist: (id: string) => void;
  isInWatchlist: boolean;
}

export const SeriesDetail: React.FC<SeriesDetailProps> = ({ series, cast, onAddToWatchlist, isInWatchlist }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'EPISODES' | 'CAST' | 'REVIEWS'>('OVERVIEW');

  return (
    <div className="bg-navy-900 min-h-screen pb-12">
      {/* HERO SECTION */}
      <div className="relative w-full h-[400px] md:h-[500px]">
        {/* Banner Image */}
        <div className="absolute inset-0">
            <img 
                src={series.banner_url} 
                alt="Banner" 
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-navy-900 via-navy-900/40 to-transparent" />
        </div>

        <div className="container mx-auto px-4 h-full relative z-10 flex flex-col justify-end pb-8">
            <div className="flex flex-col md:flex-row gap-8 items-end">
                {/* Poster (Overlapping) */}
                <div className="hidden md:block w-48 lg:w-64 flex-shrink-0 -mb-16 rounded-lg overflow-hidden shadow-2xl border-4 border-navy-800">
                    <img src={series.poster_url} alt={series.title_tr} className="w-full h-auto" />
                </div>

                {/* Header Info */}
                <div className="flex-1 space-y-4 mb-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-1 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
                            <Star className="w-3 h-3 fill-current" />
                            {series.rating.toFixed(1)}/10
                        </div>
                        <span className="text-gray-400 text-sm border-r border-gray-600 pr-3">TMDb</span>
                        
                        {series.imdb_rating && (
                            <>
                                <div className="flex items-center gap-1 bg-[#F5C518] text-black px-2 py-1 rounded text-xs font-bold">
                                    <span className="font-black">IMDb</span>
                                    {series.imdb_rating}
                                </div>
                                <span className="text-gray-400 text-xs">{series.imdb_votes} votes</span>
                            </>
                        )}
                        {series.metascore && (
                            <div className="flex items-center gap-1 bg-[#66CC33] text-white px-2 py-1 rounded text-xs font-bold">
                                <span>Metascore</span>
                                {series.metascore}
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

                    {/* Social Buttons */}
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

      {/* TABS NAVIGATION */}
      <div className="border-b border-white/10 bg-navy-900 sticky top-16 z-30 shadow-lg">
          <div className="container mx-auto px-4 pl-0 md:pl-[300px]"> {/* Offset for poster width */}
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

      {/* MAIN CONTENT GRID */}
      <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
              
              {/* LEFT COLUMN (Content) */}
              <div className="flex-1 space-y-10 min-h-[500px]">
                  
                  {/* OVERVIEW TAB CONTENT */}
                  {activeTab === 'OVERVIEW' && (
                    <div className="animate-in fade-in duration-300 space-y-10">
                        {/* Synopsis */}
                        <section>
                            <h3 className="text-white font-bold text-lg mb-3 border-l-4 border-red-600 pl-3">Synopsis</h3>
                            <p className="text-gray-300 leading-relaxed text-sm md:text-base">
                                {series.synopsis}
                            </p>
                        </section>

                         {/* OMDb Awards Section */}
                         {series.awards && (
                             <section className="bg-navy-800/50 p-4 rounded-lg border border-white/5 flex items-start gap-4">
                                <Trophy className="w-8 h-8 text-[#F5C518] flex-shrink-0" />
                                <div>
                                    <h4 className="text-white font-bold text-sm uppercase mb-1">Awards & Recognition</h4>
                                    <p className="text-gray-300 text-sm">{series.awards}</p>
                                </div>
                             </section>
                         )}

                        {/* Latest Episodes Snippet */}
                        {series.latest_episode && (
                            <section>
                                <h3 className="text-white font-bold text-lg mb-4 border-l-4 border-red-600 pl-3">Latest Episode</h3>
                                <div className="bg-navy-800 rounded-lg overflow-hidden border border-white/5 flex flex-col md:flex-row">
                                    <div className="md:w-64 relative aspect-video md:aspect-auto">
                                        <img 
                                            src={series.latest_episode.still_path || series.banner_url} 
                                            alt="Episode" 
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                            <PlayCircleIcon className="w-10 h-10 text-white opacity-80" />
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

                        {/* Trailer */}
                        {series.trailer_url && (
                            <section>
                                <h3 className="text-white font-bold text-lg mb-4 border-l-4 border-red-600 pl-3">Videos</h3>
                                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-lg">
                                    <iframe 
                                        src={series.trailer_url.replace('watch?v=', 'embed/')} 
                                        title="Trailer" 
                                        className="w-full h-full" 
                                        frameBorder="0" 
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                        allowFullScreen 
                                    />
                                </div>
                            </section>
                        )}
                        
                        {/* Featured Cast Snippet */}
                         {cast.length > 0 && (
                            <section>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-white font-bold text-lg border-l-4 border-red-600 pl-3">Top Cast</h3>
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

                  {/* EPISODES TAB CONTENT */}
                  {activeTab === 'EPISODES' && (
                      <div className="animate-in fade-in duration-300 space-y-6">
                           <h3 className="text-white font-bold text-lg mb-4 border-l-4 border-red-600 pl-3">Seasons</h3>
                           {series.seasons && series.seasons.length > 0 ? (
                               <div className="space-y-4">
                                   {series.seasons.map((season) => (
                                       <div key={season.id} className="bg-navy-800 rounded-xl overflow-hidden border border-white/5 flex flex-col sm:flex-row hover:bg-navy-750 transition-colors">
                                           <div className="w-full sm:w-32 aspect-[2/3] sm:aspect-auto">
                                               <img 
                                                src={season.poster_path || series.poster_url} 
                                                alt={season.name} 
                                                className="w-full h-full object-cover"
                                               />
                                           </div>
                                           <div className="p-5 flex-1 flex flex-col justify-center">
                                                <h4 className="text-xl font-bold text-white mb-1">{season.name}</h4>
                                                <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                                                    <span className="font-bold text-purple">{season.episode_count} Episodes</span>
                                                    <span>•</span>
                                                    <span>{season.air_date ? new Date(season.air_date).getFullYear() : 'Unknown Year'}</span>
                                                </div>
                                                <p className="text-gray-400 text-sm line-clamp-3">
                                                    {season.overview || `Season ${season.season_number} of ${series.title_en || series.title_tr}.`}
                                                </p>
                                           </div>
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

                  {/* CAST TAB CONTENT */}
                  {activeTab === 'CAST' && (
                      <div className="animate-in fade-in duration-300 space-y-6">
                           <h3 className="text-white font-bold text-lg mb-4 border-l-4 border-red-600 pl-3">Full Cast & Crew</h3>
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

                  {/* REVIEWS TAB CONTENT */}
                  {activeTab === 'REVIEWS' && (
                      <div className="animate-in fade-in duration-300 space-y-6">
                          <h3 className="text-white font-bold text-lg mb-4 border-l-4 border-red-600 pl-3">User Reviews</h3>
                          {series.reviews && series.reviews.length > 0 ? (
                              <div className="space-y-4">
                                  {series.reviews.map((review) => (
                                      <div key={review.id} className="bg-navy-800 p-6 rounded-xl border border-white/5">
                                          <div className="flex justify-between items-start mb-4">
                                              <div className="flex items-center gap-3">
                                                  <div className="w-10 h-10 rounded-full bg-purple flex items-center justify-center text-white font-bold overflow-hidden">
                                                      {review.avatar_path ? (
                                                          <img src={review.avatar_path} alt={review.author} className="w-full h-full object-cover" />
                                                      ) : (
                                                          review.author.charAt(0).toUpperCase()
                                                      )}
                                                  </div>
                                                  <div>
                                                      <div className="font-bold text-white text-sm">A Review by {review.author}</div>
                                                      <div className="text-xs text-gray-500">
                                                          Written on {new Date(review.created_at).toLocaleDateString()}
                                                      </div>
                                                  </div>
                                              </div>
                                              {review.rating && (
                                                  <div className="bg-navy-900 border border-white/10 px-3 py-1 rounded-lg flex items-center gap-1">
                                                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                                      <span className="text-white font-bold text-sm">{review.rating}</span>
                                                  </div>
                                              )}
                                          </div>
                                          <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-line max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                              {review.content}
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          ) : (
                              <div className="text-center py-20 text-gray-500 bg-navy-800 rounded-xl border border-white/5 border-dashed flex flex-col items-center gap-4">
                                  <MessageSquare className="w-12 h-12 text-gray-600" />
                                  <p>No reviews available yet for this series.</p>
                              </div>
                          )}
                      </div>
                  )}

              </div>

              {/* RIGHT COLUMN (Sidebar) */}
              <div className="w-full lg:w-[320px] space-y-8">
                  
                  {/* Action Buttons */}
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

                  {/* Information Box */}
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                       <h3 className="text-navy-900 font-bold border-l-4 border-red-600 pl-2 mb-4">INFORMATION</h3>
                       <div className="space-y-3 text-sm">
                           <InfoRow label="Status" value={series.status} />
                           {series.latest_episode && (
                                <InfoRow label="Last Air Date" value={series.latest_episode.air_date} />
                           )}
                           <InfoRow label="Runtime" value={series.runtime || "-"} />
                           <InfoRow label="Original Title" value={series.title_en || series.title_tr} />
                           {series.director && (
                               <InfoRow label="Director" value={series.director} />
                           )}
                           {series.writer && (
                               <InfoRow label="Writer" value={series.writer} />
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

                  {/* Where to Watch */}
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                      <h3 className="text-navy-900 font-bold border-l-4 border-red-600 pl-2 mb-4 uppercase">Where to Watch</h3>
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-8 bg-red-600 rounded flex items-center justify-center text-white">
                              <Youtube className="w-5 h-5" fill="currentColor" />
                          </div>
                          <div>
                              <div className="font-bold text-navy-900 text-sm">YouTube</div>
                              <div className="text-xs text-gray-500">Free (Official Channel)</div>
                          </div>
                      </div>
                  </div>

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

const PlayCircleIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="2"/>
        <path d="M10 8L16 12L10 16V8Z" fill="currentColor"/>
    </svg>
);
