import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FileText, CheckCircle, Upload, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface InsumosStepProps {
  sessionId: string;
  onNext: () => void;
  onPrev: () => void;
  sessionData: any;
  onUpdateSessionData: (data: any) => void;
}

interface ValidationResult {
  isValid: boolean;
  message: string;
  details?: string;
}

export const InsumosStep: React.FC<InsumosStepProps> = ({
  sessionId,
  onNext,
  onPrev,
  sessionData,
  onUpdateSessionData,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('a4-report');
  const [loading, setLoading] = useState(false);
  const [validations, setValidations] = useState<{
    a4Report: ValidationResult;
    competencies: ValidationResult;
    pci: ValidationResult;
  }>({
    a4Report: { isValid: false, message: 'Pendiente' },
    competencies: { isValid: false, message: 'Pendiente' },
    pci: { isValid: false, message: 'Pendiente' }
  });

  // Estados para cada sección
  const [a4File, setA4File] = useState<File | null>(null);
  const [selectedCompetencies, setSelectedCompetencies] = useState<any[]>([]);
  const [pciFile, setPciFile] = useState<File | null>(null);
  const [competencyOptions, setCompetencyOptions] = useState<any[]>([]);
  const [contextQuestions, setContextQuestions] = useState<any[]>([]);

  useEffect(() => {
    // Cargar datos existentes de la sesión
    if (sessionData?.phase_data?.insumos) {
      const { a4_file, selected_competencies, pci_file, context_responses } = sessionData.phase_data.insumos;
      
      if (a4_file) {
        setValidations(prev => ({ ...prev, a4Report: { isValid: true, message: 'Válido' } }));
      }
      if (selected_competencies?.length > 0) {
        setSelectedCompetencies(selected_competencies);
        setValidations(prev => ({ ...prev, competencies: { isValid: true, message: 'Competencias seleccionadas' } }));
      }
      if (pci_file) {
        setValidations(prev => ({ ...prev, pci: { isValid: true, message: 'PCI cargado y procesado' } }));
      }
    }
  }, [sessionData]);

  const handleA4Upload = async (file: File) => {
    if (!file.type.includes('pdf')) {
      toast({
        title: "Error",
        description: "Solo se permiten archivos PDF",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Subir archivo a Supabase Storage
      const fileExt = 'pdf';
      const fileName = `${user?.id}/acelerador4-report-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('user_uploads')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Guardar metadatos en base de datos
      const { error: dbError } = await supabase
        .from('files')
        .insert({
          user_id: user?.id,
          url: fileName,
          file_type: 'application/pdf',
          size_bytes: file.size,
        });

      if (dbError) throw dbError;

      // Validar contenido del A4
      await validateA4Content(fileName);
      
      // Actualizar datos de sesión
      const updatedSessionData = {
        ...sessionData,
        phase_data: {
          ...sessionData.phase_data,
          insumos: {
            ...sessionData.phase_data?.insumos,
            a4_file: {
              name: file.name,
              url: fileName,
              size: file.size,
              uploaded_at: new Date().toISOString()
            }
          }
        }
      };
      
      onUpdateSessionData(updatedSessionData);
      setA4File(file);
      
      toast({
        title: "Éxito",
        description: "Informe A4 cargado correctamente",
      });

      // Auto-avanzar a la siguiente pestaña
      setActiveTab('competencies');
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateA4Content = async (fileName: string) => {
    try {
      // Llamar a función para validar que el A4 contenga estrategias válidas
      const { data, error } = await supabase.functions.invoke('get-accelerator3-results', {
        body: { file_path: fileName }
      });

      if (error) throw error;

      if (data?.strategies?.length > 0) {
        setValidations(prev => ({ 
          ...prev, 
          a4Report: { 
            isValid: true, 
            message: `Válido - ${data.strategies.length} estrategias encontradas`,
            details: data.strategies.map((s: any) => s.strategy).join(', ')
          } 
        }));
        
        // Cargar competencias basadas en las estrategias encontradas
        await loadCompetencyOptions(data.strategies);
      } else {
        setValidations(prev => ({ 
          ...prev, 
          a4Report: { 
            isValid: false, 
            message: 'No se encontraron estrategias válidas en el documento' 
          } 
        }));
      }
    } catch (error) {
      setValidations(prev => ({ 
        ...prev, 
        a4Report: { 
          isValid: false, 
          message: 'Error al validar el documento' 
        } 
      }));
    }
  };

  const loadCompetencyOptions = async (strategies: any[]) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-profundization-questions', {
        body: {
          session_id: sessionId,
          template_id: 'plantilla11_competencias_cneb',
          session_data: { selected_strategies: strategies }
        }
      });

      if (error) throw error;

      if (data?.competencias) {
        setCompetencyOptions(data.competencias);
      }
    } catch (error) {
      console.error('Error loading competency options:', error);
    }
  };

  const handleCompetencySelection = (competency: any) => {
    const isSelected = selectedCompetencies.some(c => c.codigo === competency.codigo);
    let newSelection;
    
    if (isSelected) {
      newSelection = selectedCompetencies.filter(c => c.codigo !== competency.codigo);
    } else {
      newSelection = [...selectedCompetencies, competency];
    }
    
    setSelectedCompetencies(newSelection);
    
    // Actualizar datos de sesión
    const updatedSessionData = {
      ...sessionData,
      phase_data: {
        ...sessionData.phase_data,
        insumos: {
          ...sessionData.phase_data?.insumos,
          selected_competencies: newSelection
        }
      }
    };
    
    onUpdateSessionData(updatedSessionData);
    
    if (newSelection.length > 0) {
      setValidations(prev => ({ 
        ...prev, 
        competencies: { 
          isValid: true, 
          message: `${newSelection.length} competencia(s) seleccionada(s)` 
        } 
      }));
    } else {
      setValidations(prev => ({ 
        ...prev, 
        competencies: { 
          isValid: false, 
          message: 'Selecciona al menos una competencia' 
        } 
      }));
    }
  };

  const handlePCIUpload = async (file: File) => {
    if (!file.type.includes('pdf')) {
      toast({
        title: "Error",
        description: "Solo se permiten archivos PDF",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Subir PCI
      const fileExt = 'pdf';
      const fileName = `${user?.id}/pci-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('user_uploads')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Generar preguntas de contexto basadas en PCI + A4 + competencias
      await generateContextQuestions(fileName);
      
      setPciFile(file);
      
      toast({
        title: "Éxito",
        description: "PCI cargado y procesado correctamente",
      });
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateContextQuestions = async (pciFileName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-profundization-questions', {
        body: {
          session_id: sessionId,
          template_id: 'plantilla8_profundizacion_contexto',
          session_data: {
            ...sessionData,
            pci_file: pciFileName
          }
        }
      });

      if (error) throw error;

      if (data?.preguntas) {
        setContextQuestions(data.preguntas);
        
        // Actualizar datos de sesión
        const updatedSessionData = {
          ...sessionData,
          phase_data: {
            ...sessionData.phase_data,
            insumos: {
              ...sessionData.phase_data?.insumos,
              pci_file: {
                name: pciFile?.name,
                url: pciFileName,
                uploaded_at: new Date().toISOString()
              },
              context_questions: data.preguntas
            }
          }
        };
        
        onUpdateSessionData(updatedSessionData);
        
        setValidations(prev => ({ 
          ...prev, 
          pci: { 
            isValid: true, 
            message: `PCI procesado - ${data.preguntas.length} preguntas generadas` 
          } 
        }));
      }
    } catch (error) {
      console.error('Error generating context questions:', error);
      setValidations(prev => ({ 
        ...prev, 
        pci: { 
          isValid: false, 
          message: 'Error al procesar el PCI' 
        } 
      }));
    }
  };

  const getOverallProgress = () => {
    const validCount = Object.values(validations).filter(v => v.isValid).length;
    return (validCount / 3) * 100;
  };

  const isPhaseComplete = () => {
    return Object.values(validations).every(v => v.isValid);
  };

  return (
    <div className="space-y-6">
      {/* Header con progreso */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Fase 1: Preparación de Insumos
          </CardTitle>
          <CardDescription>
            Carga y valida los documentos necesarios para diseñar tu unidad didáctica
          </CardDescription>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progreso general</span>
              <span>{Math.round(getOverallProgress())}%</span>
            </div>
            <Progress value={getOverallProgress()} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      {/* Validaciones rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(validations).map(([key, validation]) => (
          <Card key={key} className={`border-l-4 ${validation.isValid ? 'border-l-green-500' : 'border-l-amber-500'}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                {validation.isValid ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                )}
                <span className="text-sm font-medium">
                  {key === 'a4Report' ? 'Informe A4' : 
                   key === 'competencies' ? 'Competencias' : 'PCI'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {validation.message}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Contenido principal con tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="a4-report" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Informe A4
          </TabsTrigger>
          <TabsTrigger value="competencies" disabled={!validations.a4Report.isValid}>
            <CheckCircle className="h-4 w-4" />
            Competencias CNEB
          </TabsTrigger>
          <TabsTrigger value="pci" disabled={!validations.competencies.isValid}>
            <Upload className="h-4 w-4" />
            PCI + Contexto
          </TabsTrigger>
        </TabsList>

        <TabsContent value="a4-report" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informe de Priorización (Acelerador 4)</CardTitle>
              <CardDescription>
                Carga el informe generado en el Acelerador 4 con las estrategias pedagógicas priorizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!a4File ? (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <FileText className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Arrastra y suelta tu archivo PDF aquí, o haz clic para seleccionar
                  </p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => e.target.files?.[0] && handleA4Upload(e.target.files[0])}
                    className="hidden"
                    id="a4-upload"
                  />
                  <label htmlFor="a4-upload">
                    <Button variant="outline" className="cursor-pointer" disabled={loading}>
                      {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Seleccionar archivo PDF
                    </Button>
                  </label>
                </div>
              ) : (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">{a4File.name}</span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    {validations.a4Report.message}
                  </p>
                  {validations.a4Report.details && (
                    <p className="text-xs text-green-600 mt-2">
                      Estrategias: {validations.a4Report.details}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competencies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Selección de Competencias CNEB</CardTitle>
              <CardDescription>
                Selecciona las competencias del Currículo Nacional que se alinean con tus estrategias
              </CardDescription>
            </CardHeader>
            <CardContent>
              {competencyOptions.length > 0 ? (
                <div className="space-y-4">
                  {competencyOptions.map((competency) => (
                    <Card 
                      key={competency.codigo}
                      className={`cursor-pointer transition-colors ${
                        selectedCompetencies.some(c => c.codigo === competency.codigo)
                          ? 'bg-primary/5 border-primary'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleCompetencySelection(competency)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            <Badge variant={
                              selectedCompetencies.some(c => c.codigo === competency.codigo)
                                ? 'default'
                                : 'secondary'
                            }>
                              {competency.codigo}
                            </Badge>
                          </div>
                          <div className="flex-grow">
                            <h4 className="font-medium mb-2">{competency.enunciado}</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              {competency.relevancia}
                            </p>
                            {competency.capacidades && (
                              <div className="flex flex-wrap gap-1">
                                {competency.capacidades.map((capacidad: string, idx: number) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {capacidad}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
                  <p className="text-muted-foreground">Cargando competencias basadas en tus estrategias...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pci" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Proyecto Curricular Institucional (PCI)</CardTitle>
              <CardDescription>
                Carga tu PCI para contextualizar las estrategias con la realidad de tu institución
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!pciFile ? (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Carga el PCI de tu institución educativa
                  </p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => e.target.files?.[0] && handlePCIUpload(e.target.files[0])}
                    className="hidden"
                    id="pci-upload"
                  />
                  <label htmlFor="pci-upload">
                    <Button variant="outline" className="cursor-pointer" disabled={loading}>
                      {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Seleccionar PCI (PDF)
                    </Button>
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-800">{pciFile.name}</span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      {validations.pci.message}
                    </p>
                  </div>

                  {contextQuestions.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Preguntas de Contextualización</CardTitle>
                        <CardDescription>
                          Responde estas preguntas para personalizar tu unidad didáctica
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {contextQuestions.map((question, index) => (
                            <div key={question.id || index} className="space-y-2">
                              <label className="text-sm font-medium">
                                {index + 1}. {question.pregunta}
                              </label>
                              <textarea
                                className="w-full p-3 border rounded-md min-h-[80px] text-sm"
                                placeholder="Escribe tu respuesta aquí..."
                                onChange={(e) => {
                                  // Actualizar respuestas en tiempo real
                                  const updatedQuestions = [...contextQuestions];
                                  updatedQuestions[index] = {
                                    ...updatedQuestions[index],
                                    respuesta: e.target.value
                                  };
                                  setContextQuestions(updatedQuestions);
                                  
                                  // Guardar en sesión
                                  const updatedSessionData = {
                                    ...sessionData,
                                    phase_data: {
                                      ...sessionData.phase_data,
                                      insumos: {
                                        ...sessionData.phase_data?.insumos,
                                        context_responses: updatedQuestions
                                      }
                                    }
                                  };
                                  onUpdateSessionData(updatedSessionData);
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Navegación */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev}>
          Anterior
        </Button>
        <Button 
          onClick={onNext} 
          disabled={!isPhaseComplete()}
          className="flex items-center gap-2"
        >
          {isPhaseComplete() ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Continuar a Diseño de Preguntas
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4" />
              Completa todos los insumos
            </>
          )}
        </Button>
      </div>
    </div>
  );
};