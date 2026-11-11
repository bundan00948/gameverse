CREATE UNIQUE INDEX security_activity_one_registration ON public.security_activity(user_id) WHERE kind='register';
CREATE OR REPLACE FUNCTION public.log_account_registration() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN INSERT INTO public.security_activity(user_id,kind,created_at) VALUES(NEW.id,'register',NEW.created_at) ON CONFLICT DO NOTHING; RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.log_account_registration(), public.ban_doorbell(), public.protect_ip_permission() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER gameverse_registration_activity AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.log_account_registration();
DO $$ DECLARE f record; body text; BEGIN
FOR f IN SELECT p.oid,p.prosrc FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace JOIN pg_language l ON l.oid=p.prolang WHERE n.nspname='public' AND l.lanname='sql' AND p.proname IN ('player_directory','player_avatars','player_codes','player_banner_directory','player_stats') LOOP
body:=regexp_replace(f.prosrc,'auth.uid\(\) IS NOT NULL','auth.uid() IS NOT NULL AND NOT public.is_account_banned(auth.uid())','gi');
EXECUTE replace(pg_get_functiondef(f.oid),f.prosrc,body);
END LOOP;
END $$;