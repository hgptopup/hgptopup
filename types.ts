
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
  amount: string | number;
  unit: string;
  price: number;
  bonus?: string;
  popular?: boolean;
}

export interface PopupOption {
  id: string;
  isPopupOption: true;
  targetGameId?: string;
  title: string;
  image: string;
  packages?: GamePackage[];
}

export interface Game {
  id: string;
  title: string;
  category: 'FPS' | 'MOBA' | 'BATTLE_ROYALE' | 'RPG' | 'SPORTS';
  description: string;
  image: string;
  banner: string;
  packages: (GamePackage | PopupOption)[];
  featured?: boolean;
  loginMethods?: string[];
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
  image: string;
}

export interface Order {
  id: string;
  userId: string;
  customerName?: string;
  items: CartItem[];
  totalAmount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  transactionId?: string;
  paymentMethod?: string;
}

export interface NavLink {
  label: string;
  path: string;
}

export interface FloatingIcon {
  id: string;
  icon: string;
  label?: string;
  delay?: number;
  duration?: number;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center-left' | 'center-right';
}
