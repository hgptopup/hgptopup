
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ORDERS (Critical for Telegram)
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 5. POLICIES
DROP POLICY IF EXISTS "Public view games" ON public.games;
CREATE POLICY "Public view games" ON public.games FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users insert orders" ON public.orders;
CREATE POLICY "Users insert orders" ON public.orders FOR INSERT WITH CHECK (true); -- Allow guest/logged-in order insertion

DROP POLICY IF EXISTS "Users view own orders" ON public.orders;
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Admin control orders" ON public.orders;
CREATE POLICY "Admin control orders" ON public.orders ALL USING (auth.jwt() ->> 'email' = 'hasibulgamepoint02@gmail.com');

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
