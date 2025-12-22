
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, Film, Users, Plus, TrendingUp, Image as ImageIcon, Trash2, X, Edit2, Save, Globe, Mail, Phone, MapPin, ShieldCheck, ToggleLeft, ToggleRight, Wifi, PlayCircle, Activity, UserX, CheckSquare, Square, MoreHorizontal, AlertTriangle, Shield, Link as LinkIcon, Upload, Loader2
} from 'lucide-react';
import { db, storage } from '../firebase';
import { collection, onSnapshot, query, addDoc, doc, updateDoc, deleteDoc, writeBatch, orderBy, limit } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, listAll } from 'firebase/storage';
import { Series, User, RatingRecord, SiteConfig, ApiProvider } from '../types';
import { settingsService } from '../services/settingsService';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'SHOWS' | 'RATINGS' | 'USERS' | 'MEDIA' | 'SITE_CONFIG'>('DASHBOARD');
  
  const [stats, setStats] = useState({ series: 0, users: 0, reviews: 0, visits: 89000 });
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [images, setImages] = useState<{name: string, url: string, fullPath: string}[]>([]);
  
  const [isSeriesModalOpen, setIsSeriesModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingSeries, setEditingSeries] = useState<Partial<Series> | null>(null);
  const [genresInput, setGenresInput] = useState('');

  // Logo Upload State
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bulk Selection States
  const [selectedSeries, setSelectedSeries] = useState<Set<string>>(new Set());
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  // --- SITE CONFIG STATE ---
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isAddApiModalOpen, setIsAddApiModalOpen] = useState(false);
  const [newApi, setNewApi] = useState<ApiProvider>({ id: '', name: '', apiKey: '', isEnabled: true, description: '' });

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
    const unsubConfig = settingsService.subscribeToConfig((config) => {
        setSiteConfig(config);
    });

    return () => {
        unsubSeries(); unsubUsers(); unsubConfig();
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'MEDIA') fetchImages();
    setSelectedSeries(new Set());
    setSelectedUsers(new Set());
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !siteConfig) return;

    setIsUploadingLogo(true);
    try {
        const storageRef = ref(storage, `branding/logo_${Date.now()}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        setSiteConfig({ ...siteConfig, logoUrl: downloadURL });
    } catch (error) {
        console.error("Logo upload failed:", error);
        alert("Failed to upload logo. Please try again.");
    } finally {
        setIsUploadingLogo(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!siteConfig) return;
    setIsSavingConfig(true);
    try {
      await settingsService.updateConfig(siteConfig);
      alert("Website configuration saved to Firebase successfully!");
    } catch (e) { alert("Save failed."); } finally { setIsSavingConfig(false); }
  };

  const updateApiProvider = (id: string, updates: Partial<ApiProvider>) => {
    if (!siteConfig) return;
    const newProviders = siteConfig.apiProviders.map(p => p.id === id ? { ...p, ...updates } : p);
    setSiteConfig({ ...siteConfig, apiProviders: newProviders });
  };

  const addApiProvider = () => {
    if (!siteConfig || !newApi.id || !newApi.name) return;
    const newProviders = [...siteConfig.apiProviders, newApi];
    setSiteConfig({ ...siteConfig, apiProviders: newProviders });
    setNewApi({ id: '', name: '', apiKey: '', isEnabled: true, description: '' });
    setIsAddApiModalOpen(false);
  };

  const removeApiProvider = (id: string) => {
    if (!siteConfig) return;
    if (confirm(`Are you sure you want to remove the ${id} API provider?`)) {
      const newProviders = siteConfig.apiProviders.filter(p => p.id !== id);
      setSiteConfig({ ...siteConfig, apiProviders: newProviders });
    }
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

  const toggleSelectSeries = (id: string) => {
    const next = new Set(selectedSeries);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedSeries(next);
  };

  const toggleSelectAllSeries = () => {
    if (selectedSeries.size === seriesList.length) setSelectedSeries(new Set());
    else setSelectedSeries(new Set(seriesList.map(s => s.id)));
  };

  const deleteBulkSeries = async () => {
    if (!confirm(`Delete ${selectedSeries.size} series? This cannot be undone.`)) return;
    const batch = writeBatch(db);
    selectedSeries.forEach(id => {
      batch.delete(doc(db, 'series', id));
    });
    await batch.commit();
    setSelectedSeries(new Set());
  };

  const toggleSelectUser = (id: string) => {
    const next = new Set(selectedUsers);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedUsers(next);
  };

  const toggleSelectAllUsers = () => {
    if (selectedUsers.size === usersList.length) setSelectedUsers(new Set());
    else setSelectedUsers(new Set(usersList.map(u => u.id)));
  };

  const banBulkUsers = async () => {
    if (!confirm(`Restrict access for ${selectedUsers.size} users?`)) return;
    const batch = writeBatch(db);
    selectedUsers.forEach(id => {
      batch.update(doc(db, 'users', id), { isBanned: true, role: 'USER' });
    });
    await batch.commit();
    setSelectedUsers(new Set());
  };

  const deleteBulkUsers = async () => {
    if (!confirm(`Permanently delete ${selectedUsers.size} users?`)) return;
    const batch = writeBatch(db);
    selectedUsers.forEach(id => {
      batch.delete(doc(db, 'users', id));
    });
    await batch.commit();
    setSelectedUsers(new Set());
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

      <div className="ml-64 flex-1 p-8 pb-32">
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
          </div>
        )}

        {activeTab === 'SITE_CONFIG' && siteConfig && (
            <div className="space-y-8 max-w-4xl animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between items-end border-b border-gray-200 pb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Website Management</h1>
                        <p className="text-sm text-gray-500 mt-1">Configure global identity, branding, and contact details.</p>
                    </div>
                    <button 
                        onClick={handleSaveConfig}
                        disabled={isSavingConfig}
                        className="bg-purple hover:bg-purple-dark text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-purple/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isSavingConfig ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save All Settings</>}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Site Identity Card */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2 border-b border-gray-50 pb-3"><Globe className="w-4 h-4 text-purple" /> Site Identity</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Primary Brand</label>
                                <input type="text" value={siteConfig.siteName} onChange={e => setSiteConfig({...siteConfig, siteName: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-purple/10" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Suffix (Optional)</label>
                                <input type="text" value={siteConfig.siteNamePart2} onChange={e => setSiteConfig({...siteConfig, siteNamePart2: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-purple/10" />
                            </div>
                        </div>
                    </div>

                    {/* Logo & Branding Card */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2 border-b border-gray-50 pb-3"><ImageIcon className="w-4 h-4 text-purple" /> Logo & Branding</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Logo Direct URL</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={siteConfig.logoUrl || ''} 
                                        onChange={e => setSiteConfig({...siteConfig, logoUrl: e.target.value})} 
                                        placeholder="https://..." 
                                        className="flex-1 border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-purple/10" 
                                    />
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploadingLogo}
                                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                                        title="Upload from computer"
                                    >
                                        {isUploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                    </button>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        accept="image/*" 
                                        onChange={handleLogoUpload} 
                                    />
                                </div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4 border border-dashed border-gray-200 flex flex-col items-center">
                                <span className="text-[9px] font-black text-gray-400 uppercase mb-2">Live Logo Preview</span>
                                {siteConfig.logoUrl ? (
                                    <img src={siteConfig.logoUrl} className="h-10 object-contain drop-shadow-sm" alt="Logo Preview" />
                                ) : (
                                    <div className="h-10 flex items-center justify-center text-gray-300 italic text-xs">No logo set</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Contact Information Card */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2 border-b border-gray-50 pb-3"><Mail className="w-4 h-4 text-purple" /> Contact Information</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Support Email</label>
                                <input type="email" value={siteConfig.contactEmail} onChange={e => setSiteConfig({...siteConfig, contactEmail: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-purple/10" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Phone Number</label>
                                <input type="text" value={siteConfig.contactPhone} onChange={e => setSiteConfig({...siteConfig, contactPhone: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-purple/10" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Address</label>
                                <textarea rows={1} value={siteConfig.address} onChange={e => setSiteConfig({...siteConfig, address: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none resize-none focus:ring-2 focus:ring-purple/10" />
                            </div>
                        </div>
                    </div>

                    {/* API Connectors Section */}
                    <div className="md:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                        <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2"><Wifi className="w-4 h-4 text-purple" /> API Connectors</h3>
                            <button onClick={() => setIsAddApiModalOpen(true)} className="text-xs font-bold bg-purple/10 text-purple px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-purple/20">
                                <Plus className="w-3 h-3" /> Add Provider
                            </button>
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
                                                <button 
                                                  onClick={() => removeApiProvider(provider.id)}
                                                  className="ml-auto opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                                                >
                                                  <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-500">{provider.description}</p>
                                        </div>
                                        <div className="flex-[2] space-y-2">
                                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">API Secret Key</label>
                                            <input 
                                                type="password" 
                                                value={provider.apiKey} 
                                                onChange={e => updateApiProvider(provider.id, { apiKey: e.target.value })}
                                                className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs font-mono outline-none focus:ring-2 focus:ring-purple/10"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Existing SHOWS, USERS, and MEDIA tabs remain the same... */}
        {activeTab === 'SHOWS' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Series Editor</h1>
                <button onClick={() => handleOpenSeriesModal()} className="bg-purple text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-purple/10 transition-transform active:scale-95"><Plus className="w-4 h-4" /> Create New</button>
            </div>

            {selectedSeries.size > 0 && (
              <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white px-6 py-4 rounded-2xl shadow-2xl border border-gray-200 flex items-center gap-6 animate-in slide-in-from-bottom-4 z-40 ring-1 ring-black/5">
                <div className="flex items-center gap-3 pr-6 border-r border-gray-100">
                  <div className="w-8 h-8 bg-purple/10 rounded-lg flex items-center justify-center text-purple font-bold text-sm">
                    {selectedSeries.size}
                  </div>
                  <span className="text-sm font-bold text-gray-700 whitespace-nowrap">Series Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={deleteBulkSeries} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors">
                    <Trash2 className="w-4 h-4" /> Delete Selected
                  </button>
                  <button onClick={() => setSelectedSeries(new Set())} className="px-4 py-2 text-gray-400 hover:text-gray-600 text-xs font-bold transition-colors">
                    Deselect All
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 w-10">
                            <button onClick={toggleSelectAllSeries} className="text-gray-400 hover:text-purple">
                              {selectedSeries.size === seriesList.length && seriesList.length > 0 ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                            </button>
                          </th>
                          <th className="px-6 py-3">Poster</th>
                          <th className="px-6 py-3">Title</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3">Network</th>
                          <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {seriesList.map(s => (
                            <tr key={s.id} className={`hover:bg-gray-50 transition-colors ${selectedSeries.has(s.id) ? 'bg-purple/5' : ''}`}>
                                <td className="px-6 py-4">
                                  <button onClick={() => toggleSelectSeries(s.id)} className={`transition-colors ${selectedSeries.has(s.id) ? 'text-purple' : 'text-gray-300'}`}>
                                    {selectedSeries.has(s.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                  </button>
                                </td>
                                <td className="px-6 py-4"><img src={s.poster_url} className="w-10 h-14 object-cover rounded shadow-sm bg-gray-200" alt="" /></td>
                                <td className="px-6 py-4">
                                  <div className="font-bold text-gray-900">{s.title_tr}</div>
                                  <div className="text-xs text-gray-400">{s.title_en}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${s.status === 'Airing' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {s.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-gray-500 font-medium">{s.network}</td>
                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                    <button onClick={() => handleOpenSeriesModal(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => { if(confirm('Delete this series?')) deleteDoc(doc(db, 'series', s.id)) }} className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        )}

        {activeTab === 'USERS' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">User Manager</h1>
                <div className="flex items-center gap-4 text-sm text-gray-500 bg-white px-4 py-2 rounded-lg border border-gray-200">
                  <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {usersList.length} Total Users</span>
                </div>
            </div>

            {selectedUsers.size > 0 && (
              <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white px-6 py-4 rounded-2xl shadow-2xl border border-gray-200 flex items-center gap-6 animate-in slide-in-from-bottom-4 z-40 ring-1 ring-black/5">
                <div className="flex items-center gap-3 pr-6 border-r border-gray-100">
                  <div className="w-8 h-8 bg-purple/10 rounded-lg flex items-center justify-center text-purple font-bold text-sm">
                    {selectedUsers.size}
                  </div>
                  <span className="text-sm font-bold text-gray-700 whitespace-nowrap">Users Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={banBulkUsers} className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-xl text-xs font-bold hover:bg-orange-100 transition-colors">
                    <UserX className="w-4 h-4" /> Ban Selected
                  </button>
                  <button onClick={deleteBulkUsers} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors">
                    <Trash2 className="w-4 h-4" /> Delete Selected
                  </button>
                  <button onClick={() => setSelectedUsers(new Set())} className="px-4 py-2 text-gray-400 hover:text-gray-600 text-xs font-bold transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 w-10">
                            <button onClick={toggleSelectAllUsers} className="text-gray-400 hover:text-purple">
                              {selectedUsers.size === usersList.length && usersList.length > 0 ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                            </button>
                          </th>
                          <th className="px-6 py-3">User</th>
                          <th className="px-6 py-3">Role</th>
                          <th className="px-6 py-3">Joined</th>
                          <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {usersList.map(u => (
                            <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${selectedUsers.has(u.id) ? 'bg-purple/5' : ''}`}>
                                <td className="px-6 py-4">
                                  <button onClick={() => toggleSelectUser(u.id)} className={`transition-colors ${selectedUsers.has(u.id) ? 'text-purple' : 'text-gray-300'}`}>
                                    {selectedUsers.has(u.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                  </button>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-purple/10 text-purple rounded-full flex items-center justify-center font-bold text-xs overflow-hidden">
                                      {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" /> : u.name.charAt(0)}
                                    </div>
                                    <div>
                                      <div className="font-bold text-gray-900 flex items-center gap-1.5">
                                        {u.name}
                                        {(u as any).isBanned && <Shield className="w-3 h-3 text-red-500 fill-current" title="Banned" />}
                                      </div>
                                      <div className="text-xs text-gray-500">{u.email}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${u.role === 'ADMIN' ? 'bg-purple text-white shadow-sm' : 'bg-gray-100 text-gray-500'}`}>
                                    {u.role}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-gray-500 text-xs">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}</td>
                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                    <button onClick={() => updateDoc(doc(db, 'users', u.id), { role: u.role === 'ADMIN' ? 'USER' : 'ADMIN' })} className="p-2 text-purple hover:bg-purple/5 rounded transition-colors" title="Toggle Admin">
                                      {u.role === 'ADMIN' ? <ShieldCheck className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                                    </button>
                                    <button onClick={() => { if(confirm('Restrict this user?')) updateDoc(doc(db, 'users', u.id), { isBanned: true }) }} className="p-2 text-orange-600 hover:bg-orange-50 rounded transition-colors"><UserX className="w-4 h-4" /></button>
                                    <button onClick={() => { if(confirm('Permanently delete user?')) deleteDoc(doc(db, 'users', u.id)) }} className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        )}
      </div>

      {isAddApiModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold">Add API Provider</h3>
                      <button onClick={() => setIsAddApiModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">ID (e.g. netflix, prime)</label>
                          <input type="text" value={newApi.id} onChange={e => setNewApi({...newApi, id: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
                          <input type="text" value={newApi.name} onChange={e => setNewApi({...newApi, name: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                          <input type="text" value={newApi.description} onChange={e => setNewApi({...newApi, description: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Initial API Key</label>
                          <input type="password" value={newApi.apiKey} onChange={e => setNewApi({...newApi, apiKey: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none" />
                      </div>
                      <button 
                        onClick={addApiProvider}
                        className="w-full bg-purple text-white font-bold py-3 rounded-lg mt-4 shadow-lg shadow-purple/20 transition-all active:scale-95"
                      >
                          Add Provider
                      </button>
                  </div>
              </div>
          </div>
      )}

      {isSeriesModalOpen && editingSeries && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                      <h3 className="text-lg font-bold">{editingSeries.id ? 'Edit Series' : 'New Series'}</h3>
                      <button onClick={() => setIsSeriesModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                  </div>
                  <form onSubmit={handleSaveSeries} className="p-6 space-y-6">
                      <div className="space-y-4">
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
                      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                          <button type="button" onClick={() => setIsSeriesModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                          <button type="submit" className="px-6 py-2 bg-purple text-white font-bold rounded hover:bg-purple-dark transition-all active:scale-95 shadow-lg shadow-purple/10">Save Changes</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
