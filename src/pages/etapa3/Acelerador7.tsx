import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AutosizeTextarea } from '@/components/ui/autosize-textarea';
import { PrintPreviewModal } from '@/components/ui/print-preview-modal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, ArrowRight, Bot, CheckCircle, Save, Lock, Plus, Trash2, Edit3, RotateCcw, Eye, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { useUnidadHash } from '@/hooks/useUnidadHash';
import { supabase } from '@/integrations/supabase/client';
import { useEtapa3V2, RubricaEvaluacion } from '@/hooks/useEtapa3V2';

export default function Acelerador7() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { unidad, rubrica, loading, saving, saveRubrica, closeAccelerator, progress } = useEtapa3V2();
  
  const [rubricaData, setRubricaData] = useState<RubricaEvaluacion['estructura']>({
    levels: ['Inicio', 'Proceso', 'Logro'],
    criteria: []
  });

  const [generationLoading, setGenerationLoading] = useState(false);
  const [regenerationLoading, setRegenerationLoading] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [showReopenDialog, setShowReopenDialog] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastGenerationTime, setLastGenerationTime] = useState<number>(0);
  
  // Calculate hash of current unidad for cache management
  const unidadHash = useUnidadHash(unidad);
  
  // Debounced rubrica data for auto-save
  const debouncedRubricaData = useDebounce(rubricaData, 3000);

  // Load existing rubrica data
  useEffect(() => {
    if (rubrica) {
      setRubricaData(rubrica.estructura);
      if (rubrica.estructura.criteria.length > 0) {
        setGenerationComplete(true);
      }
    }
  }, [rubrica]);

  // Silent auto-save functionality with debounce
  useEffect(() => {
    if (debouncedRubricaData.criteria.length > 0 && !saving && !autoSaving && rubrica) {
      handleAutoSave();
    }
  }, [debouncedRubricaData, saving, autoSaving, rubrica]);

  const handleAutoSave = async () => {
    try {
      setAutoSaving(true);
      await saveRubrica({ 
        estructura: rubricaData,
        source_hash: unidadHash?.hash,
        source_snapshot: unidadHash?.snapshot,
        needs_review: false
      });
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setAutoSaving(false);
    }
  };

  const checkGenerationThrottle = () => {
    const now = Date.now();
    const timeSinceLastGeneration = now - lastGenerationTime;
    const throttleTime = 30000; // 30 seconds
    
    if (timeSinceLastGeneration < throttleTime) {
      const remainingTime = Math.ceil((throttleTime - timeSinceLastGeneration) / 1000);
      toast({
        title: "Espera un momento",
        description: `Puedes generar otra rúbrica en ${remainingTime} segundos`,
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const handleGenerateRubric = async () => {
    if (!unidad) {
      toast({
        title: "Error",
        description: "Debe completar el Acelerador 6 primero",
        variant: "destructive",
      });
      return;
    }

    if (!checkGenerationThrottle()) return;

    const requestId = crypto.randomUUID();
    console.log('[A7:GEN_REQUEST]', {
      request_id: requestId,
      unidad_id: unidad.id,
      titulo: unidad.titulo,
      area: unidad.area_curricular,
      source_hash: unidadHash?.hash,
      timestamp: new Date().toISOString()
    });

    try {
      setGenerationLoading(true);
      setLastGenerationTime(Date.now());

      const { data, error } = await supabase.functions.invoke('generate-evaluation-rubric', {
        body: { unidad_data: unidad }
      });

      console.log('[A7:GEN_RESPONSE]', {
        request_id: requestId,
        status: error ? 'error' : 'success',
        success: data?.success,
        error_code: data?.error_code,
        message: data?.message,
        criteria_count: data?.estructura?.criteria?.length || 0,
        timestamp: new Date().toISOString()
      });

      if (error || !data?.success) {
        const errorMessage = data?.message || error?.message || 'Error desconocido';
        toast({
          title: "Error en la generación",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      console.log('[A7:GEN_VALID]', {
        request_id: requestId,
        criteria_count: data.estructura.criteria.length,
        levels_count: data.estructura.levels.length,
        timestamp: new Date().toISOString()
      });

      setRubricaData(data.estructura);
      setGenerationComplete(true);
      
      toast({
        title: "Rúbrica generada exitosamente",
        description: `Se ha generado una rúbrica con ${data.estructura.criteria.length} criterios de evaluación`,
      });

    } catch (error: any) {
      console.error('[A7:GEN_ERROR]', {
        request_id: requestId,
        error_message: error.message,
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: "Error inesperado",
        description: "No se pudo generar la rúbrica. Puede crear una manualmente.",
        variant: "destructive",
      });
    } finally {
      setGenerationLoading(false);
    }
  };

  const handleRegenerateRubric = async () => {
    if (!unidad || !unidadHash) return;

    // Check if source hash is the same (no changes in unidad)
    if (rubrica?.source_hash === unidadHash.hash) {
      console.log('[A7:REGEN_SKIPPED]', {
        source_hash: unidadHash.hash,
        previous_hash: rubrica.source_hash,
        message: 'No changes in unidad data'
      });
      
      toast({
        title: "Nada que regenerar",
        description: "La unidad no cambió desde la última generación",
      });
      
      setShowRegenerateDialog(false);
      return;
    }

    if (!checkGenerationThrottle()) {
      setShowRegenerateDialog(false);
      return;
    }

    const requestId = crypto.randomUUID();
    console.log('[A7:REGEN_REQUEST]', {
      request_id: requestId,
      source_hash: unidadHash.hash,
      previous_hash: rubrica?.source_hash,
      timestamp: new Date().toISOString()
    });

    try {
      setRegenerationLoading(true);
      setLastGenerationTime(Date.now());

      const { data, error } = await supabase.functions.invoke('generate-evaluation-rubric', {
        body: { unidad_data: unidad }
      });

      if (error || !data?.success) {
        const errorMessage = data?.message || error?.message || 'Error desconocido';
        toast({
          title: "Error en la regeneración",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      console.log('[A7:REGEN_SUCCESS]', {
        request_id: requestId,
        criteria_count: data.estructura.criteria.length,
        timestamp: new Date().toISOString()
      });

      setRubricaData(data.estructura);
      setGenerationComplete(true);
      
      // Save immediately with new hash
      await saveRubrica({
        estructura: data.estructura,
        source_hash: unidadHash.hash,
        source_snapshot: unidadHash.snapshot,
        needs_review: false
      });
      
      toast({
        title: "Rúbrica regenerada exitosamente",
        description: `Se ha actualizado la rúbrica con ${data.estructura.criteria.length} criterios`,
      });

    } catch (error: any) {
      console.error('[A7:REGEN_ERROR]', {
        request_id: requestId,
        error_message: error.message,
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: "Error inesperado",
        description: "No se pudo regenerar la rúbrica",
        variant: "destructive",
      });
    } finally {
      setRegenerationLoading(false);
      setShowRegenerateDialog(false);
    }
  };

  const addCriterion = () => {
    if (rubricaData.criteria.length >= 8) {
      toast({
        title: "Límite alcanzado",
        description: "No se pueden agregar más de 8 criterios",
        variant: "destructive",
      });
      return;
    }

    const newCriterion = {
      criterio: `Criterio ${rubricaData.criteria.length + 1}`,
      descripcion: '',
      descriptores: Object.fromEntries(
        rubricaData.levels.map(level => [level, ''])
      )
    };
    
    setRubricaData(prev => ({
      ...prev,
      criteria: [...prev.criteria, newCriterion]
    }));
  };

  const removeCriterion = (index: number) => {
    setRubricaData(prev => ({
      ...prev,
      criteria: prev.criteria.filter((_, i) => i !== index)
    }));
  };

  const updateCriterion = (index: number, field: string, value: string) => {
    setRubricaData(prev => ({
      ...prev,
      criteria: prev.criteria.map((criterion, i) => 
        i === index 
          ? { ...criterion, [field]: value.trim() }
          : criterion
      )
    }));
  };

  const updateDescriptor = (criterionIndex: number, level: string, value: string) => {
    setRubricaData(prev => ({
      ...prev,
      criteria: prev.criteria.map((criterion, i) => 
        i === criterionIndex 
          ? {
              ...criterion,
              descriptores: { ...criterion.descriptores, [level]: value.trim() }
            }
          : criterion
      )
    }));
  };

  const handleSave = async () => {
    const requestId = crypto.randomUUID();
    console.log('[A7:SAVE]', {
      request_id: requestId,
      criteria_count: rubricaData.criteria.length,
      timestamp: new Date().toISOString()
    });

    try {
      await saveRubrica({
        estructura: rubricaData,
        source_hash: unidadHash?.hash,
        source_snapshot: unidadHash?.snapshot,
        needs_review: false
      });
      
      toast({
        title: "Rúbrica guardada",
        description: "Los cambios se han guardado correctamente",
      });
    } catch (error: any) {
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar los cambios",
        variant: "destructive",
      });
    }
  };

  const handleClose = async () => {
    if (!formValid) {
      toast({
        title: "Error",
        description: "Complete todos los campos de la rúbrica antes de cerrar",
        variant: "destructive",
      });
      return;
    }

    const requestId = crypto.randomUUID();
    console.log('[A7:CLOSE]', {
      request_id: requestId,
      criteria_count: rubricaData.criteria.length,
      timestamp: new Date().toISOString()
    });

    try {
      await saveRubrica({ 
        estructura: rubricaData,
        source_hash: unidadHash?.hash,
        source_snapshot: unidadHash?.snapshot,
        needs_review: false
      });
      
      await closeAccelerator('A7');
      
      toast({
        title: "Acelerador 7 cerrado",
        description: "La rúbrica ha sido finalizada. Ahora puede continuar al Acelerador 8",
      });
    } catch (error: any) {
      toast({
        title: "Error al cerrar",
        description: "No se pudo cerrar el acelerador",
        variant: "destructive",
      });
    }
  };

  const handleReopen = async () => {
    try {
      await saveRubrica({
        estructura: rubricaData,
        estado: 'BORRADOR',
        closed_at: null
      });
      
      toast({
        title: "Acelerador reabierto",
        description: "La rúbrica se ha reabierto para edición.",
      });
      
      setShowReopenDialog(false);
    } catch (error) {
      toast({
        title: "Error al reabrir",
        description: "No se pudo reabrir la rúbrica",
        variant: "destructive",
      });
    }
  };

  // State calculations
  const isClosed = rubrica?.estado === 'CERRADO';
  const needsReview = rubrica?.needs_review === true;
  const canProceedToA8 = progress.a7_completed && isClosed && !needsReview;
  const canAccessA7 = progress.a6_completed;
  const hasRubricas = rubricaData.criteria.length > 0;
  const formValid = rubricaData.criteria.length >= 4 && rubricaData.criteria.length <= 8 && 
    rubricaData.criteria.every(c => 
      c.criterio.trim() && Object.values(c.descriptores).every(d => d.trim())
    );
  const analysisComplete = generationComplete && hasRubricas && formValid;

  // Validation errors
  const validationErrors = [];
  if (rubricaData.criteria.length > 0) {
    if (rubricaData.criteria.length < 4) {
      validationErrors.push(`Faltan ${4 - rubricaData.criteria.length} criterios (mínimo 4)`);
    }
    if (rubricaData.criteria.length > 8) {
      validationErrors.push('Máximo 8 criterios permitidos');
    }
    
    rubricaData.criteria.forEach((criterion, index) => {
      if (!criterion.criterio.trim()) {
        validationErrors.push(`Criterio ${index + 1}: falta nombre`);
      }
      Object.entries(criterion.descriptores).forEach(([level, desc]) => {
        if (!desc.trim()) {
          validationErrors.push(`Criterio ${index + 1}: falta descriptor para ${level}`);
        }
      });
    });
  }

  // Comprehensive A7 Diagnostic
  useEffect(() => {
    const diagnosticData = {
      isClosed,
      formValid,
      analysisComplete,
      hasRubricas,
      canProceedToA8,
      canAccessA7,
      needsReview,
      progress: {
        a6_completed: progress.a6_completed,
        a7_completed: progress.a7_completed,
        a8_completed: progress.a8_completed,
        overall_progress: progress.overall_progress
      },
      unidadEstado: unidad?.estado || 'N/A',
      rubricaEstado: rubrica?.estado || 'N/A',
      criteriaCount: rubricaData.criteria.length,
      levelsCount: rubricaData.levels.length,
      generationLoading,
      regenerationLoading,
      generationComplete,
      autoSaving,
      saving,
      validationErrors: validationErrors.length,
      sourceHash: {
        current: unidadHash?.hash || 'N/A',
        stored: rubrica?.source_hash || 'N/A',
        matches: rubrica?.source_hash === unidadHash?.hash
      },
      buttons: {
        generateRubricVisible: !isClosed && !analysisComplete,
        regenerateVisible: !isClosed && rubrica?.estado !== 'CERRADO',
        saveVisible: !isClosed && hasRubricas,
        saveAndCloseVisible: !isClosed && analysisComplete,
        continueToA8Visible: canProceedToA8,
        editVisible: isClosed,
      }
    };
    
    console.log('[A7:DIAGNOSTIC]', diagnosticData);
  }, [
    isClosed, formValid, analysisComplete, hasRubricas, canProceedToA8, canAccessA7,
    needsReview, progress, unidad?.estado, rubrica?.estado, rubricaData.criteria.length, 
    rubricaData.levels.length, generationLoading, regenerationLoading, generationComplete, 
    autoSaving, saving, validationErrors.length, unidadHash?.hash, rubrica?.source_hash
  ]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando Acelerador 7...</p>
        </div>
      </div>
    );
  }

  if (!canAccessA7) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Acelerador 7 Bloqueado</h3>
            <p className="text-muted-foreground mb-4">
              Debe completar el Acelerador 6 primero para acceder a las rúbricas de evaluación.
            </p>
            <Button onClick={() => navigate('/etapa3/acelerador6')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Ir al Acelerador 6
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/etapa3/acelerador6')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Acelerador 6
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Acelerador 7: Rúbricas de Evaluación</h1>
              <p className="text-muted-foreground">Genera y personaliza rúbricas para evaluar el aprendizaje</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {progress.a7_completed && (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                A7 Completado
              </Badge>
            )}
            {needsReview && (
              <Badge variant="outline" className="border-yellow-300 text-yellow-700 bg-yellow-50">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Pendiente de revisión
              </Badge>
            )}
            {autoSaving && (
              <Badge variant="outline" className="text-blue-600">
                Guardando...
              </Badge>
            )}
          </div>
        </div>

        {/* Needs Review Banner */}
        {needsReview && (
          <Card className="border-yellow-300 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-800">Tu unidad cambió</h3>
                  <p className="text-yellow-700 text-sm">
                    Los datos de la unidad de aprendizaje han sido modificados. 
                    Te sugerimos <strong>regenerar con IA</strong> o ajustar manualmente la rúbrica.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Rúbrica de Evaluación
                  {unidad?.titulo && (
                    <span className="text-base font-normal text-muted-foreground">
                      - {unidad.titulo}
                    </span>
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Criterios: {rubricaData.criteria.length}/8 • 
                  Niveles: {rubricaData.levels.join(', ')}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                {hasRubricas && (
                  <PrintPreviewModal rubrica={rubricaData} unidadTitulo={unidad?.titulo} />
                )}
                
                {/* Generate Rubric Button */}
                {!isClosed && !analysisComplete && (
                  <Button
                    onClick={handleGenerateRubric}
                    disabled={generationLoading || !unidad}
                    className="flex items-center gap-2"
                  >
                    <Bot className="h-4 w-4" />
                    {generationLoading ? 'Generando...' : 'Generar con IA'}
                  </Button>
                )}

                {/* Regenerate Button */}
                {!isClosed && rubrica?.estado !== 'CERRADO' && hasRubricas && (
                  <Button
                    onClick={() => setShowRegenerateDialog(true)}
                    disabled={regenerationLoading || !unidad}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {regenerationLoading ? 'Regenerando...' : 'Regenerar con IA'}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Rubric Editor */}
            {hasRubricas ? (
              <div className="space-y-4">
                {/* Add Criterion Button */}
                <div className="flex items-center justify-between">
                  <Button
                    onClick={addCriterion}
                    disabled={rubricaData.criteria.length >= 8 || isClosed}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Criterio
                  </Button>
                  <Badge variant="outline">
                    {rubricaData.criteria.length}/8 criterios
                  </Badge>
                </div>

                {/* Rubric Table */}
                <div className="border rounded-lg overflow-x-auto">
                  <div className="min-w-full">
                    {/* Sticky Header */}
                    <div className="bg-muted/50 border-b sticky top-0 z-10">
                      <div className="grid grid-cols-4 gap-4 p-4" style={{gridTemplateColumns: '30% 23% 23% 23%'}}>
                        <div className="font-semibold">Criterio</div>
                        {rubricaData.levels.map(level => (
                          <div key={level} className="font-semibold text-center">
                            {level}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Criteria Rows */}
                    <div className="divide-y">
                      {rubricaData.criteria.map((criterion, index) => (
                        <div key={index} className="grid grid-cols-4 gap-4 p-4" style={{gridTemplateColumns: '30% 23% 23% 23%'}}>
                          {/* Criterion Name & Description */}
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <AutosizeTextarea
                                value={criterion.criterio}
                                onChange={(e) => updateCriterion(index, 'criterio', e.target.value)}
                                placeholder="Nombre del criterio"
                                disabled={isClosed}
                                className="font-medium"
                                minRows={1}
                                maxRows={3}
                              />
                              {!isClosed && (
                                <Button
                                  onClick={() => removeCriterion(index)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            <AutosizeTextarea
                              value={criterion.descripcion || ''}
                              onChange={(e) => updateCriterion(index, 'descripcion', e.target.value)}
                              placeholder="Descripción del criterio"
                              disabled={isClosed}
                              className="text-sm text-muted-foreground"
                              minRows={1}
                              maxRows={2}
                            />
                          </div>

                          {/* Level Descriptors */}
                          {rubricaData.levels.map(level => (
                            <div key={level}>
                              <AutosizeTextarea
                                value={criterion.descriptores[level] || ''}
                                onChange={(e) => updateDescriptor(index, level, e.target.value)}
                                placeholder={`Descriptor para ${level}`}
                                disabled={isClosed}
                                className="text-sm"
                                minRows={2}
                                maxRows={6}
                                style={{ overflowWrap: 'anywhere' }}
                              />
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Validation Messages */}
                {validationErrors.length > 0 && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                    <h4 className="font-medium text-destructive mb-2">Errores de validación:</h4>
                    <ul className="text-sm text-destructive space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No hay rúbrica generada</h3>
                <p className="text-muted-foreground mb-4">
                  Usa la IA para generar una rúbrica automáticamente o agrega criterios manualmente.
                </p>
                {!isClosed && (
                  <Button onClick={addCriterion} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Primer Criterio
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate('/inicio')}
          >
            Ir al Inicio
          </Button>

          <div className="flex items-center gap-3">
            {!isClosed && hasRubricas && (
              <Button
                onClick={handleSave}
                disabled={saving || autoSaving}
                variant="outline"
              >
                <Save className="h-4 w-4 mr-2" />
                Guardar
              </Button>
            )}

            {!isClosed && analysisComplete && (
              <Button
                onClick={handleClose}
                disabled={saving}
                className="bg-primary hover:bg-primary/90"
              >
                Guardar y Cerrar A7
              </Button>
            )}

            {isClosed && (
              <Button
                onClick={() => setShowReopenDialog(true)}
                variant="outline"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Editar Rúbrica
              </Button>
            )}

            {canProceedToA8 && (
              <Button
                onClick={() => navigate('/etapa3/acelerador8')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Continuar a A8
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Reopen Dialog */}
      <AlertDialog open={showReopenDialog} onOpenChange={setShowReopenDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Reabrir para edición?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto cambiará el estado de la rúbrica a borrador y podrá editarla nuevamente.
              Deberá cerrarla otra vez antes de continuar al Acelerador 8.
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

      {/* Regenerate Confirmation Dialog */}
      <AlertDialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Regenerar rúbrica con IA?</AlertDialogTitle>
            <AlertDialogDescription>
              Se reemplazará la rúbrica actual (borrador) con una nueva generada según la unidad vigente.
              Esta acción no consume crédito si la unidad no cambió desde la última generación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRegenerateRubric}>
              {regenerationLoading ? 'Regenerando...' : 'Regenerar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}