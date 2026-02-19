drop trigger if exists "update_arketa_classes_updated_at" on "public"."arketa_classes";

drop trigger if exists "trigger_refresh_daily_schedule_on_reservations_delete" on "public"."arketa_reservations_history";

drop trigger if exists "trigger_refresh_daily_schedule_on_reservations_insert" on "public"."arketa_reservations_history";

drop trigger if exists "trigger_refresh_daily_schedule_on_reservations_update" on "public"."arketa_reservations_history";

drop trigger if exists "update_daily_schedule_updated_at" on "public"."daily_schedule";

drop trigger if exists "update_resource_outdated_flags_updated_at" on "public"."resource_outdated_flags";

drop trigger if exists "update_resource_page_folders_updated_at" on "public"."resource_page_folders";

drop policy "Managers and admins can read all feedback" on "public"."ai_writer_feedback";

drop policy "Users can insert own feedback" on "public"."ai_writer_feedback";

drop policy "Users can read own feedback" on "public"."ai_writer_feedback";

drop policy "Authenticated users can read skipped records" on "public"."api_sync_skipped_records";

drop policy "Managers can view api_sync_skipped_records" on "public"."api_sync_skipped_records";

drop policy "Service role can insert skipped records" on "public"."api_sync_skipped_records";

drop policy "Concierges can view daily_schedule" on "public"."daily_schedule";

drop policy "Managers can manage daily_schedule" on "public"."daily_schedule";

drop policy "Users manage own inbox reads" on "public"."inbox_reads";

drop policy "authenticated_users_read_all_quick_link_groups" on "public"."quick_link_groups";

drop policy "authenticated_users_read_all_quick_link_items" on "public"."quick_link_items";

drop policy "Authenticated can create flags" on "public"."resource_outdated_flags";

drop policy "Authenticated can read flags" on "public"."resource_outdated_flags";

drop policy "Managers can delete flags" on "public"."resource_outdated_flags";

drop policy "Managers can update flags" on "public"."resource_outdated_flags";

drop policy "editors_manager_all" on "public"."resource_page_editors";

drop policy "editors_own_select" on "public"."resource_page_editors";

drop policy "folders_manager_all" on "public"."resource_page_folders";

drop policy "folders_staff_select" on "public"."resource_page_folders";

drop policy "reads_manager_select" on "public"."resource_page_reads";

drop policy "reads_own_insert" on "public"."resource_page_reads";

drop policy "reads_own_select" on "public"."resource_page_reads";

drop policy "authenticated_users_read_published_resource_pages" on "public"."resource_pages";

drop policy "resource_pages_editor_update" on "public"."resource_pages";

revoke delete on table "public"."ai_writer_feedback" from "anon";

revoke insert on table "public"."ai_writer_feedback" from "anon";

revoke references on table "public"."ai_writer_feedback" from "anon";

revoke select on table "public"."ai_writer_feedback" from "anon";

revoke trigger on table "public"."ai_writer_feedback" from "anon";

revoke truncate on table "public"."ai_writer_feedback" from "anon";

revoke update on table "public"."ai_writer_feedback" from "anon";

revoke delete on table "public"."ai_writer_feedback" from "authenticated";

revoke insert on table "public"."ai_writer_feedback" from "authenticated";

revoke references on table "public"."ai_writer_feedback" from "authenticated";

revoke select on table "public"."ai_writer_feedback" from "authenticated";

revoke trigger on table "public"."ai_writer_feedback" from "authenticated";

revoke truncate on table "public"."ai_writer_feedback" from "authenticated";

revoke update on table "public"."ai_writer_feedback" from "authenticated";

revoke delete on table "public"."ai_writer_feedback" from "service_role";

revoke insert on table "public"."ai_writer_feedback" from "service_role";

revoke references on table "public"."ai_writer_feedback" from "service_role";

revoke select on table "public"."ai_writer_feedback" from "service_role";

revoke trigger on table "public"."ai_writer_feedback" from "service_role";

revoke truncate on table "public"."ai_writer_feedback" from "service_role";

revoke update on table "public"."ai_writer_feedback" from "service_role";

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

revoke delete on table "public"."inbox_reads" from "anon";

revoke insert on table "public"."inbox_reads" from "anon";

revoke references on table "public"."inbox_reads" from "anon";

