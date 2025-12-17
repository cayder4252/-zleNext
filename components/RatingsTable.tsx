import React, { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown, Minus, TrendingUp } from 'lucide-react';
import { RatingRecord, Series } from '../types';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { tmdb } from '../services/tmdb';

interface RatingsTableProps {
  ratings: RatingRecord[];
  series: Series[]; // Passed from parent (usually daily trending)
}

export const RatingsTable: React.FC<RatingsTableProps> = ({ ratings: firestoreRatings, series: initialSeries }) => {
  const [activeTab, setActiveTab] = useState<'DAILY_TV' | 'WEEKLY_TV' | 'WEEKLY_MOVIES'>('DAILY_TV');
  const [dataList, setDataList] = useState<Series[]>([]);
  const [loading, setLoading] = useState(false);

  // Fallback to initialSeries if in Daily TV mode, otherwise fetch
  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'DAILY_TV') {
                 // Use passed prop if available and recent, or fetch
                 if (initialSeries.length > 0) {
                     setDataList(initialSeries);
                 } else {
                     const data = await tmdb.getTrendingSeries('day');
                     setDataList(data);
                 }
            } else if (activeTab === 'WEEKLY_TV') {
                 const data = await tmdb.getTrendingSeries('week');
                 setDataList(data);
            } else if (activeTab === 'WEEKLY_MOVIES') {
                 const data = await tmdb.getTrendingMovies('week');
                 setDataList(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, [activeTab, initialSeries]);

  // Transform Series to Rating Record format for display
  const displayRatings = dataList.slice(0, 10).map((item, index) => {
      // Simulate trend based on index (just for visual variety in demo, normally needs historical data)
      const trend = index < 3 ? 'up' : index > 7 ? 'down' : 'stable'; 
      return {
          id: item.id,
          rank: index + 1,
          series: item,
          rating: item.rating,
          trend: trend
      };
  });

  return (
    <div className="bg-navy-800 rounded-xl overflow-hidden border border-white/5 shadow-xl">
      <div className="p-4 border-b border-white/5 bg-navy-800 flex flex-col md:flex-row justify-between items-center gap-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <TrendingUp className="text-purple w-5 h-5" />
          Top Trending
        </h3>
        
        <div className="flex bg-navy-900 rounded-lg p-1 border border-white/5">
            <button 
                onClick={() => setActiveTab('DAILY_TV')} 
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'DAILY_TV' ? 'bg-purple text-white shadow' : 'text-gray-400 hover:text-white'}`}
            >
                Daily TV
            </button>
            <button 
                onClick={() => setActiveTab('WEEKLY_TV')} 
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'WEEKLY_TV' ? 'bg-purple text-white shadow' : 'text-gray-400 hover:text-white'}`}
            >
                Weekly TV
            </button>
            <button 
                onClick={() => setActiveTab('WEEKLY_MOVIES')} 
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'WEEKLY_MOVIES' ? 'bg-purple text-white shadow' : 'text-gray-400 hover:text-white'}`}
            >
                Top Movies
            </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-navy-900/50 text-gray-400 uppercase text-xs font-semibold tracking-wider">
            <tr>
              <th className="px-6 py-4">Rank</th>
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4 hidden md:table-cell">Network / Origin</th>
              <th className="px-6 py-4 text-right">TMDb Score</th>
              <th className="px-6 py-4 text-center">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
                <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">Loading charts...</td>
                </tr>
            ) : displayRatings.map((record) => {
              const show = record.series;
              return (
                <tr key={record.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="w-8 h-8 flex items-center justify-center font-bold text-white bg-navy-700 rounded-full border border-white/5 shadow-inner">
                        {record.rank}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={show.poster_url} alt="" className="w-8 h-12 object-cover rounded bg-navy-700 shadow-sm" />
                      <div>
                        <div className="font-bold text-white group-hover:text-purple transition-colors truncate max-w-[150px] md:max-w-none">{show.title_tr}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[150px] md:max-w-none">{show.title_en}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-400 hidden md:table-cell">
                    {show.network}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-white">
                    <div className="inline-flex items-center gap-1 bg-white/5 px-2 py-1 rounded">
                        <span className={record.rating >= 8 ? 'text-green-400' : record.rating >= 6 ? 'text-yellow-400' : 'text-gray-400'}>
                            {record.rating.toFixed(1)}
                        </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center">
                      {record.trend === 'up' && <ArrowUp className="w-4 h-4 text-green-500" />}
                      {record.trend === 'down' && <ArrowDown className="w-4 h-4 text-red-500" />}
                      {record.trend === 'stable' && <Minus className="w-4 h-4 text-gray-500" />}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};