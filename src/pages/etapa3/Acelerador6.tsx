import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, ArrowRight, Upload, FileText, Bot, CheckCircle, Save, Lock, AlertCircle, Edit3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { supabase } from '@/integrations/supabase/client';
import { useEtapa3V2 } from '@/hooks/useEtapa3V2';
import CompetenciasMultiSelect from '@/components/CompetenciasMultiSelect';

const AREAS_CURRICULARES = [
  'Comunicación', 'Matemática', 'Ciencias Sociales', 'Ciencia y Tecnología',
  'Educación Física', 'Arte y Cultura', 'Inglés', 'Educación Religiosa',
  'Educación para el Trabajo', 'Tutoría'
];

const GRADOS = ['1ro', '2do', '3ro', '4to', '5to'];

export default function Acelerador6() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { unidad, loading, saving, saveUnidad, closeAccelerator, progress } = useEtapa3V2();
  
  const [formData, setFormData] = useState({
    titulo: '',
    area_curricular: '',
    grado: '',
    numero_sesiones: 4,
    duracion_min: 90,
    proposito: '',
    evidencias: '',
    diagnostico_text: '',
    diagnostico_pdf_url: '',
    ia_recomendaciones: '',
    competencias_ids: [] as string[],
  });
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfExtracting, setPdfExtracting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showReopenDialog, setShowReopenDialog] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastAutoSaveAt, setLastAutoSaveAt] = useState(0);
  const [extractedPdfText, setExtractedPdfText] = useState(''); // Separate state for PDF text
  
  // Debounced form data for auto-save (5s debounce + 10s throttle)
  const debouncedFormData = useDebounce(formData, 5000);

  // Helper functions and computed values
  const isFormValid = () => {
    return !!(
      formData.titulo?.trim() &&
      formData.area_curricular &&
      formData.grado &&
      formData.proposito?.trim() &&
      formData.evidencias?.trim() &&
      formData.numero_sesiones &&
      formData.duracion_min
    );
  };

  const isClosed = unidad?.estado === 'CERRADO';
  const analysisComplete = !!formData.ia_recomendaciones;
  const canProceedToA7 = progress.a6_completed && isClosed && analysisComplete && isFormValid();

  // Load existing data
  useEffect(() => {
    if (unidad) {
      setFormData({
        titulo: unidad.titulo || '',
        area_curricular: unidad.area_curricular || '',
        grado: unidad.grado || '',
        numero_sesiones: unidad.numero_sesiones || 4,
        duracion_min: unidad.duracion_min || 90,
        proposito: unidad.proposito || '',
        evidencias: unidad.evidencias || '',
        diagnostico_text: unidad.diagnostico_text || '',
        diagnostico_pdf_url: unidad.diagnostico_pdf_url || '',
        ia_recomendaciones: unidad.ia_recomendaciones || '',
        competencias_ids: unidad.competencias_ids || [],
      });
    }
  }, [unidad]);

  // Silent auto-save functionality with debounce and throttle
  useEffect(() => {
    const now = Date.now();
    const THROTTLE_MS = 10000; // 10s minimum between auto-saves
    
    if (
      !isClosed && // NO auto-save if closed
      !saving &&
      !autoSaving &&
      unidad &&
      debouncedFormData.titulo &&
      debouncedFormData.area_curricular &&
      (lastAutoSaveAt === 0 || now - lastAutoSaveAt >= THROTTLE_MS)
    ) {
      handleAutoSave();
      setLastAutoSaveAt(now);
    }
  }, [debouncedFormData, isClosed, saving, autoSaving, unidad, lastAutoSaveAt]);

  const handleAutoSave = async () => {
    if (!formData.titulo || !formData.area_curricular) return;
    
    console.log('[A6:AUTOSAVE]', { 
      timestamp: new Date().toISOString(),
      silent: true, 
      payloadKeys: ['titulo', 'area_curricular', 'grado', 'numero_sesiones', 'duracion_min', 'proposito', 'evidencias', 'diagnostico_text', 'diagnostico_pdf_url', 'ia_recomendaciones', 'competencias_ids'],
      estadoBefore: unidad?.estado 
    });
    
    try {
      setAutoSaving(true);
      await saveUnidad({
        titulo: formData.titulo,
        area_curricular: formData.area_curricular,
        grado: formData.grado,
        numero_sesiones: formData.numero_sesiones,
        duracion_min: formData.duracion_min,
        proposito: formData.proposito,
        evidencias: formData.evidencias,
        diagnostico_text: formData.diagnostico_text,
        diagnostico_pdf_url: formData.diagnostico_pdf_url,
        ia_recomendaciones: formData.ia_recomendaciones,
        competencias_ids: formData.competencias_ids,
      }, { silent: true }); // Silent auto-save - NO toast
      
      console.log('[A6:AUTOSAVE_SUCCESS]', { timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('[A6:AUTOSAVE_ERROR]', error);
      // Only show error toast for auto-save failures (no success toast)
      toast({
        title: "Error en guardado automático",
        description: "No se pudieron guardar los cambios automáticamente",
        variant: "destructive",
      });
    } finally {
      setAutoSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // File validation
    if (file.type !== 'application/pdf') {
      toast({
        title: "Error",
        description: "Solo se permiten archivos PDF",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "Error",
        description: "El archivo PDF no puede exceder 5MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setPdfUploading(true);

      // Get current user ID for RLS compliance
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Generate unique file path with user_id as first folder for RLS compliance
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${timestamp}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `${user.id}/diagnosticos/${fileName}`;

      // Upload to diagnosticos-pdf bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('diagnosticos-pdf')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Error subiendo archivo: ${uploadError.message}`);
      }

      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('diagnosticos-pdf')
        .getPublicUrl(filePath);

      // Update form data with PDF URL
      handleInputChange('diagnostico_pdf_url', urlData.publicUrl);

      toast({
        title: "PDF subido exitosamente",
        description: "Extrayendo texto automáticamente...",
      });

      // Start text extraction
      setPdfExtracting(true);

      const { data: extractData, error: extractError } = await supabase.functions.invoke('extract-diagnostico-text', {
        body: { file_path: filePath }
      });

      if (extractError) {
        console.error('Extract error:', extractError);
        throw new Error(`Error extrayendo texto: ${extractError.message}`);
      }

      if (extractData.success && extractData.text) {
        const extractedText = extractData.text.trim();
        
        if (extractedText.length > 100) {
          // Store PDF text separately, don't populate textarea
          setExtractedPdfText(extractedText);
          
          toast({
            title: "PDF procesado exitosamente",
            description: `Texto extraído (${extractedText.length} caracteres). Ejecutando análisis automático...`,
          });
          
          // Telemetry event for successful extraction
          console.log('A6 PDF Text Extracted Successfully', {
            event: 'a6_pdf_text_extracted_ok',
            file_size: file.size,
            text_length: extractedText.length,
            timestamp: new Date().toISOString()
          });

          // Auto-trigger AI analysis after successful PDF extraction
          setTimeout(() => {
            handleAnalyzeCoherenceWithPdfText(extractedText);
          }, 1000);
          
        } else {
          toast({
            title: "Texto extraído parcialmente",
            description: "Se extrajo poco texto del PDF. Por favor, ingrese el texto manualmente en el campo de abajo.",
            variant: "destructive",
          });
          
          // Telemetry event for partial extraction
          console.log('A6 PDF Text Extraction Partial', {
            event: 'a6_pdf_text_extracted_partial',
            file_size: file.size,
            text_length: extractedText.length,
            timestamp: new Date().toISOString()
          });
        }
      } else {
        throw new Error(extractData.error || 'No se pudo extraer texto del PDF');
      }

      // Telemetry event for successful PDF upload
      console.log('A6 PDF Uploaded Successfully', {
        event: 'a6_pdf_uploaded',
        file_size: file.size,
        file_name: fileName,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('PDF upload/extract error:', error);
      
      // Telemetry event for failed extraction
      console.log('A6 PDF Processing Failed', {
        event: 'a6_pdf_text_extracted_fail',
        error: error.message,
        file_size: file?.size || 0,
        timestamp: new Date().toISOString()
      });

      toast({
        title: "Error procesando PDF",
        description: `${error.message}. Por favor, ingrese el texto manualmente.`,
        variant: "destructive",
      });
    } finally {
      setPdfUploading(false);
      setPdfExtracting(false);
      
      // Reset file input
      const input = document.getElementById('pdf-upload') as HTMLInputElement;
      if (input) input.value = '';
    }
  };

  // Helper function for AI analysis with PDF text
  const handleAnalyzeCoherenceWithPdfText = async (pdfText: string) => {
    if (!isFormValid()) {
      toast({
        title: "Error",
        description: "Complete todos los campos requeridos antes del análisis",
        variant: "destructive",
      });
      return;
    }

    const requestId = crypto.randomUUID();
    console.log('[A6:AI_REQUEST_PDF]', {
      request_id: requestId,
      chars_diagnostico: pdfText.length,
      source: 'PDF',
      titulo: formData.titulo,
      area: formData.area_curricular,
      grado: formData.grado,
      sesiones: formData.numero_sesiones,
      duracion_min: formData.duracion_min
    });

    try {
      setIsAnalyzing(true);

      const { data, error } = await supabase.functions.invoke('analyze-unit-coherence', {
        body: {
          unidad_data: formData,
          diagnostico_text: pdfText
        }
      });

      if (error) {
        console.error('[A6:AI_ERROR]', { request_id: requestId, error });
        throw error;
      }

      console.log('[A6:AI_RESPONSE]', {
        request_id: requestId,
        success: data?.success,
        has_analysis: !!data?.analysis,
        response_preview: JSON.stringify(data).substring(0, 200)
      });

      if (data.success && data.analysis) {
        // Validate JSON structure
        try {
          JSON.parse(JSON.stringify(data.analysis));
          const analysisString = JSON.stringify(data.analysis, null, 2);
          
          console.log('[A6:AI_VALID]', {
            request_id: requestId,
            analysis_preview: analysisString.substring(0, 200),
            analysis_length: analysisString.length
          });
          
          handleInputChange('ia_recomendaciones', analysisString);
          
          toast({
            title: "Análisis completado",
            description: "El análisis de coherencia con el PDF se ha generado exitosamente",
          });
        } catch (jsonError) {
          console.error('[A6:INVALID_JSON]', { request_id: requestId, jsonError });
          throw new Error('Respuesta de IA con formato inválido');
        }
      } else {
        throw new Error(data.error || 'Error en el análisis');
      }

    } catch (error: any) {
      console.error('[A6:AI_FINAL_ERROR]', { request_id: requestId, error: error.message });
      toast({
        title: "Error en el análisis",
        description: "No se pudo completar el análisis. Intente nuevamente o ingrese el texto manualmente.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeCoherence = async () => {
    // Use PDF text if available, otherwise use textarea text
    const diagnosticText = extractedPdfText || formData.diagnostico_text;
    
    if (!diagnosticText || diagnosticText.length < 300) {
      toast({
        title: "Error",
        description: `${extractedPdfText ? 'Error procesando PDF' : 'El diagnóstico debe tener al menos 300 caracteres'}`,
        variant: "destructive",
      });
      return;
    }

    if (!isFormValid()) {
      toast({
        title: "Error",
        description: "Complete todos los campos requeridos antes del análisis",
        variant: "destructive",
      });
      return;
    }

    const requestId = crypto.randomUUID();
    console.log('[A6:AI_REQUEST]', {
      request_id: requestId,
      chars_diagnostico: diagnosticText.length,
      source: extractedPdfText ? 'PDF' : 'Manual',
      titulo: formData.titulo,
      area: formData.area_curricular,
      grado: formData.grado,
      sesiones: formData.numero_sesiones,
      duracion_min: formData.duracion_min
    });

    try {
      setIsAnalyzing(true);

      const { data, error } = await supabase.functions.invoke('analyze-unit-coherence', {
        body: {
          unidad_data: formData,
          diagnostico_text: diagnosticText
        }
      });

      if (error) {
        console.error('[A6:AI_ERROR]', { request_id: requestId, error });
        throw error;
      }

      console.log('[A6:AI_RESPONSE]', {
        request_id: requestId,
        success: data?.success,
        has_analysis: !!data?.analysis,
        response_preview: JSON.stringify(data).substring(0, 200)
      });

      if (data.success && data.analysis) {
        // Validate JSON structure
        try {
          JSON.parse(JSON.stringify(data.analysis));
          const analysisString = JSON.stringify(data.analysis, null, 2);
          
          console.log('[A6:AI_VALID]', {
            request_id: requestId,
            analysis_preview: analysisString.substring(0, 200),
            analysis_length: analysisString.length
          });
          
          handleInputChange('ia_recomendaciones', analysisString);
          
          toast({
            title: "Análisis completado",
            description: "El análisis de coherencia se ha generado exitosamente",
          });
        } catch (jsonError) {
          console.error('[A6:INVALID_JSON]', { request_id: requestId, jsonError });
          throw new Error('Respuesta de IA con formato inválido');
        }
      } else {
        throw new Error(data.error || 'Error en el análisis');
      }

    } catch (error: any) {
      console.error('[A6:AI_FINAL_ERROR]', { request_id: requestId, error: error.message });
      toast({
        title: "Error en el análisis",
        description: "No se pudo completar el análisis. Intente nuevamente o continúe editando manualmente.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    console.log('[A6:SAVE]', { 
      silent: false, 
      payloadKeys: Object.keys(formData), 
      estadoBefore: unidad?.estado 
    });
    
    try {
      await saveUnidad({
        titulo: formData.titulo,
        area_curricular: formData.area_curricular,
        grado: formData.grado,
        numero_sesiones: formData.numero_sesiones,
        duracion_min: formData.duracion_min,
        proposito: formData.proposito,
        evidencias: formData.evidencias,
        diagnostico_text: formData.diagnostico_text,
        diagnostico_pdf_url: formData.diagnostico_pdf_url,
        ia_recomendaciones: formData.ia_recomendaciones,
        competencias_ids: formData.competencias_ids,
      });
      
      toast({
        title: "Unidad guardada",
        description: "La unidad de aprendizaje se ha guardado exitosamente",
      });
    } catch (error) {
      console.error('[A6:SAVE_ERROR]', error);
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar la unidad",
        variant: "destructive",
      });
    }
  };

  const handleClose = async () => {
    if (!isFormValid()) {
      toast({
        title: "Formulario incompleto",
        description: "Debe completar todos los campos requeridos antes de cerrar",
        variant: "destructive",
      });
      return;
    }

    console.log('[A6:CLOSE]', { 
      newEstado: 'CERRADO', 
      closed_at: true,
      formValid: isFormValid(),
      analysisComplete
    });

    try {
      await handleSave();
      await closeAccelerator('A6');
      
      toast({
        title: "A6 cerrado exitosamente",
        description: "La unidad está lista. Ahora puede continuar a A7.",
      });
    } catch (error) {
      console.error('[A6:CLOSE_ERROR]', error);
      toast({
        title: "Error al cerrar",
        description: "No se pudo cerrar A6",
        variant: "destructive",
      });
    }
  };

  const handleReopen = async () => {
    console.log('[A6:REOPEN]', { 
      estadoBefore: unidad?.estado,
      newEstado: 'BORRADOR', 
      closed_at: null 
    });
    
    try {
      await saveUnidad({
        ...formData,
        estado: 'BORRADOR',
        closed_at: null
      });
      
      toast({
        title: "A6 reabierto exitosamente",
        description: "La unidad se ha reabierto para edición. A7 y A8 requerirán revisión.",
      });
      
      setShowReopenDialog(false);
    } catch (error) {
      console.error('[A6:REOPEN_ERROR]', error);
      toast({
        title: "Error al reabrir",
        description: "No se pudo reabrir la unidad",
        variant: "destructive",
      });
    }
  };

  // JSON validation check
  useEffect(() => {
    if (formData.ia_recomendaciones) {
      try { 
        JSON.parse(formData.ia_recomendaciones);
        console.log('[A6:JSON_VALID]', { length: formData.ia_recomendaciones.length });
      } catch(e) { 
        console.error('[A6:INVALID_JSON]', e, { preview: formData.ia_recomendaciones.substring(0, 100) });
      }
    }
  }, [formData.ia_recomendaciones]);

  // Helper function to parse IA recommendations
  const parseIARecommendations = (iaRecommendations: string): string[] | null => {
    if (!iaRecommendations) return null;
    
    try {
      const parsed = JSON.parse(iaRecommendations);
      if (parsed.ajustes_sugeridos_unidad && Array.isArray(parsed.ajustes_sugeridos_unidad)) {
        return parsed.ajustes_sugeridos_unidad;
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  // Debug logging for A6 runtime state (UI conditions)
  console.log('[A6:UI]', {
    isClosed,
    diagnosticoLength: formData.diagnostico_text?.length || 0,
    hasRecs: !!formData.ia_recomendaciones,
    formValid: isFormValid(),
    unidadEstado: unidad?.estado,
    progress,
    analysisComplete,
    autoSaving,
    lastAutoSaveAt: new Date(lastAutoSaveAt).toLocaleTimeString(),
    canProceedToA7
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando Acelerador 6...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/etapa3')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Etapa 3
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Acelerador 6</h1>
              <p className="text-muted-foreground">Diseño de Unidad de Aprendizaje</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {autoSaving && (
              <Badge variant="outline" className="gap-2">
                <div className="animate-spin rounded-full h-3 w-3 border-b border-muted-foreground"></div>
                Guardando...
              </Badge>
            )}
            {isClosed && (
              <Badge variant="default" className="gap-2">
                <Lock className="h-4 w-4" />
                Cerrado
              </Badge>
            )}
            {isClosed ? (
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

        {/* Progress Stepper */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Step 1 - Basic Info */}
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  formData.titulo && formData.area_curricular 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  1
                </div>
                <span className="ml-2 text-sm font-medium">Información Básica</span>
              </div>
              
              {/* Connector */}
              <div className="w-8 h-px bg-border" />
              
               {/* Step 2 - Diagnosis */}
               <div className="flex items-center">
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                   (extractedPdfText?.length >= 300) || (formData.diagnostico_text?.length >= 300)
                     ? 'bg-primary text-primary-foreground' 
                     : 'bg-muted text-muted-foreground'
                 }`}>
                   2
                 </div>
                 <span className="ml-2 text-sm font-medium">Diagnóstico</span>
               </div>
              
              {/* Connector */}
              <div className="w-8 h-px bg-border" />
              
              {/* Step 3 - AI Analysis */}
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  analysisComplete 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  3
                </div>
                <span className="ml-2 text-sm font-medium">Análisis IA</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="grid gap-6">
          
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="titulo">Título de la Unidad *</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) => handleInputChange('titulo', e.target.value)}
                    placeholder="Ingrese el título de la unidad"
                    disabled={isClosed}
                  />
                </div>
                <div>
                  <Label htmlFor="area">Área Curricular *</Label>
                  <Select
                    value={formData.area_curricular}
                    onValueChange={(value) => {
                      handleInputChange('area_curricular', value);
                      // Reset competencias when area changes
                      handleInputChange('competencias_ids', []);
                    }}
                    disabled={isClosed}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione el área" />
                    </SelectTrigger>
                    <SelectContent>
                      {AREAS_CURRICULARES.map(area => (
                        <SelectItem key={area} value={area}>{area}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="grado">Grado *</Label>
                  <Select
                    value={formData.grado}
                    onValueChange={(value) => handleInputChange('grado', value)}
                    disabled={isClosed}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione el grado" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADOS.map(grado => (
                        <SelectItem key={grado} value={grado}>{grado}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sesiones">N° de Sesiones *</Label>
                  <Input
                    id="sesiones"
                    type="number"
                    min={1}
                    max={12}
                    value={formData.numero_sesiones}
                    onChange={(e) => handleInputChange('numero_sesiones', parseInt(e.target.value))}
                    disabled={isClosed}
                  />
                </div>
                <div>
                  <Label htmlFor="duracion">Duración (minutos) *</Label>
                  <Input
                    id="duracion"
                    type="number"
                    min={30}
                    max={120}
                    value={formData.duracion_min}
                    onChange={(e) => handleInputChange('duracion_min', parseInt(e.target.value))}
                    disabled={isClosed}
                  />
                </div>
              </div>

              {/* CNEB Competencies Multi-Select */}
              <div className="col-span-2">
                <CompetenciasMultiSelect
                  areaCurricular={formData.area_curricular}
                  selectedCompetencias={formData.competencias_ids}
                  onCompetenciasChange={(competencias) => 
                    handleInputChange('competencias_ids', competencias)
                  }
                  disabled={isClosed}
                  maxCompetencias={2}
                />
              </div>

              <div>
                <Label htmlFor="proposito">Propósito de la Unidad *</Label>
                <Textarea
                  id="proposito"
                  value={formData.proposito}
                  onChange={(e) => handleInputChange('proposito', e.target.value)}
                  placeholder="Describa el propósito de esta unidad de aprendizaje"
                  className="min-h-[100px]"
                  disabled={isClosed}
                />
              </div>

              <div>
                <Label htmlFor="evidencias">Evidencias de Aprendizaje *</Label>
                <Textarea
                  id="evidencias"
                  value={formData.evidencias}
                  onChange={(e) => handleInputChange('evidencias', e.target.value)}
                  placeholder="Describa las evidencias que demostrarán el aprendizaje de los estudiantes"
                  className="min-h-[80px]"
                  disabled={isClosed}
                />
              </div>
            </CardContent>
          </Card>

          {/* Diagnosis Section */}
          <Card>
            <CardHeader>
              <CardTitle>Diagnóstico Pedagógico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!formData.diagnostico_pdf_url && (
                <div>
                  <Label>Subir PDF de Diagnóstico (opcional)</Label>
                  <div className="mt-2">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handlePdfUpload}
                      className="hidden"
                      id="pdf-upload"
                      disabled={isClosed || pdfUploading}
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => document.getElementById('pdf-upload')?.click()}
                      disabled={isClosed || pdfUploading}
                      className="w-full"
                    >
                      {pdfUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                          {pdfExtracting ? "Extrayendo texto..." : "Subiendo PDF..."}
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Seleccionar PDF
                        </>
                      )}
                    </Button>
                    <p className="text-sm text-muted-foreground mt-1">
                      Máximo 5MB. El texto se extraerá automáticamente.
                    </p>
                  </div>
                </div>
              )}

              {formData.diagnostico_pdf_url && (
                <div className="p-3 bg-muted rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <div>
                      <p className="text-sm font-medium">PDF procesado exitosamente</p>
                      <p className="text-xs text-muted-foreground">
                        {formData.diagnostico_pdf_url.split('/').pop()?.substring(0, 50)}...
                      </p>
                    </div>
                  </div>
                   <Button 
                     variant="ghost" 
                     size="sm"
                     onClick={() => {
                       handleInputChange('diagnostico_pdf_url', '');
                       handleInputChange('diagnostico_text', '');
                       setExtractedPdfText(''); // Clear PDF text too
                     }}
                     disabled={isClosed}
                   >
                     Eliminar
                   </Button>
                </div>
              )}

               <div>
                 <Label htmlFor="diagnostico">
                   Texto del Diagnóstico
                   {extractedPdfText && (
                     <span className="text-sm text-green-600 ml-2">
                       (PDF cargado - campo opcional)
                     </span>
                   )}
                 </Label>
                 <Textarea
                   id="diagnostico"
                   value={formData.diagnostico_text}
                   onChange={(e) => handleInputChange('diagnostico_text', e.target.value)}
                   placeholder={
                     extractedPdfText 
                       ? "Campo opcional: el PDF ya fue procesado. Solo complete si desea agregar información adicional..."
                       : "Pegue aquí el texto del diagnóstico pedagógico o escriba un resumen..."
                   }
                   className="min-h-[120px]"
                   disabled={isClosed}
                 />
                 <p className="text-sm text-muted-foreground mt-1">
                   {extractedPdfText 
                     ? `PDF procesado con ${extractedPdfText.length} caracteres. Análisis disponible.`
                     : "Mínimo 300 caracteres para el análisis de IA"
                   }
                 </p>
               </div>

               {/* Show analysis button if we have PDF text OR sufficient manual text */}
               {((extractedPdfText && extractedPdfText.length >= 300) || 
                 (formData.diagnostico_text && formData.diagnostico_text.length >= 300)) && 
                 !isClosed && (
                 <Button 
                   onClick={handleAnalyzeCoherence}
                   disabled={isAnalyzing || !isFormValid()}
                   className="w-full"
                 >
                   {isAnalyzing ? (
                     <>
                       <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                       Analizando coherencia...
                     </>
                   ) : (
                     <>
                       <Bot className="h-4 w-4 mr-2" />
                       {extractedPdfText ? 'Analizar Coherencia con PDF' : 'Analizar Coherencia con IA'}
                     </>
                   )}
                 </Button>
               )}

              {formData.ia_recomendaciones && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <p className="font-medium text-green-800 dark:text-green-200">
                      Análisis de Coherencia Completado
                    </p>
                  </div>
                  
                  <div>
                    <Label>Recomendaciones de IA</Label>
                    {(() => {
                      if (!formData.ia_recomendaciones) {
                        return (
                          <Textarea
                            value="No se generaron recomendaciones"
                            onChange={(e) => handleInputChange('ia_recomendaciones', e.target.value)}
                            className="min-h-[150px] mt-2"
                            disabled={isClosed}
                            placeholder="Las recomendaciones aparecerán aquí después del análisis..."
                          />
                        );
                      }

                      try {
                        const parsed = JSON.parse(formData.ia_recomendaciones);
                        
                        if (parsed.recomendaciones && Array.isArray(parsed.recomendaciones) && parsed.recomendaciones.length > 0) {
                          return (
                            <div className="mt-2 space-y-4">
                              <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                                <div className="text-sm font-medium mb-2">
                                  Coherencia Global: {parsed.coherencia_global}%
                                </div>
                                {parsed.hallazgos_clave && (
                                  <div className="text-xs text-muted-foreground">
                                    {parsed.hallazgos_clave.length} hallazgos identificados
                                  </div>
                                )}
                              </div>
                              
                              <div className="space-y-3">
                                {parsed.recomendaciones.map((rec: any, index: number) => (
                                  <div key={index} className="border rounded-lg p-4 bg-card">
                                    <div className="flex items-start justify-between mb-3">
                                      <h4 className="font-medium text-sm flex-1">{rec.titulo}</h4>
                                      <div className="flex gap-2 ml-3">
                                        <span className={`px-2 py-1 rounded text-xs ${
                                          rec.impacto === 'alto' ? 'bg-green-100 text-green-800' :
                                          rec.impacto === 'medio' ? 'bg-yellow-100 text-yellow-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          Impacto: {rec.impacto}
                                        </span>
                                        <span className={`px-2 py-1 rounded text-xs ${
                                          rec.esfuerzo === 'alto' ? 'bg-red-100 text-red-800' :
                                          rec.esfuerzo === 'medio' ? 'bg-yellow-100 text-yellow-800' :
                                          'bg-green-100 text-green-800'
                                        }`}>
                                          Esfuerzo: {rec.esfuerzo}
                                        </span>
                                        {rec.requiere_dato_faltante && (
                                          <span className="px-2 py-1 rounded text-xs bg-orange-100 text-orange-800">
                                            ⚠️ Requiere datos
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {rec.vinculo_diagnostico?.cita && (
                                      <div className="text-xs text-muted-foreground mb-3 italic">
                                        "Vinculado a: {rec.vinculo_diagnostico.cita}"
                                      </div>
                                    )}
                                    
                                    <div className="space-y-3 text-sm">
                                      {rec.por_que && (
                                        <div>
                                          <span className="font-medium">Por qué:</span> {rec.por_que}
                                        </div>
                                      )}
                                      
                                      {rec.como && Array.isArray(rec.como) && (
                                        <div>
                                          <span className="font-medium">Cómo:</span>
                                          <ol className="list-decimal list-inside ml-4 mt-1 space-y-1">
                                            {rec.como.map((step: string, stepIndex: number) => (
                                              <li key={stepIndex}>{step}</li>
                                            ))}
                                          </ol>
                                        </div>
                                      )}
                                      
                                      {rec.ejemplo_actividad && (
                                        <div>
                                          <span className="font-medium">Ejemplo:</span> {rec.ejemplo_actividad.nombre}
                                          <div className="ml-4 mt-1 text-xs text-muted-foreground">
                                            {rec.ejemplo_actividad.descripcion}
                                            {rec.ejemplo_actividad.duracion_min && (
                                              <span className="block mt-1">Duración: {rec.ejemplo_actividad.duracion_min} min</span>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {rec.recursos && Array.isArray(rec.recursos) && (
                                        <div>
                                          <span className="font-medium">Recursos:</span> {rec.recursos.join(', ')}
                                        </div>
                                      )}
                                      
                                      {rec.tiempo_estimado && (
                                        <div>
                                          <span className="font-medium">Cuándo:</span> {rec.tiempo_estimado}
                                        </div>
                                      )}
                                      
                                      {rec.requiere_dato_faltante && rec.como_levantar_dato && (
                                        <div className="bg-orange-50 p-2 rounded text-xs">
                                          <span className="font-medium">⚠️ Cómo obtener el dato faltante:</span> {rec.como_levantar_dato}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                      } catch (e) {
                        // Fall back to editable textarea for invalid JSON
                      }
                      
                      return (
                        <Textarea
                          value={formData.ia_recomendaciones}
                          onChange={(e) => handleInputChange('ia_recomendaciones', e.target.value)}
                          className="min-h-[150px] mt-2"
                          disabled={isClosed}
                          placeholder="Contenido de recomendaciones (editable)..."
                        />
                      );
                    })()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => navigate('/etapa3')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>

            <div className="flex gap-3">
              {!isClosed && (
                <>
                  <Button 
                    onClick={handleSave}
                    disabled={!isFormValid() || saving}
                    variant="outline"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Guardar
                  </Button>
                  <Button 
                    onClick={handleClose}
                    disabled={!isFormValid() || saving || !analysisComplete}
                    variant="default"
                  >
                    Guardar y Cerrar A6
                  </Button>
                </>
              )}
              
              {isClosed && analysisComplete && isFormValid() && (
                <Button onClick={() => navigate('/etapa3/acelerador7')}>
                  Continuar a A7
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reopen Confirmation Dialog */}
      <AlertDialog open={showReopenDialog} onOpenChange={setShowReopenDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Reabrir Acelerador 6?</AlertDialogTitle>
            <AlertDialogDescription>
              Al reabrir esta unidad de aprendizaje, los Aceleradores 7 (Rúbrica) y 8 (Sesiones) 
              quedarán marcados como "pendientes de revisión" ya que pueden necesitar actualizaciones 
              basadas en los cambios que realice.
              <br /><br />
              ¿Está seguro de que desea continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleReopen}>
              Sí, reabrir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}