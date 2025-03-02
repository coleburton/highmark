-- SQL to update favorites table and RLS policies

-- 1. Add missing columns to favorites table
ALTER TABLE public.favorites ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT true;
ALTER TABLE public.favorites ADD COLUMN IF NOT EXISTS is_try_later BOOLEAN DEFAULT false;

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_favorites_is_favorite ON public.favorites(is_favorite);
CREATE INDEX IF NOT EXISTS idx_favorites_is_try_later ON public.favorites(is_try_later);

-- 3. Update RLS policies to correctly reference auth_id
DROP POLICY IF EXISTS "Users can update their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can insert their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Authenticated users can insert favorites" ON public.favorites;

-- 4. Create new RLS policies
CREATE POLICY "Users can view their own favorites" ON public.favorites FOR SELECT USING (auth.uid() IN (SELECT auth_id FROM public.users WHERE id = user_id));
CREATE POLICY "Users can insert their own favorites" ON public.favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() IN (SELECT auth_id FROM public.users WHERE id = user_id));
CREATE POLICY "Users can update their own favorites" ON public.favorites FOR UPDATE TO authenticated USING (auth.uid() IN (SELECT auth_id FROM public.users WHERE id = user_id)) WITH CHECK (auth.uid() IN (SELECT auth_id FROM public.users WHERE id = user_id));
CREATE POLICY "Users can delete their own favorites" ON public.favorites FOR DELETE USING (auth.uid() IN (SELECT auth_id FROM public.users WHERE id = user_id));
