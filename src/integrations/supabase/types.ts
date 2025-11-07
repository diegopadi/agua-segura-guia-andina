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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      acelerador_sessions: {
        Row: {
          acelerador_number: number
          created_at: string
          current_phase: number | null
          current_step: number
          id: string
          phase_data: Json | null
          session_data: Json | null
          status: string | null
          updated_at: string
          user_id: string
          validations: Json | null
        }
        Insert: {
          acelerador_number: number
          created_at?: string
          current_phase?: number | null
          current_step?: number
          id?: string
          phase_data?: Json | null
          session_data?: Json | null
          status?: string | null
          updated_at?: string
          user_id: string
          validations?: Json | null
        }
        Update: {
          acelerador_number?: number
          created_at?: string
          current_phase?: number | null
          current_step?: number
          id?: string
          phase_data?: Json | null
          session_data?: Json | null
          status?: string | null
          updated_at?: string
          user_id?: string
          validations?: Json | null
        }
        Relationships: []
      }
      app_configs: {
        Row: {
          data: Json
          key: string
          updated_at: string
          updated_by: string | null
          version: string
        }
        Insert: {
          data?: Json
          key: string
          updated_at?: string
          updated_by?: string | null
          version?: string
        }
        Update: {
          data?: Json
          key?: string
          updated_at?: string
          updated_by?: string | null
          version?: string
        }
        Relationships: []
      }
      cnpie_evaluaciones_predictivas: {
        Row: {
          areas_fuertes: string[] | null
          areas_mejorar: string[] | null
          created_at: string | null
          id: string
          porcentaje_cumplimiento: number
          proyecto_id: string
          puntaje_maximo: number
          puntaje_total: number
          puntajes_criterios: Json
          recomendaciones_ia: string[] | null
          tipo_evaluacion: string
        }
        Insert: {
          areas_fuertes?: string[] | null
          areas_mejorar?: string[] | null
          created_at?: string | null
          id?: string
          porcentaje_cumplimiento: number
          proyecto_id: string
          puntaje_maximo: number
          puntaje_total: number
          puntajes_criterios?: Json
          recomendaciones_ia?: string[] | null
          tipo_evaluacion: string
        }
        Update: {
          areas_fuertes?: string[] | null
          areas_mejorar?: string[] | null
          created_at?: string | null
          id?: string
          porcentaje_cumplimiento?: number
          proyecto_id?: string
          puntaje_maximo?: number
          puntaje_total?: number
          puntajes_criterios?: Json
          recomendaciones_ia?: string[] | null
          tipo_evaluacion?: string
        }
        Relationships: [
          {
            foreignKeyName: "cnpie_evaluaciones_predictivas_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "cnpie_proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      cnpie_proyectos: {
        Row: {
          acelerador_actual: number | null
          created_at: string | null
          datos_aceleradores: Json | null
          diagnostico_resumen: Json | null
          documentos_postulacion: Json | null
          estado_aceleradores: Json | null
          etapa_actual: number | null
          experiencias_ids: string[] | null
          id: string
          preguntas_respuestas: Json | null
          recomendacion_ia: Json | null
          tipo_proyecto: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          acelerador_actual?: number | null
          created_at?: string | null
          datos_aceleradores?: Json | null
          diagnostico_resumen?: Json | null
          documentos_postulacion?: Json | null
          estado_aceleradores?: Json | null
          etapa_actual?: number | null
          experiencias_ids?: string[] | null
          id?: string
          preguntas_respuestas?: Json | null
          recomendacion_ia?: Json | null
          tipo_proyecto: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          acelerador_actual?: number | null
          created_at?: string | null
          datos_aceleradores?: Json | null
          diagnostico_resumen?: Json | null
          documentos_postulacion?: Json | null
          estado_aceleradores?: Json | null
          etapa_actual?: number | null
          experiencias_ids?: string[] | null
          id?: string
          preguntas_respuestas?: Json | null
          recomendacion_ia?: Json | null
          tipo_proyecto?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cnpie_rubricas: {
        Row: {
          categoria: string
          created_at: string | null
          criterio: string
          descripcion: string | null
          ejemplos: Json | null
          extension_maxima: number | null
          id: string
          indicador: string
          orden: number | null
          puntaje_maximo: number
          recomendaciones: string | null
        }
        Insert: {
          categoria: string
          created_at?: string | null
          criterio: string
          descripcion?: string | null
          ejemplos?: Json | null
          extension_maxima?: number | null
          id?: string
          indicador: string
          orden?: number | null
          puntaje_maximo: number
          recomendaciones?: string | null
        }
        Update: {
          categoria?: string
          created_at?: string | null
          criterio?: string
          descripcion?: string | null
          ejemplos?: Json | null
          extension_maxima?: number | null
          id?: string
          indicador?: string
          orden?: number | null
          puntaje_maximo?: number
          recomendaciones?: string | null
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
          original_name: string | null
          size_bytes: number
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_type: string
          id?: string
          original_name?: string | null
          size_bytes: number
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_type?: string
          id?: string
          original_name?: string | null
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
      instrumentos_evaluacion_legacy: {
        Row: {
          created_at: string
          estructura_json: Json
          html_contenido: string | null
          html_nombre: string | null
          id: string
          sesion_id: string
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          estructura_json?: Json
          html_contenido?: string | null
          html_nombre?: string | null
          id?: string
          sesion_id: string
          tipo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          estructura_json?: Json
          html_contenido?: string | null
          html_nombre?: string | null
          id?: string
          sesion_id?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
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
      rubricas_evaluacion: {
        Row: {
          closed_at: string | null
          created_at: string
          estado: string
          estructura: Json
          id: string
          needs_review: boolean | null
          source_hash: string | null
          source_snapshot: Json | null
          unidad_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          estado?: string
          estructura?: Json
          id?: string
          needs_review?: boolean | null
          source_hash?: string | null
          source_snapshot?: Json | null
          unidad_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          estado?: string
          estructura?: Json
          id?: string
          needs_review?: boolean | null
          source_hash?: string | null
          source_snapshot?: Json | null
          unidad_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rubricas_evaluacion_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "unidades_aprendizaje"
            referencedColumns: ["id"]
          },
        ]
      }
      sesiones_clase: {
        Row: {
          cierre: string | null
          closed_at: string | null
          created_at: string
          desarrollo: string | null
          estado: string
          evidencias: string[] | null
          id: string
          inicio: string | null
          needs_review: boolean | null
          regenerated_at: string | null
          regenerated_reason: string | null
          rubrica_json: Json | null
          session_index: number
          source_hash: string | null
          source_snapshot: Json | null
          titulo: string
          unidad_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cierre?: string | null
          closed_at?: string | null
          created_at?: string
          desarrollo?: string | null
          estado?: string
          evidencias?: string[] | null
          id?: string
          inicio?: string | null
          needs_review?: boolean | null
          regenerated_at?: string | null
          regenerated_reason?: string | null
          rubrica_json?: Json | null
          session_index: number
          source_hash?: string | null
          source_snapshot?: Json | null
          titulo: string
          unidad_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cierre?: string | null
          closed_at?: string | null
          created_at?: string
          desarrollo?: string | null
          estado?: string
          evidencias?: string[] | null
          id?: string
          inicio?: string | null
          needs_review?: boolean | null
          regenerated_at?: string | null
          regenerated_reason?: string | null
          rubrica_json?: Json | null
          session_index?: number
          source_hash?: string | null
          source_snapshot?: Json | null
          titulo?: string
          unidad_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sesiones_clase_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "unidades_aprendizaje"
            referencedColumns: ["id"]
          },
        ]
      }
      sesiones_clase_legacy: {
        Row: {
          apoya_estrategia: Json | null
          capacidades: Json | null
          cierre: string
          cierre_json: Json | null
          competencias_ids: Json | null
          created_at: string
          desarrollo: string
          desarrollo_json: Json | null
          duracion_min: number
          estado: string | null
          evidencias: Json | null
          feature_flags: Json | null
          html_export: string | null
          id: string
          incompleta: boolean | null
          inicio: string
          inicio_json: Json | null
          is_active: boolean
          proposito: string
          recursos: Json | null
          regenerated_at: string | null
          replaced_by_session_id: string | null
          rubricas_ids: Json | null
          session_index: number
          titulo: string
          unidad_id: string | null
          updated_at: string
          user_id: string
          version_number: number
        }
        Insert: {
          apoya_estrategia?: Json | null
          capacidades?: Json | null
          cierre: string
          cierre_json?: Json | null
          competencias_ids?: Json | null
          created_at?: string
          desarrollo: string
          desarrollo_json?: Json | null
          duracion_min?: number
          estado?: string | null
          evidencias?: Json | null
          feature_flags?: Json | null
          html_export?: string | null
          id?: string
          incompleta?: boolean | null
          inicio: string
          inicio_json?: Json | null
          is_active?: boolean
          proposito: string
          recursos?: Json | null
          regenerated_at?: string | null
          replaced_by_session_id?: string | null
          rubricas_ids?: Json | null
          session_index: number
          titulo: string
          unidad_id?: string | null
          updated_at?: string
          user_id: string
          version_number?: number
        }
        Update: {
          apoya_estrategia?: Json | null
          capacidades?: Json | null
          cierre?: string
          cierre_json?: Json | null
          competencias_ids?: Json | null
          created_at?: string
          desarrollo?: string
          desarrollo_json?: Json | null
          duracion_min?: number
          estado?: string | null
          evidencias?: Json | null
          feature_flags?: Json | null
          html_export?: string | null
          id?: string
          incompleta?: boolean | null
          inicio?: string
          inicio_json?: Json | null
          is_active?: boolean
          proposito?: string
          recursos?: Json | null
          regenerated_at?: string | null
          replaced_by_session_id?: string | null
          rubricas_ids?: Json | null
          session_index?: number
          titulo?: string
          unidad_id?: string | null
          updated_at?: string
          user_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "sesiones_clase_replaced_by_session_id_fkey"
            columns: ["replaced_by_session_id"]
            isOneToOne: false
            referencedRelation: "sesiones_clase_legacy"
            referencedColumns: ["id"]
          },
        ]
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
      unidades_aprendizaje: {
        Row: {
          area_curricular: string
          capacidades: Json | null
          closed_at: string | null
          competencias_ids: string[] | null
          created_at: string
          desempenos: Json | null
          diagnostico_pdf_url: string | null
          diagnostico_text: string | null
          duracion_min: number
          enfoques_ids: string[] | null
          estado: string
          estandares: Json | null
          estrategias_ids: string[] | null
          evidencias: string
          grado: string
          ia_recomendaciones: string | null
          id: string
          numero_sesiones: number
          proposito: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          area_curricular: string
          capacidades?: Json | null
          closed_at?: string | null
          competencias_ids?: string[] | null
          created_at?: string
          desempenos?: Json | null
          diagnostico_pdf_url?: string | null
          diagnostico_text?: string | null
          duracion_min: number
          enfoques_ids?: string[] | null
          estado?: string
          estandares?: Json | null
          estrategias_ids?: string[] | null
          evidencias: string
          grado: string
          ia_recomendaciones?: string | null
          id?: string
          numero_sesiones: number
          proposito: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          area_curricular?: string
          capacidades?: Json | null
          closed_at?: string | null
          competencias_ids?: string[] | null
          created_at?: string
          desempenos?: Json | null
          diagnostico_pdf_url?: string | null
          diagnostico_text?: string | null
          duracion_min?: number
          enfoques_ids?: string[] | null
          estado?: string
          estandares?: Json | null
          estrategias_ids?: string[] | null
          evidencias?: string
          grado?: string
          ia_recomendaciones?: string | null
          id?: string
          numero_sesiones?: number
          proposito?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      acquire_unit_lock: { Args: { unidad_id_param: string }; Returns: boolean }
      calculate_unidad_hash: { Args: { unidad_data: Json }; Returns: string }
      check_a7_data_exists: {
        Args: { unidad_id_param: string; user_id_param: string }
        Returns: Json
      }
      create_unique_participant: {
        Args: { survey_id_param: string }
        Returns: {
          participant_id: string
          participant_token: string
        }[]
      }
      delete_participant_completely: {
        Args: { participant_token_param: string; survey_id_param: string }
        Returns: boolean
      }
      generate_unique_participant_token: { Args: never; Returns: string }
      get_public_survey_data: {
        Args: { token_param: string }
        Returns: {
          description: string
          status: string
          survey_id: string
          title: string
        }[]
      }
      get_survey_participants_count: {
        Args: { survey_id_param: string }
        Returns: number
      }
      get_unique_participants_count: {
        Args: { survey_id_param: string }
        Returns: number
      }
      release_unit_lock: { Args: { unidad_id_param: string }; Returns: boolean }
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
