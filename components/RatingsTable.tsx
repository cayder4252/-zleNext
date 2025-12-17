import React, { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { RatingRecord, Series } from '../types';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

interface RatingsTableProps {
  ratings: RatingRecord[]; // Kept for backwards compatibility/fallback
  series: Series[];
}

export const RatingsTable: React.FC<RatingsTableProps> = ({ ratings: initialRatings, series }) => {
  const [liveRatings, setLiveRatings] = useState<RatingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Use props as fallback or default
  const displayRatings = liveRatings.length > 0 ? liveRatings : initialRatings;

  useEffect(() => {
    // Connect to Firestore
    const q = query(collection(db, 'ratings'), orderBy('rank', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RatingRecord[];
      
      setLiveRatings(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching ratings:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getSeries = (id: string) => series.find(s => s.id === id);

  return (
    <div className="bg-navy-800 rounded-xl overflow-hidden border border-white/5 shadow-xl">
      <div className="p-4 border-b border-white/5 bg-navy-800">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          Daily Ratings <span className="text-xs font-normal text-purple px-2 py-0.5 bg-purple/10 rounded-full border border-purple/20">
            {loading ? 'Syncing...' : 'Live Data'}
          </span>
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-navy-900/50 text-gray-400 uppercase text-xs font-semibold tracking-wider">
            <tr>
              <th className="px-6 py-4">Rank</th>
              <th className="px-6 py-4">Show Title</th>
              <th className="px-6 py-4 hidden md:table-cell">Channel</th>
              <th className="px-6 py-4 text-right">Rating</th>
              <th className="px-6 py-4 text-right hidden md:table-cell">Share</th>
              <th className="px-6 py-4 text-center">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {[...displayRatings].sort((a, b) => a.rank - b.rank).map((record) => {
              const show = getSeries(record.series_id);
              // Handle case where series ID doesn't match mock data (fallback to mock show for demo if needed, or show basic text)
              const title = show?.title_tr || record.series_id;
              const titleEn = show?.title_en || '-';
              
              return (
                <tr key={record.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4 font-bold text-white text-lg">
                    {record.rank}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {show ? (
                         <img src={show.poster_url} alt="" className="w-8 h-12 object-cover rounded bg-navy-700" />
                      ) : (
                         <div className="w-8 h-12 bg-navy-700 rounded" />
                      )}
                      <div>
                        <div className="font-bold text-white group-hover:text-purple transition-colors">{title}</div>
                        <div className="text-xs text-gray-500">{titleEn}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-400 hidden md:table-cell">
                    {show?.network || '-'}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-white">
                    {record.rating?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-gray-400 hidden md:table-cell">
                    {record.share?.toFixed(2) || '0.00'}%
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
             {displayRatings.length === 0 && !loading && (
                <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        No ratings data available via Firebase.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};