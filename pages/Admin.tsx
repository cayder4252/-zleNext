import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Film, 
  Users, 
  Settings, 
  Upload, 
  Plus, 
  Search,
  CheckCircle,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { MOCK_SERIES, MOCK_RATINGS } from '../constants';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'SHOWS' | 'RATINGS' | 'USERS'>('DASHBOARD');

  // Admin styling is deliberately "Light Mode" per requirements
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 fixed h-full z-10">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <span className="text-xl font-bold tracking-tight text-navy-900">İZLE<span className="text-purple">ADMIN</span></span>
        </div>
        
        <nav className="p-4 space-y-1">
          <button 
            onClick={() => setActiveTab('DASHBOARD')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'DASHBOARD' ? 'bg-purple/10 text-purple' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('SHOWS')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'SHOWS' ? 'bg-purple/10 text-purple' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Film className="w-5 h-5" />
            Series Database
          </button>
          <button 
            onClick={() => setActiveTab('RATINGS')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'RATINGS' ? 'bg-purple/10 text-purple' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <TrendingUp className="w-5 h-5" />
            Rating Input
          </button>
          <button 
            onClick={() => setActiveTab('USERS')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'USERS' ? 'bg-purple/10 text-purple' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Users className="w-5 h-5" />
            User Manager
          </button>
          <button className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors mt-8">
            <Settings className="w-5 h-5" />
            Settings
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="ml-64 flex-1 p-8">
        {activeTab === 'DASHBOARD' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Command Center</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Total Series', val: '142', color: 'bg-blue-50 text-blue-700' },
                { label: 'Active Users', val: '12.4k', color: 'bg-green-50 text-green-700' },
                { label: 'Pending Reviews', val: '48', color: 'bg-orange-50 text-orange-700' },
                { label: 'Daily Visits', val: '89k', color: 'bg-purple-50 text-purple-700' }
              ].map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="text-sm text-gray-500 font-medium mb-1">{stat.label}</div>
                  <div className={`text-3xl font-bold ${stat.color.split(' ')[1]}`}>{stat.val}</div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h2 className="font-bold mb-4">Quick Actions</h2>
                <div className="flex gap-4">
                     <button className="flex items-center gap-2 px-4 py-2 bg-purple text-white rounded-lg hover:bg-purple-dark shadow-sm shadow-purple/30">
                        <Plus className="w-4 h-4" /> Add New Series
                     </button>
                     <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                        <Upload className="w-4 h-4" /> Upload Banners
                     </button>
                </div>
            </div>
          </div>
        )}

        {activeTab === 'SHOWS' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Series Editor</h1>
                <button className="bg-purple text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Create New
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Table Header */}
                <div className="p-4 border-b border-gray-200 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input type="text" placeholder="Search database..." className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple/50 focus:border-purple outline-none" />
                    </div>
                </div>
                
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3">Title</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Network</th>
                            <th className="px-6 py-3">Featured?</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {MOCK_SERIES.map(s => (
                            <tr key={s.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">{s.title_tr}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${s.status === 'Airing' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                        {s.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-600">{s.network}</td>
                                <td className="px-6 py-4">
                                    <input type="checkbox" checked={s.is_featured} readOnly className="w-4 h-4 text-purple rounded border-gray-300 focus:ring-purple" />
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-purple hover:underline font-medium">Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        )}

        {activeTab === 'RATINGS' && (
            <div className="space-y-6">
                 <h1 className="text-2xl font-bold text-gray-900">Rating Input Tool</h1>
                 <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm max-w-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg">Input Today's Data</h3>
                        <div className="flex items-center gap-2">
                             <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status: Draft</span>
                             <div className="w-3 h-3 rounded-full bg-yellow-400" />
                        </div>
                    </div>

                    <div className="space-y-4">
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input type="date" className="w-full border border-gray-300 rounded-lg p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select className="w-full border border-gray-300 rounded-lg p-2">
                                    <option>Total</option>
                                    <option>AB</option>
                                    <option>ABC1</option>
                                </select>
                            </div>
                         </div>
                         
                         <div className="border-t border-gray-100 pt-4 mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">CSV Upload (Bulk)</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple transition-colors cursor-pointer bg-gray-50">
                                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <span className="text-sm text-gray-500">Drag and drop your .csv file here</span>
                            </div>
                         </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        <button className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">Save Draft</button>
                        <button className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" /> Publish Ratings
                        </button>
                    </div>
                 </div>
            </div>
        )}
      </div>
    </div>
  );
};