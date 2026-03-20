
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
  logoUrl: string | null;
  bdtRate: number;
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
  
  fetchSiteSettings: () => Promise<void>;
  updateBdtRate: (rate: number) => Promise<boolean>;
  updateLogo: (url: string) => Promise<boolean>;
  setLogoUrl: (url: string | null) => void;
  
  justCompletedOrder: boolean;
  setJustCompletedOrder: (val: boolean) => void;
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
  logoUrl: null,
  bdtRate: 125,
  cart: [],
  loading: false,
  dbError: null,
  justCompletedOrder: false,
  setJustCompletedOrder: (val) => set({ justCompletedOrder: val }),

  setSession: async (sessionUser) => {
    if (!sessionUser) {
      set({ user: null, isAuthenticated: false, isAdmin: false, orders: [], allOrders: [], allUsers: [] });
      return;
    }

    const isAdmin = sessionUser.email === ADMIN_EMAIL;
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', sessionUser.id).maybeSingle();
    
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
    await get().fetchSiteSettings();
    await get().fetchOrders();
    if (isAdmin) {
      await get().fetchAllOrders();
      await get().fetchAllUsers();

      // Real-time subscriptions for admin
      supabase
        .channel('admin-updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
          get().fetchAllUsers();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          get().fetchAllOrders();
        })
        .subscribe();
    }
  },
  
  logout: async () => {
    try {
      supabase.channel('admin-updates').unsubscribe();
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Sign out error:", e);
    }
    set({ user: null, isAuthenticated: false, isAdmin: false, orders: [], allOrders: [], allUsers: [], cart: [], justCompletedOrder: false });
  },

  fetchGames: async () => {
    try {
      const response = await fetch('/api/public/games');
      if (!response.ok) throw new Error('Failed to fetch games');
      const data = await response.json();
      set({ games: data });
    } catch (e) {
      console.error("HGP FETCH ERROR (fetchGames):", e);
      // Fallback to direct Supabase if proxy fails
      try {
        const { data, error } = await supabase.from('games').select('*').order('created_at', { ascending: false });
        if (!error && data) set({ games: data });
      } catch (err) {}
    }
  },

  fetchHeroBanners: async () => {
    try {
      const response = await fetch('/api/public/hero-banners');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      set({ heroBanners: data });
    } catch (e: any) {
      console.error("HGP FETCH ERROR (fetchHeroBanners):", e.message || e);
      // Fallback to direct Supabase query
      try {
        const { data, error } = await supabase.from('hero_banners').select('*').order('created_at', { ascending: false });
        if (!error && data) set({ heroBanners: data });
        else if (error) console.error("HGP FALLBACK ERROR (fetchHeroBanners):", error.message);
      } catch (err: any) {
        console.error("HGP FALLBACK CRASH (fetchHeroBanners):", err.message || err);
      }
    }
  },

  addHeroBanner: async (banner) => {
    const { id, ...cleanBanner } = banner as any;
    const { error } = await supabase.from('hero_banners').insert([cleanBanner]);
    if (error) {
      console.error("HGP DB ERROR (addHeroBanner):", error);
      return { success: false, error: error.message };
    }
    await get().fetchHeroBanners();
    return { success: true };
  },

  updateHeroBanner: async (id, updates) => {
    const { error } = await supabase.from('hero_banners').update(updates).eq('id', id);
    if (error) {
      console.error("HGP DB ERROR (updateHeroBanner):", error);
      return { success: false, error: error.message };
    }
    await get().fetchHeroBanners();
    return { success: true };
  },

  deleteHeroBanner: async (id) => {
    const { error } = await supabase.from('hero_banners').delete().eq('id', id);
    if (error) {
      console.error("HGP DB ERROR (deleteHeroBanner):", error);
      return false;
    }
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
    console.error("HGP DB ERROR (updateProfileBanner):", error);
    return false;
  },

  fetchFloatingIcons: async () => {
    try {
      const response = await fetch('/api/public/floating-icons');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      set({ floatingIcons: data });
    } catch (e: any) {
      console.error("HGP FETCH ERROR (fetchFloatingIcons):", e.message || e);
      // Fallback to direct Supabase query
      try {
        const { data, error } = await supabase.from('hero_floating_icons').select('*').order('created_at', { ascending: false });
        if (!error && data) set({ floatingIcons: data });
        else if (error) console.error("HGP FALLBACK ERROR (fetchFloatingIcons):", error.message);
      } catch (err: any) {
        console.error("HGP FALLBACK CRASH (fetchFloatingIcons):", err.message || err);
      }
    }
  },

  addFloatingIcon: async (icon) => {
    const { id, ...cleanIcon } = icon as any;
    const { error } = await supabase.from('hero_floating_icons').insert([cleanIcon]);
    if (error) {
      console.error("HGP DB ERROR (addFloatingIcon):", error);
      return { success: false, error: error.message };
    }
    await get().fetchFloatingIcons();
    return { success: true };
  },

  updateFloatingIcon: async (id, updates) => {
    const { error } = await supabase.from('hero_floating_icons').update(updates).eq('id', id);
    if (error) {
      console.error("HGP DB ERROR (updateFloatingIcon):", error);
      return { success: false, error: error.message };
    }
    await get().fetchFloatingIcons();
    return { success: true };
  },

  deleteFloatingIcon: async (id) => {
    const { error } = await supabase.from('hero_floating_icons').delete().eq('id', id);
    if (error) {
      console.error("HGP DB ERROR (deleteFloatingIcon):", error);
      return false;
    }
    await get().fetchFloatingIcons();
    return true;
  },

  fetchSiteSettings: async () => {
    try {
      const response = await fetch('/api/public/site-settings');
      if (!response.ok) throw new Error('Failed to fetch site settings');
      const data = await response.json();
      if (data) {
        set({ 
          logoUrl: data.logo_url,
          bdtRate: Number(data.bdt_rate) || 125
        });
      }
    } catch (e) {
      console.error("HGP FETCH ERROR (fetchSiteSettings):", e);
      // Fallback
      try {
        const { data: settings } = await supabase.from('site_settings').select('logo_url, bdt_rate').eq('id', 'main').maybeSingle();
        
        set({ 
          logoUrl: settings?.logo_url || null,
          bdtRate: Number(settings?.bdt_rate) || 125
        });
      } catch (err) {
        console.error("HGP FALLBACK ERROR (fetchSiteSettings):", err);
      }
    }
  },
  
  updateBdtRate: async (rate) => {
    const { error } = await supabase.from('site_settings').upsert({ id: 'main', bdt_rate: rate, updated_at: new Date().toISOString() });
    if (!error) {
      set({ bdtRate: rate });
      return true;
    }
    console.error("HGP DB ERROR (updateBdtRate):", error);
    return false;
  },
  
  updateLogo: async (url) => {
    const { error } = await supabase.from('site_settings').upsert({ id: 'main', logo_url: url, updated_at: new Date().toISOString() });
    if (!error) {
      set({ logoUrl: url });
      return true;
    }
    console.error("HGP DB ERROR (updateLogo):", error);
    return false;
  },
  setLogoUrl: (logoUrl) => set({ logoUrl }),

  fetchAllUsers: async ( ) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) {
        console.error("HGP DB ERROR (fetchAllUsers):", error);
        return;
      }
      if (data) set({ allUsers: data });
    } catch (e) {
      console.error("HGP FETCH ERROR (fetchAllUsers):", e);
    }
  },

  addGame: async (game) => {
    const gameData = { ...game };
    if (!gameData.id) {
      gameData.id = gameData.title?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || `game-${Date.now()}`;
    }
    const { error } = await supabase.from('games').insert([gameData]);
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
    const { user, orders: currentOrders } = get();
    if (!user) return;
    const { data } = await supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) {
      let newlyCompleted = false;
      if (currentOrders.length > 0) {
        data.forEach(newOrder => {
          if (newOrder.status === 'PROCESSING' || newOrder.status === 'COMPLETED') {
            const oldOrder = currentOrders.find(o => o.id === newOrder.id);
            if (oldOrder && oldOrder.status !== 'PROCESSING' && oldOrder.status !== 'COMPLETED') {
              newlyCompleted = true;
            }
          }
        });
      }

      // If called by real-time subscription or manual refresh, update the animation state.
      // If it's a new completion, it becomes true. If it's a subsequent refresh, it becomes false.
      if (currentOrders.length > 0) {
        set({ justCompletedOrder: newlyCompleted });
      }

      set({ orders: data.map(o => ({
        id: o.id,
        userId: o.user_id,
        customerName: o.customer_name,
        items: o.items, 
        totalAmount: Number(o.total_amount),
        status: o.status,
        createdAt: o.created_at,
        transactionId: o.transaction_id || 'N/A',
        paymentMethod: o.payment_method || 'N/A',
        screenshot: o.screenshot
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
          customerName: o.customer_name,
          items: o.items, 
          totalAmount: Number(o.total_amount),
          status: o.status,
          createdAt: o.created_at,
          transactionId: o.transaction_id || 'N/A',
          paymentMethod: o.payment_method || 'N/A',
          screenshot: o.screenshot
        }))});
      }
    } catch (e) {
      console.error("HGP FETCH ERROR (fetchAllOrders):", e);
    }
  },

  updateOrderStatus: async (orderId, status) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (!error) {
      // If status is COMPLETED, PROCESSING or CANCELLED, send email to user
      if (status === 'COMPLETED' || status === 'PROCESSING' || status === 'CANCELLED') {
        const order = get().allOrders.find(o => o.id === orderId);
        const targetProfile = get().allUsers.find(u => u.id === order?.userId);
        
        if (order && targetProfile && targetProfile.email) {
          try {
            let pdfDataUri = undefined;
            
            // Only generate PDF for COMPLETED orders
            if (status === 'COMPLETED') {
              console.log("HGP DEBUG: Generating Completion PDF for user...");
              const doc = new jsPDF();
              
              // Header Blue Bar
              doc.setFillColor(15, 33, 71); // Dark Blue
              doc.rect(0, 0, 210, 25, 'F');
              
              // Header Text
              doc.setFontSize(24);
              doc.setTextColor(255, 255, 255); // White
              doc.setFont('helvetica', 'bold');
              doc.text('Hasibul Game Point', 105, 17, { align: 'center' });
              
              // INVOICE Title
              doc.setFontSize(20);
              doc.setTextColor(0, 0, 0);
              doc.text('INVOICE', 105, 45, { align: 'center' });
              
              // Order Information Section
              doc.setFontSize(14);
              doc.setFont('helvetica', 'bold');
              doc.text('Order Information', 20, 60);
              
              doc.setFontSize(11);
              doc.setFont('helvetica', 'normal');
              doc.text(`Order ID: ${order.id}`, 20, 70);
              doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`, 20, 78);
              doc.text(`Customer: ${order.customerName || targetProfile.full_name}`, 20, 86);
              doc.text(`Email: ${targetProfile.email}`, 20, 94);
              
              // Order Items Section
              doc.setFontSize(14);
              doc.setFont('helvetica', 'bold');
              doc.text('Order Items', 20, 110);
              
              // Table Header
              doc.setFillColor(245, 245, 245);
              doc.rect(20, 118, 170, 10, 'F');
              doc.rect(20, 118, 170, 10, 'S');
              doc.line(140, 118, 140, 128); // Column separator
              
              doc.setFontSize(11);
              doc.text('Item Description', 22, 125);
              doc.text('Target ID', 142, 125);
              
              // Table Body
              let y = 128;
              order.items.forEach((item) => {
                doc.rect(20, y, 170, 10, 'S');
                doc.line(140, y, 140, y + 10);
                doc.setFont('helvetica', 'normal');
                doc.text(`${item.gameTitle} - ${item.packageName}`, 22, y + 7);
                doc.text(`${item.playerId}`, 142, y + 7);
                y += 10;
              });
              
              // Payment Summary Section
              y += 15;
              doc.setFontSize(14);
              doc.setFont('helvetica', 'bold');
              doc.text('Payment Summary', 20, y);
              
              y += 10;
              doc.setFontSize(11);
              doc.setFont('helvetica', 'normal');
              const currency = order.paymentMethod?.includes('USDT') ? 'USDT' : 'BDT';
              doc.text(`Total Amount: ${order.totalAmount} ${currency}`, 20, y);
              doc.text(`Payment Method: ${order.paymentMethod}`, 20, y + 8);
              doc.text(`Transaction ID: ${order.transactionId}`, 20, y + 16);
              
              // Footer
              doc.setFontSize(10);
              doc.setTextColor(100, 100, 100);
              doc.text('Thank you for choosing HGP', 105, 280, { align: 'center' });
              
              pdfDataUri = doc.output('datauristring');
            }
            
            // Send email to user (with status updated order)
            const updatedOrder = { ...order, status };
            await sendOrderNotification(updatedOrder, targetProfile.email, targetProfile.full_name || 'Customer', pdfDataUri);
            console.log(`HGP DEBUG: ${status} email sent to user.`);
          } catch (err) {
            console.error(`HGP DEBUG: Failed to send ${status} email:`, err);
          }
        }
      }
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
    
    // Insert into DB
    const { error: dbError } = await supabase.from('orders').insert([{
      id: order.id,
      user_id: user.id,
      customer_name: order.customerName,
      items: order.items,
      total_amount: order.totalAmount,
      status: order.status,
      transaction_id: order.transactionId,
      payment_method: order.paymentMethod,
      screenshot: order.screenshot
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
      
      // Header Blue Bar
      doc.setFillColor(15, 33, 71); // Dark Blue
      doc.rect(0, 0, 210, 25, 'F');
      
      // Header Text
      doc.setFontSize(24);
      doc.setTextColor(255, 255, 255); // White
      doc.setFont('helvetica', 'bold');
      doc.text('Hasibul Game Point', 105, 17, { align: 'center' });
      
      // INVOICE Title
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0);
      doc.text('INVOICE', 105, 45, { align: 'center' });
      
      // Order Information Section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Order Information', 20, 60);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Order ID: ${order.id}`, 20, 70);
      doc.text(`Date: ${new Date().toLocaleString()}`, 20, 78);
      doc.text(`Customer: ${order.customerName || user.name}`, 20, 86);
      doc.text(`Email: ${user.email}`, 20, 94);
      
      // Order Items Section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Order Items', 20, 110);
      
      // Table Header
      doc.setFillColor(245, 245, 245);
      doc.rect(20, 118, 170, 10, 'F');
      doc.rect(20, 118, 170, 10, 'S');
      doc.line(140, 118, 140, 128); // Column separator
      
      doc.setFontSize(11);
      doc.text('Item Description', 22, 125);
      doc.text('Target ID', 142, 125);
      
      // Table Body
      let y = 128;
      order.items.forEach((item) => {
        doc.rect(20, y, 170, 10, 'S');
        doc.line(140, y, 140, y + 10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${item.gameTitle} - ${item.packageName}`, 22, y + 7);
        doc.text(`${item.playerId}`, 142, y + 7);
        y += 10;
      });
      
      // Payment Summary Section
      y += 15;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Payment Summary', 20, y);
      
      y += 10;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const currency = order.paymentMethod?.includes('USDT') ? 'USDT' : 'BDT';
      doc.text(`Total Amount: ${order.totalAmount} ${currency}`, 20, y);
      doc.text(`Payment Method: ${order.paymentMethod}`, 20, y + 8);
      doc.text(`Transaction ID: ${order.transactionId}`, 20, y + 16);
      
      // Footer
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('Thank you for choosing HGP', 105, 280, { align: 'center' });
      
      pdfDataUri = doc.output('datauristring');
      console.log("HGP DEBUG: PDF Generation Success.");
    } catch (pdfErr: any) {
      console.error("HGP PDF ERROR:", pdfErr);
      // We don't return false here because the order is already saved in DB
    }

    // Trigger Notifications
    console.log("HGP DEBUG: Triggering notifications...");
    
    // Admin: Telegram Only
    const telegramPromise = sendTelegramNotification(order).then(res => 
      console.log(`HGP DEBUG: Telegram notification result: ${res ? 'SUCCESS' : 'FAILED'}`)
    );

    // Admin: Email Alert
    const adminEmailPromise = sendOrderNotification(order, ADMIN_EMAIL, 'Admin', pdfDataUri, true).then(res =>
      console.log(`HGP DEBUG: Admin email notification result: ${res ? 'SUCCESS' : 'FAILED'}`)
    );
    
    // Await notifications so they don't get cancelled by page navigation (e.g., ZiniPay redirect)
    if (order.paymentMethod?.includes('ZiniPay')) {
      // For ZiniPay, we want a fast redirect. We'll wait at most 500ms for notifications.
      // The webhook will also send a notification when the payment is verified.
      await Promise.race([
        Promise.allSettled([telegramPromise, adminEmailPromise]),
        new Promise(resolve => setTimeout(resolve, 500))
      ]);
    } else {
      await Promise.allSettled([telegramPromise, adminEmailPromise]);
    }

    get().clearCart();
    await get().fetchOrders();
    if (get().isAdmin) await get().fetchAllOrders();
    return true;
  }
}));
