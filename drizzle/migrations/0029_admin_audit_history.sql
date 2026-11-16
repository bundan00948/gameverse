CREATE TABLE public.admin_audit_log (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 created_at timestamptz NOT NULL DEFAULT now(),
 actor_id uuid,
 actor_name text NOT NULL,
 target_user_id uuid,
 target_name text NOT NULL DEFAULT '',
 action text NOT NULL,
 resource text NOT NULL,
 resource_id text,
 details jsonb NOT NULL DEFAULT '{}'::jsonb
);
GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT SELECT, INSERT ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_read ON public.admin_audit_log FOR SELECT TO authenticated USING (public.has_permission(auth.uid(),'logs.view') AND (public.is_site_owner(auth.uid()) OR (coalesce(public.staff_tier(actor_id),1000000000) > public.staff_tier(auth.uid()) AND coalesce(public.staff_tier(target_user_id),1000000000) > public.staff_tier(auth.uid()))));
CREATE INDEX admin_audit_time ON public.admin_audit_log(created_at DESC, id);
CREATE INDEX admin_audit_action_time ON public.admin_audit_log(action, created_at DESC);
CREATE FUNCTION public.capture_admin_audit() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE actor uuid; target uuid; old_data jsonb; new_data jsonb; row_data jsonb; changes jsonb := '{}'::jsonb; k text; actor_label text; target_label text; event text; headers jsonb;
BEGIN
 headers := coalesce(nullif(current_setting('request.headers',true),''),'{}')::jsonb;
 IF auth.role()='service_role' THEN actor := nullif(headers->>'x-gv-audit-actor','')::uuid; ELSE actor := auth.uid(); END IF;
 IF actor IS NULL THEN RETURN coalesce(NEW,OLD); END IF;
 IF TG_TABLE_NAME IN ('profiles','wallets','user_blooks','user_roles','account_bans') AND auth.role() IS DISTINCT FROM 'service_role' THEN RETURN coalesce(NEW,OLD); END IF;
 IF TG_TABLE_NAME='mail' AND coalesce(to_jsonb(NEW),to_jsonb(OLD))->>'kind' IS DISTINCT FROM 'system' THEN RETURN coalesce(NEW,OLD); END IF;
 IF NOT (public.has_permission(actor,'players.view') OR public.has_permission(actor,'roles') OR public.has_permission(actor,'badges') OR public.has_permission(actor,'shop') OR public.has_permission(actor,'blooks') OR public.has_permission(actor,'games') OR public.has_permission(actor,'missions') OR public.has_permission(actor,'mail') OR public.has_permission(actor,'players.ban') OR public.has_permission(actor,'players.inventory') OR public.has_permission(actor,'players.profile') OR public.has_permission(actor,'players.tokens')) THEN RETURN coalesce(NEW,OLD); END IF;
 old_data := CASE WHEN TG_OP='INSERT' THEN '{}'::jsonb ELSE to_jsonb(OLD) END;
 new_data := CASE WHEN TG_OP='DELETE' THEN '{}'::jsonb ELSE to_jsonb(NEW) END;
 row_data := CASE WHEN TG_OP='DELETE' THEN old_data ELSE new_data END;
 target := CASE WHEN TG_TABLE_NAME='profiles' THEN (row_data->>'id')::uuid ELSE (row_data->>'user_id')::uuid END;
 SELECT username INTO actor_label FROM public.profiles WHERE id=actor;
 SELECT username INTO target_label FROM public.profiles WHERE id=target;
 target_label := coalesce(target_label,row_data->>'name',row_data->>'title','');
 FOR k IN SELECT jsonb_object_keys(old_data || new_data) LOOP
  IF old_data->k IS DISTINCT FROM new_data->k THEN
   changes := changes || jsonb_build_object(k,jsonb_build_object('before',old_data->k,'after',new_data->k));
  END IF;
 END LOOP;
 IF changes='{}'::jsonb THEN RETURN coalesce(NEW,OLD); END IF;
 event := lower(TG_OP);
 IF TG_TABLE_NAME='account_bans' THEN
  event := CASE WHEN new_data->>'revoked_at' IS NOT NULL THEN 'unban' ELSE 'ban' END;
  changes := jsonb_build_object('reason',row_data->>'reason','banned_at',row_data->>'banned_at','expires_at',row_data->>'expires_at','duration_hours',CASE WHEN row_data->>'expires_at' IS NULL THEN NULL ELSE extract(epoch FROM ((row_data->>'expires_at')::timestamptz-(row_data->>'banned_at')::timestamptz))/3600 END,'permanent',row_data->>'expires_at' IS NULL);
 END IF;
 -- Never copy signed URL credentials into the history.
 FOR k IN SELECT jsonb_object_keys(changes) LOOP
  IF k LIKE '%image_url' THEN changes := jsonb_set(changes,ARRAY[k],jsonb_build_object('changed',true)); END IF;
 END LOOP;
 INSERT INTO public.admin_audit_log(actor_id,actor_name,target_user_id,target_name,action,resource,resource_id,details)
 VALUES(actor,coalesce(actor_label,'Staff'),target,target_label,event,TG_TABLE_NAME,coalesce(row_data->>'id',row_data->>'user_id'),changes);
 RETURN coalesce(NEW,OLD);
END $$;
REVOKE ALL ON FUNCTION public.capture_admin_audit() FROM PUBLIC;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['profiles','wallets','user_blooks','user_roles','account_bans','packs','blooks','banners','market_settings','games','missions','staff_roles','user_staff_roles','badges','user_badges','credits','mail'] LOOP
 EXECUTE format('CREATE TRIGGER admin_audit_change AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.capture_admin_audit()',t);
 END LOOP;
END $$;
CREATE FUNCTION public.audit_admin_upload(_path text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE actor uuid := auth.uid(); label text;
BEGIN
 IF actor IS NULL OR NOT (public.has_permission(actor,'shop') OR public.has_permission(actor,'blooks') OR public.has_permission(actor,'games') OR public.has_permission(actor,'badges') OR public.has_permission(actor,'mail')) THEN RAISE EXCEPTION 'Permission denied'; END IF;
 IF length(_path)>200 OR _path !~ '^[a-zA-Z0-9._-]+$' THEN RAISE EXCEPTION 'Invalid image path'; END IF;
 SELECT username INTO label FROM public.profiles WHERE id=actor;
 INSERT INTO public.admin_audit_log(actor_id,actor_name,action,resource,resource_id) VALUES(actor,coalesce(label,'Staff'),'upload','art',_path);
END $$;
REVOKE ALL ON FUNCTION public.audit_admin_upload(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.audit_admin_upload(text) TO authenticated;
COMMENT ON TABLE public.admin_audit_log IS 'Append-only admin history. Never store passwords, authentication keys or signed image URL credentials.';