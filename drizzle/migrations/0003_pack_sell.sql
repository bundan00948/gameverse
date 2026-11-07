CREATE OR REPLACE FUNCTION public.open_pack(_pack uuid) RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.packs; b public.blooks; w public.wallets; total int; pick int; BEGIN
 w := ensure_wallet();
 SELECT * INTO p FROM packs WHERE id = _pack; IF NOT FOUND THEN RAISE EXCEPTION 'Pack not found'; END IF;
 IF w.tokens < p.price THEN RAISE EXCEPTION 'Not enough tokens'; END IF;
 SELECT sum(weight) INTO total FROM blooks WHERE pack_id = _pack; IF total IS NULL THEN RAISE EXCEPTION 'Pack is empty'; END IF;
 pick := floor(random() * total)::int;
 FOR b IN SELECT * FROM blooks WHERE pack_id = _pack ORDER BY weight DESC, id LOOP pick := pick - b.weight; EXIT WHEN pick < 0; END LOOP;
 UPDATE wallets SET tokens = tokens - p.price, packs_opened = packs_opened + 1 WHERE user_id = auth.uid();
 INSERT INTO user_blooks(user_id, blook_id) VALUES (auth.uid(), b.id) ON CONFLICT (user_id, blook_id) DO UPDATE SET quantity = user_blooks.quantity + 1;
 RETURN json_build_object('id', b.id, 'name', b.name, 'emoji', b.emoji, 'rarity', b.rarity); END $$;

CREATE OR REPLACE FUNCTION public.sell_blook(_blook uuid) RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r text; q int; price int; BEGIN
 SELECT rarity INTO r FROM blooks WHERE id = _blook; IF NOT FOUND THEN RAISE EXCEPTION 'Blook not found'; END IF;
 SELECT quantity INTO q FROM user_blooks WHERE user_id = auth.uid() AND blook_id = _blook FOR UPDATE;
 IF q IS NULL OR q < 1 THEN RAISE EXCEPTION 'You do not own this blook'; END IF;
 price := CASE r WHEN 'uncommon' THEN 5 WHEN 'rare' THEN 15 WHEN 'epic' THEN 30 WHEN 'legendary' THEN 75 WHEN 'chroma' THEN 200 ELSE 2 END;
 IF q = 1 THEN DELETE FROM user_blooks WHERE user_id = auth.uid() AND blook_id = _blook;
 ELSE UPDATE user_blooks SET quantity = quantity - 1 WHERE user_id = auth.uid() AND blook_id = _blook; END IF;
 UPDATE wallets SET tokens = tokens + price WHERE user_id = auth.uid(); RETURN price; END $$;
REVOKE EXECUTE ON FUNCTION public.sell_blook FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sell_blook TO authenticated;