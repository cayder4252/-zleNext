import React, { useEffect, useState } from 'react';
import { Series } from '../types';
import { tmdb } from '../services/tmdb';
import { DiziCard } from './DiziCard';
import { ChevronRight } from 'lucide-react';

interface CategoryRowProps {
    title: string;
    endpoint: string;
    params: string;
    onSeriesClick: (id: string) => void;
    onAddToWatchlist: (id: string) => void;
    onViewAll: () => void;
}

export const CategoryRow: React.FC<CategoryRowProps> = ({ title, endpoint, params, onSeriesClick, onAddToWatchlist, onViewAll }) => {
    const [series, setSeries] = useState<Series[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Basic Data
                const initialData = await tmdb.getDiscoveryContent(endpoint, params);
                
                if (isMounted) {
                    setSeries(initialData);
                    setLoading(false);
                }

                // 2. Progressive Enrichment (in background)
                const enrichedData = await tmdb.enrichSeries(initialData);
                if (isMounted) {
                    setSeries(enrichedData);
                }
            } catch (error) {
                console.error(`Error loading category ${title}:`, error);
                if (isMounted) setLoading(false);
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [endpoint, params, title]);

    if (loading) {
        return (
            <div className="space-y-4 mb-8 animate-pulse">
                <div className="h-8 bg-navy-800 w-48 rounded ml-4"></div>
                <div className="flex gap-4 px-4 overflow-hidden">
                    {[1,2,3,4,5].map(i => (
                        <div key={i} className="w-[160px] h-[240px] bg-navy-800 rounded-lg flex-shrink-0"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (series.length === 0) return null;

    return (
        <div className="space-y-4 mb-10">
            <div className="flex justify-between items-center px-4">
                <h2 className="text-xl font-bold text-white border-l-4 border-purple pl-3 flex items-center gap-2">
                    {title}
                </h2>
                <button 
                    onClick={onViewAll}
                    className="text-xs text-purple font-bold hover:text-white flex items-center gap-1 transition-colors"
                >
                    View All <ChevronRight className="w-3 h-3" />
                </button>
            </div>
            
            <div className="flex overflow-x-auto gap-4 px-4 pb-4 no-scrollbar snap-x">
                {series.map(s => (
                    <div key={s.id} className="w-[160px] flex-shrink-0 snap-start">
                        <DiziCard 
                            series={s} 
                            onClick={() => onSeriesClick(s.id)} 
                            onAddToWatchlist={onAddToWatchlist} 
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};