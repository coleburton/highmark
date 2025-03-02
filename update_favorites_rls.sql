-- Update RLS policies to correctly reference auth_id:
DROP POLICY IF EXISTS "Users can update their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can insert their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.favorites;
CREATE POLICY "Users can view their own favorites" ON public.favorites FOR SELECT USING (auth.uid() IN (SELECT auth_id FROM public.users WHERE id = user_id));
CREATE POLICY "Users can insert their own favorites" ON public.favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() IN (SELECT auth_id FROM public.users WHERE id = user_id));
CREATE POLICY "Users can update their own favorites" ON public.favorites FOR UPDATE TO authenticated USING (auth.uid() IN (SELECT auth_id FROM public.users WHERE id = user_id)) WITH CHECK (auth.uid() IN (SELECT auth_id FROM public.users WHERE id = user_id));
CREATE POLICY "Users can delete their own favorites" ON public.favorites FOR DELETE USING (auth.uid() IN (SELECT auth_id FROM public.users WHERE id = user_id));
