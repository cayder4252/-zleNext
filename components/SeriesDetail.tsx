import React from 'react';
import { Series } from '../types';
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
  Eye
} from 'lucide-react';

interface SeriesDetailProps {
  series: Series;
  onAddToWatchlist: (id: string) => void;
  isInWatchlist: boolean;
}

export const SeriesDetail: React.FC<SeriesDetailProps> = ({ series, onAddToWatchlist, isInWatchlist }) => {
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
                    <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
                            <Star className="w-3 h-3 fill-current" />
                            {series.rating.toFixed(1)}/5
                        </div>
                        <span className="text-gray-400 text-sm">(307 votes)</span>
                    </div>
                    
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white leading-none mb-2">{series.title_tr}</h1>
                        <h2 className="text-xl text-gray-400 font-serif italic">{series.title_en}</h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300 font-medium">
                        <span>{series.release_year || new Date().getFullYear()} – Present</span>
                        <span className="w-1 h-1 bg-gray-500 rounded-full" />
                        <span>1 Season</span>
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
                  {['OVERVIEW', 'EPISODES', 'CAST & CREW', 'REVIEWS', 'LISTS', 'NEWS', 'RELATED'].map((tab, i) => (
                      <button 
                        key={tab} 
                        className={`py-4 border-b-2 whitespace-nowrap transition-colors ${i === 0 ? 'border-red-600 text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
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
              <div className="flex-1 space-y-10">
                  
                  {/* Synopsis */}
                  <section>
                      <h3 className="text-white font-bold text-lg mb-3 border-l-4 border-red-600 pl-3">Synopsis</h3>
                      <p className="text-gray-300 leading-relaxed text-sm md:text-base">
                          {series.synopsis}
                      </p>
                  </section>

                  {/* Episodes */}
                  <section>
                      <h3 className="text-white font-bold text-lg mb-4 border-l-4 border-red-600 pl-3">Latest Episodes</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {[1, 2, 3].map((i) => (
                              <div key={i} className="group cursor-pointer">
                                  <div className="relative aspect-video rounded-lg overflow-hidden mb-2">
                                      <img src={series.banner_url} alt="Ep" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                          <PlayCircleIcon className="w-10 h-10 text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                                      </div>
                                      <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] px-1 rounded">
                                          {series.runtime || '120m'}
                                      </span>
                                  </div>
                                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                                      <span>S1 E{series.episodes_aired - i + 1}</span>
                                      <span>Dec {20 - i}, 2023</span>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </section>

                  {/* Cast (Mock) */}
                  <section>
                      <h3 className="text-white font-bold text-lg mb-4 border-l-4 border-red-600 pl-3">Cast & Crew</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                           {['Afra Saraçoğlu', 'Mert Ramazan Demir', 'Çetin Tekindor', 'Şerif Sezer'].map((name, i) => (
                               <div key={i} className="flex items-center gap-3 bg-navy-800 p-2 rounded-lg hover:bg-navy-700 transition-colors cursor-pointer">
                                   <img 
                                    src={`https://picsum.photos/100/100?random=${i+10}`} 
                                    alt={name} 
                                    className="w-10 h-10 rounded-full object-cover" 
                                   />
                                   <div>
                                       <div className="text-xs font-bold text-white leading-tight">{name}</div>
                                       <div className="text-[10px] text-gray-400">Actor</div>
                                   </div>
                               </div>
                           ))}
                      </div>
                  </section>

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

              </div>

              {/* RIGHT COLUMN (Sidebar) */}
              <div className="w-full lg:w-[320px] space-y-8">
                  
                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-4">
                      <button className="flex flex-col items-center gap-2 group">
                          <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/30 group-hover:scale-110 transition-transform">
                              <Share2 className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-bold text-gray-300 uppercase">Tracking</span>
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
                          <span className="text-[10px] font-bold text-gray-300 uppercase">Seen All</span>
                      </button>
                  </div>

                  {/* Information Box */}
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                       <h3 className="text-navy-900 font-bold border-l-4 border-red-600 pl-2 mb-4">INFORMATION</h3>
                       <div className="space-y-3 text-sm">
                           <InfoRow label="Premiered" value={`Fri, Nov 21, ${series.release_year || 2023}`} />
                           <InfoRow label="Status" value={series.status} />
                           <InfoRow label="Schedule" value={series.schedule || "Fridays at 20:00"} />
                           <InfoRow label="Runtime" value={series.runtime || "120 mins"} />
                           <div className="flex justify-between py-2 border-b border-gray-100">
                               <span className="font-bold text-navy-900 text-xs uppercase">Tags</span>
                               <div className="flex flex-col items-end gap-1">
                                   {series.genres?.map(g => (
                                       <span key={g} className="text-red-600 text-xs hover:underline cursor-pointer">{g}</span>
                                   )) || <span className="text-gray-500">Drama</span>}
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
        <span className="text-gray-600 text-xs font-medium">{value}</span>
    </div>
);

const PlayCircleIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="2"/>
        <path d="M10 8L16 12L10 16V8Z" fill="currentColor"/>
    </svg>
);