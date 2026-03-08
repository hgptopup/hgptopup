
import React from 'react';
import { motion } from 'framer-motion';
import { Game } from '../types';

interface GameCardProps {
  game: Game;
  onClick: () => void;
}

const GameCard: React.FC<GameCardProps> = ({ game, onClick }) => {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      onClick={onClick}
      className="group relative bg-[#FAF9F6] rounded-2xl overflow-hidden cursor-pointer border border-slate-200 hover:border-red-600/50 transition-all shadow-sm hover:shadow-[0_0_15px_rgba(220,38,38,0.3)] w-full flex flex-col h-full"
    >
      {/* Container with fixed aspect ratio to ensure all images/cards are same size */}
      <div className="aspect-[3/4] w-full overflow-hidden bg-[#FAF9F6] relative">
        <img 
          src={game.image} 
          alt={game.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        
        {game.featured && (
          <div className="absolute top-3 right-3 px-2 py-0.5 bg-red-600 text-[#FAF9F6] rounded-md text-[9px] font-bold uppercase tracking-tighter shadow-lg z-10">
            HOT
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest mb-1 block">
            {game.category.replace('_', ' ')}
          </span>
          <h3 className="text-sm md:text-base font-display font-bold text-[#FAF9F6] group-hover:text-red-200 transition-colors leading-tight line-clamp-2">
            {game.title}
          </h3>
        </div>
      </div>
    </motion.div>
  );
};

export default GameCard;
