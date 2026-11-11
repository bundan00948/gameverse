CREATE TABLE public.bazaar_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  blook_id uuid NOT NULL REFERENCES public.blooks(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'sale' CHECK (kind IN ('sale','auction')),
  price integer NOT NULL CHECK (price > 0),
  current_bid integer,
  bidder_id uuid,
  ends_at timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','sold','cancelled','expired')),
  buyer_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);
CREATE INDEX bazaar_active_idx ON public.bazaar_listings(status, blook_id);
GRANT SELECT ON public.bazaar_listings TO authenticated;
GRANT ALL ON public.bazaar_listings TO service_role;
ALTER TABLE public.bazaar_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in players read listings" ON public.bazaar_listings FOR SELECT TO authenticated
  USING (NOT public.is_account_banned(auth.uid()) AND (status = 'active' OR seller_id = auth.uid() OR buyer_id = auth.uid()));

CREATE TABLE public.mail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  kind text NOT NULL DEFAULT 'system',
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX mail_user_idx ON public.mail(user_id, created_at DESC);
GRANT SELECT, INSERT, DELETE ON public.mail TO authenticated;
GRANT ALL ON public.mail TO service_role;
ALTER TABLE public.mail ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own and system mail" ON public.mail FOR SELECT TO authenticated
  USING (NOT public.is_account_banned(auth.uid()) AND (user_id = auth.uid() OR user_id IS NULL OR public.has_permission(auth.uid(),'mail')));
CREATE POLICY "Staff send system mail" ON public.mail FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL AND kind = 'system' AND public.has_permission(auth.uid(),'mail'));
CREATE POLICY "Staff delete system mail" ON public.mail FOR DELETE TO authenticated
  USING (user_id IS NULL AND public.has_permission(auth.uid(),'mail'));

CREATE TABLE public.mail_reads (
  user_id uuid NOT NULL,
  mail_id uuid NOT NULL REFERENCES public.mail(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, mail_id)
);
GRANT SELECT, INSERT ON public.mail_reads TO authenticated;
GRANT ALL ON public.mail_reads TO service_role;
ALTER TABLE public.mail_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own reads" ON public.mail_reads FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Mark own read" ON public.mail_reads FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.give_blook(_user uuid, _blook uuid) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $$
  INSERT INTO public.user_blooks(user_id, blook_id) VALUES (_user, _blook) ON CONFLICT (user_id, blook_id) DO UPDATE SET quantity = user_blooks.quantity + 1 $$;
