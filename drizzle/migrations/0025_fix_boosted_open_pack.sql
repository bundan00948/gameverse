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
 SELECT sum(drop_weight * public.boost_factor(_pack, rarity)) INTO total FROM public.blooks WHERE pack_id = _pack;
 IF total IS NULL OR total <= 0 THEN RAISE EXCEPTION 'Pack is empty'; END IF;
 pick := random()::numeric * total;
 SELECT id, name, emoji, rarity INTO b FROM (
   SELECT id, name, emoji, rarity, sum(drop_weight * public.boost_factor(_pack, rarity)) OVER (ORDER BY drop_weight DESC, id) AS cum
   FROM public.blooks WHERE pack_id = _pack) t
 WHERE cum > pick ORDER BY cum LIMIT 1;
 IF b.id IS NULL THEN
   SELECT id, name, emoji, rarity INTO b FROM public.blooks WHERE pack_id = _pack ORDER BY drop_weight ASC, id DESC LIMIT 1;
 END IF;
 UPDATE public.wallets SET tokens = tokens - p.price, packs_opened = packs_opened + 1 WHERE user_id = auth.uid();
 INSERT INTO public.user_blooks(user_id, blook_id) VALUES (auth.uid(), b.id) ON CONFLICT (user_id, blook_id) DO UPDATE SET quantity = user_blooks.quantity + 1;
 RETURN json_build_object('id', b.id, 'name', b.name, 'emoji', b.emoji, 'rarity', b.rarity);
END;
$function$;