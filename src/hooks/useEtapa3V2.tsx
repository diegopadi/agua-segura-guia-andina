import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface UnidadAprendizaje {
  id: string;
  user_id: string;
  titulo: string;
  area_curricular: string;
  grado: string;
  numero_sesiones: number;
  duracion_min: number;
  proposito: string;
  competencias_ids: string[];
  capacidades: any[];
  evidencias: string;
  estandares: any[];
  desempenos: any[];
  estrategias_ids: string[];
  enfoques_ids: string[];
  diagnostico_pdf_url?: string;
  diagnostico_text?: string;
  ia_recomendaciones?: string;
  estado: 'BORRADOR' | 'CERRADO';
  created_at: string;
  updated_at: string;
  closed_at?: string;
}

export interface RubricaEvaluacion {
  id: string;
  unidad_id: string;
  user_id: string;
  estructura: {
    levels: string[];
    criteria: Array<{
      criterio: string;
      descriptores: Record<string, string>;
    }>;
  };
  estado: 'BORRADOR' | 'CERRADO';
  created_at: string;
  updated_at: string;
  closed_at?: string;
}

export interface SesionClase {
  id: string;
  unidad_id: string;
  user_id: string;
  session_index: number;
  titulo: string;
  inicio?: string;
  desarrollo?: string;
  cierre?: string;
  evidencias: string[];
  rubrica_json: {
    criteria: string[];
  };
  estado: 'BORRADOR' | 'CERRADO';
  created_at: string;
  updated_at: string;
  closed_at?: string;
}

export interface Etapa3Progress {
  a6_completed: boolean;
  a7_completed: boolean;
  a8_completed: boolean;
  overall_progress: number;
}

export function useEtapa3V2() {
  const [unidad, setUnidad] = useState<UnidadAprendizaje | null>(null);
  const [rubrica, setRubrica] = useState<RubricaEvaluacion | null>(null);
  const [sesiones, setSesiones] = useState<SesionClase[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchEtapa3Data = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch unidad
      const { data: unidadData, error: unidadError } = await supabase
        .from('unidades_aprendizaje')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (unidadError && unidadError.code !== 'PGRST116') {
        throw unidadError;
      }

      setUnidad(unidadData as UnidadAprendizaje);

      if (unidadData) {
        // Fetch rubrica
        const { data: rubricaData, error: rubricaError } = await supabase
          .from('rubricas_evaluacion')
          .select('*')
          .eq('unidad_id', unidadData.id)
          .maybeSingle();

        if (rubricaError && rubricaError.code !== 'PGRST116') {
          throw rubricaError;
        }

        setRubrica(rubricaData as RubricaEvaluacion);

        // Fetch sesiones
        const { data: sesionesData, error: sesionesError } = await supabase
          .from('sesiones_clase')
          .select('*')
          .eq('unidad_id', unidadData.id)
          .order('session_index');

        if (sesionesError) {
          throw sesionesError;
        }

        setSesiones(sesionesData as SesionClase[] || []);
      }

    } catch (error: any) {
      console.error('Error fetching Etapa 3 data:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar los datos de Etapa 3",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveUnidad = async (unidadData: Partial<UnidadAprendizaje>) => {
    if (!user) return null;

    try {
      setSaving(true);

      const { data, error } = await supabase
        .from('unidades_aprendizaje')
        .upsert({
          ...unidadData,
          user_id: user.id,
          id: unidad?.id
        })
        .select()
        .single();

      if (error) throw error;

      setUnidad(data);
      
      toast({
        title: "Guardado",
        description: "Unidad de aprendizaje guardada correctamente",
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const saveRubrica = async (rubricaData: Partial<RubricaEvaluacion>) => {
    if (!user || !unidad) return null;

    try {
      setSaving(true);

      const { data, error } = await supabase
        .from('rubricas_evaluacion')
        .upsert({
          ...rubricaData,
          unidad_id: unidad.id,
          user_id: user.id,
          id: rubrica?.id
        })
        .select()
        .single();

      if (error) throw error;

      setRubrica(data);
      
      toast({
        title: "Guardado",
        description: "Rúbrica de evaluación guardada correctamente",
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const saveSesiones = async (sesionesData: SesionClase[]) => {
    if (!user || !unidad) return [];

    try {
      setSaving(true);

      // Delete existing sessions for this unit
      await supabase
        .from('sesiones_clase')
        .delete()
        .eq('unidad_id', unidad.id);

      // Insert new sessions
      const { data, error } = await supabase
        .from('sesiones_clase')
        .insert(
          sesionesData.map(sesion => ({
            ...sesion,
            unidad_id: unidad.id,
            user_id: user.id
          }))
        )
        .select()
        .order('session_index');

      if (error) throw error;

      setSesiones(data || []);
      
      toast({
        title: "Guardado",
        description: "Sesiones guardadas correctamente",
      });

      return data || [];
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const getProgress = (): Etapa3Progress => {
    const a6_completed = unidad?.estado === 'CERRADO';
    const a7_completed = rubrica?.estado === 'CERRADO';
    const a8_completed = sesiones.length > 0 && sesiones.every(s => s.estado === 'CERRADO');
    
    let completed = 0;
    if (a6_completed) completed++;
    if (a7_completed) completed++;
    if (a8_completed) completed++;
    
    return {
      a6_completed,
      a7_completed,
      a8_completed,
      overall_progress: Math.round((completed / 3) * 100)
    };
  };

  const closeAccelerator = async (accelerator: 'A6' | 'A7' | 'A8') => {
    try {
      setSaving(true);

      switch (accelerator) {
        case 'A6':
          if (unidad) {
            await saveUnidad({ ...unidad, estado: 'CERRADO', closed_at: new Date().toISOString() });
          }
          break;
        case 'A7':
          if (rubrica) {
            await saveRubrica({ ...rubrica, estado: 'CERRADO', closed_at: new Date().toISOString() });
          }
          break;
        case 'A8':
          if (sesiones.length > 0) {
            const updatedSesiones = sesiones.map(s => ({ 
              ...s, 
              estado: 'CERRADO' as const, 
              closed_at: new Date().toISOString() 
            }));
            await saveSesiones(updatedSesiones);
          }
          break;
      }
      
      toast({
        title: "Completado",
        description: `${accelerator} cerrado exitosamente`,
      });
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: `No se pudo cerrar ${accelerator}`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchEtapa3Data();
  }, [user]);

  return {
    unidad,
    rubrica,
    sesiones,
    loading,
    saving,
    progress: getProgress(),
    saveUnidad,
    saveRubrica,
    saveSesiones,
    closeAccelerator,
    refetch: fetchEtapa3Data
  };
}