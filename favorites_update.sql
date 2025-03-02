-- SQL to add missing columns to favorites table:
ALTER TABLE public.favorites ADD COLUMN is_favorite BOOLEAN DEFAULT true;
ALTER TABLE public.favorites ADD COLUMN is_try_later BOOLEAN DEFAULT false;
CREATE INDEX idx_favorites_is_favorite ON public.favorites(is_favorite);
CREATE INDEX idx_favorites_is_try_later ON public.favorites(is_try_later);
-- SQL to add UPDATE policy to favorites table:
CREATE POLICY "Users can update their own favorites" ON public.favorites FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Update RLS policies to correctly reference auth_id:
DROP POLICY IF EXISTS "Users can update their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can insert their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.favorites;
CREATE POLICY "Users can view their own favorites" ON public.favorites FOR SELECT USING (auth.uid() IN (SELECT auth_id FROM public.users WHERE id = user_id));
CREATE POLICY "Users can insert their own favorites" ON public.favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() IN (SELECT auth_id FROM public.users WHERE id = user_id));
CREATE POLICY "Users can update their own favorites" ON public.favorites FOR UPDATE TO authenticated USING (auth.uid() IN (SELECT auth_id FROM public.users WHERE id = user_id)) WITH CHECK (auth.uid() IN (SELECT auth_id FROM public.users WHERE id = user_id));
CREATE POLICY "Users can delete their own favorites" ON public.favorites FOR DELETE USING (auth.uid() IN (SELECT auth_id FROM public.users WHERE id = user_id));
