import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Download, Eye, FileText, Wand2, Edit3, Clock, CheckCircle, AlertCircle, BookOpen, Play, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface SessionData {
  id: string;
  session_index: number;
  titulo: string;
  proposito: string;
  estado: string;
  duracion_min: number;
  competencias_ids: string[];
  rubrics_count: number;
  has_all_rubrics: boolean;
  can_export: boolean;
  created_at: string;
}

interface AcceleratorSession {
  id: string;
  user_id: string;
  current_step: number;
  session_data: any;
}

const steps = [
  {
    number: 1,
    title: "Bienvenida y Verificación",
    description: "Verifica los datos de tu unidad didáctica desde el Acelerador 5",
    icon: BookOpen,
    type: "welcome"
  },
  {
    number: 2,
    title: "Generación de Sesiones",
    description: "Genera automáticamente las sesiones de clase basadas en tu unidad",
    icon: Wand2,
    type: "generation"
  },
  {
    number: 3,
    title: "Revisión y Edición",
    description: "Revisa, edita y perfecciona cada sesión generada",
    icon: Edit3,
    type: "review"
  },
  {
    number: 4,
    title: "Exportación Final",
    description: "Exporta tus sesiones finalizadas en formato HTML",
    icon: Download,
    type: "export"
  }
];

