CREATE TABLE public.banners (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 name text NOT NULL,
 image_url text,
 rarity text NOT NULL DEFAULT 'common' CHECK (rarity IN ('common','uncommon','rare','epic','legendary','chroma')),
 price integer NOT NULL DEFAULT 100 CHECK (price >= 0),
 listed boolean NOT NULL DEFAULT false,
 sort integer NOT NULL DEFAULT 0,
 CHECK (NOT listed OR (image_url IS NOT NULL AND length(trim(image_url)) > 0))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.banners TO authenticated;
GRANT ALL ON public.banners TO service_role;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read banner catalog" ON public.banners FOR SELECT TO authenticated USING (true);
CREATE POLICY "manage banner catalog" ON public.banners FOR ALL TO authenticated USING (public.has_permission(auth.uid(), 'shop')) WITH CHECK (public.has_permission(auth.uid(), 'shop'));
CREATE TABLE public.user_banners (
 user_id uuid NOT NULL,
 banner_id uuid NOT NULL REFERENCES public.banners(id) ON DELETE RESTRICT,
 purchased_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (user_id, banner_id)
);
GRANT SELECT ON public.user_banners TO authenticated;
GRANT ALL ON public.user_banners TO service_role;
ALTER TABLE public.user_banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read owned banners" ON public.user_banners FOR SELECT TO authenticated USING (auth.uid() = user_id);
ALTER TABLE public.profiles ADD COLUMN banner_id uuid REFERENCES public.banners(id) ON DELETE SET NULL;
CREATE OR REPLACE FUNCTION public.check_banner_owned() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NEW.banner_id IS NOT NULL AND NEW.banner_id IS DISTINCT FROM OLD.banner_id
 AND NOT EXISTS (SELECT 1 FROM public.user_banners WHERE user_id = NEW.id AND banner_id = NEW.banner_id) THEN
 RAISE EXCEPTION 'You can only use a banner you own';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER profile_banner_ownership BEFORE UPDATE OF banner_id ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.check_banner_owned();
CREATE OR REPLACE FUNCTION public.purchase_banner(_banner uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE item public.banners; w public.wallets; player uuid := auth.uid();
BEGIN
 IF player IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
 SELECT * INTO item FROM public.banners WHERE id = _banner FOR UPDATE;
 IF NOT FOUND OR NOT item.listed THEN RAISE EXCEPTION 'This banner is not for sale'; END IF;
 INSERT INTO public.wallets(user_id) VALUES (player) ON CONFLICT DO NOTHING;
 SELECT * INTO w FROM public.wallets WHERE user_id = player FOR UPDATE;
 IF EXISTS (SELECT 1 FROM public.user_banners WHERE user_id = player AND banner_id = _banner) THEN RAISE EXCEPTION 'You already own this banner'; END IF;
 IF w.tokens < item.price THEN RAISE EXCEPTION 'Not enough tokens'; END IF;
 UPDATE public.wallets SET tokens = tokens - item.price WHERE user_id = player;
 INSERT INTO public.user_banners(user_id, banner_id) VALUES (player, _banner);
 RETURN _banner;
END $$;
REVOKE ALL ON FUNCTION public.purchase_banner(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.purchase_banner(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.player_banner_directory() RETURNS TABLE(user_id uuid, banner_id uuid, image_url text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT p.id, p.banner_id, b.image_url FROM public.profiles p LEFT JOIN public.banners b ON b.id=p.banner_id WHERE auth.uid() IS NOT NULL
$$;
REVOKE ALL ON FUNCTION public.player_banner_directory() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.player_banner_directory() TO authenticated;