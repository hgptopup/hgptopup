
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
      whileHover={{ y: -8 }}
      onClick={onClick}
      className="group relative glass rounded-2xl overflow-hidden cursor-pointer border border-white/5 hover:border-red-500/50 transition-all shadow-lg w-full flex flex-col h-full"
    >
      {/* Container with fixed aspect ratio to ensure all images/cards are same size */}
      <div className="aspect-[3/4] w-full overflow-hidden bg-neutral-900 relative">
        <img 
          src={game.image} 
          alt={game.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
        
        {game.featured && (
          <div className="absolute top-3 right-3 px-2 py-0.5 bg-red-600 rounded-md text-[9px] font-bold uppercase tracking-tighter shadow-xl z-10">
            HOT
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest mb-1 block">
            {game.category.replace('_', ' ')}
          </span>
          <h3 className="text-sm md:text-base font-display font-bold group-hover:text-red-500 transition-colors leading-tight line-clamp-2">
            {game.title}
          </h3>
        </div>
      </div>
    </motion.div>
  );
};

export default GameCard;
