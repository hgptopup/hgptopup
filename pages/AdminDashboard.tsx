
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, HeroBanner } from '../store/useStore';
import { Order, Game, GamePackage, CartItem, FloatingIcon, PopupOption } from '../types';
import { LOGIN_METHODS } from '../constants';
import { sendOrderNotification } from '../services/mailService';
import { sendTelegramNotification } from '../services/telegramService';
import { supabase } from '../services/supabaseClient';

type DashboardTab = 'OPERATIONS' | 'ARMORY' | 'USERS' | 'VISUALS' | 'BRANDING';

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
    deleteHeroBanner,
    floatingIcons,
    fetchFloatingIcons,
    addFloatingIcon,
    updateFloatingIcon,
    deleteFloatingIcon,
    logoUrl,
    updateLogo,
    setLogoUrl
  } = useStore();
  
  const [activeTab, setActiveTab] = useState<DashboardTab>('OPERATIONS');
  const [searchId, setSearchId] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  
  const portraitInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);
  const popupImageInputRef = useRef<HTMLInputElement>(null);

  // Game Modal State
  const [showGameModal, setShowGameModal] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [gameFormData, setGameFormData] = useState<Partial<Game>>({
    id: '', title: '', category: 'FPS', description: '', image: '', banner: '', packages: [], featured: false
  });

  // Package Management State
  const [newPkg, setNewPkg] = useState<Partial<GamePackage>>({ amount: '', unit: '', price: 0, bonus: '', popular: false });
  const [editingPkgId, setEditingPkgId] = useState<string | null>(null);

  // Popup Option Management State
  const [newPopupOption, setNewPopupOption] = useState<Partial<PopupOption>>({ title: '', targetGameId: '', image: '' });
  const [editingPopupId, setEditingPopupId] = useState<string | null>(null);
  const [managingPopupId, setManagingPopupId] = useState<string | null>(null);
  const [newPopupPkg, setNewPopupPkg] = useState<Partial<GamePackage>>({ amount: '', unit: '', price: 0, bonus: '', popular: false });
  const [editingPopupPkgId, setEditingPopupPkgId] = useState<string | null>(null);

  // Banner Modal State
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null);
  const [bannerFormData, setBannerFormData] = useState<Partial<HeroBanner>>({
    title: '', tag: '', image_url: ''
  });

  // Floating Icon Modal State
  const [showIconModal, setShowIconModal] = useState(false);
  const [editingIcon, setEditingIcon] = useState<FloatingIcon | null>(null);
  const [iconFormData, setIconFormData] = useState<Partial<FloatingIcon>>({
    icon: '', label: '', delay: 0, duration: 4, position: 'top-right'
  });

  useEffect(() => {
    if (activeTab === 'USERS') fetchAllUsers();
    if (activeTab === 'VISUALS') fetchFloatingIcons();
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
    fetchFloatingIcons();
  };

  const handleTestNotifications = async () => {
    console.log("HGP DEBUG: Starting connection tests...");
    
    // 1. Test Database Connection
    const { data: dbTest, error: dbError } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
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
    const { data: profile } = await supabase.from('profiles').select('email, full_name').eq('id', testOrder.userId).maybeSingle();
    
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
    
    const finalData = { ...gameFormData };
    // Auto-generate ID if missing for new games
    if (!editingGame && !finalData.id) {
      finalData.id = finalData.title.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '') + '-' + Math.random().toString(36).substr(2, 5);
    }

    let result = editingGame ? await updateGame(editingGame.id, finalData) : await addGame(finalData);
    if (result.success) { 
      setShowGameModal(false); 
      setEditingGame(null); 
    } else {
      alert(`Save Failed: ${result.error}`);
    }
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

  const handleSaveIcon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!iconFormData.icon) return alert("Icon (Emoji or Image URL) is required.");
    setIsSubmitting(true);
    let result = editingIcon ? await updateFloatingIcon(editingIcon.id, iconFormData) : await addFloatingIcon(iconFormData);
    if (result.success) { setShowIconModal(false); setEditingIcon(null); }
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

  const handleDeleteIcon = async (iconId: string) => {
    if(window.confirm('Are you sure you want to delete this floating icon?')) {
      setDeletingId(iconId);
      const success = await deleteFloatingIcon(iconId);
      if (!success) alert("Failed to delete icon.");
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
    
    setNewPkg({ amount: '', unit: '', price: 0, bonus: '', popular: false });
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
      setNewPkg({ amount: '', unit: '', price: 0, bonus: '', popular: false });
    }
    setGameFormData(prev => ({ ...prev, packages: prev.packages?.filter(p => p.id !== id) }));
  };

  const handleAddOrUpdatePopupOption = () => {
    if (!newPopupOption.title || !newPopupOption.image) return alert("Please fill in Title and Image URL.");
    
    if (editingPopupId) {
      setGameFormData(prev => ({
        ...prev,
        packages: prev.packages?.map(p => p.id === editingPopupId ? { ...p, ...newPopupOption, isPopupOption: true } as any : p)
      }));
      setEditingPopupId(null);
    } else {
      const optWithId = { ...newPopupOption, id: 'opt' + Math.random().toString(36).substr(2, 5), isPopupOption: true } as any;
      setGameFormData(prev => ({ ...prev, packages: [...(prev.packages || []), optWithId] }));
    }
    
    setNewPopupOption({ title: '', targetGameId: '', image: '' });
  };

  const handleEditPopupOption = (opt: any) => {
    setEditingPopupId(opt.id);
    setNewPopupOption({
      title: opt.title,
      targetGameId: opt.targetGameId,
      image: opt.image
    });
  };

  const removePopupOptionFromForm = (id: string) => {
    if (editingPopupId === id) {
      setEditingPopupId(null);
      setNewPopupOption({ title: '', targetGameId: '', image: '' });
    }
    if (managingPopupId === id) {
      setManagingPopupId(null);
    }
    setGameFormData(prev => ({ ...prev, packages: prev.packages?.filter(p => p.id !== id) }));
  };

  const handleAddOrUpdatePopupPackage = () => {
    if (!newPopupPkg.amount || !newPopupPkg.unit || !newPopupPkg.price || !managingPopupId) return alert("Please fill in Amount, Unit, and Price.");
    
    setGameFormData(prev => {
      const updatedPackages = prev.packages?.map(p => {
        if (p.id === managingPopupId && 'isPopupOption' in p) {
          const popupOpt = p as PopupOption;
          const existingPkgs = popupOpt.packages || [];
          
          if (editingPopupPkgId) {
            return {
              ...popupOpt,
              packages: existingPkgs.map(pkg => pkg.id === editingPopupPkgId ? { ...pkg, ...newPopupPkg } as GamePackage : pkg)
            };
          } else {
            const pkgWithId = { ...newPopupPkg, id: 'pp' + Math.random().toString(36).substr(2, 5), popular: !!newPopupPkg.popular } as GamePackage;
            return {
              ...popupOpt,
              packages: [...existingPkgs, pkgWithId]
            };
          }
        }
        return p;
      });
      return { ...prev, packages: updatedPackages };
    });
    
    setEditingPopupPkgId(null);
    setNewPopupPkg({ amount: '', unit: '', price: 0, bonus: '', popular: false });
  };

  const handleEditPopupPackage = (pkg: GamePackage) => {
    setEditingPopupPkgId(pkg.id);
    setNewPopupPkg({
      amount: pkg.amount,
      unit: pkg.unit,
      price: pkg.price,
      bonus: pkg.bonus,
      popular: pkg.popular
    });
  };

  const removePopupPackageFromForm = (pkgId: string) => {
    if (editingPopupPkgId === pkgId) {
      setEditingPopupPkgId(null);
      setNewPopupPkg({ amount: '', unit: '', price: 0, bonus: '', popular: false });
    }
    setGameFormData(prev => {
      const updatedPackages = prev.packages?.map(p => {
        if (p.id === managingPopupId && 'isPopupOption' in p) {
          const popupOpt = p as PopupOption;
          return {
            ...popupOpt,
            packages: popupOpt.packages?.filter(pkg => pkg.id !== pkgId)
          };
        }
        return p;
      });
      return { ...prev, packages: updatedPackages };
    });
  };

  const handleStatusChange = async (order: Order, newStatus: Order['status']) => {
    const success = await updateOrderStatus(order.id, newStatus);
    if (success && newStatus === 'COMPLETED') {
      // Send telegram notification to admin
      const telegramOrder = { ...order, status: 'COMPLETED' as const };
      sendTelegramNotification(telegramOrder)
        .then(sent => console.log(sent ? "Telegram completion notification dispatched" : "Telegram completion notification failed"));
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-32 md:pb-20 px-6 max-w-7xl mx-auto bg-[#FAF9F6] text-slate-900">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold mb-2 text-slate-900">Admin <span className="text-red-600">Console</span></h1>
          <div className="flex flex-wrap gap-4 mt-4">
            {(['OPERATIONS', 'ARMORY', 'VISUALS', 'USERS', 'BRANDING'] as DashboardTab[]).map((tab) => (
              <button 
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-red-600 text-[#FAF9F6] shadow-lg shadow-red-600/20' : 'bg-[#FAF9F6] text-slate-500 border border-slate-200'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-4">
          {activeTab === 'ARMORY' && (
            <button type="button" onClick={() => { setEditingGame(null); setEditingPkgId(null); setGameFormData({title:'',category:'FPS',description:'',image:'',banner:'',packages:[],featured:false}); setShowGameModal(true); }} className="px-6 py-3 bg-red-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-700 transition-all text-[#FAF9F6] shadow-lg shadow-red-600/20">
              Add New Game
            </button>
          )}
          {activeTab === 'VISUALS' && (
            <button type="button" onClick={() => { setEditingIcon(null); setIconFormData({icon:'',label:'',delay:0,duration:4,position:'top-right'}); setShowIconModal(true); }} className="px-6 py-3 bg-red-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-700 transition-all text-[#FAF9F6] shadow-lg shadow-red-600/20">
              Add Floating Icon
            </button>
          )}
          <button type="button" onClick={handleSyncData} className="px-6 py-3 bg-[#FAF9F6] border border-slate-200 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:border-red-600/50 transition-all text-slate-600">
            Sync Data
          </button>
          <button type="button" onClick={handleTestNotifications} className="px-6 py-3 bg-red-600/10 border border-red-600/20 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-600/20 transition-all text-red-600">
            Test Alerts
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'OPERATIONS' && (
          <motion.div key="ops" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {[
                  { label: 'Total Revenue', value: stats.revenue, color: 'text-green-600', prefix: '৳' },
                  { label: 'Total Orders', value: stats.total, color: 'text-red-600' },
                  { label: 'Active Catalog', value: stats.activeCatalog, color: 'text-red-600' },
                  { label: 'Total Users', value: stats.totalUsers, color: 'text-red-600' }
                ].map((s, i) => (
                  <div key={i} className="bg-[#FAF9F6] p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                    <p className={`text-2xl font-display font-bold ${s.color}`}>{s.prefix}{s.value}</p>
                  </div>
                ))}
             </div>
             <div className="bg-[#FAF9F6] rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                   <h3 className="font-display font-bold text-xl text-slate-900">Active Orders</h3>
                   <input type="text" placeholder="Search ID..." value={searchId} onChange={e => setSearchId(e.target.value)} className="bg-[#FAF9F6] border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none w-full md:w-64 text-slate-900 focus:border-red-600" />
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200">
                            <th className="p-6">Order ID</th><th className="p-6">Customer</th><th className="p-6">Payment</th><th className="p-6">Target Intel</th><th className="p-6">Status</th><th className="p-6">Amount</th><th className="p-6 text-right">Actions</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {filteredOrders.map(order => (
                            <tr key={order.id} className="hover:bg-[#F0F0F0] transition-colors group cursor-pointer" onClick={() => setSelectedOrderDetails(order)}>
                               <td className="p-6 font-mono text-xs text-slate-400">{order.id}</td>
                                <td className="p-6">
                                  <div className="text-xs font-bold text-slate-900">{order.customerName || 'Guest'}</div>
                                  <div className="text-[10px] text-slate-400 font-mono mt-1">{order.userId?.substring(0, 8)}...</div>
                                </td>
                               <td className="p-6">
                                 <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{order.paymentMethod || 'N/A'}</div>
                                 <div className="text-[10px] font-mono text-red-600/60 mt-1">{order.transactionId || 'No TrxID'}</div>
                               </td>
                               <td className="p-6">
                                 {order.items?.map((item, i) => (
                                    <div key={i} className="text-xs">
                                      <span className="text-slate-900 font-bold">{item.gameTitle}</span>
                                      <span className="mx-2 text-slate-200">|</span>
                                      <span className="text-red-600 font-mono">{item.playerId}</span>
                                    </div>
                                 ))}
                               </td>
                               <td className="p-6">
                                 <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase ${order.status === 'COMPLETED' ? 'bg-green-100 text-green-600' : order.status === 'PENDING' ? 'bg-red-100 text-red-600' : 'bg-red-100 text-red-600'}`}>
                                   {order.status}
                                 </span>
                               </td>
                               <td className="p-6 text-slate-900 font-bold">৳{Number(order.totalAmount).toFixed(0)}</td>
                               <td className="p-6 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                                 {order.status === 'PENDING' && (
                                   <>
                                     <button type="button" onClick={() => handleStatusChange(order, 'COMPLETED')} className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg text-[10px] font-bold uppercase transition-colors">Complete</button>
                                     <button type="button" onClick={() => handleStatusChange(order, 'CANCELLED')} className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg text-[10px] font-bold uppercase transition-colors">Void</button>
                                   </>
                                 )}
                                 <button type="button" className="p-1.5 bg-[#FAF9F6] hover:bg-[#F0F0F0] rounded-lg transition-colors group-hover:bg-red-600/10">
                                   <svg className="w-4 h-4 text-slate-400 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <div key={game.id} className="bg-[#FAF9F6] p-6 rounded-[2.5rem] border border-slate-200 hover:border-red-600/20 transition-all flex flex-col group relative shadow-sm">
                    <div className="flex gap-4 mb-6">
                      <div className="relative w-24 h-28 rounded-2xl overflow-hidden shrink-0 border border-slate-200 shadow-md bg-[#FAF9F6]">
                        <img src={game.image} className="w-full h-full object-cover" alt={game.title} referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-display font-bold text-xl leading-tight mb-1 text-slate-900">{game.title}</h3>
                        <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest">{game.category}</p>
                        <p className="text-[10px] text-slate-400 mt-2 font-mono">{game.id}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-auto">
                      <button type="button" onClick={() => { setEditingGame(game); setGameFormData(game); setShowGameModal(true); }} className="py-3 bg-[#FAF9F6] hover:bg-[#FAF9F6]/80 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all text-slate-900 flex items-center justify-center gap-2 border border-slate-200">Edit</button>
                      <button type="button" disabled={deletingId === game.id} onClick={() => handleDeleteGame(game.id)} className={`py-3 bg-red-600/10 hover:bg-red-600/20 text-red-600 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${deletingId === game.id ? 'opacity-50 cursor-not-allowed' : ''}`}>{deletingId === game.id ? 'Deleting...' : 'Delete'}</button>
                    </div>
                  </div>
                ))}
             </div>
          </motion.div>
        )}

          {activeTab === 'VISUALS' && (
          <motion.div key="visuals" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
             <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {floatingIcons.map(icon => (
                  <div key={icon.id} className="bg-[#FAF9F6] p-6 rounded-[2.5rem] border border-slate-200 hover:border-red-600/20 transition-all flex flex-col group shadow-sm">
                    <div className="w-20 h-20 bg-[#FAF9F6] rounded-2xl flex items-center justify-center text-4xl mb-4 border border-slate-200">
                      {icon.icon.startsWith('http') || icon.icon.startsWith('data:image/') ? <img src={icon.icon} className="w-12 h-12 object-contain" alt="" referrerPolicy="no-referrer" /> : icon.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900">{icon.label || 'Floating Icon'}</h3>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">{icon.position}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-6">
                      <button type="button" onClick={() => { setEditingIcon(icon); setIconFormData(icon); setShowIconModal(true); }} className="py-2 bg-[#FAF9F6] hover:bg-[#FAF9F6]/80 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all text-slate-900 border border-slate-200">Edit</button>
                      <button type="button" disabled={deletingId === icon.id} onClick={() => handleDeleteIcon(icon.id)} className={`py-2 bg-red-600/10 hover:bg-red-600/20 text-red-600 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${deletingId === icon.id ? 'opacity-50 cursor-not-allowed' : ''}`}>Delete</button>
                    </div>
                  </div>
                ))}
             </div>
          </motion.div>
        )}

        {activeTab === 'USERS' && (
          <motion.div key="users" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <div className="bg-[#FAF9F6] rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                   <h3 className="font-display font-bold text-xl text-slate-900">Players</h3>
                   <input type="text" placeholder="Search User..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="bg-[#FAF9F6] border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none w-full md:w-64 text-slate-900 focus:border-red-600" />
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200"><th className="p-6">Name</th><th className="p-6">Email</th><th className="p-6">Joined</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {filteredUsers.map(u => (<tr key={u.id} className="hover:bg-[#FAF9F6] transition-colors"><td className="p-6 text-slate-900 font-bold">{u.full_name}</td><td className="p-6 text-slate-500">{u.email}</td><td className="p-6 text-xs text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td></tr>))}
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={() => setSelectedOrderDetails(null)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[#0B0B0F] border border-[#FAF9F6]/10 rounded-[3rem] p-8 md:p-12 max-w-2xl w-full relative z-10 shadow-2xl overflow-hidden">
               <div className="flex justify-between items-start mb-10">
                 <div>
                   <p className="text-red-600 text-[10px] font-bold uppercase tracking-[0.4em] mb-2">Order Intelligence</p>
                   <h2 className="text-3xl font-display font-bold text-[#FAF9F6]">Ref: <span className="font-mono">{selectedOrderDetails.id}</span></h2>
                   <p className="text-[#FAF9F6]/60 text-sm mt-2 font-medium">Customer: <span className="text-red-500 font-bold">{selectedOrderDetails.customerName || 'Guest'}</span></p>
                 </div>
                 <button onClick={() => setSelectedOrderDetails(null)} className="p-3 bg-[#FAF9F6]/5 hover:bg-[#FAF9F6]/10 rounded-2xl transition-all">
                    <svg className="w-6 h-6 text-[#FAF9F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                 </button>
               </div>

               <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-[#FAF9F6]/5 p-4 rounded-2xl border border-[#FAF9F6]/5">
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Payment Method</p>
                       <p className="text-sm font-bold text-[#FAF9F6]">{selectedOrderDetails.paymentMethod || 'N/A'}</p>
                     </div>
                     <div className="bg-[#FAF9F6]/5 p-4 rounded-2xl border border-[#FAF9F6]/5">
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Transaction ID</p>
                       <div className="flex items-center justify-between gap-2">
                         <p className="text-sm font-mono font-bold text-red-500 truncate">{selectedOrderDetails.transactionId || 'N/A'}</p>
                         {selectedOrderDetails.transactionId && (
                           <button onClick={() => navigator.clipboard.writeText(selectedOrderDetails.transactionId!)} className="p-1.5 hover:bg-[#FAF9F6]/10 rounded-lg transition-colors text-slate-400 hover:text-[#FAF9F6] shrink-0">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                           </button>
                         )}
                       </div>
                     </div>
                  </div>
                  {selectedOrderDetails.items.map((item, idx) => (
                    <div key={idx} className="bg-[#FAF9F6]/5 p-6 rounded-3xl border border-[#FAF9F6]/5">
                      <div className="flex gap-6 mb-8 items-start">
                        <img src={item.image} className="w-20 h-24 rounded-2xl object-cover shadow-xl border border-[#FAF9F6]/10" alt="" referrerPolicy="no-referrer" />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-xl font-bold text-[#FAF9F6] mb-1 truncate">{item.gameTitle}</h3>
                          <p className="text-red-500 font-bold text-xs uppercase tracking-widest mb-3 truncate">{item.packageName}</p>
                          <div className="px-3 py-1 bg-[#FAF9F6]/10 rounded-lg inline-block text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                            Method: {item.loginMethod}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-[#FAF9F6]/5 p-4 rounded-2xl border border-[#FAF9F6]/5">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Target Account / UID</p>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-mono font-bold text-[#FAF9F6] truncate">{item.playerId}</p>
                            <button onClick={() => navigator.clipboard.writeText(item.playerId)} className="p-1.5 hover:bg-[#FAF9F6]/10 rounded-lg transition-colors text-slate-400 hover:text-[#FAF9F6] shrink-0">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                            </button>
                          </div>
                        </div>
                        {item.password && (
                          <div className="bg-[#FAF9F6]/5 p-4 rounded-2xl border border-[#FAF9F6]/5">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Access Password</p>
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-mono font-bold text-red-500 truncate">{item.password}</p>
                              <button onClick={() => navigator.clipboard.writeText(item.password!)} className="p-1.5 hover:bg-[#FAF9F6]/10 rounded-lg transition-colors text-slate-400 hover:text-[#FAF9F6] shrink-0">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                              </button>
                            </div>
                          </div>
                        )}
                        {item.whatsapp && (
                          <div className="bg-[#FAF9F6]/5 p-4 rounded-2xl border border-[#FAF9F6]/5">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">WhatsApp Liaison</p>
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-mono font-bold text-[#FAF9F6] truncate">{item.whatsapp}</p>
                              <button onClick={() => navigator.clipboard.writeText(item.whatsapp!)} className="p-1.5 hover:bg-[#FAF9F6]/10 rounded-lg transition-colors text-slate-400 hover:text-[#FAF9F6] shrink-0">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-4 pt-4">
                    {selectedOrderDetails.status === 'PENDING' && (
                      <button onClick={() => { handleStatusChange(selectedOrderDetails, 'COMPLETED'); setSelectedOrderDetails(null); }} className="flex-1 py-5 bg-green-600 hover:bg-green-700 text-[#FAF9F6] font-bold rounded-2xl transition-all shadow-xl shadow-green-600/20 uppercase tracking-widest text-xs">Deploy Package</button>
                    )}
                    <button onClick={() => setSelectedOrderDetails(null)} className="flex-1 py-5 bg-[#FAF9F6]/5 hover:bg-[#FAF9F6]/10 text-[#FAF9F6] font-bold rounded-2xl transition-all border border-[#FAF9F6]/10 uppercase tracking-widest text-xs">Dismiss Intel</button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
         {showBannerModal && (
          <div className="fixed inset-0 flex items-center justify-center z-[400] p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-xl" onClick={() => setShowBannerModal(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#FAF9F6] border border-black/10 rounded-[2.5rem] p-8 md:p-10 max-w-xl w-full relative z-10 shadow-2xl">
              <h2 className="text-2xl font-display font-bold mb-8 text-slate-900">Banner <span className="text-red-600">Protocol</span></h2>
              <form onSubmit={handleSaveBanner} className="space-y-6">
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Title</label><input type="text" required value={bannerFormData.title} onChange={e => setBannerFormData({...bannerFormData, title: e.target.value})} className="w-full bg-[#FAF9F6] border border-black/10 rounded-2xl py-4 px-5 text-sm outline-none focus:border-red-600 text-slate-900" /></div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Tagline</label><input type="text" placeholder="e.g., Limited Time" value={bannerFormData.tag} onChange={e => setBannerFormData({...bannerFormData, tag: e.target.value})} className="w-full bg-[#FAF9F6] border border-black/10 rounded-2xl py-4 px-5 text-sm outline-none focus:border-red-600 text-slate-900" /></div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Banner Image URL</label><div className="flex gap-2"><input type="text" value={bannerFormData.image_url} onChange={e => setBannerFormData({...bannerFormData, image_url: e.target.value})} className="flex-1 bg-[#FAF9F6] border border-black/10 rounded-2xl py-4 px-5 text-sm outline-none focus:border-red-600 text-slate-900" /><button type="button" onClick={() => bannerInputRef.current?.click()} className="px-6 py-4 bg-[#FAF9F6] rounded-2xl text-[10px] font-bold uppercase hover:bg-[#FAF9F6]/80 text-slate-900">Upload</button><input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'image_url', setBannerFormData)} /></div></div>
                <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-red-600 hover:bg-red-700 rounded-2xl font-bold uppercase text-xs shadow-xl text-[#FAF9F6]">{isSubmitting ? 'Processing...' : 'Deploy Banner'}</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
         {showIconModal && (
          <div className="fixed inset-0 flex items-center justify-center z-[400] p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-xl" onClick={() => setShowIconModal(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#FAF9F6] border border-black/10 rounded-[2.5rem] p-8 md:p-10 max-w-xl w-full relative z-10 shadow-2xl">
              <h2 className="text-2xl font-display font-bold mb-8 text-slate-900">Floating Icon <span className="text-red-600">Config</span></h2>
              <form onSubmit={handleSaveIcon} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Icon (Emoji or URL)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      required 
                      value={iconFormData.icon} 
                      onChange={e => setIconFormData({...iconFormData, icon: e.target.value})} 
                      className="flex-1 bg-[#FAF9F6] border border-black/10 rounded-2xl py-4 px-5 text-sm outline-none focus:border-red-600 text-slate-900" 
                    />
                    <button 
                      type="button" 
                      onClick={() => iconInputRef.current?.click()} 
                      className="px-6 py-4 bg-[#FAF9F6] rounded-2xl text-[10px] font-bold uppercase hover:bg-[#FAF9F6]/80 text-slate-900"
                    >
                      Upload
                    </button>
                    <input 
                      type="file" 
                      ref={iconInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={e => handleFileUpload(e, 'icon', setIconFormData)} 
                    />
                  </div>
                </div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Label (Optional)</label><input type="text" value={iconFormData.label} onChange={e => setIconFormData({...iconFormData, label: e.target.value})} className="w-full bg-[#FAF9F6] border border-black/10 rounded-2xl py-4 px-5 text-sm outline-none focus:border-red-600 text-slate-900" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Position</label><select value={iconFormData.position} onChange={e => setIconFormData({...iconFormData, position: e.target.value as any})} className="w-full bg-[#FAF9F6] border border-black/10 rounded-2xl py-4 px-5 text-sm text-slate-900"><option value="top-left">Top Left</option><option value="top-right">Top Right</option><option value="bottom-left">Bottom Left</option><option value="bottom-right">Bottom Right</option><option value="center-left">Center Left</option><option value="center-right">Center Right</option></select></div>
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Duration (s)</label><input type="number" value={iconFormData.duration} onChange={e => setIconFormData({...iconFormData, duration: Number(e.target.value)})} className="w-full bg-[#FAF9F6] border border-black/10 rounded-2xl py-4 px-5 text-sm outline-none focus:border-red-600 text-slate-900" /></div>
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-red-600 hover:bg-red-700 rounded-2xl font-bold uppercase text-xs shadow-xl text-[#FAF9F6]">{isSubmitting ? 'Processing...' : 'Save Icon'}</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
         {showGameModal && (
          <div className="fixed inset-0 flex items-center justify-center z-[300] p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setShowGameModal(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#FAF9F6] border border-black/10 rounded-[2.5rem] p-8 md:p-10 max-w-3xl w-full relative z-10 max-h-[90vh] overflow-y-auto shadow-2xl">
              <h2 className="text-2xl font-display font-bold mb-8 text-slate-900">Catalogue <span className="text-red-600">Configuration</span></h2>
              <form onSubmit={handleSaveGame} className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Title</label><input type="text" required value={gameFormData.title} onChange={e => setGameFormData({...gameFormData, title: e.target.value})} className="w-full bg-[#FAF9F6] border border-black/10 rounded-2xl py-4 px-5 text-sm outline-none focus:border-red-600 text-slate-900" /></div>
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Game ID / Slug</label><input type="text" placeholder="e.g. free-fire" value={gameFormData.id} onChange={e => setGameFormData({...gameFormData, id: e.target.value})} className="w-full bg-[#FAF9F6] border border-black/10 rounded-2xl py-4 px-5 text-sm outline-none focus:border-red-600 text-slate-900" disabled={!!editingGame} /></div>
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Category</label><select value={gameFormData.category} onChange={e => setGameFormData({...gameFormData, category: e.target.value as any})} className="w-full bg-[#FAF9F6] border border-black/10 rounded-2xl py-4 px-5 text-sm text-slate-900"><option value="FPS">FPS</option><option value="MOBA">MOBA</option><option value="BATTLE_ROYALE">BATTLE_ROYALE</option><option value="RPG">RPG</option><option value="SPORTS">SPORTS</option></select></div>
                </div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Description</label><textarea value={gameFormData.description} onChange={e => setGameFormData({...gameFormData, description: e.target.value})} rows={3} className="w-full bg-[#FAF9F6] border border-black/10 rounded-2xl py-4 px-5 text-sm text-slate-900 resize-none focus:border-red-600" /></div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Portrait Image URL</label><div className="flex gap-2"><input type="text" value={gameFormData.image} onChange={e => setGameFormData({...gameFormData, image: e.target.value})} className="flex-1 bg-[#FAF9F6] border border-black/10 rounded-2xl py-4 px-5 text-sm outline-none focus:border-red-600 text-slate-900" /><button type="button" onClick={() => portraitInputRef.current?.click()} className="px-6 py-4 bg-[#FAF9F6] rounded-2xl text-[10px] font-bold uppercase hover:bg-[#FAF9F6]/80 text-slate-900">Upload</button><input type="file" ref={portraitInputRef} className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'image', setGameFormData)} /></div></div>
                
                <div className="p-6 bg-[#FAF9F6] rounded-3xl border border-black/5">
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-6 text-slate-900">Login Methods</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {LOGIN_METHODS.map(method => (
                      <label key={method.id} className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={gameFormData.loginMethods?.includes(method.id) || (!gameFormData.loginMethods && true)} // Default all checked if undefined
                          onChange={(e) => {
                            const currentMethods = gameFormData.loginMethods || LOGIN_METHODS.map(m => m.id);
                            if (e.target.checked) {
                              setGameFormData({ ...gameFormData, loginMethods: [...currentMethods, method.id] });
                            } else {
                              setGameFormData({ ...gameFormData, loginMethods: currentMethods.filter(id => id !== method.id) });
                            }
                          }}
                          className="w-4 h-4 text-red-600 rounded border-black/20 focus:ring-red-600"
                        />
                        <span className="text-xs font-medium text-slate-700">{method.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-[#FAF9F6] rounded-3xl border border-black/5">
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-6 text-slate-900">Packages Inventory</h3>
                  <div className="space-y-2 mb-8">{gameFormData.packages?.filter(p => !('isPopupOption' in p) || !p.isPopupOption).map(p => (<div key={p.id} className="p-4 bg-[#FAF9F6] rounded-xl border border-black/5 flex justify-between items-center"><div><span className="text-sm font-bold text-slate-900">{(p as GamePackage).amount} {(p as GamePackage).unit}</span><span className="mx-2 text-slate-200">|</span><span className="text-sm font-bold text-red-600">৳{(p as GamePackage).price?.toFixed(0)}</span></div><div className="flex gap-3"><button type="button" onClick={() => handleEditPackage(p as GamePackage)} className="text-[10px] font-bold uppercase text-slate-400 hover:text-slate-900">Edit</button><button type="button" onClick={() => removePackageFromForm(p.id)} className="text-[10px] font-bold uppercase text-red-600/40 hover:text-red-600">Delete</button></div></div>))}</div>
                  <div className="grid grid-cols-4 gap-3">
                    <input type="text" placeholder="Amt" value={newPkg.amount || ''} onChange={e => setNewPkg({...newPkg, amount: e.target.value})} className="bg-[#FAF9F6] border border-black/10 rounded-xl p-3 text-xs text-slate-900" />
                    <input type="text" placeholder="Unit" value={newPkg.unit} onChange={e => setNewPkg({...newPkg, unit: e.target.value})} className="bg-[#FAF9F6] border border-black/10 rounded-xl p-3 text-xs text-slate-900" />
                    <input type="number" step="0.01" placeholder="Price" value={newPkg.price || ''} onChange={e => setNewPkg({...newPkg, price: Number(e.target.value)})} className="bg-[#FAF9F6] border border-black/10 rounded-xl p-3 text-xs text-slate-900" />
                    <button type="button" onClick={handleAddOrUpdatePackage} className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest ${editingPkgId ? 'bg-red-600 text-[#FAF9F6]' : 'bg-slate-900 text-[#FAF9F6]'}`}>{editingPkgId ? 'Update' : 'Add'}</button>
                  </div>
                </div>

                <div className="p-6 bg-[#FAF9F6] rounded-3xl border border-black/5">
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-6 text-slate-900">Popup Options (Sub-Shops)</h3>
                  <div className="space-y-2 mb-8">{gameFormData.packages?.filter(p => 'isPopupOption' in p && p.isPopupOption).map(p => (<div key={p.id} className="p-4 bg-[#FAF9F6] rounded-xl border border-black/5 flex justify-between items-center"><div className="flex items-center gap-3">{(p as any).image && <img src={(p as any).image} alt="" className="w-8 h-8 rounded-lg object-cover" referrerPolicy="no-referrer" />}<div><span className="text-sm font-bold text-slate-900">{(p as any).title}</span><span className="mx-2 text-slate-200">|</span><span className="text-xs text-slate-500">Target: {(p as any).targetGameId || 'Self'}</span></div></div><div className="flex gap-3"><button type="button" onClick={() => setManagingPopupId(p.id)} className="text-[10px] font-bold uppercase text-blue-600 hover:text-blue-800">Prices</button><button type="button" onClick={() => handleEditPopupOption(p)} className="text-[10px] font-bold uppercase text-slate-400 hover:text-slate-900">Edit</button><button type="button" onClick={() => removePopupOptionFromForm(p.id)} className="text-[10px] font-bold uppercase text-red-600/40 hover:text-red-600">Delete</button></div></div>))}</div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input type="text" placeholder="Title" value={newPopupOption.title} onChange={e => setNewPopupOption({...newPopupOption, title: e.target.value})} className="bg-[#FAF9F6] border border-black/10 rounded-xl p-3 text-xs text-slate-900" />
                    <input type="text" placeholder="Target Game ID (Optional)" value={newPopupOption.targetGameId || ''} onChange={e => setNewPopupOption({...newPopupOption, targetGameId: e.target.value})} className="bg-[#FAF9F6] border border-black/10 rounded-xl p-3 text-xs text-slate-900" />
                    <div className="flex gap-2">
                      {newPopupOption.image && (
                        <img src={newPopupOption.image} alt="" className="w-10 h-10 rounded-lg object-cover border border-black/10" referrerPolicy="no-referrer" />
                      )}
                      <input type="text" placeholder="Image URL" value={newPopupOption.image} onChange={e => setNewPopupOption({...newPopupOption, image: e.target.value})} className="flex-1 bg-[#FAF9F6] border border-black/10 rounded-xl p-3 text-xs text-slate-900" />
                      <button type="button" onClick={() => popupImageInputRef.current?.click()} className="px-4 py-3 bg-[#FAF9F6] border border-black/10 rounded-xl text-[10px] font-bold uppercase hover:bg-black/5 text-slate-900">Upload</button>
                      <input type="file" ref={popupImageInputRef} className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'image', setNewPopupOption)} />
                    </div>
                    <button type="button" onClick={handleAddOrUpdatePopupOption} className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest ${editingPopupId ? 'bg-red-600 text-[#FAF9F6]' : 'bg-slate-900 text-[#FAF9F6]'}`}>{editingPopupId ? 'Update' : 'Add Option'}</button>
                  </div>

                  {managingPopupId && (
                    <div className="mt-6 p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest mb-4 text-blue-900">
                        Price List for: {(gameFormData.packages?.find(p => p.id === managingPopupId) as any)?.title}
                      </h4>
                      <div className="space-y-2 mb-4">
                        {(gameFormData.packages?.find(p => p.id === managingPopupId) as any)?.packages?.map((pkg: GamePackage) => (
                          <div key={pkg.id} className="p-3 bg-white rounded-xl border border-blue-100 flex justify-between items-center">
                            <div>
                              <span className="text-sm font-bold text-slate-900">{pkg.amount} {pkg.unit}</span>
                              <span className="mx-2 text-slate-200">|</span>
                              <span className="text-sm font-bold text-red-600">৳{pkg.price.toFixed(0)}</span>
                            </div>
                            <div className="flex gap-3">
                              <button type="button" onClick={() => handleEditPopupPackage(pkg)} className="text-[10px] font-bold uppercase text-slate-400 hover:text-slate-900">Edit</button>
                              <button type="button" onClick={() => removePopupPackageFromForm(pkg.id)} className="text-[10px] font-bold uppercase text-red-600/40 hover:text-red-600">Delete</button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        <input type="text" placeholder="Amt" value={newPopupPkg.amount || ''} onChange={e => setNewPopupPkg({...newPopupPkg, amount: e.target.value})} className="bg-white border border-blue-100 rounded-xl p-3 text-xs text-slate-900" />
                        <input type="text" placeholder="Unit" value={newPopupPkg.unit} onChange={e => setNewPopupPkg({...newPopupPkg, unit: e.target.value})} className="bg-white border border-blue-100 rounded-xl p-3 text-xs text-slate-900" />
                        <input type="number" step="0.01" placeholder="Price" value={newPopupPkg.price || ''} onChange={e => setNewPopupPkg({...newPopupPkg, price: Number(e.target.value)})} className="bg-white border border-blue-100 rounded-xl p-3 text-xs text-slate-900" />
                        <button type="button" onClick={handleAddOrUpdatePopupPackage} className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest ${editingPopupPkgId ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'}`}>{editingPopupPkgId ? 'Update' : 'Add'}</button>
                      </div>
                    </div>
                  )}
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-red-600 hover:bg-red-700 rounded-2xl font-bold uppercase text-xs shadow-xl text-[#FAF9F6]">{isSubmitting ? 'Syncing...' : 'Deploy Catalogue Entry'}</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
