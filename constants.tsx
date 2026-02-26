
import { Game } from './types';

export const GAMES: Game[] = [
  {
    id: 'g1',
    title: 'Mobile Legends',
    category: 'MOBA',
    description: 'Join your friends in a brand new 5v5 MOBA showdown.',
    image: 'https://picsum.photos/seed/mlbb/400/500',
    banner: 'https://picsum.photos/seed/mlbb-banner/1200/400',
    featured: true,
    packages: [
      { id: 'p1', amount: 86, unit: 'Diamonds', price: 115 },
      { id: 'p2', amount: 172, unit: 'Diamonds', price: 230, popular: true },
      { id: 'p3', amount: 706, unit: 'Diamonds', price: 950 },
    ]
  },
  {
    id: 'g2',
    title: 'PUBG Mobile',
    category: 'BATTLE_ROYALE',
    description: 'The original battle royale on mobile.',
    image: 'https://picsum.photos/seed/pubg/400/500',
    banner: 'https://picsum.photos/seed/pubg-banner/1200/400',
    featured: true,
    packages: [
      { id: 'p5', amount: 60, unit: 'UC', price: 110 },
      { id: 'p6', amount: 325, unit: 'UC', price: 550, popular: true },
    ]
  },
  {
    id: 'g3',
    title: 'Genshin Impact',
    category: 'RPG',
    description: 'Adventure in the world of Teyvat.',
    image: 'https://picsum.photos/seed/genshin/400/500',
    banner: 'https://picsum.photos/seed/genshin-banner/1200/400',
    packages: [
      { id: 'p9', amount: 60, unit: 'Genesis Crystals', price: 120 },
      { id: 'p11', amount: 980, unit: 'Genesis Crystals', price: 1750, popular: true },
    ]
  },
  {
    id: 'g4',
    title: 'Valorant',
    category: 'FPS',
    description: 'Character-based tactical shooter.',
    image: 'https://picsum.photos/seed/val/400/500',
    banner: 'https://picsum.photos/seed/val-banner/1200/400',
    packages: [
      { id: 'p13', amount: 475, unit: 'VP', price: 580 },
      { id: 'p14', amount: 1000, unit: 'VP', price: 1150, popular: true },
    ]
  }
];
