
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/supabaseClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateName = (name: string) => {
    // Allows letters and spaces, no numbers or symbols
    return /^[a-zA-Z\s]*$/.test(name) && name.trim().length >= 2;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation Logic
    if (!validateEmail(email)) {
      setError("Please enter a valid email address (e.g., player@gmail.com).");
      setLoading(false);
      return;
    }

    if (!isLogin && !validateName(fullName)) {
      setError("Full Name must contain only letters. Numbers and symbols are not allowed.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (loginError) throw loginError;
        onAuthSuccess?.();
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (signUpError) throw signUpError;
        onAuthSuccess?.();
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[300] p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-md glass-dark border border-white/10 rounded-[2.5rem] p-8 md:p-10 relative z-10 shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-red-600/10 rounded-full blur-[80px] -mr-20 -mt-20"></div>

            <div className="text-center mb-10">
              <div className="w-20 h-16 bg-gradient-to-br from-red-600 to-rose-900 rounded-2xl flex items-center justify-center font-display font-bold text-2xl mx-auto mb-6 shadow-lg neon-glow-red px-2 text-white">
                HGP
              </div>
              <h2 className="text-3xl font-display font-bold mb-2 text-white">
                {isLogin ? 'Welcome Back' : (
                  <>Join Hasibul <span className="text-red-600">Game Point</span></>
                )}
              </h2>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-6 p-4 bg-red-600/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-bold leading-tight uppercase tracking-wider"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-sm focus:outline-none focus:border-red-600 focus:bg-white/[0.08] transition-all text-white"
                  />
                </motion.div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="player@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-sm focus:outline-none focus:border-red-600 focus:bg-white/[0.08] transition-all text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 ml-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-sm focus:outline-none focus:border-red-600 focus:bg-white/[0.08] transition-all text-white"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-xl shadow-red-600/20 transition-all flex items-center justify-center gap-3 mt-6"
              >
                {loading ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full"></div>
                ) : (
                  <span>{isLogin ? 'Sign In' : 'Register Profile'}</span>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-xs font-bold text-white/40 hover:text-red-500 transition-colors uppercase tracking-widest"
              >
                {isLogin ? "Need an account? Sign Up" : "Already have an account? Login"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
