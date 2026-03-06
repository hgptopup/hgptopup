
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import GameCard from './components/GameCard';
import Footer from './components/Footer';
import GameDetail from './pages/GameDetail';
import Profile from './pages/Profile';
import TermsOfService from './pages/TermsOfService';
import RefundPolicy from './pages/RefundPolicy';
import HelpCenter from './pages/HelpCenter';
import AdminDashboard from './pages/AdminDashboard';
import CartDrawer from './components/CartDrawer';
import SupportModal from './components/SupportModal';
import AuthModal from './components/AuthModal';
import SplashScreen from './components/SplashScreen';
import BackgroundAnimation from './components/BackgroundAnimation';
import { Game } from './types';
import { useStore } from './store/useStore';
import { supabase } from './services/supabaseClient';
import { GAMES as INITIAL_GAMES } from './constants';

const App: React.FC = () => {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showRefund, setShowRefund] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { setSession, isAuthenticated, isAdmin, games, fetchGames, logout, user, fetchOrders, setJustCompletedOrder } = useStore();

  useEffect(() => {
    fetchGames();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session?.user ?? null);
    });

    // Splash screen timer
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1500);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [setSession, fetchGames]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const channel = supabase
      .channel('orders-channel')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, user, fetchOrders, setJustCompletedOrder]);

  const handleGoHome = () => {
    setSelectedGame(null);
    setShowProfile(false);
    setShowTerms(false);
    setShowRefund(false);
    setShowHelp(false);
    setShowAdmin(false);
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    await logout();
    handleGoHome();
  };

  const handleOpenProfile = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    setSelectedGame(null);
    setShowTerms(false);
    setShowRefund(false);
    setShowHelp(false);
    setShowAdmin(false);
    setShowProfile(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenTerms = () => {
    setSelectedGame(null);
    setShowProfile(false);
    setShowRefund(false);
    setShowHelp(false);
    setShowAdmin(false);
    setShowTerms(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenRefund = () => {
    setSelectedGame(null);
    setShowProfile(false);
    setShowTerms(false);
    setShowHelp(false);
    setShowAdmin(false);
    setShowRefund(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenHelp = () => {
    setSelectedGame(null);
    setShowProfile(false);
    setShowTerms(false);
    setShowRefund(false);
    setShowAdmin(false);
    setShowHelp(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAdmin = () => {
    if (!isAdmin) return;
    setSelectedGame(null);
    setShowProfile(false);
    setShowTerms(false);
    setShowRefund(false);
    setShowHelp(false);
    setShowAdmin(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Only use initial games as a fallback if DB is empty for users
  const activeGames = useMemo(() => {
    return games.length > 0 ? games : INITIAL_GAMES;
  }, [games]);

  const filteredGames = useMemo(() => {
    return activeGames.filter(game => 
      game.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, activeGames]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 overflow-x-hidden">
      <BackgroundAnimation />
      <AnimatePresence>
        {isInitialLoading && <SplashScreen />}
      </AnimatePresence>

      <Navbar 
        onOpenCart={() => setIsCartOpen(true)} 
        onOpenSupport={() => setIsSupportOpen(true)}
        onGoHome={handleGoHome}
        onOpenProfile={handleOpenProfile}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenAdmin={handleOpenAdmin}
        onLogout={handleLogout}
      />
      
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onAuthSuccess={handleGoHome} 
      />

      <AnimatePresence mode="wait">
        {showAdmin ? (
          <motion.div
            key="admin"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AdminDashboard />
          </motion.div>
        ) : showProfile ? (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Profile onBack={handleGoHome} onOpenAdmin={handleOpenAdmin} />
          </motion.div>
        ) : showTerms ? (
          <motion.div
            key="terms"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <TermsOfService onBack={handleGoHome} />
          </motion.div>
        ) : showRefund ? (
          <motion.div
            key="refund"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <RefundPolicy onBack={handleGoHome} />
          </motion.div>
        ) : showHelp ? (
          <motion.div
            key="help"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <HelpCenter 
              onBack={handleGoHome} 
              onOpenSupport={() => setIsSupportOpen(true)}
            />
          </motion.div>
        ) : !selectedGame ? (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Hero />

            <section id="games" className="max-w-[1600px] mx-auto px-6 pb-32 relative z-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 space-y-6 md:space-y-0">
                <div>
                  <h2 className="text-4xl font-display font-bold mb-3 text-slate-900">Active Catalogue</h2>
                  <p className="text-slate-400 text-sm font-medium">Find your favorite title to top-up instantly.</p>
                </div>
                
                <div className="relative w-full md:w-96 group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-slate-400 group-focus-within:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search games..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#FAF9F6] border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-red-600/50 focus:bg-[#FAF9F6] transition-all placeholder:text-slate-400 text-slate-900"
                  />
                </div>
              </div>

              {filteredGames.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                  {filteredGames.map((game, idx) => (
                    <motion.div
                      key={game.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <GameCard 
                        game={game} 
                        onClick={() => {
                          setSelectedGame(game);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }} 
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center bg-[#FAF9F6] rounded-3xl border border-black/5 shadow-sm">
                  <div className="text-5xl mb-4 opacity-20">🔍</div>
                  <h3 className="text-xl font-bold mb-2 text-slate-900">No missions found</h3>
                  <p className="text-slate-400 text-sm">Clear your search parameters to find results.</p>
                </div>
              )}
            </section>

            <section className="py-24 border-t border-[#FAF9F6]">
              <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   {[
                     { title: "Instant Link", desc: "Automated API recharges that finish in under 30 seconds.", icon: "⚡" },
                     { title: "Security Node", desc: "Every packet of data is encrypted via Gold Shield protocols.", icon: "🛡️" },
                     { title: "Elite Ops Support", desc: "Human-led support available 24/7 for all tactical queries.", icon: "🔴" }
                   ].map((feature, i) => (
                     <div key={i} className="group p-8 bg-[#FAF9F6]/40 backdrop-blur-md rounded-3xl border border-slate-200 hover:border-red-600/30 transition-all cursor-pointer shadow-sm hover:shadow-xl" onClick={() => setIsSupportOpen(true)}>
                        <div className="text-5xl mb-6 group-hover:scale-110 transition-transform">{feature.icon}</div>
                        <h4 className="text-xl font-bold mb-3 text-slate-900 group-hover:text-red-600 transition-colors">{feature.title}</h4>
                        <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
                     </div>
                   ))}
                </div>
              </div>
            </section>
          </motion.div>
        ) : (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <GameDetail 
              game={selectedGame} 
              onBack={handleGoHome} 
              onOpenAuth={() => setIsAuthModalOpen(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <Footer 
        onOpenTerms={handleOpenTerms} 
        onOpenRefund={handleOpenRefund}
        onOpenHelp={handleOpenHelp}
        onOpenSupport={() => setIsSupportOpen(true)} 
      />
    </div>
  );
};

export default App;
