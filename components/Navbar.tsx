
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';

interface NavbarProps {
  onOpenCart: () => void;
  onOpenSupport: () => void;
  onGoHome: () => void;
  onOpenProfile: () => void;
  onOpenAuth: () => void;
  onOpenAdmin?: () => void;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ 
  onOpenCart, 
  onOpenSupport, 
  onGoHome, 
  onOpenProfile, 
  onOpenAuth, 
  onOpenAdmin,
  onLogout
}) => {
  const { user, isAuthenticated, isAdmin, cart, orders, justCompletedOrder, logoUrl } = useStore();

  const latestOrder = React.useMemo(() => {
    if (!orders || orders.length === 0) return null;
    return [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }, [orders]);

  const isProcessing = latestOrder?.status === 'PENDING' || latestOrder?.status === 'PROCESSING';
  const isCompleted = latestOrder?.status === 'COMPLETED';

  const avatarAnimationClass = isProcessing 
    ? 'animate-breathe-red' 
    : (isCompleted && justCompletedOrder)
    ? 'animate-breathe-green' 
    : 'border-[#FAF9F6]/10';

  const navLinks = [
    { label: 'Home', onClick: onGoHome },
    { label: 'Cart', onClick: onOpenCart, badge: cart.length },
    { label: 'Support', onClick: onOpenSupport },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0B0B0F]/90 backdrop-blur-xl border-b border-[#FAF9F6]/5">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex justify-between items-center">
          {/* Logo */}
          <Link 
            to="/"
            className="flex items-center space-x-2 cursor-pointer group min-w-0"
            onClick={(e) => {
              if (window.location.pathname === '/') {
                e.preventDefault();
                onGoHome();
              }
            }}
          >
            <div className="relative shrink-0">
              <img src={logoUrl || "https://i.imgur.com/VjpTmnL.png"} alt="Hasibul Game Point Logo" className="w-10 h-10 md:w-14 md:h-14 object-cover rounded-full border-2 border-red-600/50 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-sm sm:text-xl md:text-2xl font-display font-bold text-[#FAF9F6] truncate">
              Hasibul <span className="text-red-600">Game Point</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/"
              className="relative flex items-center gap-1 text-sm uppercase tracking-widest font-bold text-slate-400 hover:text-[#FAF9F6] transition-colors"
            >
              Home
            </Link>
            <Link 
              to="/cart"
              className="relative flex items-center gap-1 text-sm uppercase tracking-widest font-bold text-slate-400 hover:text-[#FAF9F6] transition-colors"
            >
              <span>Cart</span>
              {cart.length > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-red-600 text-[#FAF9F6] text-[9px] px-1.5 py-0.5 rounded-full font-bold shadow-sm"
                >
                  {cart.length}
                </motion.span>
              )}
            </Link>
            <Link 
              to="/support"
              className="relative flex items-center gap-1 text-sm uppercase tracking-widest font-bold text-slate-400 hover:text-[#FAF9F6] transition-colors"
            >
              Support
            </Link>
            
            {isAdmin && (
              <Link 
                to="/admin"
                className="text-sm uppercase tracking-widest font-bold text-red-600 hover:text-red-700 transition-colors bg-red-600/10 px-3 py-1 rounded-lg border border-red-600/20"
              >
                Admin
              </Link>
            )}
          </div>

          {/* User / Login Section */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-2 md:space-x-4">
                <button 
                  onClick={onOpenProfile}
                  className="flex items-center space-x-2 bg-[#FAF9F6]/5 hover:bg-[#FAF9F6]/10 transition-all rounded-full p-1 md:pr-4 group"
                >
                  <img 
                    src={`https://ui-avatars.com/api/?name=${user?.name}&background=dc2626&color=fff`} 
                    className={`w-8 h-8 rounded-full border ${avatarAnimationClass}`} 
                    alt="Avatar" 
                  />
                  <span className="hidden md:block text-[11px] font-bold truncate max-w-[80px] group-hover:text-red-500 transition-colors text-[#FAF9F6]">{user?.name}</span>
                </button>

                <button 
                  onClick={onLogout}
                  className="hidden md:block text-slate-400 hover:text-red-500 transition-colors p-1"
                  title="Logout"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onOpenAuth}
                className="px-4 md:px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 rounded-full text-[10px] md:text-xs font-bold shadow-lg hover:shadow-red-600/20 transition-all uppercase tracking-widest text-[#FAF9F6]"
              >
                Login
              </motion.button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-[#1A1A24] backdrop-blur-xl border border-[#FAF9F6]/10 rounded-full px-8 py-4 flex items-center gap-10 shadow-2xl">
          <Link to="/" className="text-slate-400 hover:text-[#FAF9F6] transition-colors flex flex-col items-center gap-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Link>
          
          <Link to="/cart" className="text-slate-400 hover:text-[#FAF9F6] transition-colors relative flex flex-col items-center gap-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-[#FAF9F6] text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                {cart.length}
              </span>
            )}
          </Link>

          <Link to="/support" className="text-slate-400 hover:text-[#FAF9F6] transition-colors flex flex-col items-center gap-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </Link>
        </div>
      </div>
    </>
  );
};

export default Navbar;
