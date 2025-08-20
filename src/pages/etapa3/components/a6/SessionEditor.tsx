import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TimboxBlock {
  timebox_min: number;
  steps: string[];
  apoya_estrategia: boolean;
}

interface SessionData {
  id: string;
  session_index: number;
  titulo: string;
  proposito: string;
  inicio: TimboxBlock | string; // Support both new and legacy formats
  desarrollo: TimboxBlock | string;
  cierre: TimboxBlock | string;
  evidencias: string[];
  recursos: string[];
  duracion_min: number;
  competencias_ids: string[];
  capacidades: string[];
  rubricas_ids: string[];
  estado: string;
  incompleta?: boolean;
  feature_flags?: {
    a6_json_blocks_v1?: boolean;
  };
  rubrics_count: number;
  has_all_rubrics: boolean;
  acelerador_session_id?: string;
}

interface RubricData {
  id: string;
  tipo: string;
  estructura_json: any;
  html_nombre: string;
  html_contenido: string;
}

export default function SessionEditor() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [session, setSession] = useState<SessionData | null>(null);
  const [rubrics, setRubrics] = useState<RubricData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingRubrics, setGeneratingRubrics] = useState(false);
  const [activeTab, setActiveTab] = useState("sesion");
  const [acceleratorSessionId, setAcceleratorSessionId] = useState<string | null>(null);

  useEffect(() => {
    loadSessionData();
  }, [sessionId]);

  // Helper function to safely parse JSON block data
  const parseBlockData = (jsonData: any, textData: any, fallback: string): TimboxBlock | string => {
    // If we have JSON data and it looks like a timebox block
    if (jsonData && typeof jsonData === 'object' && 
        typeof jsonData.timebox_min === 'number' && 
        Array.isArray(jsonData.steps)) {
      return {
        timebox_min: jsonData.timebox_min,
        steps: jsonData.steps.filter((step: any) => typeof step === 'string'),
        apoya_estrategia: Boolean(jsonData.apoya_estrategia)
      };
    }
    
    // Fallback to text data or default
    return (typeof textData === 'string' ? textData : fallback);
  };

  const loadSessionData = async () => {
    try {
      setLoading(true);
      
      // Load session data with new fields
      const { data: sessionData, error: sessionError } = await supabase
        .from('sesiones_clase')
        .select('*, inicio_json, desarrollo_json, cierre_json, incompleta, feature_flags, rubricas_ids, apoya_estrategia')
        .eq('id', sessionId)
        .single();

      if (sessionError) {
        toast({
          title: "Error",
          description: "No se pudo cargar la sesión",
          variant: "destructive",
        });
        return;
      }

      // Find the accelerator session separately
      const { data: acceleratorData } = await supabase
        .from('acelerador_sessions')
        .select('id')
        .eq('user_id', sessionData.user_id)
        .eq('acelerador_number', 6)
        .single();

      if (acceleratorData) {
        setAcceleratorSessionId(acceleratorData.id);
      }

      setSession({
        ...sessionData,
        // Handle both legacy and new formats with proper parsing
        inicio: parseBlockData(sessionData.inicio_json, sessionData.inicio, 'Actividad de inicio por definir'),
        desarrollo: parseBlockData(sessionData.desarrollo_json, sessionData.desarrollo, 'Actividad de desarrollo por definir'),
        cierre: parseBlockData(sessionData.cierre_json, sessionData.cierre, 'Actividad de cierre por definir'),
        evidencias: Array.isArray(sessionData.evidencias) ? (sessionData.evidencias as string[]) : [],
        recursos: Array.isArray(sessionData.recursos) ? (sessionData.recursos as string[]) : [],
        competencias_ids: Array.isArray(sessionData.competencias_ids) ? (sessionData.competencias_ids as string[]) : [],
        capacidades: Array.isArray(sessionData.capacidades) ? (sessionData.capacidades as string[]) : [],
        rubricas_ids: Array.isArray(sessionData.rubricas_ids) ? (sessionData.rubricas_ids as string[]) : [],
        rubrics_count: 0,
        has_all_rubrics: false,
        incompleta: sessionData.incompleta || false,
        feature_flags: (sessionData.feature_flags && typeof sessionData.feature_flags === 'object') 
          ? sessionData.feature_flags as { a6_json_blocks_v1?: boolean } 
          : {}
      });

      // Load rubrics
      const { data: rubricsData } = await supabase
        .from('instrumentos_evaluacion')
        .select('*')
        .eq('sesion_id', sessionId);

      setRubrics(rubricsData || []);

    } catch (error) {
      console.error('Error loading session:', error);
      toast({
        title: "Error",
        description: "Error al cargar los datos de la sesión",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSession = async () => {
    if (!session) return;

    try {
      setSaving(true);
      
      // Helper to convert TimboxBlock to JSON-compatible object
      const toJsonBlock = (block: TimboxBlock | string) => {
        if (typeof block === 'object') {
          return {
            timebox_min: block.timebox_min,
            steps: block.steps,
            apoya_estrategia: block.apoya_estrategia
          } as any; // Cast to any to satisfy Json type
        }
        return null;
      };
      
      const { error } = await supabase
        .from('sesiones_clase')
        .update({
          titulo: session.titulo,
          proposito: session.proposito,
          inicio: typeof session.inicio === 'object' ? JSON.stringify(session.inicio) : session.inicio,
          desarrollo: typeof session.desarrollo === 'object' ? JSON.stringify(session.desarrollo) : session.desarrollo,
          cierre: typeof session.cierre === 'object' ? JSON.stringify(session.cierre) : session.cierre,
          inicio_json: toJsonBlock(session.inicio),
          desarrollo_json: toJsonBlock(session.desarrollo),
          cierre_json: toJsonBlock(session.cierre),
          evidencias: session.evidencias,
          recursos: session.recursos,
          duracion_min: session.duracion_min,
          competencias_ids: session.competencias_ids,
          capacidades: session.capacidades,
          rubricas_ids: session.rubricas_ids || [],
          incompleta: session.incompleta || false,
          feature_flags: session.feature_flags || { a6_json_blocks_v1: typeof session.inicio === 'object' },
          estado: 'EN_EDICION'
        })
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Sesión guardada correctamente",
      });

    } catch (error) {
      console.error('Error saving session:', error);
      toast({
        title: "Error",
        description: "Error al guardar la sesión",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const generateRubrics = async () => {
    if (!session) return;

    try {
      setGeneratingRubrics(true);
      
      const response = await supabase.functions.invoke('generate-rubricas-sesion', {
        body: {
          sesion_id: sessionId,
          session_index: session.session_index,
          area: "Comunicación", // Could be dynamic
          grado: "3ro", // Could be dynamic
          competencias_ids: session.competencias_ids,
          capacidades: session.capacidades
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: "Éxito",
        description: "Rúbricas generadas correctamente",
      });

      // Reload session and rubrics
      loadSessionData();
      setActiveTab("rubricas");

    } catch (error) {
      console.error('Error generating rubrics:', error);
      toast({
        title: "Error",
        description: "Error al generar las rúbricas",
        variant: "destructive",
      });
    } finally {
      setGeneratingRubrics(false);
    }
  };

  const validateSession = () => {
    if (!session) return {
      isValid: false,
      missingFields: [],
      hasCompetencias: false,
      hasAllRubrics: false,
      isJsonStructure: false
    };
    
    const requiredFields = ['titulo', 'proposito'];
    const missingFields: string[] = [];
    
    // Check basic required fields
    requiredFields.forEach(field => {
      if (!session[field as keyof SessionData]) {
        missingFields.push(field);
      }
    });
    
    // Check activity blocks
    const isJsonStructure = typeof session.inicio === 'object' && 'timebox_min' in session.inicio;
    
    if (isJsonStructure) {
      // Validate JSON structure
      const inicio = session.inicio as any;
      const desarrollo = session.desarrollo as any;
      const cierre = session.cierre as any;
      
      if (!inicio.steps || inicio.steps.length === 0) missingFields.push('inicio steps');
      if (!desarrollo.steps || desarrollo.steps.length === 0) missingFields.push('desarrollo steps');
      if (!cierre.steps || cierre.steps.length === 0) missingFields.push('cierre steps');
      
      // Check timebox sum
      const totalTimeboxes = (inicio.timebox_min || 0) + (desarrollo.timebox_min || 0) + (cierre.timebox_min || 0);
      if (Math.abs(totalTimeboxes - session.duracion_min) > 5) {
        missingFields.push('timebox balance');
      }
    } else {
      // Validate legacy text structure
      if (!session.inicio) missingFields.push('inicio');
      if (!session.desarrollo) missingFields.push('desarrollo');
      if (!session.cierre) missingFields.push('cierre');
    }
    
    return {
      isValid: missingFields.length === 0 && session.competencias_ids.length > 0 && rubrics.length >= 3,
      missingFields,
      hasCompetencias: session.competencias_ids.length > 0,
      hasAllRubrics: rubrics.length >= 3,
      isJsonStructure
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <Alert>
        <AlertDescription>
          No se encontró la sesión especificada
        </AlertDescription>
      </Alert>
    );
  }

  const validation = validateSession();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => {
            if (acceleratorSessionId) {
              navigate(`/etapa3/acelerador6/${acceleratorSessionId}`);
            } else {
              navigate('/etapa3');
            }
          }}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              Editar Sesión {session.session_index}: {session.titulo}
            </h1>
            <p className="text-muted-foreground">
              Estado: <Badge variant="secondary">{session.estado}</Badge>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={saveSession} disabled={saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Guardar
          </Button>
        </div>
      </div>

      {/* Validation Status */}
      <Alert variant={validation.isValid ? "default" : "destructive"}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {validation.isValid ? (
            <span className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
              Sesión completa y lista para exportar
            </span>
          ) : (
            <div>
              <p>Faltan elementos para completar la sesión:</p>
              <ul className="list-disc pl-6 mt-2">
                {validation.missingFields.map(field => (
                  <li key={field}>Campo obligatorio: {field}</li>
                ))}
                {!validation.hasCompetencias && <li>Debe tener al menos una competencia</li>}
                {!validation.hasAllRubrics && <li>Debe tener las 3 rúbricas generadas</li>}
              </ul>
            </div>
          )}
        </AlertDescription>
      </Alert>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="sesion">Diseño de Sesión</TabsTrigger>
          <TabsTrigger value="rubricas">
            Rúbricas ({rubrics.length}/3)
          </TabsTrigger>
        </TabsList>

        {/* Session Design Tab */}
        <TabsContent value="sesion" className="space-y-6">
          <div className="grid gap-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Información Básica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Título de la Sesión</label>
                  <Input
                    value={session.titulo}
                    onChange={(e) => setSession({ ...session, titulo: e.target.value })}
                    placeholder="Ingrese el título de la sesión"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Propósito</label>
                  <Textarea
                    value={session.proposito}
                    onChange={(e) => setSession({ ...session, proposito: e.target.value })}
                    placeholder="Ingrese el propósito de la sesión"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Duración (minutos)</label>
                    <Input
                      type="number"
                      value={session.duracion_min}
                      onChange={(e) => setSession({ ...session, duracion_min: parseInt(e.target.value) || 45 })}
                      min={15}
                      max={180}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Competencias</label>
                    <Input
                      value={session.competencias_ids.join(', ')}
                      onChange={(e) => setSession({ 
                        ...session, 
                        competencias_ids: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      })}
                      placeholder="Lista de competencias separadas por comas"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activities with timebox support */}
            {[
              { key: 'inicio', title: 'Inicio', description: 'Actividades de motivación y saberes previos' },
              { key: 'desarrollo', title: 'Desarrollo', description: 'Actividades principales del aprendizaje' },
              { key: 'cierre', title: 'Cierre', description: 'Actividades de síntesis y evaluación' }
            ].map(({ key, title, description }) => {
              const blockData = session[key as 'inicio' | 'desarrollo' | 'cierre'];
              const isJsonStructure = typeof blockData === 'object' && 'timebox_min' in blockData;
              
              return (
                <Card key={key}>
                  <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isJsonStructure ? (
                      <>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="text-sm font-medium">Tiempo (min)</label>
                            <Input
                              type="number"
                              value={isJsonStructure ? (blockData as TimboxBlock).timebox_min : 0}
                              onChange={(e) => {
                                if (isJsonStructure) {
                                  const currentBlock = blockData as TimboxBlock;
                                  setSession({ 
                                    ...session, 
                                    [key]: {
                                      ...currentBlock,
                                      timebox_min: parseInt(e.target.value) || 0
                                    }
                                  });
                                }
                              }}
                              min={1}
                              max={session.duracion_min}
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="text-sm font-medium">Apoya estrategia A4</label>
                            <div className="flex items-center mt-2">
                              <input
                                type="checkbox"
                                checked={isJsonStructure ? (blockData as TimboxBlock).apoya_estrategia : false}
                                onChange={(e) => {
                                  if (isJsonStructure) {
                                    const currentBlock = blockData as TimboxBlock;
                                    setSession({ 
                                      ...session, 
                                      [key]: {
                                        ...currentBlock,
                                        apoya_estrategia: e.target.checked
                                      }
                                    });
                                  }
                                }}
                                className="mr-2"
                              />
                              <span className="text-sm">Este bloque usa la estrategia A4 principal</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Pasos de la actividad</label>
                          <Textarea
                            value={isJsonStructure ? (blockData as TimboxBlock).steps.join('\n') : ''}
                            onChange={(e) => {
                              if (isJsonStructure) {
                                const currentBlock = blockData as TimboxBlock;
                                setSession({ 
                                  ...session, 
                                  [key]: {
                                    ...currentBlock,
                                    steps: e.target.value.split('\n').filter(Boolean)
                                  }
                                });
                              }
                            }}
                            placeholder={`Describa los pasos de ${title.toLowerCase()} (uno por línea)`}
                            rows={8}
                            className="min-h-[200px]"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <Textarea
                          value={typeof blockData === 'string' ? blockData : ''}
                          onChange={(e) => setSession({ ...session, [key]: e.target.value })}
                          placeholder={`Describa las actividades de ${title.toLowerCase()}`}
                          rows={8}
                          className="min-h-[200px]"
                        />
                        <Alert>
                          <AlertDescription>
                            Esta sesión usa el formato anterior. Para usar la nueva estructura con timeboxes y pasos, 
                            regenere la sesión desde el Acelerador 6.
                          </AlertDescription>
                        </Alert>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {/* Resources and Evidence */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recursos Necesarios</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={Array.isArray(session.recursos) ? session.recursos.join('\n') : ''}
                    onChange={(e) => setSession({ 
                      ...session, 
                      recursos: e.target.value.split('\n').filter(Boolean)
                    })}
                    placeholder="Un recurso por línea"
                    rows={6}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Evidencias de Aprendizaje</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={Array.isArray(session.evidencias) ? session.evidencias.join('\n') : ''}
                    onChange={(e) => setSession({ 
                      ...session, 
                      evidencias: e.target.value.split('\n').filter(Boolean)
                    })}
                    placeholder="Una evidencia por línea"
                    rows={6}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Rubrics Tab */}
        <TabsContent value="rubricas" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">Instrumentos de Evaluación</h3>
              <p className="text-muted-foreground">
                Se requieren 3 instrumentos: rúbrica pedagógica, satisfacción estudiantes y autoevaluación docente
              </p>
            </div>
            <Button 
              onClick={generateRubrics} 
              disabled={generatingRubrics}
              variant={rubrics.length >= 3 ? "outline" : "default"}
            >
              {generatingRubrics ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  {rubrics.length >= 3 ? 'Regenerar' : 'Generar'} Rúbricas
                </>
              )}
            </Button>
          </div>

          {rubrics.length === 0 ? (
            <Alert>
              <AlertDescription>
                No hay rúbricas generadas aún. Haga clic en "Generar Rúbricas" para crear los instrumentos de evaluación.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-6">
              {rubrics.map((rubric) => (
                <Card key={rubric.id}>
                  <CardHeader>
                    <CardTitle>
                      {rubric.tipo === 'pedagogica' ? 'Rúbrica Pedagógica' :
                       rubric.tipo === 'satisfaccion_estudiante' ? 'Satisfacción de Estudiantes' :
                       'Autoevaluación Docente'}
                    </CardTitle>
                    <CardDescription>
                      Archivo: {rubric.html_nombre}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div 
                        className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96"
                        dangerouslySetInnerHTML={{ 
                          __html: rubric.html_contenido?.replace(/<html>.*?<body>/gs, '').replace(/<\/body>.*?<\/html>/gs, '') || 'Sin contenido'
                        }}
                      />
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => {
                          const blob = new Blob([rubric.html_contenido], { type: 'text/html' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = rubric.html_nombre;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}>
                          Descargar HTML
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Disclaimer */}
      <Alert>
        <AlertDescription>
          <strong>Importante:</strong> Este contenido ha sido generado automáticamente. 
          Puede contener errores. Valídelo y ajústelo antes de su aplicación en aula.
        </AlertDescription>
      </Alert>
    </div>
  );
}