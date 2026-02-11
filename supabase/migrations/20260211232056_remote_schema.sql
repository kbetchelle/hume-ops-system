drop trigger if exists "update_arketa_classes_updated_at" on "public"."arketa_classes";

drop trigger if exists "trigger_refresh_daily_schedule_on_reservations_delete" on "public"."arketa_reservations_history";

drop trigger if exists "trigger_refresh_daily_schedule_on_reservations_insert" on "public"."arketa_reservations_history";

drop trigger if exists "trigger_refresh_daily_schedule_on_reservations_update" on "public"."arketa_reservations_history";

drop trigger if exists "update_daily_schedule_updated_at" on "public"."daily_schedule";

drop trigger if exists "trg_auto_mark_old_announcements_read" on "public"."profiles";

-- Conditional drop policy for api_sync_skipped_records if table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'api_sync_skipped_records'
  ) THEN
    drop policy if exists "Managers can view api_sync_skipped_records" on "public"."api_sync_skipped_records";
  END IF;
END $$;

-- Conditional drop policies for daily_schedule if table exists  
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'daily_schedule'
  ) THEN
    drop policy if exists "Allow authenticated read" on "public"."daily_schedule";
    drop policy if exists "Allow service role full access" on "public"."daily_schedule";
    drop policy if exists "Concierges can view daily_schedule" on "public"."daily_schedule";
    drop policy if exists "Managers can manage daily_schedule" on "public"."daily_schedule";
  END IF;
END $$;

-- Conditional revoke for api_sync_skipped_records if table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'api_sync_skipped_records'
  ) THEN
    revoke delete on table "public"."api_sync_skipped_records" from "anon";
    revoke insert on table "public"."api_sync_skipped_records" from "anon";
    revoke references on table "public"."api_sync_skipped_records" from "anon";
    revoke select on table "public"."api_sync_skipped_records" from "anon";
    revoke trigger on table "public"."api_sync_skipped_records" from "anon";
    revoke truncate on table "public"."api_sync_skipped_records" from "anon";
    revoke update on table "public"."api_sync_skipped_records" from "anon";
    revoke delete on table "public"."api_sync_skipped_records" from "authenticated";
    revoke insert on table "public"."api_sync_skipped_records" from "authenticated";
    revoke references on table "public"."api_sync_skipped_records" from "authenticated";
    revoke select on table "public"."api_sync_skipped_records" from "authenticated";
    revoke trigger on table "public"."api_sync_skipped_records" from "authenticated";
    revoke truncate on table "public"."api_sync_skipped_records" from "authenticated";
    revoke update on table "public"."api_sync_skipped_records" from "authenticated";
    revoke delete on table "public"."api_sync_skipped_records" from "service_role";
    revoke insert on table "public"."api_sync_skipped_records" from "service_role";
    revoke references on table "public"."api_sync_skipped_records" from "service_role";
    revoke select on table "public"."api_sync_skipped_records" from "service_role";
    revoke trigger on table "public"."api_sync_skipped_records" from "service_role";
    revoke truncate on table "public"."api_sync_skipped_records" from "service_role";
    revoke update on table "public"."api_sync_skipped_records" from "service_role";
  END IF;
END $$;

-- Conditional revoke for daily_schedule if table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'daily_schedule'
  ) THEN
    revoke delete on table "public"."daily_schedule" from "anon";
    revoke insert on table "public"."daily_schedule" from "anon";
    revoke references on table "public"."daily_schedule" from "anon";
    revoke select on table "public"."daily_schedule" from "anon";
    revoke trigger on table "public"."daily_schedule" from "anon";
    revoke truncate on table "public"."daily_schedule" from "anon";
    revoke update on table "public"."daily_schedule" from "anon";
    revoke delete on table "public"."daily_schedule" from "authenticated";
    revoke insert on table "public"."daily_schedule" from "authenticated";
    revoke references on table "public"."daily_schedule" from "authenticated";
    revoke select on table "public"."daily_schedule" from "authenticated";
    revoke trigger on table "public"."daily_schedule" from "authenticated";
    revoke truncate on table "public"."daily_schedule" from "authenticated";
    revoke update on table "public"."daily_schedule" from "authenticated";
    revoke delete on table "public"."daily_schedule" from "service_role";
    revoke insert on table "public"."daily_schedule" from "service_role";
    revoke references on table "public"."daily_schedule" from "service_role";
    revoke select on table "public"."daily_schedule" from "service_role";
    revoke trigger on table "public"."daily_schedule" from "service_role";
    revoke truncate on table "public"."daily_schedule" from "service_role";
    revoke update on table "public"."daily_schedule" from "service_role";
  END IF;
