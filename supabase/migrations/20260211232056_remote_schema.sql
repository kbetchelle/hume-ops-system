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

-- Conditional drop constraint for arketa_classes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'arketa_classes_external_id_class_date_key'
  ) THEN
    alter table "public"."arketa_classes" drop constraint "arketa_classes_external_id_class_date_key";
  END IF;
END $$;

-- Conditional drop constraint for daily_schedule
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'daily_schedule'
  ) AND EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'daily_schedule_schedule_date_class_id_key'
  ) THEN
    alter table "public"."daily_schedule" drop constraint "daily_schedule_schedule_date_class_id_key";
  END IF;
END $$;

drop function if exists "public"."auto_mark_old_announcements_read"();

drop function if exists "public"."refresh_daily_schedule"(p_schedule_date date);

drop function if exists "public"."refresh_daily_schedule_on_reservations_delete"();

drop function if exists "public"."refresh_daily_schedule_on_reservations_insert"();

drop function if exists "public"."refresh_daily_schedule_on_reservations_update"();

drop function if exists "public"."upsert_arketa_classes_from_staging"(p_sync_batch_id uuid);

drop view if exists "public"."arketa_orphan_classes";

-- Conditional drop constraint for api_sync_skipped_records primary key
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'api_sync_skipped_records'
  ) AND EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'api_sync_skipped_records_pkey'
  ) THEN
    alter table "public"."api_sync_skipped_records" drop constraint "api_sync_skipped_records_pkey";
  END IF;
END $$;

-- Conditional drop constraint for daily_schedule primary key
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'daily_schedule'
  ) AND EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'daily_schedule_pkey'
  ) THEN
    alter table "public"."daily_schedule" drop constraint "daily_schedule_pkey";
  END IF;
END $$;

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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'announcement_reads'
  ) THEN
    CREATE TABLE "public"."announcement_reads" (
    "id" uuid not null default gen_random_uuid(),
    "announcement_id" uuid not null,
    "user_id" uuid not null,
    "read_at" timestamp with time zone not null default now()
      );
  END IF;
END $$;

alter table "public"."announcement_reads" enable row level security;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'announcements'
  ) THEN
    CREATE TABLE "public"."announcements" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "content" text not null,
    "target_roles" public.app_role[] not null,
    "created_by" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );
  END IF;
END $$;

alter table "public"."announcements" enable row level security;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'daily_schedules'
  ) THEN
    CREATE TABLE "public"."daily_schedules" (
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
  END IF;
END $$;

alter table "public"."daily_schedules" enable row level security;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'arketa_classes' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE "public"."arketa_classes" DROP COLUMN "description";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'arketa_classes' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE "public"."arketa_classes" DROP COLUMN "updated_at";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'arketa_classes_staging' 
    AND column_name = 'booked_count'
  ) THEN
    ALTER TABLE "public"."arketa_classes_staging" DROP COLUMN "booked_count";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'arketa_classes_staging' 
    AND column_name = 'class_date'
  ) THEN
    ALTER TABLE "public"."arketa_classes_staging" DROP COLUMN "class_date";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'arketa_classes_staging' 
    AND column_name = 'duration_minutes'
  ) THEN
    ALTER TABLE "public"."arketa_classes_staging" DROP COLUMN "duration_minutes";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'arketa_classes_staging' 
    AND column_name = 'external_id'
  ) THEN
    ALTER TABLE "public"."arketa_classes_staging" DROP COLUMN "external_id";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'arketa_classes_staging' 
    AND column_name = 'is_cancelled'
  ) THEN
    ALTER TABLE "public"."arketa_classes_staging" DROP COLUMN "is_cancelled";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'arketa_classes_staging' 
    AND column_name = 'name'
  ) THEN
    ALTER TABLE "public"."arketa_classes_staging" DROP COLUMN "name";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'arketa_classes_staging' 
    AND column_name = 'room_name'
  ) THEN
    ALTER TABLE "public"."arketa_classes_staging" DROP COLUMN "room_name";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'arketa_classes_staging' 
    AND column_name = 'synced_at'
  ) THEN
    ALTER TABLE "public"."arketa_classes_staging" DROP COLUMN "synced_at";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'arketa_classes_staging' 
    AND column_name = 'waitlist_count'
  ) THEN
    ALTER TABLE "public"."arketa_classes_staging" DROP COLUMN "waitlist_count";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'arketa_classes_staging' 
    AND column_name = 'arketa_class_id'
  ) THEN
    ALTER TABLE "public"."arketa_classes_staging" ADD COLUMN "arketa_class_id" text not null;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'arketa_classes_staging' 
    AND column_name = 'class_name'
  ) THEN
    ALTER TABLE "public"."arketa_classes_staging" ADD COLUMN "class_name" text not null;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'arketa_classes_staging' 
    AND column_name = 'cursor_position'
  ) THEN
    ALTER TABLE "public"."arketa_classes_staging" ADD COLUMN "cursor_position" text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'arketa_classes_staging' 
    AND column_name = 'end_time'
  ) THEN
    ALTER TABLE "public"."arketa_classes_staging" ADD COLUMN "end_time" timestamp with time zone;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'arketa_classes_staging' 
    AND column_name = 'enrolled'
  ) THEN
    ALTER TABLE "public"."arketa_classes_staging" ADD COLUMN "enrolled" integer;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'arketa_classes_staging' 
    AND column_name = 'instructor_id'
  ) THEN
    ALTER TABLE "public"."arketa_classes_staging" ADD COLUMN "instructor_id" text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'arketa_classes_staging' 
    AND column_name = 'location'
  ) THEN
    ALTER TABLE "public"."arketa_classes_staging" ADD COLUMN "location" text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'arketa_classes_staging' 
    AND column_name = 'signups'
  ) THEN
    ALTER TABLE "public"."arketa_classes_staging" ADD COLUMN "signups" integer default 0;
  END IF;
