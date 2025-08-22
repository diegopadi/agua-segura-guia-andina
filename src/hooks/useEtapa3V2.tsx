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
  capacidades: Array<{ codigo: string; descripcion: string; }>;
  evidencias: string;
  estandares: Array<{ codigo: string; descripcion: string; }>;
  desempenos: Array<{ codigo: string; descripcion: string; }>;
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
      descripcion?: string;
      descriptores: Record<string, string>;
    }>;
  };
  estado: 'BORRADOR' | 'CERRADO';
  needs_review?: boolean;
  source_hash?: string;
  source_snapshot?: any;
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
  needs_review?: boolean;
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

      // Transform data with proper typing
      const transformedUnidad: UnidadAprendizaje | null = unidadData ? {
        ...unidadData,
        capacidades: Array.isArray(unidadData.capacidades) ? unidadData.capacidades as Array<{ codigo: string; descripcion: string; }> : [],
        estandares: Array.isArray(unidadData.estandares) ? unidadData.estandares as Array<{ codigo: string; descripcion: string; }> : [],
        desempenos: Array.isArray(unidadData.desempenos) ? unidadData.desempenos as Array<{ codigo: string; descripcion: string; }> : [],
        competencias_ids: Array.isArray(unidadData.competencias_ids) ? unidadData.competencias_ids : [],
        estrategias_ids: Array.isArray(unidadData.estrategias_ids) ? unidadData.estrategias_ids : [],
        enfoques_ids: Array.isArray(unidadData.enfoques_ids) ? unidadData.enfoques_ids : [],
        estado: unidadData.estado as 'BORRADOR' | 'CERRADO'
      } : null;

      setUnidad(transformedUnidad);

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

        // Transform rubrica with proper typing
        const transformedRubrica: RubricaEvaluacion | null = rubricaData ? {
          ...rubricaData,
          estructura: rubricaData.estructura as RubricaEvaluacion['estructura'] || {
            levels: [],
            criteria: []
          },
          estado: rubricaData.estado as 'BORRADOR' | 'CERRADO'
        } : null;

        setRubrica(transformedRubrica);

        // Fetch sesiones
        const { data: sesionesData, error: sesionesError } = await supabase
          .from('sesiones_clase')
          .select('*')
          .eq('unidad_id', unidadData.id)
          .order('session_index');

        if (sesionesError) {
          throw sesionesError;
        }

        // Transform sesiones with proper typing
        const transformedSesiones: SesionClase[] = sesionesData?.map(sesion => ({
          ...sesion,
          evidencias: Array.isArray(sesion.evidencias) ? sesion.evidencias : [],
          rubrica_json: sesion.rubrica_json as SesionClase['rubrica_json'] || { criteria: [] },
          estado: sesion.estado as 'BORRADOR' | 'CERRADO'
        })) || [];

        setSesiones(transformedSesiones);
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

  type SaveOptions = { silent?: boolean };

  const saveUnidad = async (unidadData: Partial<UnidadAprendizaje>, options?: SaveOptions) => {
    if (!user) return null;

    console.log('[ETAPA3V2:SAVE_UNIDAD]', {
      silent: options?.silent,
      payloadKeys: Object.keys(unidadData),
      estadoBefore: unidad?.estado,
      estadoAfter: unidadData.estado,
      closed_at: unidadData.closed_at
    });

    try {
      setSaving(true);

      // Prepare typed data for upsert
      const dataToUpsert: Partial<UnidadAprendizaje> & { user_id: string; id?: string } = {
        ...unidadData,
        user_id: user.id,
        capacidades: unidadData.capacidades || [],
        estandares: unidadData.estandares || [],
        desempenos: unidadData.desempenos || [],
        competencias_ids: unidadData.competencias_ids || [],
        estrategias_ids: unidadData.estrategias_ids || [],
        enfoques_ids: unidadData.enfoques_ids || []
      };
      
      if (unidad?.id) {
        dataToUpsert.id = unidad.id;
      }

      // Use any for Supabase compatibility
      const { data, error } = await supabase
        .from('unidades_aprendizaje')
        .upsert(dataToUpsert as any)
        .select()
        .single();

      if (error) throw error;

      console.log('[ETAPA3V2:SAVE_SUCCESS]', {
        silent: options?.silent,
        newEstado: data.estado,
        closed_at: data.closed_at,
        id: data.id
      });

      setUnidad(data as UnidadAprendizaje);
      
      // Only show toast if not silent
      if (!options?.silent) {
        toast({
          title: "Guardado",
          description: "Unidad de aprendizaje guardada correctamente",
        });
      }

      return data;
    } catch (error: any) {
      console.error('[ETAPA3V2:SAVE_ERROR]', error);
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

  const saveRubrica = async (rubricaData: Partial<RubricaEvaluacion & { source_hash?: string; source_snapshot?: any; }>) => {
    if (!user || !unidad) return null;

    try {
      setSaving(true);

      // Prepare typed data for upsert
      const dataToUpsert = {
        ...rubricaData,
        unidad_id: unidad.id,
        user_id: user.id,
      } as any;
      
      if (rubrica?.id) {
        dataToUpsert.id = rubrica.id;
      }

      const { data, error } = await supabase
        .from('rubricas_evaluacion')
        .upsert(dataToUpsert)
        .select()
        .single();

      if (error) throw error;

      setRubrica(data as any as RubricaEvaluacion);
      
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
    if (!user) return false;

    try {
      setSaving(true);
      
      // Get current unidad
      if (!unidad) {
        throw new Error('No hay unidad disponible');
      }

      // Validate sessions data before saving
      const validSessions = sesionesData.filter(sesion => 
        sesion.titulo && sesion.titulo.trim().length > 0
      );

      if (validSessions.length === 0) {
        throw new Error('No hay sesiones válidas para guardar');
      }

      // Use individual UPSERT operations for better error handling
      const upsertPromises = validSessions.map(async (sesion, index) => {
        const sessionData = {
          unidad_id: unidad.id,
          user_id: user.id,
          session_index: index + 1,
          titulo: sesion.titulo || `Sesión ${index + 1}`,
          inicio: sesion.inicio || '',
          desarrollo: sesion.desarrollo || '',
          cierre: sesion.cierre || '',
          evidencias: sesion.evidencias || [],
          rubrica_json: sesion.rubrica_json || { criteria: [] },
          estado: sesion.estado || 'BORRADOR',
          updated_at: new Date().toISOString()
        };

        // Try to find existing session first
        const { data: existingSession } = await supabase
          .from('sesiones_clase')
          .select('id')
          .eq('unidad_id', unidad.id)
          .eq('user_id', user.id)
          .eq('session_index', index + 1)
          .maybeSingle();

        if (existingSession) {
          // Update existing session
          const { data, error } = await supabase
            .from('sesiones_clase')
            .update(sessionData)
            .eq('id', existingSession.id)
            .select()
            .single();
          
          if (error) throw error;
          return data;
        } else {
          // Insert new session
          const { data, error } = await supabase
            .from('sesiones_clase')
            .insert(sessionData)
            .select()
            .single();
          
          if (error) throw error;
          return data;
        }
      });

      // Execute all upserts
      const savedSessions = await Promise.all(upsertPromises);

      console.log('Sessions saved successfully:', savedSessions);
      
      // Transform and update local state
      const transformedSessions: SesionClase[] = savedSessions.map(sesion => ({
        ...sesion,
        evidencias: Array.isArray(sesion.evidencias) ? sesion.evidencias : [],
        rubrica_json: sesion.rubrica_json as SesionClase['rubrica_json'] || { criteria: [] },
        estado: sesion.estado as 'BORRADOR' | 'CERRADO'
      }));
      
      setSesiones(transformedSessions);
      
      toast({
        title: "Guardado",
        description: `${savedSessions.length} sesiones guardadas correctamente`,
      });
      return true;
    } catch (error: any) {
      console.error('Error saving sessions:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: "Error",
        description: `Error al guardar las sesiones: ${errorMessage}`,
        variant: "destructive",
      });
      return false;
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