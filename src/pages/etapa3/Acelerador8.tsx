import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, Bot, CheckCircle, Save, Lock, Plus, Trash2, Edit3, RefreshCw, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { supabase } from '@/integrations/supabase/client';
import { useEtapa3V2, SesionClase } from '@/hooks/useEtapa3V2';
import { useUnidadHash } from '@/hooks/useUnidadHash';

export default function Acelerador8() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { unidad, sesiones, loading, saving, saveSesiones, closeAccelerator, progress } = useEtapa3V2();
  const unidadHash = useUnidadHash(unidad);
  
  const [sesionesData, setSesionesData] = useState<SesionClase[]>([]);
  const [generationLoading, setGenerationLoading] = useState(false);
  const [regenerationLoading, setRegenerationLoading] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [showReopenDialog, setShowReopenDialog] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastGenerationTime, setLastGenerationTime] = useState<number>(0);
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<number>(0);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  
  // Ping connectivity test
  const [pingOk, setPingOk] = useState<boolean | null>(null);
  const [lastHttpStatus, setLastHttpStatus] = useState<number | null>(null);
  const [lastNetworkError, setLastNetworkError] = useState<string | null>(null);
  const [payloadBytes, setPayloadBytes] = useState<number>(0);
  
  const lastAutoSaveRef = useRef<NodeJS.Timeout>();
  const throttleRef = useRef<NodeJS.Timeout>();
  
  // Debounced sesiones data for auto-save (5s debounce)
  const debouncedSesionesData = useDebounce(sesionesData, 5000);

  // Test connectivity on mount
  useEffect(() => {
    const testConnectivity = async () => {
      try {
        console.log('[A8:PING]', { timestamp: new Date().toISOString() });
        
        const { data, error } = await supabase.functions.invoke('a8-ping', {
          body: {}
        });
        
        if (error) {
          console.log('[A8:PING_FAIL]', { error: error.message });
          setPingOk(false);
        } else {
          console.log('[A8:PING_OK]', { response: data });
          setPingOk(true);
        }
      } catch (err: any) {
        console.log('[A8:PING_FAIL]', { error: err.message });
        setPingOk(false);
      }
    };

    testConnectivity();
  }, []);

  // Load existing sessions data
  useEffect(() => {
    if (sesiones && sesiones.length > 0) {
      setSesionesData(sesiones);
      setGenerationComplete(true);
    } else if (unidad && unidad.numero_sesiones) {
      // Initialize empty sessions based on unit configuration
      const emptySessions: SesionClase[] = Array.from(
        { length: unidad.numero_sesiones }, 
        (_, index) => ({
          id: crypto.randomUUID(),
          unidad_id: unidad.id,
          user_id: unidad.user_id,
          session_index: index + 1,
          titulo: `Sesión ${index + 1}`,
          inicio: '',
          desarrollo: '',
          cierre: '',
          evidencias: [],
          rubrica_json: { criteria: [] },
          estado: 'BORRADOR',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      );
      setSesionesData(emptySessions);
    }
  }, [sesiones, unidad]);

  // Computed values
  const areSessionsClosed = sesiones.length > 0 && sesiones.every(s => s.estado === 'CERRADO');
  const canAccessA8 = progress.a7_completed;
  const hasSesiones = sesionesData.length > 0;
  const formValid = sesionesData.some(sesion => 
    sesion.titulo.trim() || sesion.inicio.trim() || sesion.desarrollo.trim() || sesion.cierre.trim()
  );
  const analysisComplete = generationComplete;

  // Enhanced auto-save with debounce (5s) + throttle (20s)
  useEffect(() => {
    // Clear existing timeouts
    if (lastAutoSaveRef.current) {
      clearTimeout(lastAutoSaveRef.current);
    }
    
    // Check conditions to pause auto-save
    const shouldPause = !autoSaveEnabled || areSessionsClosed || generationLoading || 
                       regenerationLoading || !generationComplete || saving || autoSaving;
    
    if (debouncedSesionesData.length > 0 && !shouldPause && sesiones.length > 0) {
      lastAutoSaveRef.current = setTimeout(() => {
        handleAutoSave();
      }, 100); // Small delay to batch rapid changes
    }
  }, [debouncedSesionesData, autoSaveEnabled, areSessionsClosed, generationLoading, 
      regenerationLoading, generationComplete, saving, autoSaving, sesiones]);

  const handleAutoSave = useCallback(async () => {
    const now = Date.now();
    
    // Throttle: don't save more than once every 20 seconds
    if (lastAutoSaveTime && (now - lastAutoSaveTime) < 20000) {
      return;
    }
    
    try {
      console.log('[A8:AUTOSAVE]', { timestamp: new Date().toISOString() });
      setAutoSaving(true);
      setLastAutoSaveTime(now);
      
      await saveSesiones(sesionesData);
      
      console.log('[A8:AUTOSAVE_SUCCESS]', { timestamp: new Date().toISOString() });
    } catch (error: any) {
      console.log('[A8:AUTOSAVE_ERROR]', { 
        message: error.message, 
        timestamp: new Date().toISOString() 
      });
    } finally {
      setAutoSaving(false);
    }
  }, [sesionesData, lastAutoSaveTime, saveSesiones]);

  // Payload sanitizer to avoid size limits
  const sanitizeUnidadForPayload = (unidad: any) => {
    return {
      id: unidad.id,
      user_id: unidad.user_id,
      titulo: unidad.titulo,                       // ej. Seguridad hídrica
      area_curricular: unidad.area_curricular,
      grado: unidad.grado,
      numero_sesiones: unidad.numero_sesiones,
      duracion_min: unidad.duracion_min,
      proposito: unidad.proposito,
      competencias_ids: unidad.competencias_ids,   // o array/cadenas
      evidencias: unidad.evidencias,
      diagnostico_text: unidad.diagnostico_text?.slice(0, 12000) || "", // subir límite sin romper payload
      ia_recomendaciones: unidad.ia_recomendaciones || null,            // del A6 (JSON/string)
      tema_transversal: unidad.tema_transversal || unidad.titulo || "",       // anchor temático
    };
  };

  const handleGenerateSessions = async () => {
    if (!unidad || generationLoading) return;

    const requestId = crypto.randomUUID();
    setGenerationLoading(true);
    setAutoSaveEnabled(false);

    try {
      const sanitizedUnidad = sanitizeUnidadForPayload(unidad);
      const payloadSize = new TextEncoder().encode(JSON.stringify({ request_id: requestId, unidad_data: sanitizedUnidad })).length;
      
      setPayloadBytes(payloadSize);
      setLastHttpStatus(null);
      setLastNetworkError(null);

      console.log('[A8:GEN_CONTEXT]', {
        titulo: sanitizedUnidad.titulo,
        tema_transversal: sanitizedUnidad.tema_transversal,
        diag_len: sanitizedUnidad.diagnostico_text.length,
        has_recs: !!sanitizedUnidad.ia_recomendaciones
      });

      console.log('[A8:GEN_PAYLOAD]', {
        payload_size_bytes: payloadSize,
        sanitized_fields: Object.keys(sanitizedUnidad)
      });

      console.log('[A8:GEN_REQUEST]', {
        request_id: requestId,
        endpoint: 'generate-session-structure',
        unidad_id: unidad?.id,
        payload_size_bytes: payloadSize,
        titulo: unidad?.titulo,
        area: unidad?.area_curricular,
        prereq: { 
          a6_completed: progress.a6_completed,
          a7_completed: progress.a7_completed
        }
      });

      const { data, error } = await supabase.functions.invoke('generate-session-structure', {
        body: {
          request_id: requestId,
          unidad_data: sanitizedUnidad
        }
      });

      console.log('[A8:GEN_RESPONSE]', {
        request_id: requestId,
        http_status: data ? 200 : (error ? 500 : 0),
        success: data?.success || false,
        sessions_count: data?.sessions?.length || 0,
        preview: data?.sessions ? JSON.stringify(data.sessions).slice(0, 200) + '...' : null
      });

      setLastHttpStatus(data ? 200 : (error ? 500 : 0));

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate sessions');
      }

      // Validate structure
      if (!Array.isArray(data.sessions) || data.sessions.length === 0) {
        console.log('[A8:GEN_INVALID]', { 
          hasSessionsArray: Array.isArray(data.sessions),
          sessionsLength: data.sessions?.length || 0
        });
        throw new Error('Estructura de sesiones inválida');
      }

      // Validate each session
      for (const session of data.sessions) {
        const hasContent = session.titulo || session.inicio || session.desarrollo || session.cierre;
        const criteriaCount = session.rubrica_sesion?.criteria?.length || 0;
        
        if (!hasContent) {
          throw new Error('Sesión sin contenido detectada');
        }
        
        if (criteriaCount < 4 || criteriaCount > 8) {
          throw new Error(`Sesión con criterios inválidos: ${criteriaCount} (debe ser 4-8)`);
        }
      }

      console.log('[A8:GEN_VALID]', {
        hasLevels: true,
        hasCriteria: true,
        hasTools: true,
        sessions_count: data.sessions.length,
        total_criteria: data.sessions.reduce((acc: number, s: any) => acc + (s.rubrica_sesion?.criteria?.length || 0), 0)
      });

      // Apply sessions data
      setSesionesData(data.sessions.map((session: any, index: number) => ({
        id: crypto.randomUUID(),
        session_index: index + 1,
        titulo: session.titulo || `Sesión ${index + 1}`,
        inicio: session.inicio || '',
        desarrollo: session.desarrollo || '',
        cierre: session.cierre || '',
        evidencias: session.evidencias || [],
        rubrica_json: session.rubrica_sesion || { levels: ['Inicio', 'Proceso', 'Logro'], criteria: [] },
        unidad_id: unidad.id,
        user_id: unidad.user_id,
        is_active: true,
        estado: 'ABIERTO',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })));

      setGenerationComplete(true);
      toast({
        title: "Sesiones generadas",
        description: "Las sesiones se han generado exitosamente",
      });

    } catch (error: any) {
      console.log('[A8:GEN_ERROR]', { 
        request_id: requestId, 
        message: error.message, 
        code: error.code || 'UNKNOWN' 
      });
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.log('[A8:GEN_NETWORK_ERROR]', { message: error.message });
        toast({
          title: "Error de conectividad",
          description: "No se pudo contactar la función de Edge (A8). Revise CORS/nombre/estado de despliegue.",
          variant: "destructive",
        });
        setLastNetworkError(error.message);
      } else {
        toast({
          title: `Error en A8 (ID: ${requestId})`,
          description: `${error.code || 'UNKNOWN_ERROR'} - ${error.message}`,
          variant: "destructive",
        });
      }
    } finally {
      setGenerationLoading(false);
      setAutoSaveEnabled(true);
    }
  };

  const handleRegenerateClick = () => {
    console.log('[A8:REGEN_CLICK]', { timestamp: new Date().toISOString() });
    setShowRegenerateDialog(true);
    console.log('[A8:REGEN_CONFIRM_OPEN]', { timestamp: new Date().toISOString() });
  };

  const handleRegenerateSessions = async () => {
    if (regenerationLoading) {
      console.log('[A8:REGEN_GUARD]', { timestamp: new Date().toISOString() });
      return;
    }

    // Check if regeneration is needed based on hash
    const existingHash = sesiones.length > 0 ? (sesiones[0] as any)?.source_hash : null;
    if (existingHash && unidadHash?.hash && existingHash === unidadHash.hash) {
      console.log('[A8:REGEN_SKIPPED]', {
        reason: 'NO_CHANGE',
        existing_hash: existingHash,
        current_hash: unidadHash.hash
      });
      toast({
        title: "Nada que regenerar",
        description: "Las sesiones ya están actualizadas con la versión actual de la unidad.",
      });
      setShowRegenerateDialog(false);
      return;
    }

    const requestId = crypto.randomUUID();
    
    try {
      console.log('[A8:REGEN_CONFIRM]', { 
        accepted: true, 
        request_id: requestId,
        timestamp: new Date().toISOString() 
      });
      
      setRegenerationLoading(true);
      setAutoSaveEnabled(false);
      
      console.log('[A8:REGEN_REQUEST]', {
        request_id: requestId,
        unidad_id: unidad?.id,
        titulo: unidad?.titulo,
        source_hash: unidadHash?.hash,
        sessions_before: sesionesData.length,
        criteria_before: sesionesData.reduce((acc, s) => acc + s.rubrica_json.criteria.length, 0),
        previous_sessions_ids: sesionesData.map(s => s.id)
      });

      const { data, error } = await supabase.functions.invoke('generate-session-structure', {
        body: {
          request_id: requestId,
          unidad_data: unidad,
          force: true,
          source_hash: unidadHash?.hash,
          previous_sessions_ids: sesionesData.map(s => s.id)
        }
      });

      if (error) throw error;

      console.log('[A8:REGEN_RESPONSE]', {
        request_id: requestId,
        success: data?.success || false,
        error_code: data?.error_code,
        sessions_count: data?.sessions?.length || 0,
        criteria_count: data?.sessions?.reduce((acc: number, s: any) => acc + (s?.rubrica_sesion?.criteria?.length || 0), 0) || 0,
        preview: data?.sessions ? JSON.stringify(data.sessions).slice(0, 200)+'...' : null
      });

      if (!data.success && data.error_code === 'NO_CHANGE') {
        console.log('[A8:REGEN_SKIPPED]', { reason: data.error_code });
        toast({
          title: "Nada que regenerar",
          description: data.message || "Unidad sin cambios. Regeneración omitida.",
        });
        return;
      }

      if (data.success && data.sessions) {
        // Enhanced validation for regeneration
        const hasValidSessions = Array.isArray(data.sessions) && data.sessions.length > 0;
        const allSessionsHaveContent = data.sessions.every((session: any) => 
          session.titulo || session.inicio || session.desarrollo || session.cierre
        );
        const allSessionsHaveValidRubric = data.sessions.every((session: any) => 
          session.rubrica_sesion?.criteria && 
          Array.isArray(session.rubrica_sesion.criteria) &&
          session.rubrica_sesion.criteria.length >= 2 && 
          session.rubrica_sesion.criteria.length <= 8
        );

        if (!hasValidSessions || !allSessionsHaveContent || !allSessionsHaveValidRubric) {
          throw new Error('Estructura de sesiones inválida');
        }

        const regeneratedSessions = data.sessions.map((session: any, index: number) => ({
          id: crypto.randomUUID(),
          unidad_id: unidad.id,
          user_id: unidad.user_id,
          session_index: index + 1,
          titulo: session.titulo || `Sesión ${index + 1}`,
          inicio: session.inicio || '',
          desarrollo: session.desarrollo || '',
          cierre: session.cierre || '',
          evidencias: session.evidencias || [],
          rubrica_json: session.rubrica_sesion || { criteria: [] },
          source_hash: unidadHash?.hash,
          source_snapshot: unidadHash?.snapshot,
          regenerated_at: new Date().toISOString(),
          needs_review: false,
          estado: 'BORRADOR' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        setSesionesData(regeneratedSessions);
        setGenerationComplete(true);
        
        console.log('[A8:REGEN_APPLY]', {
          request_id: requestId,
          sessions_after: regeneratedSessions.length,
          criteria_after: regeneratedSessions.reduce((acc, s) => acc + s.rubrica_json.criteria.length, 0)
        });

        // Silent save with new hash/snapshot
        await saveSesiones(regeneratedSessions);
        console.log('[A8:REGEN_SAVE]', { request_id: requestId, silent: true });
        
        toast({
          title: "Sesiones regeneradas",
          description: "Las sesiones se han regenerado exitosamente",
        });
      } else {
        throw new Error(data.error || 'Error en la regeneración');
      }

    } catch (error: any) {
      console.log('[A8:REGEN_ERROR]', { 
        request_id: requestId, 
        message: error.message, 
        error_code: error.code || 'UNKNOWN'
      });
      
      toast({
        title: `Error en A8 (ID: ${requestId})`,
        description: `${error.code || 'REGEN_ERROR'} - ${error.message || "No se pudieron regenerar las sesiones."}`,
        variant: "destructive",
      });
    } finally {
      setRegenerationLoading(false);
      setAutoSaveEnabled(true);
      setShowRegenerateDialog(false);
      console.log('[A8:REGEN_DONE]', { timestamp: new Date().toISOString() });
    }
  };

  const updateSession = (index: number, field: keyof SesionClase, value: any) => {
    setSesionesData(prev => 
      prev.map((sesion, i) => 
        i === index 
          ? { ...sesion, [field]: value, updated_at: new Date().toISOString() }
          : sesion
      )
    );
  };

  const addEvidence = (sessionIndex: number, evidence: string) => {
    if (!evidence.trim()) return;
    
    setSesionesData(prev =>
      prev.map((sesion, i) =>
        i === sessionIndex
          ? { 
              ...sesion, 
              evidencias: [...sesion.evidencias, evidence.trim()],
              updated_at: new Date().toISOString()
            }
          : sesion
      )
    );
  };

  const removeEvidence = (sessionIndex: number, evidenceIndex: number) => {
    setSesionesData(prev =>
      prev.map((sesion, i) =>
        i === sessionIndex
          ? { 
              ...sesion, 
              evidencias: sesion.evidencias.filter((_, ei) => ei !== evidenceIndex),
              updated_at: new Date().toISOString()
            }
          : sesion
      )
    );
  };

  const addRubricCriterion = (sessionIndex: number, criterion: string) => {
    if (!criterion.trim()) return;
    
    setSesionesData(prev =>
      prev.map((sesion, i) =>
        i === sessionIndex
          ? { 
              ...sesion, 
              rubrica_json: {
                ...sesion.rubrica_json,
                criteria: [...sesion.rubrica_json.criteria, criterion.trim()]
              },
              updated_at: new Date().toISOString()
            }
          : sesion
      )
    );
  };

  const removeRubricCriterion = (sessionIndex: number, criterionIndex: number) => {
    setSesionesData(prev =>
      prev.map((sesion, i) =>
        i === sessionIndex
          ? { 
              ...sesion, 
              rubrica_json: {
                ...sesion.rubrica_json,
                criteria: sesion.rubrica_json.criteria.filter((_, ci) => ci !== criterionIndex)
              },
              updated_at: new Date().toISOString()
            }
          : sesion
      )
    );
  };

  const handleSave = async () => {
    try {
      console.log('[A8:SAVE]', { 
        items: { 
          sessions: sesionesData.length, 
          criteria: sesionesData.reduce((acc, s) => acc + s.rubrica_json.criteria.length, 0) 
        }, 
        is_closed: false, 
        timestamp: new Date().toISOString() 
      });
      
      await saveSesiones(sesionesData);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const handleClose = async () => {
    const hasContent = sesionesData.some(sesion => 
      sesion.titulo.trim() || sesion.inicio.trim() || sesion.desarrollo.trim() || sesion.cierre.trim()
    );

    if (!hasContent) {
      toast({
        title: "Error",
        description: "Debe completar al menos una sesión antes de cerrar",
        variant: "destructive",
      });
      return;
    }

    console.log('[A8:CLOSE]', { 
      form_valid: formValid, 
      analysis_complete: analysisComplete, 
      timestamp: new Date().toISOString() 
    });

    await handleSave();
    await closeAccelerator('A8');
    
    toast({
      title: "A8 cerrado",
      description: "Las sesiones han sido guardadas y el acelerador se ha cerrado exitosamente.",
    });
  };

  const handleReopen = async () => {
    try {
      const updatedSesiones = sesionesData.map(sesion => ({
        ...sesion,
        estado: 'BORRADOR' as const,
        closed_at: null
      }));
      
      await saveSesiones(updatedSesiones);
      setSesionesData(updatedSesiones);
      
      toast({
        title: "Acelerador reabierto",
        description: "Las sesiones se han reabierto para edición.",
      });
      
      setShowReopenDialog(false);
    } catch (error) {
      console.error('Reopen error:', error);
      toast({
        title: "Error al reabrir",
        description: "No se pudieron reabrir las sesiones",
        variant: "destructive",
      });
    }
  };

  // Enhanced Debug and State Exposure
  useEffect(() => {
    const debugData = {
      isClosed: areSessionsClosed,
      generationLoading,
      regenLoading: regenerationLoading,
      autoSaving,
      saving,
      sessionsCount: sesionesData.length,
      criteriaTotal: sesionesData.reduce((acc, s) => acc + s.rubrica_json.criteria.length, 0),
      lastAutoSaveAt: lastAutoSaveTime ? new Date(lastAutoSaveTime).toISOString() : null,
      unidadId: unidad?.id || null,
      autoSaveEnabled,
      formValid,
      // Connectivity debug
      pingOk,
      functionName: 'generate-session-structure',
      corsOkGuess: pingOk === true,
      lastHttpStatus,
      lastNetworkError,
      payloadBytes
    };

    (window as any).__A8_DEBUG = debugData;

    const diagnosticData = {
      // Core state variables
      isClosed: areSessionsClosed,
      formValid,
      analysisComplete,
      hasSesiones,
      canProceedToNext: false, // A8 is final
      canAccessA8,
      
      // Progress flags
      progress: {
        a6_completed: progress.a6_completed,
        a7_completed: progress.a7_completed,
        a8_completed: progress.a8_completed,
        overall_progress: progress.overall_progress
      },
      
      // Unit state
      unidadEstado: unidad?.estado || 'N/A',
      
      // Sessions details
      sesionesCount: sesionesData.length,
      expectedSesiones: unidad?.numero_sesiones || 0,
      sesionesWithContent: sesionesData.filter(s => 
        s.titulo.trim() || s.inicio.trim() || s.desarrollo.trim() || s.cierre.trim()
      ).length,
      
      // Generation state
      generationLoading,
      regenerationLoading,
      generationComplete,
      autoSaving,
      saving,
      
      counts: {
        criterios: sesionesData.reduce((acc, s) => acc + s.rubrica_json.criteria.length, 0),
        niveles: 3, // Standard evaluation levels
        tools: sesionesData.length
      }
    };
    
    console.log('[A8:DIAGNOSTIC]', diagnosticData);

    // Button visibility logging
    const buttonStates = {
      generateVisible: !generationComplete && !areSessionsClosed,
      regenerateVisible: generationComplete && !areSessionsClosed && sesionesData.length > 0,
      saveVisible: !areSessionsClosed && formValid,
      closeVisible: !areSessionsClosed && formValid,
      continueVisible: false // A8 is final
    };
    
    console.log('[A8:BUTTONS]', buttonStates);
  }, [
    areSessionsClosed, formValid, analysisComplete, hasSesiones, canAccessA8,
    progress, unidad?.estado, sesionesData, unidad?.numero_sesiones,
    generationLoading, regenerationLoading, generationComplete, autoSaving, saving, 
    showReopenDialog, lastAutoSaveTime, autoSaveEnabled,
    pingOk, lastHttpStatus, lastNetworkError, payloadBytes
  ]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando Acelerador 8...</p>
        </div>
      </div>
    );
  }

  if (!canAccessA8) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Acceso Restringido</h2>
          <p className="text-muted-foreground mb-6">
            Debe completar los Aceleradores 6 y 7 antes de acceder al Acelerador 8
          </p>
          <Button onClick={() => navigate('/etapa3')}>
            Volver a Etapa 3
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/etapa3')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Etapa 3
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Acelerador 8</h1>
              <p className="text-muted-foreground">Diseño de Sesiones</p>
            </div>
          </div>

            <div className="flex items-center gap-3">
              {progress.a7_completed && sesionesData.length > 0 && (
                <Button 
                  onClick={() => navigate('/etapa3/acelerador8/visor')}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Ver documento completo
                </Button>
              )}
              {autoSaving && (
                <Badge variant="outline" className="gap-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-muted-foreground"></div>
                  Guardando...
                </Badge>
              )}
              {areSessionsClosed && (
                <Badge variant="default" className="gap-2">
                  <Lock className="h-4 w-4" />
                  Cerrado
                </Badge>
              )}
              {areSessionsClosed ? (
                <Button onClick={() => setShowReopenDialog(true)} variant="outline">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              ) : (
                <Button onClick={handleSave} disabled={saving || autoSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
              )}
            </div>
        </div>

        {/* Unit Context */}
        {unidad && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Contexto de la Unidad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Título:</span> {unidad.titulo}
                </div>
                <div>
                  <span className="font-medium">Sesiones:</span> {unidad.numero_sesiones}
                </div>
                <div>
                  <span className="font-medium">Duración:</span> {unidad.duracion_min} min
                </div>
                <div>
                  <span className="font-medium">Área:</span> {unidad.area_curricular}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generation Section */}
        {!generationComplete && !areSessionsClosed && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Connectivity warning */}
                {pingOk === false && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-lg text-sm">
                    ⚠️ Conectividad con funciones no disponible
                  </div>
                )}

                <div className="text-center">
                  <p className="text-muted-foreground mb-4">
                    Genere sugerencias de sesiones basadas en su unidad de aprendizaje
                  </p>
                  <Button 
                    onClick={handleGenerateSessions}
                    disabled={generationLoading || regenerationLoading || !unidad}
                    aria-busy={generationLoading || regenerationLoading}
                    size="lg"
                  >
                    {generationLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generando sesiones...
                      </>
                    ) : (
                      <>
                        <Bot className="h-4 w-4 mr-2" />
                        Generar Sesiones con IA
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sessions Editor */}
        {sesionesData.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h2 className="text-lg font-semibold">Editor de Sesiones</h2>
              </div>
              {generationComplete && !areSessionsClosed && (
                <Button 
                  onClick={handleRegenerateClick}
                  disabled={regenerationLoading || !unidad}
                  variant="outline"
                  data-testid="regen-sessions-btn"
                >
                  {regenerationLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                      Regenerando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerar con IA
                    </>
                  )}
                </Button>
              )}
            </div>

            {sesionesData.map((sesion, index) => (
              <Card key={sesion.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>Sesión {sesion.session_index}</span>
                     {sesion.estado === 'CERRADO' && (
                       <Badge variant="secondary">
                         <Lock className="h-3 w-3 mr-1" />
                         Cerrado
                       </Badge>
                     )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* Session Title */}
                  <div>
                    <Label htmlFor={`titulo-${index}`}>Título de la Sesión</Label>
                    <Input
                      id={`titulo-${index}`}
                      value={sesion.titulo}
                      onChange={(e) => updateSession(index, 'titulo', e.target.value)}
                      placeholder="Ingrese el título de la sesión"
                      disabled={areSessionsClosed}
                    />
                  </div>

                  {/* Session Structure */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor={`inicio-${index}`}>Inicio (Motivación/Saberes previos)</Label>
                      <Textarea
                        id={`inicio-${index}`}
                        value={sesion.inicio || ''}
                        onChange={(e) => updateSession(index, 'inicio', e.target.value)}
                        placeholder="Actividades de inicio..."
                        className="min-h-[100px]"
                        disabled={areSessionsClosed}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`desarrollo-${index}`}>Desarrollo (Construcción del aprendizaje)</Label>
                      <Textarea
                        id={`desarrollo-${index}`}
                        value={sesion.desarrollo || ''}
                        onChange={(e) => updateSession(index, 'desarrollo', e.target.value)}
                        placeholder="Actividades de desarrollo..."
                        className="min-h-[100px]"
                        disabled={areSessionsClosed}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`cierre-${index}`}>Cierre (Consolidación/Evaluación)</Label>
                      <Textarea
                        id={`cierre-${index}`}
                        value={sesion.cierre || ''}
                        onChange={(e) => updateSession(index, 'cierre', e.target.value)}
                        placeholder="Actividades de cierre..."
                        className="min-h-[100px]"
                        disabled={areSessionsClosed}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Evidences */}
                  <div>
                    <Label>Evidencias de la Sesión</Label>
                    <div className="space-y-2 mt-2">
                      {sesion.evidencias.map((evidence, eIndex) => (
                        <div key={eIndex} className="flex items-center gap-2">
                          <span className="text-sm flex-1 p-2 bg-muted rounded">{evidence}</span>
                          {!areSessionsClosed && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeEvidence(index, eIndex)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      {!areSessionsClosed && (
                        <div className="flex gap-2">
                          <Input 
                            placeholder="Agregar evidencia..."
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addEvidence(index, e.currentTarget.value);
                                e.currentTarget.value = '';
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mini Rubric */}
                  <div>
                    <Label>Criterios de Evaluación para esta Sesión</Label>
                    <div className="space-y-2 mt-2">
                      {sesion.rubrica_json.criteria.map((criterion, cIndex) => (
                        <div key={cIndex} className="flex items-center gap-2">
                          <span className="text-sm flex-1 p-2 bg-muted rounded">{criterion}</span>
                          {!areSessionsClosed && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeRubricCriterion(index, cIndex)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      {!areSessionsClosed && (
                        <div className="flex gap-2">
                          <Input 
                            placeholder="Agregar criterio observable..."
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addRubricCriterion(index, e.currentTarget.value);
                                e.currentTarget.value = '';
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={() => navigate('/etapa3')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>

          {!areSessionsClosed && (
            <Button 
              onClick={handleClose}
              disabled={saving}
              variant="default"
            >
              Guardar y Cerrar A8
            </Button>
          )}
        </div>

        {/* Regenerate Confirmation Dialog */}
        <AlertDialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Regenerar sesiones con IA?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción reemplazará completamente todas las sesiones actuales con nuevas versiones generadas por IA. 
                Los cambios manuales se perderán. ¿Está seguro de que desea continuar?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel 
                onClick={() => {
                  console.log('[A8:REGEN_CONFIRM]', { accepted: false, timestamp: new Date().toISOString() });
                  setShowRegenerateDialog(false);
                }}
              >
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleRegenerateSessions}
                disabled={regenerationLoading}
                data-testid="regen-confirm"
              >
                {regenerationLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Regenerando...
                  </>
                ) : (
                  'Regenerar'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reopen Dialog */}
        <AlertDialog open={showReopenDialog} onOpenChange={setShowReopenDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Reabrir para edición?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción permitirá editar las sesiones nuevamente. Podrá cerrar el acelerador cuando termine.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleReopen}>
                Reabrir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}