END $$;

alter table "public"."staff_announcements" alter column "announcement_type" set default 'alert'::text;

alter table "public"."staff_announcements" alter column "announcement_type" set data type text using "announcement_type"::text;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'staff_announcement_type'
    AND n.nspname = 'public'
  ) THEN
    DROP TYPE "public"."staff_announcement_type";
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS announcement_reads_announcement_id_user_id_key ON public.announcement_reads USING btree (announcement_id, user_id);

CREATE UNIQUE INDEX IF NOT EXISTS announcement_reads_pkey ON public.announcement_reads USING btree (id);

CREATE UNIQUE INDEX IF NOT EXISTS announcements_pkey ON public.announcements USING btree (id);

CREATE UNIQUE INDEX IF NOT EXISTS arketa_classes_external_id_key ON public.arketa_classes USING btree (external_id);

CREATE UNIQUE INDEX IF NOT EXISTS arketa_classes_staging_arketa_class_id_sync_batch_id_key ON public.arketa_classes_staging USING btree (arketa_class_id, sync_batch_id);

CREATE UNIQUE INDEX IF NOT EXISTS daily_schedules_pkey ON public.daily_schedules USING btree (id);

CREATE UNIQUE INDEX IF NOT EXISTS daily_schedules_schedule_date_sling_user_id_shift_start_key ON public.daily_schedules USING btree (schedule_date, sling_user_id, shift_start);

CREATE INDEX IF NOT EXISTS idx_arketa_classes_staging_batch ON public.arketa_classes_staging USING btree (sync_batch_id);

CREATE INDEX IF NOT EXISTS idx_arketa_classes_staging_time ON public.arketa_classes_staging USING btree (start_time);

CREATE INDEX IF NOT EXISTS idx_classes_staging_batch ON public.arketa_classes_staging USING btree (sync_batch_id);

CREATE INDEX IF NOT EXISTS idx_daily_schedules_date ON public.daily_schedules USING btree (schedule_date);

