
import React, { useEffect, useState } from 'react';
import { watchmode, StreamingSource } from '../services/watchmode';
import { Tv, ExternalLink, Loader2, Zap, PlayCircle, Globe, ShieldCheck } from 'lucide-react';

interface StreamingAvailabilityProps {
    imdbId?: string;
    genres?: string[];
}

export const StreamingAvailability: React.FC<StreamingAvailabilityProps> = ({ imdbId, genres }) => {
    const [sources, setSources] = useState<StreamingSource[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasChecked, setHasChecked] = useState(false);
    const [redirectingTo, setRedirectingTo] = useState<string | null>(null);

    useEffect(() => {
        if (!imdbId) return;

        const fetchSources = async () => {
            setLoading(true);
            const data = await watchmode.getStreamingSources(imdbId);
            setSources(data);
            setLoading(false);
            setHasChecked(true);
        };

        fetchSources();
    }, [imdbId]);

    const isAnime = genres?.some(g => 
        g.toLowerCase().includes('animation') || 
        g.toLowerCase().includes('anime')
    );

    const communityLinks = isAnime ? [
        { name: 'NekoHD Node', url: 'https://nekohd.com', color: 'border-pink-500/30' },
        { name: 'MoviesLeech Direct', url: 'https://moviesleech.eu', color: 'border-blue-500/30' },
        { name: 'AnimeFlix Premium', url: 'https://animeflix.pm', color: 'border-purple-500/30' },
        { name: 'UHDMovies Stream', url: 'https://uhdmovies.stream', color: 'border-yellow-500/30' }
    ] : [
        { name: 'MoviesLeech Node', url: 'https://moviesleech.eu', color: 'border-blue-500/30' },
        { name: 'UHDMovies Stream', url: 'https://uhdmovies.stream', color: 'border-yellow-500/30' },
        { name: 'TheMoviesFlix Day', url: 'https://themoviesflix.day/', color: 'border-red-500/30' },
        { name: '9Anime Logistics', url: 'https://9anime.logisticssameday.co.uk/', color: 'border-cyan-500/30' }
    ];

    const handleRedirect = (name: string, url: string) => {
        setRedirectingTo(name);
        setTimeout(() => {
            window.open(url, '_blank', 'noopener,noreferrer');
            setRedirectingTo(null);
        }, 800);
    };

    return (
        <div className="space-y-6">
            {/* Official Subscription Sources */}
            <div className="bg-navy-800/60 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/5">
                <h3 className="text-white font-black border-l-4 border-purple pl-3 mb-6 uppercase flex items-center gap-2 text-[11px] tracking-[0.2em]">
                    <Tv className="w-4 h-4 text-purple" /> Official Carriers
                </h3>
                
                {loading ? (
                    <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-purple" /> Verifying availability...
                    </div>
                ) : sources.length > 0 ? (
                    <div className="flex flex-col gap-2">
                        {sources.map((source) => (
                            <a 
                                key={source.source_id}
                                href={source.web_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between bg-navy-900/50 hover:bg-white/5 text-gray-300 px-4 py-3 rounded-xl transition-all group border border-white/5 active:scale-[0.98]"
                            >
                                <span className="font-bold text-xs">{source.name}</span>
                                <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:text-purple transition-colors" />
                            </a>
                        ))}
                    </div>
                ) : hasChecked ? (
                    <div className="text-[10px] text-gray-500 italic py-2 font-medium">
                        No active subscription nodes detected in this region.
                    </div>
                ) : (
                    <div className="text-[10px] text-gray-500 animate-pulse">Initializing Watchmode link...</div>
                )}
            </div>

            {/* Community Stream Nodes */}
            <div className="bg-navy-800/80 backdrop-blur-2xl rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-20">
                    <Zap className="w-12 h-12 text-yellow-400" />
                </div>
                
                <h3 className="text-white font-black border-l-4 border-yellow-500 pl-3 mb-6 uppercase flex items-center gap-2 text-[11px] tracking-[0.2em] relative z-10">
                    <ShieldCheck className="w-4 h-4 text-yellow-500" /> Global Community Nodes
                </h3>

                <div className="grid grid-cols-1 gap-3 relative z-10">
                    {communityLinks.map((node, i) => (
                        <button
                            key={i}
                            onClick={() => handleRedirect(node.name, node.url)}
                            disabled={redirectingTo !== null}
                            className={`flex items-center justify-between bg-white/5 hover:bg-white/10 ${node.color} border px-5 py-4 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.97] group/btn disabled:opacity-50`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-navy-900/80 rounded-xl flex items-center justify-center border border-white/10 group-hover/btn:border-purple/50 transition-colors shadow-inner">
                                    <PlayCircle className="w-5 h-5 text-gray-400 group-hover/btn:text-purple transition-colors" />
                                </div>
                                <div className="text-left">
                                    <div className="text-xs font-black text-white uppercase tracking-wider group-hover/btn:text-purple transition-colors">
                                        {node.name}
                                    </div>
                                    <div className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.1em]">Verified Server Link</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {redirectingTo === node.name ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-purple" />
                                ) : (
                                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-navy-900 group-hover/btn:bg-purple/20 transition-colors">
                                        <ExternalLink className="w-3.5 h-3.5 text-gray-600 group-hover/btn:text-white" />
                                    </div>
                                )}
                            </div>
                        </button>
                    ))}
                </div>

                {redirectingTo && (
                    <div className="mt-4 text-center animate-pulse">
                        <span className="text-[10px] font-black text-purple uppercase tracking-widest">
                            Syncing {redirectingTo}...
                        </span>
                    </div>
                )}

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                        <Globe className="w-3 h-3" /> External Relay Active
                    </div>
                </div>
            </div>
        </div>
    );
};
