drop extension if exists "pg_net";

drop trigger if exists "update_arketa_classes_updated_at" on "public"."arketa_classes";

drop trigger if exists "trigger_refresh_daily_schedule_on_reservations_delete" on "public"."arketa_reservations_history";

drop trigger if exists "trigger_refresh_daily_schedule_on_reservations_insert" on "public"."arketa_reservations_history";

drop trigger if exists "trigger_refresh_daily_schedule_on_reservations_update" on "public"."arketa_reservations_history";

drop trigger if exists "update_daily_schedule_updated_at" on "public"."daily_schedule";

drop trigger if exists "trigger_auto_match_sling_user" on "public"."profiles";

drop policy "Managers can view api_sync_skipped_records" on "public"."api_sync_skipped_records";

drop policy "Concierges can view daily_schedule" on "public"."daily_schedule";

drop policy "Managers can manage daily_schedule" on "public"."daily_schedule";

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

revoke delete on table "public"."checklist_migrations_log" from "anon";

revoke insert on table "public"."checklist_migrations_log" from "anon";

revoke references on table "public"."checklist_migrations_log" from "anon";

revoke select on table "public"."checklist_migrations_log" from "anon";

revoke trigger on table "public"."checklist_migrations_log" from "anon";

revoke truncate on table "public"."checklist_migrations_log" from "anon";

revoke update on table "public"."checklist_migrations_log" from "anon";

revoke delete on table "public"."checklist_migrations_log" from "authenticated";

revoke insert on table "public"."checklist_migrations_log" from "authenticated";

revoke references on table "public"."checklist_migrations_log" from "authenticated";

revoke select on table "public"."checklist_migrations_log" from "authenticated";

revoke trigger on table "public"."checklist_migrations_log" from "authenticated";

revoke truncate on table "public"."checklist_migrations_log" from "authenticated";

revoke update on table "public"."checklist_migrations_log" from "authenticated";

revoke delete on table "public"."checklist_migrations_log" from "service_role";

revoke insert on table "public"."checklist_migrations_log" from "service_role";

revoke references on table "public"."checklist_migrations_log" from "service_role";

revoke select on table "public"."checklist_migrations_log" from "service_role";

revoke trigger on table "public"."checklist_migrations_log" from "service_role";

revoke truncate on table "public"."checklist_migrations_log" from "service_role";

revoke update on table "public"."checklist_migrations_log" from "service_role";

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

alter table "public"."arketa_classes" drop constraint "arketa_classes_external_id_class_date_key";

alter table "public"."daily_schedule" drop constraint "daily_schedule_schedule_date_class_id_key";

alter table "public"."profiles" drop constraint "profiles_sling_id_fkey";

alter table "public"."toast_sales" drop constraint "toast_sales_order_guid_key";

alter table "public"."toast_staging" drop constraint "toast_staging_order_guid_key";

alter table "public"."backfill_jobs" drop constraint "valid_api_source";

drop function if exists "public"."admin_get_users_with_sling_info"();

drop function if exists "public"."admin_link_user_to_sling"(_user_id uuid, _sling_id uuid);

drop function if exists "public"."auto_match_sling_user"();

drop function if exists "public"."refresh_daily_schedule"(p_schedule_date date);

drop function if exists "public"."refresh_daily_schedule_on_reservations_delete"();

drop function if exists "public"."refresh_daily_schedule_on_reservations_insert"();

drop function if exists "public"."refresh_daily_schedule_on_reservations_update"();

drop function if exists "public"."search_sling_users"(_search text);

drop function if exists "public"."upsert_arketa_classes_from_staging"(p_sync_batch_id uuid);

drop view if exists "public"."arketa_orphan_classes";

alter table "public"."api_sync_skipped_records" drop constraint "api_sync_skipped_records_pkey";

alter table "public"."checklist_migrations_log" drop constraint "checklist_migrations_log_pkey";

alter table "public"."daily_schedule" drop constraint "daily_schedules_pkey";

drop index if exists "public"."api_sync_skipped_records_pkey";

drop index if exists "public"."arketa_classes_external_id_class_date_key";

drop index if exists "public"."checklist_migrations_log_pkey";

drop index if exists "public"."daily_schedule_schedule_date_class_id_key";

drop index if exists "public"."idx_api_sync_skipped_records_api_name";

drop index if exists "public"."idx_api_sync_skipped_records_created_at";

drop index if exists "public"."idx_arketa_classes_staging_class_date";

drop index if exists "public"."idx_arketa_classes_staging_sync_batch_id";

drop index if exists "public"."idx_daily_schedule_class_id";

drop index if exists "public"."idx_daily_schedule_date";

drop index if exists "public"."idx_profiles_sling_id";

drop index if exists "public"."toast_sales_order_guid_key";

drop index if exists "public"."toast_staging_order_guid_key";

drop index if exists "public"."daily_schedules_pkey";

drop table "public"."api_sync_skipped_records";

drop table "public"."checklist_migrations_log";

