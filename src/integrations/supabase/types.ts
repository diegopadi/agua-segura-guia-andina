export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      acelerador_sessions: {
        Row: {
          acelerador_number: number
          created_at: string
          current_step: number
          id: string
          session_data: Json | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          acelerador_number: number
          created_at?: string
          current_step?: number
          id?: string
          session_data?: Json | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          acelerador_number?: number
          created_at?: string
          current_step?: number
          id?: string
          session_data?: Json | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      diagnostic_reports: {
        Row: {
          created_at: string
          document_number: number
          id: string
          metadata: Json | null
          session_id: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_number: number
          id?: string
          metadata?: Json | null
          session_id: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_number?: number
          id?: string
          metadata?: Json | null
          session_id?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_reports_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "acelerador_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          created_at: string
          file_type: string
          id: string
          size_bytes: number
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_type: string
          id?: string
          size_bytes: number
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_type?: string
          id?: string
          size_bytes?: number
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      form_responses: {
        Row: {
          created_at: string
          id: string
          question_number: number
          response_data: Json | null
          response_text: string | null
          session_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_number: number
          response_data?: Json | null
          response_text?: string | null
          session_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          question_number?: number
          response_data?: Json | null
          response_text?: string | null
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "acelerador_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          area_docencia: string | null
          created_at: string
          document_counter: number | null
          full_name: string | null
          id: string
          ie_country: string | null
          ie_district: string | null
          ie_name: string | null
          ie_province: string | null
          ie_region: string | null
          language: string | null
          phone: string | null
          photo_url: string | null
          terms_accepted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          area_docencia?: string | null
          created_at?: string
          document_counter?: number | null
          full_name?: string | null
          id?: string
          ie_country?: string | null
          ie_district?: string | null
          ie_name?: string | null
          ie_province?: string | null
          ie_region?: string | null
          language?: string | null
          phone?: string | null
          photo_url?: string | null
          terms_accepted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          area_docencia?: string | null
          created_at?: string
          document_counter?: number | null
          full_name?: string | null
          id?: string
          ie_country?: string | null
          ie_district?: string | null
          ie_name?: string | null
          ie_province?: string | null
          ie_region?: string | null
          language?: string | null
          phone?: string | null
          photo_url?: string | null
          terms_accepted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      survey_participants: {
        Row: {
          completed_at: string | null
          id: string
          participant_token: string
          started_at: string | null
          status: string | null
          survey_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          participant_token?: string
          started_at?: string | null
          status?: string | null
          survey_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          participant_token?: string
          started_at?: string | null
          status?: string | null
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_participants_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_questions: {
        Row: {
          created_at: string
          id: string
          options: Json | null
          order_number: number
          question_text: string
          question_type: string
          required: boolean | null
          survey_id: string
          variable_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          options?: Json | null
          order_number: number
          question_text: string
          question_type?: string
          required?: boolean | null
          survey_id: string
          variable_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          options?: Json | null
          order_number?: number
          question_text?: string
          question_type?: string
          required?: boolean | null
          survey_id?: string
          variable_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_questions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          id: string
          participant_id: string | null
          participant_token: string
          question_id: string
          response_data: Json
          submitted_at: string
          survey_id: string
        }
        Insert: {
          id?: string
          participant_id?: string | null
          participant_token: string
          question_id: string
          response_data: Json
          submitted_at?: string
          survey_id: string
        }
        Update: {
          id?: string
          participant_id?: string | null
          participant_token?: string
          question_id?: string
          response_data?: Json
          submitted_at?: string
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "survey_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "survey_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      surveys: {
        Row: {
          created_at: string
          description: string | null
          id: string
          participant_token: string | null
          settings: Json | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          participant_token?: string | null
          settings?: Json | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          participant_token?: string | null
          settings?: Json | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          content: Json
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          content: Json
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_unique_participant: {
        Args: { survey_id_param: string }
        Returns: {
          participant_id: string
          participant_token: string
        }[]
      }
      delete_participant_completely: {
        Args: { survey_id_param: string; participant_token_param: string }
        Returns: boolean
      }
      generate_unique_participant_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_survey_participants_count: {
        Args: { survey_id_param: string }
        Returns: number
      }
      get_unique_participants_count: {
        Args: { survey_id_param: string }
        Returns: number
      }
      sync_survey_participants: {
        Args: { survey_id_param: string }
        Returns: number
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
