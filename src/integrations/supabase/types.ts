export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          activity_date: string
          activity_type: string
          created_at: string
          details: Json | null
          id: string
          member_id: string | null
          source: string | null
        }
        Insert: {
          activity_date?: string
          activity_type: string
          created_at?: string
          details?: Json | null
          id?: string
          member_id?: string | null
          source?: string | null
        }
        Update: {
          activity_date?: string
          activity_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          member_id?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      announcement_reads: {
        Row: {
          announcement_id: string
          id: string
          read_at: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          id?: string
          read_at?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          target_roles: Database["public"]["Enums"]["app_role"][]
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: string
          target_roles: Database["public"]["Enums"]["app_role"][]
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          target_roles?: Database["public"]["Enums"]["app_role"][]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      api_endpoints: {
        Row: {
          api_name: string
          base_url: string
          created_at: string | null
          endpoint_path: string
          endpoint_type: string
          id: string
          is_active: boolean | null
          max_date_range_days: number | null
          rate_limit_per_min: number | null
        }
        Insert: {
          api_name: string
          base_url: string
          created_at?: string | null
          endpoint_path: string
          endpoint_type: string
          id?: string
          is_active?: boolean | null
          max_date_range_days?: number | null
          rate_limit_per_min?: number | null
        }
        Update: {
          api_name?: string
          base_url?: string
          created_at?: string | null
          endpoint_path?: string
          endpoint_type?: string
          id?: string
          is_active?: boolean | null
          max_date_range_days?: number | null
          rate_limit_per_min?: number | null
        }
        Relationships: []
      }
      api_logs: {
        Row: {
          api_name: string
          created_at: string | null
          duration_ms: number | null
          endpoint: string
          error_message: string | null
          id: string
          raw_response: string | null
          records_inserted: number | null
          records_processed: number | null
          request_method: string | null
          response_body: Json | null
          response_status: number | null
          sync_success: boolean
          triggered_by: string | null
        }
        Insert: {
          api_name: string
          created_at?: string | null
          duration_ms?: number | null
          endpoint: string
          error_message?: string | null
          id?: string
          raw_response?: string | null
          records_inserted?: number | null
          records_processed?: number | null
          request_method?: string | null
          response_body?: Json | null
          response_status?: number | null
          sync_success: boolean
          triggered_by?: string | null
        }
        Update: {
          api_name?: string
          created_at?: string | null
          duration_ms?: number | null
          endpoint?: string
          error_message?: string | null
          id?: string
          raw_response?: string | null
          records_inserted?: number | null
          records_processed?: number | null
          request_method?: string | null
          response_body?: Json | null
          response_status?: number | null
          sync_success?: boolean
          triggered_by?: string | null
        }
        Relationships: []
      }
      api_sync_status: {
        Row: {
          api_name: string
          created_at: string | null
          id: string
          is_enabled: boolean | null
          last_error_message: string | null
          last_records_inserted: number | null
          last_records_processed: number | null
          last_sync_at: string | null
          last_sync_success: boolean | null
          sync_frequency_minutes: number | null
          updated_at: string | null
        }
        Insert: {
          api_name: string
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          last_error_message?: string | null
          last_records_inserted?: number | null
          last_records_processed?: number | null
          last_sync_at?: string | null
          last_sync_success?: boolean | null
          sync_frequency_minutes?: number | null
          updated_at?: string | null
        }
        Update: {
          api_name?: string
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          last_error_message?: string | null
          last_records_inserted?: number | null
          last_records_processed?: number | null
          last_sync_at?: string | null
          last_sync_success?: boolean | null
          sync_frequency_minutes?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      arketa_classes_staging: {
        Row: {
          arketa_class_id: string
          capacity: number | null
          class_name: string
          end_time: string | null
          id: string
          instructor_name: string | null
          location: string | null
          signups: number | null
          staged_at: string | null
          start_time: string
          sync_batch_id: string
        }
        Insert: {
          arketa_class_id: string
          capacity?: number | null
          class_name: string
          end_time?: string | null
          id?: string
          instructor_name?: string | null
          location?: string | null
          signups?: number | null
          staged_at?: string | null
          start_time: string
          sync_batch_id: string
        }
        Update: {
          arketa_class_id?: string
          capacity?: number | null
          class_name?: string
          end_time?: string | null
          id?: string
          instructor_name?: string | null
          location?: string | null
          signups?: number | null
          staged_at?: string | null
          start_time?: string
          sync_batch_id?: string
        }
        Relationships: []
      }
      arketa_clients_staging: {
        Row: {
          arketa_client_id: string
          email: string | null
          first_name: string | null
          id: string
          join_date: string | null
          last_name: string | null
          membership_status: string | null
          membership_type: string | null
          phone: string | null
          raw_data: Json | null
          staged_at: string | null
          sync_batch_id: string
        }
        Insert: {
          arketa_client_id: string
          email?: string | null
          first_name?: string | null
          id?: string
          join_date?: string | null
          last_name?: string | null
          membership_status?: string | null
          membership_type?: string | null
          phone?: string | null
          raw_data?: Json | null
          staged_at?: string | null
          sync_batch_id: string
        }
        Update: {
          arketa_client_id?: string
          email?: string | null
          first_name?: string | null
          id?: string
          join_date?: string | null
          last_name?: string | null
          membership_status?: string | null
          membership_type?: string | null
          phone?: string | null
          raw_data?: Json | null
          staged_at?: string | null
          sync_batch_id?: string
        }
        Relationships: []
      }
      arketa_reservations_staging: {
        Row: {
          arketa_class_id: string
          checked_in_at: string | null
          client_email: string | null
          client_id: string | null
          client_name: string | null
          id: string
          reservation_id: string
          staged_at: string | null
          status: string | null
          sync_batch_id: string
        }
        Insert: {
          arketa_class_id: string
          checked_in_at?: string | null
          client_email?: string | null
          client_id?: string | null
          client_name?: string | null
          id?: string
          reservation_id: string
          staged_at?: string | null
          status?: string | null
          sync_batch_id: string
        }
        Update: {
          arketa_class_id?: string
          checked_in_at?: string | null
          client_email?: string | null
          client_id?: string | null
          client_name?: string | null
          id?: string
          reservation_id?: string
          staged_at?: string | null
          status?: string | null
          sync_batch_id?: string
        }
        Relationships: []
      }
      assets: {
        Row: {
          category: string
          created_at: string
          created_by: string
          current_value: number
          depreciation_rate: number
          id: string
          location: string
          name: string
          notes: string | null
          purchase_date: string
          purchase_price: number
          status: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by: string
          current_value: number
          depreciation_rate?: number
          id?: string
          location: string
          name: string
          notes?: string | null
          purchase_date: string
          purchase_price: number
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          current_value?: number
          depreciation_rate?: number
          id?: string
          location?: string
          name?: string
          notes?: string | null
          purchase_date?: string
          purchase_price?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      calendly_events_staging: {
        Row: {
          calendly_event_id: string
          end_time: string | null
          event_name: string | null
          event_type: string | null
          id: string
          invitee_email: string | null
          invitee_name: string | null
          invitee_phone: string | null
          location: string | null
          notes: string | null
          raw_data: Json | null
          staged_at: string | null
          start_time: string
          status: string | null
          sync_batch_id: string
        }
        Insert: {
          calendly_event_id: string
          end_time?: string | null
          event_name?: string | null
          event_type?: string | null
          id?: string
          invitee_email?: string | null
          invitee_name?: string | null
          invitee_phone?: string | null
          location?: string | null
          notes?: string | null
          raw_data?: Json | null
          staged_at?: string | null
          start_time: string
          status?: string | null
          sync_batch_id: string
        }
        Update: {
          calendly_event_id?: string
          end_time?: string | null
          event_name?: string | null
          event_type?: string | null
          id?: string
          invitee_email?: string | null
          invitee_name?: string | null
          invitee_phone?: string | null
          location?: string | null
          notes?: string | null
          raw_data?: Json | null
          staged_at?: string | null
          start_time?: string
          status?: string | null
          sync_batch_id?: string
        }
        Relationships: []
      }
      checklist_completions: {
        Row: {
          checklist_item_id: string
          completed_at: string
          completion_date: string
          id: string
          user_id: string
        }
        Insert: {
          checklist_item_id: string
          completed_at?: string
          completion_date?: string
          id?: string
          user_id: string
        }
        Update: {
          checklist_item_id?: string
          completed_at?: string
          completion_date?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_completions_checklist_item_id_fkey"
            columns: ["checklist_item_id"]
            isOneToOne: false
            referencedRelation: "checklist_items"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_items: {
        Row: {
          checklist_id: string
          created_at: string
          description: string | null
          id: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          checklist_id: string
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          checklist_id?: string
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      checklists: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["app_role"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          role: Database["public"]["Enums"]["app_role"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      class_schedule: {
        Row: {
          arketa_class_id: string
          capacity: number | null
          checkins: number | null
          class_date: string
          class_name: string
          end_time: string | null
          id: string
          instructor_name: string | null
          last_synced_at: string | null
          location: string | null
          signups: number | null
          start_time: string
        }
        Insert: {
          arketa_class_id: string
          capacity?: number | null
          checkins?: number | null
          class_date: string
          class_name: string
          end_time?: string | null
          id?: string
          instructor_name?: string | null
          last_synced_at?: string | null
          location?: string | null
          signups?: number | null
          start_time: string
        }
        Update: {
          arketa_class_id?: string
          capacity?: number | null
          checkins?: number | null
          class_date?: string
          class_name?: string
          end_time?: string | null
          id?: string
          instructor_name?: string | null
          last_synced_at?: string | null
          location?: string | null
          signups?: number | null
          start_time?: string
        }
        Relationships: []
      }
      daily_report_history: {
        Row: {
          arketa_payments: Json | null
          arketa_reservations: Json | null
          busiest_areas: string | null
          celebratory_events: Json | null
          created_at: string
          facility_issues: Json | null
          future_shift_notes: Json | null
          id: string
          management_notes: string | null
          member_feedback: Json | null
          membership_requests: Json | null
          report_date: string
          scheduled_tours: Json | null
          shift_type: string
          sling_shift_data: Json | null
          staff_name: string | null
          staff_user_id: string
          status: string | null
          submitted_at: string | null
          system_issues: Json | null
          toast_sales: Json | null
          total_class_attendance: number | null
          total_revenue: number | null
          total_visits: number | null
          tour_notes: Json | null
          updated_at: string
        }
        Insert: {
          arketa_payments?: Json | null
          arketa_reservations?: Json | null
          busiest_areas?: string | null
          celebratory_events?: Json | null
          created_at?: string
          facility_issues?: Json | null
          future_shift_notes?: Json | null
          id?: string
          management_notes?: string | null
          member_feedback?: Json | null
          membership_requests?: Json | null
          report_date: string
          scheduled_tours?: Json | null
          shift_type: string
          sling_shift_data?: Json | null
          staff_name?: string | null
          staff_user_id: string
          status?: string | null
          submitted_at?: string | null
          system_issues?: Json | null
          toast_sales?: Json | null
          total_class_attendance?: number | null
          total_revenue?: number | null
          total_visits?: number | null
          tour_notes?: Json | null
          updated_at?: string
        }
        Update: {
          arketa_payments?: Json | null
          arketa_reservations?: Json | null
          busiest_areas?: string | null
          celebratory_events?: Json | null
          created_at?: string
          facility_issues?: Json | null
          future_shift_notes?: Json | null
          id?: string
          management_notes?: string | null
          member_feedback?: Json | null
          membership_requests?: Json | null
          report_date?: string
          scheduled_tours?: Json | null
          shift_type?: string
          sling_shift_data?: Json | null
          staff_name?: string | null
          staff_user_id?: string
          status?: string | null
          submitted_at?: string | null
          system_issues?: Json | null
          toast_sales?: Json | null
          total_class_attendance?: number | null
          total_revenue?: number | null
          total_visits?: number | null
          tour_notes?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      daily_reports: {
        Row: {
          cafe_gross_sales: number | null
          cafe_net_sales: number | null
          cafe_order_count: number | null
          created_at: string | null
          gross_sales_arketa: number | null
          id: string
          last_synced_at: string | null
          raw_data: Json | null
          report_date: string
          total_class_checkins: number | null
          total_gym_checkins: number | null
          total_reservations: number | null
          total_sales: number | null
        }
        Insert: {
          cafe_gross_sales?: number | null
          cafe_net_sales?: number | null
          cafe_order_count?: number | null
          created_at?: string | null
          gross_sales_arketa?: number | null
          id?: string
          last_synced_at?: string | null
          raw_data?: Json | null
          report_date: string
          total_class_checkins?: number | null
          total_gym_checkins?: number | null
          total_reservations?: number | null
          total_sales?: number | null
        }
        Update: {
          cafe_gross_sales?: number | null
          cafe_net_sales?: number | null
          cafe_order_count?: number | null
          created_at?: string | null
          gross_sales_arketa?: number | null
          id?: string
          last_synced_at?: string | null
          raw_data?: Json | null
          report_date?: string
          total_class_checkins?: number | null
          total_gym_checkins?: number | null
          total_reservations?: number | null
          total_sales?: number | null
        }
        Relationships: []
      }
      daily_schedules: {
        Row: {
          id: string
          is_currently_working: boolean | null
          last_synced_at: string | null
          location: string | null
          position: string | null
          schedule_date: string
          shift_end: string
          shift_start: string
          sling_user_id: number
          staff_id: string | null
          staff_name: string | null
        }
        Insert: {
          id?: string
          is_currently_working?: boolean | null
          last_synced_at?: string | null
          location?: string | null
          position?: string | null
          schedule_date: string
          shift_end: string
          shift_start: string
          sling_user_id: number
          staff_id?: string | null
          staff_name?: string | null
        }
        Update: {
          id?: string
          is_currently_working?: boolean | null
          last_synced_at?: string | null
          location?: string | null
          position?: string | null
          schedule_date?: string
          shift_end?: string
          shift_start?: string
          sling_user_id?: number
          staff_id?: string | null
          staff_name?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          target_roles: Database["public"]["Enums"]["app_role"][]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          target_roles: Database["public"]["Enums"]["app_role"][]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          target_roles?: Database["public"]["Enums"]["app_role"][]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body: string
          category: string | null
          created_at: string
          created_by: string
          id: string
          subject: string
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          category?: string | null
          created_at?: string
          created_by: string
          id?: string
          subject: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          category?: string | null
          created_at?: string
          created_by?: string
          id?: string
          subject?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          asset_id: string | null
          category: string
          created_at: string
          created_by: string
          description: string
          expense_date: string
          id: string
          location: string
          receipt_url: string | null
        }
        Insert: {
          amount: number
          asset_id?: string | null
          category: string
          created_at?: string
          created_by: string
          description: string
          expense_date?: string
          id?: string
          location: string
          receipt_url?: string | null
        }
        Update: {
          amount?: number
          asset_id?: string | null
          category?: string
          created_at?: string
          created_by?: string
          description?: string
          expense_date?: string
          id?: string
          location?: string
          receipt_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      member_checkins: {
        Row: {
          arketa_client_id: string | null
          checkin_date: string
          checkin_time: string
          checkin_type: string | null
          class_name: string | null
          created_at: string | null
          id: string
          member_email: string | null
          member_name: string | null
        }
        Insert: {
          arketa_client_id?: string | null
          checkin_date: string
          checkin_time: string
          checkin_type?: string | null
          class_name?: string | null
          created_at?: string | null
          id?: string
          member_email?: string | null
          member_name?: string | null
        }
        Update: {
          arketa_client_id?: string | null
          checkin_date?: string
          checkin_time?: string
          checkin_type?: string | null
          class_name?: string | null
          created_at?: string | null
          id?: string
          member_email?: string | null
          member_name?: string | null
        }
        Relationships: []
      }
      member_communications: {
        Row: {
          communication_type: string
          content: string
          created_at: string
          id: string
          member_id: string
          metadata: Json | null
          subject: string | null
          user_id: string
        }
        Insert: {
          communication_type: string
          content: string
          created_at?: string
          id?: string
          member_id: string
          metadata?: Json | null
          subject?: string | null
          user_id: string
        }
        Update: {
          communication_type?: string
          content?: string
          created_at?: string
          id?: string
          member_id?: string
          metadata?: Json | null
          subject?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_communications_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      member_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          member_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          member_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          member_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_notes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      member_sync_log: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          records_synced: number | null
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          records_synced?: number | null
          started_at?: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          records_synced?: number | null
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      members: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          external_id: string
          external_trainer_id: string | null
          first_name: string | null
          full_name: string | null
          id: string
          join_date: string | null
          last_name: string | null
          last_synced_at: string | null
          membership_tier: Database["public"]["Enums"]["membership_tier"] | null
          phone: string | null
          raw_data: Json | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          external_id: string
          external_trainer_id?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          join_date?: string | null
          last_name?: string | null
          last_synced_at?: string | null
          membership_tier?:
            | Database["public"]["Enums"]["membership_tier"]
            | null
          phone?: string | null
          raw_data?: Json | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          external_id?: string
          external_trainer_id?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          join_date?: string | null
          last_name?: string | null
          last_synced_at?: string | null
          membership_tier?:
            | Database["public"]["Enums"]["membership_tier"]
            | null
          phone?: string | null
          raw_data?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          deactivated: boolean
          email: string
          full_name: string | null
          id: string
          onboarding_completed: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deactivated?: boolean
          email: string
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deactivated?: boolean
          email?: string
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          permission: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          id?: string
          permission?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      scheduled_tours: {
        Row: {
          assigned_to: string | null
          calendly_event_id: string
          created_at: string | null
          end_time: string | null
          event_type: string | null
          guest_email: string | null
          guest_name: string | null
          guest_phone: string | null
          id: string
          last_synced_at: string | null
          notes: string | null
          start_time: string
          status: string | null
          tour_date: string
        }
        Insert: {
          assigned_to?: string | null
          calendly_event_id: string
          created_at?: string | null
          end_time?: string | null
          event_type?: string | null
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          last_synced_at?: string | null
          notes?: string | null
          start_time: string
          status?: string | null
          tour_date: string
        }
        Update: {
          assigned_to?: string | null
          calendly_event_id?: string
          created_at?: string | null
          end_time?: string | null
          event_type?: string | null
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          last_synced_at?: string | null
          notes?: string | null
          start_time?: string
          status?: string | null
          tour_date?: string
        }
        Relationships: []
      }
      sling_shifts_staging: {
        Row: {
          id: string
          location_id: number | null
          location_name: string | null
          position_id: number | null
          position_name: string | null
          shift_date: string
          shift_end: string
          shift_id: number
          shift_start: string
          sling_user_id: number
          staged_at: string | null
          status: string | null
          sync_batch_id: string
          user_name: string | null
        }
        Insert: {
          id?: string
          location_id?: number | null
          location_name?: string | null
          position_id?: number | null
          position_name?: string | null
          shift_date: string
          shift_end: string
          shift_id: number
          shift_start: string
          sling_user_id: number
          staged_at?: string | null
          status?: string | null
          sync_batch_id: string
          user_name?: string | null
        }
        Update: {
          id?: string
          location_id?: number | null
          location_name?: string | null
          position_id?: number | null
          position_name?: string | null
          shift_date?: string
          shift_end?: string
          shift_id?: number
          shift_start?: string
          sling_user_id?: number
          staged_at?: string | null
          status?: string | null
          sync_batch_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      sling_staging: {
        Row: {
          email: string | null
          first_name: string | null
          id: string
          is_active: boolean | null
          last_name: string | null
          positions: string[] | null
          sling_created_at: string | null
          sling_user_id: number
          staged_at: string | null
          sync_batch_id: string
        }
        Insert: {
          email?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          positions?: string[] | null
          sling_created_at?: string | null
          sling_user_id: number
          staged_at?: string | null
          sync_batch_id: string
        }
        Update: {
          email?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          positions?: string[] | null
          sling_created_at?: string | null
          sling_user_id?: number
          staged_at?: string | null
          sync_batch_id?: string
        }
        Relationships: []
      }
      sling_users: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          is_active: boolean | null
          last_name: string | null
          last_synced_at: string | null
          linked_staff_id: string | null
          positions: string[] | null
          sling_created_at: string | null
          sling_user_id: number
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          last_synced_at?: string | null
          linked_staff_id?: string | null
          positions?: string[] | null
          sling_created_at?: string | null
          sling_user_id: number
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          last_synced_at?: string | null
          linked_staff_id?: string | null
          positions?: string[] | null
          sling_created_at?: string | null
          sling_user_id?: number
        }
        Relationships: []
      }
      system_alerts: {
        Row: {
          alert_type: string
          api_name: string | null
          auto_resolve_on_sync: boolean | null
          created_at: string | null
          details: Json | null
          id: string
          is_resolved: boolean | null
          message: string
          resolved_at: string | null
          resolved_by: string | null
          severity: string | null
        }
        Insert: {
          alert_type: string
          api_name?: string | null
          auto_resolve_on_sync?: boolean | null
          created_at?: string | null
          details?: Json | null
          id?: string
          is_resolved?: boolean | null
          message: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
        }
        Update: {
          alert_type?: string
          api_name?: string | null
          auto_resolve_on_sync?: boolean | null
          created_at?: string | null
          details?: Json | null
          id?: string
          is_resolved?: boolean | null
          message?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
        }
        Relationships: []
      }
      toast_staging: {
        Row: {
          business_date: string
          gross_sales: number | null
          id: string
          net_sales: number | null
          order_count: number | null
          raw_data: Json | null
          staged_at: string | null
          sync_batch_id: string
        }
        Insert: {
          business_date: string
          gross_sales?: number | null
          id?: string
          net_sales?: number | null
          order_count?: number | null
          raw_data?: Json | null
          staged_at?: string | null
          sync_batch_id: string
        }
        Update: {
          business_date?: string
          gross_sales?: number | null
          id?: string
          net_sales?: number | null
          order_count?: number | null
          raw_data?: Json | null
          staged_at?: string | null
          sync_batch_id?: string
        }
        Relationships: []
      }
      trainer_assignments: {
        Row: {
          assigned_by: string
          assignment_type: string
          created_at: string
          id: string
          member_id: string
          notes: string | null
          trainer_user_id: string
        }
        Insert: {
          assigned_by: string
          assignment_type?: string
          created_at?: string
          id?: string
          member_id: string
          notes?: string | null
          trainer_user_id: string
        }
        Update: {
          assigned_by?: string
          assignment_type?: string
          created_at?: string
          id?: string
          member_id?: string
          notes?: string | null
          trainer_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trainer_assignments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      training_plan_content: {
        Row: {
          content: string
          content_type: string
          created_at: string
          id: string
          section_title: string
          sort_order: number
          training_plan_id: string
          updated_at: string
        }
        Insert: {
          content: string
          content_type?: string
          created_at?: string
          id?: string
          section_title: string
          sort_order?: number
          training_plan_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          content_type?: string
          created_at?: string
          id?: string
          section_title?: string
          sort_order?: number
          training_plan_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_plan_content_training_plan_id_fkey"
            columns: ["training_plan_id"]
            isOneToOne: false
            referencedRelation: "training_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      training_plans: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          is_template: boolean
          member_id: string | null
          plan_type: string
          share_slug: string | null
          title: string
          trainer_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          is_template?: boolean
          member_id?: string | null
          plan_type?: string
          share_slug?: string | null
          title: string
          trainer_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          is_template?: boolean
          member_id?: string | null
          plan_type?: string
          share_slug?: string | null
          title?: string
          trainer_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_plans_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_get_all_users: {
        Args: never
        Returns: {
          created_at: string
          deactivated: boolean
          email: string
          full_name: string
          onboarding_completed: boolean
          roles: Database["public"]["Enums"]["app_role"][]
          user_id: string
        }[]
      }
      admin_toggle_user_deactivation: {
        Args: { _deactivated: boolean; _target_user_id: string }
        Returns: undefined
      }
      admin_update_user_roles: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _target_user_id: string
        }
        Returns: undefined
      }
      get_trainer_member_ids: {
        Args: { _trainer_id: string }
        Returns: string[]
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_manager_or_admin: { Args: { _user_id: string }; Returns: boolean }
      is_trainer: { Args: { _user_id: string }; Returns: boolean }
      user_has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      user_has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "manager"
        | "concierge"
        | "trainer"
        | "female_spa_attendant"
        | "male_spa_attendant"
        | "floater"
      membership_tier: "basic" | "standard" | "premium" | "vip"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "manager",
        "concierge",
        "trainer",
        "female_spa_attendant",
        "male_spa_attendant",
        "floater",
      ],
      membership_tier: ["basic", "standard", "premium", "vip"],
    },
  },
} as const
