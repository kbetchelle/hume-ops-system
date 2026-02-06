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
            referencedRelation: "arketa_clients"
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
      api_credentials: {
        Row: {
          access_token: string
          api_name: string
          created_at: string
          expires_at: string
          id: string
          last_refreshed_at: string | null
          refresh_token: string | null
          token_type: string | null
          updated_at: string
        }
        Insert: {
          access_token: string
          api_name: string
          created_at?: string
          expires_at: string
          id?: string
          last_refreshed_at?: string | null
          refresh_token?: string | null
          token_type?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string
          api_name?: string
          created_at?: string
          expires_at?: string
          id?: string
          last_refreshed_at?: string | null
          refresh_token?: string | null
          token_type?: string | null
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
          updated_at: string | null
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
          updated_at?: string | null
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
          updated_at?: string | null
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
      arketa_classes: {
        Row: {
          booked_count: number | null
          capacity: number | null
          created_at: string | null
          duration_minutes: number | null
          external_id: string
          id: string
          instructor_name: string | null
          is_cancelled: boolean | null
          name: string
          raw_data: Json | null
          room_name: string | null
          start_time: string
          status: string | null
          synced_at: string | null
          waitlist_count: number | null
        }
        Insert: {
          booked_count?: number | null
          capacity?: number | null
          created_at?: string | null
          duration_minutes?: number | null
          external_id: string
          id?: string
          instructor_name?: string | null
          is_cancelled?: boolean | null
          name: string
          raw_data?: Json | null
          room_name?: string | null
          start_time: string
          status?: string | null
          synced_at?: string | null
          waitlist_count?: number | null
        }
        Update: {
          booked_count?: number | null
          capacity?: number | null
          created_at?: string | null
          duration_minutes?: number | null
          external_id?: string
          id?: string
          instructor_name?: string | null
          is_cancelled?: boolean | null
          name?: string
          raw_data?: Json | null
          room_name?: string | null
          start_time?: string
          status?: string | null
          synced_at?: string | null
          waitlist_count?: number | null
        }
        Relationships: []
      }
      arketa_classes_staging: {
        Row: {
          arketa_class_id: string
          capacity: number | null
          class_name: string
          cursor_position: string | null
          description: string | null
          end_time: string | null
          enrolled: number | null
          id: string
          instructor_id: string | null
          instructor_name: string | null
          location: string | null
          raw_data: Json | null
          signups: number | null
          staged_at: string | null
          start_time: string
          status: string | null
          sync_batch_id: string
        }
        Insert: {
          arketa_class_id: string
          capacity?: number | null
          class_name: string
          cursor_position?: string | null
          description?: string | null
          end_time?: string | null
          enrolled?: number | null
          id?: string
          instructor_id?: string | null
          instructor_name?: string | null
          location?: string | null
          raw_data?: Json | null
          signups?: number | null
          staged_at?: string | null
          start_time: string
          status?: string | null
          sync_batch_id: string
        }
        Update: {
          arketa_class_id?: string
          capacity?: number | null
          class_name?: string
          cursor_position?: string | null
          description?: string | null
          end_time?: string | null
          enrolled?: number | null
          id?: string
          instructor_id?: string | null
          instructor_name?: string | null
          location?: string | null
          raw_data?: Json | null
          signups?: number | null
          staged_at?: string | null
          start_time?: string
          status?: string | null
          sync_batch_id?: string
        }
        Relationships: []
      }
      arketa_clients: {
        Row: {
          client_email: string
          client_name: string | null
          client_phone: string | null
          client_tags: string[] | null
          created_at: string
          custom_fields: Json | null
          date_of_birth: string | null
          email_mkt_opt_in: boolean | null
          external_id: string
          id: string
          last_synced_at: string | null
          lifecycle_stage: string | null
          raw_data: Json | null
          referrer: string | null
          sms_mkt_opt_in: boolean | null
          updated_at: string
        }
        Insert: {
          client_email: string
          client_name?: string | null
          client_phone?: string | null
          client_tags?: string[] | null
          created_at?: string
          custom_fields?: Json | null
          date_of_birth?: string | null
          email_mkt_opt_in?: boolean | null
          external_id: string
          id?: string
          last_synced_at?: string | null
          lifecycle_stage?: string | null
          raw_data?: Json | null
          referrer?: string | null
          sms_mkt_opt_in?: boolean | null
          updated_at?: string
        }
        Update: {
          client_email?: string
          client_name?: string | null
          client_phone?: string | null
          client_tags?: string[] | null
          created_at?: string
          custom_fields?: Json | null
          date_of_birth?: string | null
          email_mkt_opt_in?: boolean | null
          external_id?: string
          id?: string
          last_synced_at?: string | null
          lifecycle_stage?: string | null
          raw_data?: Json | null
          referrer?: string | null
          sms_mkt_opt_in?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      arketa_clients_staging: {
        Row: {
          arketa_client_id: string
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          client_tags: string[] | null
          cursor_position: string | null
          custom_fields: Json | null
          date_of_birth: string | null
          email_mkt_opt_in: boolean | null
          id: string
          lifecycle_stage: string | null
          raw_data: Json | null
          referrer: string | null
          sms_mkt_opt_in: boolean | null
          staged_at: string | null
          sync_batch_id: string
        }
        Insert: {
          arketa_client_id: string
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          client_tags?: string[] | null
          cursor_position?: string | null
          custom_fields?: Json | null
          date_of_birth?: string | null
          email_mkt_opt_in?: boolean | null
          id?: string
          lifecycle_stage?: string | null
          raw_data?: Json | null
          referrer?: string | null
          sms_mkt_opt_in?: boolean | null
          staged_at?: string | null
          sync_batch_id: string
        }
        Update: {
          arketa_client_id?: string
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          client_tags?: string[] | null
          cursor_position?: string | null
          custom_fields?: Json | null
          date_of_birth?: string | null
          email_mkt_opt_in?: boolean | null
          id?: string
          lifecycle_stage?: string | null
          raw_data?: Json | null
          referrer?: string | null
          sms_mkt_opt_in?: boolean | null
          staged_at?: string | null
          sync_batch_id?: string
        }
        Relationships: []
      }
      arketa_instructors: {
        Row: {
          created_at: string | null
          email: string | null
          external_id: string
          first_name: string | null
          id: string
          is_active: boolean | null
          last_name: string | null
          phone: string | null
          raw_data: Json | null
          synced_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          external_id: string
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          phone?: string | null
          raw_data?: Json | null
          synced_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          external_id?: string
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          phone?: string | null
          raw_data?: Json | null
          synced_at?: string | null
        }
        Relationships: []
      }
      arketa_instructors_staging: {
        Row: {
          active: boolean | null
          arketa_instructor_id: string
          cursor_position: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          raw_data: Json | null
          role: string | null
          staged_at: string | null
          sync_batch_id: string
        }
        Insert: {
          active?: boolean | null
          arketa_instructor_id: string
          cursor_position?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          raw_data?: Json | null
          role?: string | null
          staged_at?: string | null
          sync_batch_id: string
        }
        Update: {
          active?: boolean | null
          arketa_instructor_id?: string
          cursor_position?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          raw_data?: Json | null
          role?: string | null
          staged_at?: string | null
          sync_batch_id?: string
        }
        Relationships: []
      }
      arketa_payments: {
        Row: {
          amount: number | null
          amount_refunded: number | null
          client_id: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          external_id: string
          id: string
          location_name: string | null
          net_sales: number | null
          notes: string | null
          offering_name: string | null
          payment_date: string | null
          payment_type: string | null
          promo_code: string | null
          raw_data: Json | null
          source: string | null
          status: string | null
          synced_at: string | null
          tax: number | null
          transaction_fees: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          amount_refunded?: number | null
          client_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          external_id: string
          id?: string
          location_name?: string | null
          net_sales?: number | null
          notes?: string | null
          offering_name?: string | null
          payment_date?: string | null
          payment_type?: string | null
          promo_code?: string | null
          raw_data?: Json | null
          source?: string | null
          status?: string | null
          synced_at?: string | null
          tax?: number | null
          transaction_fees?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          amount_refunded?: number | null
          client_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          external_id?: string
          id?: string
          location_name?: string | null
          net_sales?: number | null
          notes?: string | null
          offering_name?: string | null
          payment_date?: string | null
          payment_type?: string | null
          promo_code?: string | null
          raw_data?: Json | null
          source?: string | null
          status?: string | null
          synced_at?: string | null
          tax?: number | null
          transaction_fees?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      arketa_payments_staging: {
        Row: {
          amount: number | null
          arketa_payment_id: string
          client_id: string | null
          created_at: string | null
          currency: string | null
          cursor_position: string | null
          description: string | null
          id: string
          payment_type: string | null
          raw_data: Json | null
          staged_at: string | null
          status: string | null
          stripe_fees: number | null
          sync_batch_id: string
          synced_at: string | null
          tax: number | null
          total_refunded: number | null
          transaction_fees: number | null
        }
        Insert: {
          amount?: number | null
          arketa_payment_id: string
          client_id?: string | null
          created_at?: string | null
          currency?: string | null
          cursor_position?: string | null
          description?: string | null
          id?: string
          payment_type?: string | null
          raw_data?: Json | null
          staged_at?: string | null
          status?: string | null
          stripe_fees?: number | null
          sync_batch_id: string
          synced_at?: string | null
          tax?: number | null
          total_refunded?: number | null
          transaction_fees?: number | null
        }
        Update: {
          amount?: number | null
          arketa_payment_id?: string
          client_id?: string | null
          created_at?: string | null
          currency?: string | null
          cursor_position?: string | null
          description?: string | null
          id?: string
          payment_type?: string | null
          raw_data?: Json | null
          staged_at?: string | null
          status?: string | null
          stripe_fees?: number | null
          sync_batch_id?: string
          synced_at?: string | null
          tax?: number | null
          total_refunded?: number | null
          transaction_fees?: number | null
        }
        Relationships: []
      }
      arketa_reservations: {
        Row: {
          booking_id: string | null
          canceled_at: string | null
          canceled_by: string | null
          checked_in: boolean | null
          checked_in_at: string | null
          class_id: string
          class_name: string | null
          class_time: string | null
          client_email: string | null
          client_id: string | null
          client_name: string | null
          coupon_code: string | null
          created_at: string | null
          date_purchased: string | null
          email_marketing_opt_in: boolean | null
          estimated_gross_revenue: number | null
          estimated_net_revenue: number | null
          experience_type: string | null
          external_id: string | null
          first_name: string | null
          gross_amount_paid: number | null
          id: string
          instructor_name: string | null
          last_name: string | null
          late_cancel: boolean | null
          location_address: string | null
          location_name: string | null
          milestone: string | null
          net_amount_paid: number | null
          offering_id: string | null
          package_name: string | null
          package_period_end: string | null
          package_period_start: string | null
          payment_id: string | null
          payment_method: string | null
          purchase_id: string | null
          purchase_type: string | null
          raw_data: Json | null
          reservation_id: string | null
          reservation_type: string | null
          service_id: string | null
          status: string | null
          synced_at: string | null
          tags: string | null
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          canceled_at?: string | null
          canceled_by?: string | null
          checked_in?: boolean | null
          checked_in_at?: string | null
          class_id: string
          class_name?: string | null
          class_time?: string | null
          client_email?: string | null
          client_id?: string | null
          client_name?: string | null
          coupon_code?: string | null
          created_at?: string | null
          date_purchased?: string | null
          email_marketing_opt_in?: boolean | null
          estimated_gross_revenue?: number | null
          estimated_net_revenue?: number | null
          experience_type?: string | null
          external_id?: string | null
          first_name?: string | null
          gross_amount_paid?: number | null
          id?: string
          instructor_name?: string | null
          last_name?: string | null
          late_cancel?: boolean | null
          location_address?: string | null
          location_name?: string | null
          milestone?: string | null
          net_amount_paid?: number | null
          offering_id?: string | null
          package_name?: string | null
          package_period_end?: string | null
          package_period_start?: string | null
          payment_id?: string | null
          payment_method?: string | null
          purchase_id?: string | null
          purchase_type?: string | null
          raw_data?: Json | null
          reservation_id?: string | null
          reservation_type?: string | null
          service_id?: string | null
          status?: string | null
          synced_at?: string | null
          tags?: string | null
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          canceled_at?: string | null
          canceled_by?: string | null
          checked_in?: boolean | null
          checked_in_at?: string | null
          class_id?: string
          class_name?: string | null
          class_time?: string | null
          client_email?: string | null
          client_id?: string | null
          client_name?: string | null
          coupon_code?: string | null
          created_at?: string | null
          date_purchased?: string | null
          email_marketing_opt_in?: boolean | null
          estimated_gross_revenue?: number | null
          estimated_net_revenue?: number | null
          experience_type?: string | null
          external_id?: string | null
          first_name?: string | null
          gross_amount_paid?: number | null
          id?: string
          instructor_name?: string | null
          last_name?: string | null
          late_cancel?: boolean | null
          location_address?: string | null
          location_name?: string | null
          milestone?: string | null
          net_amount_paid?: number | null
          offering_id?: string | null
          package_name?: string | null
          package_period_end?: string | null
          package_period_start?: string | null
          payment_id?: string | null
          payment_method?: string | null
          purchase_id?: string | null
          purchase_type?: string | null
          raw_data?: Json | null
          reservation_id?: string | null
          reservation_type?: string | null
          service_id?: string | null
          status?: string | null
          synced_at?: string | null
          tags?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      arketa_reservations_staging: {
        Row: {
          arketa_class_id: string
          arketa_reservation_id: string | null
          cancelled_at: string | null
          checked_in: boolean | null
          checked_in_at: string | null
          client_email: string | null
          client_id: string | null
          client_name: string | null
          created_at: string | null
          cursor_position: string | null
          id: string
          raw_data: Json | null
          reservation_id: string
          staged_at: string | null
          status: string | null
          sync_batch_id: string
          synced_at: string | null
        }
        Insert: {
          arketa_class_id: string
          arketa_reservation_id?: string | null
          cancelled_at?: string | null
          checked_in?: boolean | null
          checked_in_at?: string | null
          client_email?: string | null
          client_id?: string | null
          client_name?: string | null
          created_at?: string | null
          cursor_position?: string | null
          id?: string
          raw_data?: Json | null
          reservation_id: string
          staged_at?: string | null
          status?: string | null
          sync_batch_id: string
          synced_at?: string | null
        }
        Update: {
          arketa_class_id?: string
          arketa_reservation_id?: string | null
          cancelled_at?: string | null
          checked_in?: boolean | null
          checked_in_at?: string | null
          client_email?: string | null
          client_id?: string | null
          client_name?: string | null
          created_at?: string | null
          cursor_position?: string | null
          id?: string
          raw_data?: Json | null
          reservation_id?: string
          staged_at?: string | null
          status?: string | null
          sync_batch_id?: string
          synced_at?: string | null
        }
        Relationships: []
      }
      arketa_subscriptions: {
        Row: {
          api_updated_at: string | null
          cancel_at_date: string | null
          cancellation_date: string | null
          client_email: string | null
          client_id: string | null
          created_at: string | null
          end_date: string | null
          external_id: string
          has_payment_method: boolean | null
          id: string
          name: string | null
          next_renewal_date: string | null
          offering_id: string | null
          pause_end_date: string | null
          pause_start_date: string | null
          price: number | null
          raw_data: Json | null
          remaining_uses: number | null
          start_date: string | null
          status: string | null
          substatus: string | null
          synced_at: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          api_updated_at?: string | null
          cancel_at_date?: string | null
          cancellation_date?: string | null
          client_email?: string | null
          client_id?: string | null
          created_at?: string | null
          end_date?: string | null
          external_id: string
          has_payment_method?: boolean | null
          id?: string
          name?: string | null
          next_renewal_date?: string | null
          offering_id?: string | null
          pause_end_date?: string | null
          pause_start_date?: string | null
          price?: number | null
          raw_data?: Json | null
          remaining_uses?: number | null
          start_date?: string | null
          status?: string | null
          substatus?: string | null
          synced_at?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          api_updated_at?: string | null
          cancel_at_date?: string | null
          cancellation_date?: string | null
          client_email?: string | null
          client_id?: string | null
          created_at?: string | null
          end_date?: string | null
          external_id?: string
          has_payment_method?: boolean | null
          id?: string
          name?: string | null
          next_renewal_date?: string | null
          offering_id?: string | null
          pause_end_date?: string | null
          pause_start_date?: string | null
          price?: number | null
          raw_data?: Json | null
          remaining_uses?: number | null
          start_date?: string | null
          status?: string | null
          substatus?: string | null
          synced_at?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      arketa_subscriptions_staging: {
        Row: {
          arketa_subscription_id: string
          id: string
          raw_data: Json
          staged_at: string | null
          sync_batch_id: string
        }
        Insert: {
          arketa_subscription_id: string
          id?: string
          raw_data: Json
          staged_at?: string | null
          sync_batch_id: string
        }
        Update: {
          arketa_subscription_id?: string
          id?: string
          raw_data?: Json
          staged_at?: string | null
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
      backfill_jobs: {
        Row: {
          api_source: string
          batch_cursor: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          cumulative_inserted: number | null
          cumulative_updated: number | null
          current_batch_count: number | null
          data_type: string
          days_processed: number
          end_date: string
          errors: Json | null
          id: string
          last_batch_synced_at: string | null
          last_cursor: string | null
          no_more_records: boolean | null
          processing_date: string | null
          records_in_current_batch: number | null
          records_inserted: number | null
          records_processed: number
          records_updated: number | null
          retry_scheduled_at: string | null
          staging_synced: boolean | null
          start_date: string
          started_at: string | null
          status: string
          sync_phase: string | null
          total_batches_completed: number | null
          total_days: number
          total_records_expected: number | null
        }
        Insert: {
          api_source: string
          batch_cursor?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          cumulative_inserted?: number | null
          cumulative_updated?: number | null
          current_batch_count?: number | null
          data_type: string
          days_processed?: number
          end_date: string
          errors?: Json | null
          id?: string
          last_batch_synced_at?: string | null
          last_cursor?: string | null
          no_more_records?: boolean | null
          processing_date?: string | null
          records_in_current_batch?: number | null
          records_inserted?: number | null
          records_processed?: number
          records_updated?: number | null
          retry_scheduled_at?: string | null
          staging_synced?: boolean | null
          start_date: string
          started_at?: string | null
          status?: string
          sync_phase?: string | null
          total_batches_completed?: number | null
          total_days?: number
          total_records_expected?: number | null
        }
        Update: {
          api_source?: string
          batch_cursor?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          cumulative_inserted?: number | null
          cumulative_updated?: number | null
          current_batch_count?: number | null
          data_type?: string
          days_processed?: number
          end_date?: string
          errors?: Json | null
          id?: string
          last_batch_synced_at?: string | null
          last_cursor?: string | null
          no_more_records?: boolean | null
          processing_date?: string | null
          records_in_current_batch?: number | null
          records_inserted?: number | null
          records_processed?: number
          records_updated?: number | null
          retry_scheduled_at?: string | null
          staging_synced?: boolean | null
          start_date?: string
          started_at?: string | null
          status?: string
          sync_phase?: string | null
          total_batches_completed?: number | null
          total_days?: number
          total_records_expected?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "backfill_jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      boh_checklist_items: {
        Row: {
          category: string | null
          checklist_id: string | null
          color: string | null
          created_at: string | null
          id: string
          is_class_triggered: boolean | null
          is_high_priority: boolean | null
          label_spanish: string | null
          required: boolean | null
          sort_order: number
          task_description: string
          task_type: string
          time_hint: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          checklist_id?: string | null
          color?: string | null
          created_at?: string | null
          id?: string
          is_class_triggered?: boolean | null
          is_high_priority?: boolean | null
          label_spanish?: string | null
          required?: boolean | null
          sort_order: number
          task_description: string
          task_type: string
          time_hint?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          checklist_id?: string | null
          color?: string | null
          created_at?: string | null
          id?: string
          is_class_triggered?: boolean | null
          is_high_priority?: boolean | null
          label_spanish?: string | null
          required?: boolean | null
          sort_order?: number
          task_description?: string
          task_type?: string
          time_hint?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "boh_checklist_items_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "boh_checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      boh_checklists: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_weekend: boolean | null
          role_type: string
          shift_time: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_weekend?: boolean | null
          role_type: string
          shift_time: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_weekend?: boolean | null
          role_type?: string
          shift_time?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      boh_completions: {
        Row: {
          checklist_id: string | null
          completed_at: string | null
          completed_by: string | null
          completed_by_id: string | null
          completion_date: string
          created_at: string | null
          deleted_at: string | null
          id: string
          item_id: string | null
          note_text: string | null
          photo_url: string | null
          shift_time: string
          signature_data: string | null
          submitted_at: string | null
        }
        Insert: {
          checklist_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          completed_by_id?: string | null
          completion_date: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          item_id?: string | null
          note_text?: string | null
          photo_url?: string | null
          shift_time: string
          signature_data?: string | null
          submitted_at?: string | null
        }
        Update: {
          checklist_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          completed_by_id?: string | null
          completion_date?: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          item_id?: string | null
          note_text?: string | null
          photo_url?: string | null
          shift_time?: string
          signature_data?: string | null
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "boh_completions_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "boh_checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boh_completions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "boh_checklist_items"
            referencedColumns: ["id"]
          },
        ]
      }
      bug_reports: {
        Row: {
          category: string | null
          created_at: string | null
          description: string
          id: string
          page_url: string | null
          screenshot_url: string | null
          severity: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description: string
          id?: string
          page_url?: string | null
          screenshot_url?: string | null
          severity?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string
          id?: string
          page_url?: string | null
          screenshot_url?: string | null
          severity?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      build_status: {
        Row: {
          category: string
          created_at: string
          id: string
          notes: string | null
          status: string
          task: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          task: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          task?: string
          updated_at?: string
        }
        Relationships: []
      }
      cafe_checklist_items: {
        Row: {
          category: string | null
          checklist_id: string | null
          color: string | null
          created_at: string | null
          id: string
          is_class_triggered: boolean | null
          is_high_priority: boolean | null
          label_spanish: string | null
          required: boolean | null
          sort_order: number
          task_description: string
          task_type: string
          time_hint: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          checklist_id?: string | null
          color?: string | null
          created_at?: string | null
          id?: string
          is_class_triggered?: boolean | null
          is_high_priority?: boolean | null
          label_spanish?: string | null
          required?: boolean | null
          sort_order: number
          task_description: string
          task_type: string
          time_hint?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          checklist_id?: string | null
          color?: string | null
          created_at?: string | null
          id?: string
          is_class_triggered?: boolean | null
          is_high_priority?: boolean | null
          label_spanish?: string | null
          required?: boolean | null
          sort_order?: number
          task_description?: string
          task_type?: string
          time_hint?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cafe_checklist_items_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "cafe_checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      cafe_checklists: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_weekend: boolean | null
          shift_time: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_weekend?: boolean | null
          shift_time: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_weekend?: boolean | null
          shift_time?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cafe_completions: {
        Row: {
          checklist_id: string | null
          completed_at: string | null
          completed_by: string | null
          completed_by_id: string | null
          completion_date: string
          created_at: string | null
          deleted_at: string | null
          id: string
          item_id: string | null
          note_text: string | null
          photo_url: string | null
          shift_time: string
          signature_data: string | null
          submitted_at: string | null
        }
        Insert: {
          checklist_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          completed_by_id?: string | null
          completion_date: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          item_id?: string | null
          note_text?: string | null
          photo_url?: string | null
          shift_time: string
          signature_data?: string | null
          submitted_at?: string | null
        }
        Update: {
          checklist_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          completed_by_id?: string | null
          completion_date?: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          item_id?: string | null
          note_text?: string | null
          photo_url?: string | null
          shift_time?: string
          signature_data?: string | null
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cafe_completions_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "cafe_checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cafe_completions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "cafe_checklist_items"
            referencedColumns: ["id"]
          },
        ]
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
      celebratory_events: {
        Row: {
          created_at: string | null
          event_date: string | null
          event_type: string
          id: string
          member_name: string
          reported_by: string | null
          reported_date: string
          shift_type: string | null
        }
        Insert: {
          created_at?: string | null
          event_date?: string | null
          event_type: string
          id?: string
          member_name: string
          reported_by?: string | null
          reported_date: string
          shift_type?: string | null
        }
        Update: {
          created_at?: string | null
          event_date?: string | null
          event_type?: string
          id?: string
          member_name?: string
          reported_by?: string | null
          reported_date?: string
          shift_type?: string | null
        }
        Relationships: []
      }
      checklist_shift_submissions: {
        Row: {
          completed_tasks: number
          completion_date: string
          department: string
          id: string
          notes: string | null
          position: string | null
          shift_time: string
          submitted_at: string
          submitted_by: string
          submitted_by_id: string | null
          total_tasks: number
        }
        Insert: {
          completed_tasks: number
          completion_date: string
          department: string
          id?: string
          notes?: string | null
          position?: string | null
          shift_time: string
          submitted_at?: string
          submitted_by: string
          submitted_by_id?: string | null
          total_tasks: number
        }
        Update: {
          completed_tasks?: number
          completion_date?: string
          department?: string
          id?: string
          notes?: string | null
          position?: string | null
          shift_time?: string
          submitted_at?: string
          submitted_by?: string
          submitted_by_id?: string | null
          total_tasks?: number
        }
        Relationships: []
      }
      checklist_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          department: string | null
          id: string
          is_active: boolean | null
          name: string
          position: string | null
          role: string | null
          shift_time: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          position?: string | null
          role?: string | null
          shift_time: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          position?: string | null
          role?: string | null
          shift_time?: string
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
      client_sync_log: {
        Row: {
          completed_at: string | null
          error_message: string | null
          failed_record_ids: string[] | null
          failure_count: number | null
          id: string
          records_synced: number | null
          retry_attempts: number | null
          started_at: string
          status: string
          success_count: number | null
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          failed_record_ids?: string[] | null
          failure_count?: number | null
          id?: string
          records_synced?: number | null
          retry_attempts?: number | null
          started_at?: string
          status?: string
          success_count?: number | null
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          failed_record_ids?: string[] | null
          failure_count?: number | null
          id?: string
          records_synced?: number | null
          retry_attempts?: number | null
          started_at?: string
          status?: string
          success_count?: number | null
        }
        Relationships: []
      }
      club_policies: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          id: string
          is_active: boolean | null
          last_updated_by: string | null
          sort_order: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_updated_by?: string | null
          sort_order?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_updated_by?: string | null
          sort_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      concierge_checklist_items: {
        Row: {
          category: string | null
          checklist_id: string | null
          color: string | null
          created_at: string | null
          id: string
          is_class_triggered: boolean | null
          is_high_priority: boolean | null
          label_spanish: string | null
          required: boolean | null
          sort_order: number
          task_description: string
          task_type: string
          time_hint: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          checklist_id?: string | null
          color?: string | null
          created_at?: string | null
          id?: string
          is_class_triggered?: boolean | null
          is_high_priority?: boolean | null
          label_spanish?: string | null
          required?: boolean | null
          sort_order: number
          task_description: string
          task_type: string
          time_hint?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          checklist_id?: string | null
          color?: string | null
          created_at?: string | null
          id?: string
          is_class_triggered?: boolean | null
          is_high_priority?: boolean | null
          label_spanish?: string | null
          required?: boolean | null
          sort_order?: number
          task_description?: string
          task_type?: string
          time_hint?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "concierge_checklist_items_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "concierge_checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      concierge_checklists: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_weekend: boolean | null
          shift_time: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_weekend?: boolean | null
          shift_time: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_weekend?: boolean | null
          shift_time?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      concierge_completions: {
        Row: {
          checklist_id: string | null
          completed_at: string | null
          completed_by: string | null
          completed_by_id: string | null
          completion_date: string
          created_at: string | null
          deleted_at: string | null
          id: string
          item_id: string | null
          note_text: string | null
          photo_url: string | null
          shift_time: string
          signature_data: string | null
          submitted_at: string | null
        }
        Insert: {
          checklist_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          completed_by_id?: string | null
          completion_date: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          item_id?: string | null
          note_text?: string | null
          photo_url?: string | null
          shift_time: string
          signature_data?: string | null
          submitted_at?: string | null
        }
        Update: {
          checklist_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          completed_by_id?: string | null
          completion_date?: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          item_id?: string | null
          note_text?: string | null
          photo_url?: string | null
          shift_time?: string
          signature_data?: string | null
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "concierge_completions_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "concierge_checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concierge_completions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "concierge_checklist_items"
            referencedColumns: ["id"]
          },
        ]
      }
      concierge_drafts: {
        Row: {
          created_at: string | null
          form_data: Json
          id: string
          last_updated_by: string | null
          last_updated_by_session: string | null
          report_date: string
          shift_time: string
          updated_at: string | null
          version: number
        }
        Insert: {
          created_at?: string | null
          form_data?: Json
          id?: string
          last_updated_by?: string | null
          last_updated_by_session?: string | null
          report_date: string
          shift_time: string
          updated_at?: string | null
          version?: number
        }
        Update: {
          created_at?: string | null
          form_data?: Json
          id?: string
          last_updated_by?: string | null
          last_updated_by_session?: string | null
          report_date?: string
          shift_time?: string
          updated_at?: string | null
          version?: number
        }
        Relationships: []
      }
      daily_report_history: {
        Row: {
          arketa_payments: Json | null
          arketa_reservations: Json | null
          busiest_areas: string | null
          celebratory_events: Json | null
          celebratory_events_na: boolean | null
          created_at: string
          facility_issues: Json | null
          future_shift_notes: Json | null
          future_shift_notes_na: boolean | null
          id: string
          management_notes: string | null
          member_feedback: Json | null
          membership_requests: Json | null
          report_date: string
          scheduled_tours: Json | null
          screenshot: string | null
          shift_type: string
          sling_shift_data: Json | null
          staff_name: string | null
          staff_user_id: string
          status: string | null
          submitted_at: string | null
          system_issues: Json | null
          system_issues_na: boolean | null
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
          celebratory_events_na?: boolean | null
          created_at?: string
          facility_issues?: Json | null
          future_shift_notes?: Json | null
          future_shift_notes_na?: boolean | null
          id?: string
          management_notes?: string | null
          member_feedback?: Json | null
          membership_requests?: Json | null
          report_date: string
          scheduled_tours?: Json | null
          screenshot?: string | null
          shift_type: string
          sling_shift_data?: Json | null
          staff_name?: string | null
          staff_user_id: string
          status?: string | null
          submitted_at?: string | null
          system_issues?: Json | null
          system_issues_na?: boolean | null
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
          celebratory_events_na?: boolean | null
          created_at?: string
          facility_issues?: Json | null
          future_shift_notes?: Json | null
          future_shift_notes_na?: boolean | null
          id?: string
          management_notes?: string | null
          member_feedback?: Json | null
          membership_requests?: Json | null
          report_date?: string
          scheduled_tours?: Json | null
          screenshot?: string | null
          shift_type?: string
          sling_shift_data?: Json | null
          staff_name?: string | null
          staff_user_id?: string
          status?: string | null
          submitted_at?: string | null
          system_issues?: Json | null
          system_issues_na?: boolean | null
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
      daily_sales: {
        Row: {
          business_date: string
          created_at: string
          id: string
          payment_breakdown: Json | null
          raw_data: Json | null
          synced_at: string
          top_items: Json | null
          total_sales: number | null
          total_transactions: number | null
        }
        Insert: {
          business_date: string
          created_at?: string
          id?: string
          payment_breakdown?: Json | null
          raw_data?: Json | null
          synced_at?: string
          top_items?: Json | null
          total_sales?: number | null
          total_transactions?: number | null
        }
        Update: {
          business_date?: string
          created_at?: string
          id?: string
          payment_breakdown?: Json | null
          raw_data?: Json | null
          synced_at?: string
          top_items?: Json | null
          total_sales?: number | null
          total_transactions?: number | null
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
      dev_notes: {
        Row: {
          content: string
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: string
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: string
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      dev_tasks: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
          status: Database["public"]["Enums"]["dev_task_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          status?: Database["public"]["Enums"]["dev_task_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["dev_task_status"]
          updated_at?: string
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
      facility_issues_tracker: {
        Row: {
          created_at: string | null
          description: string
          id: string
          photo_url: string | null
          reported_by: string | null
          reported_date: string
          resolved_at: string | null
          resolved_by: string | null
          shift_type: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          photo_url?: string | null
          reported_by?: string | null
          reported_date: string
          resolved_at?: string | null
          resolved_by?: string | null
          shift_type?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          photo_url?: string | null
          reported_by?: string | null
          reported_date?: string
          resolved_at?: string | null
          resolved_by?: string | null
          shift_type?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      foh_questions: {
        Row: {
          created_at: string | null
          description: string
          id: string
          issue_type: string
          photo_url: string | null
          reported_by: string | null
          reported_date: string
          resolution_notes: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          shift_type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          issue_type: string
          photo_url?: string | null
          reported_by?: string | null
          reported_date: string
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          shift_type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          issue_type?: string
          photo_url?: string | null
          reported_by?: string | null
          reported_date?: string
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          shift_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      lost_and_found: {
        Row: {
          claimed_by: string | null
          claimed_date: string | null
          created_at: string | null
          date_found: string | null
          description: string
          found_by_id: string | null
          found_by_name: string | null
          id: string
          location_found: string | null
          member_requested: boolean | null
          notes: string | null
          object_category:
            | Database["public"]["Enums"]["lost_and_found_category"]
            | null
          photo_url: string | null
          status: string | null
        }
        Insert: {
          claimed_by?: string | null
          claimed_date?: string | null
          created_at?: string | null
          date_found?: string | null
          description: string
          found_by_id?: string | null
          found_by_name?: string | null
          id?: string
          location_found?: string | null
          member_requested?: boolean | null
          notes?: string | null
          object_category?:
            | Database["public"]["Enums"]["lost_and_found_category"]
            | null
          photo_url?: string | null
          status?: string | null
        }
        Update: {
          claimed_by?: string | null
          claimed_date?: string | null
          created_at?: string | null
          date_found?: string | null
          description?: string
          found_by_id?: string | null
          found_by_name?: string | null
          id?: string
          location_found?: string | null
          member_requested?: boolean | null
          notes?: string | null
          object_category?:
            | Database["public"]["Enums"]["lost_and_found_category"]
            | null
          photo_url?: string | null
          status?: string | null
        }
        Relationships: []
      }
      lost_and_found_member_requests: {
        Row: {
          created_at: string
          created_by_id: string | null
          date_inquired: string | null
          description: string
          id: string
          matched_item_id: string | null
          member_contact: string | null
          member_name: string | null
          notes: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_id?: string | null
          date_inquired?: string | null
          description: string
          id?: string
          matched_item_id?: string | null
          member_contact?: string | null
          member_name?: string | null
          notes?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_id?: string | null
          date_inquired?: string | null
          description?: string
          id?: string
          matched_item_id?: string | null
          member_contact?: string | null
          member_name?: string | null
          notes?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lost_and_found_member_requests_matched_item_id_fkey"
            columns: ["matched_item_id"]
            isOneToOne: false
            referencedRelation: "lost_and_found"
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
            referencedRelation: "arketa_clients"
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
            referencedRelation: "arketa_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      page_dev_status: {
        Row: {
          created_at: string
          id: string
          page_path: string
          page_title: string
          role_category: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          page_path: string
          page_title: string
          role_category?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          page_path?: string
          page_title?: string
          role_category?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      policy_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
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
          sling_id: string | null
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
          sling_id?: string | null
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
          sling_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_sling_id_fkey"
            columns: ["sling_id"]
            isOneToOne: false
            referencedRelation: "sling_users"
            referencedColumns: ["id"]
          },
        ]
      }
      quick_links: {
        Row: {
          category: string
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          sort_order: number | null
          title: string
          url: string
        }
        Insert: {
          category: string
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          title: string
          url: string
        }
        Update: {
          category?: string
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          title?: string
          url?: string
        }
        Relationships: []
      }
      response_templates: {
        Row: {
          category: string
          category_order: number | null
          content: string
          created_at: string | null
          id: string
          is_active: boolean | null
          is_outdated: boolean | null
          marked_outdated_at: string | null
          marked_outdated_by: string | null
          marked_outdated_by_name: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          updated_by: string | null
          updated_by_name: string | null
        }
        Insert: {
          category: string
          category_order?: number | null
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_outdated?: boolean | null
          marked_outdated_at?: string | null
          marked_outdated_by?: string | null
          marked_outdated_by_name?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          updated_by?: string | null
          updated_by_name?: string | null
        }
        Update: {
          category?: string
          category_order?: number | null
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_outdated?: boolean | null
          marked_outdated_at?: string | null
          marked_outdated_by?: string | null
          marked_outdated_by_name?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          updated_by?: string | null
          updated_by_name?: string | null
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
      scheduled_tours_staging: {
        Row: {
          calendly_event_id: string
          created_at: string | null
          end_time: string | null
          event_type: string | null
          event_uri: string | null
          id: string
          invitee_email: string | null
          invitee_name: string | null
          invitee_phone: string | null
          invitee_questions_answers: Json | null
          raw_event_data: Json | null
          raw_invitee_data: Json | null
          start_time: string
          status: string | null
        }
        Insert: {
          calendly_event_id: string
          created_at?: string | null
          end_time?: string | null
          event_type?: string | null
          event_uri?: string | null
          id?: string
          invitee_email?: string | null
          invitee_name?: string | null
          invitee_phone?: string | null
          invitee_questions_answers?: Json | null
          raw_event_data?: Json | null
          raw_invitee_data?: Json | null
          start_time: string
          status?: string | null
        }
        Update: {
          calendly_event_id?: string
          created_at?: string | null
          end_time?: string | null
          event_type?: string | null
          event_uri?: string | null
          id?: string
          invitee_email?: string | null
          invitee_name?: string | null
          invitee_phone?: string | null
          invitee_questions_answers?: Json | null
          raw_event_data?: Json | null
          raw_invitee_data?: Json | null
          start_time?: string
          status?: string | null
        }
        Relationships: []
      }
      shift_reports: {
        Row: {
          facility_issues: string | null
          form_data: Json | null
          handoff_notes: string | null
          id: string
          incidents: string | null
          is_draft: boolean | null
          member_feedback: string | null
          report_date: string
          shift_type: string
          submitted_at: string | null
          submitted_by: string | null
          submitted_by_id: string | null
          summary: string | null
          tour_notes: string | null
          weather: string | null
        }
        Insert: {
          facility_issues?: string | null
          form_data?: Json | null
          handoff_notes?: string | null
          id?: string
          incidents?: string | null
          is_draft?: boolean | null
          member_feedback?: string | null
          report_date: string
          shift_type: string
          submitted_at?: string | null
          submitted_by?: string | null
          submitted_by_id?: string | null
          summary?: string | null
          tour_notes?: string | null
          weather?: string | null
        }
        Update: {
          facility_issues?: string | null
          form_data?: Json | null
          handoff_notes?: string | null
          id?: string
          incidents?: string | null
          is_draft?: boolean | null
          member_feedback?: string | null
          report_date?: string
          shift_type?: string
          submitted_at?: string | null
          submitted_by?: string | null
          submitted_by_id?: string | null
          summary?: string | null
          tour_notes?: string | null
          weather?: string | null
        }
        Relationships: []
      }
      sling_shifts_staging: {
        Row: {
          cursor_position: string | null
          employee_name: string | null
          id: string
          location: string | null
          position_id: number | null
          position_name: string | null
          raw_data: Json | null
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
          cursor_position?: string | null
          employee_name?: string | null
          id?: string
          location?: string | null
          position_id?: number | null
          position_name?: string | null
          raw_data?: Json | null
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
          cursor_position?: string | null
          employee_name?: string | null
          id?: string
          location?: string | null
          position_id?: number | null
          position_name?: string | null
          raw_data?: Json | null
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
      sling_sync_log: {
        Row: {
          completed_at: string | null
          error_message: string | null
          failed_record_ids: string[] | null
          failure_count: number | null
          id: string
          records_synced: number | null
          retry_attempts: number | null
          started_at: string
          status: string
          success_count: number | null
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          failed_record_ids?: string[] | null
          failure_count?: number | null
          id?: string
          records_synced?: number | null
          retry_attempts?: number | null
          started_at?: string
          status?: string
          success_count?: number | null
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          failed_record_ids?: string[] | null
          failure_count?: number | null
          id?: string
          records_synced?: number | null
          retry_attempts?: number | null
          started_at?: string
          status?: string
          success_count?: number | null
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
          position_id: number | null
          position_name: string | null
          positions: string[] | null
          raw_data: Json | null
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
          position_id?: number | null
          position_name?: string | null
          positions?: string[] | null
          raw_data?: Json | null
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
          position_id?: number | null
          position_name?: string | null
          positions?: string[] | null
          raw_data?: Json | null
          sling_created_at?: string | null
          sling_user_id?: number
        }
        Relationships: []
      }
      sling_users_staging: {
        Row: {
          email: string | null
          first_name: string | null
          id: string
          is_active: boolean | null
          last_name: string | null
          position_id: number | null
          position_name: string | null
          positions: string[] | null
          raw_data: Json | null
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
          position_id?: number | null
          position_name?: string | null
          positions?: string[] | null
          raw_data?: Json | null
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
          position_id?: number | null
          position_name?: string | null
          positions?: string[] | null
          raw_data?: Json | null
          sling_user_id?: number
          staged_at?: string | null
          sync_batch_id?: string
        }
        Relationships: []
      }
      staff_announcement_comments: {
        Row: {
          announcement_id: string
          comment: string
          created_at: string
          id: string
          user_id: string | null
          user_name: string
        }
        Insert: {
          announcement_id: string
          comment: string
          created_at?: string
          id?: string
          user_id?: string | null
          user_name: string
        }
        Update: {
          announcement_id?: string
          comment?: string
          created_at?: string
          id?: string
          user_id?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_announcement_comments_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_announcement_reads: {
        Row: {
          announcement_id: string | null
          id: string
          read_at: string | null
          staff_id: string | null
        }
        Insert: {
          announcement_id?: string | null
          id?: string
          read_at?: string | null
          staff_id?: string | null
        }
        Update: {
          announcement_id?: string | null
          id?: string
          read_at?: string | null
          staff_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "staff_announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_announcements: {
        Row: {
          announcement_type: string | null
          content: string
          created_at: string | null
          created_by: string
          created_by_id: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          photo_url: string | null
          priority: string | null
          scheduled_at: string | null
          target_departments: string[] | null
          title: string
          week_start_date: string | null
        }
        Insert: {
          announcement_type?: string | null
          content: string
          created_at?: string | null
          created_by: string
          created_by_id?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          photo_url?: string | null
          priority?: string | null
          scheduled_at?: string | null
          target_departments?: string[] | null
          title: string
          week_start_date?: string | null
        }
        Update: {
          announcement_type?: string | null
          content?: string
          created_at?: string | null
          created_by?: string
          created_by_id?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          photo_url?: string | null
          priority?: string | null
          scheduled_at?: string | null
          target_departments?: string[] | null
          title?: string
          week_start_date?: string | null
        }
        Relationships: []
      }
      staff_documents: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          is_active: boolean | null
          target_roles: string[] | null
          title: string
          updated_at: string | null
          uploaded_by: string | null
          uploaded_by_id: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          is_active?: boolean | null
          target_roles?: string[] | null
          title: string
          updated_at?: string | null
          uploaded_by?: string | null
          uploaded_by_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          is_active?: boolean | null
          target_roles?: string[] | null
          title?: string
          updated_at?: string | null
          uploaded_by?: string | null
          uploaded_by_id?: string | null
        }
        Relationships: []
      }
      staff_message_reads: {
        Row: {
          id: string
          message_id: string | null
          read_at: string | null
          staff_id: string | null
        }
        Insert: {
          id?: string
          message_id?: string | null
          read_at?: string | null
          staff_id?: string | null
        }
        Update: {
          id?: string
          message_id?: string | null
          read_at?: string | null
          staff_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_message_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "staff_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_sent: boolean | null
          recipient_ids: string[] | null
          sender_id: string | null
          sender_name: string | null
          subject: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_sent?: boolean | null
          recipient_ids?: string[] | null
          sender_id?: string | null
          sender_name?: string | null
          subject?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_sent?: boolean | null
          recipient_ids?: string[] | null
          sender_id?: string | null
          sender_name?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      staff_notifications: {
        Row: {
          body: string | null
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      staff_qa: {
        Row: {
          answer: string | null
          answer_type: string | null
          answered_by_id: string | null
          answered_by_name: string | null
          asked_by_id: string | null
          asked_by_name: string
          context: string | null
          created_at: string | null
          id: string
          is_public: boolean | null
          is_resolved: boolean | null
          linked_policy_id: string | null
          parent_id: string | null
          question: string
          updated_at: string | null
        }
        Insert: {
          answer?: string | null
          answer_type?: string | null
          answered_by_id?: string | null
          answered_by_name?: string | null
          asked_by_id?: string | null
          asked_by_name: string
          context?: string | null
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          is_resolved?: boolean | null
          linked_policy_id?: string | null
          parent_id?: string | null
          question: string
          updated_at?: string | null
        }
        Update: {
          answer?: string | null
          answer_type?: string | null
          answered_by_id?: string | null
          answered_by_name?: string | null
          asked_by_id?: string | null
          asked_by_name?: string
          context?: string | null
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          is_resolved?: boolean | null
          linked_policy_id?: string | null
          parent_id?: string | null
          question?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_qa_linked_policy_id_fkey"
            columns: ["linked_policy_id"]
            isOneToOne: false
            referencedRelation: "club_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_qa_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "staff_qa"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_qa_reads: {
        Row: {
          id: string
          qa_id: string | null
          read_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          qa_id?: string | null
          read_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          qa_id?: string | null
          read_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_qa_reads_qa_id_fkey"
            columns: ["qa_id"]
            isOneToOne: false
            referencedRelation: "staff_qa"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_shifts: {
        Row: {
          created_at: string
          external_id: string
          id: string
          position: string | null
          raw_data: Json | null
          shift_date: string | null
          shift_end: string
          shift_start: string
          sling_shift_id: number | null
          sling_user_id: number | null
          status: string | null
          synced_at: string
          user_name: string | null
        }
        Insert: {
          created_at?: string
          external_id: string
          id?: string
          position?: string | null
          raw_data?: Json | null
          shift_date?: string | null
          shift_end: string
          shift_start: string
          sling_shift_id?: number | null
          sling_user_id?: number | null
          status?: string | null
          synced_at?: string
          user_name?: string | null
        }
        Update: {
          created_at?: string
          external_id?: string
          id?: string
          position?: string | null
          raw_data?: Json | null
          shift_date?: string | null
          shift_end?: string
          shift_start?: string
          sling_shift_id?: number | null
          sling_user_id?: number | null
          status?: string | null
          synced_at?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_staff_shifts_sling_user"
            columns: ["sling_user_id"]
            isOneToOne: false
            referencedRelation: "sling_users"
            referencedColumns: ["sling_user_id"]
          },
        ]
      }
      storage_deletion_queue: {
        Row: {
          bucket_name: string
          created_at: string
          error_message: string | null
          file_path: string
          id: string
          processed_at: string | null
          scheduled_at: string
        }
        Insert: {
          bucket_name: string
          created_at?: string
          error_message?: string | null
          file_path: string
          id?: string
          processed_at?: string | null
          scheduled_at?: string
        }
        Update: {
          bucket_name?: string
          created_at?: string
          error_message?: string | null
          file_path?: string
          id?: string
          processed_at?: string | null
          scheduled_at?: string
        }
        Relationships: []
      }
      sync_metrics: {
        Row: {
          completed_at: string | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          records_failed: number | null
          records_fetched: number | null
          records_synced: number | null
          retry_count: number | null
          started_at: string
          sync_type: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          records_failed?: number | null
          records_fetched?: number | null
          records_synced?: number | null
          retry_count?: number | null
          started_at: string
          sync_type: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          records_failed?: number | null
          records_fetched?: number | null
          records_synced?: number | null
          retry_count?: number | null
          started_at?: string
          sync_type?: string
        }
        Relationships: []
      }
      sync_schedule: {
        Row: {
          created_at: string | null
          display_name: string
          failure_count: number | null
          function_name: string
          id: string
          interval_minutes: number
          is_enabled: boolean
          last_error: string | null
          last_run_at: string | null
          last_status: string | null
          next_run_at: string | null
          records_synced: number | null
          sync_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_name: string
          failure_count?: number | null
          function_name: string
          id?: string
          interval_minutes?: number
          is_enabled?: boolean
          last_error?: string | null
          last_run_at?: string | null
          last_status?: string | null
          next_run_at?: string | null
          records_synced?: number | null
          sync_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string
          failure_count?: number | null
          function_name?: string
          id?: string
          interval_minutes?: number
          is_enabled?: boolean
          last_error?: string | null
          last_run_at?: string | null
          last_status?: string | null
          next_run_at?: string | null
          records_synced?: number | null
          sync_type?: string
          updated_at?: string | null
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
      template_outdated_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          marked_by_name: string
          marked_by_user_id: string
          read_at: string | null
          template_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          marked_by_name: string
          marked_by_user_id: string
          read_at?: string | null
          template_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          marked_by_name?: string
          marked_by_user_id?: string
          read_at?: string | null
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_outdated_notifications_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "response_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      toast_backfill_state: {
        Row: {
          created_at: string | null
          cursor_date: string
          cursor_page: number
          id: string
          last_error: string | null
          last_synced_at: string | null
          status: string
          total_days_synced: number | null
          total_records_synced: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          cursor_date?: string
          cursor_page?: number
          id?: string
          last_error?: string | null
          last_synced_at?: string | null
          status?: string
          total_days_synced?: number | null
          total_records_synced?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          cursor_date?: string
          cursor_page?: number
          id?: string
          last_error?: string | null
          last_synced_at?: string | null
          status?: string
          total_days_synced?: number | null
          total_records_synced?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      toast_sales: {
        Row: {
          business_date: string
          cafe_sales: number | null
          created_at: string | null
          gross_sales: number | null
          id: string
          net_sales: number | null
          raw_data: Json | null
          sync_batch_id: string | null
        }
        Insert: {
          business_date: string
          cafe_sales?: number | null
          created_at?: string | null
          gross_sales?: number | null
          id?: string
          net_sales?: number | null
          raw_data?: Json | null
          sync_batch_id?: string | null
        }
        Update: {
          business_date?: string
          cafe_sales?: number | null
          created_at?: string | null
          gross_sales?: number | null
          id?: string
          net_sales?: number | null
          raw_data?: Json | null
          sync_batch_id?: string | null
        }
        Relationships: []
      }
      toast_staging: {
        Row: {
          business_date: string
          cafe_sales: number | null
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
          cafe_sales?: number | null
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
          cafe_sales?: number | null
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
      toast_sync_log: {
        Row: {
          completed_at: string | null
          error_message: string | null
          failure_count: number | null
          id: string
          records_synced: number | null
          started_at: string
          status: string
          success_count: number | null
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          failure_count?: number | null
          id?: string
          records_synced?: number | null
          started_at?: string
          status?: string
          success_count?: number | null
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          failure_count?: number | null
          id?: string
          records_synced?: number | null
          started_at?: string
          status?: string
          success_count?: number | null
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
            referencedRelation: "arketa_clients"
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
            referencedRelation: "arketa_clients"
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
      admin_get_users_with_sling_info: {
        Args: never
        Returns: {
          email: string
          full_name: string
          is_auto_matched: boolean
          sling_email: string
          sling_id: string
          sling_user_name: string
          user_id: string
        }[]
      }
      admin_link_user_to_sling: {
        Args: { _sling_id: string; _user_id: string }
        Returns: undefined
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
      cleanup_old_completions: { Args: never; Returns: undefined }
      direct_upsert_reservation: {
        Args: {
          p_booking_id: string
          p_class_name: string
          p_class_time: string
          p_client_email: string
          p_client_id: string
          p_data?: Json
          p_external_id: string
          p_first_name: string
          p_last_name: string
          p_location_name: string
          p_status: string
        }
        Returns: undefined
      }
      exec_sql: { Args: { sql: string }; Returns: undefined }
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
      search_sling_users: {
        Args: { _search: string }
        Returns: {
          email: string
          full_name: string
          id: string
          is_active: boolean
          sling_user_id: number
        }[]
      }
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
        | "cafe"
      dev_task_status:
        | "not_started"
        | "in_progress"
        | "finishing_touches"
        | "completed"
      lost_and_found_category:
        | "wallet"
        | "keys"
        | "phone"
        | "clothing"
        | "jewelry"
        | "bag"
        | "water_bottle"
        | "other"
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
        "cafe",
      ],
      dev_task_status: [
        "not_started",
        "in_progress",
        "finishing_touches",
        "completed",
      ],
      lost_and_found_category: [
        "wallet",
        "keys",
        "phone",
        "clothing",
        "jewelry",
        "bag",
        "water_bottle",
        "other",
      ],
      membership_tier: ["basic", "standard", "premium", "vip"],
    },
  },
} as const
