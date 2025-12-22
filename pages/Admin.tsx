
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Film, Users, Settings, Upload, Plus, Search, CheckCircle, TrendingUp, Image as ImageIcon, Copy, Trash2, X, Edit2, Save, Clock, ExternalLink, Database, Eye, Link as LinkIcon, Globe, Mail, Phone, MapPin, ShieldCheck, ToggleLeft, ToggleRight, Wifi, Shield,
  /* Added missing icons */
  PlayCircle, Activity
} from 'lucide-react';
import { db, storage } from '../firebase';
import { collection, onSnapshot, query, where, addDoc, doc, updateDoc, deleteDoc, orderBy, limit, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { Series, User, RatingRecord, SiteConfig, ApiProvider } from '../types';
import { MOCK_SERIES, MOCK_RATINGS } from '../constants';
import { settingsService } from '../services/settingsService';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'SHOWS' | 'RATINGS' | 'USERS' | 'MEDIA' | 'SITE_CONFIG'>('DASHBOARD');
  
  const [stats, setStats] = useState({ series: 0, users: 0, reviews: 0, visits: 89000 });
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [recentRatings, setRecentRatings] = useState<RatingRecord[]>([]);
  const [images, setImages] = useState<{name: string, url: string, fullPath: string}[]>([]);
  
  const [isSeriesModalOpen, setIsSeriesModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingSeries, setEditingSeries] = useState<Partial<Series> | null>(null);
  const [genresInput, setGenresInput] = useState('');

  // --- SITE CONFIG STATE ---
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  useEffect(() => {
    const unsubSeries = onSnapshot(collection(db, 'series'), (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Series));
        setSeriesList(list);
        setStats(prev => ({ ...prev, series: snapshot.size }));
    });
    const unsubUsers = onSnapshot(query(collection(db, 'users'), orderBy('createdAt', 'desc')), (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setUsersList(list);
        setStats(prev => ({ ...prev, users: snapshot.size }));
    });
    const unsubRatings = onSnapshot(query(collection(db, 'ratings'), orderBy('date', 'desc'), limit(20)), (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RatingRecord));
        setRecentRatings(list);
    });
    const unsubConfig = settingsService.subscribeToConfig((config) => {
        setSiteConfig(config);
    });

    return () => {
        unsubSeries(); unsubUsers(); unsubRatings(); unsubConfig();
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'MEDIA') fetchImages();
  }, [activeTab]);

  const fetchImages = async () => {
    const listRef = ref(storage, 'uploads/');
    try {
      const res = await listAll(listRef);
      const urlPromises = res.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        return { name: itemRef.name, url, fullPath: itemRef.fullPath };
      });
      const imageUrls = await Promise.all(urlPromises);
      setImages(imageUrls);
    } catch (e) {}
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploading(true);
      const file = e.target.files[0];
      const storageRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
      try {
        await uploadBytes(storageRef, file);
        await fetchImages();
      } catch (error) { alert("Upload failed."); } finally { setUploading(false); }
    }
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      alert("URL copied!");
  };

  const handleSaveConfig = async () => {
    if (!siteConfig) return;
    setIsSavingConfig(true);
    try {
      await settingsService.updateConfig(siteConfig);
      alert("Website configuration saved successfully!");
    } catch (e) { alert("Save failed."); } finally { setIsSavingConfig(false); }
  };

  const updateApiProvider = (id: string, updates: Partial<ApiProvider>) => {
    if (!siteConfig) return;
    const newProviders = siteConfig.apiProviders.map(p => p.id === id ? { ...p, ...updates } : p);
    setSiteConfig({ ...siteConfig, apiProviders: newProviders });
  };

  const handleOpenSeriesModal = (series?: Series) => {
      if (series) {
          setEditingSeries(series);
          setGenresInput(series.genres?.join(', ') || '');
      } else {
          setEditingSeries({ title_tr: '', title_en: '', synopsis: '', status: 'Airing', network: '', poster_url: '', banner_url: '', rating: 0, episodes_total: 0, episodes_aired: 0, is_featured: false, social_links: {} });
          setGenresInput('');
      }
      setIsSeriesModalOpen(true);
  };

  const handleSaveSeries = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingSeries) return;
      try {
          const genresArray = genresInput.split(',').map(g => g.trim()).filter(g => g !== '');
          const dataToSave = { ...editingSeries, genres: genresArray, social_links: editingSeries.social_links || {} };
          if (editingSeries.id) await updateDoc(doc(db, 'series', editingSeries.id), dataToSave);
          else await addDoc(collection(db, 'series'), dataToSave);
          setIsSeriesModalOpen(false);
          setEditingSeries(null);
      } catch (e) { alert("Save failed."); }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex">
      <aside className="w-64 bg-white border-r border-gray-200 fixed h-full z-10 overflow-y-auto shadow-sm">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <span className="text-xl font-bold tracking-tight text-navy-900">
            {siteConfig?.siteName}<span className="text-purple">{siteConfig?.siteNamePart2 || 'ADMIN'}</span>
          </span>
        </div>
        <nav className="p-4 space-y-1">
          {[
              { id: 'DASHBOARD', icon: LayoutDashboard, label: 'Dashboard' },
              { id: 'SITE_CONFIG', icon: Globe, label: 'Site Management' },
              { id: 'SHOWS', icon: Film, label: 'Series Database' },
              { id: 'MEDIA', icon: ImageIcon, label: 'Media Library' },
              { id: 'RATINGS', icon: TrendingUp, label: 'Rating Input' },
              { id: 'USERS', icon: Users, label: 'User Manager' },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === item.id ? 'bg-purple/10 text-purple' : 'text-gray-600 hover:bg-gray-50'}`}>
                <item.icon className="w-5 h-5" />{item.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="ml-64 flex-1 p-8">
        {activeTab === 'DASHBOARD' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Command Center</h1>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Total Series', val: stats.series, color: 'text-blue-600' },
                { label: 'Registered Users', val: stats.users, color: 'text-green-600' },
                { label: 'Media Assets', val: images.length, color: 'text-orange-600' },
                { label: 'Daily Visits', val: '89k', color: 'text-purple-600' }
              ].map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="text-sm text-gray-500 font-medium mb-1">{stat.label}</div>
                  <div className={`text-3xl font-bold ${stat.color}`}>{stat.val}</div>
                </div>
              ))}
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h2 className="font-bold mb-4 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-purple" /> System Status</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {siteConfig?.apiProviders.map(p => (
                        <div key={p.id} className="p-4 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${p.isEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                                <span className="font-bold text-sm">{p.name} Connector</span>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${p.isEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                {p.isEnabled ? 'LIVE' : 'DISABLED'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        )}

        {/* --- NEW SITE CONFIG TAB --- */}
        {activeTab === 'SITE_CONFIG' && siteConfig && (
            <div className="space-y-8 max-w-4xl animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between items-end border-b border-gray-200 pb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Website Management</h1>
                        <p className="text-sm text-gray-500 mt-1">Configure global identity, contact details, and API connectors.</p>
                    </div>
                    <button 
                        onClick={handleSaveConfig}
                        disabled={isSavingConfig}
                        className="bg-purple hover:bg-purple-dark text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-purple/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isSavingConfig ? 'Saving...' : <><Save className="w-4 h-4" /> Save All Settings</>}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Identity Section */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2 border-b border-gray-50 pb-3"><Globe className="w-4 h-4 text-purple" /> Site Identity</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Primary Brand</label>
                                <input type="text" value={siteConfig.siteName} onChange={e => setSiteConfig({...siteConfig, siteName: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple/20 focus:border-purple outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Suffix (Optional)</label>
                                <input type="text" value={siteConfig.siteNamePart2} onChange={e => setSiteConfig({...siteConfig, siteNamePart2: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple/20 focus:border-purple outline-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Logo URL (Icon fallback if empty)</label>
                            <div className="flex gap-3">
                                <input type="text" value={siteConfig.logoUrl || ''} onChange={e => setSiteConfig({...siteConfig, logoUrl: e.target.value})} className="flex-1 border border-gray-200 rounded-lg p-2.5 text-sm outline-none" placeholder="https://..." />
                                <div className="w-10 h-10 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center">
                                    {siteConfig.logoUrl ? <img src={siteConfig.logoUrl} className="w-8 h-8 object-contain" /> : <PlayCircle className="w-5 h-5 text-gray-400" />}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Info Section */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2 border-b border-gray-50 pb-3"><Mail className="w-4 h-4 text-purple" /> Contact & Location</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Mail className="w-3 h-3" /> Support Email</label>
                                <input type="email" value={siteConfig.contactEmail} onChange={e => setSiteConfig({...siteConfig, contactEmail: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Phone className="w-3 h-3" /> Business Phone</label>
                                <input type="text" value={siteConfig.contactPhone} onChange={e => setSiteConfig({...siteConfig, contactPhone: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Office Address</label>
                                <input type="text" value={siteConfig.address} onChange={e => setSiteConfig({...siteConfig, address: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none" />
                            </div>
                        </div>
                    </div>

                    {/* API Connectors Section */}
                    <div className="md:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                        <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2"><Wifi className="w-4 h-4 text-purple" /> API Management (Integrations)</h3>
                            <span className="text-[10px] text-gray-500 italic">Caution: Updating keys affects data fetching immediately.</span>
                        </div>
                        <div className="space-y-4">
                            {siteConfig.apiProviders.map(provider => (
                                <div key={provider.id} className="group bg-gray-50/50 hover:bg-white p-4 rounded-xl border border-gray-100 transition-all hover:shadow-md">
                                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-gray-900">{provider.name}</h4>
                                                <button 
                                                    onClick={() => updateApiProvider(provider.id, { isEnabled: !provider.isEnabled })}
                                                    className={`transition-colors ${provider.isEnabled ? 'text-green-600' : 'text-gray-400'}`}
                                                >
                                                    {provider.isEnabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-500">{provider.description}</p>
                                        </div>
                                        <div className="flex-[2] space-y-2">
                                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">API Secret Key / Access Token</label>
                                            <div className="relative">
                                                <input 
                                                    type="password" 
                                                    value={provider.apiKey} 
                                                    onChange={e => updateApiProvider(provider.id, { apiKey: e.target.value })}
                                                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs font-mono outline-none focus:ring-2 focus:ring-purple/10"
                                                />
                                                <div className="absolute right-2 top-2 p-1 bg-gray-100 rounded text-[10px] font-bold text-gray-500">ENCRYPTED</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Social Media Links */}
                    <div className="md:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2 border-b border-gray-50 pb-3"><Activity className="w-4 h-4 text-purple" /> Social Links</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {['facebook', 'instagram', 'twitter', 'youtube'].map(social => (
                                <div key={social}>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 capitalize">{social}</label>
                                    <input 
                                        type="text" 
                                        value={siteConfig.socialLinks[social as keyof typeof siteConfig.socialLinks] || ''} 
                                        onChange={e => setSiteConfig({
                                            ...siteConfig, 
                                            socialLinks: {...siteConfig.socialLinks, [social]: e.target.value}
                                        })} 
                                        placeholder={`https://${social}.com/...`}
                                        className="w-full border border-gray-200 rounded-lg p-2.5 text-xs outline-none" 
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- SHOWS & OTHER TABS --- */}
        {activeTab === 'SHOWS' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Series Editor</h1>
                <button onClick={() => handleOpenSeriesModal()} className="bg-purple text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus className="w-4 h-4" /> Create New</button>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                        <tr><th className="px-6 py-3">Poster</th><th className="px-6 py-3">Title</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Network</th><th className="px-6 py-3 text-right">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {seriesList.map(s => (
                            <tr key={s.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4"><img src={s.poster_url} className="w-10 h-14 object-cover rounded shadow-sm bg-gray-200" alt="" /></td>
                                <td className="px-6 py-4 font-medium text-gray-900">{s.title_tr}</td>
                                <td className="px-6 py-4">{s.status}</td>
                                <td className="px-6 py-4 text-gray-600">{s.network}</td>
                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                    <button onClick={() => handleOpenSeriesModal(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="w-4 h-4" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        )}
      </div>

      {isSeriesModalOpen && editingSeries && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                      <h3 className="text-lg font-bold">{editingSeries.id ? 'Edit Series' : 'New Series'}</h3>
                      <button onClick={() => setIsSeriesModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                  </div>
                  <form onSubmit={handleSaveSeries} className="p-6 space-y-6">
                      <div className="space-y-4 border-b border-gray-100 pb-6">
                          <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Basic Information</h4>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Turkish Title</label>
                                  <input required type="text" value={editingSeries.title_tr} onChange={e => setEditingSeries({...editingSeries, title_tr: e.target.value})} className="w-full border border-gray-300 rounded p-2" />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">English Title</label>
                                  <input type="text" value={editingSeries.title_en} onChange={e => setEditingSeries({...editingSeries, title_en: e.target.value})} className="w-full border border-gray-300 rounded p-2" />
                              </div>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Synopsis</label>
                              <textarea required rows={3} value={editingSeries.synopsis} onChange={e => setEditingSeries({...editingSeries, synopsis: e.target.value})} className="w-full border border-gray-300 rounded p-2" />
                          </div>
                      </div>
                      <div className="flex justify-end gap-3 pt-4">
                          <button type="button" onClick={() => setIsSeriesModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                          <button type="submit" className="px-6 py-2 bg-purple text-white font-bold rounded hover:bg-purple-dark">Save Changes</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
