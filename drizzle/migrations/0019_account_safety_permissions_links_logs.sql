CREATE TABLE public.site_owners (user_id uuid PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.site_owners TO service_role;
ALTER TABLE public.site_owners ENABLE ROW LEVEL SECURITY;
INSERT INTO public.site_owners(user_id) SELECT id FROM public.profiles WHERE id='9e865fab-0792-4161-86b8-1e93acdc0fef';
CREATE TABLE public.account_bans (user_id uuid PRIMARY KEY, reason text NOT NULL DEFAULT '', banned_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz, revoked_at timestamptz, actor_id uuid NOT NULL);
GRANT SELECT ON public.account_bans TO authenticated;
GRANT ALL ON public.account_bans TO service_role;
ALTER TABLE public.account_bans ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_ban_status ON public.account_bans FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE OR REPLACE FUNCTION public.is_site_owner(_user_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.site_owners WHERE user_id=_user_id) $$;
CREATE OR REPLACE FUNCTION public.is_account_banned(_user_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.account_bans WHERE user_id=_user_id AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at>now())) $$;
REVOKE ALL ON FUNCTION public.is_site_owner(uuid), public.is_account_banned(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_site_owner(uuid), public.is_account_banned(uuid) TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT NOT public.is_account_banned(_user_id) AND EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role) $$;
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _perm text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
SELECT NOT public.is_account_banned(_user_id) AND (public.is_site_owner(_user_id) OR (_perm <> 'ips.view' AND public.has_role(_user_id,'admin')) OR EXISTS(SELECT 1 FROM public.user_staff_roles u JOIN public.staff_roles r ON r.id=u.role_id WHERE u.user_id=_user_id AND _perm=ANY(r.permissions))) $$;
CREATE OR REPLACE FUNCTION public.my_permissions() RETURNS text[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
SELECT CASE WHEN public.is_account_banned(auth.uid()) THEN '{}'::text[] WHEN public.is_site_owner(auth.uid()) OR public.has_role(auth.uid(),'admin') THEN ARRAY['players.view','players.profile','players.tokens','players.password_reset','players.delete','players.ban','logs.view','shop','blooks','games','missions','chat','roles','badges'] || CASE WHEN public.has_permission(auth.uid(),'ips.view') THEN ARRAY['ips.view'] ELSE '{}'::text[] END ELSE coalesce((SELECT array_agg(DISTINCT p) FROM public.user_staff_roles u JOIN public.staff_roles r ON r.id=u.role_id,unnest(r.permissions) p WHERE u.user_id=auth.uid() AND p<>'users'),'{}') END $$;
CREATE TABLE public.security_activity (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, kind text NOT NULL CHECK(kind IN ('register','game')), game_id uuid, game_title text NOT NULL DEFAULT '', ip_address inet, created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.security_activity TO service_role;
ALTER TABLE public.security_activity ENABLE ROW LEVEL SECURITY;
CREATE INDEX security_activity_created ON public.security_activity(created_at DESC);
CREATE OR REPLACE FUNCTION public.create_auth_link(_hours integer) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE t text; uid uuid:=auth.uid(); BEGIN
IF uid IS NULL OR public.is_account_banned(uid) THEN RAISE EXCEPTION 'Account unavailable'; END IF;
IF _hours NOT IN (24,48,72,168,720) THEN RAISE EXCEPTION 'Invalid login link duration'; END IF;
PERFORM pg_advisory_xact_lock(hashtext(uid::text));
IF (SELECT count(*) FROM public.auth_links WHERE user_id=uid AND used_at IS NULL AND expires_at>now())>=2 THEN RAISE EXCEPTION 'You already have 2 active login links. Remove one first.'; END IF;
t:=encode(extensions.gen_random_bytes(24),'hex');
INSERT INTO public.auth_links(user_id,token_hash,expires_at) VALUES(uid,encode(extensions.digest(t,'sha256'),'hex'),now()+make_interval(hours=>_hours)); RETURN t; END $$;
CREATE OR REPLACE FUNCTION public.create_auth_link() RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN RETURN public.create_auth_link(24); END $$;
REVOKE ALL ON FUNCTION public.create_auth_link(integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_auth_link(integer) TO authenticated;
CREATE OR REPLACE FUNCTION public.protect_ip_permission() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF auth.uid() IS NOT NULL AND NOT public.is_site_owner(auth.uid()) THEN
IF TG_TABLE_NAME='staff_roles' THEN
IF ('ips.view'=ANY(NEW.permissions)) IS DISTINCT FROM (CASE WHEN TG_OP='INSERT' THEN false ELSE 'ips.view'=ANY(OLD.permissions) END) THEN RAISE EXCEPTION 'Only the Owner can grant IP visibility'; END IF;
ELSE IF EXISTS(SELECT 1 FROM public.staff_roles WHERE id=NEW.role_id AND 'ips.view'=ANY(permissions)) THEN RAISE EXCEPTION 'Only the Owner can assign IP visibility roles'; END IF; END IF;
END IF; RETURN NEW; END $$;
CREATE TRIGGER protect_role_ip BEFORE INSERT OR UPDATE ON public.staff_roles FOR EACH ROW EXECUTE FUNCTION public.protect_ip_permission();
CREATE TRIGGER protect_assignment_ip BEFORE INSERT OR UPDATE ON public.user_staff_roles FOR EACH ROW EXECUTE FUNCTION public.protect_ip_permission();
CREATE OR REPLACE FUNCTION public.ban_doorbell() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN PERFORM realtime.send('{}'::jsonb,'ban_changed','account:'||NEW.user_id::text,true); RETURN NEW; END $$;
CREATE TRIGGER account_ban_changed AFTER INSERT OR UPDATE ON public.account_bans FOR EACH ROW EXECUTE FUNCTION public.ban_doorbell();
CREATE POLICY account_ban_doorbell ON realtime.messages FOR SELECT TO authenticated USING (realtime.topic()='account:'||auth.uid()::text);
DO $$ DECLARE t record; f record; body text; BEGIN
FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename NOT IN ('account_bans','site_owners','security_activity') LOOP
EXECUTE format('CREATE POLICY account_not_banned ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING (NOT public.is_account_banned(auth.uid())) WITH CHECK (NOT public.is_account_banned(auth.uid()))',t.tablename);
END LOOP;
FOR f IN SELECT p.oid,p.proname,p.prosrc FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace JOIN pg_language l ON l.oid=p.prolang WHERE n.nspname='public' AND l.lanname='plpgsql' AND p.prosecdef AND p.prorettype<>'trigger'::regtype AND p.proname NOT IN ('new_player_code','create_auth_link') LOOP
body:=regexp_replace(f.prosrc,'\mBEGIN\M','BEGIN IF auth.uid() IS NOT NULL AND public.is_account_banned(auth.uid()) THEN RAISE EXCEPTION ''Account banned''; END IF;','i');
EXECUTE replace(pg_get_functiondef(f.oid),f.prosrc,body);
END LOOP;
END $$;
COMMENT ON TABLE public.security_activity IS 'Protected registration/game IP log. No passwords. Addresses recorded only by verified server requests; unavailable historical IPs stay null.';