END $$;

alter table "public"."arketa_classes" drop constraint "arketa_classes_external_id_class_date_key";

alter table "public"."daily_schedule" drop constraint "daily_schedule_schedule_date_class_id_key";

drop function if exists "public"."auto_mark_old_announcements_read"();

drop function if exists "public"."refresh_daily_schedule"(p_schedule_date date);

drop function if exists "public"."refresh_daily_schedule_on_reservations_delete"();

drop function if exists "public"."refresh_daily_schedule_on_reservations_insert"();

drop function if exists "public"."refresh_daily_schedule_on_reservations_update"();

drop function if exists "public"."upsert_arketa_classes_from_staging"(p_sync_batch_id uuid);

drop view if exists "public"."arketa_orphan_classes";

alter table "public"."api_sync_skipped_records" drop constraint "api_sync_skipped_records_pkey";

alter table "public"."daily_schedule" drop constraint "daily_schedule_pkey";

drop index if exists "public"."api_sync_skipped_records_pkey";

drop index if exists "public"."arketa_classes_external_id_class_date_key";

drop index if exists "public"."daily_schedule_pkey";

drop index if exists "public"."daily_schedule_schedule_date_class_id_key";

drop index if exists "public"."idx_api_sync_skipped_records_api_name";

drop index if exists "public"."idx_api_sync_skipped_records_created_at";

drop index if exists "public"."idx_arketa_classes_staging_class_date";

drop index if exists "public"."idx_arketa_classes_staging_sync_batch_id";

drop index if exists "public"."idx_daily_schedule_class_id";

drop index if exists "public"."idx_daily_schedule_date";

drop table if exists "public"."api_sync_skipped_records";

drop table if exists "public"."daily_schedule";


  create table "public"."announcement_reads" (
    "id" uuid not null default gen_random_uuid(),
    "announcement_id" uuid not null,
    "user_id" uuid not null,
    "read_at" timestamp with time zone not null default now()
      );


alter table "public"."announcement_reads" enable row level security;


  create table "public"."announcements" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "content" text not null,
    "target_roles" public.app_role[] not null,
    "created_by" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."announcements" enable row level security;


  create table "public"."daily_schedules" (
    "id" uuid not null default gen_random_uuid(),
    "schedule_date" date not null,
    "sling_user_id" integer not null,
    "staff_id" uuid,
    "staff_name" text,
    "position" text,
    "shift_start" timestamp with time zone not null,
    "shift_end" timestamp with time zone not null,
    "location" text,
    "is_currently_working" boolean default false,
    "last_synced_at" timestamp with time zone default now()
      );


alter table "public"."daily_schedules" enable row level security;

alter table "public"."arketa_classes" drop column "description";

alter table "public"."arketa_classes" drop column "updated_at";

alter table "public"."arketa_classes_staging" drop column "booked_count";

alter table "public"."arketa_classes_staging" drop column "class_date";

alter table "public"."arketa_classes_staging" drop column "duration_minutes";

alter table "public"."arketa_classes_staging" drop column "external_id";

alter table "public"."arketa_classes_staging" drop column "is_cancelled";

alter table "public"."arketa_classes_staging" drop column "name";

alter table "public"."arketa_classes_staging" drop column "room_name";

alter table "public"."arketa_classes_staging" drop column "synced_at";

alter table "public"."arketa_classes_staging" drop column "waitlist_count";

alter table "public"."arketa_classes_staging" add column "arketa_class_id" text not null;

alter table "public"."arketa_classes_staging" add column "class_name" text not null;

alter table "public"."arketa_classes_staging" add column "cursor_position" text;

alter table "public"."arketa_classes_staging" add column "end_time" timestamp with time zone;

alter table "public"."arketa_classes_staging" add column "enrolled" integer;

alter table "public"."arketa_classes_staging" add column "instructor_id" text;

alter table "public"."arketa_classes_staging" add column "location" text;

alter table "public"."arketa_classes_staging" add column "signups" integer default 0;

alter table "public"."staff_announcements" alter column "announcement_type" set default 'alert'::text;

alter table "public"."staff_announcements" alter column "announcement_type" set data type text using "announcement_type"::text;

