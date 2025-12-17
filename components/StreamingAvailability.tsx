
import React, { useEffect, useState } from 'react';
import { watchmode, StreamingSource } from '../services/watchmode';
import { Tv, ExternalLink, Loader2 } from 'lucide-react';

interface StreamingAvailabilityProps {
    imdbId?: string;
}

export const StreamingAvailability: React.FC<StreamingAvailabilityProps> = ({ imdbId }) => {
    const [sources, setSources] = useState<StreamingSource[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasChecked, setHasChecked] = useState(false);

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

    // If no IMDb ID, we can't fetch.
    if (!imdbId) return null;

    return (
        <div className="bg-[#1F1F1F] rounded-lg p-6 shadow-md border border-white/5">
            <h3 className="text-white font-bold border-l-4 border-[#F5C518] pl-2 mb-4 uppercase flex items-center gap-2 text-sm tracking-wider">
                <Tv className="w-4 h-4 text-[#F5C518]" /> Where to Watch
            </h3>
            
            {loading ? (
                <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple" /> Checking availability...
                </div>
            ) : sources.length > 0 ? (
                <div className="flex flex-col gap-2">
                    {sources.map((source) => (
                        <a 
                            key={source.source_id}
                            href={source.web_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between bg-[#2A2A2A] hover:bg-[#333] text-gray-200 px-4 py-3 rounded transition-colors group border border-white/5"
                        >
                            <span className="font-bold text-sm">{source.name}</span>
                            <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-purple transition-colors" />
                        </a>
                    ))}
                </div>
            ) : hasChecked ? (
                <div className="text-sm text-gray-400 italic py-2">
                    Not currently available on major subscription platforms.
                </div>
            ) : (
                <div className="text-sm text-gray-500">Initializing...</div>
            )}
            
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
                <span>Powered by Watchmode</span>
            </div>
        </div>
    );
};