revoke select on table "public"."inbox_reads" from "anon";

revoke trigger on table "public"."inbox_reads" from "anon";

revoke truncate on table "public"."inbox_reads" from "anon";

revoke update on table "public"."inbox_reads" from "anon";

revoke delete on table "public"."inbox_reads" from "authenticated";

revoke insert on table "public"."inbox_reads" from "authenticated";

revoke references on table "public"."inbox_reads" from "authenticated";

revoke select on table "public"."inbox_reads" from "authenticated";

revoke trigger on table "public"."inbox_reads" from "authenticated";

revoke truncate on table "public"."inbox_reads" from "authenticated";

revoke update on table "public"."inbox_reads" from "authenticated";

revoke delete on table "public"."inbox_reads" from "service_role";

revoke insert on table "public"."inbox_reads" from "service_role";

revoke references on table "public"."inbox_reads" from "service_role";

revoke select on table "public"."inbox_reads" from "service_role";

revoke trigger on table "public"."inbox_reads" from "service_role";

revoke truncate on table "public"."inbox_reads" from "service_role";

revoke update on table "public"."inbox_reads" from "service_role";

revoke delete on table "public"."resource_outdated_flags" from "anon";

revoke insert on table "public"."resource_outdated_flags" from "anon";

revoke references on table "public"."resource_outdated_flags" from "anon";

revoke select on table "public"."resource_outdated_flags" from "anon";

revoke trigger on table "public"."resource_outdated_flags" from "anon";

revoke truncate on table "public"."resource_outdated_flags" from "anon";

revoke update on table "public"."resource_outdated_flags" from "anon";

revoke delete on table "public"."resource_outdated_flags" from "authenticated";

revoke insert on table "public"."resource_outdated_flags" from "authenticated";

revoke references on table "public"."resource_outdated_flags" from "authenticated";

revoke select on table "public"."resource_outdated_flags" from "authenticated";

revoke trigger on table "public"."resource_outdated_flags" from "authenticated";

revoke truncate on table "public"."resource_outdated_flags" from "authenticated";

revoke update on table "public"."resource_outdated_flags" from "authenticated";

revoke delete on table "public"."resource_outdated_flags" from "service_role";

revoke insert on table "public"."resource_outdated_flags" from "service_role";

revoke references on table "public"."resource_outdated_flags" from "service_role";

revoke select on table "public"."resource_outdated_flags" from "service_role";

revoke trigger on table "public"."resource_outdated_flags" from "service_role";

revoke truncate on table "public"."resource_outdated_flags" from "service_role";

revoke update on table "public"."resource_outdated_flags" from "service_role";

revoke delete on table "public"."resource_page_editors" from "anon";

revoke insert on table "public"."resource_page_editors" from "anon";

revoke references on table "public"."resource_page_editors" from "anon";

revoke select on table "public"."resource_page_editors" from "anon";

revoke trigger on table "public"."resource_page_editors" from "anon";

revoke truncate on table "public"."resource_page_editors" from "anon";

revoke update on table "public"."resource_page_editors" from "anon";

revoke delete on table "public"."resource_page_editors" from "authenticated";

revoke insert on table "public"."resource_page_editors" from "authenticated";

revoke references on table "public"."resource_page_editors" from "authenticated";

revoke select on table "public"."resource_page_editors" from "authenticated";

revoke trigger on table "public"."resource_page_editors" from "authenticated";

revoke truncate on table "public"."resource_page_editors" from "authenticated";

revoke update on table "public"."resource_page_editors" from "authenticated";

revoke delete on table "public"."resource_page_editors" from "service_role";

revoke insert on table "public"."resource_page_editors" from "service_role";

revoke references on table "public"."resource_page_editors" from "service_role";

revoke select on table "public"."resource_page_editors" from "service_role";

revoke trigger on table "public"."resource_page_editors" from "service_role";

revoke truncate on table "public"."resource_page_editors" from "service_role";

revoke update on table "public"."resource_page_editors" from "service_role";

revoke delete on table "public"."resource_page_folders" from "anon";

revoke insert on table "public"."resource_page_folders" from "anon";

revoke references on table "public"."resource_page_folders" from "anon";

revoke select on table "public"."resource_page_folders" from "anon";

revoke trigger on table "public"."resource_page_folders" from "anon";

