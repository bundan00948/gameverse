CREATE TABLE public.profiles (id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, username text NOT NULL DEFAULT '', display_name text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE FUNCTION public.create_player_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN INSERT INTO public.profiles(id, username, display_name) VALUES (new.id, coalesce(new.raw_user_meta_data->>'username', ''), coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'username', '')); RETURN new; END; $$;
CREATE TRIGGER on_gameverse_signup AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_player_profile();
INSERT INTO public.profiles(id, username, display_name) SELECT id, coalesce(raw_user_meta_data->>'username', ''), coalesce(raw_user_meta_data->>'full_name', '') FROM auth.users ON CONFLICT DO NOTHING;