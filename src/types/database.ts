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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ai_analyses: {
        Row: {
          analysis_type: string
          confidence_score: number | null
          created_at: string
          error_message: string | null
          id: string
          input_snapshot: Json
          latency_ms: number | null
          loan_application_id: string
          model_used: string
          overridden_at: string | null
          overridden_by: string | null
          override_reason: string | null
          result: Json
          status: string
          tokens_used: number | null
          triggered_by: string
          triggered_by_profile: string | null
        }
        Insert: {
          analysis_type: string
          confidence_score?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          input_snapshot?: Json
          latency_ms?: number | null
          loan_application_id: string
          model_used?: string
          overridden_at?: string | null
          overridden_by?: string | null
          override_reason?: string | null
          result?: Json
          status?: string
          tokens_used?: number | null
          triggered_by?: string
          triggered_by_profile?: string | null
        }
        Update: {
          analysis_type?: string
          confidence_score?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          input_snapshot?: Json
          latency_ms?: number | null
          loan_application_id?: string
          model_used?: string
          overridden_at?: string | null
          overridden_by?: string | null
          override_reason?: string | null
          result?: Json
          status?: string
          tokens_used?: number | null
          triggered_by?: string
          triggered_by_profile?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_analyses_loan_application_id_fkey"
            columns: ["loan_application_id"]
            isOneToOne: false
            referencedRelation: "loan_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_analyses_overridden_by_fkey"
            columns: ["overridden_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_analyses_triggered_by_profile_fkey"
            columns: ["triggered_by_profile"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          actor_id: string | null
          browser: string | null
          created_at: string
          device_type: string | null
          event_name: string
          id: string
          loan_application_id: string | null
          organization_id: string
          properties: Json | null
          session_id: string | null
        }
        Insert: {
          actor_id?: string | null
          browser?: string | null
          created_at?: string
          device_type?: string | null
          event_name: string
          id?: string
          loan_application_id?: string | null
          organization_id: string
          properties?: Json | null
          session_id?: string | null
        }
        Update: {
          actor_id?: string | null
          browser?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          loan_application_id?: string | null
          organization_id?: string
          properties?: Json | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_loan_application_id_fkey"
            columns: ["loan_application_id"]
            isOneToOne: false
            referencedRelation: "loan_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      appraisals: {
        Row: {
          amc_name: string | null
          amc_order_number: string | null
          appraised_value: number | null
          appraiser_license: string | null
          appraiser_name: string | null
          condition_rating: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          inspection_date: string | null
          loan_application_id: string
          ordered_at: string | null
          property_id: string
          received_at: string | null
          report_document_id: string | null
          review_notes: string | null
          reviewed_at: string | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          amc_name?: string | null
          amc_order_number?: string | null
          appraised_value?: number | null
          appraiser_license?: string | null
          appraiser_name?: string | null
          condition_rating?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          inspection_date?: string | null
          loan_application_id: string
          ordered_at?: string | null
          property_id: string
          received_at?: string | null
          report_document_id?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          amc_name?: string | null
          amc_order_number?: string | null
          appraised_value?: number | null
          appraiser_license?: string | null
          appraiser_name?: string | null
          condition_rating?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          inspection_date?: string | null
          loan_application_id?: string
          ordered_at?: string | null
          property_id?: string
          received_at?: string | null
          report_document_id?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appraisals_loan_application_id_fkey"
            columns: ["loan_application_id"]
            isOneToOne: false
            referencedRelation: "loan_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appraisals_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_appraisals_report_doc"
            columns: ["report_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          account_last4: string | null
          asset_type: string
          balance: number
          borrower_profile_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          gift_source: string | null
          id: string
          institution_name: string | null
          is_gift: boolean
          updated_at: string
          updated_by: string | null
          verified_at: string | null
          verified_via: string | null
        }
        Insert: {
          account_last4?: string | null
          asset_type: string
          balance: number
          borrower_profile_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          gift_source?: string | null
          id?: string
          institution_name?: string | null
          is_gift?: boolean
          updated_at?: string
          updated_by?: string | null
          verified_at?: string | null
          verified_via?: string | null
        }
        Update: {
          account_last4?: string | null
          asset_type?: string
          balance?: number
          borrower_profile_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          gift_source?: string | null
          id?: string
          institution_name?: string | null
          is_gift?: boolean
          updated_at?: string
          updated_by?: string | null
          verified_at?: string | null
          verified_via?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_borrower_profile_id_fkey"
            columns: ["borrower_profile_id"]
            isOneToOne: false
            referencedRelation: "borrower_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          after_state: Json | null
          before_state: Json | null
          created_at: string
          id: string
          ip_address: unknown
          organization_id: string
          resource_id: string
          resource_type: string
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          id?: string
          ip_address?: unknown
          organization_id: string
          resource_id: string
          resource_type: string
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          id?: string
          ip_address?: unknown
          organization_id?: string
          resource_id?: string
          resource_type?: string
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      borrower_profiles: {
        Row: {
          address_current: Json | null
          address_mailing: Json | null
          citizenship: string | null
          created_at: string
          created_by: string | null
          declarations: Json | null
          deleted_at: string | null
          dependents_count: number | null
          dob: string | null
          housing_status: string | null
          id: string
          loan_application_id: string
          marital_status: string | null
          monthly_housing_payment: number | null
          profile_id: string
          ssn_encrypted: string | null
          updated_at: string
          updated_by: string | null
          years_at_address: number | null
        }
        Insert: {
          address_current?: Json | null
          address_mailing?: Json | null
          citizenship?: string | null
          created_at?: string
          created_by?: string | null
          declarations?: Json | null
          deleted_at?: string | null
          dependents_count?: number | null
          dob?: string | null
          housing_status?: string | null
          id?: string
          loan_application_id: string
          marital_status?: string | null
          monthly_housing_payment?: number | null
          profile_id: string
          ssn_encrypted?: string | null
          updated_at?: string
          updated_by?: string | null
          years_at_address?: number | null
        }
        Update: {
          address_current?: Json | null
          address_mailing?: Json | null
          citizenship?: string | null
          created_at?: string
          created_by?: string | null
          declarations?: Json | null
          deleted_at?: string | null
          dependents_count?: number | null
          dob?: string | null
          housing_status?: string | null
          id?: string
          loan_application_id?: string
          marital_status?: string | null
          monthly_housing_payment?: number | null
          profile_id?: string
          ssn_encrypted?: string | null
          updated_at?: string
          updated_by?: string | null
          years_at_address?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "borrower_profiles_loan_application_id_fkey"
            columns: ["loan_application_id"]
            isOneToOne: false
            referencedRelation: "loan_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "borrower_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      branch_members: {
        Row: {
          branch_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          is_primary: boolean
          profile_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          branch_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_primary?: boolean
          profile_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          branch_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_primary?: boolean
          profile_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branch_members_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: Json | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          is_active: boolean
          manager_id: string | null
          name: string
          nmls_id: string | null
          organization_id: string
          phone: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address?: Json | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          manager_id?: string | null
          name: string
          nmls_id?: string | null
          organization_id: string
          phone?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address?: Json | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          manager_id?: string | null
          name?: string
          nmls_id?: string | null
          organization_id?: string
          phone?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branches_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      closing_orders: {
        Row: {
          closing_date: string | null
          closing_location: Json | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          disbursed_at: string | null
          docs_sent_at: string | null
          funded_at: string | null
          funding_amount: number | null
          id: string
          loan_application_id: string
          notes: string | null
          ordered_by: string | null
          settlement_agent: string | null
          settlement_agent_email: string | null
          signed_at: string | null
          status: string
          title_company_name: string | null
          title_company_phone: string | null
          updated_at: string
          updated_by: string | null
          wire_instructions: Json | null
        }
        Insert: {
          closing_date?: string | null
          closing_location?: Json | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          disbursed_at?: string | null
          docs_sent_at?: string | null
          funded_at?: string | null
          funding_amount?: number | null
          id?: string
          loan_application_id: string
          notes?: string | null
          ordered_by?: string | null
          settlement_agent?: string | null
          settlement_agent_email?: string | null
          signed_at?: string | null
          status?: string
          title_company_name?: string | null
          title_company_phone?: string | null
          updated_at?: string
          updated_by?: string | null
          wire_instructions?: Json | null
        }
        Update: {
          closing_date?: string | null
          closing_location?: Json | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          disbursed_at?: string | null
          docs_sent_at?: string | null
          funded_at?: string | null
          funding_amount?: number | null
          id?: string
          loan_application_id?: string
          notes?: string | null
          ordered_by?: string | null
          settlement_agent?: string | null
          settlement_agent_email?: string | null
          signed_at?: string | null
          status?: string
          title_company_name?: string | null
          title_company_phone?: string | null
          updated_at?: string
          updated_by?: string | null
          wire_instructions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "closing_orders_loan_application_id_fkey"
            columns: ["loan_application_id"]
            isOneToOne: false
            referencedRelation: "loan_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "closing_orders_ordered_by_fkey"
            columns: ["ordered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conditions: {
        Row: {
          assigned_to: string | null
          condition_type: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string
          document_id: string | null
          due_date: string | null
          id: string
          loan_application_id: string
          resolved_at: string | null
          resolved_by: string | null
          source: string | null
          status: string
          updated_at: string
          updated_by: string | null
          waived_reason: string | null
        }
        Insert: {
          assigned_to?: string | null
          condition_type: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description: string
          document_id?: string | null
          due_date?: string | null
          id?: string
          loan_application_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          source?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          waived_reason?: string | null
        }
        Update: {
          assigned_to?: string | null
          condition_type?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string
          document_id?: string | null
          due_date?: string | null
          id?: string
          loan_application_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          source?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          waived_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conditions_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conditions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conditions_loan_application_id_fkey"
            columns: ["loan_application_id"]
            isOneToOne: false
            referencedRelation: "loan_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conditions_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_reports: {
        Row: {
          borrower_profile_id: string
          bureau: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          expires_at: string
          id: string
          loan_application_id: string
          pulled_at: string
          reference_number: string | null
          report_data: Json | null
          requested_by: string | null
          score: number | null
          score_model: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          borrower_profile_id: string
          bureau: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          expires_at?: string
          id?: string
          loan_application_id: string
          pulled_at?: string
          reference_number?: string | null
          report_data?: Json | null
          requested_by?: string | null
          score?: number | null
          score_model?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          borrower_profile_id?: string
          bureau?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          expires_at?: string
          id?: string
          loan_application_id?: string
          pulled_at?: string
          reference_number?: string | null
          report_data?: Json | null
          requested_by?: string | null
          score?: number | null
          score_model?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_reports_borrower_profile_id_fkey"
            columns: ["borrower_profile_id"]
            isOneToOne: false
            referencedRelation: "borrower_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_reports_loan_application_id_fkey"
            columns: ["loan_application_id"]
            isOneToOne: false
            referencedRelation: "loan_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_reports_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      disclosures: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          created_at: string
          created_by: string | null
          deadline: string | null
          deleted_at: string | null
          disclosure_type: string
          document_id: string | null
          id: string
          issued_by: string | null
          loan_application_id: string
          notes: string | null
          sent_at: string | null
          status: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          deleted_at?: string | null
          disclosure_type: string
          document_id?: string | null
          id?: string
          issued_by?: string | null
          loan_application_id: string
          notes?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          deleted_at?: string | null
          disclosure_type?: string
          document_id?: string | null
          id?: string
          issued_by?: string | null
          loan_application_id?: string
          notes?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "disclosures_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disclosures_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disclosures_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disclosures_loan_application_id_fkey"
            columns: ["loan_application_id"]
            isOneToOne: false
            referencedRelation: "loan_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      document_requests: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          document_type: string
          due_date: string | null
          fulfilled_at: string | null
          fulfilled_by_document_id: string | null
          id: string
          loan_application_id: string
          message: string | null
          requested_by: string
          status: string
          updated_at: string
          updated_by: string | null
          waived_by: string | null
          waived_reason: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          document_type: string
          due_date?: string | null
          fulfilled_at?: string | null
          fulfilled_by_document_id?: string | null
          id?: string
          loan_application_id: string
          message?: string | null
          requested_by: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          waived_by?: string | null
          waived_reason?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          document_type?: string
          due_date?: string | null
          fulfilled_at?: string | null
          fulfilled_by_document_id?: string | null
          id?: string
          loan_application_id?: string
          message?: string | null
          requested_by?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          waived_by?: string | null
          waived_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_requests_fulfilled_by_document_id_fkey"
            columns: ["fulfilled_by_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_requests_loan_application_id_fkey"
            columns: ["loan_application_id"]
            isOneToOne: false
            referencedRelation: "loan_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_requests_waived_by_fkey"
            columns: ["waived_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          ai_classified_at: string | null
          ai_extracted_data: Json | null
          checksum: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          document_category: string | null
          document_type: string
          expires_at: string | null
          file_name: string
          file_size_bytes: number | null
          id: string
          is_latest: boolean
          loan_application_id: string
          mime_type: string | null
          organization_id: string
          parent_document_id: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          storage_path: string
          updated_at: string
          updated_by: string | null
          uploaded_by: string
          version: number
        }
        Insert: {
          ai_classified_at?: string | null
          ai_extracted_data?: Json | null
          checksum?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          document_category?: string | null
          document_type: string
          expires_at?: string | null
          file_name: string
          file_size_bytes?: number | null
          id?: string
          is_latest?: boolean
          loan_application_id: string
          mime_type?: string | null
          organization_id: string
          parent_document_id?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          storage_path: string
          updated_at?: string
          updated_by?: string | null
          uploaded_by: string
          version?: number
        }
        Update: {
          ai_classified_at?: string | null
          ai_extracted_data?: Json | null
          checksum?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          document_category?: string | null
          document_type?: string
          expires_at?: string | null
          file_name?: string
          file_size_bytes?: number | null
          id?: string
          is_latest?: boolean
          loan_application_id?: string
          mime_type?: string | null
          organization_id?: string
          parent_document_id?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          storage_path?: string
          updated_at?: string
          updated_by?: string | null
          uploaded_by?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "documents_loan_application_id_fkey"
            columns: ["loan_application_id"]
            isOneToOne: false
            referencedRelation: "loan_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_parent_document_id_fkey"
            columns: ["parent_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body_html: string
          body_text: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          is_active: boolean
          is_default: boolean
          organization_id: string
          reply_to: string | null
          subject: string
          trigger_event: string
          updated_at: string
          updated_by: string | null
          variables: Json | null
        }
        Insert: {
          body_html: string
          body_text?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          organization_id: string
          reply_to?: string | null
          subject: string
          trigger_event: string
          updated_at?: string
          updated_by?: string | null
          variables?: Json | null
        }
        Update: {
          body_html?: string
          body_text?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          organization_id?: string
          reply_to?: string | null
          subject?: string
          trigger_event?: string
          updated_at?: string
          updated_by?: string | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employment_records: {
        Row: {
          base_monthly_income: number | null
          bonus_monthly: number | null
          borrower_profile_id: string
          commission_monthly: number | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          employer_address: Json | null
          employer_name: string
          employer_phone: string | null
          employment_type: string
          end_date: string | null
          id: string
          is_current: boolean
          is_primary: boolean
          other_monthly: number | null
          overtime_monthly: number | null
          position: string | null
          start_date: string | null
          updated_at: string
          updated_by: string | null
          verified_at: string | null
          verified_via: string | null
        }
        Insert: {
          base_monthly_income?: number | null
          bonus_monthly?: number | null
          borrower_profile_id: string
          commission_monthly?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          employer_address?: Json | null
          employer_name: string
          employer_phone?: string | null
          employment_type: string
          end_date?: string | null
          id?: string
          is_current?: boolean
          is_primary?: boolean
          other_monthly?: number | null
          overtime_monthly?: number | null
          position?: string | null
          start_date?: string | null
          updated_at?: string
          updated_by?: string | null
          verified_at?: string | null
          verified_via?: string | null
        }
        Update: {
          base_monthly_income?: number | null
          bonus_monthly?: number | null
          borrower_profile_id?: string
          commission_monthly?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          employer_address?: Json | null
          employer_name?: string
          employer_phone?: string | null
          employment_type?: string
          end_date?: string | null
          id?: string
          is_current?: boolean
          is_primary?: boolean
          other_monthly?: number | null
          overtime_monthly?: number | null
          position?: string | null
          start_date?: string | null
          updated_at?: string
          updated_by?: string | null
          verified_at?: string | null
          verified_via?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employment_records_borrower_profile_id_fkey"
            columns: ["borrower_profile_id"]
            isOneToOne: false
            referencedRelation: "borrower_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      esign_envelopes: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          created_by_profile: string | null
          deleted_at: string | null
          document_ids: string[] | null
          envelope_id: string
          id: string
          loan_application_id: string
          provider: string
          sent_at: string | null
          signing_event: string | null
          status: string
          updated_at: string
          updated_by: string | null
          viewed_at: string | null
          void_reason: string | null
          voided_at: string | null
          webhook_data: Json | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          created_by_profile?: string | null
          deleted_at?: string | null
          document_ids?: string[] | null
          envelope_id: string
          id?: string
          loan_application_id: string
          provider: string
          sent_at?: string | null
          signing_event?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          viewed_at?: string | null
          void_reason?: string | null
          voided_at?: string | null
          webhook_data?: Json | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          created_by_profile?: string | null
          deleted_at?: string | null
          document_ids?: string[] | null
          envelope_id?: string
          id?: string
          loan_application_id?: string
          provider?: string
          sent_at?: string | null
          signing_event?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          viewed_at?: string | null
          void_reason?: string | null
          voided_at?: string | null
          webhook_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "esign_envelopes_created_by_profile_fkey"
            columns: ["created_by_profile"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "esign_envelopes_loan_application_id_fkey"
            columns: ["loan_application_id"]
            isOneToOne: false
            referencedRelation: "loan_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      flood_certifications: {
        Row: {
          cert_number: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          determined_at: string | null
          flood_zone_code: string | null
          flood_zone_desc: string | null
          id: string
          life_of_loan: boolean
          property_id: string
          provider: string | null
          requires_insurance: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          cert_number?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          determined_at?: string | null
          flood_zone_code?: string | null
          flood_zone_desc?: string | null
          id?: string
          life_of_loan?: boolean
          property_id: string
          provider?: string | null
          requires_insurance?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          cert_number?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          determined_at?: string | null
          flood_zone_code?: string | null
          flood_zone_desc?: string | null
          id?: string
          life_of_loan?: boolean
          property_id?: string
          provider?: string | null
          requires_insurance?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flood_certifications_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_flags: {
        Row: {
          ai_analysis_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string
          evidence: Json | null
          flag_type: string
          id: string
          loan_application_id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          severity: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          ai_analysis_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description: string
          evidence?: Json | null
          flag_type: string
          id?: string
          loan_application_id: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          ai_analysis_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string
          evidence?: Json | null
          flag_type?: string
          id?: string
          loan_application_id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fraud_flags_ai_analysis_id_fkey"
            columns: ["ai_analysis_id"]
            isOneToOne: false
            referencedRelation: "ai_analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fraud_flags_loan_application_id_fkey"
            columns: ["loan_application_id"]
            isOneToOne: false
            referencedRelation: "loan_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fraud_flags_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hmda_records: {
        Row: {
          action_taken: number | null
          action_taken_date: string | null
          census_tract: string | null
          county_code: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          denial_reasons: number[] | null
          ethnicity_data: Json | null
          hoepa_status: number | null
          id: string
          lien_status: number | null
          loan_application_id: string
          loan_purpose_hmda: number | null
          msa_code: string | null
          organization_id: string
          property_type_hmda: number | null
          race_data: Json | null
          rate_spread: number | null
          reporting_year: number
          sex_data: Json | null
          submitted_to_cfpb_at: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          action_taken?: number | null
          action_taken_date?: string | null
          census_tract?: string | null
          county_code?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          denial_reasons?: number[] | null
          ethnicity_data?: Json | null
          hoepa_status?: number | null
          id?: string
          lien_status?: number | null
          loan_application_id: string
          loan_purpose_hmda?: number | null
          msa_code?: string | null
          organization_id: string
          property_type_hmda?: number | null
          race_data?: Json | null
          rate_spread?: number | null
          reporting_year: number
          sex_data?: Json | null
          submitted_to_cfpb_at?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          action_taken?: number | null
          action_taken_date?: string | null
          census_tract?: string | null
          county_code?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          denial_reasons?: number[] | null
          ethnicity_data?: Json | null
          hoepa_status?: number | null
          id?: string
          lien_status?: number | null
          loan_application_id?: string
          loan_purpose_hmda?: number | null
          msa_code?: string | null
          organization_id?: string
          property_type_hmda?: number | null
          race_data?: Json | null
          rate_spread?: number | null
          reporting_year?: number
          sex_data?: Json | null
          submitted_to_cfpb_at?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hmda_records_loan_application_id_fkey"
            columns: ["loan_application_id"]
            isOneToOne: true
            referencedRelation: "loan_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hmda_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      liabilities: {
        Row: {
          account_number_last4: string | null
          borrower_profile_id: string
          created_at: string
          created_by: string | null
          creditor_name: string | null
          deleted_at: string | null
          exclude_from_dti: boolean
          exclude_reason: string | null
          id: string
          liability_type: string
          monthly_payment: number
          months_remaining: number | null
          outstanding_balance: number | null
          to_be_paid_off: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          account_number_last4?: string | null
          borrower_profile_id: string
          created_at?: string
          created_by?: string | null
          creditor_name?: string | null
          deleted_at?: string | null
          exclude_from_dti?: boolean
          exclude_reason?: string | null
          id?: string
          liability_type: string
          monthly_payment: number
          months_remaining?: number | null
          outstanding_balance?: number | null
          to_be_paid_off?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          account_number_last4?: string | null
          borrower_profile_id?: string
          created_at?: string
          created_by?: string | null
          creditor_name?: string | null
          deleted_at?: string | null
          exclude_from_dti?: boolean
          exclude_reason?: string | null
          id?: string
          liability_type?: string
          monthly_payment?: number
          months_remaining?: number | null
          outstanding_balance?: number | null
          to_be_paid_off?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "liabilities_borrower_profile_id_fkey"
            columns: ["borrower_profile_id"]
            isOneToOne: false
            referencedRelation: "borrower_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_applications: {
        Row: {
          approved_at: string | null
          borrower_id: string
          branch_id: string | null
          closed_at: string | null
          co_borrower_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          denied_at: string | null
          down_payment: number | null
          estimated_closing: string | null
          funded_at: string | null
          id: string
          loan_amount: number | null
          loan_number: string | null
          loan_officer_id: string | null
          loan_purpose: string
          loan_type: string
          metadata: Json | null
          organization_id: string
          pipeline_stage_id: string | null
          processor_id: string | null
          status: string
          submitted_at: string | null
          term_months: number | null
          underwriter_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          approved_at?: string | null
          borrower_id: string
          branch_id?: string | null
          closed_at?: string | null
          co_borrower_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          denied_at?: string | null
          down_payment?: number | null
          estimated_closing?: string | null
          funded_at?: string | null
          id?: string
          loan_amount?: number | null
          loan_number?: string | null
          loan_officer_id?: string | null
          loan_purpose: string
          loan_type: string
          metadata?: Json | null
          organization_id: string
          pipeline_stage_id?: string | null
          processor_id?: string | null
          status?: string
          submitted_at?: string | null
          term_months?: number | null
          underwriter_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          approved_at?: string | null
          borrower_id?: string
          branch_id?: string | null
          closed_at?: string | null
          co_borrower_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          denied_at?: string | null
          down_payment?: number | null
          estimated_closing?: string | null
          funded_at?: string | null
          id?: string
          loan_amount?: number | null
          loan_number?: string | null
          loan_officer_id?: string | null
          loan_purpose?: string
          loan_type?: string
          metadata?: Json | null
          organization_id?: string
          pipeline_stage_id?: string | null
          processor_id?: string | null
          status?: string
          submitted_at?: string | null
          term_months?: number | null
          underwriter_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loan_applications_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_applications_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_applications_co_borrower_id_fkey"
            columns: ["co_borrower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_applications_loan_officer_id_fkey"
            columns: ["loan_officer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_applications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_applications_pipeline_stage_id_fkey"
            columns: ["pipeline_stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_applications_processor_id_fkey"
            columns: ["processor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_applications_underwriter_id_fkey"
            columns: ["underwriter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_fees: {
        Row: {
          amount: number
          can_increase: boolean
          created_at: string
          created_by: string | null
          deleted_at: string | null
          disclosure_section: string | null
          fee_name: string
          fee_type: string
          id: string
          loan_application_id: string
          paid_by: string
          tolerance_bucket: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          amount: number
          can_increase?: boolean
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          disclosure_section?: string | null
          fee_name: string
          fee_type: string
          id?: string
          loan_application_id: string
          paid_by?: string
          tolerance_bucket?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          amount?: number
          can_increase?: boolean
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          disclosure_section?: string | null
          fee_name?: string
          fee_type?: string
          id?: string
          loan_application_id?: string
          paid_by?: string
          tolerance_bucket?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loan_fees_loan_application_id_fkey"
            columns: ["loan_application_id"]
            isOneToOne: false
            referencedRelation: "loan_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_products: {
        Row: {
          amortization_type: string
          arm_initial_period: number | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          display_order: number | null
          guidelines: Json | null
          id: string
          is_active: boolean
          loan_type: string
          name: string
          organization_id: string
          term_months: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          amortization_type: string
          arm_initial_period?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          display_order?: number | null
          guidelines?: Json | null
          id?: string
          is_active?: boolean
          loan_type: string
          name: string
          organization_id: string
          term_months: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          amortization_type?: string
          arm_initial_period?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          display_order?: number | null
          guidelines?: Json | null
          id?: string
          is_active?: boolean
          loan_type?: string
          name?: string
          organization_id?: string
          term_months?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loan_products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_ids: string[] | null
          body: string
          channel: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          is_internal: boolean
          loan_application_id: string
          read_at: string | null
          sender_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          attachment_ids?: string[] | null
          body: string
          channel?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_internal?: boolean
          loan_application_id: string
          read_at?: string | null
          sender_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          attachment_ids?: string[] | null
          body?: string
          channel?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_internal?: boolean
          loan_application_id?: string
          read_at?: string | null
          sender_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_loan_application_id_fkey"
            columns: ["loan_application_id"]
            isOneToOne: false
            referencedRelation: "loan_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          body: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          organization_id: string
          read_at: string | null
          recipient_id: string
          resource_id: string | null
          resource_type: string | null
          sent_via: string[] | null
          title: string
          type: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          action_url?: string | null
          body?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          organization_id: string
          read_at?: string | null
          recipient_id: string
          resource_id?: string | null
          resource_type?: string | null
          sent_via?: string[] | null
          title: string
          type: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          action_url?: string | null
          body?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          organization_id?: string
          read_at?: string | null
          recipient_id?: string
          resource_id?: string | null
          resource_type?: string | null
          sent_via?: string[] | null
          title?: string
          type?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          brand_colors: Json | null
          created_at: string
          created_by: string | null
          custom_domain: string | null
          deleted_at: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          plan: string
          plan_expires_at: string | null
          settings: Json | null
          slug: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          brand_colors?: Json | null
          created_at?: string
          created_by?: string | null
          custom_domain?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          plan?: string
          plan_expires_at?: string | null
          settings?: Json | null
          slug: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          brand_colors?: Json | null
          created_at?: string
          created_by?: string | null
          custom_domain?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          plan?: string
          plan_expires_at?: string | null
          settings?: Json | null
          slug?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      pipeline_stages: {
        Row: {
          color: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          id: string
          is_terminal: boolean
          name: string
          order_index: number
          organization_id: string
          sla_days: number | null
          terminal_outcome: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          color?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_terminal?: boolean
          name: string
          order_index: number
          organization_id: string
          sla_days?: number | null
          terminal_outcome?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_terminal?: boolean
          name?: string
          order_index?: number
          organization_id?: string
          sla_days?: number | null
          terminal_outcome?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          first_name: string
          id: string
          is_active: boolean
          last_name: string
          license_states: string[] | null
          nmls_id: string | null
          notification_prefs: Json | null
          organization_id: string
          phone: string | null
          role: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          first_name: string
          id: string
          is_active?: boolean
          last_name: string
          license_states?: string[] | null
          nmls_id?: string | null
          notification_prefs?: Json | null
          organization_id: string
          phone?: string | null
          role: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          first_name?: string
          id?: string
          is_active?: boolean
          last_name?: string
          license_states?: string[] | null
          nmls_id?: string | null
          notification_prefs?: Json | null
          organization_id?: string
          phone?: string | null
          role?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: Json
          appraised_value: number | null
          bathrooms: number | null
          bedrooms: number | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          estimated_value: number | null
          flood_cert_id: string | null
          flood_zone: string | null
          id: string
          loan_application_id: string
          lot_size_sqft: number | null
          occupancy_type: string
          property_type: string
          purchase_price: number | null
          square_footage: number | null
          updated_at: string
          updated_by: string | null
          year_built: number | null
        }
        Insert: {
          address?: Json
          appraised_value?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          estimated_value?: number | null
          flood_cert_id?: string | null
          flood_zone?: string | null
          id?: string
          loan_application_id: string
          lot_size_sqft?: number | null
          occupancy_type: string
          property_type: string
          purchase_price?: number | null
          square_footage?: number | null
          updated_at?: string
          updated_by?: string | null
          year_built?: number | null
        }
        Update: {
          address?: Json
          appraised_value?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          estimated_value?: number | null
          flood_cert_id?: string | null
          flood_zone?: string | null
          id?: string
          loan_application_id?: string
          lot_size_sqft?: number | null
          occupancy_type?: string
          property_type?: string
          purchase_price?: number | null
          square_footage?: number | null
          updated_at?: string
          updated_by?: string | null
          year_built?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_properties_flood_cert"
            columns: ["flood_cert_id"]
            isOneToOne: false
            referencedRelation: "flood_certifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_loan_application_id_fkey"
            columns: ["loan_application_id"]
            isOneToOne: false
            referencedRelation: "loan_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_locks: {
        Row: {
          apr: number | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          expires_at: string
          extended_to: string | null
          id: string
          loan_application_id: string
          loan_product_id: string | null
          lock_period_days: number
          locked_at: string
          locked_by: string | null
          points: number | null
          rate: number
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          apr?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          expires_at: string
          extended_to?: string | null
          id?: string
          loan_application_id: string
          loan_product_id?: string | null
          lock_period_days: number
          locked_at?: string
          locked_by?: string | null
          points?: number | null
          rate: number
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          apr?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          expires_at?: string
          extended_to?: string | null
          id?: string
          loan_application_id?: string
          loan_product_id?: string | null
          lock_period_days?: number
          locked_at?: string
          locked_by?: string | null
          points?: number | null
          rate?: number
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rate_locks_loan_application_id_fkey"
            columns: ["loan_application_id"]
            isOneToOne: false
            referencedRelation: "loan_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rate_locks_loan_product_id_fkey"
            columns: ["loan_product_id"]
            isOneToOne: false
            referencedRelation: "loan_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rate_locks_locked_by_fkey"
            columns: ["locked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_sheets: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          effective_date: string
          expiry_date: string | null
          id: string
          is_active: boolean
          loan_product_id: string
          margin: number | null
          organization_id: string
          rate_data: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          effective_date: string
          expiry_date?: string | null
          id?: string
          is_active?: boolean
          loan_product_id: string
          margin?: number | null
          organization_id: string
          rate_data?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          effective_date?: string
          expiry_date?: string | null
          id?: string
          is_active?: boolean
          loan_product_id?: string
          margin?: number | null
          organization_id?: string
          rate_data?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rate_sheets_loan_product_id_fkey"
            columns: ["loan_product_id"]
            isOneToOne: false
            referencedRelation: "loan_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rate_sheets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      secondary_market_loans: {
        Row: {
          commitment_number: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          delivery_date: string | null
          delivery_method: string | null
          handled_by: string | null
          id: string
          investor_name: string
          loan_application_id: string
          mismo_file_path: string | null
          organization_id: string
          purchase_price: number | null
          purchased_at: string | null
          rejection_reason: string | null
          servicing_released: boolean
          settlement_date: string | null
          srp: number | null
          status: string
          trade_date: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          commitment_number?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          delivery_date?: string | null
          delivery_method?: string | null
          handled_by?: string | null
          id?: string
          investor_name: string
          loan_application_id: string
          mismo_file_path?: string | null
          organization_id: string
          purchase_price?: number | null
          purchased_at?: string | null
          rejection_reason?: string | null
          servicing_released?: boolean
          settlement_date?: string | null
          srp?: number | null
          status?: string
          trade_date?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          commitment_number?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          delivery_date?: string | null
          delivery_method?: string | null
          handled_by?: string | null
          id?: string
          investor_name?: string
          loan_application_id?: string
          mismo_file_path?: string | null
          organization_id?: string
          purchase_price?: number | null
          purchased_at?: string | null
          rejection_reason?: string | null
          servicing_released?: boolean
          settlement_date?: string | null
          srp?: number | null
          status?: string
          trade_date?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "secondary_market_loans_handled_by_fkey"
            columns: ["handled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "secondary_market_loans_loan_application_id_fkey"
            columns: ["loan_application_id"]
            isOneToOne: false
            referencedRelation: "loan_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "secondary_market_loans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_by: string | null
          assigned_to: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          due_date: string | null
          id: string
          loan_application_id: string
          priority: string
          status: string
          task_type: string | null
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          assigned_by?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          loan_application_id: string
          priority?: string
          status?: string
          task_type?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          assigned_by?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          loan_application_id?: string
          priority?: string
          status?: string
          task_type?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_loan_application_id_fkey"
            columns: ["loan_application_id"]
            isOneToOne: false
            referencedRelation: "loan_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      underwriting_decisions: {
        Row: {
          ai_summary: Json | null
          approved_amount: number | null
          cltv_ratio: number | null
          created_at: string
          created_by: string | null
          credit_score_used: number | null
          decided_at: string
          decision: string
          decision_pass: number
          deleted_at: string | null
          denial_reasons: Json | null
          dti_ratio: number | null
          id: string
          loan_application_id: string
          ltv_ratio: number | null
          notes: string | null
          underwriter_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          ai_summary?: Json | null
          approved_amount?: number | null
          cltv_ratio?: number | null
          created_at?: string
          created_by?: string | null
          credit_score_used?: number | null
          decided_at?: string
          decision: string
          decision_pass?: number
          deleted_at?: string | null
          denial_reasons?: Json | null
          dti_ratio?: number | null
          id?: string
          loan_application_id: string
          ltv_ratio?: number | null
          notes?: string | null
          underwriter_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          ai_summary?: Json | null
          approved_amount?: number | null
          cltv_ratio?: number | null
          created_at?: string
          created_by?: string | null
          credit_score_used?: number | null
          decided_at?: string
          decision?: string
          decision_pass?: number
          deleted_at?: string | null
          denial_reasons?: Json | null
          dti_ratio?: number | null
          id?: string
          loan_application_id?: string
          ltv_ratio?: number | null
          notes?: string | null
          underwriter_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "underwriting_decisions_loan_application_id_fkey"
            columns: ["loan_application_id"]
            isOneToOne: false
            referencedRelation: "loan_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "underwriting_decisions_underwriter_id_fkey"
            columns: ["underwriter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      underwriting_rules: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          id: string
          is_active: boolean
          loan_type: string
          organization_id: string
          priority: number
          rule_config: Json
          rule_name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          loan_type: string
          organization_id: string
          priority?: number
          rule_config: Json
          rule_name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          loan_type?: string
          organization_id?: string
          priority?: number
          rule_config?: Json
          rule_name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "underwriting_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      attach_audit_triggers: { Args: { tbl: string }; Returns: undefined }
      seed_default_pipeline_stages: {
        Args: { org_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
