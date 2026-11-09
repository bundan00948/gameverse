ALTER TABLE public.banners DROP CONSTRAINT IF EXISTS banners_rarity_check;
ALTER TABLE public.banners ADD CONSTRAINT banners_rarity_check CHECK (rarity IN ('common','uncommon','rare','epic','legendary','chroma','mythical','hidden'));
CREATE OR REPLACE FUNCTION public.sell_blook(_blook uuid) RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r text; q int; price int; BEGIN
 SELECT rarity INTO r FROM blooks WHERE id = _blook; IF NOT FOUND THEN RAISE EXCEPTION 'Blook not found'; END IF;
 SELECT quantity INTO q FROM user_blooks WHERE user_id = auth.uid() AND blook_id = _blook FOR UPDATE;
 IF q IS NULL OR q < 1 THEN RAISE EXCEPTION 'You do not own this blook'; END IF;
 price := CASE r WHEN 'uncommon' THEN 5 WHEN 'rare' THEN 15 WHEN 'epic' THEN 30 WHEN 'legendary' THEN 75 WHEN 'chroma' THEN 200 WHEN 'mythical' THEN 500 WHEN 'hidden' THEN 1000 ELSE 2 END;
 IF q = 1 THEN DELETE FROM user_blooks WHERE user_id = auth.uid() AND blook_id = _blook;
 ELSE UPDATE user_blooks SET quantity = quantity - 1 WHERE user_id = auth.uid() AND blook_id = _blook; END IF;
 UPDATE wallets SET tokens = tokens + price WHERE user_id = auth.uid(); RETURN price; END $$;