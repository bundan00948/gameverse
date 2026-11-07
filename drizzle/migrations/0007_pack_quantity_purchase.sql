CREATE OR REPLACE FUNCTION public.open_packs(_pack uuid, _quantity integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE result jsonb := '[]'::jsonb; i integer; wallet public.wallets; pack public.packs;
BEGIN
IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
IF _quantity IS NULL OR _quantity < 1 THEN RAISE EXCEPTION 'Choose a positive whole quantity'; END IF;
PERFORM public.ensure_wallet();
SELECT * INTO wallet FROM public.wallets WHERE user_id = auth.uid() FOR UPDATE;
SELECT * INTO pack FROM public.packs WHERE id = _pack;
IF NOT FOUND THEN RAISE EXCEPTION 'Pack not found'; END IF;
IF wallet.tokens::bigint < pack.price::bigint * _quantity::bigint THEN RAISE EXCEPTION 'Not enough tokens'; END IF;
FOR i IN 1.._quantity LOOP
result := result || jsonb_build_array(public.open_pack(_pack));
END LOOP;
RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.open_packs(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.open_packs(uuid, integer) TO authenticated;