revoke truncate on table "public"."resource_page_folders" from "anon";

revoke update on table "public"."resource_page_folders" from "anon";

revoke delete on table "public"."resource_page_folders" from "authenticated";

revoke insert on table "public"."resource_page_folders" from "authenticated";

revoke references on table "public"."resource_page_folders" from "authenticated";

revoke select on table "public"."resource_page_folders" from "authenticated";

revoke trigger on table "public"."resource_page_folders" from "authenticated";

revoke truncate on table "public"."resource_page_folders" from "authenticated";

revoke update on table "public"."resource_page_folders" from "authenticated";

revoke delete on table "public"."resource_page_folders" from "service_role";

revoke insert on table "public"."resource_page_folders" from "service_role";

revoke references on table "public"."resource_page_folders" from "service_role";

revoke select on table "public"."resource_page_folders" from "service_role";

revoke trigger on table "public"."resource_page_folders" from "service_role";

revoke truncate on table "public"."resource_page_folders" from "service_role";

revoke update on table "public"."resource_page_folders" from "service_role";

revoke delete on table "public"."resource_page_reads" from "anon";

revoke insert on table "public"."resource_page_reads" from "anon";

revoke references on table "public"."resource_page_reads" from "anon";

revoke select on table "public"."resource_page_reads" from "anon";

revoke trigger on table "public"."resource_page_reads" from "anon";

revoke truncate on table "public"."resource_page_reads" from "anon";

revoke update on table "public"."resource_page_reads" from "anon";

revoke delete on table "public"."resource_page_reads" from "authenticated";

revoke insert on table "public"."resource_page_reads" from "authenticated";

revoke references on table "public"."resource_page_reads" from "authenticated";

revoke select on table "public"."resource_page_reads" from "authenticated";

revoke trigger on table "public"."resource_page_reads" from "authenticated";

revoke truncate on table "public"."resource_page_reads" from "authenticated";

revoke update on table "public"."resource_page_reads" from "authenticated";

revoke delete on table "public"."resource_page_reads" from "service_role";

revoke insert on table "public"."resource_page_reads" from "service_role";

revoke references on table "public"."resource_page_reads" from "service_role";

revoke select on table "public"."resource_page_reads" from "service_role";

revoke trigger on table "public"."resource_page_reads" from "service_role";

revoke truncate on table "public"."resource_page_reads" from "service_role";

revoke update on table "public"."resource_page_reads" from "service_role";

alter table "public"."ai_writer_feedback" drop constraint "ai_writer_feedback_ai_mode_check";

alter table "public"."ai_writer_feedback" drop constraint "ai_writer_feedback_rating_check";

alter table "public"."arketa_classes" drop constraint "arketa_classes_external_id_class_date_key";

alter table "public"."daily_schedule" drop constraint "daily_schedule_schedule_date_class_id_key";

alter table "public"."inbox_reads" drop constraint "inbox_reads_item_type_check";

alter table "public"."inbox_reads" drop constraint "inbox_reads_user_id_fkey";

alter table "public"."inbox_reads" drop constraint "inbox_reads_user_id_item_type_item_id_key";

alter table "public"."policy_categories" drop constraint "policy_categories_migrated_to_folder_id_fkey";

alter table "public"."resource_outdated_flags" drop constraint "resource_flags_page_number_positive";

alter table "public"."resource_outdated_flags" drop constraint "resource_outdated_flags_flagged_by_id_fkey";

alter table "public"."resource_outdated_flags" drop constraint "resource_outdated_flags_resolved_by_id_fkey";

alter table "public"."resource_outdated_flags" drop constraint "resource_outdated_flags_resource_type_check";

alter table "public"."resource_outdated_flags" drop constraint "resource_outdated_flags_status_check";

alter table "public"."resource_page_editors" drop constraint "resource_page_editors_granted_by_fkey";

alter table "public"."resource_page_editors" drop constraint "resource_page_editors_page_id_fkey";

alter table "public"."resource_page_editors" drop constraint "resource_page_editors_page_id_user_id_key";

alter table "public"."resource_page_editors" drop constraint "resource_page_editors_user_id_fkey";

alter table "public"."resource_page_folders" drop constraint "resource_page_folders_created_by_fkey";

alter table "public"."resource_page_folders" drop constraint "resource_page_folders_parent_folder_id_fkey";

