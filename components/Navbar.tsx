
import React, { useState } from 'react';
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
  const { user, isAuthenticated, isAdmin, cart } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const navLinks = [
    { label: 'Home', onClick: () => { onGoHome(); closeMobileMenu(); } },
    { label: 'Cart', onClick: () => { onOpenCart(); closeMobileMenu(); }, badge: cart.length },
    { label: 'Support', onClick: () => { onOpenSupport(); closeMobileMenu(); } },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 px-4 md:px-6 py-3 md:py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-2 cursor-pointer group"
          onClick={onGoHome}
        >
          <div className="w-10 h-8 md:w-14 md:h-10 bg-gradient-to-br from-red-600 to-rose-900 rounded-lg md:rounded-xl flex items-center justify-center font-display font-bold text-[10px] md:text-sm shadow-lg neon-glow-red group-hover:scale-110 transition-transform px-2 text-white">
            HGP
          </div>
          <span className="text-xl md:text-2xl font-display font-bold hidden sm:inline text-white">
            Hasibul <span className="text-red-600">Game Point</span>
          </span>
        </motion.div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <button 
              key={link.label}
              onClick={link.onClick} 
              className="relative flex items-center gap-1 text-sm uppercase tracking-widest font-bold text-white/60 hover:text-red-500 transition-colors"
            >
              <span>{link.label}</span>
              {link.badge !== undefined && link.badge > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-red-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                >
                  {link.badge}
                </motion.span>
              )}
            </button>
          ))}
          
          {isAdmin && (
            <button 
              onClick={onOpenAdmin} 
              className="text-sm uppercase tracking-widest font-bold text-red-500 hover:text-red-400 transition-colors bg-red-500/10 px-3 py-1 rounded-lg border border-red-500/20"
            >
              Admin
            </button>
          )}
        </div>

        {/* User / Login Section (Desktop) */}
        <div className="hidden md:flex items-center space-x-4">
          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              <button 
                onClick={onOpenProfile}
                className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 transition-all rounded-full p-1 pr-4 group"
              >
                <img 
                  src={`https://ui-avatars.com/api/?name=${user?.name}&background=991b1b&color=fff`} 
                  className="w-8 h-8 rounded-full border border-white/5" 
                  alt="Avatar" 
                />
                <span className="text-[11px] font-bold truncate max-w-[80px] group-hover:text-red-500 transition-colors text-white">{user?.name}</span>
              </button>

              <button 
                onClick={onLogout}
                className="text-white/40 hover:text-red-500 transition-colors p-1"
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
              className="px-6 py-2 bg-gradient-to-r from-red-600 to-rose-700 rounded-full text-xs font-bold shadow-lg hover:shadow-red-500/20 transition-all uppercase tracking-widest text-white"
            >
              Login
            </motion.button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center space-x-4">
          <button 
            onClick={onOpenCart}
            className="relative p-2 text-white/60 hover:text-red-500 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {cart.length > 0 && (
              <span className="absolute top-0 right-0 bg-red-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                {cart.length}
              </span>
            )}
          </button>
          
          <button 
            onClick={toggleMobileMenu}
            className="p-2 text-white/60 hover:text-red-500 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass-dark border-t border-white/5 overflow-hidden mt-3"
          >
            <div className="flex flex-col p-4 space-y-4">
              {navLinks.map((link) => (
                <button 
                  key={link.label}
                  onClick={link.onClick} 
                  className="flex items-center justify-between w-full text-left text-sm uppercase tracking-widest font-bold text-white/60 hover:text-red-500 transition-colors py-2"
                >
                  <span>{link.label}</span>
                  {link.badge !== undefined && link.badge > 0 && (
                    <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {link.badge}
                    </span>
                  )}
                </button>
              ))}

              {isAdmin && (
                <button 
                  onClick={() => { onOpenAdmin?.(); closeMobileMenu(); }} 
                  className="w-full text-left text-sm uppercase tracking-widest font-bold text-red-500 hover:text-red-400 transition-colors py-2"
                >
                  Admin Panel
                </button>
              )}

              <div className="pt-4 border-t border-white/5">
                {isAuthenticated ? (
                  <div className="space-y-4">
                    <button 
                      onClick={() => { onOpenProfile(); closeMobileMenu(); }}
                      className="flex items-center space-x-3 w-full"
                    >
                      <img 
                        src={`https://ui-avatars.com/api/?name=${user?.name}&background=991b1b&color=fff`} 
                        className="w-10 h-10 rounded-full border border-white/5" 
                        alt="Avatar" 
                      />
                      <div className="text-left">
                        <p className="text-sm font-bold text-white">{user?.name}</p>
                        <p className="text-[10px] text-white/40 uppercase tracking-wider">View Profile</p>
                      </div>
                    </button>
                    <button 
                      onClick={() => { onLogout(); closeMobileMenu(); }}
                      className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold text-white/60 hover:text-red-500 transition-all text-center"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { onOpenAuth(); closeMobileMenu(); }}
                    className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-700 rounded-xl text-sm font-bold shadow-lg text-white uppercase tracking-widest"
                  >
                    Login / Sign Up
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
