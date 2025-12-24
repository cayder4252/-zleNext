
import React, { useEffect, useState } from 'react';
import { watchmode, StreamingSource } from '../services/watchmode';
import { Tv, ExternalLink, Loader2, Zap, PlayCircle, Globe, ShieldCheck, Cpu, Radio, Activity } from 'lucide-react';

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
        { name: 'NekoHD Node', url: 'https://nekohd.com', color: 'border-pink-500/30', glow: 'group-hover:shadow-pink-500/20' },
        { name: 'MoviesLeech Direct', url: 'https://moviesleech.eu', color: 'border-blue-500/30', glow: 'group-hover:shadow-blue-500/20' },
        { name: 'AnimeFlix Premium', url: 'https://animeflix.pm', color: 'border-purple-500/30', glow: 'group-hover:shadow-purple-500/20' },
        { name: 'UHDMovies Stream', url: 'https://uhdmovies.stream', color: 'border-yellow-500/30', glow: 'group-hover:shadow-yellow-500/20' }
    ] : [
        { name: 'MoviesLeech Node', url: 'https://moviesleech.eu', color: 'border-blue-500/30', glow: 'group-hover:shadow-blue-500/20' },
        { name: 'UHDMovies Stream', url: 'https://uhdmovies.stream', color: 'border-yellow-500/30', glow: 'group-hover:shadow-yellow-500/20' },
        { name: 'TheMoviesFlix Day', url: 'https://themoviesflix.day/', color: 'border-red-500/30', glow: 'group-hover:shadow-red-500/20' },
        { name: '9Anime Logistics', url: 'https://9anime.logisticssameday.co.uk/', color: 'border-cyan-500/30', glow: 'group-hover:shadow-cyan-500/20' }
    ];

    const handleRedirect = (name: string, url: string) => {
        setRedirectingTo(name);
        setTimeout(() => {
            window.open(url, '_blank', 'noopener,noreferrer');
            setRedirectingTo(null);
        }, 1200);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
            {/* Official Subscription Sources */}
            <div className="bg-navy-800/40 backdrop-blur-xl rounded-[2rem] p-8 border border-white/5 relative overflow-hidden group/official">
                <div className="absolute top-0 right-0 p-6 opacity-5">
                   <Radio className="w-16 h-16 text-purple" />
                </div>
                
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-white font-black border-l-4 border-purple pl-4 uppercase flex items-center gap-3 text-xs tracking-[0.2em]">
                        <Tv className="w-4 h-4 text-purple" /> Official Carriers
                    </h3>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Live Feed</span>
                    </div>
                </div>
                
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-purple" />
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Searching Satellites...</span>
                    </div>
                ) : sources.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                        {sources.map((source) => (
                            <a 
                                key={source.source_id}
                                href={source.web_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between bg-navy-900/40 hover:bg-purple/10 text-gray-400 hover:text-white px-5 py-4 rounded-2xl transition-all duration-300 group border border-white/5 hover:border-purple/30 active:scale-[0.98] shadow-sm"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-purple/30 group-hover:bg-purple group-hover:shadow-[0_0_8px_rgba(123,44,191,0.6)] transition-all" />
                                    <span className="font-black text-[11px] uppercase tracking-wider">{source.name}</span>
                                </div>
                                <ExternalLink className="w-3.5 h-3.5 opacity-30 group-hover:opacity-100 transition-opacity" />
                            </a>
                        ))}
                    </div>
                ) : hasChecked ? (
                    <div className="bg-navy-900/30 rounded-2xl p-8 border border-dashed border-white/10 text-center">
                        <Activity className="w-6 h-6 text-gray-600 mx-auto mb-3 opacity-20" />
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                            No subscription nodes detected.<br/>Check regional restrictions.
                        </p>
                    </div>
                ) : (
                    <div className="text-[10px] text-gray-600 font-black uppercase tracking-[0.3em] animate-pulse py-10 text-center">Awaiting Data...</div>
                )}
            </div>

            {/* Community Stream Nodes */}
            <div className="bg-navy-800/80 backdrop-blur-2xl rounded-[2rem] p-8 border border-white/10 relative overflow-hidden group/community shadow-2xl">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-500/5 rounded-full blur-3xl" />
                
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-white font-black border-l-4 border-yellow-500 pl-4 uppercase flex items-center gap-3 text-xs tracking-[0.2em] relative z-10">
                        <ShieldCheck className="w-4 h-4 text-yellow-500" /> Community Links
                    </h3>
                    <div className="bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter">Verified Node</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
                    {communityLinks.map((node, i) => (
                        <button
                            key={i}
                            onClick={() => handleRedirect(node.name, node.url)}
                            disabled={redirectingTo !== null}
                            className={`flex flex-col gap-2 bg-white/5 hover:bg-white/10 ${node.color} ${node.glow} border p-4 rounded-2xl transition-all duration-500 transform hover:-translate-y-1 active:scale-[0.95] group/btn disabled:opacity-50 shadow-lg`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="w-8 h-8 bg-navy-900/80 rounded-lg flex items-center justify-center border border-white/10 group-hover/btn:border-yellow-500/50 transition-colors">
                                    <PlayCircle className="w-4 h-4 text-gray-500 group-hover/btn:text-yellow-500 transition-colors" />
                                </div>
                                {redirectingTo === node.name ? (
                                    <Loader2 className="w-3 h-3 animate-spin text-yellow-500" />
                                ) : (
                                    <Cpu className="w-3 h-3 text-gray-700 group-hover/btn:text-yellow-500/50 transition-colors" />
                                )}
                            </div>
                            <div className="text-left mt-1">
                                <div className="text-[10px] font-black text-white uppercase tracking-wider group-hover/btn:text-yellow-500 transition-colors">
                                    {node.name}
                                </div>
                                <div className="text-[8px] text-gray-600 font-bold uppercase tracking-tighter mt-0.5">Relay Active</div>
                            </div>
                        </button>
                    ))}
                </div>

                {redirectingTo && (
                    <div className="absolute inset-0 z-50 bg-navy-900/90 backdrop-blur-md flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-300">
                        <div className="relative">
                            <div className="w-16 h-16 border-2 border-yellow-500/20 rounded-full animate-ping absolute inset-0" />
                            <div className="w-16 h-16 border-t-2 border-yellow-500 rounded-full animate-spin" />
                        </div>
                        <h4 className="text-white font-black text-xs uppercase tracking-[0.4em] mt-8 mb-2">Establishing Uplink</h4>
                        <p className="text-[9px] text-yellow-500 font-black uppercase tracking-widest animate-pulse">Syncing to {redirectingTo}...</p>
                    </div>
                )}
            </div>
        </div>
    );
};