alter table "public"."resource_page_reads" drop constraint "resource_page_reads_page_id_fkey";

alter table "public"."resource_page_reads" drop constraint "resource_page_reads_page_id_user_id_key";

alter table "public"."resource_page_reads" drop constraint "resource_page_reads_user_id_fkey";

alter table "public"."resource_pages" drop constraint "fk_resource_pages_folder";

alter table "public"."resource_pages" drop constraint "resource_pages_last_edited_by_fkey";

alter table "public"."notification_triggers" drop constraint "notification_triggers_created_by_fkey";

drop function if exists "public"."get_pdf_page_flags"(page_id uuid, page_num integer);

drop function if exists "public"."refresh_daily_schedule"(p_schedule_date date);

drop function if exists "public"."refresh_daily_schedule_on_reservations_delete"();

drop function if exists "public"."refresh_daily_schedule_on_reservations_insert"();

drop function if exists "public"."refresh_daily_schedule_on_reservations_update"();

drop view if exists "public"."resource_flags_with_page_info";

drop function if exists "public"."upsert_arketa_classes_from_staging"(p_sync_batch_id uuid);

drop view if exists "public"."archived_policies_reference";

drop view if exists "public"."arketa_orphan_classes";

alter table "public"."ai_writer_feedback" drop constraint "ai_writer_feedback_pkey";

alter table "public"."api_sync_skipped_records" drop constraint "api_sync_skipped_records_pkey";

alter table "public"."daily_schedule" drop constraint "daily_schedules_pkey";

alter table "public"."inbox_reads" drop constraint "inbox_reads_pkey";

alter table "public"."resource_outdated_flags" drop constraint "resource_outdated_flags_pkey";

alter table "public"."resource_page_editors" drop constraint "resource_page_editors_pkey";

alter table "public"."resource_page_folders" drop constraint "resource_page_folders_pkey";

alter table "public"."resource_page_reads" drop constraint "resource_page_reads_pkey";

drop index if exists "public"."ai_writer_feedback_pkey";

drop index if exists "public"."api_sync_skipped_records_pkey";

drop index if exists "public"."arketa_classes_external_id_class_date_key";

drop index if exists "public"."daily_schedule_schedule_date_class_id_key";

drop index if exists "public"."idx_api_sync_skipped_records_api_name";

drop index if exists "public"."idx_api_sync_skipped_records_created_at";

drop index if exists "public"."idx_arketa_classes_staging_class_date";

drop index if exists "public"."idx_arketa_classes_staging_sync_batch_id";

drop index if exists "public"."idx_daily_schedule_class_id";

drop index if exists "public"."idx_daily_schedule_date";

drop index if exists "public"."idx_inbox_reads_user";

drop index if exists "public"."idx_page_reads_page";

drop index if exists "public"."idx_page_reads_user";

drop index if exists "public"."idx_resource_flags_has_page";

drop index if exists "public"."idx_resource_flags_page";

drop index if exists "public"."idx_resource_flags_resource";

drop index if exists "public"."idx_resource_flags_status_created";

drop index if exists "public"."idx_resource_pages_display_order";

drop index if exists "public"."idx_resource_pages_folder";

drop index if exists "public"."idx_resource_pages_tags";

drop index if exists "public"."idx_skipped_records_api_name";

drop index if exists "public"."idx_skipped_records_created_at";

drop index if exists "public"."inbox_reads_pkey";

drop index if exists "public"."inbox_reads_user_id_item_type_item_id_key";

drop index if exists "public"."resource_outdated_flags_pkey";

drop index if exists "public"."resource_page_editors_page_id_user_id_key";

drop index if exists "public"."resource_page_editors_pkey";

drop index if exists "public"."resource_page_folders_pkey";

drop index if exists "public"."resource_page_reads_page_id_user_id_key";

drop index if exists "public"."resource_page_reads_pkey";

drop index if exists "public"."daily_schedules_pkey";

drop table "public"."ai_writer_feedback";

drop table "public"."api_sync_skipped_records";

drop table "public"."daily_schedule";

drop table "public"."inbox_reads";

drop table "public"."resource_outdated_flags";

drop table "public"."resource_page_editors";

drop table "public"."resource_page_folders";

drop table "public"."resource_page_reads";


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

alter table "public"."arketa_classes" drop column "location_name";