REVOKE EXECUTE ON FUNCTION public.give_blook(uuid, uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.settle_auctions() RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE l record; n int := 0; bn text;
BEGIN
 FOR l IN SELECT * FROM public.bazaar_listings WHERE kind='auction' AND status='active' AND ends_at <= now() FOR UPDATE SKIP LOCKED LOOP
  SELECT name INTO bn FROM public.blooks WHERE id = l.blook_id;
  IF l.bidder_id IS NOT NULL THEN
   PERFORM public.give_blook(l.bidder_id, l.blook_id);
   INSERT INTO public.wallets(user_id) VALUES (l.seller_id) ON CONFLICT DO NOTHING;
   UPDATE public.wallets SET tokens = tokens + l.current_bid WHERE user_id = l.seller_id;
   UPDATE public.bazaar_listings SET status='sold', buyer_id=l.bidder_id, closed_at=now() WHERE id=l.id;
   INSERT INTO public.mail(user_id,kind,title,body) VALUES
    (l.seller_id,'auction','Auction finished: '||bn,'Your '||bn||' sold for '||l.current_bid||' tokens. The tokens are in your wallet.'),
    (l.bidder_id,'auction','You won '||bn,'You won the auction for '||bn||' with a bid of '||l.current_bid||' tokens. It is now in your inventory.');
  ELSE
   PERFORM public.give_blook(l.seller_id, l.blook_id);
   UPDATE public.bazaar_listings SET status='expired', closed_at=now() WHERE id=l.id;
   INSERT INTO public.mail(user_id,kind,title,body) VALUES (l.seller_id,'auction','Auction ended: '||bn,'Nobody bid on your '||bn||'. It has been returned to your inventory.');
  END IF;
  n := n + 1;
 END LOOP;
 RETURN n;
END $$;
GRANT EXECUTE ON FUNCTION public.settle_auctions() TO authenticated;

CREATE OR REPLACE FUNCTION public.bazaar_list(_blook uuid, _price integer, _auction boolean, _hours integer) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r text; q int; id uuid;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
 IF public.is_account_banned(auth.uid()) THEN RAISE EXCEPTION 'Account banned'; END IF;
 IF _price IS NULL OR _price < 1 OR _price > 10000000 THEN RAISE EXCEPTION 'Choose a price between 1 and 10,000,000 tokens'; END IF;
 IF (SELECT count(*) FROM public.bazaar_listings WHERE seller_id=auth.uid() AND status='active') >= 20 THEN RAISE EXCEPTION 'You can have up to 20 active listings'; END IF;
 SELECT rarity INTO r FROM public.blooks WHERE id=_blook; IF NOT FOUND THEN RAISE EXCEPTION 'Blook not found'; END IF;
 IF _auction THEN
  IF r NOT IN ('legendary','chroma','mythical','hidden') THEN RAISE EXCEPTION 'Only Legendary or rarer blooks can be auctioned'; END IF;
  IF _hours NOT IN (1,6,12,24,48) THEN RAISE EXCEPTION 'Invalid auction length'; END IF;
 END IF;
 SELECT quantity INTO q FROM public.user_blooks WHERE user_id=auth.uid() AND blook_id=_blook FOR UPDATE;
 IF q IS NULL OR q < 1 THEN RAISE EXCEPTION 'You do not own this blook'; END IF;
 IF q = 1 THEN DELETE FROM public.user_blooks WHERE user_id=auth.uid() AND blook_id=_blook;
 ELSE UPDATE public.user_blooks SET quantity=quantity-1 WHERE user_id=auth.uid() AND blook_id=_blook; END IF;
 INSERT INTO public.bazaar_listings(seller_id,blook_id,kind,price,ends_at)
 VALUES (auth.uid(),_blook,CASE WHEN _auction THEN 'auction' ELSE 'sale' END,_price,CASE WHEN _auction THEN now()+make_interval(hours=>_hours) END) RETURNING bazaar_listings.id INTO id;
 RETURN id;
END $$;

CREATE OR REPLACE FUNCTION public.bazaar_buy(_listing uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE l public.bazaar_listings; w public.wallets; bn text; nm text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
 IF public.is_account_banned(auth.uid()) THEN RAISE EXCEPTION 'Account banned'; END IF;
 SELECT * INTO l FROM public.bazaar_listings WHERE id=_listing FOR UPDATE;
 IF NOT FOUND OR l.status <> 'active' OR l.kind <> 'sale' THEN RAISE EXCEPTION 'This listing is no longer available'; END IF;
 IF l.seller_id = auth.uid() THEN RAISE EXCEPTION 'You cannot buy your own listing'; END IF;
 INSERT INTO public.wallets(user_id) VALUES (auth.uid()) ON CONFLICT DO NOTHING;
 SELECT * INTO w FROM public.wallets WHERE user_id=auth.uid() FOR UPDATE;
 IF w.tokens < l.price THEN RAISE EXCEPTION 'Not enough tokens'; END IF;
 UPDATE public.wallets SET tokens=tokens-l.price WHERE user_id=auth.uid();
 INSERT INTO public.wallets(user_id) VALUES (l.seller_id) ON CONFLICT DO NOTHING;
 UPDATE public.wallets SET tokens=tokens+l.price WHERE user_id=l.seller_id;
 PERFORM public.give_blook(auth.uid(), l.blook_id);
 UPDATE public.bazaar_listings SET status='sold', buyer_id=auth.uid(), closed_at=now() WHERE id=l.id;
 SELECT name INTO bn FROM public.blooks WHERE id=l.blook_id;
 SELECT coalesce(nullif(display_name,''),username) INTO nm FROM public.profiles WHERE id=auth.uid();
 INSERT INTO public.mail(user_id,kind,title,body) VALUES (l.seller_id,'sale','Your '||bn||' was sold',coalesce(nm,'A player')||' bought your '||bn||' for '||l.price||' tokens. The tokens are in your wallet.');
END $$;

CREATE OR REPLACE FUNCTION public.bazaar_bid(_listing uuid, _amount integer) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE l public.bazaar_listings; w public.wallets; bn text; minimum int;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
 IF public.is_account_banned(auth.uid()) THEN RAISE EXCEPTION 'Account banned'; END IF;
 SELECT * INTO l FROM public.bazaar_listings WHERE id=_listing FOR UPDATE;
 IF NOT FOUND OR l.status <> 'active' OR l.kind <> 'auction' OR l.ends_at <= now() THEN RAISE EXCEPTION 'This auction has ended'; END IF;
 IF l.seller_id = auth.uid() THEN RAISE EXCEPTION 'You cannot bid on your own auction'; END IF;
 IF l.bidder_id = auth.uid() THEN RAISE EXCEPTION 'You already have the highest bid'; END IF;
 minimum := CASE WHEN l.current_bid IS NULL THEN l.price ELSE l.current_bid + greatest(1, ceil(l.current_bid*0.05)::int) END;
 IF _amount IS NULL OR _amount < minimum THEN RAISE EXCEPTION 'Bid at least % tokens', minimum; END IF;
 INSERT INTO public.wallets(user_id) VALUES (auth.uid()) ON CONFLICT DO NOTHING;
 SELECT * INTO w FROM public.wallets WHERE user_id=auth.uid() FOR UPDATE;
 IF w.tokens < _amount THEN RAISE EXCEPTION 'Not enough tokens'; END IF;
 UPDATE public.wallets SET tokens=tokens-_amount WHERE user_id=auth.uid();
 IF l.bidder_id IS NOT NULL THEN
  UPDATE public.wallets SET tokens=tokens+l.current_bid WHERE user_id=l.bidder_id;
  SELECT name INTO bn FROM public.blooks WHERE id=l.blook_id;
  INSERT INTO public.mail(user_id,kind,title,body) VALUES (l.bidder_id,'auction','Outbid on '||bn,'Someone bid '||_amount||' tokens on '||bn||'. Your '||l.current_bid||' tokens were returned.');
 END IF;
 UPDATE public.bazaar_listings SET current_bid=_amount, bidder_id=auth.uid(),
  ends_at = CASE WHEN ends_at - now() < interval '2 minutes' THEN now() + interval '2 minutes' ELSE ends_at END WHERE id=l.id;
END $$;

CREATE OR REPLACE FUNCTION public.bazaar_cancel(_listing uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE l public.bazaar_listings;
BEGIN
 SELECT * INTO l FROM public.bazaar_listings WHERE id=_listing FOR UPDATE;
 IF NOT FOUND OR l.status <> 'active' THEN RAISE EXCEPTION 'This listing is no longer active'; END IF;
 IF l.seller_id <> auth.uid() AND NOT public.has_permission(auth.uid(),'bazaar') THEN RAISE EXCEPTION 'Not your listing'; END IF;
 IF l.bidder_id IS NOT NULL THEN RAISE EXCEPTION 'Auctions with bids cannot be cancelled'; END IF;
 PERFORM public.give_blook(l.seller_id, l.blook_id);
 UPDATE public.bazaar_listings SET status='cancelled', closed_at=now() WHERE id=l.id;
END $$;

CREATE OR REPLACE FUNCTION public.my_permissions()
 RETURNS text[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
SELECT CASE WHEN public.is_account_banned(auth.uid()) THEN '{}'::text[] WHEN public.is_site_owner(auth.uid()) OR public.has_role(auth.uid(),'admin') THEN ARRAY['players.view','players.profile','players.tokens','players.password_reset','players.delete','players.ban','players.inventory','logs.view','shop','blooks','games','missions','chat','roles','badges','mail','bazaar'] || CASE WHEN public.has_permission(auth.uid(),'ips.view') THEN ARRAY['ips.view'] ELSE '{}'::text[] END ELSE coalesce((SELECT array_agg(DISTINCT p) FROM public.user_staff_roles u JOIN public.staff_roles r ON r.id=u.role_id,unnest(r.permissions) p WHERE u.user_id=auth.uid() AND p<>'users'),'{}') END $function$;