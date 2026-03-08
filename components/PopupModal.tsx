import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PopupOption } from '../types';

interface PopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: PopupOption[];
  onSelectOption: (targetGameId: string) => void;
}

const PopupModal: React.FC<PopupModalProps> = ({ isOpen, onClose, options, onSelectOption }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-[#FAF9F6] rounded-3xl shadow-2xl overflow-hidden border border-black/5"
          >
            <div className="p-6 border-b border-black/5 flex justify-between items-center bg-white">
              <h3 className="text-xl font-bold text-slate-900">Select Option</h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 grid grid-cols-2 gap-4">
              {options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => onSelectOption(option.targetGameId || option.id)}
                  className="group relative flex flex-col items-center p-4 bg-white rounded-2xl border border-black/5 hover:border-red-600/30 hover:shadow-lg transition-all text-left overflow-hidden"
                >
                  <div className="w-full aspect-square mb-3 rounded-xl overflow-hidden bg-slate-100">
                    <img 
                      src={option.image || 'https://picsum.photos/seed/game/400/400'} 
                      alt={option.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="font-bold text-slate-900 text-center w-full truncate">
                    {option.title}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PopupModal;
