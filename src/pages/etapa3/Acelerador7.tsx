import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, ArrowRight, Bot, CheckCircle, Save, Lock, Plus, Trash2, Edit3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
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
  const [generationComplete, setGenerationComplete] = useState(false);
  const [showReopenDialog, setShowReopenDialog] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  
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
      await saveRubrica({ estructura: rubricaData });
    } catch (error) {
      console.error('Auto-save failed:', error);
      toast({
        title: "Error en guardado automático",
        description: "No se pudieron guardar los cambios automáticamente",
        variant: "destructive",
      });
    } finally {
      setAutoSaving(false);
    }
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

    console.log('[A7:GEN_REQUEST]', {
      unidad_id: unidad.id,
      titulo: unidad.titulo,
      area: unidad.area_curricular,
      timestamp: new Date().toISOString()
    });

    try {
      setGenerationLoading(true);

      const { data, error } = await supabase.functions.invoke('generate-evaluation-rubric', {
        body: {
          unidad_data: unidad
        }
      });

      console.log('[A7:GEN_RESPONSE]', {
        success: data?.success,
        has_estructura: !!data?.estructura,
        criteria_count: data?.estructura?.criteria?.length || 0,
        error: error?.message || data?.error,
        timestamp: new Date().toISOString()
      });

      if (error) throw error;

      if (data.success && data.estructura) {
        // Validate the structure
        const estructura = data.estructura;
        
        if (!estructura.levels || !estructura.criteria || !Array.isArray(estructura.criteria)) {
          throw new Error('Estructura de rúbrica inválida');
        }

        if (estructura.criteria.length < 4 || estructura.criteria.length > 8) {
          throw new Error(`Número de criterios inválido: ${estructura.criteria.length}. Debe ser entre 4-8.`);
        }

        console.log('[A7:GEN_VALID]', {
          levels_count: estructura.levels.length,
          criteria_count: estructura.criteria.length,
          valid_structure: true,
          timestamp: new Date().toISOString()
        });

        setRubricaData(estructura);
        setGenerationComplete(true);
        
        toast({
          title: "Rúbrica generada",
          description: `Se ha generado una rúbrica con ${estructura.criteria.length} criterios de evaluación`,
        });
      } else {
        throw new Error(data.error || 'Error en la generación');
      }

    } catch (error: any) {
      console.error('[A7:GEN_ERROR]', {
        error_message: error.message,
        error_type: error.name || 'UnknownError',
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: "Error en la generación",
        description: error.message || "No se pudo generar la rúbrica. Puede crear una manualmente.",
        variant: "destructive",
      });
    } finally {
      setGenerationLoading(false);
    }
  };

  const addLevel = () => {
    const newLevel = `Nivel ${rubricaData.levels.length + 1}`;
    setRubricaData(prev => ({
      ...prev,
      levels: [...prev.levels, newLevel]
    }));
  };

  const removeLevel = (index: number) => {
    if (rubricaData.levels.length <= 2) {
      toast({
        title: "Error",
        description: "Debe mantener al menos 2 niveles en la rúbrica",
        variant: "destructive",
      });
      return;
    }

    const levelToRemove = rubricaData.levels[index];
    setRubricaData(prev => ({
      levels: prev.levels.filter((_, i) => i !== index),
      criteria: prev.criteria.map(criterion => ({
        ...criterion,
        descriptores: Object.fromEntries(
          Object.entries(criterion.descriptores).filter(([key]) => key !== levelToRemove)
        )
      }))
    }));
  };

  const updateLevel = (index: number, newName: string) => {
    const oldName = rubricaData.levels[index];
    setRubricaData(prev => ({
      levels: prev.levels.map((level, i) => i === index ? newName : level),
      criteria: prev.criteria.map(criterion => ({
        ...criterion,
        descriptores: Object.fromEntries(
          Object.entries(criterion.descriptores).map(([key, value]) => 
            key === oldName ? [newName, value] : [key, value]
          )
        )
      }))
    }));
  };

  const addCriterion = () => {
    const newCriterion = {
      criterio: `Criterio ${rubricaData.criteria.length + 1}`,
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
          ? { ...criterion, [field]: value }
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
              descriptores: { ...criterion.descriptores, [level]: value }
            }
          : criterion
      )
    }));
  };

  const handleSave = async () => {
    if (rubricaData.criteria.length === 0) {
      toast({
        title: "Error",
        description: "Debe agregar al menos un criterio de evaluación",
        variant: "destructive",
      });
      return;
    }

    console.log('[A7:SAVE]', {
      criteria_count: rubricaData.criteria.length,
      levels_count: rubricaData.levels.length,
      is_closed: false,
      timestamp: new Date().toISOString()
    });

    try {
      await saveRubrica({ estructura: rubricaData });
      
      toast({
        title: "Rúbrica guardada",
        description: "Los cambios se han guardado correctamente",
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar los cambios",
        variant: "destructive",
      });
    }
  };

  const handleClose = async () => {
    if (rubricaData.criteria.length === 0) {
      toast({
        title: "Error",
        description: "Debe agregar al menos un criterio antes de cerrar",
        variant: "destructive",
      });
      return;
    }

    if (!formValid) {
      toast({
        title: "Error",
        description: "Complete todos los campos de la rúbrica antes de cerrar",
        variant: "destructive",
      });
      return;
    }

    console.log('[A7:CLOSE]', {
      criteria_count: rubricaData.criteria.length,
      form_valid: formValid,
      analysis_complete: analysisComplete,
      timestamp: new Date().toISOString()
    });

    try {
      // First save the current data
      await saveRubrica({ estructura: rubricaData });
      
      // Then close the accelerator
      await closeAccelerator('A7');
      
      toast({
        title: "Acelerador 7 cerrado",
        description: "La rúbrica ha sido finalizada. Ahora puede continuar al Acelerador 8",
      });
    } catch (error) {
      console.error('Close error:', error);
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
      console.error('Reopen error:', error);
      toast({
        title: "Error al reabrir",
        description: "No se pudo reabrir la rúbrica",
        variant: "destructive",
      });
    }
  };

  // State calculations
  const isClosed = rubrica?.estado === 'CERRADO';
  const canProceedToA8 = progress.a7_completed && isClosed;
  const canAccessA7 = progress.a6_completed;
  const hasRubricas = rubricaData.criteria.length > 0;
  const formValid = rubricaData.criteria.length > 0 && rubricaData.criteria.every(c => 
    c.criterio.trim() && Object.values(c.descriptores).every(d => d.trim())
  );
  const analysisComplete = generationComplete && hasRubricas;

  // Comprehensive A7 Diagnostic
  useEffect(() => {
    const diagnosticData = {
      // Core state variables
      isClosed,
      formValid,
      analysisComplete,
      hasRubricas,
      canProceedToA8,
      canAccessA7,
      
      // Progress flags
      progress: {
        a6_completed: progress.a6_completed,
        a7_completed: progress.a7_completed,
        a8_completed: progress.a8_completed,
        overall_progress: progress.overall_progress
      },
      
      // Unit state
      unidadEstado: unidad?.estado || 'N/A',
      
      // Rubrica details
      rubricaEstado: rubrica?.estado || 'N/A',
      criteriaCount: rubricaData.criteria.length,
      levelsCount: rubricaData.levels.length,
      
      // Generation state
      generationLoading,
      generationComplete,
      autoSaving,
      saving,
      
      // Button visibility
      buttons: {
        generateRubricVisible: !isClosed && !analysisComplete,
        saveVisible: !isClosed && hasRubricas,
        saveAndCloseVisible: !isClosed && analysisComplete && formValid,
        continueToA8Visible: canProceedToA8,
        editVisible: isClosed,
        reopenDialogOpen: showReopenDialog
      }
    };
    
    console.log('[A7:DIAGNOSTIC]', diagnosticData);
  }, [
    isClosed, formValid, analysisComplete, hasRubricas, canProceedToA8, canAccessA7,
    progress, unidad?.estado, rubrica?.estado, rubricaData.criteria.length, 
    rubricaData.levels.length, generationLoading, generationComplete, autoSaving, 
    saving, showReopenDialog
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
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Acceso Restringido</h2>
          <p className="text-muted-foreground mb-6">
            Debe completar el Acelerador 6 antes de acceder al Acelerador 7
          </p>
          <Button onClick={() => navigate('/etapa3/acelerador6')}>
            Ir al Acelerador 6
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
              <h1 className="text-2xl font-bold text-foreground">Acelerador 7</h1>
              <p className="text-muted-foreground">Rúbrica de Evaluación</p>
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

        {/* Unit Context */}
        {unidad && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Contexto de la Unidad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Título:</span> {unidad.titulo}
                </div>
                <div>
                  <span className="font-medium">Área:</span> {unidad.area_curricular}
                </div>
                <div>
                  <span className="font-medium">Grado:</span> {unidad.grado}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generation Section */}
        {!isClosed && !analysisComplete && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  Genere una rúbrica de evaluación basada en su unidad de aprendizaje
                </p>
                <Button 
                  onClick={handleGenerateRubric}
                  disabled={generationLoading || !unidad}
                  size="lg"
                >
                  {generationLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generando rúbrica...
                    </>
                  ) : (
                    <>
                      <Bot className="h-4 w-4 mr-2" />
                      Generar Rúbrica con IA
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rubric Editor */}
        {(generationComplete || rubricaData.criteria.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Editor de Rúbrica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Levels Management */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-base font-medium">Niveles de Desempeño</Label>
                  {!isClosed && (
                    <Button variant="outline" size="sm" onClick={addLevel}>
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar Nivel
                    </Button>
                  )}
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  {rubricaData.levels.map((level, index) => (
                    <div key={index} className="flex items-center gap-1 bg-muted p-2 rounded">
                      <Input
                        value={level}
                        onChange={(e) => updateLevel(index, e.target.value)}
                        className="w-24 h-8"
                        disabled={isClosed}
                      />
                      {rubricaData.levels.length > 2 && !isClosed && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeLevel(index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Criteria Table */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-base font-medium">Criterios de Evaluación</Label>
                  {!isClosed && (
                    <Button variant="outline" size="sm" onClick={addCriterion}>
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar Criterio
                    </Button>
                  )}
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-64">Criterio</TableHead>
                        {rubricaData.levels.map(level => (
                          <TableHead key={level} className="min-w-48">{level}</TableHead>
                        ))}
                        {!isClosed && <TableHead className="w-12"></TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rubricaData.criteria.map((criterion, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Input
                              value={criterion.criterio}
                              onChange={(e) => updateCriterion(index, 'criterio', e.target.value)}
                              placeholder="Nombre del criterio"
                              disabled={isClosed}
                            />
                          </TableCell>
                          {rubricaData.levels.map(level => (
                            <TableCell key={level}>
                              <Input
                                value={criterion.descriptores[level] || ''}
                                onChange={(e) => updateDescriptor(index, level, e.target.value)}
                                placeholder={`Descriptor para ${level}`}
                                disabled={isClosed}
                              />
                            </TableCell>
                          ))}
                          {!isClosed && (
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => removeCriterion(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {rubricaData.criteria.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay criterios definidos. Use el botón "Generar Rúbrica con IA" o "Agregar Criterio" para comenzar.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={() => navigate('/etapa3')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>

          <div className="flex gap-3">
            {!isClosed && analysisComplete && formValid && (
              <Button 
                onClick={handleClose}
                disabled={saving}
                variant="default"
              >
                Guardar y Cerrar A7
              </Button>
            )}
            
            {canProceedToA8 && (
              <Button onClick={() => navigate('/etapa3/acelerador8')}>
                Continuar a A8
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Reopen Confirmation Dialog */}
      <AlertDialog open={showReopenDialog} onOpenChange={setShowReopenDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Reabrir Acelerador 7?</AlertDialogTitle>
            <AlertDialogDescription>
              Al reabrir esta rúbrica de evaluación podrá editarla nuevamente.
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