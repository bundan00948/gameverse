ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS code_id text UNIQUE;

CREATE OR REPLACE FUNCTION public.new_player_code(_year int) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c text;
BEGIN
  LOOP
    c := lpad((_year % 100)::text, 2, '0') || lpad(floor(random() * 100000)::int::text, 5, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE code_id = c);
  END LOOP;
  RETURN c;
END $$;
REVOKE EXECUTE ON FUNCTION public.new_player_code(int) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.assign_player_code() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.code_id IS NULL THEN NEW.code_id := public.new_player_code(extract(year FROM coalesce(NEW.created_at, now()))::int); END IF;
  ELSE
    NEW.code_id := OLD.code_id;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS profiles_code_id ON public.profiles;
CREATE TRIGGER profiles_code_id BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.assign_player_code();

DO $$ DECLARE r record; BEGIN
  ALTER TABLE public.profiles DISABLE TRIGGER profiles_code_id;
  FOR r IN SELECT id, created_at FROM public.profiles WHERE code_id IS NULL ORDER BY created_at LOOP
    UPDATE public.profiles SET code_id = public.new_player_code(extract(year FROM r.created_at)::int) WHERE id = r.id;
  END LOOP;
  ALTER TABLE public.profiles ENABLE TRIGGER profiles_code_id;
END $$;

CREATE OR REPLACE FUNCTION public.player_codes() RETURNS TABLE(user_id uuid, code_id text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, code_id FROM public.profiles WHERE auth.uid() IS NOT NULL $$;
REVOKE EXECUTE ON FUNCTION public.player_codes() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.player_codes() TO authenticated;

CREATE TABLE public.auth_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '24 hours',
  used_at timestamptz
);
GRANT SELECT, DELETE ON public.auth_links TO authenticated;
GRANT ALL ON public.auth_links TO service_role;
ALTER TABLE public.auth_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own auth links read" ON public.auth_links FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own auth links revoke" ON public.auth_links FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.create_auth_link() RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE t text; uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Please sign in again.'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(uid::text));
  IF (SELECT count(*) FROM public.auth_links WHERE user_id = uid AND used_at IS NULL AND expires_at > now()) >= 2 THEN
    RAISE EXCEPTION 'You already have 2 active login links. Remove one first.';
  END IF;
  t := encode(extensions.gen_random_bytes(24), 'hex');
  INSERT INTO public.auth_links(user_id, token_hash) VALUES (uid, encode(extensions.digest(t, 'sha256'), 'hex'));
  RETURN t;
END $$;
REVOKE EXECUTE ON FUNCTION public.create_auth_link() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_auth_link() TO authenticated;