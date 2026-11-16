CREATE FUNCTION public.safe_audit_details(_data jsonb) RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SET search_path=public AS $$
DECLARE result jsonb; k text; v jsonb;
BEGIN
 IF jsonb_typeof(_data)='object' THEN
  result := '{}'::jsonb;
  FOR k,v IN SELECT key,value FROM jsonb_each(_data) LOOP
   IF lower(k) IN ('password','access_token','refresh_token','token_hash','authkey','secret','authorization') THEN
    result := result || jsonb_build_object(k,'[redacted]');
   ELSE result := result || jsonb_build_object(k,public.safe_audit_details(v)); END IF;
  END LOOP;
  RETURN result;
 ELSIF jsonb_typeof(_data)='array' THEN
  SELECT coalesce(jsonb_agg(public.safe_audit_details(value)),'[]'::jsonb) INTO result FROM jsonb_array_elements(_data);
  RETURN result;
 ELSIF jsonb_typeof(_data)='string' AND (_data #>> '{}') ~ '^https?://' THEN
  RETURN to_jsonb(split_part(_data #>> '{}','?',1));
 END IF;
 RETURN _data;
END $$;
REVOKE ALL ON FUNCTION public.safe_audit_details(jsonb) FROM PUBLIC;
CREATE FUNCTION public.sanitize_audit_entry() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN NEW.details := public.safe_audit_details(NEW.details); RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.sanitize_audit_entry() FROM PUBLIC;
CREATE TRIGGER audit_sanitize BEFORE INSERT ON public.admin_audit_log FOR EACH ROW EXECUTE FUNCTION public.sanitize_audit_entry();