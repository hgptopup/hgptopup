
import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, useParams, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import GameCard from './components/GameCard';
import Footer from './components/Footer';

// Lazy load pages for better performance
const GameDetail = lazy(() => import('./pages/GameDetail'));
const Profile = lazy(() => import('./pages/Profile'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const RefundPolicy = lazy(() => import('./pages/RefundPolicy'));
const HelpCenter = lazy(() => import('./pages/HelpCenter'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Cart = lazy(() => import('./pages/Cart'));
const Support = lazy(() => import('./pages/Support'));
const Payment = lazy(() => import('./pages/Payment'));

import CartDrawer from './components/CartDrawer';
import SupportModal from './components/SupportModal';
import AuthModal from './components/AuthModal';
import SplashScreen from './components/SplashScreen';
import BackgroundAnimation from './components/BackgroundAnimation';
import PopupModal from './components/PopupModal';
import { Game, PopupOption } from './types';
import { useStore } from './store/useStore';
import { supabase } from './services/supabaseClient';

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

const getSlug = (title: string) => title.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

// Home Component
const Home: React.FC<{ 
  searchQuery: string; 
  setSearchQuery: (q: string) => void;
  filteredGames: Game[];
  handleGameClick: (game: Game) => void;
  setIsSupportOpen: (open: boolean) => void;
}> = ({ searchQuery, setSearchQuery, filteredGames, handleGameClick, setIsSupportOpen }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
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
                transition={{ delay: idx * 0.02, duration: 0.2 }}
              >
                <GameCard 
                  game={game} 
                  onClick={() => handleGameClick(game)} 
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
  );
};

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pathname = window.location.pathname;
    return !!(urlParams.get('payment') === 'success' || pathname.includes('/payment/success'));
  });
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [popupOptions, setPopupOptions] = useState<PopupOption[] | null>(null);
  const [popupSourceGame, setPopupSourceGame] = useState<Game | null>(null);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  
  const { setSession, isAuthenticated, isAdmin, games, fetchGames, logout, user, fetchOrders, setJustCompletedOrder } = useStore();

  useEffect(() => {
    // Suppress specific Supabase unhandled rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reasonStr = event.reason?.message || String(event.reason);
      if (reasonStr.includes('Refresh Token')) {
        event.preventDefault();
        supabase.auth.signOut().catch(() => {});
      }
    };
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    const initApp = async () => {
      // Force hide loading screen after 800ms to make it feel extremely fast
      const loadingTimer = setTimeout(() => {
        setIsInitialLoading(false);
      }, 800);

      try {
        // Fetch session and public data in parallel for maximum speed
        const [sessionResponse] = await Promise.all([
          supabase.auth.getSession(),
          useStore.getState().fetchGames(),
          useStore.getState().fetchFloatingIcons(),
          useStore.getState().fetchHeroBanners(),
          useStore.getState().fetchSiteSettings()
        ]);

        const { data: { session }, error } = sessionResponse;
        if (error) {
          const errMsg = error.message || String(error);
          if (!errMsg.includes('Refresh Token')) {
            console.error("Session error:", errMsg);
          }
          supabase.auth.signOut().catch(() => {});
          setSession(null); // Non-blocking
        } else {
          setSession(session?.user ?? null); // Non-blocking
        }
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        if (!errMsg.includes('Refresh Token')) {
          console.error("Failed to get session:", err);
        }
        supabase.auth.signOut().catch(() => {});
        setSession(null);
      } finally {
        clearTimeout(loadingTimer);
        setIsInitialLoading(false);
      }
    };

    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
        setSession(session?.user ?? null).catch(console.error);
      } else if (event === 'SIGNED_OUT') {
        setSession(null).catch(console.error);
      } else {
        setSession(session?.user ?? null).catch(console.error);
      }
    });

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      subscription.unsubscribe();
    };
  }, [setSession]);

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
  }, [isAuthenticated, user, fetchOrders]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pathname = window.location.pathname;
    let paymentStatus = urlParams.get('payment') || (pathname.includes('/payment/success') ? 'success' : pathname.includes('/payment/cancel') ? 'cancel' : null);
    const orderIdParam = urlParams.get('orderId') || urlParams.get('order_id');
    let invoiceId = urlParams.get('invoiceId') || urlParams.get('invoice_id') || (orderIdParam ? sessionStorage.getItem(`zinipay_invoice_${orderIdParam}`) : null);

    if (paymentStatus === 'success') {
      // Wait for auth to be ready
      if (!isAuthenticated || !user) return;

      // Prevent duplicate verification
      const handledInvoices = JSON.parse(sessionStorage.getItem('handled_invoices') || '[]');
      if (invoiceId && handledInvoices.includes(invoiceId)) {
        if (window.location.search.includes('payment=success')) {
          setIsVerifyingPayment(false);
          navigate('/profile', { replace: true });
        }
        return;
      }

      if (!invoiceId) {
        if (orderIdParam) {
          // If we have orderId but no invoiceId, check order status directly
          supabase.from('orders').select('status, transaction_id').eq('id', orderIdParam).maybeSingle().then(({ data }) => {
            if (data && (data.status === 'COMPLETED' || (data.transaction_id && data.transaction_id !== 'PENDING_ZINIPAY'))) {
              fetchOrders();
              setIsVerifyingPayment(false);
              setShowPaymentSuccess(true);
            } else {
              setIsVerifyingPayment(false);
              navigate('/profile', { replace: true });
            }
          });
          return;
        }
        setIsVerifyingPayment(false);
        navigate('/profile', { replace: true });
        return;
      }

      fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId, orderId: orderIdParam })
      })
      .then(res => res.json())
      .then(data => {
        // The backend handles order status updates and notifications
        fetchOrders();
        setIsVerifyingPayment(false);
        setShowPaymentSuccess(true);
        
        if (invoiceId) {
          const updatedHandled = [...handledInvoices, invoiceId];
          sessionStorage.setItem('handled_invoices', JSON.stringify(updatedHandled));
        }
      })
      .catch(err => {
        console.error("Payment verification error:", err);
        setIsVerifyingPayment(false);
        setShowPaymentSuccess(true); // Show popup even on error to allow user to proceed
      });
    } else if (paymentStatus === 'cancel') {
      sessionStorage.removeItem('hgp_return_state');
      alert("Payment was cancelled.");
      setIsVerifyingPayment(false);
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, user, location.search, navigate, fetchOrders]);

  const handleGoHome = () => {
    console.log("handleGoHome called");
    setIsVerifyingPayment(false);
    navigate('/', { replace: true });
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
    navigate('/profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAdmin = () => {
    if (!isAdmin) return;
    navigate('/admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeGames = useMemo(() => {
    return games;
  }, [games]);

  const popupTargetIds = useMemo(() => {
    const ids = new Set<string>();
    activeGames.forEach(game => {
      game.packages?.forEach(pkg => {
        if ('isPopupOption' in pkg && pkg.isPopupOption && pkg.targetGameId) {
          ids.add(pkg.targetGameId);
        }
      });
    });
    return ids;
  }, [activeGames]);

  const filteredGames = useMemo(() => {
    return activeGames.filter(game => 
      !popupTargetIds.has(game.id) && game.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, activeGames, popupTargetIds]);

  const handleGameClick = (game: Game) => {
    const options = game.packages?.filter(pkg => 'isPopupOption' in pkg && pkg.isPopupOption) as PopupOption[];
    if (options && options.length > 0) {
      setPopupSourceGame(game);
      setPopupOptions(options);
    } else {
      navigate(`/store/${getSlug(game.title)}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePopupSelect = (targetGameId: string) => {
    const option = popupOptions?.find(opt => opt.targetGameId === targetGameId || opt.id === targetGameId);
    
    if (option && option.packages && option.packages.length > 0 && popupSourceGame) {
      const dynamicGame: Game = {
        ...popupSourceGame,
        id: option.id,
        image: option.image || popupSourceGame.image,
        packages: option.packages,
      };
      setPopupOptions(null);
      navigate(`/store/${getSlug(option.title)}`, { state: { game: dynamicGame } });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const targetGame = activeGames.find(g => g.id === targetGameId || g.title.toLowerCase() === targetGameId.toLowerCase());
      if (targetGame) {
        setPopupOptions(null);
        handleGameClick(targetGame);
      } else {
        alert("Target shop not found!");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 overflow-x-hidden">
      <BackgroundAnimation />
      <AnimatePresence>
        {isVerifyingPayment ? (
          <SplashScreen key="verifying" message="Verifying Payment..." onBack={handleGoHome} />
        ) : isInitialLoading ? (
          <SplashScreen key="initial" />
        ) : null}
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

      <PopupModal
        isOpen={!!popupOptions}
        onClose={() => setPopupOptions(null)}
        options={popupOptions || []}
        onSelectOption={handlePopupSelect}
      />

      <AnimatePresence>
        {showPaymentSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#FAF9F6] rounded-xl p-10 max-w-2xl w-full text-center shadow-2xl border border-red-600"
            >
              <div className="w-24 h-24 bg-[#c6f6d5] rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-[#059669]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-3xl font-display font-bold mb-4 text-[#111827]">Order Successful</h3>
              <p className="text-[#6b7280] text-lg mb-10 font-medium leading-relaxed max-w-lg mx-auto">
                We have received your payment intel. Deployment usually starts within 5-30 minutes. You can track this in your profile history.
              </p>
              <button 
                onClick={() => {
                  setShowPaymentSuccess(false);
                  sessionStorage.removeItem('hgp_return_state');
                  handleOpenProfile();
                }} 
                className="w-full py-4 bg-[#00A651] hover:bg-[#008c44] text-white font-bold rounded-2xl transition-all uppercase tracking-widest text-sm"
              >
                RETURN TO ARENA
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <Suspense fallback={<PageLoader />}>
          <Routes location={location}>
            <Route path="/" element={
              <Home 
                searchQuery={searchQuery} 
                setSearchQuery={setSearchQuery} 
                filteredGames={filteredGames} 
                handleGameClick={handleGameClick}
                setIsSupportOpen={setIsSupportOpen}
              />
            } />
            <Route path="/shop" element={<Navigate to="/" replace />} />
            <Route path="/shop/*" element={<Navigate to="/" replace />} />
            <Route path="/store/*" element={<Navigate to="/" replace />} />
            
            <Route path="/game/:gameId" element={
              <GameDetailWrapper 
                activeGames={activeGames} 
                onBack={handleGoHome} 
                onOpenAuth={() => setIsAuthModalOpen(true)} 
              />
            } />
            
            <Route path="/store/:storeName" element={
              <GameDetailWrapper 
                activeGames={activeGames} 
                onBack={handleGoHome} 
                onOpenAuth={() => setIsAuthModalOpen(true)} 
              />
            } />
            
            <Route path="/profile" element={
              isAuthenticated ? (
                <Profile onBack={handleGoHome} onOpenAdmin={handleOpenAdmin} />
              ) : (
                <Navigate to="/" replace />
              )
            } />
            
            <Route path="/admin" element={
              isAdmin ? (
                <AdminDashboard />
              ) : (
                <Navigate to="/" replace />
              )
            } />
            
            <Route path="/terms" element={<TermsOfService onBack={handleGoHome} />} />
            <Route path="/refund" element={<RefundPolicy onBack={handleGoHome} />} />
            <Route path="/help" element={
              <HelpCenter 
                onBack={handleGoHome} 
                onOpenSupport={() => navigate('/support')}
              />
            } />
            
            <Route path="/cart" element={<Cart />} />
            <Route path="/support" element={<Support />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/Payment" element={<Navigate to="/payment" replace />} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AnimatePresence>

      <Footer 
        onOpenTerms={() => navigate('/terms')} 
        onOpenRefund={() => navigate('/refund')}
        onOpenHelp={() => navigate('/help')}
        onOpenSupport={() => setIsSupportOpen(true)} 
      />
    </div>
  );
};

const GameDetailWrapper: React.FC<{ 
  activeGames: Game[]; 
  onBack: () => void; 
  onOpenAuth: () => void;
}> = ({ activeGames, onBack, onOpenAuth }) => {
  const { gameId, storeName } = useParams();
  const location = useLocation();
  
  const game = useMemo(() => {
    // Check if game was passed via state (for dynamic popup options)
    if (location.state?.game) return location.state.game;
    
    if (storeName) {
      return activeGames.find(g => getSlug(g.title) === storeName);
    }
    
    return activeGames.find(g => g.id === gameId);
  }, [gameId, storeName, activeGames, location.state]);

  if (!game) return <Navigate to="/" replace />;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      <GameDetail 
        game={game} 
        onBack={onBack} 
        onOpenAuth={onOpenAuth}
      />
    </motion.div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
