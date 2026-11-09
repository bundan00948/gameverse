ALTER TABLE public.blooks ADD COLUMN drop_weight numeric NOT NULL DEFAULT 10;
UPDATE public.blooks SET drop_weight = weight;
ALTER TABLE public.blooks ADD CONSTRAINT blooks_drop_weight_positive CHECK (drop_weight > 0 AND drop_weight < 'Infinity'::numeric AND drop_weight <> 'NaN'::numeric);
COMMENT ON COLUMN public.blooks.weight IS 'DEPRECATED: replaced by drop_weight for fractional drop weights; retained for older clients.';
CREATE FUNCTION public.sync_legacy_blook_weight() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF TG_OP = 'INSERT' THEN
  IF NEW.drop_weight = 10 AND NEW.weight <> 10 THEN NEW.drop_weight := NEW.weight; END IF;
 ELSIF NEW.weight IS DISTINCT FROM OLD.weight AND NEW.drop_weight IS NOT DISTINCT FROM OLD.drop_weight THEN
  NEW.drop_weight := NEW.weight;
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER sync_legacy_blook_weight BEFORE INSERT OR UPDATE ON public.blooks FOR EACH ROW EXECUTE FUNCTION public.sync_legacy_blook_weight();
CREATE OR REPLACE FUNCTION public.open_pack(_pack uuid) RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.packs; b public.blooks; w public.wallets; total numeric; pick numeric;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
 PERFORM public.ensure_wallet();
 SELECT * INTO w FROM public.wallets WHERE user_id = auth.uid() FOR UPDATE;
 SELECT * INTO p FROM public.packs WHERE id = _pack;
 IF NOT FOUND THEN RAISE EXCEPTION 'Pack not found'; END IF;
 IF w.tokens < p.price THEN RAISE EXCEPTION 'Not enough tokens'; END IF;
 SELECT sum(drop_weight) INTO total FROM public.blooks WHERE pack_id = _pack;
 IF total IS NULL OR total <= 0 THEN RAISE EXCEPTION 'Pack is empty'; END IF;
 pick := random()::numeric * total;
 FOR b IN SELECT * FROM public.blooks WHERE pack_id = _pack ORDER BY drop_weight DESC, id LOOP
  pick := pick - b.drop_weight;
  EXIT WHEN pick < 0;
 END LOOP;
 UPDATE public.wallets SET tokens = tokens - p.price, packs_opened = packs_opened + 1 WHERE user_id = auth.uid();
 INSERT INTO public.user_blooks(user_id, blook_id) VALUES (auth.uid(), b.id) ON CONFLICT (user_id, blook_id) DO UPDATE SET quantity = user_blooks.quantity + 1;
 RETURN json_build_object('id', b.id, 'name', b.name, 'emoji', b.emoji, 'rarity', b.rarity);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.open_pack(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.open_pack(uuid) TO authenticated;