import React, { useState, useEffect } from 'react';
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
  Image as ImageIcon,
  Copy,
  Trash2,
  X,
  Edit2,
  Save,
  Clock,
  ExternalLink
} from 'lucide-react';
import { db, storage } from '../firebase';
import { collection, onSnapshot, query, where, addDoc, doc, updateDoc, deleteDoc, orderBy, limit, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { Series, User, RatingRecord } from '../types';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'SHOWS' | 'RATINGS' | 'USERS' | 'MEDIA' | 'SETTINGS'>('DASHBOARD');
  
  // --- STATE ---
  const [stats, setStats] = useState({ series: 0, users: 0, reviews: 0, visits: 89000 });
  
  // Data Lists
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [recentRatings, setRecentRatings] = useState<RatingRecord[]>([]);
  const [images, setImages] = useState<{name: string, url: string, fullPath: string}[]>([]);
  
  // Forms & Modals
  const [isSeriesModalOpen, setIsSeriesModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false); // Global upload state
  const [modalUploading, setModalUploading] = useState<'poster' | 'banner' | null>(null); // Specific modal upload state
  const [editingSeries, setEditingSeries] = useState<Partial<Series> | null>(null);
  
  // Ratings Form State
  const [ratingForm, setRatingForm] = useState({
    date: new Date().toISOString().split('T')[0],
    series_id: '',
    category: 'Total',
    rating: '',
    share: '',
    rank: ''
  });

  // Settings Form State
  const [settings, setSettings] = useState({
    siteName: 'İzleNext',
    maintenanceMode: false,
    featuredSeriesId: ''
  });

  // --- LISTENERS ---
  useEffect(() => {
    // 1. Series
    const unsubSeries = onSnapshot(collection(db, 'series'), (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Series));
        setSeriesList(list);
        setStats(prev => ({ ...prev, series: snapshot.size }));
    });

    // 2. Users
    const unsubUsers = onSnapshot(query(collection(db, 'users'), orderBy('createdAt', 'desc')), (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setUsersList(list);
        setStats(prev => ({ ...prev, users: snapshot.size }));
    });

    // 3. Ratings (Recent 20)
    const unsubRatings = onSnapshot(query(collection(db, 'ratings'), orderBy('date', 'desc'), limit(20)), (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RatingRecord));
        setRecentRatings(list);
    });

    // 4. Settings
    const unsubSettings = onSnapshot(doc(db, 'settings', 'general'), (doc) => {
        if (doc.exists()) {
            setSettings(doc.data() as any);
        }
    });

    return () => {
        unsubSeries();
        unsubUsers();
        unsubRatings();
        unsubSettings();
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'MEDIA') fetchImages();
  }, [activeTab]);

  // --- ACTIONS: MEDIA ---
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
    } catch (error) {
      console.error("Error fetching images", error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploading(true);
      const file = e.target.files[0];
      const storageRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
      try {
        await uploadBytes(storageRef, file);
        await fetchImages();
      } catch (error) {
        console.error("Upload failed", error);
        alert("Upload failed.");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleDeleteImage = async (fullPath: string) => {
    if (window.confirm('Delete this image?')) {
        try {
            await deleteObject(ref(storage, fullPath));
            setImages(prev => prev.filter(img => img.fullPath !== fullPath));
        } catch (error) { console.error(error); }
    }
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      alert("URL copied!");
  };

  // --- ACTIONS: SERIES ---
  const handleOpenSeriesModal = (series?: Series) => {
      if (series) {
          setEditingSeries(series);
      } else {
          setEditingSeries({
              title_tr: '', title_en: '', synopsis: '', status: 'Airing',
              network: '', poster_url: '', banner_url: '',
              rating: 0, episodes_total: 0, episodes_aired: 0, is_featured: false
          });
      }
      setIsSeriesModalOpen(true);
  };

  // New: Direct upload inside modal
  const handleModalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'poster_url' | 'banner_url') => {
      if (e.target.files && e.target.files[0] && editingSeries) {
          setModalUploading(field);
          const file = e.target.files[0];
          const storageRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
          try {
              const snapshot = await uploadBytes(storageRef, file);
              const url = await getDownloadURL(snapshot.ref);
              setEditingSeries(prev => prev ? ({ ...prev, [field]: url }) : null);
          } catch (error) {
              console.error("Upload failed", error);
              alert("Upload failed. Please try again.");
          } finally {
              setModalUploading(null);
          }
      }
  };

  const handleSaveSeries = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingSeries) return;

      try {
          if (editingSeries.id) {
              // Update
              const ref = doc(db, 'series', editingSeries.id);
              await updateDoc(ref, editingSeries);
          } else {
              // Create
              await addDoc(collection(db, 'series'), editingSeries);
          }
          setIsSeriesModalOpen(false);
          setEditingSeries(null);
      } catch (error) {
          console.error("Error saving series:", error);
          alert("Failed to save series.");
      }
  };

  const handleDeleteSeries = async (id: string) => {
      if (window.confirm('Are you sure you want to delete this series?')) {
          await deleteDoc(doc(db, 'series', id));
      }
  };

  // --- ACTIONS: USERS ---
  const toggleUserRole = async (user: User) => {
      const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
      if (window.confirm(`Change role of ${user.name} to ${newRole}?`)) {
          await updateDoc(doc(db, 'users', user.id), { role: newRole });
      }
  };

  // --- ACTIONS: RATINGS ---
  const handleSaveRating = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          await addDoc(collection(db, 'ratings'), {
              series_id: ratingForm.series_id,
              rank: Number(ratingForm.rank),
              rating: Number(ratingForm.rating),
              share: Number(ratingForm.share),
              category: ratingForm.category,
              trend: 'stable', 
              previous_rank: Number(ratingForm.rank),
              date: ratingForm.date
          });
          // Reset relevant fields only
          setRatingForm(prev => ({ ...prev, rating: '', share: '', rank: '' }));
          alert("Rating added successfully!");
      } catch (error) {
          console.error(error);
          alert("Failed to add rating.");
      }
  };

  const handleDeleteRating = async (id: string) => {
      if(window.confirm("Delete this rating record?")) {
          await deleteDoc(doc(db, 'ratings', id));
      }
  };

  // --- ACTIONS: SETTINGS ---
  const handleSaveSettings = async () => {
      try {
          await setDoc(doc(db, 'settings', 'general'), settings);
          alert("Settings saved.");
      } catch (error) {
          console.error(error);
      }
  };

  const getSeriesName = (id: string) => seriesList.find(s => s.id === id)?.title_tr || id;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 fixed h-full z-10 overflow-y-auto">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <span className="text-xl font-bold tracking-tight text-navy-900">İZLE<span className="text-purple">ADMIN</span></span>
        </div>
        
        <nav className="p-4 space-y-1">
          {[
              { id: 'DASHBOARD', icon: LayoutDashboard, label: 'Dashboard' },
              { id: 'SHOWS', icon: Film, label: 'Series Database' },
              { id: 'MEDIA', icon: ImageIcon, label: 'Media Library' },
              { id: 'RATINGS', icon: TrendingUp, label: 'Rating Input' },
              { id: 'USERS', icon: Users, label: 'User Manager' },
              { id: 'SETTINGS', icon: Settings, label: 'Settings' },
          ].map(item => (
            <button 
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === item.id ? 'bg-purple/10 text-purple' : 'text-gray-600 hover:bg-gray-50'}`}
            >
                <item.icon className="w-5 h-5" />
                {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="ml-64 flex-1 p-8">
        
        {/* DASHBOARD */}
        {activeTab === 'DASHBOARD' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Command Center</h1>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Total Series', val: stats.series, color: 'bg-blue-50 text-blue-700' },
                { label: 'Registered Users', val: stats.users, color: 'bg-green-50 text-green-700' },
                { label: 'Media Assets', val: images.length, color: 'bg-orange-50 text-orange-700' },
                { label: 'Daily Visits', val: '89k', color: 'bg-purple-50 text-purple-700' }
              ].map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="text-sm text-gray-500 font-medium mb-1">{stat.label}</div>
                  <div className={`text-3xl font-bold ${stat.color.split(' ')[1]}`}>{stat.val}</div>
                </div>
              ))}
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h2 className="font-bold mb-4">Quick Actions</h2>
                <div className="flex gap-4">
                     <button onClick={() => { setActiveTab('SHOWS'); handleOpenSeriesModal(); }} className="flex items-center gap-2 px-4 py-2 bg-purple text-white rounded-lg hover:bg-purple-dark shadow-sm">
                        <Plus className="w-4 h-4" /> Add New Series
                     </button>
                     <button onClick={() => setActiveTab('MEDIA')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                        <Upload className="w-4 h-4" /> Upload Banners
                     </button>
                </div>
            </div>
          </div>
        )}

        {/* SERIES DATABASE */}
        {activeTab === 'SHOWS' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Series Editor</h1>
                <button onClick={() => handleOpenSeriesModal()} className="bg-purple text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Create New
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3">Poster</th>
                            <th className="px-6 py-3">Title</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Network</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {seriesList.map(s => (
                            <tr key={s.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <img src={s.poster_url} className="w-10 h-14 object-cover rounded shadow-sm bg-gray-200" alt="" />
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-900">
                                    {s.title_tr}
                                    <div className="text-xs text-gray-500">{s.title_en}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${s.status === 'Airing' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                        {s.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-600">{s.network}</td>
                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                    <button onClick={() => handleOpenSeriesModal(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => handleDeleteSeries(s.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        )}

        {/* MEDIA LIBRARY */}
        {activeTab === 'MEDIA' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
                <div className="relative">
                    <input type="file" id="file-upload" className="hidden" onChange={handleFileUpload} accept="image/*" disabled={uploading} />
                    <label htmlFor="file-upload" className={`bg-purple text-white px-4 py-2 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-purple-dark transition-colors ${uploading ? 'opacity-50' : ''}`}>
                        {uploading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                        {uploading ? 'Uploading...' : 'Upload Image'}
                    </label>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {images.map((img) => (
                        <div key={img.fullPath} className="group relative aspect-[2/3] bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                            <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                                <button onClick={() => copyToClipboard(img.url)} className="w-full bg-white text-gray-900 py-1.5 rounded-md text-xs font-bold flex items-center justify-center gap-1 hover:bg-gray-200"><Copy className="w-3 h-3" /> Copy URL</button>
                                <button onClick={() => handleDeleteImage(img.fullPath)} className="w-full bg-red-500 text-white py-1.5 rounded-md text-xs font-bold flex items-center justify-center gap-1 hover:bg-red-600"><Trash2 className="w-3 h-3" /> Delete</button>
                            </div>
                        </div>
                    ))}
                    {images.length === 0 && <div className="col-span-full py-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">No images yet.</div>}
                </div>
            </div>
          </div>
        )}

        {/* RATINGS INPUT */}
        {activeTab === 'RATINGS' && (
            <div className="space-y-6">
                 <h1 className="text-2xl font-bold text-gray-900">Rating Input Tool</h1>
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                     {/* Input Form */}
                     <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                        <h2 className="font-bold text-lg mb-4">Add New Rating</h2>
                        <form onSubmit={handleSaveRating} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                                <input type="date" required value={ratingForm.date} onChange={e => setRatingForm({...ratingForm, date: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Series</label>
                                <select required value={ratingForm.series_id} onChange={e => setRatingForm({...ratingForm, series_id: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2">
                                    <option value="">Select a show...</option>
                                    {seriesList.map(s => <option key={s.id} value={s.id}>{s.title_tr}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                                    <select value={ratingForm.category} onChange={e => setRatingForm({...ratingForm, category: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2">
                                        <option>Total</option>
                                        <option>AB</option>
                                        <option>ABC1</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Rank</label>
                                    <input type="number" required placeholder="1" value={ratingForm.rank} onChange={e => setRatingForm({...ratingForm, rank: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Rating</label>
                                    <input type="number" step="0.01" required placeholder="5.40" value={ratingForm.rating} onChange={e => setRatingForm({...ratingForm, rating: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Share (%)</label>
                                    <input type="number" step="0.01" required placeholder="12.50" value={ratingForm.share} onChange={e => setRatingForm({...ratingForm, share: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2" />
                                </div>
                            </div>
                            
                            <button type="submit" className="w-full py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 flex items-center justify-center gap-2">
                                <CheckCircle className="w-4 h-4" /> Save Rating
                            </button>
                        </form>
                     </div>

                     {/* Recent Ratings List */}
                     <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-200">
                             <h2 className="font-bold text-lg">Recent Entries</h2>
                        </div>
                        <table className="w-full text-left text-sm">
                             <thead className="bg-gray-50 text-gray-500 font-medium">
                                 <tr>
                                     <th className="px-4 py-3">Date</th>
                                     <th className="px-4 py-3">Show</th>
                                     <th className="px-4 py-3">Cat</th>
                                     <th className="px-4 py-3">Rtg</th>
                                     <th className="px-4 py-3 text-right">Action</th>
                                 </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-100">
                                 {recentRatings.map(r => (
                                     <tr key={r.id} className="hover:bg-gray-50">
                                         <td className="px-4 py-3 text-gray-500">{r.date || 'N/A'}</td>
                                         <td className="px-4 py-3 font-medium">{getSeriesName(r.series_id)}</td>
                                         <td className="px-4 py-3">{r.category}</td>
                                         <td className="px-4 py-3 font-mono">{r.rating.toFixed(2)}</td>
                                         <td className="px-4 py-3 text-right">
                                             <button onClick={() => handleDeleteRating(r.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded"><Trash2 className="w-4 h-4" /></button>
                                         </td>
                                     </tr>
                                 ))}
                                 {recentRatings.length === 0 && (
                                     <tr><td colSpan={5} className="p-8 text-center text-gray-400">No recent ratings found.</td></tr>
                                 )}
                             </tbody>
                        </table>
                     </div>
                 </div>
            </div>
        )}

        {/* USER MANAGER */}
        {activeTab === 'USERS' && (
          <div className="space-y-6">
             <div className="flex justify-between items-center">
                 <h1 className="text-2xl font-bold text-gray-900">User Manager</h1>
                 <span className="text-sm text-gray-500">Total: {usersList.length}</span>
             </div>
             <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3">User</th>
                            <th className="px-6 py-3">Email</th>
                            <th className="px-6 py-3">Joined</th>
                            <th className="px-6 py-3">Role</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {usersList.map(u => (
                            <tr key={u.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-purple/10 text-purple flex items-center justify-center font-bold text-xs">
                                        {u.name.charAt(0).toUpperCase()}
                                    </div>
                                    {u.name || 'Anonymous'}
                                </td>
                                <td className="px-6 py-4 text-gray-600">{u.email}</td>
                                <td className="px-6 py-4 text-gray-500 text-xs">
                                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.role === 'ADMIN' ? 'bg-purple/10 text-purple' : 'bg-green-100 text-green-700'}`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => toggleUserRole(u)} className="text-xs border border-gray-300 px-3 py-1 rounded hover:bg-gray-100 transition-colors">
                                        Toggle Admin
                                    </button>
                                </td>
                            </tr>
                        ))}
                         {usersList.length === 0 && (
                             <tr><td colSpan={5} className="p-8 text-center text-gray-400">No users found in database.</td></tr>
                         )}
                    </tbody>
                </table>
             </div>
          </div>
        )}

        {/* SETTINGS */}
        {activeTab === 'SETTINGS' && (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
                <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm max-w-2xl">
                     <div className="space-y-4">
                         <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
                             <input type="text" value={settings.siteName} onChange={e => setSettings({...settings, siteName: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2" />
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Featured Series (ID)</label>
                            <input type="text" value={settings.featuredSeriesId} onChange={e => setSettings({...settings, featuredSeriesId: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2" />
                            <p className="text-xs text-gray-500 mt-1">Copy an ID from Series Database to feature it on the home page.</p>
                         </div>
                         <div className="flex items-center gap-3 pt-2">
                             <input type="checkbox" id="maintenance" checked={settings.maintenanceMode} onChange={e => setSettings({...settings, maintenanceMode: e.target.checked})} className="w-4 h-4 text-purple rounded border-gray-300 focus:ring-purple" />
                             <label htmlFor="maintenance" className="text-sm font-medium text-gray-700">Enable Maintenance Mode</label>
                         </div>
                         
                         <div className="pt-6 border-t border-gray-100">
                             <button onClick={handleSaveSettings} className="px-6 py-2 bg-purple text-white font-medium rounded-lg hover:bg-purple-dark flex items-center gap-2">
                                <Save className="w-4 h-4" /> Save Configuration
                             </button>
                         </div>
                     </div>
                </div>
            </div>
        )}
      </div>

      {/* MODAL: ADD/EDIT SERIES */}
      {isSeriesModalOpen && editingSeries && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                      <h3 className="text-lg font-bold">{editingSeries.id ? 'Edit Series' : 'New Series'}</h3>
                      <button onClick={() => setIsSeriesModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                  </div>
                  <form onSubmit={handleSaveSeries} className="p-6 space-y-4">
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

                      <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                              <select value={editingSeries.status} onChange={e => setEditingSeries({...editingSeries, status: e.target.value as any})} className="w-full border border-gray-300 rounded p-2">
                                  <option value="Airing">Airing</option>
                                  <option value="Ended">Ended</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Network</label>
                              <input required type="text" value={editingSeries.network} onChange={e => setEditingSeries({...editingSeries, network: e.target.value})} className="w-full border border-gray-300 rounded p-2" />
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex justify-between">
                                  Poster URL
                                  {modalUploading === 'poster_url' && <span className="text-purple text-[10px] animate-pulse">Uploading...</span>}
                              </label>
                              <div className="flex gap-2">
                                <input required type="url" value={editingSeries.poster_url} onChange={e => setEditingSeries({...editingSeries, poster_url: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm" placeholder="https://..." />
                                <div className="relative">
                                    <input type="file" id="modal-poster-upload" className="hidden" accept="image/*" onChange={(e) => handleModalImageUpload(e, 'poster_url')} />
                                    <label htmlFor="modal-poster-upload" className="p-2 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer flex items-center justify-center h-full">
                                        <Upload className="w-4 h-4 text-gray-600" />
                                    </label>
                                </div>
                              </div>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex justify-between">
                                  Banner URL
                                  {modalUploading === 'banner_url' && <span className="text-purple text-[10px] animate-pulse">Uploading...</span>}
                              </label>
                              <div className="flex gap-2">
                                <input required type="url" value={editingSeries.banner_url} onChange={e => setEditingSeries({...editingSeries, banner_url: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm" placeholder="https://..." />
                                <div className="relative">
                                    <input type="file" id="modal-banner-upload" className="hidden" accept="image/*" onChange={(e) => handleModalImageUpload(e, 'banner_url')} />
                                    <label htmlFor="modal-banner-upload" className="p-2 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer flex items-center justify-center h-full">
                                        <Upload className="w-4 h-4 text-gray-600" />
                                    </label>
                                </div>
                              </div>
                          </div>
                      </div>
                      <div className="text-xs text-gray-400">Click the upload icon to select an image from your device.</div>

                      <div className="grid grid-cols-3 gap-4">
                           <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Rating</label>
                              <input type="number" step="0.1" value={editingSeries.rating} onChange={e => setEditingSeries({...editingSeries, rating: Number(e.target.value)})} className="w-full border border-gray-300 rounded p-2" />
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Total Eps</label>
                              <input type="number" value={editingSeries.episodes_total} onChange={e => setEditingSeries({...editingSeries, episodes_total: Number(e.target.value)})} className="w-full border border-gray-300 rounded p-2" />
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Aired Eps</label>
                              <input type="number" value={editingSeries.episodes_aired} onChange={e => setEditingSeries({...editingSeries, episodes_aired: Number(e.target.value)})} className="w-full border border-gray-300 rounded p-2" />
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