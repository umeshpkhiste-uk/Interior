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
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          diff: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          organization_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          diff?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          organization_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          diff?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          organization_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      boq_items: {
        Row: {
          amount: number
          brand: string | null
          created_at: string
          id: string
          is_manual: boolean
          item_description: string
          labour_rate: number
          material_rate: number
          organization_id: string
          project_id: string
          quantity: number
          room_id: string | null
          serial_no: number | null
          source_estimation_id: string | null
          source_module: Database["public"]["Enums"]["boq_source_module"] | null
          specification: string | null
          total_rate: number
          unit: string | null
          updated_at: string
          work_category: string | null
        }
        Insert: {
          amount?: number
          brand?: string | null
          created_at?: string
          id?: string
          is_manual?: boolean
          item_description: string
          labour_rate?: number
          material_rate?: number
          organization_id: string
          project_id: string
          quantity?: number
          room_id?: string | null
          serial_no?: number | null
          source_estimation_id?: string | null
          source_module?:
            | Database["public"]["Enums"]["boq_source_module"]
            | null
          specification?: string | null
          total_rate?: number
          unit?: string | null
          updated_at?: string
          work_category?: string | null
        }
        Update: {
          amount?: number
          brand?: string | null
          created_at?: string
          id?: string
          is_manual?: boolean
          item_description?: string
          labour_rate?: number
          material_rate?: number
          organization_id?: string
          project_id?: string
          quantity?: number
          room_id?: string | null
          serial_no?: number | null
          source_estimation_id?: string | null
          source_module?:
            | Database["public"]["Enums"]["boq_source_module"]
            | null
          specification?: string | null
          total_rate?: number
          unit?: string | null
          updated_at?: string
          work_category?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "boq_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boq_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boq_items_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "project_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      ceiling_estimations: {
        Row: {
          board_dimensions: string | null
          ceiling_type: Database["public"]["Enums"]["ceiling_type"]
          cove_labour_rate: number
          cove_length: number
          cover_pct: number
          created_at: string
          design: Database["public"]["Enums"]["ceiling_design"]
          downlight_qty: number
          id: string
          labour_cost: number
          labour_rate: number
          led_strip_length: number
          led_strip_rate: number
          lighting_rate: number
          margin_pct: number
          material_cost: number
          material_rate: number
          organization_id: string
          room_id: string
          rounding_unit: number
          selling_price: number
          total_cost: number
          updated_at: string
          wastage_pct: number
        }
        Insert: {
          board_dimensions?: string | null
          ceiling_type?: Database["public"]["Enums"]["ceiling_type"]
          cove_labour_rate?: number
          cove_length?: number
          cover_pct?: number
          created_at?: string
          design?: Database["public"]["Enums"]["ceiling_design"]
          downlight_qty?: number
          id?: string
          labour_cost?: number
          labour_rate?: number
          led_strip_length?: number
          led_strip_rate?: number
          lighting_rate?: number
          margin_pct?: number
          material_cost?: number
          material_rate?: number
          organization_id: string
          room_id: string
          rounding_unit?: number
          selling_price?: number
          total_cost?: number
          updated_at?: string
          wastage_pct?: number
        }
        Update: {
          board_dimensions?: string | null
          ceiling_type?: Database["public"]["Enums"]["ceiling_type"]
          cove_labour_rate?: number
          cove_length?: number
          cover_pct?: number
          created_at?: string
          design?: Database["public"]["Enums"]["ceiling_design"]
          downlight_qty?: number
          id?: string
          labour_cost?: number
          labour_rate?: number
          led_strip_length?: number
          led_strip_rate?: number
          lighting_rate?: number
          margin_pct?: number
          material_cost?: number
          material_rate?: number
          organization_id?: string
          room_id?: string
          rounding_unit?: number
          selling_price?: number
          total_cost?: number
          updated_at?: string
          wastage_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "ceiling_estimations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ceiling_estimations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "project_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      client_approvals: {
        Row: {
          approval_for: string
          approved_by: string | null
          approved_on: string | null
          channel: Database["public"]["Enums"]["client_approval_channel"] | null
          created_at: string
          id: string
          organization_id: string
          project_id: string
          room_area: string | null
          sent_on: string
          updated_at: string
        }
        Insert: {
          approval_for: string
          approved_by?: string | null
          approved_on?: string | null
          channel?:
            | Database["public"]["Enums"]["client_approval_channel"]
            | null
          created_at?: string
          id?: string
          organization_id: string
          project_id: string
          room_area?: string | null
          sent_on?: string
          updated_at?: string
        }
        Update: {
          approval_for?: string
          approved_by?: string | null
          approved_on?: string | null
          channel?:
            | Database["public"]["Enums"]["client_approval_channel"]
            | null
          created_at?: string
          id?: string
          organization_id?: string
          project_id?: string
          room_area?: string | null
          sent_on?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_approvals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_approvals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      client_invoices: {
        Row: {
          amount: number
          created_at: string
          due_date: string | null
          gst_pct: number
          id: string
          invoice_date: string
          invoice_number: string
          milestone: string
          organization_id: string
          project_id: string
          total: number
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date?: string | null
          gst_pct?: number
          id?: string
          invoice_date?: string
          invoice_number: string
          milestone: string
          organization_id: string
          project_id: string
          total?: number
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string | null
          gst_pct?: number
          id?: string
          invoice_date?: string
          invoice_number?: string
          milestone?: string
          organization_id?: string
          project_id?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          alternate_contact: string | null
          archived_at: string | null
          city: string | null
          created_at: string
          email: string | null
          id: string
          mobile: string | null
          name: string
          notes: string | null
          organization_id: string
          pin_code: string | null
          property_type: Database["public"]["Enums"]["property_type"] | null
          state: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          alternate_contact?: string | null
          archived_at?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          mobile?: string | null
          name: string
          notes?: string | null
          organization_id: string
          pin_code?: string | null
          property_type?: Database["public"]["Enums"]["property_type"] | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          alternate_contact?: string | null
          archived_at?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          mobile?: string | null
          name?: string
          notes?: string | null
          organization_id?: string
          pin_code?: string | null
          property_type?: Database["public"]["Enums"]["property_type"] | null
          state?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      design_fee_stages: {
        Row: {
          created_at: string
          design_fee_id: string
          id: string
          organization_id: string
          stage_amount: number
          stage_name: string
          stage_pct: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          design_fee_id: string
          id?: string
          organization_id: string
          stage_amount?: number
          stage_name: string
          stage_pct?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          design_fee_id?: string
          id?: string
          organization_id?: string
          stage_amount?: number
          stage_name?: string
          stage_pct?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_fee_stages_design_fee_id_fkey"
            columns: ["design_fee_id"]
            isOneToOne: false
            referencedRelation: "design_fees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_fee_stages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      design_fees: {
        Row: {
          additional_visit_rate: number
          additional_visits: number
          basis: Database["public"]["Enums"]["design_fee_basis"]
          created_at: string
          design_fee_amount: number
          extra_visit_amount: number
          fee_pct: number
          fee_per_sqft: number
          fixed_fee: number
          gst_pct: number
          id: string
          included_visits: number
          organization_id: string
          project_id: string
          total_before_gst: number
          total_with_gst: number
          updated_at: string
        }
        Insert: {
          additional_visit_rate?: number
          additional_visits?: number
          basis?: Database["public"]["Enums"]["design_fee_basis"]
          created_at?: string
          design_fee_amount?: number
          extra_visit_amount?: number
          fee_pct?: number
          fee_per_sqft?: number
          fixed_fee?: number
          gst_pct?: number
          id?: string
          included_visits?: number
          organization_id: string
          project_id: string
          total_before_gst?: number
          total_with_gst?: number
          updated_at?: string
        }
        Update: {
          additional_visit_rate?: number
          additional_visits?: number
          basis?: Database["public"]["Enums"]["design_fee_basis"]
          created_at?: string
          design_fee_amount?: number
          extra_visit_amount?: number
          fee_pct?: number
          fee_per_sqft?: number
          fixed_fee?: number
          gst_pct?: number
          id?: string
          included_visits?: number
          organization_id?: string
          project_id?: string
          total_before_gst?: number
          total_with_gst?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_fees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_fees_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      design_revisions: {
        Row: {
          client_asked_for: string | null
          created_at: string
          drawing: string
          id: string
          organization_id: string
          project_id: string
          reply_on: string | null
          reply_status: Database["public"]["Enums"]["design_revision_reply_status"]
          revision_code: string
          room_area: string | null
          sent_on: string
          updated_at: string
          version: string
        }
        Insert: {
          client_asked_for?: string | null
          created_at?: string
          drawing: string
          id?: string
          organization_id: string
          project_id: string
          reply_on?: string | null
          reply_status?: Database["public"]["Enums"]["design_revision_reply_status"]
          revision_code: string
          room_area?: string | null
          sent_on?: string
          updated_at?: string
          version?: string
        }
        Update: {
          client_asked_for?: string | null
          created_at?: string
          drawing?: string
          id?: string
          organization_id?: string
          project_id?: string
          reply_on?: string | null
          reply_status?: Database["public"]["Enums"]["design_revision_reply_status"]
          revision_code?: string
          room_area?: string | null
          sent_on?: string
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_revisions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_revisions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      electrical_estimations: {
        Row: {
          all_in_rate: number
          amount: number
          created_at: string
          id: string
          organization_id: string
          point_type: Database["public"]["Enums"]["electrical_point_type"]
          qty: number
          room_id: string
          updated_at: string
          wiring_spec: string | null
        }
        Insert: {
          all_in_rate?: number
          amount?: number
          created_at?: string
          id?: string
          organization_id: string
          point_type: Database["public"]["Enums"]["electrical_point_type"]
          qty?: number
          room_id: string
          updated_at?: string
          wiring_spec?: string | null
        }
        Update: {
          all_in_rate?: number
          amount?: number
          created_at?: string
          id?: string
          organization_id?: string
          point_type?: Database["public"]["Enums"]["electrical_point_type"]
          qty?: number
          room_id?: string
          updated_at?: string
          wiring_spec?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "electrical_estimations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "electrical_estimations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "project_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      electrical_project_settings: {
        Row: {
          created_at: string
          db_mcb_cost: number
          labour_cost: number
          labour_share_pct: number
          margin_pct: number
          material_cost: number
          organization_id: string
          project_id: string
          rounding_unit: number
          selling_price: number
          total_cost: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          db_mcb_cost?: number
          labour_cost?: number
          labour_share_pct?: number
          margin_pct?: number
          material_cost?: number
          organization_id: string
          project_id: string
          rounding_unit?: number
          selling_price?: number
          total_cost?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          db_mcb_cost?: number
          labour_cost?: number
          labour_share_pct?: number
          margin_pct?: number
          material_cost?: number
          organization_id?: string
          project_id?: string
          rounding_unit?: number
          selling_price?: number
          total_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "electrical_project_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "electrical_project_settings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      flooring_estimations: {
        Row: {
          adhesive_grout_rate: number | null
          created_at: string
          flooring_type: Database["public"]["Enums"]["flooring_type"]
          id: string
          labour_cost: number
          laying_labour_rate: number | null
          margin_pct: number
          material_cost: number
          organization_id: string
          pieces_per_box: number | null
          price_per_box: number | null
          room_id: string
          rounding_unit: number
          selling_price: number
          skirting_length: number
          skirting_rate: number
          tile_length: number | null
          tile_width: number | null
          total_cost: number
          updated_at: string
          wastage_pct: number
        }
        Insert: {
          adhesive_grout_rate?: number | null
          created_at?: string
          flooring_type?: Database["public"]["Enums"]["flooring_type"]
          id?: string
          labour_cost?: number
          laying_labour_rate?: number | null
          margin_pct?: number
          material_cost?: number
          organization_id: string
          pieces_per_box?: number | null
          price_per_box?: number | null
          room_id: string
          rounding_unit?: number
          selling_price?: number
          skirting_length?: number
          skirting_rate?: number
          tile_length?: number | null
          tile_width?: number | null
          total_cost?: number
          updated_at?: string
          wastage_pct?: number
        }
        Update: {
          adhesive_grout_rate?: number | null
          created_at?: string
          flooring_type?: Database["public"]["Enums"]["flooring_type"]
          id?: string
          labour_cost?: number
          laying_labour_rate?: number | null
          margin_pct?: number
          material_cost?: number
          organization_id?: string
          pieces_per_box?: number | null
          price_per_box?: number | null
          room_id?: string
          rounding_unit?: number
          selling_price?: number
          skirting_length?: number
          skirting_rate?: number
          tile_length?: number | null
          tile_width?: number | null
          total_cost?: number
          updated_at?: string
          wastage_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "flooring_estimations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flooring_estimations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "project_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      handover_checks: {
        Row: {
          check_item: string
          checked_by: string | null
          checked_on: string | null
          created_at: string
          id: string
          organization_id: string
          project_id: string
          result: Database["public"]["Enums"]["handover_check_result"] | null
          room_area: string | null
          updated_at: string
        }
        Insert: {
          check_item: string
          checked_by?: string | null
          checked_on?: string | null
          created_at?: string
          id?: string
          organization_id: string
          project_id: string
          result?: Database["public"]["Enums"]["handover_check_result"] | null
          room_area?: string | null
          updated_at?: string
        }
        Update: {
          check_item?: string
          checked_by?: string | null
          checked_on?: string | null
          created_at?: string
          id?: string
          organization_id?: string
          project_id?: string
          result?: Database["public"]["Enums"]["handover_check_result"] | null
          room_area?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "handover_checks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handover_checks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      inspiration_images: {
        Row: {
          category: Database["public"]["Enums"]["inspiration_category"]
          created_at: string
          id: string
          image_url: string
          material_specification: string | null
          moodboard_id: string | null
          notes: string | null
          organization_id: string
          project_id: string | null
          room_id: string | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["inspiration_category"]
          created_at?: string
          id?: string
          image_url: string
          material_specification?: string | null
          moodboard_id?: string | null
          notes?: string | null
          organization_id: string
          project_id?: string | null
          room_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["inspiration_category"]
          created_at?: string
          id?: string
          image_url?: string
          material_specification?: string | null
          moodboard_id?: string | null
          notes?: string | null
          organization_id?: string
          project_id?: string | null
          room_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspiration_images_moodboard_id_fkey"
            columns: ["moodboard_id"]
            isOneToOne: false
            referencedRelation: "moodboards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspiration_images_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspiration_images_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspiration_images_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "project_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspiration_images_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kitchen_accessories: {
        Row: {
          amount: number
          created_at: string
          id: string
          kitchen_estimation_id: string
          name: string
          organization_id: string
          qty: number
          rate: number
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          kitchen_estimation_id: string
          name: string
          organization_id: string
          qty?: number
          rate?: number
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          kitchen_estimation_id?: string
          name?: string
          organization_id?: string
          qty?: number
          rate?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kitchen_accessories_kitchen_estimation_id_fkey"
            columns: ["kitchen_estimation_id"]
            isOneToOne: false
            referencedRelation: "kitchen_estimations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kitchen_accessories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      kitchen_estimations: {
        Row: {
          base_rate: number
          base_rft: number
          calc_version: string | null
          corner_qty: number
          corner_rate: number
          countertop_area: number
          countertop_rate: number
          created_at: string
          id: string
          install_labour_pct: number
          labour_cost: number
          layout_type: Database["public"]["Enums"]["kitchen_layout_type"]
          margin_pct: number
          material_cost: number
          organization_id: string
          project_id: string
          rate_snapshot: Json | null
          rounding_unit: number
          selling_price: number
          tall_qty: number
          tall_rate: number
          total_cost: number
          updated_at: string
          wall_rate: number
          wall_rft: number
          wastage_pct: number
        }
        Insert: {
          base_rate?: number
          base_rft?: number
          calc_version?: string | null
          corner_qty?: number
          corner_rate?: number
          countertop_area?: number
          countertop_rate?: number
          created_at?: string
          id?: string
          install_labour_pct?: number
          labour_cost?: number
          layout_type?: Database["public"]["Enums"]["kitchen_layout_type"]
          margin_pct?: number
          material_cost?: number
          organization_id: string
          project_id: string
          rate_snapshot?: Json | null
          rounding_unit?: number
          selling_price?: number
          tall_qty?: number
          tall_rate?: number
          total_cost?: number
          updated_at?: string
          wall_rate?: number
          wall_rft?: number
          wastage_pct?: number
        }
        Update: {
          base_rate?: number
          base_rft?: number
          calc_version?: string | null
          corner_qty?: number
          corner_rate?: number
          countertop_area?: number
          countertop_rate?: number
          created_at?: string
          id?: string
          install_labour_pct?: number
          labour_cost?: number
          layout_type?: Database["public"]["Enums"]["kitchen_layout_type"]
          margin_pct?: number
          material_cost?: number
          organization_id?: string
          project_id?: string
          rate_snapshot?: Json | null
          rounding_unit?: number
          selling_price?: number
          tall_qty?: number
          tall_rate?: number
          total_cost?: number
          updated_at?: string
          wall_rate?: number
          wall_rft?: number
          wastage_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "kitchen_estimations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kitchen_estimations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      labour_advances: {
        Row: {
          advance_date: string
          amount: number
          created_at: string
          id: string
          organization_id: string
          reason: string | null
          updated_at: string
          worker_id: string
        }
        Insert: {
          advance_date?: string
          amount: number
          created_at?: string
          id?: string
          organization_id: string
          reason?: string | null
          updated_at?: string
          worker_id: string
        }
        Update: {
          advance_date?: string
          amount?: number
          created_at?: string
          id?: string
          organization_id?: string
          reason?: string | null
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "labour_advances_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "labour_advances_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      labour_attendance: {
        Row: {
          attendance_date: string
          created_at: string
          day_pay: number
          day_wage: number
          hours_in_day: number
          id: string
          organization_id: string
          overtime_hours: number
          piece_pay: number
          piece_work: string | null
          pieces: number | null
          project_id: string | null
          rate_per_piece: number | null
          status: Database["public"]["Enums"]["labour_attendance_status"]
          total_pay: number
          updated_at: string
          worker_id: string
        }
        Insert: {
          attendance_date?: string
          created_at?: string
          day_pay?: number
          day_wage: number
          hours_in_day?: number
          id?: string
          organization_id: string
          overtime_hours?: number
          piece_pay?: number
          piece_work?: string | null
          pieces?: number | null
          project_id?: string | null
          rate_per_piece?: number | null
          status?: Database["public"]["Enums"]["labour_attendance_status"]
          total_pay?: number
          updated_at?: string
          worker_id: string
        }
        Update: {
          attendance_date?: string
          created_at?: string
          day_pay?: number
          day_wage?: number
          hours_in_day?: number
          id?: string
          organization_id?: string
          overtime_hours?: number
          piece_pay?: number
          piece_work?: string | null
          pieces?: number | null
          project_id?: string | null
          rate_per_piece?: number | null
          status?: Database["public"]["Enums"]["labour_attendance_status"]
          total_pay?: number
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "labour_attendance_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "labour_attendance_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "labour_attendance_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      labour_weekly_payments: {
        Row: {
          advance_recovered: number
          created_at: string
          id: string
          mode: Database["public"]["Enums"]["vendor_payment_mode"]
          organization_id: string
          paid: number
          updated_at: string
          week_starting: string
          worker_id: string
        }
        Insert: {
          advance_recovered?: number
          created_at?: string
          id?: string
          mode?: Database["public"]["Enums"]["vendor_payment_mode"]
          organization_id: string
          paid?: number
          updated_at?: string
          week_starting: string
          worker_id: string
        }
        Update: {
          advance_recovered?: number
          created_at?: string
          id?: string
          mode?: Database["public"]["Enums"]["vendor_payment_mode"]
          organization_id?: string
          paid?: number
          updated_at?: string
          week_starting?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "labour_weekly_payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "labour_weekly_payments_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_followups: {
        Row: {
          channel: Database["public"]["Enums"]["lead_followup_channel"]
          created_at: string
          followup_date: string
          handled_by: string | null
          id: string
          lead_id: string
          organization_id: string
          outcome: string | null
          stage_snapshot: Database["public"]["Enums"]["lead_stage"] | null
          updated_at: string
        }
        Insert: {
          channel?: Database["public"]["Enums"]["lead_followup_channel"]
          created_at?: string
          followup_date?: string
          handled_by?: string | null
          id?: string
          lead_id: string
          organization_id: string
          outcome?: string | null
          stage_snapshot?: Database["public"]["Enums"]["lead_stage"] | null
          updated_at?: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["lead_followup_channel"]
          created_at?: string
          followup_date?: string
          handled_by?: string | null
          id?: string
          lead_id?: string
          organization_id?: string
          outcome?: string | null
          stage_snapshot?: Database["public"]["Enums"]["lead_stage"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_followups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_followups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_quotations: {
        Row: {
          created_at: string
          discount_pct: number
          final_amount: number | null
          id: string
          lead_id: string
          organization_id: string
          quote_date: string
          quote_number: string
          quoted_amount: number
          status: Database["public"]["Enums"]["lead_quotation_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount_pct?: number
          final_amount?: number | null
          id?: string
          lead_id: string
          organization_id: string
          quote_date?: string
          quote_number: string
          quoted_amount: number
          status?: Database["public"]["Enums"]["lead_quotation_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount_pct?: number
          final_amount?: number | null
          id?: string
          lead_id?: string
          organization_id?: string
          quote_date?: string
          quote_number?: string
          quoted_amount?: number
          status?: Database["public"]["Enums"]["lead_quotation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_quotations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_quotations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          area: string | null
          budget: number | null
          client_name: string
          created_at: string
          custom_1: string | null
          custom_2: string | null
          enquiry_date: string
          id: string
          lead_code: string
          next_followup_date: string | null
          notes: string | null
          organization_id: string
          phone: string | null
          property_type: string | null
          source: Database["public"]["Enums"]["lead_source"]
          stage: Database["public"]["Enums"]["lead_stage"]
          updated_at: string
        }
        Insert: {
          area?: string | null
          budget?: number | null
          client_name: string
          created_at?: string
          custom_1?: string | null
          custom_2?: string | null
          enquiry_date?: string
          id?: string
          lead_code: string
          next_followup_date?: string | null
          notes?: string | null
          organization_id: string
          phone?: string | null
          property_type?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          stage?: Database["public"]["Enums"]["lead_stage"]
          updated_at?: string
        }
        Update: {
          area?: string | null
          budget?: number | null
          client_name?: string
          created_at?: string
          custom_1?: string | null
          custom_2?: string | null
          enquiry_date?: string
          id?: string
          lead_code?: string
          next_followup_date?: string | null
          notes?: string | null
          organization_id?: string
          phone?: string | null
          property_type?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          stage?: Database["public"]["Enums"]["lead_stage"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      material_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          organization_id: string
          parent_category_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          organization_id: string
          parent_category_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          parent_category_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "material_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      material_issues: {
        Row: {
          created_at: string
          id: string
          issue_date: string
          issued_to: string | null
          item: string
          organization_id: string
          project_id: string
          purchase_order_id: string | null
          qty: number
          rate: number
          unit: string
          updated_at: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          issue_date?: string
          issued_to?: string | null
          item: string
          organization_id: string
          project_id: string
          purchase_order_id?: string | null
          qty: number
          rate: number
          unit: string
          updated_at?: string
          value?: number
        }
        Update: {
          created_at?: string
          id?: string
          issue_date?: string
          issued_to?: string | null
          item?: string
          organization_id?: string
          project_id?: string
          purchase_order_id?: string | null
          qty?: number
          rate?: number
          unit?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "material_issues_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_issues_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_issues_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      material_rates: {
        Row: {
          created_at: string
          current_rate: number
          effective_date: string | null
          id: string
          last_updated_at: string
          market_high: number | null
          market_low: number | null
          material_id: string
          monthly_volume: number
          notes: string | null
          organization_id: string
          planned_increase_pct: number
          previous_rate: number | null
          revised_rate: number | null
          round_step: number
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_rate?: number
          effective_date?: string | null
          id?: string
          last_updated_at?: string
          market_high?: number | null
          market_low?: number | null
          material_id: string
          monthly_volume?: number
          notes?: string | null
          organization_id: string
          planned_increase_pct?: number
          previous_rate?: number | null
          revised_rate?: number | null
          round_step?: number
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_rate?: number
          effective_date?: string | null
          id?: string
          last_updated_at?: string
          market_high?: number | null
          market_low?: number | null
          material_id?: string
          monthly_volume?: number
          notes?: string | null
          organization_id?: string
          planned_increase_pct?: number
          previous_rate?: number | null
          revised_rate?: number | null
          round_step?: number
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_rates_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_rates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_rates_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          archived_at: string | null
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          unit: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          unit: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "material_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      moodboards: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
          project_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          project_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          project_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "moodboards_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moodboards_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          invited_at: string | null
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_at?: string | null
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_at?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_settings: {
        Row: {
          created_at: string
          organization_id: string
          settings: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          organization_id: string
          settings?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          organization_id?: string
          settings?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          default_contingency_pct: number
          default_gst_pct: number
          gstin: string | null
          id: string
          logo_url: string | null
          name: string
          next_design_revision_seq: number
          next_invoice_seq: number
          next_lead_quote_seq: number
          next_lead_seq: number
          next_project_seq: number
          next_purchase_order_seq: number
          next_snag_seq: number
          next_vendor_seq: number
          next_worker_seq: number
          quotation_prefix: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          default_contingency_pct?: number
          default_gst_pct?: number
          gstin?: string | null
          id?: string
          logo_url?: string | null
          name: string
          next_design_revision_seq?: number
          next_invoice_seq?: number
          next_lead_quote_seq?: number
          next_lead_seq?: number
          next_project_seq?: number
          next_purchase_order_seq?: number
          next_snag_seq?: number
          next_vendor_seq?: number
          next_worker_seq?: number
          quotation_prefix?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          default_contingency_pct?: number
          default_gst_pct?: number
          gstin?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          next_design_revision_seq?: number
          next_invoice_seq?: number
          next_lead_quote_seq?: number
          next_lead_seq?: number
          next_project_seq?: number
          next_purchase_order_seq?: number
          next_snag_seq?: number
          next_vendor_seq?: number
          next_worker_seq?: number
          quotation_prefix?: string
          updated_at?: string
        }
        Relationships: []
      }
      package_components: {
        Row: {
          brand_options: string | null
          component: Database["public"]["Enums"]["package_component_type"]
          created_at: string
          id: string
          organization_id: string
          package_id: string
          rate_per_sqft: number
          spec_text: string | null
          updated_at: string
        }
        Insert: {
          brand_options?: string | null
          component: Database["public"]["Enums"]["package_component_type"]
          created_at?: string
          id?: string
          organization_id: string
          package_id: string
          rate_per_sqft?: number
          spec_text?: string | null
          updated_at?: string
        }
        Update: {
          brand_options?: string | null
          component?: Database["public"]["Enums"]["package_component_type"]
          created_at?: string
          id?: string
          organization_id?: string
          package_id?: string
          rate_per_sqft?: number
          spec_text?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_components_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_components_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "project_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      paint_estimations: {
        Row: {
          can_size: number | null
          ceiling_area: number
          coats: number
          created_at: string
          feature_wall_area: number
          finish_type: string | null
          id: string
          labour_cost: number
          labour_rate: number | null
          margin_pct: number
          material_cost: number
          net_wall_area: number
          organization_id: string
          paint_brand: string | null
          paint_coverage_per_litre: number | null
          paint_rate: number | null
          primer_coverage: number | null
          primer_rate: number | null
          project_id: string
          putty_coverage: number | null
          putty_rate: number | null
          room_id: string | null
          rounding_unit: number
          selling_price: number
          total_cost: number
          updated_at: string
          wallpaper_fixing_rate: number
          wallpaper_rate: number | null
          wallpaper_roll_length: number | null
          wallpaper_roll_width: number | null
          wastage_pct: number
        }
        Insert: {
          can_size?: number | null
          ceiling_area?: number
          coats?: number
          created_at?: string
          feature_wall_area?: number
          finish_type?: string | null
          id?: string
          labour_cost?: number
          labour_rate?: number | null
          margin_pct?: number
          material_cost?: number
          net_wall_area?: number
          organization_id: string
          paint_brand?: string | null
          paint_coverage_per_litre?: number | null
          paint_rate?: number | null
          primer_coverage?: number | null
          primer_rate?: number | null
          project_id: string
          putty_coverage?: number | null
          putty_rate?: number | null
          room_id?: string | null
          rounding_unit?: number
          selling_price?: number
          total_cost?: number
          updated_at?: string
          wallpaper_fixing_rate?: number
          wallpaper_rate?: number | null
          wallpaper_roll_length?: number | null
          wallpaper_roll_width?: number | null
          wastage_pct?: number
        }
        Update: {
          can_size?: number | null
          ceiling_area?: number
          coats?: number
          created_at?: string
          feature_wall_area?: number
          finish_type?: string | null
          id?: string
          labour_cost?: number
          labour_rate?: number | null
          margin_pct?: number
          material_cost?: number
          net_wall_area?: number
          organization_id?: string
          paint_brand?: string | null
          paint_coverage_per_litre?: number | null
          paint_rate?: number | null
          primer_coverage?: number | null
          primer_rate?: number | null
          project_id?: string
          putty_coverage?: number | null
          putty_rate?: number | null
          room_id?: string | null
          rounding_unit?: number
          selling_price?: number
          total_cost?: number
          updated_at?: string
          wallpaper_fixing_rate?: number
          wallpaper_rate?: number | null
          wallpaper_roll_length?: number | null
          wallpaper_roll_width?: number | null
          wastage_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "paint_estimations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paint_estimations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paint_estimations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "project_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      panel_cut_lists: {
        Row: {
          board_grade: string | null
          created_at: string
          has_edge_band: boolean
          id: string
          laminate_faces: number
          laminate_thickness: string | null
          laminate_type: string | null
          organization_id: string
          panel_length: number | null
          panel_width: number | null
          plywood_thickness: string | null
          project_id: string
          qty: number
          updated_at: string
          wastage_pct: number
        }
        Insert: {
          board_grade?: string | null
          created_at?: string
          has_edge_band?: boolean
          id?: string
          laminate_faces?: number
          laminate_thickness?: string | null
          laminate_type?: string | null
          organization_id: string
          panel_length?: number | null
          panel_width?: number | null
          plywood_thickness?: string | null
          project_id: string
          qty?: number
          updated_at?: string
          wastage_pct?: number
        }
        Update: {
          board_grade?: string | null
          created_at?: string
          has_edge_band?: boolean
          id?: string
          laminate_faces?: number
          laminate_thickness?: string | null
          laminate_type?: string | null
          organization_id?: string
          panel_length?: number | null
          panel_width?: number | null
          plywood_thickness?: string | null
          project_id?: string
          qty?: number
          updated_at?: string
          wastage_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "panel_cut_lists_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "panel_cut_lists_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      plywood_project_settings: {
        Row: {
          created_at: string
          edge_band_rate_per_rft: number
          fixings_pct: number
          laminate_rate_per_sheet: number
          margin_pct: number
          material_cost: number
          organization_id: string
          project_id: string
          rounding_unit: number
          selling_price: number
          total_cost: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          edge_band_rate_per_rft?: number
          fixings_pct?: number
          laminate_rate_per_sheet?: number
          margin_pct?: number
          material_cost?: number
          organization_id: string
          project_id: string
          rounding_unit?: number
          selling_price?: number
          total_cost?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          edge_band_rate_per_rft?: number
          fixings_pct?: number
          laminate_rate_per_sheet?: number
          margin_pct?: number
          material_cost?: number
          organization_id?: string
          project_id?: string
          rounding_unit?: number
          selling_price?: number
          total_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plywood_project_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plywood_project_settings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      plywood_rates: {
        Row: {
          board_grade: string
          created_at: string
          id: string
          organization_id: string
          rate_per_sheet: number
          sheet_length: number
          sheet_width: number
          updated_at: string
        }
        Insert: {
          board_grade: string
          created_at?: string
          id?: string
          organization_id: string
          rate_per_sheet?: number
          sheet_length?: number
          sheet_width?: number
          updated_at?: string
        }
        Update: {
          board_grade?: string
          created_at?: string
          id?: string
          organization_id?: string
          rate_per_sheet?: number
          sheet_length?: number
          sheet_width?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plywood_rates_organization_id_fkey"
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
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_boq_settings: {
        Row: {
          contingency_pct: number
          created_at: string
          gst_pct: number
          organization_id: string
          project_id: string
          updated_at: string
        }
        Insert: {
          contingency_pct?: number
          created_at?: string
          gst_pct?: number
          organization_id: string
          project_id: string
          updated_at?: string
        }
        Update: {
          contingency_pct?: number
          created_at?: string
          gst_pct?: number
          organization_id?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_boq_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_boq_settings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_expenses: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          description: string | null
          expense_date: string
          id: string
          organization_id: string
          project_id: string
          receipt_url: string | null
          recorded_by: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          organization_id: string
          project_id: string
          receipt_url?: string | null
          recorded_by?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          organization_id?: string
          project_id?: string
          receipt_url?: string | null
          recorded_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_expenses_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_packages: {
        Row: {
          created_at: string
          id: string
          is_selected: boolean
          organization_id: string
          project_id: string
          round_step: number
          tier: Database["public"]["Enums"]["package_tier"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_selected?: boolean
          organization_id: string
          project_id: string
          round_step?: number
          tier: Database["public"]["Enums"]["package_tier"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_selected?: boolean
          organization_id?: string
          project_id?: string
          round_step?: number
          tier?: Database["public"]["Enums"]["package_tier"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_packages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_packages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_payments: {
        Row: {
          amount: number
          created_at: string
          direction: Database["public"]["Enums"]["payment_direction"]
          id: string
          invoice_id: string | null
          method: string | null
          organization_id: string
          payment_date: string
          project_id: string
          receipt_url: string | null
          recorded_by: string | null
          reference_note: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          direction: Database["public"]["Enums"]["payment_direction"]
          id?: string
          invoice_id?: string | null
          method?: string | null
          organization_id: string
          payment_date?: string
          project_id: string
          receipt_url?: string | null
          recorded_by?: string | null
          reference_note?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          direction?: Database["public"]["Enums"]["payment_direction"]
          id?: string
          invoice_id?: string | null
          method?: string | null
          organization_id?: string
          payment_date?: string
          project_id?: string
          receipt_url?: string | null
          recorded_by?: string | null
          reference_note?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "client_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_payments_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_rooms: {
        Row: {
          ceiling_area: number | null
          created_at: string
          floor_area: number | null
          gross_wall_area: number | null
          height: number | null
          height_ft: number | null
          id: string
          length: number | null
          length_ft: number | null
          net_wall_area: number | null
          organization_id: string
          plan_floor_material: string | null
          plan_furniture: Json | null
          plan_open_walls: string[]
          plan_rotation: number
          plan_wall_color: string | null
          plan_wall_designs: Json
          plan_wall_gaps: Json
          plan_x: number | null
          plan_y: number | null
          project_id: string
          room_category: Database["public"]["Enums"]["room_category"]
          room_name: string
          unit_system: Database["public"]["Enums"]["unit_system"]
          updated_at: string
          width: number | null
          width_ft: number | null
        }
        Insert: {
          ceiling_area?: number | null
          created_at?: string
          floor_area?: number | null
          gross_wall_area?: number | null
          height?: number | null
          height_ft?: number | null
          id?: string
          length?: number | null
          length_ft?: number | null
          net_wall_area?: number | null
          organization_id: string
          plan_floor_material?: string | null
          plan_furniture?: Json | null
          plan_open_walls?: string[]
          plan_rotation?: number
          plan_wall_color?: string | null
          plan_wall_designs?: Json
          plan_wall_gaps?: Json
          plan_x?: number | null
          plan_y?: number | null
          project_id: string
          room_category?: Database["public"]["Enums"]["room_category"]
          room_name: string
          unit_system?: Database["public"]["Enums"]["unit_system"]
          updated_at?: string
          width?: number | null
          width_ft?: number | null
        }
        Update: {
          ceiling_area?: number | null
          created_at?: string
          floor_area?: number | null
          gross_wall_area?: number | null
          height?: number | null
          height_ft?: number | null
          id?: string
          length?: number | null
          length_ft?: number | null
          net_wall_area?: number | null
          organization_id?: string
          plan_floor_material?: string | null
          plan_furniture?: Json | null
          plan_open_walls?: string[]
          plan_rotation?: number
          plan_wall_color?: string | null
          plan_wall_designs?: Json
          plan_wall_gaps?: Json
          plan_x?: number | null
          plan_y?: number | null
          project_id?: string
          room_category?: Database["public"]["Enums"]["room_category"]
          room_name?: string
          unit_system?: Database["public"]["Enums"]["unit_system"]
          updated_at?: string
          width?: number | null
          width_ft?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_rooms_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_rooms_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_settings: {
        Row: {
          created_at: string
          organization_id: string
          other_head_labour_cost: number
          other_head_material_cost: number
          overhead_pct: number
          project_duration_months: number
          project_id: string
          supervisor_monthly_cost: number
          target_margin_pct: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          organization_id: string
          other_head_labour_cost?: number
          other_head_material_cost?: number
          overhead_pct?: number
          project_duration_months?: number
          project_id: string
          supervisor_monthly_cost?: number
          target_margin_pct?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          organization_id?: string
          other_head_labour_cost?: number
          other_head_material_cost?: number
          overhead_pct?: number
          project_duration_months?: number
          project_id?: string
          supervisor_monthly_cost?: number
          target_margin_pct?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_settings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          archived_at: string | null
          assigned_designer_id: string | null
          bathrooms: number | null
          bedrooms: number | null
          built_up_area: number | null
          carpet_area: number | null
          client_id: string
          created_at: string
          description: string | null
          expected_completion_date: string | null
          id: string
          name: string
          organization_id: string
          plan_floor_material: string | null
          plan_passage: Json | null
          project_code: string
          property_address: string | null
          property_type: Database["public"]["Enums"]["property_type"] | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          assigned_designer_id?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          built_up_area?: number | null
          carpet_area?: number | null
          client_id: string
          created_at?: string
          description?: string | null
          expected_completion_date?: string | null
          id?: string
          name: string
          organization_id: string
          plan_floor_material?: string | null
          plan_passage?: Json | null
          project_code: string
          property_address?: string | null
          property_type?: Database["public"]["Enums"]["property_type"] | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          assigned_designer_id?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          built_up_area?: number | null
          carpet_area?: number | null
          client_id?: string
          created_at?: string
          description?: string | null
          expected_completion_date?: string | null
          id?: string
          name?: string
          organization_id?: string
          plan_floor_material?: string | null
          plan_passage?: Json | null
          project_code?: string
          property_address?: string | null
          property_type?: Database["public"]["Enums"]["property_type"] | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_assigned_designer_id_fkey"
            columns: ["assigned_designer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          amount: number
          created_at: string
          delivery_status: Database["public"]["Enums"]["purchase_delivery_status"]
          gst_pct: number
          id: string
          item: string
          order_date: string
          organization_id: string
          po_number: string
          project_id: string | null
          qty: number
          rate: number
          unit: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          delivery_status?: Database["public"]["Enums"]["purchase_delivery_status"]
          gst_pct?: number
          id?: string
          item: string
          order_date?: string
          organization_id: string
          po_number: string
          project_id?: string | null
          qty: number
          rate: number
          unit: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          delivery_status?: Database["public"]["Enums"]["purchase_delivery_status"]
          gst_pct?: number
          id?: string
          item?: string
          order_date?: string
          organization_id?: string
          po_number?: string
          project_id?: string | null
          qty?: number
          rate?: number
          unit?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_items: {
        Row: {
          amount: number
          created_at: string
          id: string
          item_description: string
          organization_id: string
          quantity: number
          quotation_id: string
          rate: number
          room_label: string | null
          specification: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          item_description: string
          organization_id: string
          quantity?: number
          quotation_id: string
          rate?: number
          room_label?: string | null
          specification?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          item_description?: string
          organization_id?: string
          quantity?: number
          quotation_id?: string
          rate?: number
          room_label?: string | null
          specification?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_number_sequences: {
        Row: {
          financial_year: string
          next_seq: number
          organization_id: string
        }
        Insert: {
          financial_year: string
          next_seq?: number
          organization_id: string
        }
        Update: {
          financial_year?: string
          next_seq?: number
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotation_number_sequences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_payment_stages: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          quotation_id: string
          stage_amount: number
          stage_name: string
          stage_pct: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          quotation_id: string
          stage_amount?: number
          stage_name: string
          stage_pct?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          quotation_id?: string
          stage_amount?: number
          stage_name?: string
          stage_pct?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotation_payment_stages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_payment_stages_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_snapshots: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          quotation_id: string
          snapshot: Json
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          quotation_id: string
          snapshot: Json
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          quotation_id?: string
          snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "quotation_snapshots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_snapshots_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          approved_at: string | null
          contingency_amount: number
          created_at: string
          discount_amount: number
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          grand_total: number
          gross_amount: number
          gst_amount: number
          gst_pct: number
          id: string
          organization_id: string
          parent_quotation_id: string | null
          project_id: string
          quotation_date: string
          quotation_number: string
          round_off: number
          sent_at: string | null
          status: Database["public"]["Enums"]["quotation_status"]
          subtotal: number
          taxable_amount: number
          updated_at: string
          validity_date: string | null
          version: number
        }
        Insert: {
          approved_at?: string | null
          contingency_amount?: number
          created_at?: string
          discount_amount?: number
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          grand_total?: number
          gross_amount?: number
          gst_amount?: number
          gst_pct?: number
          id?: string
          organization_id: string
          parent_quotation_id?: string | null
          project_id: string
          quotation_date?: string
          quotation_number: string
          round_off?: number
          sent_at?: string | null
          status?: Database["public"]["Enums"]["quotation_status"]
          subtotal?: number
          taxable_amount?: number
          updated_at?: string
          validity_date?: string | null
          version?: number
        }
        Update: {
          approved_at?: string | null
          contingency_amount?: number
          created_at?: string
          discount_amount?: number
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          grand_total?: number
          gross_amount?: number
          gst_amount?: number
          gst_pct?: number
          id?: string
          organization_id?: string
          parent_quotation_id?: string | null
          project_id?: string
          quotation_date?: string
          quotation_number?: string
          round_off?: number
          sent_at?: string | null
          status?: Database["public"]["Enums"]["quotation_status"]
          subtotal?: number
          taxable_amount?: number
          updated_at?: string
          validity_date?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_parent_quotation_id_fkey"
            columns: ["parent_quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          material_rate_id: string
          new_rate: number | null
          old_rate: number | null
          organization_id: string
          reason: string | null
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          material_rate_id: string
          new_rate?: number | null
          old_rate?: number | null
          organization_id: string
          reason?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          material_rate_id?: string
          new_rate?: number | null
          old_rate?: number | null
          organization_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rate_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rate_history_material_rate_id_fkey"
            columns: ["material_rate_id"]
            isOneToOne: false
            referencedRelation: "material_rates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rate_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      room_measurement_audit: {
        Row: {
          changed_at: string
          changed_by: string | null
          field_name: string
          id: string
          new_value: string | null
          old_value: string | null
          organization_id: string
          room_id: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          organization_id: string
          room_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          organization_id?: string
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_measurement_audit_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_measurement_audit_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_measurement_audit_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "project_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_openings: {
        Row: {
          created_at: string
          height: number | null
          id: string
          is_custom: boolean
          opening_type: Database["public"]["Enums"]["opening_type"]
          organization_id: string
          plan_full_height: boolean
          plan_main_door: boolean
          plan_offset: number | null
          plan_swing: number
          plan_wall: string | null
          quantity: number
          room_id: string
          updated_at: string
          width: number | null
        }
        Insert: {
          created_at?: string
          height?: number | null
          id?: string
          is_custom?: boolean
          opening_type?: Database["public"]["Enums"]["opening_type"]
          organization_id: string
          plan_full_height?: boolean
          plan_main_door?: boolean
          plan_offset?: number | null
          plan_swing?: number
          plan_wall?: string | null
          quantity?: number
          room_id: string
          updated_at?: string
          width?: number | null
        }
        Update: {
          created_at?: string
          height?: number | null
          id?: string
          is_custom?: boolean
          opening_type?: Database["public"]["Enums"]["opening_type"]
          organization_id?: string
          plan_full_height?: boolean
          plan_main_door?: boolean
          plan_offset?: number | null
          plan_swing?: number
          plan_wall?: string | null
          quantity?: number
          room_id?: string
          updated_at?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "room_openings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_openings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "project_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      site_visits: {
        Row: {
          created_at: string
          id: string
          next_visit_in_days: number | null
          notes: string | null
          organization_id: string
          project_id: string
          purpose: string | null
          updated_at: string
          visit_date: string
          visited_by: string | null
          work_done_pct: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          next_visit_in_days?: number | null
          notes?: string | null
          organization_id: string
          project_id: string
          purpose?: string | null
          updated_at?: string
          visit_date?: string
          visited_by?: string | null
          work_done_pct?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          next_visit_in_days?: number | null
          notes?: string | null
          organization_id?: string
          project_id?: string
          purpose?: string | null
          updated_at?: string
          visit_date?: string
          visited_by?: string | null
          work_done_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "site_visits_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_visits_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      snags: {
        Row: {
          assigned_to: string | null
          created_at: string
          fix_by: string | null
          fixed_on: string | null
          found_on: string
          id: string
          issue: string
          item: string
          organization_id: string
          project_id: string
          room_area: string | null
          snag_code: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          fix_by?: string | null
          fixed_on?: string | null
          found_on?: string
          id?: string
          issue: string
          item: string
          organization_id: string
          project_id: string
          room_area?: string | null
          snag_code: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          fix_by?: string | null
          fixed_on?: string | null
          found_on?: string
          id?: string
          issue?: string
          item?: string
          organization_id?: string
          project_id?: string
          room_area?: string | null
          snag_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "snags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "snags_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      stage_tasks: {
        Row: {
          created_at: string
          done_by: string | null
          done_on: string | null
          id: string
          organization_id: string
          planned_date: string | null
          project_id: string
          stage: string
          task: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          done_by?: string | null
          done_on?: string | null
          id?: string
          organization_id: string
          planned_date?: string | null
          project_id: string
          stage: string
          task: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          done_by?: string | null
          done_on?: string | null
          id?: string
          organization_id?: string
          planned_date?: string | null
          project_id?: string
          stage?: string
          task?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stage_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stage_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          category: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          credit_days: number
          id: string
          name: string
          notes: string | null
          organization_id: string
          updated_at: string
          vendor_code: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          credit_days?: number
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          updated_at?: string
          vendor_code?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          credit_days?: number
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          updated_at?: string
          vendor_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          mode: Database["public"]["Enums"]["vendor_payment_mode"]
          organization_id: string
          payment_date: string
          reference: string | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          mode?: Database["public"]["Enums"]["vendor_payment_mode"]
          organization_id: string
          payment_date?: string
          reference?: string | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          mode?: Database["public"]["Enums"]["vendor_payment_mode"]
          organization_id?: string
          payment_date?: string
          reference?: string | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_payments_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      wardrobe_components: {
        Row: {
          amount: number
          component_name: Database["public"]["Enums"]["wardrobe_component_type"]
          created_at: string
          id: string
          organization_id: string
          qty: number
          rate: number
          updated_at: string
          wardrobe_id: string
        }
        Insert: {
          amount?: number
          component_name?: Database["public"]["Enums"]["wardrobe_component_type"]
          created_at?: string
          id?: string
          organization_id: string
          qty?: number
          rate?: number
          updated_at?: string
          wardrobe_id: string
        }
        Update: {
          amount?: number
          component_name?: Database["public"]["Enums"]["wardrobe_component_type"]
          created_at?: string
          id?: string
          organization_id?: string
          qty?: number
          rate?: number
          updated_at?: string
          wardrobe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wardrobe_components_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wardrobe_components_wardrobe_id_fkey"
            columns: ["wardrobe_id"]
            isOneToOne: false
            referencedRelation: "wardrobes"
            referencedColumns: ["id"]
          },
        ]
      }
      wardrobes: {
        Row: {
          created_at: string
          depth: number | null
          has_loft: boolean
          height: number | null
          hinged_rate: number
          id: string
          install_labour_pct: number
          loft_height: number
          loft_rate: number
          margin_pct: number
          material_cost: number
          name: string
          organization_id: string
          project_id: string
          room_id: string | null
          rounding_unit: number
          selling_price: number
          shutter_type: Database["public"]["Enums"]["shutter_type"]
          sliding_rate: number
          total_cost: number
          updated_at: string
          width: number | null
        }
        Insert: {
          created_at?: string
          depth?: number | null
          has_loft?: boolean
          height?: number | null
          hinged_rate?: number
          id?: string
          install_labour_pct?: number
          loft_height?: number
          loft_rate?: number
          margin_pct?: number
          material_cost?: number
          name: string
          organization_id: string
          project_id: string
          room_id?: string | null
          rounding_unit?: number
          selling_price?: number
          shutter_type?: Database["public"]["Enums"]["shutter_type"]
          sliding_rate?: number
          total_cost?: number
          updated_at?: string
          width?: number | null
        }
        Update: {
          created_at?: string
          depth?: number | null
          has_loft?: boolean
          height?: number | null
          hinged_rate?: number
          id?: string
          install_labour_pct?: number
          loft_height?: number
          loft_rate?: number
          margin_pct?: number
          material_cost?: number
          name?: string
          organization_id?: string
          project_id?: string
          room_id?: string | null
          rounding_unit?: number
          selling_price?: number
          shutter_type?: Database["public"]["Enums"]["shutter_type"]
          sliding_rate?: number
          total_cost?: number
          updated_at?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "wardrobes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wardrobes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wardrobes_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "project_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      warranties: {
        Row: {
          created_at: string
          handover_date: string
          id: string
          item: string
          organization_id: string
          project_id: string
          updated_at: string
          warranty_years: number
        }
        Insert: {
          created_at?: string
          handover_date?: string
          id?: string
          item: string
          organization_id: string
          project_id: string
          updated_at?: string
          warranty_years: number
        }
        Update: {
          created_at?: string
          handover_date?: string
          id?: string
          item?: string
          organization_id?: string
          project_id?: string
          updated_at?: string
          warranty_years?: number
        }
        Relationships: [
          {
            foreignKeyName: "warranties_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranties_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      workers: {
        Row: {
          created_at: string
          daily_wage: number
          id: string
          name: string
          organization_id: string
          phone: string | null
          team: string | null
          trade: Database["public"]["Enums"]["labour_trade"]
          updated_at: string
          worker_code: string
        }
        Insert: {
          created_at?: string
          daily_wage: number
          id?: string
          name: string
          organization_id: string
          phone?: string | null
          team?: string | null
          trade?: Database["public"]["Enums"]["labour_trade"]
          updated_at?: string
          worker_code: string
        }
        Update: {
          created_at?: string
          daily_wage?: number
          id?: string
          name?: string
          organization_id?: string
          phone?: string | null
          team?: string | null
          trade?: Database["public"]["Enums"]["labour_trade"]
          updated_at?: string
          worker_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "workers_organization_id_fkey"
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
      accept_organization_invite: { Args: never; Returns: string }
      allocate_design_revision_code: {
        Args: { p_org_id: string }
        Returns: string
      }
      allocate_invoice_number: { Args: { p_org_id: string }; Returns: string }
      allocate_lead_code: { Args: { p_org_id: string }; Returns: string }
      allocate_lead_quote_number: {
        Args: { p_org_id: string }
        Returns: string
      }
      allocate_project_code: { Args: { p_org_id: string }; Returns: string }
      allocate_purchase_order_number: {
        Args: { p_org_id: string }
        Returns: string
      }
      allocate_quotation_number: { Args: { p_org_id: string }; Returns: string }
      allocate_snag_code: { Args: { p_org_id: string }; Returns: string }
      allocate_vendor_code: { Args: { p_org_id: string }; Returns: string }
      allocate_worker_code: { Args: { p_org_id: string }; Returns: string }
      create_organization_with_owner: {
        Args: { org_name: string }
        Returns: string
      }
      get_organization_members: {
        Args: { p_org_id: string }
        Returns: {
          accepted_at: string
          email: string
          full_name: string
          invited_at: string
          member_id: string
          role: Database["public"]["Enums"]["org_role"]
          user_id: string
        }[]
      }
    }
    Enums: {
      boq_source_module:
        | "kitchen"
        | "wardrobe"
        | "plywood"
        | "ceiling"
        | "paint"
        | "flooring"
        | "electrical"
      ceiling_design: "cove" | "peripheral" | "none"
      ceiling_type: "gypsum" | "pop" | "grid" | "pvc" | "wooden" | "other"
      client_approval_channel:
        | "signed_drawing"
        | "message"
        | "email"
        | "in_person"
        | "other"
      design_fee_basis: "percent" | "per_sqft" | "fixed"
      design_revision_reply_status: "waiting" | "approved" | "changes_requested"
      discount_type: "percent" | "fixed"
      electrical_point_type:
        | "light"
        | "fan"
        | "socket_6a"
        | "socket_16a"
        | "ac"
        | "tv"
        | "data"
        | "geyser"
        | "profile_lighting"
        | "db_mcb"
        | "other"
      expense_category:
        | "material_purchase"
        | "labour_payment"
        | "transportation"
        | "site_expense"
        | "misc"
      flooring_type:
        | "vitrified"
        | "ceramic"
        | "marble"
        | "granite"
        | "wooden"
        | "vinyl"
        | "laminate"
        | "spc"
        | "no_work"
      handover_check_result: "ok" | "needs_work"
      inspiration_category:
        | "living_room"
        | "bedroom"
        | "modular_kitchen"
        | "bathroom"
        | "dining_room"
        | "wardrobe"
        | "false_ceiling"
        | "lighting"
        | "flooring"
        | "wallpaper"
        | "office_interiors"
      kitchen_layout_type:
        | "straight"
        | "l_shaped"
        | "u_shaped"
        | "parallel"
        | "island"
      labour_attendance_status:
        | "full_day"
        | "half_day"
        | "piece_work_only"
        | "absent"
      labour_trade:
        | "carpenter"
        | "helper"
        | "painter"
        | "electrician"
        | "ceiling_worker"
        | "polish_worker"
        | "tile_mason"
        | "other"
      lead_followup_channel:
        | "call"
        | "site_visit"
        | "studio_meeting"
        | "message"
        | "email"
        | "other"
      lead_quotation_status:
        | "sent"
        | "revised"
        | "accepted"
        | "declined"
        | "superseded"
      lead_source:
        | "referral"
        | "social_media"
        | "website"
        | "past_client"
        | "builder_tie_up"
        | "signboard"
        | "exhibition"
        | "walk_in"
        | "other"
      lead_stage:
        | "new"
        | "site_visit_done"
        | "design_shared"
        | "quotation_sent"
        | "negotiation"
        | "won"
        | "lost"
      opening_type: "door" | "window" | "other"
      org_role:
        | "super_admin"
        | "studio_owner"
        | "manager"
        | "designer"
        | "accountant"
        | "viewer"
      package_component_type:
        | "kitchen"
        | "wardrobe"
        | "ceiling"
        | "flooring"
        | "painting"
        | "electrical"
        | "lighting"
        | "other"
      package_tier: "basic" | "premium" | "luxury"
      payment_direction:
        | "client_advance"
        | "client_payment"
        | "supplier_payment"
      project_status:
        | "enquiry"
        | "site_visit"
        | "measurements_pending"
        | "design_in_progress"
        | "estimation_in_progress"
        | "quotation_sent"
        | "approved"
        | "execution_started"
        | "completed"
        | "cancelled"
      property_type:
        | "apartment"
        | "villa"
        | "independent_house"
        | "office"
        | "commercial"
      purchase_delivery_status: "pending" | "delivered"
      quotation_status:
        | "draft"
        | "sent"
        | "viewed"
        | "approved"
        | "rejected"
        | "expired"
      room_category:
        | "living_room"
        | "dining_room"
        | "master_bedroom"
        | "bedroom_2"
        | "bedroom_3"
        | "kitchen"
        | "bathroom"
        | "balcony"
        | "utility"
        | "passage"
        | "other"
        | "lobby"
        | "drawing_room"
        | "garage"
        | "staircase"
        | "porch"
        | "store_room"
      shutter_type: "hinged" | "sliding" | "open"
      unit_system: "feet_inches" | "metric"
      vendor_payment_mode: "cash" | "upi" | "bank_transfer" | "cheque" | "other"
      wardrobe_component_type:
        | "drawer"
        | "hanging_rod"
        | "shelf"
        | "pull_out"
        | "mirror"
        | "other"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      boq_source_module: [
        "kitchen",
        "wardrobe",
        "plywood",
        "ceiling",
        "paint",
        "flooring",
        "electrical",
      ],
      ceiling_design: ["cove", "peripheral", "none"],
      ceiling_type: ["gypsum", "pop", "grid", "pvc", "wooden", "other"],
      client_approval_channel: [
        "signed_drawing",
        "message",
        "email",
        "in_person",
        "other",
      ],
      design_fee_basis: ["percent", "per_sqft", "fixed"],
      design_revision_reply_status: [
        "waiting",
        "approved",
        "changes_requested",
      ],
      discount_type: ["percent", "fixed"],
      electrical_point_type: [
        "light",
        "fan",
        "socket_6a",
        "socket_16a",
        "ac",
        "tv",
        "data",
        "geyser",
        "profile_lighting",
        "db_mcb",
        "other",
      ],
      expense_category: [
        "material_purchase",
        "labour_payment",
        "transportation",
        "site_expense",
        "misc",
      ],
      flooring_type: [
        "vitrified",
        "ceramic",
        "marble",
        "granite",
        "wooden",
        "vinyl",
        "laminate",
        "spc",
        "no_work",
      ],
      handover_check_result: ["ok", "needs_work"],
      inspiration_category: [
        "living_room",
        "bedroom",
        "modular_kitchen",
        "bathroom",
        "dining_room",
        "wardrobe",
        "false_ceiling",
        "lighting",
        "flooring",
        "wallpaper",
        "office_interiors",
      ],
      kitchen_layout_type: [
        "straight",
        "l_shaped",
        "u_shaped",
        "parallel",
        "island",
      ],
      labour_attendance_status: [
        "full_day",
        "half_day",
        "piece_work_only",
        "absent",
      ],
      labour_trade: [
        "carpenter",
        "helper",
        "painter",
        "electrician",
        "ceiling_worker",
        "polish_worker",
        "tile_mason",
        "other",
      ],
      lead_followup_channel: [
        "call",
        "site_visit",
        "studio_meeting",
        "message",
        "email",
        "other",
      ],
      lead_quotation_status: [
        "sent",
        "revised",
        "accepted",
        "declined",
        "superseded",
      ],
      lead_source: [
        "referral",
        "social_media",
        "website",
        "past_client",
        "builder_tie_up",
        "signboard",
        "exhibition",
        "walk_in",
        "other",
      ],
      lead_stage: [
        "new",
        "site_visit_done",
        "design_shared",
        "quotation_sent",
        "negotiation",
        "won",
        "lost",
      ],
      opening_type: ["door", "window", "other"],
      org_role: [
        "super_admin",
        "studio_owner",
        "manager",
        "designer",
        "accountant",
        "viewer",
      ],
      package_component_type: [
        "kitchen",
        "wardrobe",
        "ceiling",
        "flooring",
        "painting",
        "electrical",
        "lighting",
        "other",
      ],
      package_tier: ["basic", "premium", "luxury"],
      payment_direction: [
        "client_advance",
        "client_payment",
        "supplier_payment",
      ],
      project_status: [
        "enquiry",
        "site_visit",
        "measurements_pending",
        "design_in_progress",
        "estimation_in_progress",
        "quotation_sent",
        "approved",
        "execution_started",
        "completed",
        "cancelled",
      ],
      property_type: [
        "apartment",
        "villa",
        "independent_house",
        "office",
        "commercial",
      ],
      purchase_delivery_status: ["pending", "delivered"],
      quotation_status: [
        "draft",
        "sent",
        "viewed",
        "approved",
        "rejected",
        "expired",
      ],
      room_category: [
        "living_room",
        "dining_room",
        "master_bedroom",
        "bedroom_2",
        "bedroom_3",
        "kitchen",
        "bathroom",
        "balcony",
        "utility",
        "passage",
        "other",
        "lobby",
        "drawing_room",
        "garage",
        "staircase",
        "porch",
        "store_room",
      ],
      shutter_type: ["hinged", "sliding", "open"],
      unit_system: ["feet_inches", "metric"],
      vendor_payment_mode: ["cash", "upi", "bank_transfer", "cheque", "other"],
      wardrobe_component_type: [
        "drawer",
        "hanging_rod",
        "shelf",
        "pull_out",
        "mirror",
        "other",
      ],
    },
  },
} as const
