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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      contacts: {
        Row: {
          company_name: string | null
          contact_name: string
          contact_owner: string | null
          contact_source: string | null
          created_by: string | null
          created_time: string | null
          description: string | null
          email: string | null
          id: string
          industry: string | null
          linkedin: string | null
          modified_by: string | null
          modified_time: string | null
          phone_no: string | null
          position: string | null
          region: string | null
          website: string | null
        }
        Insert: {
          company_name?: string | null
          contact_name: string
          contact_owner?: string | null
          contact_source?: string | null
          created_by?: string | null
          created_time?: string | null
          description?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          linkedin?: string | null
          modified_by?: string | null
          modified_time?: string | null
          phone_no?: string | null
          position?: string | null
          region?: string | null
          website?: string | null
        }
        Update: {
          company_name?: string | null
          contact_name?: string
          contact_owner?: string | null
          contact_source?: string | null
          created_by?: string | null
          created_time?: string | null
          description?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          linkedin?: string | null
          modified_by?: string | null
          modified_time?: string | null
          phone_no?: string | null
          position?: string | null
          region?: string | null
          website?: string | null
        }
        Relationships: []
      }
      dashboard_preferences: {
        Row: {
          card_order: Json | null
          created_at: string | null
          id: string
          layout_view: string | null
          updated_at: string | null
          user_id: string
          visible_widgets: Json | null
        }
        Insert: {
          card_order?: Json | null
          created_at?: string | null
          id?: string
          layout_view?: string | null
          updated_at?: string | null
          user_id: string
          visible_widgets?: Json | null
        }
        Update: {
          card_order?: Json | null
          created_at?: string | null
          id?: string
          layout_view?: string | null
          updated_at?: string | null
          user_id?: string
          visible_widgets?: Json | null
        }
        Relationships: []
      }
      deals: {
        Row: {
          action_items: string | null
          amount: number | null
          begin_execution_date: string | null
          budget: string | null
          budget_confirmed: string | null
          budget_holder: string | null
          business_value: string | null
          closing: string | null
          closing_date: string | null
          company_name: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          currency_type: string | null
          current_status: string | null
          customer_agreed_on_need: string | null
          customer_challenges: string | null
          customer_name: string | null
          customer_need: string | null
          customer_need_identified: boolean | null
          deal_name: string
          decision_expected_date: string | null
          decision_maker_level: string | null
          decision_maker_present: boolean | null
          decision_makers: string | null
          description: string | null
          drop_reason: string | null
          duration: number | null
          end_date: string | null
          execution_started: boolean | null
          expected_closing_date: string | null
          expected_deal_timeline_end: string | null
          expected_deal_timeline_start: string | null
          fax: string | null
          handoff_status: string | null
          id: string
          implementation_start_date: string | null
          internal_comment: string | null
          internal_notes: string | null
          is_recurring: string | null
          lead_name: string | null
          lead_owner: string | null
          loss_reason: string | null
          lost_reason: string | null
          modified_at: string | null
          modified_by: string | null
          nda_signed: boolean | null
          need_improvement: string | null
          need_summary: string | null
          negotiation_notes: string | null
          negotiation_status: string | null
          phone_no: string | null
          priority: number | null
          probability: number | null
          product_service_scope: string | null
          project_duration: number | null
          project_name: string | null
          project_type: string | null
          proposal_due_date: string | null
          proposal_sent_date: string | null
          quarterly_revenue_q1: number | null
          quarterly_revenue_q2: number | null
          quarterly_revenue_q3: number | null
          quarterly_revenue_q4: number | null
          region: string | null
          related_lead_id: string | null
          related_meeting_id: string | null
          relationship_strength: string | null
          revenue: number | null
          rfq_confirmation_note: string | null
          rfq_document_url: string | null
          rfq_received_date: string | null
          rfq_status: string | null
          rfq_value: number | null
          signed_contract_date: string | null
          stage: string
          start_date: string | null
          supplier_portal_access: string | null
          supplier_portal_required: boolean | null
          timeline: string | null
          total_contract_value: number | null
          total_revenue: number | null
          win_reason: string | null
          won_reason: string | null
        }
        Insert: {
          action_items?: string | null
          amount?: number | null
          begin_execution_date?: string | null
          budget?: string | null
          budget_confirmed?: string | null
          budget_holder?: string | null
          business_value?: string | null
          closing?: string | null
          closing_date?: string | null
          company_name?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          currency_type?: string | null
          current_status?: string | null
          customer_agreed_on_need?: string | null
          customer_challenges?: string | null
          customer_name?: string | null
          customer_need?: string | null
          customer_need_identified?: boolean | null
          deal_name: string
          decision_expected_date?: string | null
          decision_maker_level?: string | null
          decision_maker_present?: boolean | null
          decision_makers?: string | null
          description?: string | null
          drop_reason?: string | null
          duration?: number | null
          end_date?: string | null
          execution_started?: boolean | null
          expected_closing_date?: string | null
          expected_deal_timeline_end?: string | null
          expected_deal_timeline_start?: string | null
          fax?: string | null
          handoff_status?: string | null
          id?: string
          implementation_start_date?: string | null
          internal_comment?: string | null
          internal_notes?: string | null
          is_recurring?: string | null
          lead_name?: string | null
          lead_owner?: string | null
          loss_reason?: string | null
          lost_reason?: string | null
          modified_at?: string | null
          modified_by?: string | null
          nda_signed?: boolean | null
          need_improvement?: string | null
          need_summary?: string | null
          negotiation_notes?: string | null
          negotiation_status?: string | null
          phone_no?: string | null
          priority?: number | null
          probability?: number | null
          product_service_scope?: string | null
          project_duration?: number | null
          project_name?: string | null
          project_type?: string | null
          proposal_due_date?: string | null
          proposal_sent_date?: string | null
          quarterly_revenue_q1?: number | null
          quarterly_revenue_q2?: number | null
          quarterly_revenue_q3?: number | null
          quarterly_revenue_q4?: number | null
          region?: string | null
          related_lead_id?: string | null
          related_meeting_id?: string | null
          relationship_strength?: string | null
          revenue?: number | null
          rfq_confirmation_note?: string | null
          rfq_document_url?: string | null
          rfq_received_date?: string | null
          rfq_status?: string | null
          rfq_value?: number | null
          signed_contract_date?: string | null
          stage?: string
          start_date?: string | null
          supplier_portal_access?: string | null
          supplier_portal_required?: boolean | null
          timeline?: string | null
          total_contract_value?: number | null
          total_revenue?: number | null
          win_reason?: string | null
          won_reason?: string | null
        }
        Update: {
          action_items?: string | null
          amount?: number | null
          begin_execution_date?: string | null
          budget?: string | null
          budget_confirmed?: string | null
          budget_holder?: string | null
          business_value?: string | null
          closing?: string | null
          closing_date?: string | null
          company_name?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          currency_type?: string | null
          current_status?: string | null
          customer_agreed_on_need?: string | null
          customer_challenges?: string | null
          customer_name?: string | null
          customer_need?: string | null
          customer_need_identified?: boolean | null
          deal_name?: string
          decision_expected_date?: string | null
          decision_maker_level?: string | null
          decision_maker_present?: boolean | null
          decision_makers?: string | null
          description?: string | null
          drop_reason?: string | null
          duration?: number | null
          end_date?: string | null
          execution_started?: boolean | null
          expected_closing_date?: string | null
          expected_deal_timeline_end?: string | null
          expected_deal_timeline_start?: string | null
          fax?: string | null
          handoff_status?: string | null
          id?: string
          implementation_start_date?: string | null
          internal_comment?: string | null
          internal_notes?: string | null
          is_recurring?: string | null
          lead_name?: string | null
          lead_owner?: string | null
          loss_reason?: string | null
          lost_reason?: string | null
          modified_at?: string | null
          modified_by?: string | null
          nda_signed?: boolean | null
          need_improvement?: string | null
          need_summary?: string | null
          negotiation_notes?: string | null
          negotiation_status?: string | null
          phone_no?: string | null
          priority?: number | null
          probability?: number | null
          product_service_scope?: string | null
          project_duration?: number | null
          project_name?: string | null
          project_type?: string | null
          proposal_due_date?: string | null
          proposal_sent_date?: string | null
          quarterly_revenue_q1?: number | null
          quarterly_revenue_q2?: number | null
          quarterly_revenue_q3?: number | null
          quarterly_revenue_q4?: number | null
          region?: string | null
          related_lead_id?: string | null
          related_meeting_id?: string | null
          relationship_strength?: string | null
          revenue?: number | null
          rfq_confirmation_note?: string | null
          rfq_document_url?: string | null
          rfq_received_date?: string | null
          rfq_status?: string | null
          rfq_value?: number | null
          signed_contract_date?: string | null
          stage?: string
          start_date?: string | null
          supplier_portal_access?: string | null
          supplier_portal_required?: boolean | null
          timeline?: string | null
          total_contract_value?: number | null
          total_revenue?: number | null
          win_reason?: string | null
          won_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_related_lead_id_fkey"
            columns: ["related_lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_related_meeting_id_fkey"
            columns: ["related_meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          company_name: string | null
          contact_owner: string | null
          contact_source: string | null
          country: string | null
          created_by: string | null
          created_time: string | null
          description: string | null
          email: string | null
          id: string
          industry: string | null
          lead_name: string
          lead_status: string | null
          linkedin: string | null
          modified_by: string | null
          modified_time: string | null
          phone_no: string | null
          position: string | null
          website: string | null
        }
        Insert: {
          company_name?: string | null
          contact_owner?: string | null
          contact_source?: string | null
          country?: string | null
          created_by?: string | null
          created_time?: string | null
          description?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          lead_name: string
          lead_status?: string | null
          linkedin?: string | null
          modified_by?: string | null
          modified_time?: string | null
          phone_no?: string | null
          position?: string | null
          website?: string | null
        }
        Update: {
          company_name?: string | null
          contact_owner?: string | null
          contact_source?: string | null
          country?: string | null
          created_by?: string | null
          created_time?: string | null
          description?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          lead_name?: string
          lead_status?: string | null
          linkedin?: string | null
          modified_by?: string | null
          modified_time?: string | null
          phone_no?: string | null
          position?: string | null
          website?: string | null
        }
        Relationships: []
      }
      meeting_outcomes: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          interested_in_deal: boolean
          meeting_id: string
          next_steps: string | null
          outcome_type: string
          summary: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          interested_in_deal?: boolean
          meeting_id: string
          next_steps?: string | null
          outcome_type: string
          summary?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          interested_in_deal?: boolean
          meeting_id?: string
          next_steps?: string | null
          outcome_type?: string
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_outcomes_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          created_at: string | null
          created_by: string | null
          date: string
          description: string | null
          duration: string | null
          id: string
          location: string | null
          meeting_id: string | null
          meeting_title: string
          participants: string[] | null
          start_time: string
          teams_link: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          date: string
          description?: string | null
          duration?: string | null
          id?: string
          location?: string | null
          meeting_id?: string | null
          meeting_title: string
          participants?: string[] | null
          start_time: string
          teams_link?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          date?: string
          description?: string | null
          duration?: string | null
          id?: string
          location?: string | null
          meeting_id?: string | null
          meeting_title?: string
          participants?: string[] | null
          start_time?: string
          teams_link?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          "Email ID": string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          "Email ID"?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          "Email ID"?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      yearly_revenue_targets: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          total_target: number
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          total_target?: number
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          total_target?: number
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_data_access: {
        Args: {
          p_operation: string
          p_record_id?: string
          p_table_name: string
        }
        Returns: undefined
      }
      log_security_event: {
        Args: {
          p_action: string
          p_details?: Json
          p_resource_id?: string
          p_resource_type: string
        }
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