drop table "public"."daily_schedule";


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


  create table "public"."celebratory_events" (
    "id" uuid not null default gen_random_uuid(),
    "member_name" text not null,
    "event_type" text not null,
    "event_date" date,
    "reported_date" date not null,
    "reported_by" text,
    "shift_type" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."celebratory_events" enable row level security;


  create table "public"."checklist_comments" (
    "id" uuid not null default gen_random_uuid(),
    "checklist_id" uuid,
    "item_id" uuid,
    "completion_id" uuid,
    "comment_text" text not null,
    "staff_name" text not null,
    "staff_id" uuid,
    "is_private" boolean default false,
    "created_at" timestamp with time zone default now(),
    "completion_date" date not null,
    "shift_time" text not null,
    "department_table" text
      );


alter table "public"."checklist_comments" enable row level security;


  create table "public"."checklist_template_completions" (
    "id" uuid not null default gen_random_uuid(),
    "item_id" uuid,
    "template_id" uuid,
    "completion_date" date not null,
    "completed_by_id" uuid,
    "completed_by" text,
    "completed_at" timestamp with time zone default now(),
    "deleted_at" timestamp with time zone,
    "shift_time" text default 'AM'::text,
    "photo_url" text,
    "note_text" text,
    "signature_data" text,
    "submitted_at" timestamp with time zone
      );


alter table "public"."checklist_template_completions" enable row level security;


  create table "public"."checklist_template_items" (
    "id" uuid not null default gen_random_uuid(),
    "template_id" uuid,
    "item_text" text not null,
    "sort_order" integer default 0,
    "is_required" boolean default false,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."checklist_template_items" enable row level security;


  create table "public"."concierge_drafts" (
    "id" uuid not null default gen_random_uuid(),
    "report_date" date not null,
    "shift_time" text not null,
    "form_data" jsonb not null default '{}'::jsonb,
    "last_updated_by" text,
    "last_updated_by_session" text,
    "version" integer not null default 1,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."concierge_drafts" enable row level security;


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


  create table "public"."facility_issues_tracker" (
    "id" uuid not null default gen_random_uuid(),
    "description" text not null,
    "photo_url" text,
    "reported_date" date not null,
    "reported_by" text,
    "shift_type" text,
    "status" text default 'open'::text,
    "resolved_at" timestamp with time zone,
    "resolved_by" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."facility_issues_tracker" enable row level security;


  create table "public"."foh_questions" (
    "id" uuid not null default gen_random_uuid(),
    "issue_type" text not null,
    "description" text not null,
    "photo_url" text,
    "reported_date" date not null,
    "reported_by" text,
    "shift_type" text,
    "resolved" boolean default false,
    "resolved_at" timestamp with time zone,
    "resolved_by" text,
    "resolution_notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."foh_questions" enable row level security;

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

alter table "public"."arketa_payments_staging" alter column "stripe_fees" set default 0;

alter table "public"."arketa_payments_staging" alter column "stripe_fees" set data type numeric(12,2) using "stripe_fees"::numeric(12,2);

alter table "public"."arketa_payments_staging" alter column "synced_at" drop default;

alter table "public"."arketa_payments_staging" alter column "tax" set default 0;

alter table "public"."arketa_payments_staging" alter column "tax" set data type numeric(12,2) using "tax"::numeric(12,2);

alter table "public"."arketa_payments_staging" alter column "total_refunded" set default 0;

alter table "public"."arketa_payments_staging" alter column "total_refunded" set data type numeric(12,2) using "total_refunded"::numeric(12,2);

alter table "public"."arketa_payments_staging" alter column "transaction_fees" set default 0;

alter table "public"."arketa_payments_staging" alter column "transaction_fees" set data type numeric(12,2) using "transaction_fees"::numeric(12,2);

alter table "public"."checklist_templates" add column "department" text;

alter table "public"."checklist_templates" add column "position" text;

alter table "public"."checklist_templates" alter column "role" drop not null;

alter table "public"."daily_report_history" add column "celebratory_events_na" boolean default false;

alter table "public"."daily_report_history" add column "future_shift_notes_na" boolean default false;

alter table "public"."daily_report_history" add column "screenshot" text;

alter table "public"."daily_report_history" add column "system_issues_na" boolean default false;

alter table "public"."profiles" drop column "sling_id";

alter table "public"."staff_announcements" alter column "announcement_type" set default 'alert'::text;

alter table "public"."staff_announcements" alter column "announcement_type" set data type text using "announcement_type"::text;

alter table "public"."toast_sales" drop column "order_count";

alter table "public"."toast_sales" drop column "order_guid";

alter table "public"."toast_staging" drop column "order_guid";

drop type "public"."staff_announcement_type";

CREATE UNIQUE INDEX announcement_reads_announcement_id_user_id_key ON public.announcement_reads USING btree (announcement_id, user_id);

CREATE UNIQUE INDEX announcement_reads_pkey ON public.announcement_reads USING btree (id);

CREATE UNIQUE INDEX announcements_pkey ON public.announcements USING btree (id);

CREATE UNIQUE INDEX arketa_classes_external_id_key ON public.arketa_classes USING btree (external_id);

CREATE UNIQUE INDEX arketa_classes_staging_arketa_class_id_sync_batch_id_key ON public.arketa_classes_staging USING btree (arketa_class_id, sync_batch_id);

CREATE UNIQUE INDEX celebratory_events_pkey ON public.celebratory_events USING btree (id);

CREATE UNIQUE INDEX checklist_comments_pkey ON public.checklist_comments USING btree (id);

CREATE UNIQUE INDEX checklist_template_completions_item_date_shift_key ON public.checklist_template_completions USING btree (item_id, completion_date, shift_time);

CREATE UNIQUE INDEX checklist_template_completions_pkey ON public.checklist_template_completions USING btree (id);

CREATE UNIQUE INDEX checklist_template_items_pkey ON public.checklist_template_items USING btree (id);

CREATE UNIQUE INDEX checklist_templates_dept_shift_pos_key ON public.checklist_templates USING btree (department, shift_time, "position");

CREATE UNIQUE INDEX concierge_drafts_pkey ON public.concierge_drafts USING btree (id);

CREATE UNIQUE INDEX concierge_drafts_report_date_shift_time_key ON public.concierge_drafts USING btree (report_date, shift_time);

CREATE UNIQUE INDEX daily_schedules_schedule_date_sling_user_id_shift_start_key ON public.daily_schedules USING btree (schedule_date, sling_user_id, shift_start);

CREATE UNIQUE INDEX facility_issues_tracker_pkey ON public.facility_issues_tracker USING btree (id);

CREATE UNIQUE INDEX foh_questions_pkey ON public.foh_questions USING btree (id);

CREATE INDEX idx_arketa_classes_staging_batch ON public.arketa_classes_staging USING btree (sync_batch_id);

CREATE INDEX idx_arketa_classes_staging_time ON public.arketa_classes_staging USING btree (start_time);

CREATE INDEX idx_celebratory_events_date ON public.celebratory_events USING btree (event_date);

CREATE INDEX idx_celebratory_events_reported ON public.celebratory_events USING btree (reported_date);

CREATE INDEX idx_classes_staging_batch ON public.arketa_classes_staging USING btree (sync_batch_id);

CREATE INDEX idx_comments_dept_shift ON public.checklist_comments USING btree (department_table, shift_time, completion_date);

CREATE INDEX idx_comments_dept_table ON public.checklist_comments USING btree (department_table, completion_date);

CREATE INDEX idx_completions_photo ON public.checklist_template_completions USING btree (photo_url) WHERE (photo_url IS NOT NULL);

CREATE INDEX idx_completions_shift ON public.checklist_template_completions USING btree (shift_time);

CREATE INDEX idx_completions_submitted ON public.checklist_template_completions USING btree (submitted_at);

CREATE INDEX idx_concierge_drafts_date_shift ON public.concierge_drafts USING btree (report_date, shift_time);

CREATE INDEX idx_concierge_drafts_updated ON public.concierge_drafts USING btree (updated_at DESC);

CREATE INDEX idx_daily_report_history_status ON public.daily_report_history USING btree (status);

CREATE INDEX idx_daily_schedules_date ON public.daily_schedules USING btree (schedule_date);

CREATE INDEX idx_daily_schedules_user ON public.daily_schedules USING btree (sling_user_id);

CREATE INDEX idx_deletion_queue_processed ON public.storage_deletion_queue USING btree (processed_at) WHERE (processed_at IS NOT NULL);

CREATE INDEX idx_facility_issues_date ON public.facility_issues_tracker USING btree (reported_date DESC);

CREATE UNIQUE INDEX idx_facility_issues_dedup ON public.facility_issues_tracker USING btree (description, reported_date) WHERE (status = ANY (ARRAY['open'::text, 'in_progress'::text]));

CREATE INDEX idx_facility_issues_status ON public.facility_issues_tracker USING btree (status);

CREATE INDEX idx_foh_questions_date ON public.foh_questions USING btree (reported_date DESC);

CREATE INDEX idx_foh_questions_resolved ON public.foh_questions USING btree (resolved);

CREATE INDEX idx_foh_questions_type ON public.foh_questions USING btree (issue_type);

CREATE UNIQUE INDEX toast_sales_business_date_key ON public.toast_sales USING btree (business_date);

CREATE UNIQUE INDEX toast_staging_business_date_sync_batch_id_key ON public.toast_staging USING btree (business_date, sync_batch_id);

CREATE UNIQUE INDEX daily_schedules_pkey ON public.daily_schedules USING btree (id);

alter table "public"."announcement_reads" add constraint "announcement_reads_pkey" PRIMARY KEY using index "announcement_reads_pkey";

alter table "public"."announcements" add constraint "announcements_pkey" PRIMARY KEY using index "announcements_pkey";

alter table "public"."celebratory_events" add constraint "celebratory_events_pkey" PRIMARY KEY using index "celebratory_events_pkey";

alter table "public"."checklist_comments" add constraint "checklist_comments_pkey" PRIMARY KEY using index "checklist_comments_pkey";

alter table "public"."checklist_template_completions" add constraint "checklist_template_completions_pkey" PRIMARY KEY using index "checklist_template_completions_pkey";

alter table "public"."checklist_template_items" add constraint "checklist_template_items_pkey" PRIMARY KEY using index "checklist_template_items_pkey";

alter table "public"."concierge_drafts" add constraint "concierge_drafts_pkey" PRIMARY KEY using index "concierge_drafts_pkey";

alter table "public"."daily_schedules" add constraint "daily_schedules_pkey" PRIMARY KEY using index "daily_schedules_pkey";

alter table "public"."facility_issues_tracker" add constraint "facility_issues_tracker_pkey" PRIMARY KEY using index "facility_issues_tracker_pkey";

alter table "public"."foh_questions" add constraint "foh_questions_pkey" PRIMARY KEY using index "foh_questions_pkey";

alter table "public"."announcement_reads" add constraint "announcement_reads_announcement_id_fkey" FOREIGN KEY (announcement_id) REFERENCES public.announcements(id) ON DELETE CASCADE not valid;

alter table "public"."announcement_reads" validate constraint "announcement_reads_announcement_id_fkey";

alter table "public"."announcement_reads" add constraint "announcement_reads_announcement_id_user_id_key" UNIQUE using index "announcement_reads_announcement_id_user_id_key";

alter table "public"."arketa_classes" add constraint "arketa_classes_external_id_key" UNIQUE using index "arketa_classes_external_id_key";

alter table "public"."arketa_classes_staging" add constraint "arketa_classes_staging_arketa_class_id_sync_batch_id_key" UNIQUE using index "arketa_classes_staging_arketa_class_id_sync_batch_id_key";

alter table "public"."celebratory_events" add constraint "celebratory_events_shift_type_check" CHECK ((shift_type = ANY (ARRAY['AM'::text, 'PM'::text]))) not valid;

alter table "public"."celebratory_events" validate constraint "celebratory_events_shift_type_check";

alter table "public"."checklist_comments" add constraint "checklist_comments_target_check" CHECK (((checklist_id IS NOT NULL) OR (item_id IS NOT NULL) OR (completion_id IS NOT NULL) OR (department_table IS NOT NULL))) not valid;

alter table "public"."checklist_comments" validate constraint "checklist_comments_target_check";

alter table "public"."checklist_template_completions" add constraint "checklist_template_completions_item_date_shift_key" UNIQUE using index "checklist_template_completions_item_date_shift_key";

alter table "public"."checklist_template_completions" add constraint "checklist_template_completions_item_id_fkey" FOREIGN KEY (item_id) REFERENCES public.checklist_template_items(id) ON DELETE CASCADE not valid;

alter table "public"."checklist_template_completions" validate constraint "checklist_template_completions_item_id_fkey";

alter table "public"."checklist_template_completions" add constraint "checklist_template_completions_template_id_fkey" FOREIGN KEY (template_id) REFERENCES public.checklist_templates(id) ON DELETE CASCADE not valid;

alter table "public"."checklist_template_completions" validate constraint "checklist_template_completions_template_id_fkey";

alter table "public"."checklist_template_items" add constraint "checklist_template_items_template_id_fkey" FOREIGN KEY (template_id) REFERENCES public.checklist_templates(id) ON DELETE CASCADE not valid;

alter table "public"."checklist_template_items" validate constraint "checklist_template_items_template_id_fkey";

alter table "public"."checklist_templates" add constraint "checklist_templates_dept_shift_pos_key" UNIQUE using index "checklist_templates_dept_shift_pos_key";

alter table "public"."concierge_drafts" add constraint "concierge_drafts_report_date_shift_time_key" UNIQUE using index "concierge_drafts_report_date_shift_time_key";

alter table "public"."concierge_drafts" add constraint "concierge_drafts_shift_time_check" CHECK ((shift_time = ANY (ARRAY['AM'::text, 'PM'::text]))) not valid;

alter table "public"."concierge_drafts" validate constraint "concierge_drafts_shift_time_check";

alter table "public"."daily_schedules" add constraint "daily_schedules_schedule_date_sling_user_id_shift_start_key" UNIQUE using index "daily_schedules_schedule_date_sling_user_id_shift_start_key";

alter table "public"."facility_issues_tracker" add constraint "facility_issues_tracker_shift_type_check" CHECK ((shift_type = ANY (ARRAY['AM'::text, 'PM'::text]))) not valid;

alter table "public"."facility_issues_tracker" validate constraint "facility_issues_tracker_shift_type_check";

alter table "public"."facility_issues_tracker" add constraint "facility_issues_tracker_status_check" CHECK ((status = ANY (ARRAY['open'::text, 'in_progress'::text, 'resolved'::text, 'closed'::text]))) not valid;

alter table "public"."facility_issues_tracker" validate constraint "facility_issues_tracker_status_check";

alter table "public"."foh_questions" add constraint "foh_questions_issue_type_check" CHECK ((issue_type = ANY (ARRAY['arketa'::text, 'jolt'::text, 'database'::text, 'question'::text, 'other'::text]))) not valid;

alter table "public"."foh_questions" validate constraint "foh_questions_issue_type_check";

alter table "public"."foh_questions" add constraint "foh_questions_shift_type_check" CHECK ((shift_type = ANY (ARRAY['AM'::text, 'PM'::text]))) not valid;

alter table "public"."foh_questions" validate constraint "foh_questions_shift_type_check";

alter table "public"."toast_sales" add constraint "toast_sales_business_date_key" UNIQUE using index "toast_sales_business_date_key";

alter table "public"."toast_staging" add constraint "toast_staging_business_date_sync_batch_id_key" UNIQUE using index "toast_staging_business_date_sync_batch_id_key";

alter table "public"."backfill_jobs" add constraint "valid_api_source" CHECK ((api_source = ANY (ARRAY['arketa'::text, 'sling'::text]))) not valid;

alter table "public"."backfill_jobs" validate constraint "valid_api_source";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.direct_upsert_reservation(p_external_id text, p_booking_id text, p_client_id text, p_client_email text, p_first_name text, p_last_name text, p_class_name text, p_class_time timestamp with time zone, p_status text, p_location_name text, p_data jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.arketa_reservations (
    external_id,
    booking_id,
    client_id,
    client_email,
    first_name,
    last_name,
    class_name,
    class_time,
    status,
    location_name,
    -- Additional fields from jsonb
    email_marketing_opt_in,
    date_purchased,
    purchase_id,
    reservation_type,
    class_id,
    instructor_name,
    location_address,
    checked_in,
    checked_in_at,
    purchase_type,
    gross_amount_paid,
    net_amount_paid,
    estimated_gross_revenue,
    estimated_net_revenue,
    coupon_code,
    package_name,
    package_period_start,
    package_period_end,
    offering_id,
    payment_method,
    payment_id,
    service_id,
    tags,
    experience_type,
    late_cancel,
    canceled_at,
    canceled_by,
    milestone
  )
  VALUES (
    p_external_id,
    p_booking_id,
    p_client_id,
    p_client_email,
    p_first_name,
    p_last_name,
    p_class_name,
    p_class_time,
    p_status,
    p_location_name,
    -- Extract from jsonb
    (p_data->>'email_marketing_opt_in')::text,
    (p_data->>'date_purchased')::timestamptz,
    (p_data->>'purchase_id')::text,
    (p_data->>'reservation_type')::text,
    (p_data->>'class_id')::text,
    (p_data->>'instructor_name')::text,
    (p_data->>'location_address')::text,
    (p_data->>'checked_in')::boolean,
    (p_data->>'checked_in_at')::timestamptz,
    (p_data->>'purchase_type')::text,
    (p_data->>'gross_amount_paid')::decimal,
    (p_data->>'net_amount_paid')::decimal,
    (p_data->>'estimated_gross_revenue')::decimal,
    (p_data->>'estimated_net_revenue')::decimal,
    (p_data->>'coupon_code')::text,
    (p_data->>'package_name')::text,
    (p_data->>'package_period_start')::timestamptz,
    (p_data->>'package_period_end')::timestamptz,
    (p_data->>'offering_id')::text,
    (p_data->>'payment_method')::text,
    (p_data->>'payment_id')::text,
    (p_data->>'service_id')::text,
    (p_data->'tags')::jsonb,
    (p_data->>'experience_type')::text,
    (p_data->>'late_cancel')::boolean,
    (p_data->>'canceled_at')::timestamptz,
    (p_data->>'canceled_by')::text,
    (p_data->>'milestone')::integer
  )
  ON CONFLICT (external_id) DO UPDATE SET
    booking_id = EXCLUDED.booking_id,
    client_id = EXCLUDED.client_id,
    client_email = EXCLUDED.client_email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    class_name = EXCLUDED.class_name,
    class_time = EXCLUDED.class_time,
    status = EXCLUDED.status,
    location_name = EXCLUDED.location_name,
    email_marketing_opt_in = EXCLUDED.email_marketing_opt_in,
    date_purchased = EXCLUDED.date_purchased,
    purchase_id = EXCLUDED.purchase_id,
    reservation_type = EXCLUDED.reservation_type,
    class_id = EXCLUDED.class_id,
    instructor_name = EXCLUDED.instructor_name,
    location_address = EXCLUDED.location_address,
    checked_in = EXCLUDED.checked_in,
    checked_in_at = EXCLUDED.checked_in_at,
    purchase_type = EXCLUDED.purchase_type,
    gross_amount_paid = EXCLUDED.gross_amount_paid,
    net_amount_paid = EXCLUDED.net_amount_paid,
    estimated_gross_revenue = EXCLUDED.estimated_gross_revenue,
    estimated_net_revenue = EXCLUDED.estimated_net_revenue,
    coupon_code = EXCLUDED.coupon_code,
    package_name = EXCLUDED.package_name,
    package_period_start = EXCLUDED.package_period_start,
    package_period_end = EXCLUDED.package_period_end,
    offering_id = EXCLUDED.offering_id,
    payment_method = EXCLUDED.payment_method,
    payment_id = EXCLUDED.payment_id,
    service_id = EXCLUDED.service_id,
    tags = EXCLUDED.tags,
    experience_type = EXCLUDED.experience_type,
    late_cancel = EXCLUDED.late_cancel,
    canceled_at = EXCLUDED.canceled_at,
    canceled_by = EXCLUDED.canceled_by,
    milestone = EXCLUDED.milestone,
    updated_at = NOW();
END;
$function$
;

CREATE OR REPLACE FUNCTION public.increment_draft_version()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.version = OLD.version + 1;
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

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

grant delete on table "public"."celebratory_events" to "anon";

grant insert on table "public"."celebratory_events" to "anon";

grant references on table "public"."celebratory_events" to "anon";

grant select on table "public"."celebratory_events" to "anon";

grant trigger on table "public"."celebratory_events" to "anon";

grant truncate on table "public"."celebratory_events" to "anon";

grant update on table "public"."celebratory_events" to "anon";

grant delete on table "public"."celebratory_events" to "authenticated";

grant insert on table "public"."celebratory_events" to "authenticated";

grant references on table "public"."celebratory_events" to "authenticated";

grant select on table "public"."celebratory_events" to "authenticated";

grant trigger on table "public"."celebratory_events" to "authenticated";

grant truncate on table "public"."celebratory_events" to "authenticated";

grant update on table "public"."celebratory_events" to "authenticated";

grant delete on table "public"."celebratory_events" to "service_role";

grant insert on table "public"."celebratory_events" to "service_role";

grant references on table "public"."celebratory_events" to "service_role";

grant select on table "public"."celebratory_events" to "service_role";

grant trigger on table "public"."celebratory_events" to "service_role";

grant truncate on table "public"."celebratory_events" to "service_role";

grant update on table "public"."celebratory_events" to "service_role";

grant delete on table "public"."checklist_comments" to "anon";

grant insert on table "public"."checklist_comments" to "anon";

grant references on table "public"."checklist_comments" to "anon";

grant select on table "public"."checklist_comments" to "anon";

grant trigger on table "public"."checklist_comments" to "anon";

grant truncate on table "public"."checklist_comments" to "anon";

grant update on table "public"."checklist_comments" to "anon";

grant delete on table "public"."checklist_comments" to "authenticated";

grant insert on table "public"."checklist_comments" to "authenticated";

grant references on table "public"."checklist_comments" to "authenticated";

grant select on table "public"."checklist_comments" to "authenticated";

grant trigger on table "public"."checklist_comments" to "authenticated";

grant truncate on table "public"."checklist_comments" to "authenticated";

grant update on table "public"."checklist_comments" to "authenticated";

grant delete on table "public"."checklist_comments" to "service_role";

grant insert on table "public"."checklist_comments" to "service_role";

grant references on table "public"."checklist_comments" to "service_role";

grant select on table "public"."checklist_comments" to "service_role";

grant trigger on table "public"."checklist_comments" to "service_role";

grant truncate on table "public"."checklist_comments" to "service_role";

grant update on table "public"."checklist_comments" to "service_role";

grant delete on table "public"."checklist_template_completions" to "anon";

grant insert on table "public"."checklist_template_completions" to "anon";

grant references on table "public"."checklist_template_completions" to "anon";

grant select on table "public"."checklist_template_completions" to "anon";

grant trigger on table "public"."checklist_template_completions" to "anon";

grant truncate on table "public"."checklist_template_completions" to "anon";

grant update on table "public"."checklist_template_completions" to "anon";

grant delete on table "public"."checklist_template_completions" to "authenticated";

grant insert on table "public"."checklist_template_completions" to "authenticated";

grant references on table "public"."checklist_template_completions" to "authenticated";

grant select on table "public"."checklist_template_completions" to "authenticated";

grant trigger on table "public"."checklist_template_completions" to "authenticated";

grant truncate on table "public"."checklist_template_completions" to "authenticated";

grant update on table "public"."checklist_template_completions" to "authenticated";

grant delete on table "public"."checklist_template_completions" to "service_role";

grant insert on table "public"."checklist_template_completions" to "service_role";

grant references on table "public"."checklist_template_completions" to "service_role";

grant select on table "public"."checklist_template_completions" to "service_role";

grant trigger on table "public"."checklist_template_completions" to "service_role";

grant truncate on table "public"."checklist_template_completions" to "service_role";

grant update on table "public"."checklist_template_completions" to "service_role";

grant delete on table "public"."checklist_template_items" to "anon";

grant insert on table "public"."checklist_template_items" to "anon";

grant references on table "public"."checklist_template_items" to "anon";

grant select on table "public"."checklist_template_items" to "anon";

grant trigger on table "public"."checklist_template_items" to "anon";

grant truncate on table "public"."checklist_template_items" to "anon";

grant update on table "public"."checklist_template_items" to "anon";

grant delete on table "public"."checklist_template_items" to "authenticated";

grant insert on table "public"."checklist_template_items" to "authenticated";

grant references on table "public"."checklist_template_items" to "authenticated";

grant select on table "public"."checklist_template_items" to "authenticated";

grant trigger on table "public"."checklist_template_items" to "authenticated";

grant truncate on table "public"."checklist_template_items" to "authenticated";

grant update on table "public"."checklist_template_items" to "authenticated";

grant delete on table "public"."checklist_template_items" to "service_role";

grant insert on table "public"."checklist_template_items" to "service_role";

grant references on table "public"."checklist_template_items" to "service_role";

grant select on table "public"."checklist_template_items" to "service_role";

grant trigger on table "public"."checklist_template_items" to "service_role";

grant truncate on table "public"."checklist_template_items" to "service_role";

grant update on table "public"."checklist_template_items" to "service_role";

grant delete on table "public"."concierge_drafts" to "anon";

grant insert on table "public"."concierge_drafts" to "anon";

grant references on table "public"."concierge_drafts" to "anon";

grant select on table "public"."concierge_drafts" to "anon";

grant trigger on table "public"."concierge_drafts" to "anon";

grant truncate on table "public"."concierge_drafts" to "anon";

grant update on table "public"."concierge_drafts" to "anon";

grant delete on table "public"."concierge_drafts" to "authenticated";

grant insert on table "public"."concierge_drafts" to "authenticated";

grant references on table "public"."concierge_drafts" to "authenticated";

grant select on table "public"."concierge_drafts" to "authenticated";

grant trigger on table "public"."concierge_drafts" to "authenticated";

grant truncate on table "public"."concierge_drafts" to "authenticated";

grant update on table "public"."concierge_drafts" to "authenticated";

grant delete on table "public"."concierge_drafts" to "service_role";

grant insert on table "public"."concierge_drafts" to "service_role";

grant references on table "public"."concierge_drafts" to "service_role";

grant select on table "public"."concierge_drafts" to "service_role";

grant trigger on table "public"."concierge_drafts" to "service_role";

grant truncate on table "public"."concierge_drafts" to "service_role";

grant update on table "public"."concierge_drafts" to "service_role";

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

grant delete on table "public"."facility_issues_tracker" to "anon";

grant insert on table "public"."facility_issues_tracker" to "anon";

grant references on table "public"."facility_issues_tracker" to "anon";

grant select on table "public"."facility_issues_tracker" to "anon";

grant trigger on table "public"."facility_issues_tracker" to "anon";

grant truncate on table "public"."facility_issues_tracker" to "anon";

grant update on table "public"."facility_issues_tracker" to "anon";

grant delete on table "public"."facility_issues_tracker" to "authenticated";

grant insert on table "public"."facility_issues_tracker" to "authenticated";

grant references on table "public"."facility_issues_tracker" to "authenticated";

grant select on table "public"."facility_issues_tracker" to "authenticated";

grant trigger on table "public"."facility_issues_tracker" to "authenticated";

grant truncate on table "public"."facility_issues_tracker" to "authenticated";

grant update on table "public"."facility_issues_tracker" to "authenticated";

grant delete on table "public"."facility_issues_tracker" to "service_role";

grant insert on table "public"."facility_issues_tracker" to "service_role";

grant references on table "public"."facility_issues_tracker" to "service_role";

grant select on table "public"."facility_issues_tracker" to "service_role";

grant trigger on table "public"."facility_issues_tracker" to "service_role";

grant truncate on table "public"."facility_issues_tracker" to "service_role";

grant update on table "public"."facility_issues_tracker" to "service_role";

grant delete on table "public"."foh_questions" to "anon";

grant insert on table "public"."foh_questions" to "anon";

grant references on table "public"."foh_questions" to "anon";

grant select on table "public"."foh_questions" to "anon";

grant trigger on table "public"."foh_questions" to "anon";

grant truncate on table "public"."foh_questions" to "anon";

grant update on table "public"."foh_questions" to "anon";

grant delete on table "public"."foh_questions" to "authenticated";

grant insert on table "public"."foh_questions" to "authenticated";

grant references on table "public"."foh_questions" to "authenticated";

grant select on table "public"."foh_questions" to "authenticated";

grant trigger on table "public"."foh_questions" to "authenticated";

grant truncate on table "public"."foh_questions" to "authenticated";

grant update on table "public"."foh_questions" to "authenticated";

grant delete on table "public"."foh_questions" to "service_role";

grant insert on table "public"."foh_questions" to "service_role";

grant references on table "public"."foh_questions" to "service_role";

grant select on table "public"."foh_questions" to "service_role";

grant trigger on table "public"."foh_questions" to "service_role";

grant truncate on table "public"."foh_questions" to "service_role";

grant update on table "public"."foh_questions" to "service_role";


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



  create policy "Concierges can create celebratory events"
  on "public"."celebratory_events"
  as permissive
  for insert
  to public
with check (public.user_has_role(auth.uid(), 'concierge'::public.app_role));



  create policy "Concierges can view celebratory events"
  on "public"."celebratory_events"
  as permissive
  for select
  to public
using (public.user_has_role(auth.uid(), 'concierge'::public.app_role));



  create policy "Managers can manage celebratory events"
  on "public"."celebratory_events"
  as permissive
  for all
  to public
using (public.is_manager_or_admin(auth.uid()));



  create policy "Managers and admins can delete comments"
  on "public"."checklist_comments"
  as permissive
  for delete
  to public
using (public.is_manager_or_admin(auth.uid()));



  create policy "Users can create comments"
  on "public"."checklist_comments"
  as permissive
  for insert
  to public
with check (((auth.uid() = staff_id) AND (auth.uid() IN ( SELECT user_roles.user_id
   FROM public.user_roles
  WHERE (user_roles.role = ANY (ARRAY['concierge'::public.app_role, 'floater'::public.app_role, 'male_spa_attendant'::public.app_role, 'female_spa_attendant'::public.app_role, 'cafe'::public.app_role, 'manager'::public.app_role, 'admin'::public.app_role]))))));



  create policy "Users can view non-private comments"
  on "public"."checklist_comments"
  as permissive
  for select
  to public
using (((NOT is_private) OR (auth.uid() IN ( SELECT user_roles.user_id
   FROM public.user_roles
  WHERE (user_roles.role = ANY (ARRAY['manager'::public.app_role, 'admin'::public.app_role]))))));



  create policy "Managers can manage all completions"
  on "public"."checklist_template_completions"
  as permissive
  for all
  to public
using (public.is_manager_or_admin(auth.uid()));



  create policy "Staff can create their own completions"
  on "public"."checklist_template_completions"
  as permissive
  for insert
  to public
with check ((completed_by_id = auth.uid()));



  create policy "Staff can update their own completions"
  on "public"."checklist_template_completions"
  as permissive
  for update
  to public
using ((completed_by_id = auth.uid()));



  create policy "Staff can view completions"
  on "public"."checklist_template_completions"
  as permissive
  for select
  to public
using ((auth.uid() IS NOT NULL));



  create policy "Managers can manage checklist template items"
  on "public"."checklist_template_items"
  as permissive
  for all
  to public
using (public.is_manager_or_admin(auth.uid()));



  create policy "Staff can view checklist template items"
  on "public"."checklist_template_items"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.checklist_templates ct
  WHERE ((ct.id = checklist_template_items.template_id) AND (ct.is_active = true)))));



  create policy "Concierges can delete drafts"
  on "public"."concierge_drafts"
  as permissive
  for delete
  to public
using (public.user_has_role(auth.uid(), 'concierge'::public.app_role));



  create policy "Concierges can insert drafts"
  on "public"."concierge_drafts"
  as permissive
  for insert
  to public
with check (public.user_has_role(auth.uid(), 'concierge'::public.app_role));



  create policy "Concierges can read drafts"
  on "public"."concierge_drafts"
  as permissive
  for select
  to public
using (public.user_has_role(auth.uid(), 'concierge'::public.app_role));



  create policy "Concierges can update drafts"
  on "public"."concierge_drafts"
  as permissive
  for update
  to public
using (public.user_has_role(auth.uid(), 'concierge'::public.app_role));



  create policy "Managers can manage all drafts"
  on "public"."concierge_drafts"
  as permissive
  for all
  to public
using (public.is_manager_or_admin(auth.uid()));



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



  create policy "Concierges can create facility issues"
  on "public"."facility_issues_tracker"
  as permissive
  for insert
  to public
with check (public.user_has_role(auth.uid(), 'concierge'::public.app_role));



  create policy "Concierges can view facility issues"
  on "public"."facility_issues_tracker"
  as permissive
  for select
  to public
using (public.user_has_role(auth.uid(), 'concierge'::public.app_role));



  create policy "Managers can manage facility issues"
  on "public"."facility_issues_tracker"
  as permissive
  for all
  to public
using (public.is_manager_or_admin(auth.uid()));



  create policy "Concierges can create FOH questions"
  on "public"."foh_questions"
  as permissive
  for insert
  to public
with check (public.user_has_role(auth.uid(), 'concierge'::public.app_role));



  create policy "Concierges can view FOH questions"
  on "public"."foh_questions"
  as permissive
  for select
  to public
using (public.user_has_role(auth.uid(), 'concierge'::public.app_role));



  create policy "Managers can manage FOH questions"
  on "public"."foh_questions"
  as permissive
  for all
  to public
using (public.is_manager_or_admin(auth.uid()));


CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_queue_photo_on_delete BEFORE DELETE ON public.checklist_template_completions FOR EACH ROW EXECUTE FUNCTION public.queue_photo_deletion();

CREATE TRIGGER increment_draft_version_trigger BEFORE UPDATE ON public.concierge_drafts FOR EACH ROW EXECUTE FUNCTION public.increment_draft_version();

CREATE TRIGGER update_facility_issues_updated_at BEFORE UPDATE ON public.facility_issues_tracker FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_foh_questions_updated_at BEFORE UPDATE ON public.foh_questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

drop policy "Authenticated users can upload checklist photos" on "storage"."objects";

drop policy "Authenticated users can view checklist photos" on "storage"."objects";

drop policy "Managers can delete checklist photos" on "storage"."objects";

drop policy "Users can update their own checklist photos" on "storage"."objects";

CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


