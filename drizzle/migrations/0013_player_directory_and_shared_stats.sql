CREATE OR REPLACE FUNCTION public.player_directory()
RETURNS TABLE(user_id uuid, username text, display_name text, image_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
 SELECT p.id, p.username, p.display_name, b.image_url
 FROM public.profiles p LEFT JOIN public.blooks b ON b.id = p.avatar_blook_id
 WHERE auth.uid() IS NOT NULL
$$;
REVOKE ALL ON FUNCTION public.player_directory() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.player_directory() TO authenticated;

CREATE OR REPLACE FUNCTION public.player_stats(_player uuid)
RETURNS TABLE(user_id uuid, tokens integer, packs_opened integer, blooks bigint, plays bigint, messages bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
 SELECT p.id, COALESCE(w.tokens, 0), COALESCE(w.packs_opened, 0),
 (SELECT count(*) FROM public.user_blooks ub WHERE ub.user_id = p.id AND ub.quantity > 0),
 (SELECT count(*) FROM public.game_plays gp WHERE gp.user_id = p.id),
 (SELECT count(*) FROM public.chat_messages cm WHERE cm.user_id = p.id)
 FROM public.profiles p LEFT JOIN public.wallets w ON w.user_id = p.id
 WHERE auth.uid() IS NOT NULL AND p.id = _player
$$;
REVOKE ALL ON FUNCTION public.player_stats(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.player_stats(uuid) TO authenticated;