alter table "public"."arketa_classes" drop column "updated_at";

alter table "public"."arketa_classes_staging" drop column "booked_count";

alter table "public"."arketa_classes_staging" drop column "class_date";

alter table "public"."arketa_classes_staging" drop column "duration_minutes";

alter table "public"."arketa_classes_staging" drop column "external_id";

alter table "public"."arketa_classes_staging" drop column "is_cancelled";

alter table "public"."arketa_classes_staging" drop column "location_name";

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

alter table "public"."arketa_classes_staging" add column "is_deleted" boolean default false;

alter table "public"."arketa_classes_staging" add column "location" text;

alter table "public"."arketa_classes_staging" add column "location_id" text;

alter table "public"."arketa_classes_staging" add column "signups" integer default 0;

alter table "public"."arketa_classes_staging" add column "updated_at_api" timestamp with time zone;

alter table "public"."boh_checklist_items" drop column "metadata";

alter table "public"."cafe_checklist_items" drop column "metadata";

alter table "public"."concierge_checklist_items" drop column "metadata";

alter table "public"."notification_triggers" alter column "created_at" drop not null;

alter table "public"."notification_triggers" alter column "filter_by_working" drop not null;

alter table "public"."notification_triggers" alter column "is_active" drop not null;

alter table "public"."notification_triggers" alter column "timing_window_minutes" drop not null;

alter table "public"."notification_triggers" alter column "updated_at" drop not null;

alter table "public"."resource_pages" drop column "content_json";

alter table "public"."resource_pages" drop column "cover_image_url";

alter table "public"."resource_pages" drop column "display_order";

alter table "public"."resource_pages" drop column "folder_id";

alter table "public"."resource_pages" drop column "last_edited_by";

alter table "public"."resource_pages" drop column "tags";

alter table "public"."staff_announcements" alter column "announcement_type" set default 'alert'::text;

alter table "public"."staff_announcements" alter column "announcement_type" set data type text using "announcement_type"::text;

alter table "public"."toast_staging" drop column "page_number";

drop type "public"."staff_announcement_type";

CREATE UNIQUE INDEX announcement_reads_announcement_id_user_id_key ON public.announcement_reads USING btree (announcement_id, user_id);

CREATE UNIQUE INDEX announcement_reads_pkey ON public.announcement_reads USING btree (id);

CREATE UNIQUE INDEX announcements_pkey ON public.announcements USING btree (id);

CREATE UNIQUE INDEX arketa_classes_external_id_key ON public.arketa_classes USING btree (external_id);

CREATE UNIQUE INDEX arketa_classes_staging_arketa_class_id_sync_batch_id_key ON public.arketa_classes_staging USING btree (arketa_class_id, sync_batch_id);

CREATE UNIQUE INDEX daily_schedules_schedule_date_sling_user_id_shift_start_key ON public.daily_schedules USING btree (schedule_date, sling_user_id, shift_start);

CREATE INDEX idx_arketa_classes_staging_batch ON public.arketa_classes_staging USING btree (sync_batch_id);

CREATE INDEX idx_arketa_classes_staging_time ON public.arketa_classes_staging USING btree (start_time);

CREATE INDEX idx_classes_staging_batch ON public.arketa_classes_staging USING btree (sync_batch_id);

CREATE INDEX idx_daily_schedules_date ON public.daily_schedules USING btree (schedule_date);

CREATE INDEX idx_daily_schedules_user ON public.daily_schedules USING btree (sling_user_id);

CREATE UNIQUE INDEX daily_schedules_pkey ON public.daily_schedules USING btree (id);

alter table "public"."announcement_reads" add constraint "announcement_reads_pkey" PRIMARY KEY using index "announcement_reads_pkey";

alter table "public"."announcements" add constraint "announcements_pkey" PRIMARY KEY using index "announcements_pkey";

alter table "public"."daily_schedules" add constraint "daily_schedules_pkey" PRIMARY KEY using index "daily_schedules_pkey";

alter table "public"."announcement_reads" add constraint "announcement_reads_announcement_id_fkey" FOREIGN KEY (announcement_id) REFERENCES public.announcements(id) ON DELETE CASCADE not valid;

alter table "public"."announcement_reads" validate constraint "announcement_reads_announcement_id_fkey";

