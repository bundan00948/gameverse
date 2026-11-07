ALTER TABLE public.staff_roles DROP CONSTRAINT staff_roles_colors_len;
ALTER TABLE public.staff_roles ADD CONSTRAINT staff_roles_colors_len CHECK (array_length(colors, 1) BETWEEN 1 AND 9);
ALTER TABLE public.profiles ADD COLUMN avatar_blook_id uuid REFERENCES public.blooks(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.check_avatar_owned()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.avatar_blook_id IS NOT NULL AND NEW.avatar_blook_id IS DISTINCT FROM OLD.avatar_blook_id
     AND NOT public.has_permission(auth.uid(), 'users')
     AND NOT EXISTS (SELECT 1 FROM public.user_blooks WHERE user_id = NEW.id AND blook_id = NEW.avatar_blook_id) THEN
    RAISE EXCEPTION 'You can only use a blook you own';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER profiles_avatar_owned BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.check_avatar_owned();

CREATE OR REPLACE FUNCTION public.player_avatars()
RETURNS TABLE (user_id uuid, image_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, b.image_url FROM public.profiles p JOIN public.blooks b ON b.id = p.avatar_blook_id
  WHERE auth.uid() IS NOT NULL
$$;
GRANT EXECUTE ON FUNCTION public.player_avatars() TO authenticated;