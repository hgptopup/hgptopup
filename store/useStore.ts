
import { jsPDF } from 'jspdf';
import { create } from 'zustand';
import { User, Order, CartItem, Role, Game, GamePackage, FloatingIcon } from '../types';
import { supabase } from '../services/supabaseClient';
import { GAMES as INITIAL_GAMES } from '../constants';
import { sendOrderNotification } from '../services/mailService';
import { sendTelegramNotification } from '../services/telegramService';

export interface HeroBanner {
  id: string;
  title: string;
  tag: string;
  price_text?: string;
  image_url: string;
}

interface AppState {
  user: any | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  orders: Order[];
  allOrders: Order[];
  allUsers: any[];
  games: Game[];
  heroBanners: HeroBanner[];
  floatingIcons: FloatingIcon[];
  cart: CartItem[];
  loading: boolean;
  dbError: string | null;
  
  setSession: (sessionUser: any) => Promise<void>;
  logout: () => Promise<void>;
  addToCart: (item: CartItem) => void;
  removeFromCart: (cartId: string) => void;
  clearCart: () => void;
  addOrder: (order: Order) => Promise<boolean>;
  fetchOrders: () => Promise<void>;
  fetchAllOrders: () => Promise<void>;
  fetchAllUsers: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<boolean>;
  
  fetchGames: () => Promise<void>;
  addGame: (game: Partial<Game>) => Promise<{success: boolean, error?: string}>;
  updateGame: (gameId: string, updates: Partial<Game>) => Promise<{success: boolean, error?: string}>;
  deleteGame: (gameId: string) => Promise<boolean>;

  fetchHeroBanners: () => Promise<void>;
  addHeroBanner: (banner: Partial<HeroBanner>) => Promise<{success: boolean, error?: string}>;
  updateHeroBanner: (id: string, updates: Partial<HeroBanner>) => Promise<{success: boolean, error?: string}>;
  deleteHeroBanner: (id: string) => Promise<boolean>;
  updateProfileBanner: (url: string) => Promise<boolean>;

  fetchFloatingIcons: () => Promise<void>;
  addFloatingIcon: (icon: Partial<FloatingIcon>) => Promise<{success: boolean, error?: string}>;
  updateFloatingIcon: (id: string, updates: Partial<FloatingIcon>) => Promise<{success: boolean, error?: string}>;
  deleteFloatingIcon: (id: string) => Promise<boolean>;
}

const ADMIN_EMAIL = 'hasibulgamepoint02@gmail.com';

