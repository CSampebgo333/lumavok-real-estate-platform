-- Additive migration: domain notifications and indexes for measured query patterns.
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
COMMIT;
