CREATE TABLE public.staff_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  colors text[] NOT NULL DEFAULT ARRAY['#a78bfa','#f472b6'],
  permissions text[] NOT NULL DEFAULT '{}',
  sort integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT staff_roles_colors_len CHECK (array_length(colors, 1) BETWEEN 1 AND 5)
);
CREATE TABLE public.user_staff_roles (
  user_id uuid NOT NULL,
  role_id uuid NOT NULL REFERENCES public.staff_roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);
CREATE TABLE public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text,
  sort integer NOT NULL DEFAULT 0
);
CREATE TABLE public.user_badges (
  user_id uuid NOT NULL,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, badge_id)
);
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  actor_name text NOT NULL DEFAULT '',
  message_id uuid REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  body text NOT NULL DEFAULT '',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ADD COLUMN reply_to uuid REFERENCES public.chat_messages(id) ON DELETE SET NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_roles, public.user_staff_roles, public.badges, public.user_badges TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.staff_roles, public.user_staff_roles, public.badges, public.user_badges, public.notifications TO service_role;

ALTER TABLE public.staff_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_staff_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _perm text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'admin') OR EXISTS (
    SELECT 1 FROM public.user_staff_roles u JOIN public.staff_roles r ON r.id = u.role_id
    WHERE u.user_id = _user_id AND _perm = ANY(r.permissions))
$$;
CREATE OR REPLACE FUNCTION public.my_permissions()
RETURNS text[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN public.has_role(auth.uid(), 'admin') THEN ARRAY['users','shop','blooks','games','missions','chat','roles','badges']
  ELSE coalesce((SELECT array_agg(DISTINCT p) FROM public.user_staff_roles u JOIN public.staff_roles r ON r.id = u.role_id, unnest(r.permissions) p WHERE u.user_id = auth.uid()), '{}') END
$$;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text), public.my_permissions() TO authenticated;

CREATE POLICY "read roles" ON public.staff_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "manage roles" ON public.staff_roles FOR ALL TO authenticated USING (public.has_permission(auth.uid(), 'roles')) WITH CHECK (public.has_permission(auth.uid(), 'roles'));
CREATE POLICY "read role assignments" ON public.user_staff_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "manage role assignments" ON public.user_staff_roles FOR ALL TO authenticated USING (public.has_permission(auth.uid(), 'roles')) WITH CHECK (public.has_permission(auth.uid(), 'roles'));
CREATE POLICY "read badges" ON public.badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "manage badges" ON public.badges FOR ALL TO authenticated USING (public.has_permission(auth.uid(), 'badges')) WITH CHECK (public.has_permission(auth.uid(), 'badges'));
CREATE POLICY "read badge assignments" ON public.user_badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "manage badge assignments" ON public.user_badges FOR ALL TO authenticated USING (public.has_permission(auth.uid(), 'badges')) WITH CHECK (public.has_permission(auth.uid(), 'badges'));
CREATE POLICY "own notifications read" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own notifications update" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own notifications delete" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "perm packs" ON public.packs FOR ALL TO authenticated USING (public.has_permission(auth.uid(), 'shop')) WITH CHECK (public.has_permission(auth.uid(), 'shop'));
CREATE POLICY "perm market" ON public.market_settings FOR ALL TO authenticated USING (public.has_permission(auth.uid(), 'shop')) WITH CHECK (public.has_permission(auth.uid(), 'shop'));
CREATE POLICY "perm blooks" ON public.blooks FOR ALL TO authenticated USING (public.has_permission(auth.uid(), 'blooks')) WITH CHECK (public.has_permission(auth.uid(), 'blooks'));
CREATE POLICY "perm games" ON public.games FOR ALL TO authenticated USING (public.has_permission(auth.uid(), 'games')) WITH CHECK (public.has_permission(auth.uid(), 'games'));
CREATE POLICY "perm missions" ON public.missions FOR ALL TO authenticated USING (public.has_permission(auth.uid(), 'missions')) WITH CHECK (public.has_permission(auth.uid(), 'missions'));
CREATE POLICY "perm chat delete" ON public.chat_messages FOR DELETE TO authenticated USING (public.has_permission(auth.uid(), 'chat'));

CREATE OR REPLACE FUNCTION public.notify_chat_reply()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE parent_user uuid;
BEGIN
  IF NEW.reply_to IS NOT NULL THEN
    SELECT user_id INTO parent_user FROM public.chat_messages WHERE id = NEW.reply_to;
    IF parent_user IS NOT NULL AND parent_user <> NEW.user_id THEN
      INSERT INTO public.notifications (user_id, actor_name, message_id, body)
      VALUES (parent_user, NEW.username, NEW.id, left(NEW.body, 200));
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER chat_reply_notify AFTER INSERT ON public.chat_messages FOR EACH ROW EXECUTE FUNCTION public.notify_chat_reply();