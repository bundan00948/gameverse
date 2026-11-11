CREATE OR REPLACE FUNCTION public.sacrifice_blook(_blook uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE b public.blooks; q int; m numeric; aff text[]; mins int; pk uuid; pn text; nm text; bid uuid;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
 IF public.is_account_banned(auth.uid()) THEN RAISE EXCEPTION 'Account banned'; END IF;
 LOCK TABLE public.boosts IN SHARE ROW EXCLUSIVE MODE;
 IF (SELECT count(*) FROM public.boosts WHERE ends_at > now()) >= 2 THEN
  RAISE EXCEPTION 'There are already 2 active boosts. Try again when one ends.';
 END IF;
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