-- ==========================================
-- HASIBUL GAME POINT - HERO BANNER SETUP
-- ==========================================

-- ১. টেবিল তৈরি করা (যদি না থাকে)
CREATE TABLE IF NOT EXISTS public.hero_banners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    tag TEXT,
    price_text TEXT DEFAULT '', 
    image_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ২. Row Level Security (RLS) চালু করা (সঠিক সিনট্যাক্স)
ALTER TABLE public.hero_banners ENABLE ROW LEVEL SECURITY;

-- ৩. সবাই যেন ব্যানার দেখতে পারে সেই পলিসি (Public Access)
DROP POLICY IF EXISTS "Hero banners are viewable by everyone" ON public.hero_banners;
CREATE POLICY "Hero banners are viewable by everyone" 
ON public.hero_banners FOR SELECT 
USING (true);

-- ৪. শুধুমাত্র এডমিন যেন ব্যানার ম্যানেজ করতে পারে (Admin Access)
DROP POLICY IF EXISTS "Admins have full control over hero banners" ON public.hero_banners;
CREATE POLICY "Admins have full control over hero banners" 
ON public.hero_banners ALL 
USING (auth.jwt() ->> 'email' = 'hasibulgamepoint02@gmail.com');

-- ৫. প্রাথমিক কিছু ডাটা ইনসার্ট করা
INSERT INTO public.hero_banners (title, tag, image_url)
VALUES 
('Legendary Game Top-Ups', 'Official Store', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop'),
('Epic Winter Deals', 'Limited Time', 'https://images.unsplash.com/photo-1624138784614-87fd1b6528f2?q=80&w=2070&auto=format&fit=crop')
ON CONFLICT DO NOTHING;