drop type "public"."staff_announcement_type";

CREATE UNIQUE INDEX announcement_reads_announcement_id_user_id_key ON public.announcement_reads USING btree (announcement_id, user_id);

CREATE UNIQUE INDEX announcement_reads_pkey ON public.announcement_reads USING btree (id);

CREATE UNIQUE INDEX announcements_pkey ON public.announcements USING btree (id);

CREATE UNIQUE INDEX arketa_classes_external_id_key ON public.arketa_classes USING btree (external_id);

CREATE UNIQUE INDEX arketa_classes_staging_arketa_class_id_sync_batch_id_key ON public.arketa_classes_staging USING btree (arketa_class_id, sync_batch_id);

CREATE UNIQUE INDEX daily_schedules_pkey ON public.daily_schedules USING btree (id);

CREATE UNIQUE INDEX daily_schedules_schedule_date_sling_user_id_shift_start_key ON public.daily_schedules USING btree (schedule_date, sling_user_id, shift_start);

CREATE INDEX idx_arketa_classes_staging_batch ON public.arketa_classes_staging USING btree (sync_batch_id);

CREATE INDEX idx_arketa_classes_staging_time ON public.arketa_classes_staging USING btree (start_time);

CREATE INDEX idx_classes_staging_batch ON public.arketa_classes_staging USING btree (sync_batch_id);

CREATE INDEX idx_daily_schedules_date ON public.daily_schedules USING btree (schedule_date);

CREATE INDEX idx_daily_schedules_user ON public.daily_schedules USING btree (sling_user_id);

alter table "public"."announcement_reads" add constraint "announcement_reads_pkey" PRIMARY KEY using index "announcement_reads_pkey";

alter table "public"."announcements" add constraint "announcements_pkey" PRIMARY KEY using index "announcements_pkey";

alter table "public"."daily_schedules" add constraint "daily_schedules_pkey" PRIMARY KEY using index "daily_schedules_pkey";

alter table "public"."announcement_reads" add constraint "announcement_reads_announcement_id_fkey" FOREIGN KEY (announcement_id) REFERENCES public.announcements(id) ON DELETE CASCADE not valid;

alter table "public"."announcement_reads" validate constraint "announcement_reads_announcement_id_fkey";

alter table "public"."announcement_reads" add constraint "announcement_reads_announcement_id_user_id_key" UNIQUE using index "announcement_reads_announcement_id_user_id_key";

alter table "public"."arketa_classes" add constraint "arketa_classes_external_id_key" UNIQUE using index "arketa_classes_external_id_key";

alter table "public"."arketa_classes_staging" add constraint "arketa_classes_staging_arketa_class_id_sync_batch_id_key" UNIQUE using index "arketa_classes_staging_arketa_class_id_sync_batch_id_key";

alter table "public"."daily_schedules" add constraint "daily_schedules_schedule_date_sling_user_id_shift_start_key" UNIQUE using index "daily_schedules_schedule_date_sling_user_id_shift_start_key";

create or replace view "public"."arketa_orphan_classes" as  SELECT c.id,
    c.external_id AS class_id,
    c.name AS class_name,
    c.class_date,
    c.start_time,
    c.booked_count,
    c.is_cancelled
   FROM (public.arketa_classes c
     LEFT JOIN ( SELECT arketa_reservations_history.class_id,
            count(*) AS reservation_count
           FROM public.arketa_reservations_history
          GROUP BY arketa_reservations_history.class_id) r ON ((c.external_id = r.class_id)))
  WHERE ((r.reservation_count IS NULL) OR (r.reservation_count = 0));


grant delete on table "public"."announcement_reads" to "anon";

grant insert on table "public"."announcement_reads" to "anon";

grant references on table "public"."announcement_reads" to "anon";

grant select on table "public"."announcement_reads" to "anon";

grant trigger on table "public"."announcement_reads" to "anon";

grant truncate on table "public"."announcement_reads" to "anon";

grant update on table "public"."announcement_reads" to "anon";

grant delete on table "public"."announcement_reads" to "authenticated";

grant insert on table "public"."announcement_reads" to "authenticated";

grant references on table "public"."announcement_reads" to "authenticated";

grant select on table "public"."announcement_reads" to "authenticated";

grant trigger on table "public"."announcement_reads" to "authenticated";

grant truncate on table "public"."announcement_reads" to "authenticated";