alter table "public"."announcement_reads" add constraint "announcement_reads_announcement_id_user_id_key" UNIQUE using index "announcement_reads_announcement_id_user_id_key";

alter table "public"."arketa_classes" add constraint "arketa_classes_external_id_key" UNIQUE using index "arketa_classes_external_id_key";

alter table "public"."arketa_classes_staging" add constraint "arketa_classes_staging_arketa_class_id_sync_batch_id_key" UNIQUE using index "arketa_classes_staging_arketa_class_id_sync_batch_id_key";

alter table "public"."daily_schedules" add constraint "daily_schedules_schedule_date_sling_user_id_shift_start_key" UNIQUE using index "daily_schedules_schedule_date_sling_user_id_shift_start_key";

alter table "public"."notification_triggers" add constraint "notification_triggers_event_type_check" CHECK ((event_type = ANY (ARRAY['class_end_heated_room'::text, 'class_end_high_roof'::text, 'room_turnover'::text, 'tour_alert'::text]))) not valid;

alter table "public"."notification_triggers" validate constraint "notification_triggers_event_type_check";

alter table "public"."notification_triggers" add constraint "notification_triggers_target_department_check" CHECK ((target_department = ANY (ARRAY['concierge'::text, 'floater'::text, 'cafe'::text, 'all_foh'::text, 'all_boh'::text]))) not valid;

alter table "public"."notification_triggers" validate constraint "notification_triggers_target_department_check";

alter table "public"."notification_triggers" add constraint "notification_triggers_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."notification_triggers" validate constraint "notification_triggers_created_by_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.upsert_arketa_classes_from_staging(p_sync_batch_id text)
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  upserted_count integer;
BEGIN
  WITH upserted AS (
    INSERT INTO arketa_classes (
      external_id, class_date, start_time, duration_minutes, name, capacity,
      instructor_name, is_cancelled, description, booked_count, waitlist_count,
      status, room_name, raw_data, synced_at, location_id, is_deleted, updated_at_api
    )
    SELECT
      s.external_id, s.class_date, s.start_time, s.duration_minutes, s.name, s.capacity,
      s.instructor_name, s.is_cancelled, s.description, s.booked_count, s.waitlist_count,
      s.status, s.room_name, s.raw_data, s.synced_at, s.location_id, s.is_deleted, s.updated_at_api
    FROM arketa_classes_staging s
    WHERE s.sync_batch_id = p_sync_batch_id
    ON CONFLICT (external_id, class_date) DO UPDATE SET
      start_time = EXCLUDED.start_time,
      duration_minutes = EXCLUDED.duration_minutes,
      name = EXCLUDED.name,
      capacity = EXCLUDED.capacity,
      instructor_name = EXCLUDED.instructor_name,
      is_cancelled = EXCLUDED.is_cancelled,
      description = EXCLUDED.description,
      booked_count = EXCLUDED.booked_count,
      waitlist_count = EXCLUDED.waitlist_count,
      status = EXCLUDED.status,
      room_name = EXCLUDED.room_name,
      raw_data = EXCLUDED.raw_data,
      synced_at = EXCLUDED.synced_at,
      location_id = EXCLUDED.location_id,
      is_deleted = EXCLUDED.is_deleted,
      updated_at_api = EXCLUDED.updated_at_api,
      updated_at = now()
    RETURNING id
  )
  SELECT count(*) INTO upserted_count FROM upserted;

  -- Clean up staging rows for this batch
  DELETE FROM arketa_classes_staging WHERE sync_batch_id = p_sync_batch_id;

  RETURN upserted_count;
END;
$function$
;

create or replace view "public"."archived_policies_reference" as  SELECT cp.id,
    cp.content,
    cp.category,
    cp.created_at,
    cp.archived_at,
    cp.migrated_to_page_id,
    rp.title AS migrated_page_title,
    rp.pdf_file_url AS migrated_pdf_url
   FROM (public.club_policies cp
     LEFT JOIN public.resource_pages rp ON ((cp.migrated_to_page_id = rp.id)))
  WHERE (cp.archived_at IS NOT NULL)
  ORDER BY cp.category, cp.created_at DESC;


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

drop policy "resource_assets_delete" on "storage"."objects";

drop policy "resource_assets_insert" on "storage"."objects";

drop policy "resource_assets_select" on "storage"."objects";

CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


