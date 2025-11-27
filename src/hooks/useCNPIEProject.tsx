import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface CNPIEProject {
  id: string;
  user_id: string;
  tipo_proyecto: "2A" | "2B" | "2C" | "2D";
  diagnostico_resumen: any;
  experiencias_ids: string[];
  preguntas_respuestas: any;
  recomendacion_ia: any;
  etapa_actual: number;
  acelerador_actual: number;
  estado_aceleradores: any;
  datos_aceleradores: any;
  created_at: string;
  updated_at: string;
}

export function useCNPIEProject(tipoProyecto: "2A" | "2B" | "2C" | "2D") {
  const { user } = useAuth();
  const { toast } = useToast();
  const [proyecto, setProyecto] = useState<CNPIEProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchOrCreateProject();
    } else {
      setProyecto(null);
      setLoading(false);
    }
  }, [user, tipoProyecto]);

  const fetchOrCreateProject = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Buscar proyecto existente
      const { data, error } = await supabase
        .from("cnpie_proyectos")
        .select("*")
        .eq("user_id", user.id)
        .eq("tipo_proyecto", tipoProyecto)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setProyecto(data as CNPIEProject);
      } else {
        // Crear nuevo proyecto
        const { data: newProject, error: createError } = await supabase
          .from("cnpie_proyectos")
          .insert({
            user_id: user.id,
            tipo_proyecto: tipoProyecto,
            etapa_actual: 1,
            acelerador_actual: 1,
            estado_aceleradores: {},
            datos_aceleradores: {},
          })
          .select()
          .single();

        if (createError) throw createError;
        setProyecto(newProject as CNPIEProject);
      }
    } catch (error: any) {
      console.error("Error fetching/creating CNPIE project:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el proyecto",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveAcceleratorData = async (
    etapa: number,
    acelerador: number,
    data: any
  ) => {
    if (!proyecto) return;

    try {
      setSaving(true);

      const aceleradorKey = `etapa${etapa}_acelerador${acelerador}`;
      const updatedDatos = {
        ...proyecto.datos_aceleradores,
        [aceleradorKey]: data,
      };

      const { error } = await supabase
        .from("cnpie_proyectos")
        .update({
          datos_aceleradores: updatedDatos,
          updated_at: new Date().toISOString(),
        })
        .eq("id", proyecto.id);

      if (error) throw error;

      setProyecto((prev) =>
        prev ? { ...prev, datos_aceleradores: updatedDatos } : null
      );

      toast({
        title: "Guardado",
        description: "Tus datos han sido guardados exitosamente",
      });

      return true;
    } catch (error: any) {
      console.error("Error saving accelerator data:", error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los datos",
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const validateAccelerator = async (etapa: number, acelerador: number) => {
    if (!proyecto) return false;

    try {
      const aceleradorKey = `etapa${etapa}_acelerador${acelerador}`;
      const updatedEstado = {
        ...proyecto.estado_aceleradores,
        [aceleradorKey]: "completado",
      };

      const { error } = await supabase
        .from("cnpie_proyectos")
        .update({
          estado_aceleradores: updatedEstado,
          etapa_actual: etapa,
          acelerador_actual: acelerador + 1,
        })
        .eq("id", proyecto.id);

      if (error) throw error;

      setProyecto((prev) =>
        prev
          ? {
              ...prev,
              estado_aceleradores: updatedEstado,
              acelerador_actual: acelerador + 1,
            }
          : null
      );

      return true;
    } catch (error: any) {
      console.error("Error validating accelerator:", error);
      toast({
        title: "Error",
        description: "No se pudo validar el acelerador",
        variant: "destructive",
      });
      return false;
    }
  };

  const canProceedToNext = (etapa: number, acelerador: number) => {
    if (!proyecto) return false;
    const aceleradorKey = `etapa${etapa}_acelerador${acelerador}`;
    return proyecto.estado_aceleradores[aceleradorKey] === "completado";
  };

  const getAcceleratorData = (etapa: number, acelerador: number) => {
    if (!proyecto) return null;
    const aceleradorKey = `etapa${etapa}_acelerador${acelerador}`;
    return proyecto.datos_aceleradores[aceleradorKey] || null;
  };

  const getAllData = () => {
    if (!proyecto) return {};
    return proyecto.datos_aceleradores;
  };

  const saveDocumentosPostulacion = async (documentos: any[]) => {
    if (!proyecto?.id) {
      console.error("No hay proyecto para guardar documentos");
      return false;
    }

    try {
      const { error } = await supabase
        .from("cnpie_proyectos")
        .update({ documentos_postulacion: documentos })
        .eq("id", proyecto.id);

      if (error) throw error;

      setProyecto((prev) =>
        prev
          ? {
              ...prev,
              documentos_postulacion: documentos,
            }
          : null
      );

      return true;
    } catch (error) {
      console.error("Error guardando documentos:", error);
      return false;
    }
  };

  const getDocumentosPostulacion = (): any[] => {
    return (proyecto as any)?.documentos_postulacion || [];
  };

  const validateEvaluacionFinal = async () => {
    if (!proyecto) return false;

    try {
      setSaving(true);

      const updatedEstado = {
        ...proyecto.estado_aceleradores,
        etapa2_evaluacion_final: "completado",
      };

      const { error } = await supabase
        .from("cnpie_proyectos")
        .update({
          estado_aceleradores: updatedEstado,
          updated_at: new Date().toISOString(),
        })
        .eq("id", proyecto.id);

      if (error) throw error;

      setProyecto((prev) =>
        prev
          ? {
              ...prev,
              estado_aceleradores: updatedEstado,
            }
          : null
      );

      toast({
        title: "¡Etapa 2 completada!",
        description: "Ahora puedes continuar a la Etapa 3",
      });

      return true;
    } catch (error: any) {
      console.error("Error validating evaluacion final:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    proyecto,
    loading,
    saving,
    saveAcceleratorData,
    validateAccelerator,
    validateEvaluacionFinal,
    canProceedToNext,
    getAcceleratorData,
    getAllData,
    saveDocumentosPostulacion,
    getDocumentosPostulacion,
    refreshProject: fetchOrCreateProject,
  };
}
