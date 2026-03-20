
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { Order } from '../types';

interface ProfileProps {
  onBack: () => void;
  onOpenAdmin?: () => void;
}

const Profile: React.FC<ProfileProps> = ({ onBack, onOpenAdmin }) => {
  const { user, orders, fetchOrders, logout, isAdmin, justCompletedOrder, setJustCompletedOrder, bdtRate } = useStore();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrders();
    setIsRefreshing(false);
  };

  const latestOrder = useMemo(() => {
    if (!orders || orders.length === 0) return null;
    return [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }, [orders]);

  const isProcessing = latestOrder?.status === 'PENDING' || latestOrder?.status === 'PROCESSING';
  const isCompleted = latestOrder?.status === 'COMPLETED';

  const avatarAnimationClass = isProcessing 
    ? 'animate-breathe-red' 
    : (isCompleted && justCompletedOrder)
    ? 'animate-breathe-green' 
    : 'border-red-600/20';

  // Calculate total spent (Purchase Balance) based on order history
  const purchaseBalance = useMemo(() => {
    return orders
      .filter(order => order.status === 'COMPLETED' || order.status === 'PROCESSING' || order.status === 'PENDING')
      .reduce((acc, order) => {
        const amount = Number(order.totalAmount) || 0;
        const isUsdt = order.paymentMethod?.toLowerCase().includes('usdt');
        return acc + (isUsdt ? amount * bdtRate : amount);
      }, 0);
  }, [orders, bdtRate]);

  const stats = [
    { label: 'Purchase Balance', value: `৳${purchaseBalance.toFixed(0)}`, icon: '💰', color: 'text-green-500' },
    { label: 'Total Orders', value: orders.length, icon: '📦', color: 'text-red-600' },
  ];

  return (
    <div className="min-h-screen pt-24 pb-32 md:pb-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex justify-between items-center mb-8">
          <button 
            onClick={onBack} 
            className="flex items-center space-x-2 text-slate-500 hover:text-red-600 transition-colors group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-bold uppercase tracking-widest text-xs">Return to Base</span>
          </button>

          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
          >
            <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Sync Data
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* User Side Card */}
          <div className="lg:col-span-1">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 rounded-[2.5rem] border border-black/5 text-center sticky top-32 shadow-sm"
            >
              <div className="relative w-32 h-32 mx-auto mb-6">
                <div className="absolute inset-0 bg-red-600 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                <img 
                  src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=dc2626&color=fff&size=256`} 
                  className={`w-full h-full rounded-full border-4 relative z-10 ${avatarAnimationClass}`} 
                  alt="Profile" 
                />
              </div>
              <h2 className="text-3xl font-display font-bold mb-2 text-slate-900">{user?.name}</h2>
              <p className="text-slate-600 font-medium text-base mb-6">{user?.email}</p>
              
              <div className="inline-flex px-4 py-1.5 bg-white rounded-full text-xs font-bold text-red-600 border border-red-600/20 uppercase tracking-[0.2em] shadow-sm mb-6">
                {user?.role} Access
              </div>

              {isAdmin && onOpenAdmin && (
                <button
                  onClick={onOpenAdmin}
                  className="w-full py-3 mb-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all border border-slate-700 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Admin Panel
                </button>
              )}

              <button
                onClick={async () => {
                  await logout();
                  onBack();
                }}
                className="w-full py-3 bg-[#FAF9F6] hover:bg-red-50 text-red-600 font-bold rounded-2xl transition-all border border-red-100 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </motion.div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-6 rounded-3xl border border-black/5 hover:border-red-600/10 transition-all shadow-sm"
                >
                  <div className="text-3xl mb-4">{stat.icon}</div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{stat.label}</p>
                  <p className={`text-3xl font-display font-bold ${stat.color}`}>{stat.value}</p>
                </motion.div>
              ))}
            </div>

            {/* Order History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-8 rounded-[2.5rem] border border-black/5 min-h-[400px] shadow-sm"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-display font-bold flex items-center gap-3 text-slate-900">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Order History
                </h3>
              </div>

              {orders.length === 0 ? (
                <div className="py-20 text-center opacity-20">
                  <svg className="w-16 h-16 mx-auto mb-4 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p className="font-bold text-slate-900">No missions completed yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <motion.div 
                      key={order.id} 
                      whileHover={{ scale: 1.01 }}
                      onClick={() => setSelectedOrder(order)}
                      className="bg-white p-5 rounded-2xl border border-black/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-red-600/30 transition-all cursor-pointer shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#FAF9F6] rounded-xl flex items-center justify-center font-bold text-red-600 text-xs">
                          {order.id.slice(-4)}
                        </div>
                        <div>
                          <p className="font-bold text-base text-slate-900">
                            {order.items?.length || 0} Item{order.items?.length !== 1 ? 's' : ''} Purchase
                          </p>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-1">
                            {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-8">
                        <div className="text-right">
                          <p className="font-display text-lg font-bold text-slate-900">
                            {order.paymentMethod?.toLowerCase().includes('usdt') ? '$' : '৳'}
                            {(Number(order.totalAmount) || 0).toFixed(order.paymentMethod?.toLowerCase().includes('usdt') ? 2 : 0)}
                            {order.paymentMethod?.toLowerCase().includes('usdt') && <span className="text-[10px] ml-1 text-slate-400">USDT</span>}
                          </p>
                          <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${order.status === 'COMPLETED' ? 'text-green-600' : order.status === 'PROCESSING' ? 'text-yellow-600' : 'text-red-600'}`}>
                            {order.status}
                          </p>
                        </div>
                        <div className="p-2 bg-[#FAF9F6] group-hover:bg-red-600/20 rounded-lg transition-colors">
                          <svg className="w-5 h-5 text-slate-300 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 flex items-center justify-center z-[200] p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setSelectedOrder(null)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#FAF9F6] border border-black/10 rounded-[2.5rem] p-8 max-w-lg w-full relative z-10 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
              
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                  <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1">Receipt Protocol</p>
                  <h3 className="text-2xl font-display font-bold text-slate-900">Order Details</h3>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-black/5 rounded-full transition-colors text-slate-400 hover:text-slate-900"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6 relative z-10">
                <div className="bg-white p-5 rounded-2xl border border-black/5 flex justify-between items-center shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Order ID</span>
                  <span className="font-mono font-bold text-slate-900 bg-black/5 px-3 py-1 rounded-lg">{selectedOrder.id}</span>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Target Items</p>
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-2xl border border-black/5 flex items-center gap-4 shadow-sm">
                        <img src={item.image} className="w-12 h-12 rounded-lg object-cover" alt={item.gameTitle} referrerPolicy="no-referrer" />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-900">{item.gameTitle}</p>
                          <p className="text-xs text-slate-500">{item.packageName}</p>
                          <p className="text-[10px] text-red-600 font-mono mt-1 bg-red-50 px-2 py-0.5 rounded inline-block">{item.playerId}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900">৳{(Number(item.price) || 0).toFixed(0)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm">
                      <p className="text-xs text-slate-400 italic text-center">No item data available for this legacy order.</p>
                    </div>
                  )}
                </div>

                  <div className="bg-white p-6 rounded-3xl border border-black/5 space-y-4 shadow-sm">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status</span>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${selectedOrder.status === 'COMPLETED' ? 'bg-green-100 text-green-600' : selectedOrder.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Date</span>
                      <span className="text-slate-900 font-medium text-sm bg-black/5 px-3 py-1 rounded-lg">
                        {new Date(selectedOrder.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-black/5">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Charged</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {selectedOrder.paymentMethod}
                        </span>
                      </div>
                      <span className="font-display font-bold text-xl text-red-600">
                        {selectedOrder.paymentMethod?.toLowerCase().includes('usdt') ? '$' : '৳'}
                        {(Number(selectedOrder.totalAmount) || 0).toFixed(selectedOrder.paymentMethod?.toLowerCase().includes('usdt') ? 2 : 0)}
                        {selectedOrder.paymentMethod?.toLowerCase().includes('usdt') && <span className="text-xs ml-1">USDT</span>}
                      </span>
                    </div>
                  </div>

                  {selectedOrder.screenshot && (
                    <div className="bg-white p-5 rounded-2xl border border-black/5 space-y-3 shadow-sm">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payment Proof</p>
                      <div className="relative rounded-xl overflow-hidden border border-black/5 group/screenshot">
                        <img 
                          src={selectedOrder.screenshot} 
                          alt="Payment Proof" 
                          className="w-full h-auto max-h-[300px] object-contain cursor-zoom-in transition-transform duration-500 group-hover/screenshot:scale-105" 
                          referrerPolicy="no-referrer"
                          onClick={() => window.open(selectedOrder.screenshot!, '_blank')}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/screenshot:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                          <p className="text-white text-[9px] font-bold uppercase tracking-widest">Click to view full size</p>
                        </div>
                      </div>
                    </div>
                  )}

                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all shadow-md"
                >
                  Close Intel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
