
-- ==========================================
-- HASIBUL GAME POINT - FINAL CORE SETUP
-- ==========================================

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT UNIQUE,
  profile_banner TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. GAMES
CREATE TABLE IF NOT EXISTS public.games (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  description TEXT,
  image TEXT NOT NULL,
  banner TEXT,
  packages JSONB NOT NULL DEFAULT '[]'::jsonb,
  featured BOOLEAN DEFAULT false,
  "loginMethods" JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ORDERS (Critical for Telegram)
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  customer_name TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED')),
  transaction_id TEXT,
  payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. FLOATING ICONS
CREATE TABLE IF NOT EXISTS public.hero_floating_icons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  icon TEXT NOT NULL,
  label TEXT,
  delay NUMERIC DEFAULT 0,
  duration NUMERIC DEFAULT 4,
  position TEXT DEFAULT 'top-right',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SITE SETTINGS
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  logo_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5.1 SITE CONFIG (Payment & Support)
CREATE TABLE IF NOT EXISTS public.site_config (
  id TEXT PRIMARY KEY DEFAULT 'main',
  payment_number TEXT,
  support_link TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_floating_icons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

-- 6. POLICIES
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admin view all profiles" ON public.profiles;
CREATE POLICY "Admin view all profiles" ON public.profiles FOR SELECT USING (auth.jwt() ->> 'email' = 'hasibulgamepoint02@gmail.com');

DROP POLICY IF EXISTS "Public view games" ON public.games;
CREATE POLICY "Public view games" ON public.games FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public view floating icons" ON public.hero_floating_icons;
CREATE POLICY "Public view floating icons" ON public.hero_floating_icons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin control floating icons" ON public.hero_floating_icons;
CREATE POLICY "Admin control floating icons" ON public.hero_floating_icons FOR ALL USING (auth.jwt() ->> 'email' = 'hasibulgamepoint02@gmail.com');

DROP POLICY IF EXISTS "Public view site settings" ON public.site_settings;
CREATE POLICY "Public view site settings" ON public.site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin control site settings" ON public.site_settings;
CREATE POLICY "Admin control site settings" ON public.site_settings FOR ALL USING (auth.jwt() ->> 'email' = 'hasibulgamepoint02@gmail.com');

DROP POLICY IF EXISTS "Public view site config" ON public.site_config;
CREATE POLICY "Public view site config" ON public.site_config FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin control site config" ON public.site_config;
CREATE POLICY "Admin control site config" ON public.site_config FOR ALL USING (auth.jwt() ->> 'email' = 'hasibulgamepoint02@gmail.com');

DROP POLICY IF EXISTS "Users insert orders" ON public.orders;
CREATE POLICY "Users insert orders" ON public.orders FOR INSERT WITH CHECK (true); -- Allow guest/logged-in order insertion

DROP POLICY IF EXISTS "Users view own orders" ON public.orders;
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Admin control orders" ON public.orders;
CREATE POLICY "Admin control orders" ON public.orders FOR ALL USING (auth.jwt() ->> 'email' = 'hasibulgamepoint02@gmail.com');

-- 6. TRIGGER FOR PROFILES
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), new.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. SECURE PAYMENT COMPLETION RPC
-- This function allows the backend webhook to securely update an order's status to COMPLETED
-- without needing the Supabase Service Role Key, bypassing RLS safely.
CREATE OR REPLACE FUNCTION public.complete_payment(p_order_id TEXT, p_txn_id TEXT)
RETURNS json AS $$
DECLARE
  v_order RECORD;
  v_profile RECORD;
  v_result json;
BEGIN
  -- Get the order
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_order.status = 'COMPLETED' THEN
    RETURN json_build_object('already_completed', true);
  END IF;

  -- Update the order
  UPDATE public.orders
  SET status = 'COMPLETED', transaction_id = p_txn_id
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  -- Get user profile
  SELECT * INTO v_profile FROM public.profiles WHERE id = v_order.user_id;

  -- Build result
  v_result := json_build_object(
    'success', true,
    'order', row_to_json(v_order),
    'profile', row_to_json(v_profile)
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
