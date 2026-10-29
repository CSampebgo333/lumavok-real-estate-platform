-- Additive migration: domain notifications and indexes for implemented query patterns.
-- Supabase CLI created the local filename; subsequent telemetry was blocked.
-- This reviewed SQL is maintained and replayed through the Prisma chain.
BEGIN;
CREATE INDEX IF NOT EXISTS idx_property_dashboard_recent ON public.property(property_developer_id,updated_at DESC,id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_appointment_developer_created ON public.appointment(property_developer_id,created_at DESC,id);
CREATE INDEX IF NOT EXISTS idx_appointment_developer_status_time ON public.appointment(property_developer_id,status,scheduled_for,id);
CREATE INDEX IF NOT EXISTS idx_appointment_client_created ON public.appointment(client_user_id,created_at DESC,id);
CREATE INDEX IF NOT EXISTS idx_notification_developer_created ON public.notification(property_developer_id,created_at DESC,id);
CREATE INDEX IF NOT EXISTS idx_seller_pending ON public.property_developer(seller_status,created_at,id) WHERE deleted_at IS NULL;
-- Non-callable triggers derive the recipient and text from committed rows.
CREATE FUNCTION lumavok_private.notify_appointment_event() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE a public.appointment;
BEGIN
 SELECT * INTO STRICT a FROM public.appointment WHERE id=NEW.appointment_id;
 IF NEW.type <> 'APPOINTMENT_' || a.status::text THEN RAISE EXCEPTION 'History must describe current status' USING ERRCODE='23514'; END IF;
 INSERT INTO public.notification(id,property_developer_id,type,title,message,link) VALUES(gen_random_uuid()::text,a.property_developer_id,NEW.type::public."NotificationType",'Viewing update','Viewing update','/appointments');
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION lumavok_private.notify_appointment_event() FROM PUBLIC,anon,authenticated,lumavok_runtime;
CREATE TRIGGER notify_appointment_event AFTER INSERT ON public.appointment_history FOR EACH ROW EXECUTE FUNCTION lumavok_private.notify_appointment_event();
CREATE FUNCTION lumavok_private.notify_listing_event() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE event_type public."NotificationType";
BEGIN
 IF NEW.status=OLD.status OR NEW.status NOT IN ('ACTIVE','SUSPENDED') THEN RETURN NEW; END IF;
 event_type=CASE WHEN NEW.status='ACTIVE' THEN 'LISTING_PUBLISHED'::public."NotificationType" ELSE 'LISTING_SUSPENDED'::public."NotificationType" END;
 INSERT INTO public.notification(id,property_developer_id,type,title,message,link) VALUES(gen_random_uuid()::text,NEW.property_developer_id,event_type,'Listing update','Listing update','/listings');
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION lumavok_private.notify_listing_event() FROM PUBLIC,anon,authenticated,lumavok_runtime;
CREATE TRIGGER notify_listing_event AFTER UPDATE OF status ON public.property FOR EACH ROW EXECUTE FUNCTION lumavok_private.notify_listing_event();

-- Upload lifecycle ledger. A committed tombstone precedes object deletion.
-- The composite FK prevents AVAILABLE -> DELETING while any media references
-- the asset, including references invisible to the caller's RLS scope.
CREATE TABLE public.storage_asset(
 id uuid PRIMARY KEY,
 property_developer_id text NOT NULL REFERENCES public.property_developer(id) ON DELETE RESTRICT,
 bucket text NOT NULL DEFAULT 'property-media' CHECK(bucket='property-media'),
 storage_key text NOT NULL UNIQUE,
 state text NOT NULL DEFAULT 'UPLOADING' CHECK(state IN ('UPLOADING','AVAILABLE','DELETING','DELETED')),
 created_at timestamptz(3) NOT NULL DEFAULT now(),updated_at timestamptz(3) NOT NULL DEFAULT now(),
 CONSTRAINT uq_storage_asset_state UNIQUE(id,state),
 CONSTRAINT asset_key_owner CHECK(storage_key=property_developer_id||'/'||id::text||'.webp')
);
CREATE INDEX idx_asset_owner_created ON public.storage_asset(property_developer_id,created_at);
ALTER TABLE public.storage_asset ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.storage_asset FROM PUBLIC,anon,authenticated,service_role,lumavok_runtime;
GRANT SELECT,INSERT ON public.storage_asset TO lumavok_runtime;
GRANT UPDATE(state,updated_at) ON public.storage_asset TO lumavok_runtime;
CREATE POLICY asset_owner_read ON public.storage_asset FOR SELECT TO lumavok_runtime USING(property_developer_id=lumavok_private.developer_id() OR lumavok_private.is_admin());
CREATE POLICY asset_owner_insert ON public.storage_asset FOR INSERT TO lumavok_runtime WITH CHECK(property_developer_id=lumavok_private.developer_id() AND state='UPLOADING');
CREATE POLICY asset_owner_update ON public.storage_asset FOR UPDATE TO lumavok_runtime USING(property_developer_id=lumavok_private.developer_id()) WITH CHECK(property_developer_id=lumavok_private.developer_id());
CREATE FUNCTION lumavok_private.asset_transition() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$ BEGIN
 IF NEW.state<>OLD.state AND NOT ((OLD.state='UPLOADING' AND NEW.state IN ('AVAILABLE','DELETING')) OR (OLD.state='AVAILABLE' AND NEW.state='DELETING') OR (OLD.state='DELETING' AND NEW.state='DELETED')) THEN RAISE EXCEPTION 'Invalid asset transition' USING ERRCODE='23514';END IF;RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION lumavok_private.asset_transition() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER asset_transition BEFORE UPDATE ON public.storage_asset FOR EACH ROW EXECUTE FUNCTION lumavok_private.asset_transition();
ALTER TABLE public.property_media ADD COLUMN asset_id uuid,ADD COLUMN asset_state text NOT NULL DEFAULT 'AVAILABLE' CHECK(asset_state='AVAILABLE');
ALTER TABLE public.property_media ADD CONSTRAINT property_media_asset_state_fkey FOREIGN KEY(asset_id,asset_state) REFERENCES public.storage_asset(id,state) ON DELETE RESTRICT ON UPDATE RESTRICT;
CREATE INDEX idx_media_asset ON public.property_media(asset_id);
CREATE FUNCTION lumavok_private.media_asset_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE a public.storage_asset;owner_id text;
BEGIN
 IF NEW.storage_provider='supabase' THEN
  SELECT * INTO a FROM public.storage_asset WHERE id=NEW.asset_id FOR UPDATE;
  SELECT property_developer_id INTO owner_id FROM public.property WHERE id=NEW.property_id;
  IF a.id IS NULL OR owner_id IS NULL OR a.property_developer_id IS DISTINCT FROM owner_id OR a.state IS DISTINCT FROM 'AVAILABLE' OR a.storage_key IS DISTINCT FROM NEW.storage_key OR NEW.public_id IS DISTINCT FROM a.id::text THEN RAISE EXCEPTION 'Invalid media asset owner or state' USING ERRCODE='23514';END IF;
 ELSIF NEW.asset_id IS NOT NULL THEN RAISE EXCEPTION 'Legacy media cannot adopt managed assets' USING ERRCODE='23514';END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION lumavok_private.media_asset_guard() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER media_asset_guard BEFORE INSERT OR UPDATE OF asset_id,asset_state,storage_key,storage_provider,property_id ON public.property_media FOR EACH ROW EXECUTE FUNCTION lumavok_private.media_asset_guard();
-- Storage's privileged key does not need access to application tables.
-- Storage schema permissions are deliberately untouched.
DO $$ DECLARE t record; BEGIN FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' LOOP EXECUTE format('REVOKE ALL ON TABLE public.%I FROM service_role',t.tablename);END LOOP;END $$;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM service_role;
COMMIT;
