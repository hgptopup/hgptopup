
export type Role = 'USER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

export interface GamePackage {
  id: string;
  amount: number;
  unit: string;
  price: number;
  bonus?: string;
  popular?: boolean;
}

export interface Game {
  id: string;
  title: string;
  category: 'FPS' | 'MOBA' | 'BATTLE_ROYALE' | 'RPG' | 'SPORTS';
  description: string;
  image: string;
  banner: string;
  packages: GamePackage[];
  featured?: boolean;
}

export interface CartItem {
  cartId: string;
  gameId: string;
  gameTitle: string;
  packageId: string;
  packageName: string;
  price: number;
  playerId: string;
  loginMethod?: string;
  password?: string;
  whatsapp?: string;
  vaultGmail?: string;
  vaultNumber?: string;
  image: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export interface NavLink {
  label: string;
  path: string;
}
