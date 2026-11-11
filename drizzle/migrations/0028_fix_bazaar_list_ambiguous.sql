CREATE OR REPLACE FUNCTION public.bazaar_list(_blook uuid, _price integer, _auction boolean, _hours integer) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r text; q int; new_id uuid;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
 IF public.is_account_banned(auth.uid()) THEN RAISE EXCEPTION 'Account banned'; END IF;
 IF _price IS NULL OR _price < 1 OR _price > 10000000 THEN RAISE EXCEPTION 'Choose a price between 1 and 10,000,000 tokens'; END IF;
 IF (SELECT count(*) FROM public.bazaar_listings bl WHERE bl.seller_id=auth.uid() AND bl.status='active') >= 20 THEN RAISE EXCEPTION 'You can have up to 20 active listings'; END IF;
 SELECT b.rarity INTO r FROM public.blooks b WHERE b.id=_blook; IF NOT FOUND THEN RAISE EXCEPTION 'Blook not found'; END IF;
 IF _auction THEN
  IF r NOT IN ('legendary','chroma','mythical','hidden') THEN RAISE EXCEPTION 'Only Legendary or rarer blooks can be auctioned'; END IF;
  IF _hours NOT IN (1,6,12,24,48) THEN RAISE EXCEPTION 'Invalid auction length'; END IF;
 END IF;
 SELECT ub.quantity INTO q FROM public.user_blooks ub WHERE ub.user_id=auth.uid() AND ub.blook_id=_blook FOR UPDATE;
 IF q IS NULL OR q < 1 THEN RAISE EXCEPTION 'You do not own this blook'; END IF;
 IF q = 1 THEN DELETE FROM public.user_blooks ub WHERE ub.user_id=auth.uid() AND ub.blook_id=_blook;
 ELSE UPDATE public.user_blooks ub SET quantity=ub.quantity-1 WHERE ub.user_id=auth.uid() AND ub.blook_id=_blook; END IF;
 INSERT INTO public.bazaar_listings(seller_id,blook_id,kind,price,ends_at)
 VALUES (auth.uid(),_blook,CASE WHEN _auction THEN 'auction' ELSE 'sale' END,_price,CASE WHEN _auction THEN now()+make_interval(hours=>_hours) END) RETURNING bazaar_listings.id INTO new_id;
 RETURN new_id;
END $$;