CREATE INDEX IF NOT EXISTS idx_daily_schedules_user ON public.daily_schedules USING btree (sling_user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'announcement_reads_pkey'
  ) THEN
    ALTER TABLE "public"."announcement_reads" ADD CONSTRAINT "announcement_reads_pkey" PRIMARY KEY USING INDEX "announcement_reads_pkey";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'announcements_pkey'
  ) THEN
    ALTER TABLE "public"."announcements" ADD CONSTRAINT "announcements_pkey" PRIMARY KEY USING INDEX "announcements_pkey";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'daily_schedules_pkey'
  ) THEN
    ALTER TABLE "public"."daily_schedules" ADD CONSTRAINT "daily_schedules_pkey" PRIMARY KEY USING INDEX "daily_schedules_pkey";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'announcement_reads_announcement_id_fkey'
  ) THEN
    ALTER TABLE "public"."announcement_reads" ADD CONSTRAINT "announcement_reads_announcement_id_fkey" FOREIGN KEY (announcement_id) REFERENCES public.announcements(id) ON DELETE CASCADE not valid;
    ALTER TABLE "public"."announcement_reads" VALIDATE CONSTRAINT "announcement_reads_announcement_id_fkey";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'announcement_reads_announcement_id_user_id_key'
  ) THEN
    ALTER TABLE "public"."announcement_reads" ADD CONSTRAINT "announcement_reads_announcement_id_user_id_key" UNIQUE using index "announcement_reads_announcement_id_user_id_key";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'arketa_classes_external_id_key'
  ) THEN
    ALTER TABLE "public"."arketa_classes" ADD CONSTRAINT "arketa_classes_external_id_key" UNIQUE using index "arketa_classes_external_id_key";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'arketa_classes_staging_arketa_class_id_sync_batch_id_key'
  ) THEN
    ALTER TABLE "public"."arketa_classes_staging" ADD CONSTRAINT "arketa_classes_staging_arketa_class_id_sync_batch_id_key" UNIQUE using index "arketa_classes_staging_arketa_class_id_sync_batch_id_key";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'daily_schedules_schedule_date_sling_user_id_shift_start_key'
  ) THEN
    ALTER TABLE "public"."daily_schedules" ADD CONSTRAINT "daily_schedules_schedule_date_sling_user_id_shift_start_key" UNIQUE using index "daily_schedules_schedule_date_sling_user_id_shift_start_key";
  END IF;
END $$;

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


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'announcement_reads'
    AND policyname = 'Users can delete their own read status'
  ) THEN
    CREATE POLICY "Users can delete their own read status"
    ON "public"."announcement_reads"
    as permissive
    for delete
    to public
    using ((user_id = auth.uid()));
  END IF;
END $$;



DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'announcement_reads'
    AND policyname = 'Users can mark announcements as read'
  ) THEN
    CREATE POLICY "Users can mark announcements as read"
    ON "public"."announcement_reads"
    as permissive
    for insert
    to public
    with check ((user_id = auth.uid()));
  END IF;
END $$;



DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'announcement_reads'
    AND policyname = 'Users can view their own read status'
  ) THEN
    CREATE POLICY "Users can view their own read status"
    ON "public"."announcement_reads"
    as permissive
    for select
    to public
    using ((user_id = auth.uid()));
  END IF;
END $$;



DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'announcements'
    AND policyname = 'Creators can delete their announcements'
  ) THEN
    CREATE POLICY "Creators can delete their announcements"
    ON "public"."announcements"
    as permissive
    for delete
    to public
    using (((created_by = auth.uid()) AND public.is_manager_or_admin(auth.uid())));
  END IF;
END $$;



DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'announcements'
    AND policyname = 'Creators can update their announcements'
  ) THEN
    CREATE POLICY "Creators can update their announcements"
    ON "public"."announcements"
    as permissive
    for update
    to public
    using (((created_by = auth.uid()) AND public.is_manager_or_admin(auth.uid())));
  END IF;
END $$;



DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'announcements'
    AND policyname = 'Managers can create announcements'
  ) THEN
    CREATE POLICY "Managers can create announcements"
    ON "public"."announcements"
    as permissive
    for insert
    to public
    with check ((public.is_manager_or_admin(auth.uid()) AND (created_by = auth.uid())));
  END IF;
END $$;



DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'announcements'
    AND policyname = 'Users can view announcements for their roles'
  ) THEN
    CREATE POLICY "Users can view announcements for their roles"
    ON "public"."announcements"
    as permissive
    for select
    to public
    using ((public.is_manager_or_admin(auth.uid()) OR public.user_has_any_role(auth.uid(), target_roles)));
  END IF;
END $$;



DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'daily_schedules'
    AND policyname = 'Concierges can view daily_schedules'
  ) THEN
    CREATE POLICY "Concierges can view daily_schedules"
    ON "public"."daily_schedules"
    as permissive
    for select
    to public
    using (public.user_has_role(auth.uid(), 'concierge'::public.app_role));
  END IF;
END $$;



DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'daily_schedules'
    AND policyname = 'Managers can manage daily_schedules'
  ) THEN
    CREATE POLICY "Managers can manage daily_schedules"
    ON "public"."daily_schedules"
    as permissive
    for all
    to public
    using (public.is_manager_or_admin(auth.uid()));
  END IF;
END $$;


CREATE OR REPLACE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'protect_delete'
  ) THEN
    DROP TRIGGER IF EXISTS protect_buckets_delete ON storage.buckets;
    CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();
    
    DROP TRIGGER IF EXISTS protect_objects_delete ON storage.objects;
    CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();
  END IF;
END $$;

