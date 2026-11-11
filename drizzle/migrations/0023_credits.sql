CREATE TABLE public.credits (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, description text NOT NULL DEFAULT '', sort integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.credits TO authenticated;
GRANT ALL ON public.credits TO service_role;
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read credits" ON public.credits FOR SELECT TO authenticated USING (true);
CREATE POLICY "manage credits" ON public.credits FOR ALL TO authenticated USING (public.has_permission(auth.uid(),'roles')) WITH CHECK (public.has_permission(auth.uid(),'roles'));