export const useStore = create<AppState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  orders: [],
  allOrders: [],
  allUsers: [],
  games: [],
  heroBanners: [],
  floatingIcons: [],
  cart: [],
  loading: false,
  dbError: null,

  setSession: async (sessionUser) => {
    if (!sessionUser) {
      set({ user: null, isAuthenticated: false, isAdmin: false, orders: [], allOrders: [], allUsers: [] });
      return;
    }

    const isAdmin = sessionUser.email === ADMIN_EMAIL;
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', sessionUser.id).single();
    
    set({ 
      user: { 
        id: sessionUser.id, 
        name: profile?.full_name || sessionUser.email.split('@')[0], 
        email: sessionUser.email, 
        role: isAdmin ? 'ADMIN' : 'USER',
        profile_banner: profile?.profile_banner
      }, 
      isAuthenticated: true,
      isAdmin: isAdmin
    });

    await get().fetchGames();
    await get().fetchHeroBanners();
    await get().fetchFloatingIcons();
    await get().fetchOrders();
    if (isAdmin) {
      await get().fetchAllOrders();
      await get().fetchAllUsers();
    }
  },
  
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false, isAdmin: false, orders: [], allOrders: [], allUsers: [], cart: [] });
  },

  fetchGames: async () => {
    try {
      const { data, error } = await supabase.from('games').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        set({ games: data });
      }
    } catch (e) {}
  },

  fetchHeroBanners: async () => {
    try {
      const { data, error } = await supabase.from('hero_banners').select('*').order('created_at', { ascending: false });
      if (!error && data) set({ heroBanners: data });
    } catch (e) {}
  },

  addHeroBanner: async (banner) => {
    const { id, ...cleanBanner } = banner as any;
    const { error } = await supabase.from('hero_banners').insert([cleanBanner]);
    if (error) return { success: false, error: error.message };
    await get().fetchHeroBanners();
    return { success: true };
  },

  updateHeroBanner: async (id, updates) => {
    const { error } = await supabase.from('hero_banners').update(updates).eq('id', id);
    if (error) return { success: false, error: error.message };
    await get().fetchHeroBanners();
    return { success: true };
  },

  deleteHeroBanner: async (id) => {
    const { error } = await supabase.from('hero_banners').delete().eq('id', id);
    if (error) return false;
    await get().fetchHeroBanners();
    return true;
  },

  updateProfileBanner: async (url) => {
    const { user } = get();
    if (!user) return false;
    const { error } = await supabase.from('profiles').update({ profile_banner: url }).eq('id', user.id);
    if (!error) {
      set({ user: { ...user, profile_banner: url } });
      return true;
    }
    return false;
  },

  fetchFloatingIcons: async () => {
    try {
      const { data, error } = await supabase.from('hero_floating_icons').select('*').order('created_at', { ascending: false });
      if (!error && data) set({ floatingIcons: data });
    } catch (e) {}
  },

  addFloatingIcon: async (icon) => {
    const { id, ...cleanIcon } = icon as any;
    const { error } = await supabase.from('hero_floating_icons').insert([cleanIcon]);
    if (error) return { success: false, error: error.message };
    await get().fetchFloatingIcons();
    return { success: true };
  },

  updateFloatingIcon: async (id, updates) => {
    const { error } = await supabase.from('hero_floating_icons').update(updates).eq('id', id);
    if (error) return { success: false, error: error.message };
    await get().fetchFloatingIcons();
    return { success: true };
  },

  deleteFloatingIcon: async (id) => {
    const { error } = await supabase.from('hero_floating_icons').delete().eq('id', id);
    if (error) return false;
    await get().fetchFloatingIcons();
    return true;
  },

  fetchAllUsers: async ( ) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (!error && data) set({ allUsers: data });
    } catch (e) {}
  },

  addGame: async (game) => {
    const { error } = await supabase.from('games').insert([game]);
    if (error) return { success: false, error: error.message };
    await get().fetchGames();
    return { success: true };
  },

  updateGame: async (gameId, updates) => {
    const { error } = await supabase.from('games').update(updates).eq('id', gameId);
    if (error) return { success: false, error: error.message };
    await get().fetchGames();
    return { success: true };
  },

  deleteGame: async (gameId) => {
    const { error } = await supabase.from('games').delete().eq('id', gameId);
    if (error) return false;
    await get().fetchGames();
    return true;
  },
  
  addToCart: (item) => set((state) => ({ cart: [...state.cart, item] })),
  removeFromCart: (cartId) => set((state) => ({ cart: state.cart.filter(i => i.cartId !== cartId) })),
  clearCart: () => set({ cart: [] }),
  
  fetchOrders: async () => {
    const { user } = get();
    if (!user) return;
    const { data } = await supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) {
      set({ orders: data.map(o => ({
        id: o.id,
        userId: o.user_id,
        items: o.items, 
        totalAmount: Number(o.total_amount),
        status: o.status,
        createdAt: o.created_at,
        transactionId: o.transaction_id || 'N/A',
        paymentMethod: o.payment_method || 'N/A'
      }))});
    }
  },

  fetchAllOrders: async () => {
    if (!get().isAdmin) return;
    try {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (error) {
        console.error("HGP DB ERROR (fetchAllOrders):", error);
        return;
      }
      if (data) {
        console.log(`HGP DEBUG: Fetched ${data.length} orders for admin.`);
        set({ allOrders: data.map(o => ({
          id: o.id,
          userId: o.user_id,
          items: o.items, 
          totalAmount: Number(o.total_amount),
          status: o.status,
          createdAt: o.created_at,
          transactionId: o.transaction_id || 'N/A',
          paymentMethod: o.payment_method || 'N/A'
        }))});
      }
    } catch (e) {
      console.error("HGP FETCH ERROR (fetchAllOrders):", e);
    }
  },

  updateOrderStatus: async (orderId, status) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (!error) {
      await get().fetchAllOrders();
      return true;
    }
    return false;
  },

  addOrder: async (order) => {
    const { user } = get();
    if (!user) {
      console.error("HGP ERROR: No user found in store during addOrder");
      return false;
    }

    console.log("HGP DEBUG: Saving order to Supabase...", order.id);
    
    // Insert into DB - Removed payment_method and transaction_id to avoid PGRST204 error
    // since these columns are missing in the user's Supabase schema.
    const { error: dbError } = await supabase.from('orders').insert([{
      id: order.id,
      user_id: user.id,
      items: order.items,
      total_amount: order.totalAmount,
      status: order.status
      // transaction_id and payment_method removed from here
    }]);

    if (dbError) {
      console.error("HGP DB ERROR:", dbError);
      alert(`Database Error: ${dbError.message}`);
      return false;
    }

    // Generate PDF Receipt
    let pdfDataUri = '';
    try {
      console.log("HGP DEBUG: Generating PDF Receipt...");
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.setTextColor(234, 179, 8); // Gold color
      doc.text('Hasibul Game Point', 20, 20);
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Order ID: ${order.id}`, 20, 40);
      doc.text(`Date: ${new Date().toLocaleString()}`, 20, 50);
      doc.text(`Customer: ${user.name}`, 20, 60);
      doc.text(`Email: ${user.email}`, 20, 70);
      
      doc.line(20, 75, 190, 75);
      
      doc.setFontSize(14);
      doc.text('Order Items:', 20, 85);
      
      let y = 95;
      order.items.forEach((item) => {
        doc.setFontSize(12);
        doc.text(`${item.gameTitle} - ${item.packageName}`, 25, y);
        doc.setFontSize(10);
        doc.text(`Target ID: ${item.playerId}`, 30, y + 5);
        y += 15;
      });
      
      doc.line(20, y, 190, y);
      y += 10;
      doc.setFontSize(14);
      doc.text(`Total Amount: ${order.totalAmount} BDT`, 20, y);
      y += 10;
      doc.text(`Payment Method: ${order.paymentMethod}`, 20, y);
      y += 10;
      doc.text(`Transaction ID: ${order.transactionId}`, 20, y);
      
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text('Thank you for choosing HGP Gold Protocol.', 20, y + 20);
      
      pdfDataUri = doc.output('datauristring');
      console.log("HGP DEBUG: PDF Generation Success.");
    } catch (pdfErr: any) {
      console.error("HGP PDF ERROR:", pdfErr);
      // We don't return false here because the order is already saved in DB
    }

    // Trigger Notifications
    console.log("HGP DEBUG: Triggering notifications...");
    
    // Admin: Telegram Only
    sendTelegramNotification(order).then(res => 
      console.log(`HGP DEBUG: Telegram notification result: ${res ? 'SUCCESS' : 'FAILED'}`)
    );
    
    // User: Email with PDF
    sendOrderNotification(order, user.email, user.name, pdfDataUri).then(res => 
      console.log(`HGP DEBUG: User email notification result: ${res ? 'SUCCESS' : 'FAILED'}`)
    );

    get().clearCart();
    await get().fetchOrders();
    if (get().isAdmin) await get().fetchAllOrders();
    return true;
  }
}));
