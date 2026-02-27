
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, HeroBanner } from '../store/useStore';
import { Order, Game, GamePackage, CartItem } from '../types';
import { sendOrderNotification } from '../services/mailService';
import { sendTelegramNotification } from '../services/telegramService';
import { supabase } from '../services/supabaseClient';

type DashboardTab = 'OPERATIONS' | 'ARMORY' | 'USERS' | 'PROMOTIONS';

const AdminDashboard: React.FC = () => {
  const { 
    allOrders, 
    updateOrderStatus, 
    fetchAllOrders, 
    games, 
    addGame, 
    updateGame, 
    deleteGame, 
    allUsers, 
    fetchAllUsers,
    fetchGames,
    heroBanners,
    fetchHeroBanners,
    addHeroBanner,
    updateHeroBanner,
    deleteHeroBanner
  } = useStore();
  
  const [activeTab, setActiveTab] = useState<DashboardTab>('OPERATIONS');
  const [searchId, setSearchId] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  
  const portraitInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Game Modal State
  const [showGameModal, setShowGameModal] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [gameFormData, setGameFormData] = useState<Partial<Game>>({
    id: '', title: '', category: 'FPS', description: '', image: '', banner: '', packages: [], featured: false
  });

  // Package Management State
  const [newPkg, setNewPkg] = useState<Partial<GamePackage>>({ amount: 0, unit: '', price: 0, bonus: '', popular: false });
  const [editingPkgId, setEditingPkgId] = useState<string | null>(null);

  // Banner Modal State
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null);
  const [bannerFormData, setBannerFormData] = useState<Partial<HeroBanner>>({
    title: '', tag: '', image_url: ''
  });

  useEffect(() => {
    if (activeTab === 'USERS') fetchAllUsers();
    if (activeTab === 'PROMOTIONS') fetchHeroBanners();
    if (activeTab === 'ARMORY') fetchGames();
    if (activeTab === 'OPERATIONS') fetchAllOrders();
  }, [activeTab]);

  const stats = useMemo(() => {
    const ordersList = allOrders || [];
    const completed = ordersList.filter(o => o.status === 'COMPLETED');
    const revenueValue = completed.reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0);
    return {
      total: ordersList.length,
      revenue: revenueValue.toFixed(0),
      activeCatalog: (games || []).length,
      totalUsers: (allUsers || []).length
    };
  }, [allOrders, games, allUsers]);

  const filteredOrders = useMemo(() => {
    return (allOrders || []).filter(o => 
      o.id.toLowerCase().includes(searchId.toLowerCase()) || 
      (o.items && o.items.some(i => i.playerId.toLowerCase().includes(searchId.toLowerCase())))
    );
  }, [allOrders, searchId]);

  const filteredUsers = useMemo(() => {
    return (allUsers || []).filter(u => 
      u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) || 
      u.email?.toLowerCase().includes(userSearch.toLowerCase())
    );
  }, [allUsers, userSearch]);

  const handleSyncData = () => {
    fetchAllOrders();
    fetchGames();
    fetchAllUsers();
    fetchHeroBanners();
  };

  const handleTestNotifications = async () => {
    console.log("HGP DEBUG: Starting connection tests...");
    
    // 1. Test Database Connection
    const { data: dbTest, error: dbError } = await supabase.from('profiles').select('count').single();
    if (dbError) {
      console.error("HGP DB ERROR:", dbError);
      alert(`Database Connection Failed: ${dbError.message}\n\nThis usually means your Supabase URL or Anon Key is incorrect.`);
      return;
    }
    console.log("HGP DB SUCCESS: Connected to Supabase database.");

    if (!allOrders || allOrders.length === 0) {
      alert("Database connected, but no orders found to test notifications with. Please place a test order first.");
      return;
    }
    
    const testOrder = allOrders[0];
    const { data: profile } = await supabase.from('profiles').select('email, full_name').eq('id', testOrder.userId).single();
    
    console.log("HGP DEBUG: Testing edge functions for order:", testOrder.id);
    
    // 2. Test Telegram
    console.log("HGP DEBUG: Invoking Telegram Edge Function...");
    const tgResult = await sendTelegramNotification(testOrder);
    if (!tgResult) {
      alert("❌ Telegram Test: FAILED\n\nPossible Reasons:\n1. Edge Function not deployed.\n2. TELEGRAM_BOT_TOKEN or CHAT_ID secrets not set in Supabase.\n3. Bot is blocked by user.");
    } else {
      alert("✅ Telegram Test: SUCCESS\n\nCheck your Telegram bot for the message.");
    }
    
    // 3. Test Email
    if (profile?.email) {
      console.log("HGP DEBUG: Invoking Email Edge Function...");
      const emailResult = await sendOrderNotification(testOrder, profile.email, profile.full_name || 'Test User');
      if (!emailResult) {
        alert("❌ Email Test: FAILED\n\nPossible Reasons:\n1. Edge Function not deployed.\n2. SMTP_PASSWORD or SMTP_USERNAME secrets not set in Supabase.\n3. Gmail App Password is invalid or revoked.");
      } else {
        alert("✅ Email Test: SUCCESS\n\nCheck your email inbox (and spam folder).");
      }
    } else {
      alert("⚠️ Email Test: SKIPPED\n\nReason: The test user for this order has no email address in their profile.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: string, setter: any) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter((prev: any) => ({ ...prev, [target]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameFormData.title || !gameFormData.image) return alert("Title and Image are required.");
    setIsSubmitting(true);
    let result = editingGame ? await updateGame(editingGame.id, gameFormData) : await addGame(gameFormData);
    if (result.success) { setShowGameModal(false); setEditingGame(null); }
    else alert(`Save Failed: ${result.error}`);
    setIsSubmitting(false);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerFormData.title || !bannerFormData.image_url) return alert("Title and Image are required.");
    setIsSubmitting(true);
    let result = editingBanner ? await updateHeroBanner(editingBanner.id, bannerFormData) : await addHeroBanner(bannerFormData);
    if (result.success) { setShowBannerModal(false); setEditingBanner(null); }
    else alert(`Save Failed: ${result.error}`);
    setIsSubmitting(false);
  };

  const handleDeleteGame = async (gameId: string) => {
    if(window.confirm('Are you sure you want to permanently delete this game?')) {
      setDeletingId(gameId);
      const success = await deleteGame(gameId);
      if (!success) alert("Failed to delete game. Check if this game ID exists in the database.");
      setDeletingId(null);
    }
  };

  const handleDeleteBanner = async (bannerId: string) => {
    if(window.confirm('Are you sure you want to permanently delete this promotion banner?')) {
      setDeletingId(bannerId);
      const success = await deleteHeroBanner(bannerId);
      if (!success) alert("Failed to delete banner. Check your connection or permissions.");
      setDeletingId(null);
    }
  };

  const handleAddOrUpdatePackage = () => {
    if (!newPkg.amount || !newPkg.unit || !newPkg.price) return alert("Please fill in Amount, Unit, and Price.");
    
    if (editingPkgId) {
      setGameFormData(prev => ({
        ...prev,
        packages: prev.packages?.map(p => p.id === editingPkgId ? { ...p, ...newPkg } as GamePackage : p)
      }));
      setEditingPkgId(null);
    } else {
      const pkgWithId = { ...newPkg, id: 'p' + Math.random().toString(36).substr(2, 5), popular: !!newPkg.popular } as GamePackage;
      setGameFormData(prev => ({ ...prev, packages: [...(prev.packages || []), pkgWithId] }));
    }
    
    setNewPkg({ amount: 0, unit: '', price: 0, bonus: '', popular: false });
  };

  const handleEditPackage = (pkg: GamePackage) => {
    setEditingPkgId(pkg.id);
    setNewPkg({
      amount: pkg.amount,
      unit: pkg.unit,
      price: pkg.price,
      bonus: pkg.bonus,
      popular: pkg.popular
    });
  };

  const removePackageFromForm = (id: string) => {
    if (editingPkgId === id) {
      setEditingPkgId(null);
      setNewPkg({ amount: 0, unit: '', price: 0, bonus: '', popular: false });
    }
    setGameFormData(prev => ({ ...prev, packages: prev.packages?.filter(p => p.id !== id) }));
  };

  const handleStatusChange = async (order: Order, newStatus: Order['status']) => {
    const success = await updateOrderStatus(order.id, newStatus);
    if (success && newStatus === 'COMPLETED') {
      // Fetch user email for the order
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', order.userId)
        .single();

      if (profile?.email) {
        // Send completion email to user
        const completionOrder = { ...order, status: 'COMPLETED' as const };
        sendOrderNotification(completionOrder, profile.email, profile.full_name || 'Valued Customer')
          .then(sent => console.log(sent ? "Completion email dispatched" : "Completion email failed"));
      }

      // Send telegram notification to admin
      const telegramOrder = { ...order, status: 'COMPLETED' as const };
      sendTelegramNotification(telegramOrder)
        .then(sent => console.log(sent ? "Telegram completion notification dispatched" : "Telegram completion notification failed"));
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-6 max-w-7xl mx-auto bg-black text-white">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold mb-2">Admin <span className="text-red-600">Console</span></h1>
          <div className="flex flex-wrap gap-4 mt-4">
            {(['OPERATIONS', 'ARMORY', 'PROMOTIONS', 'USERS'] as DashboardTab[]).map((tab) => (
              <button 
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-white/5 text-white/40'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-4">
          {activeTab === 'ARMORY' && (
            <button type="button" onClick={() => { setEditingGame(null); setEditingPkgId(null); setGameFormData({title:'',category:'FPS',description:'',image:'',banner:'',packages:[],featured:false}); setShowGameModal(true); }} className="px-6 py-3 bg-red-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-700 transition-all text-white shadow-lg shadow-red-600/20">
              Add New Game
            </button>
          )}
          {activeTab === 'PROMOTIONS' && (
            <button type="button" onClick={() => { setEditingBanner(null); setBannerFormData({title:'',tag:'',image_url:''}); setShowBannerModal(true); }} className="px-6 py-3 bg-red-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-700 transition-all text-white shadow-lg shadow-red-600/20">
              Add New Banner
            </button>
          )}
          <button type="button" onClick={handleSyncData} className="px-6 py-3 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:border-red-500/50 transition-all text-white">
            Sync Data
          </button>
          <button type="button" onClick={handleTestNotifications} className="px-6 py-3 bg-amber-600/10 border border-amber-600/20 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-amber-600/20 transition-all text-amber-500">
            Test Alerts
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'OPERATIONS' && (
          <motion.div key="ops" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {[
                  { label: 'Total Revenue', value: stats.revenue, color: 'text-green-500', prefix: '৳' },
                  { label: 'Total Orders', value: stats.total, color: 'text-blue-500' },
                  { label: 'Active Catalog', value: stats.activeCatalog, color: 'text-amber-500' },
                  { label: 'Total Users', value: stats.totalUsers, color: 'text-red-500' }
                ].map((s, i) => (
                  <div key={i} className="bg-white/5 p-8 rounded-3xl border border-white/5 shadow-sm">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">{s.label}</p>
                    <p className={`text-2xl font-display font-bold ${s.color}`}>{s.prefix}{s.value}</p>
                  </div>
                ))}
             </div>
             <div className="bg-white/5 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                   <h3 className="font-display font-bold text-xl text-white">Active Orders</h3>
                   <input type="text" placeholder="Search ID..." value={searchId} onChange={e => setSearchId(e.target.value)} className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none w-full md:w-64 text-white focus:border-red-600" />
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="text-[10px] font-bold text-white/40 uppercase tracking-widest border-b border-white/5">
                            <th className="p-6">Order ID</th><th className="p-6">Method</th><th className="p-6">Target Intel</th><th className="p-6">Status</th><th className="p-6">Amount</th><th className="p-6 text-right">Actions</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                         {filteredOrders.map(order => (
                            <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => setSelectedOrderDetails(order)}>
                               <td className="p-6 font-mono text-xs text-white/60">{order.id}</td>
                               <td className="p-6">
                                 {order.items?.map((item, idx) => (
                                    <div key={idx} className="text-[10px] font-bold uppercase tracking-widest text-white/40">{item.loginMethod}</div>
                                 ))}
                               </td>
                               <td className="p-6">
                                 {order.items?.map((item, i) => (
                                    <div key={i} className="text-xs">
                                      <span className="text-white font-bold">{item.gameTitle}</span>
                                      <span className="mx-2 text-white/10">|</span>
                                      <span className="text-red-500 font-mono">{item.playerId}</span>
                                    </div>
                                 ))}
                               </td>
                               <td className="p-6">
                                 <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase ${order.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' : order.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'}`}>
                                   {order.status}
                                 </span>
                               </td>
                               <td className="p-6 text-white font-bold">৳{Number(order.totalAmount).toFixed(0)}</td>
                               <td className="p-6 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                                 {order.status === 'PENDING' && (
                                   <>
                                     <button type="button" onClick={() => handleStatusChange(order, 'COMPLETED')} className="px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-lg text-[10px] font-bold uppercase transition-colors">Complete</button>
                                     <button type="button" onClick={() => handleStatusChange(order, 'CANCELLED')} className="px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-600 rounded-lg text-[10px] font-bold uppercase transition-colors">Void</button>
                                   </>
                                 )}
                                 <button type="button" className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group-hover:bg-red-600/20">
                                   <svg className="w-4 h-4 text-white/40 group-hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                   </svg>
                                 </button>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </motion.div>
        )}

        {activeTab === 'ARMORY' && (
          <motion.div key="armory" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {games.map(game => (
                  <div key={game.id} className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 hover:border-red-500/20 transition-all flex flex-col group relative shadow-sm">
                    <div className="flex gap-4 mb-6">
                      <div className="relative w-24 h-28 rounded-2xl overflow-hidden shrink-0 border border-white/5 shadow-md bg-neutral-900">
                        <img src={game.image} className="w-full h-full object-cover" alt={game.title} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-display font-bold text-xl leading-tight mb-1 text-white">{game.title}</h3>
                        <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest">{game.category}</p>
                        <p className="text-[10px] text-white/20 mt-2 font-mono">{game.id}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-auto">
                      <button type="button" onClick={() => { setEditingGame(game); setGameFormData(game); setShowGameModal(true); }} className="py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all text-white flex items-center justify-center gap-2">Edit</button>
                      <button type="button" disabled={deletingId === game.id} onClick={() => handleDeleteGame(game.id)} className={`py-3 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${deletingId === game.id ? 'opacity-50 cursor-not-allowed' : ''}`}>{deletingId === game.id ? 'Deleting...' : 'Delete'}</button>
                    </div>
                  </div>
                ))}
             </div>
          </motion.div>
        )}

        {activeTab === 'PROMOTIONS' && (
          <motion.div key="promo" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {heroBanners.map(banner => (
                  <div key={banner.id} className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 hover:border-red-500/20 transition-all flex flex-col group shadow-sm">
                    <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-6 border border-white/5 bg-neutral-900">
                      <img src={banner.image_url} className="w-full h-full object-cover" alt={banner.title} />
                      {banner.tag && <div className="absolute top-4 left-4 px-3 py-1 bg-red-600 text-[10px] font-bold rounded-lg shadow-lg">{banner.tag}</div>}
                    </div>
                    <h3 className="font-display font-bold text-xl mb-6 text-white">{banner.title}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => { setEditingBanner(banner); setBannerFormData(banner); setShowBannerModal(true); }} className="py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all text-white">Edit</button>
                      <button type="button" disabled={deletingId === banner.id} onClick={() => handleDeleteBanner(banner.id)} className={`py-3 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${deletingId === banner.id ? 'opacity-50 cursor-not-allowed' : ''}`}>{deletingId === banner.id ? 'Deleting...' : 'Delete'}</button>
                    </div>
                  </div>
                ))}
             </div>
          </motion.div>
        )}

        {activeTab === 'USERS' && (
          <motion.div key="users" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <div className="bg-white/5 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                   <h3 className="font-display font-bold text-xl text-white">Players</h3>
                   <input type="text" placeholder="Search User..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none w-full md:w-64 text-white focus:border-red-600" />
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="text-[10px] font-bold text-white/40 uppercase tracking-widest border-b border-white/5"><th className="p-6">Name</th><th className="p-6">Email</th><th className="p-6">Joined</th></tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                         {filteredUsers.map(u => (<tr key={u.id} className="hover:bg-white/[0.02] transition-colors"><td className="p-6 text-white font-bold">{u.full_name}</td><td className="p-6 text-white/60">{u.email}</td><td className="p-6 text-xs text-white/40">{new Date(u.created_at).toLocaleDateString()}</td></tr>))}
                      </tbody>
                   </table>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedOrderDetails && (
          <div className="fixed inset-0 flex items-center justify-center z-[500] p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setSelectedOrderDetails(null)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="glass-dark border border-white/10 rounded-[3rem] p-8 md:p-12 max-w-2xl w-full relative z-10 shadow-[0_0_80px_rgba(220,38,38,0.1)] overflow-hidden">
               <div className="flex justify-between items-start mb-10">
                 <div>
                   <p className="text-red-500 text-[10px] font-bold uppercase tracking-[0.4em] mb-2">Order Intelligence</p>
                   <h2 className="text-3xl font-display font-bold text-white">Ref: <span className="font-mono">{selectedOrderDetails.id}</span></h2>
                 </div>
                 <button onClick={() => setSelectedOrderDetails(null)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                 </button>
               </div>

               <div className="space-y-8">
                  {selectedOrderDetails.items.map((item, idx) => (
                    <div key={idx} className="glass p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent">
                      <div className="flex gap-6 mb-8 items-start">
                        <img src={item.image} className="w-20 h-24 rounded-2xl object-cover shadow-xl border border-white/10" alt="" />
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">{item.gameTitle}</h3>
                          <p className="text-red-500 font-bold text-xs uppercase tracking-widest mb-3">{item.packageName}</p>
                          <div className="px-3 py-1 bg-white/5 rounded-lg inline-block text-[10px] font-bold text-white/40 uppercase tracking-widest">
                            Method: {item.loginMethod}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                          <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">Target Account / UID</p>
                          <p className="text-sm font-mono font-bold text-white select-all">{item.playerId}</p>
                        </div>
                        {item.password && (
                          <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                            <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">Access Password</p>
                            <p className="text-sm font-mono font-bold text-amber-500 select-all">{item.password}</p>
                          </div>
                        )}
                        {item.whatsapp && (
                          <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                            <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">WhatsApp Liaison</p>
                            <p className="text-sm font-mono font-bold text-white select-all">{item.whatsapp}</p>
                          </div>
                        )}
                        {item.vaultGmail && (
                          <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                            <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">Vault Gmail</p>
                            <p className="text-sm font-mono font-bold text-white select-all">{item.vaultGmail}</p>
                          </div>
                        )}
                        {item.vaultNumber && (
                          <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                            <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">Vault Code/No</p>
                            <p className="text-sm font-mono font-bold text-red-500 select-all">{item.vaultNumber}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-4 pt-4">
                    {selectedOrderDetails.status === 'PENDING' && (
                      <button onClick={() => { handleStatusChange(selectedOrderDetails, 'COMPLETED'); setSelectedOrderDetails(null); }} className="flex-1 py-5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-green-600/20 uppercase tracking-widest text-xs">Deploy Package</button>
                    )}
                    <button onClick={() => setSelectedOrderDetails(null)} className="flex-1 py-5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all border border-white/10 uppercase tracking-widest text-xs">Dismiss Intel</button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBannerModal && (
          <div className="fixed inset-0 flex items-center justify-center z-[400] p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setShowBannerModal(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-dark border border-white/10 rounded-[2.5rem] p-8 md:p-10 max-w-xl w-full relative z-10">
              <h2 className="text-2xl font-display font-bold mb-8">Banner <span className="text-red-600">Protocol</span></h2>
              <form onSubmit={handleSaveBanner} className="space-y-6">
                <div><label className="block text-[10px] font-bold text-white/40 uppercase mb-2">Title</label><input type="text" required value={bannerFormData.title} onChange={e => setBannerFormData({...bannerFormData, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-sm outline-none focus:border-red-600" /></div>
                <div><label className="block text-[10px] font-bold text-white/40 uppercase mb-2">Tagline</label><input type="text" placeholder="e.g., Limited Time" value={bannerFormData.tag} onChange={e => setBannerFormData({...bannerFormData, tag: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-sm outline-none focus:border-red-600" /></div>
                <div><label className="block text-[10px] font-bold text-white/40 uppercase mb-2">Banner Image URL</label><div className="flex gap-2"><input type="text" value={bannerFormData.image_url} onChange={e => setBannerFormData({...bannerFormData, image_url: e.target.value})} className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-sm outline-none focus:border-red-600" /><button type="button" onClick={() => bannerInputRef.current?.click()} className="px-6 py-4 bg-white/10 rounded-2xl text-[10px] font-bold uppercase hover:bg-white/20">Upload</button><input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'image_url', setBannerFormData)} /></div></div>
                <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-red-600 hover:bg-red-700 rounded-2xl font-bold uppercase text-xs shadow-xl">{isSubmitting ? 'Processing...' : 'Deploy Banner'}</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGameModal && (
          <div className="fixed inset-0 flex items-center justify-center z-[300] p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowGameModal(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-dark border border-white/10 rounded-[2.5rem] p-8 md:p-10 max-w-3xl w-full relative z-10 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-display font-bold mb-8">Catalogue <span className="text-red-600">Configuration</span></h2>
              <form onSubmit={handleSaveGame} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div><label className="block text-[10px] font-bold text-white/40 uppercase mb-2">Title</label><input type="text" required value={gameFormData.title} onChange={e => setGameFormData({...gameFormData, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-sm outline-none focus:border-red-600" /></div>
                  <div><label className="block text-[10px] font-bold text-white/40 uppercase mb-2">Category</label><select value={gameFormData.category} onChange={e => setGameFormData({...gameFormData, category: e.target.value as any})} className="w-full bg-neutral-900 border border-white/10 rounded-2xl py-4 px-5 text-sm text-white"><option value="FPS">FPS</option><option value="MOBA">MOBA</option><option value="BATTLE_ROYALE">BATTLE_ROYALE</option><option value="RPG">RPG</option><option value="SPORTS">SPORTS</option></select></div>
                </div>
                <div><label className="block text-[10px] font-bold text-white/40 uppercase mb-2">Description</label><textarea value={gameFormData.description} onChange={e => setGameFormData({...gameFormData, description: e.target.value})} rows={3} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-sm text-white resize-none focus:border-red-600" /></div>
                <div><label className="block text-[10px] font-bold text-white/40 uppercase mb-2">Portrait Image URL</label><div className="flex gap-2"><input type="text" value={gameFormData.image} onChange={e => setGameFormData({...gameFormData, image: e.target.value})} className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-sm outline-none focus:border-red-600" /><button type="button" onClick={() => portraitInputRef.current?.click()} className="px-6 py-4 bg-white/10 rounded-2xl text-[10px] font-bold uppercase hover:bg-white/20">Upload</button><input type="file" ref={portraitInputRef} className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'image', setGameFormData)} /></div></div>
                <div className="p-6 bg-white/[0.02] rounded-3xl border border-white/5">
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-6">Packages Inventory</h3>
                  <div className="space-y-2 mb-8">{gameFormData.packages?.map(p => (<div key={p.id} className="p-4 bg-black/40 rounded-xl border border-white/5 flex justify-between items-center"><div><span className="text-sm font-bold">{p.amount} {p.unit}</span><span className="mx-2 text-white/20">|</span><span className="text-sm font-bold text-red-500">৳{p.price.toFixed(0)}</span></div><div className="flex gap-3"><button type="button" onClick={() => handleEditPackage(p)} className="text-[10px] font-bold uppercase text-white/40 hover:text-white">Edit</button><button type="button" onClick={() => removePackageFromForm(p.id)} className="text-[10px] font-bold uppercase text-red-500/40 hover:text-red-500">Delete</button></div></div>))}</div>
                  <div className="grid grid-cols-4 gap-3">
                    <input type="number" placeholder="Amt" value={newPkg.amount || ''} onChange={e => setNewPkg({...newPkg, amount: Number(e.target.value)})} className="bg-black border border-white/10 rounded-xl p-3 text-xs" />
                    <input type="text" placeholder="Unit" value={newPkg.unit} onChange={e => setNewPkg({...newPkg, unit: e.target.value})} className="bg-black border border-white/10 rounded-xl p-3 text-xs" />
                    <input type="number" step="0.01" placeholder="Price" value={newPkg.price || ''} onChange={e => setNewPkg({...newPkg, price: Number(e.target.value)})} className="bg-black border border-white/10 rounded-xl p-3 text-xs" />
                    <button type="button" onClick={handleAddOrUpdatePackage} className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest ${editingPkgId ? 'bg-amber-500 text-black' : 'bg-white text-black'}`}>{editingPkgId ? 'Update' : 'Add'}</button>
                  </div>
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-red-600 hover:bg-red-700 rounded-2xl font-bold uppercase text-xs shadow-xl">{isSubmitting ? 'Syncing...' : 'Deploy Catalogue Entry'}</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
