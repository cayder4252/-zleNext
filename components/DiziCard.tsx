import React from 'react';
import { Plus, Star } from 'lucide-react';
import { Series } from '../types';

interface DiziCardProps {
  series: Series;
  onAddToWatchlist: (id: string) => void;
  onClick?: () => void;
}

export const DiziCard: React.FC<DiziCardProps> = ({ series, onAddToWatchlist, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="group relative w-full aspect-[2/3] rounded-lg overflow-hidden bg-navy-800 shadow-lg cursor-pointer transition-transform duration-300 hover:scale-[1.02] hover:shadow-purple/20 hover:shadow-2xl"
    >
      {/* Background Image */}
      <img 
        src={series.poster_url} 
        alt={series.title_tr} 
        className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-40"
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-transparent to-transparent opacity-90" />

      {/* Top Right Quick Add */}
      <button 
        onClick={(e) => {
            e.stopPropagation();
            onAddToWatchlist(series.id);
        }}
        className="absolute top-2 right-2 p-2 bg-navy-900/80 backdrop-blur rounded-full text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-purple"
      >
        <Plus className="w-5 h-5" />
      </button>

      {/* Content */}
      <div className="absolute bottom-0 left-0 w-full p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
        
        {/* Rating Badge */}
        <div className="flex items-center gap-1 text-yellow-400 text-xs font-bold mb-2 opacity-0 group-hover:opacity-100 transition-opacity delay-75">
          <Star className="w-3 h-3 fill-current" />
          <span>{series.rating}</span>
        </div>

        <h3 className="text-white font-bold text-lg leading-tight mb-1 truncate">{series.title_tr}</h3>
        <p className="text-gray-400 text-xs mb-2 truncate">{series.title_en}</p>
        
        {/* Hover Extra Info */}
        <div className="h-0 group-hover:h-auto overflow-hidden opacity-0 group-hover:opacity-100 transition-all duration-300">
            <p className="text-gray-300 text-xs line-clamp-2 mb-2">{series.synopsis}</p>
            <div className="w-full bg-navy-700 h-1 rounded-full overflow-hidden">
                <div 
                    className="bg-purple h-full" 
                    style={{ width: `${(series.episodes_aired / series.episodes_total) * 100}%` }} 
                />
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>{series.episodes_aired}/{series.episodes_total} Watched</span>
            </div>
        </div>
      </div>
      
      {/* Network Badge */}
      <div className="absolute top-2 left-2 px-2 py-1 bg-purple text-[10px] font-bold text-white rounded shadow-sm">
        {series.network}
      </div>
    </div>
  );
};