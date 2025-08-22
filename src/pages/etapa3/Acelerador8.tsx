import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, Bot, CheckCircle, Save, Lock, Plus, Trash2, Edit3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { supabase } from '@/integrations/supabase/client';
import { useEtapa3V2, SesionClase } from '@/hooks/useEtapa3V2';

export default function Acelerador8() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { unidad, sesiones, loading, saving, saveSesiones, closeAccelerator, progress } = useEtapa3V2();
  
  const [sesionesData, setSesionesData] = useState<SesionClase[]>([]);
  const [generationLoading, setGenerationLoading] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [showReopenDialog, setShowReopenDialog] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  
  // Debounced sesiones data for auto-save
  const debouncedSesionesData = useDebounce(sesionesData, 3000);

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

  // Silent auto-save functionality with debounce
  useEffect(() => {
    if (debouncedSesionesData.length > 0 && !saving && !autoSaving && generationComplete && sesiones.length > 0) {
      handleAutoSave();
    }
  }, [debouncedSesionesData, saving, autoSaving, generationComplete, sesiones]);

  const handleAutoSave = async () => {
    try {
      setAutoSaving(true);
      await saveSesiones(sesionesData);
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

  const handleGenerateSessions = async () => {
    if (!unidad) {
      toast({
        title: "Error",
        description: "Debe completar los aceleradores anteriores primero",
        variant: "destructive",
      });
      return;
    }

    try {
      setGenerationLoading(true);

      const { data, error } = await supabase.functions.invoke('generate-session-structure', {
        body: {
          unidad_data: unidad
        }
      });

      if (error) throw error;

      if (data.success && data.sessions) {
        const generatedSessions = data.sessions.map((session: any, index: number) => ({
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
          estado: 'BORRADOR' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        setSesionesData(generatedSessions);
        setGenerationComplete(true);
        
        toast({
          title: "Sesiones generadas",
          description: "Las sesiones se han generado exitosamente",
        });
      } else {
        throw new Error(data.error || 'Error en la generación');
      }

    } catch (error: any) {
      console.error('Generation error:', error);
      toast({
        title: "Error en la generación",
        description: "No se pudo generar las sesiones. Puede editarlas manualmente.",
        variant: "destructive",
      });
    } finally {
      setGenerationLoading(false);
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

    await handleSave();
    await closeAccelerator('A8');
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

  const areSessionsClosed = sesiones.length > 0 && sesiones.every(s => s.estado === 'CERRADO');
  const canAccessA8 = progress.a7_completed;

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
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  Genere sugerencias de sesiones basadas en su unidad de aprendizaje
                </p>
                <Button 
                  onClick={handleGenerateSessions}
                  disabled={generationLoading || !unidad}
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
            </CardContent>
          </Card>
        )}

        {/* Sessions Editor */}
        {sesionesData.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-semibold">Editor de Sesiones</h2>
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
      </div>
    </div>
  );
}