export default function Acelerador6() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [a6Session, setA6Session] = useState<AcceleratorSession | null>(null);
  const [a5Data, setA5Data] = useState<any>(null);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const unidadId = a6Session?.session_data?.unidadData?.unidad_id;

  useEffect(() => {
    if (user) {
      loadOrCreateSession();
    }
  }, [user, sessionId]);

  const loadOrCreateSession = async () => {
    try {
      // Try to find existing A6 session
      let { data: existingSession, error } = await supabase
        .from('acelerador_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('acelerador_number', 6)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!existingSession) {
        // Find the most recent Acelerador 5 session (regardless of status)
        const { data: a5Sessions, error: a5Error } = await supabase
          .from('acelerador_sessions')
          .select('*')
          .eq('user_id', user?.id)
          .eq('acelerador_number', 5)
          .order('updated_at', { ascending: false })
          .limit(1);

        if (a5Error) {
          console.error('Error fetching Acelerador 5 sessions:', a5Error);
          setError("Error al verificar el estado del Acelerador 5. Por favor, intenta nuevamente.");
          return;
        }

        if (!a5Sessions || a5Sessions.length === 0) {
          setError("No se encontró ninguna sesión del Acelerador 5. Debes completar el Acelerador 5 primero.");
          return;
        }

        const a5Session = a5Sessions[0];
        console.log('Found A5 session:', {
          id: a5Session.id,
          status: a5Session.status,
          updated_at: a5Session.updated_at,
          current_step: a5Session.current_step
        });
        
        // Validate that A5 has the necessary data
        const a5SessionData = a5Session.session_data as any;
        console.log('A5 session data structure:', {
          hasSessionData: !!a5SessionData,
          hasInfo: !!a5SessionData?.informacion_general,
          hasInformacion: !!a5SessionData?.info,
          hasEstructuraSesiones: !!a5SessionData?.estructura_sesiones,
          hasSesionesEstructura: !!a5SessionData?.sesiones_estructura,
          hasSessions: !!a5SessionData?.sessions
        });

        // More robust validation - check multiple possible data structures
        const hasBasicInfo = a5SessionData?.informacion_general || a5SessionData?.info;
        const hasSessionStructure = a5SessionData?.estructura_sesiones || 
                                   a5SessionData?.sesiones_estructura || 
                                   a5SessionData?.sessions;

        if (!a5SessionData || !hasBasicInfo || !hasSessionStructure) {
          console.error('A5 data validation failed:', {
            hasSessionData: !!a5SessionData,
            hasBasicInfo: !!hasBasicInfo,
            hasSessionStructure: !!hasSessionStructure
          });
          setError("Los datos del Acelerador 5 están incompletos. Por favor, completa todos los pasos del Acelerador 5, incluyendo la información general y la estructura de sesiones.");
          return;
        }

        // Create new A6 session
        const { data: newSession, error: createError } = await supabase
          .from('acelerador_sessions')
          .insert({
            user_id: user?.id,
            acelerador_number: 6,
            current_step: 1,
            status: 'in_progress',
            session_data: { a5_data: a5Session.session_data }
          })
          .select()
          .single();

        if (createError) throw createError;
        existingSession = newSession;
      }

      setA6Session(existingSession);
      setA5Data((existingSession.session_data as any)?.a5_data);
      setCurrentStep(existingSession.current_step || 1);
      
      // Load existing sessions
      await loadExistingSessions();
    } catch (error) {
      console.error('Error loading session:', error);
      setError("Error al cargar la sesión del acelerador");
    } finally {
      setLoading(false);
    }
  };

  const loadExistingSessions = async () => {
    if (!user?.id || !unidadId) return;
    
    try {
      setLoadingSessions(true);
      console.log("Loading existing sessions for unidad:", unidadId);
      
      // Send parameters as query params, not in body
      const queryParams = new URLSearchParams({
        unidad_id: unidadId,
        user_id: user.id
      });
      
      const { data, error } = await supabase.functions.invoke(
        `get-unidad-sesiones?${queryParams.toString()}`
      );

      if (error) {
        console.error("Error loading sessions:", error);
        throw error;
      }

      console.log("Loaded sessions data:", data);
      setSessions(data?.sessions || []);
    } catch (error) {
      console.error("Error loading existing sessions:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las sesiones existentes",
        variant: "destructive",
      });
    } finally {
      setLoadingSessions(false);
    }
  };

  const generateAllSessions = async () => {
    const sessionData = a6Session?.session_data as any;
    if (!sessionData?.a5_data) {
      toast({
        title: "Error", 
        description: "No hay datos del Acelerador 5",
        variant: "destructive",
      });
      return;
    }

    try {
      setGenerating(true);
      
      const a5Data = sessionData.a5_data;
      const unidadData = a5Data?.estructura_sesiones || a5Data?.sesiones_estructura;
      const competenciasIds = a5Data?.competencias?.competencias || [];
      
      if (!unidadData) {
        throw new Error("No se encontraron datos de la estructura de sesiones en el Acelerador 5");
      }

      // Generate or validate unidad_id
      let unidad_id = sessionData.unidadData?.unidad_id;
      if (!unidad_id || typeof unidad_id !== 'string') {
        unidad_id = crypto.randomUUID();
        // Update session with unidad_id
        await updateSession({
          session_data: {
            ...sessionData,
            unidadData: { ...sessionData.unidadData, unidad_id }
          }
        });
      }

      // Check if there are existing sessions for this unidad_id
      const { data: existingSessions, error: checkError } = await supabase
        .from('sesiones_clase')
        .select('id')
        .eq('unidad_id', unidad_id)
        .eq('user_id', user?.id);

      if (checkError) {
        throw new Error(`Error al verificar sesiones existentes: ${checkError.message}`);
      }

      // If there are existing sessions, ask for confirmation
      if (existingSessions && existingSessions.length > 0) {
        const confirmed = window.confirm(
          `Ya existen ${existingSessions.length} sesiones para esta unidad. ¿Deseas reemplazarlas con nuevas sesiones? Esta acción no se puede deshacer.`
        );
        
        if (!confirmed) {
          setGenerating(false);
          return;
        }

        // Delete existing sessions
        const { error: deleteError } = await supabase
          .from('sesiones_clase')
          .delete()
          .eq('unidad_id', unidad_id)
          .eq('user_id', user?.id);

        if (deleteError) {
          throw new Error(`Error al eliminar sesiones existentes: ${deleteError.message}`);
        }

        console.log(`Deleted ${existingSessions.length} existing sessions`);
      }

      console.log('Generating sessions with data:', {
        numSesiones: unidadData.numSesiones,
        horasPorSesion: unidadData.horasPorSesion,
        area: a5Data.informacion_general?.area,
        grado: a5Data.informacion_general?.grado,
        competencias_ids: competenciasIds
      });

      // Call prepare-sesion-clase function with correct parameters
      const response = await supabase.functions.invoke('prepare-sesion-clase', {
        body: {
          unidad_data: {
            area: a5Data.informacion_general?.area || "Comunicación",
            grado: a5Data.informacion_general?.grado || "3ro",
            unidad_id: unidad_id,
            numSesiones: unidadData.numSesiones || 5,
            horasPorSesion: unidadData.horasPorSesion || 45,
            numEstudiantes: unidadData.numEstudiantes || 25
          },
          competencias_ids: competenciasIds,
          duracion_min: (unidadData.horasPorSesion || 45) * 60, // Convert to minutes
          recursos_IE: ["pizarra", "plumones", "papel"],
          area: a5Data.informacion_general?.area || "Comunicación",
          grado: a5Data.informacion_general?.grado || "3ro"
        }
      });

      console.log('Edge function response:', response);

      if (response.error) {
        throw new Error(`Error en la función: ${response.error.message}`);
      }

      if (!response.data?.sesiones) {
        throw new Error('No se generaron sesiones válidas');
      }

      const generatedSessions = response.data.sesiones;
      console.log('Generated sessions:', generatedSessions);

      // Prepare sessions for database
      const sessionsToSave = generatedSessions.map((session: any, index: number) => ({
        user_id: user?.id,
        unidad_id: unidad_id,
        session_index: session.session_index || index + 1,
        titulo: session.titulo || `Sesión ${index + 1}`,
        proposito: session.proposito || 'Propósito por definir',
        inicio: session.inicio || 'Actividad de inicio por definir',
        desarrollo: session.desarrollo || 'Actividad de desarrollo por definir',
        cierre: session.cierre || 'Actividad de cierre por definir',
        evidencias: Array.isArray(session.evidencias) ? session.evidencias : [],
        recursos: Array.isArray(session.recursos) ? session.recursos : ['pizarra', 'plumones'],
        duracion_min: Number(session.duracion_min) || (unidadData.horasPorSesion || 45) * 60,
        competencias_ids: Array.isArray(competenciasIds) ? competenciasIds : [],
        capacidades: Array.isArray(session.capacidades) ? session.capacidades : [],
        estado: 'BORRADOR'
      }));

      // Insert new sessions into database
      const { error: insertError, data: insertedData } = await supabase
        .from('sesiones_clase')
        .insert(sessionsToSave)
        .select();

      if (insertError) {
        throw new Error(`Error al guardar sesiones: ${insertError.message}`);
      }

      toast({
        title: "Éxito",
        description: existingSessions && existingSessions.length > 0 
          ? `Se reemplazaron ${existingSessions.length} sesiones existentes con ${generatedSessions.length} nuevas sesiones`
          : `Se generaron ${generatedSessions.length} sesiones correctamente`,
      });

      // Move to next step and reload sessions
      nextStep();
      await loadExistingSessions();

    } catch (error) {
      console.error('Error generating sessions:', error);
      toast({
        title: "Error en la generación",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const exportSession = async (sessionId: string) => {
    try {
      setExporting(sessionId);
      
      const response = await supabase.functions.invoke('exportar-sesion-html', {
        body: {
          sesion_id: sessionId,
          incluir_rubricas: true
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Download HTML file
      const { filename, html } = response.data;
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Éxito",
        description: "Sesión exportada correctamente",
      });

    } catch (error) {
      console.error('Error exporting session:', error);
      toast({
        title: "Error", 
        description: "Error al exportar la sesión",
        variant: "destructive",
      });
    } finally {
      setExporting(null);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, any> = {
      'BORRADOR': 'secondary',
      'EN_EDICION': 'default',
      'RÚBRICAS_PENDIENTES': 'outline',
      'LISTA_PARA_EXPORTAR': 'default',
      'APROBADA': 'default'
    };
    
    return <Badge variant={variants[estado] || 'secondary'}>{estado}</Badge>;
  };

  const updateSession = async (updates: Partial<AcceleratorSession>) => {
    if (!a6Session) return;

    try {
      const { error } = await supabase
        .from('acelerador_sessions')
        .update({
          current_step: updates.current_step || a6Session.current_step,
          session_data: updates.session_data || a6Session.session_data,
          updated_at: new Date().toISOString()
        })
        .eq('id', a6Session.id);

      if (error) throw error;

      const updatedSession = { ...a6Session, ...updates };
      setA6Session(updatedSession);
      if (updates.current_step) setCurrentStep(updates.current_step);
    } catch (error) {
      console.error('Error updating session:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el progreso",
        variant: "destructive",
      });
    }
  };

  const nextStep = () => {
    const next = Math.min(currentStep + 1, steps.length);
    updateSession({ current_step: next });
  };

  const prevStep = () => {
    const prev = Math.max(currentStep - 1, 1);
    updateSession({ current_step: prev });
  };

  const getStepStatus = (stepNumber: number) => {
    if (stepNumber < currentStep) return 'completed';
    if (stepNumber === currentStep) return 'current';
    return 'pending';
  };

  const renderCurrentStep = () => {
    const step = steps.find(s => s.number === currentStep);
    if (!step) return null;

    const unidadData = a5Data?.estructura_sesiones || a5Data?.sesiones_estructura;

    switch (step.type) {
      case 'welcome':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Bienvenido al Acelerador 6: Diseño de Sesiones de Clase
              </CardTitle>
              <CardDescription>
                Genera y diseña sesiones de clase basadas en la unidad didáctica que creaste en el Acelerador 5.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">¿Qué lograrás?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Sesiones de clase generadas automáticamente</li>
                  <li>• Estructura pedagógica completa (inicio, desarrollo, cierre)</li>
                  <li>• Rúbricas de evaluación para cada sesión</li>
                  <li>• Exportación en formato HTML listo para imprimir</li>
                </ul>
              </div>
              
              {unidadData && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Datos de tu unidad verificados:</h4>
                  <div className="text-sm text-green-800 space-y-1">
                    <p><strong>Área:</strong> {a5Data?.informacion_general?.area || 'No especificado'}</p>
                    <p><strong>Grado:</strong> {a5Data?.informacion_general?.grado || 'No especificado'}</p>
                    <p><strong>Número de sesiones:</strong> {unidadData?.numSesiones || 'No especificado'}</p>
                    <p><strong>Duración por sesión:</strong> {unidadData?.horasPorSesion || 'No especificado'} horas</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={nextStep} className="flex-1">
                  Continuar a generación de sesiones
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'generation':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-primary" />
                Generación de Sesiones
              </CardTitle>
              <CardDescription>
                Genera automáticamente las sesiones de clase basadas en tu unidad didáctica.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sessions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-muted-foreground mb-4">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Listo para generar sesiones</h3>
                    <p className="text-sm mb-4">
                      Haz clic en el botón para generar automáticamente las sesiones de clase 
                      basadas en los datos de tu unidad didáctica.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Button
                      onClick={generateAllSessions}
                      disabled={generating}
                      className="w-full"
                    >
                      {generating ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Generando sesiones...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4 mr-2" />
                          Generar todas las sesiones
                        </>
                      )}
                    </Button>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={prevStep} className="flex-1">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Anterior
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">
                      ✅ Sesiones generadas exitosamente
                    </h4>
                    <p className="text-sm text-green-800">
                      Se han generado {sessions.length} sesiones de clase. Continúa al siguiente paso para revisarlas y editarlas.
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={prevStep} className="flex-1">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Anterior
                    </Button>
                    <Button onClick={nextStep} className="flex-1">
                      Revisar sesiones
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'review':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-primary" />
                Revisión y Edición de Sesiones
              </CardTitle>
              <CardDescription>
                Revisa, edita y perfecciona cada sesión generada antes de la exportación final.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingSessions ? (
                <div className="text-center py-8">
                  <Clock className="w-8 h-8 mx-auto mb-4 animate-spin text-muted-foreground" />
                  <p className="text-muted-foreground">Cargando sesiones...</p>
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No hay sesiones disponibles</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Regresa al paso anterior para generar las sesiones primero.
                  </p>
                  <Button variant="outline" onClick={prevStep}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver a generación
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4">
                    {sessions.map((session) => (
                      <Card key={session.id} className="border-l-4 border-l-primary">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                              Sesión {session.session_index}: {session.titulo}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                              {getEstadoBadge(session.estado)}
                              <Badge variant={session.rubrics_count >= 3 ? "default" : "secondary"}>
                                {session.rubrics_count}/3 rúbricas
                              </Badge>
                            </div>
                          </div>
                          <CardDescription>{session.proposito}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-2">
                          <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                            <span>Duración: {session.duracion_min} minutos</span>
                            <span>Competencias: {Array.isArray(session.competencias_ids) ? session.competencias_ids.length : 0}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/etapa3/acelerador6/session-editor/${session.id}`)}
                            >
                              <Edit3 className="w-4 h-4 mr-2" />
                              Editar
                            </Button>
                            <Button
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/etapa3/acelerador6/session-editor/${session.id}`)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Ver
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => exportSession(session.id)}
                              disabled={exporting === session.id || !session.can_export}
                            >
                              {exporting === session.id ? (
                                <Clock className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4 mr-2" />
                              )}
                              Exportar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Nota importante:</strong> Las sesiones han sido generadas automáticamente por IA. 
                      Es necesario que revises y valides el contenido antes de aplicarlo en el aula. 
                      Asegúrate de que las actividades, recursos y evaluaciones sean apropiados para tu contexto específico.
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={prevStep} className="flex-1">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Anterior
                    </Button>
                    <Button onClick={nextStep} className="flex-1">
                      Finalizar y exportar
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'export':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5 text-primary" />
                Exportación Final
              </CardTitle>
              <CardDescription>
                Exporta todas tus sesiones finalizadas en formato HTML.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">¡Felicitaciones!</h4>
                <p className="text-sm text-green-800">
                  Has completado el diseño de sesiones de clase para tu unidad didáctica. 
                  Ahora puedes exportar cada sesión individualmente o continuar perfeccionándolas.
                </p>
              </div>

              {sessions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Sesiones disponibles para exportar:</h4>
                  <div className="grid gap-2">
                    {sessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Sesión {session.session_index}: {session.titulo}</p>
                          <p className="text-sm text-muted-foreground">
                            {session.rubrics_count}/3 rúbricas • {getEstadoBadge(session.estado)}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportSession(session.id)}
                          disabled={exporting === session.id || !session.can_export}
                        >
                          {exporting === session.id ? (
                            <Clock className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4 mr-2" />
                          )}
                          Exportar HTML
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={prevStep} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Anterior
                </Button>
                <Button onClick={() => navigate('/etapa3')} className="flex-1">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Finalizar Acelerador
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Acelerador 6: Diseño de Sesiones de Clase</h1>
            <p className="text-muted-foreground">Genera y diseña sesiones de clase basadas en tu unidad didáctica</p>
          </div>
        </div>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!a6Session) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No se encontró una sesión del Acelerador 6.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Acelerador 6: Diseño de Sesiones de Clase</h1>
          <p className="text-muted-foreground">Genera y diseña sesiones de clase basadas en tu unidad didáctica</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/etapa3')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Etapa 3
        </Button>
      </div>

      {/* Progress Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Progreso del Acelerador</h2>
          <div className="text-sm text-muted-foreground">
            Paso {currentStep} de {steps.length}
          </div>
        </div>
        
        <Progress value={(currentStep / steps.length) * 100} className="w-full" />
        
        <div className="flex justify-between">
          {steps.map((step) => {
            const status = getStepStatus(step.number);
            const IconComponent = step.icon;
            
            return (
              <div
                key={step.number}
                className={`flex flex-col items-center space-y-2 ${
                  status === 'current' ? 'text-primary' : 
                  status === 'completed' ? 'text-green-600' : 'text-muted-foreground'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    status === 'current' ? 'border-primary bg-primary/10' :
                    status === 'completed' ? 'border-green-600 bg-green-50' : 'border-muted'
                  }`}
                >
                  {status === 'completed' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <IconComponent className="w-5 h-5" />
                  )}
                </div>
                <div className="text-center">
                  <div className="text-xs font-medium">{step.title}</div>
                  <div className="text-xs text-muted-foreground hidden sm:block">
                    {step.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Step Content */}
      {renderCurrentStep()}
    </div>
  );
}