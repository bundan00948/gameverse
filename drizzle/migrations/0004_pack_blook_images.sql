ALTER TABLE public.packs ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.blooks ADD COLUMN IF NOT EXISTS image_url text;
CREATE POLICY "Admins upload art" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'art' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update art" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'art' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete art" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'art' AND public.has_role(auth.uid(),'admin'));