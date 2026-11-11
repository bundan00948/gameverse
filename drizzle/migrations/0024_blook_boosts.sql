CREATE TABLE public.boosts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL,
 player_name text NOT NULL,
 blook_name text NOT NULL,
 rarity text NOT NULL,
 pack_id uuid REFERENCES public.packs(id) ON DELETE CASCADE,
 pack_name text,
 multiplier numeric NOT NULL,
 affected text[] NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 ends_at timestamptz NOT NULL
);
GRANT SELECT ON public.boosts TO authenticated;
GRANT ALL ON public.boosts TO service_role;
ALTER TABLE public.boosts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in players see boosts" ON public.boosts FOR SELECT TO authenticated USING (true);
CREATE INDEX boosts_ends_at_idx ON public.boosts(ends_at);

CREATE OR REPLACE FUNCTION public.boost_factor(_pack uuid, _rarity text) RETURNS numeric
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT coalesce(exp(sum(ln(multiplier))), 1) FROM public.boosts
 WHERE ends_at > now() AND _rarity = ANY(affected) AND (pack_id IS NULL OR pack_id = _pack)
$$;

CREATE OR REPLACE FUNCTION public.sacrifice_blook(_blook uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE b public.blooks; q int; m numeric; aff text[]; mins int; pk uuid; pn text; nm text; bid uuid;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
 IF public.is_account_banned(auth.uid()) THEN RAISE EXCEPTION 'Account banned'; END IF;
 SELECT * INTO b FROM public.blooks WHERE id = _blook;
 IF NOT FOUND THEN RAISE EXCEPTION 'Blook not found'; END IF;
 SELECT quantity INTO q FROM public.user_blooks WHERE user_id = auth.uid() AND blook_id = _blook FOR UPDATE;
 IF q IS NULL OR q < 1 THEN RAISE EXCEPTION 'You do not own this blook'; END IF;
 IF b.rarity = 'chroma' THEN
  IF b.pack_id IS NULL THEN RAISE EXCEPTION 'This blook has no pack to boost'; END IF;
  m := 1.5; aff := ARRAY['rare','epic','legendary','chroma','mythical','hidden']; mins := 60; pk := b.pack_id;
  SELECT name INTO pn FROM public.packs WHERE id = pk;
 ELSIF b.rarity = 'mythical' THEN
  m := round((1.5 + random() * 0.5)::numeric, 2); aff := ARRAY['rare','epic','legendary','chroma','mythical','hidden']; mins := 90;
 ELSIF b.rarity = 'hidden' THEN
  m := round((1.5 + random() * 1.5)::numeric, 2); aff := ARRAY['epic','legendary','chroma','mythical','hidden']; mins := 120;
 ELSE RAISE EXCEPTION 'Only Chroma, Mythical or Hidden blooks can be sacrificed'; END IF;
 IF q = 1 THEN DELETE FROM public.user_blooks WHERE user_id = auth.uid() AND blook_id = _blook;
 ELSE UPDATE public.user_blooks SET quantity = quantity - 1 WHERE user_id = auth.uid() AND blook_id = _blook; END IF;
 SELECT coalesce(nullif(display_name, ''), username) INTO nm FROM public.profiles WHERE id = auth.uid();
 INSERT INTO public.boosts(user_id, player_name, blook_name, rarity, pack_id, pack_name, multiplier, affected, ends_at)
 VALUES (auth.uid(), coalesce(nm, 'Player'), b.name, b.rarity, pk, pn, m, aff, now() + make_interval(mins => mins)) RETURNING id INTO bid;
 RETURN jsonb_build_object('id', bid, 'multiplier', m, 'minutes', mins, 'pack', pn);
END $$;
REVOKE EXECUTE ON FUNCTION public.sacrifice_blook(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.sacrifice_blook(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.open_pack(_pack uuid)
 RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE p public.packs; b record; w public.wallets; total numeric; pick numeric;
BEGIN IF auth.uid() IS NOT NULL AND public.is_account_banned(auth.uid()) THEN RAISE EXCEPTION 'Account banned'; END IF;
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
 PERFORM public.ensure_wallet();
 SELECT * INTO w FROM public.wallets WHERE user_id = auth.uid() FOR UPDATE;
 SELECT * INTO p FROM public.packs WHERE id = _pack;
 IF NOT FOUND THEN RAISE EXCEPTION 'Pack not found'; END IF;
 IF w.tokens < p.price THEN RAISE EXCEPTION 'Not enough tokens'; END IF;
 CREATE TEMP TABLE IF NOT EXISTS _boosted(id uuid, name text, emoji text, rarity text, wt numeric) ON COMMIT DROP;
 DELETE FROM _boosted;
 INSERT INTO _boosted SELECT id, name, emoji, rarity, drop_weight * public.boost_factor(_pack, rarity) FROM public.blooks WHERE pack_id = _pack;
 SELECT sum(wt) INTO total FROM _boosted;
 IF total IS NULL OR total <= 0 THEN RAISE EXCEPTION 'Pack is empty'; END IF;
 pick := random()::numeric * total;
 FOR b IN SELECT * FROM _boosted ORDER BY wt DESC, id LOOP
  pick := pick - b.wt;
  EXIT WHEN pick < 0;
 END LOOP;
 UPDATE public.wallets SET tokens = tokens - p.price, packs_opened = packs_opened + 1 WHERE user_id = auth.uid();
 INSERT INTO public.user_blooks(user_id, blook_id) VALUES (auth.uid(), b.id) ON CONFLICT (user_id, blook_id) DO UPDATE SET quantity = user_blooks.quantity + 1;
 RETURN json_build_object('id', b.id, 'name', b.name, 'emoji', b.emoji, 'rarity', b.rarity);
END;
$function$;