grant update on table "public"."announcement_reads" to "authenticated";

grant delete on table "public"."announcement_reads" to "service_role";

grant insert on table "public"."announcement_reads" to "service_role";

grant references on table "public"."announcement_reads" to "service_role";

grant select on table "public"."announcement_reads" to "service_role";

grant trigger on table "public"."announcement_reads" to "service_role";

grant truncate on table "public"."announcement_reads" to "service_role";

grant update on table "public"."announcement_reads" to "service_role";

grant delete on table "public"."announcements" to "anon";

grant insert on table "public"."announcements" to "anon";

grant references on table "public"."announcements" to "anon";

grant select on table "public"."announcements" to "anon";

grant trigger on table "public"."announcements" to "anon";

grant truncate on table "public"."announcements" to "anon";

grant update on table "public"."announcements" to "anon";

grant delete on table "public"."announcements" to "authenticated";

grant insert on table "public"."announcements" to "authenticated";

grant references on table "public"."announcements" to "authenticated";

grant select on table "public"."announcements" to "authenticated";

grant trigger on table "public"."announcements" to "authenticated";

grant truncate on table "public"."announcements" to "authenticated";

grant update on table "public"."announcements" to "authenticated";

grant delete on table "public"."announcements" to "service_role";

grant insert on table "public"."announcements" to "service_role";

grant references on table "public"."announcements" to "service_role";

grant select on table "public"."announcements" to "service_role";

grant trigger on table "public"."announcements" to "service_role";

grant truncate on table "public"."announcements" to "service_role";

grant update on table "public"."announcements" to "service_role";

grant delete on table "public"."daily_schedules" to "anon";

grant insert on table "public"."daily_schedules" to "anon";

grant references on table "public"."daily_schedules" to "anon";

grant select on table "public"."daily_schedules" to "anon";

grant trigger on table "public"."daily_schedules" to "anon";

grant truncate on table "public"."daily_schedules" to "anon";

grant update on table "public"."daily_schedules" to "anon";

grant delete on table "public"."daily_schedules" to "authenticated";

grant insert on table "public"."daily_schedules" to "authenticated";

grant references on table "public"."daily_schedules" to "authenticated";

grant select on table "public"."daily_schedules" to "authenticated";

grant trigger on table "public"."daily_schedules" to "authenticated";

grant truncate on table "public"."daily_schedules" to "authenticated";

grant update on table "public"."daily_schedules" to "authenticated";

grant delete on table "public"."daily_schedules" to "service_role";

grant insert on table "public"."daily_schedules" to "service_role";

grant references on table "public"."daily_schedules" to "service_role";

grant select on table "public"."daily_schedules" to "service_role";

grant trigger on table "public"."daily_schedules" to "service_role";

grant truncate on table "public"."daily_schedules" to "service_role";

grant update on table "public"."daily_schedules" to "service_role";


  create policy "Users can delete their own read status"
  on "public"."announcement_reads"
  as permissive
  for delete
  to public
using ((user_id = auth.uid()));



  create policy "Users can mark announcements as read"
  on "public"."announcement_reads"
  as permissive
  for insert
  to public
with check ((user_id = auth.uid()));



  create policy "Users can view their own read status"
  on "public"."announcement_reads"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "Creators can delete their announcements"
  on "public"."announcements"
  as permissive
  for delete
  to public
using (((created_by = auth.uid()) AND public.is_manager_or_admin(auth.uid())));



  create policy "Creators can update their announcements"
  on "public"."announcements"
  as permissive
  for update
  to public
using (((created_by = auth.uid()) AND public.is_manager_or_admin(auth.uid())));



  create policy "Managers can create announcements"
  on "public"."announcements"
  as permissive
  for insert
  to public
with check ((public.is_manager_or_admin(auth.uid()) AND (created_by = auth.uid())));



  create policy "Users can view announcements for their roles"
  on "public"."announcements"
  as permissive
  for select
  to public
using ((public.is_manager_or_admin(auth.uid()) OR public.user_has_any_role(auth.uid(), target_roles)));



  create policy "Concierges can view daily_schedules"
  on "public"."daily_schedules"
  as permissive
  for select
  to public
using (public.user_has_role(auth.uid(), 'concierge'::public.app_role));



  create policy "Managers can manage daily_schedules"
  on "public"."daily_schedules"
  as permissive
  for all
  to public
using (public.is_manager_or_admin(auth.uid()));


CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


