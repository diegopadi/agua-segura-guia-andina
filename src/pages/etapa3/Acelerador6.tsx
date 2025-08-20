import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, Plus, Eye, Edit, Download, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  session_data: any;
  user_id: string;
}

export default function Acelerador6() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [acceleratorSession, setAcceleratorSession] = useState<AcceleratorSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Load accelerator session and existing sessions
  useEffect(() => {
    loadData();
  }, [sessionId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      let accSession;
      
      if (sessionId) {
        // Load existing session
        const { data, error } = await supabase
          .from('acelerador_sessions')
          .select('*')
          .eq('id', sessionId)
          .eq('acelerador_number', 6)
          .single();

        if (error) {
          toast({
            title: "Error",
            description: "No se pudo cargar la sesión del acelerador",
            variant: "destructive",
          });
          return;
        }
        accSession = data;
      } else {
        // Create new session for Acelerador 6
        if (!user) return;
        
        // First check if user has completed Acelerador 5
        const { data: a5Session, error: a5Error } = await supabase
          .from('acelerador_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('acelerador_number', 5)
          .eq('status', 'completed')
          .single();

        if (a5Error || !a5Session) {
          toast({
            title: "Error",
            description: "Debes completar el Acelerador 5 primero",
            variant: "destructive",
          });
          navigate('/etapa2');
          return;
        }

        // Create new Acelerador 6 session with correct data mapping
        const a5Data = a5Session.session_data as any;
        const { data: newSession, error: createError } = await supabase
          .from('acelerador_sessions')
          .insert({
            user_id: user.id,
            acelerador_number: 6,
            current_step: 1,
            status: 'in_progress',
            session_data: {
              unidadData: {
                area: a5Data.info?.area || 'Comunicación',
                grado: a5Data.info?.grado || '3ro',
                horasPorSesion: a5Data.sessions?.horasPorSesion || 45,
                numSesiones: a5Data.sessions?.numSesiones || 5,
                numEstudiantes: a5Data.sessions?.numEstudiantes || 25,
                unidad_id: `unidad_${user.id}_${Date.now()}`
              },
              competencias_ids: a5Data.comp?.competencias || [],
              originalA5Data: a5Data
            }
          })
          .select()
          .single();

        if (createError) {
          toast({
            title: "Error",
            description: "No se pudo crear la sesión del acelerador",
            variant: "destructive",
          });
          return;
        }

        accSession = newSession;
        // Navigate to the new session URL
        navigate(`/etapa3/acelerador6/${newSession.id}`, { replace: true });
      }

      setAcceleratorSession(accSession);

      // Get existing sessions if any
      if (accSession?.user_id) {
        const sessionData = accSession.session_data as any;
        const unidadId = sessionData?.unidadData?.unidad_id || 'temp';
        
        const response = await supabase.functions.invoke('get-unidad-sesiones', {
          body: { 
            unidad_id: unidadId,
            user_id: accSession.user_id
          }
        });

        if (response.data?.sessions) {
          setSessions(response.data.sessions);
        }
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Error al cargar los datos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAllSessions = async () => {
    const sessionData = acceleratorSession?.session_data as any;
    if (!sessionData?.unidadData) {
      toast({
        title: "Error", 
        description: "No hay datos de unidad desde el Acelerador 5",
        variant: "destructive",
      });
      return;
    }

    try {
      setGenerating(true);
      
      const unidadData = sessionData.unidadData;
      const competenciasIds = sessionData.competencias_ids || [];
      
      // Call prepare-sesion-clase function
      const response = await supabase.functions.invoke('prepare-sesion-clase', {
        body: {
          unidad_data: unidadData,
          competencias_ids: competenciasIds,
          duracion_min: unidadData.horasPorSesion || 45,
          recursos_IE: ["pizarra", "plumones", "papel"],
          area: unidadData.area || "Comunicación",
          grado: unidadData.grado || "3ro"
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const generatedSessions = response.data?.sesiones || [];
      
      // Save sessions to database
      const sessionsToSave = generatedSessions.map((session: any, index: number) => ({
        user_id: acceleratorSession.user_id,
        unidad_id: unidadData.unidad_id,
        session_index: session.session_index || index + 1,
        titulo: session.titulo,
        proposito: session.proposito,
        inicio: session.inicio,
        desarrollo: session.desarrollo,
        cierre: session.cierre,
        evidencias: session.evidencias || [],
        recursos: session.recursos || [],
        duracion_min: session.duracion_min || 45,
        competencias_ids: competenciasIds,
        capacidades: session.capacidades || [],
        estado: 'BORRADOR'
      }));

      const { error: insertError } = await supabase
        .from('sesiones_clase')
        .insert(sessionsToSave);

      if (insertError) {
        throw new Error(insertError.message);
      }

      toast({
        title: "Éxito",
        description: `Se generaron ${generatedSessions.length} sesiones`,
      });

      // Reload sessions
      loadData();

    } catch (error) {
      console.error('Error generating sessions:', error);
      toast({
        title: "Error",
        description: "Error al generar las sesiones",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
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

  const exportSession = async (sessionId: string, sessionIndex: number) => {
    try {
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

      // Reload sessions to update states
      loadData();

    } catch (error) {
      console.error('Error exporting session:', error);
      toast({
        title: "Error", 
        description: "Error al exportar la sesión",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!acceleratorSession) {
    return (
      <Alert>
        <AlertDescription>
          No se encontró la sesión del Acelerador 6
        </AlertDescription>
      </Alert>
    );
  }

  const unidadData = (acceleratorSession.session_data as any)?.unidadData;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Acelerador 6: Diseñador de Sesiones</h1>
          <p className="text-muted-foreground">
            Genera y edita sesiones de aprendizaje basadas en tu unidad del Acelerador 5
          </p>
        </div>
        <BookOpen className="h-12 w-12 text-primary" />
      </div>

      {/* Unit Info */}
      {unidadData && (
        <Card>
          <CardHeader>
            <CardTitle>Información de la Unidad</CardTitle>
            <CardDescription>Datos desde el Acelerador 5</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium">Sesiones</p>
                <p className="text-2xl font-bold">{unidadData.numSesiones || 6}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Duración</p>
                <p className="text-2xl font-bold">{unidadData.horasPorSesion || 45} min</p>
              </div>
              <div>
                <p className="text-sm font-medium">Área</p>
                <p className="text-lg">{unidadData.area || "Por definir"}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Grado</p>
                <p className="text-lg">{unidadData.grado || "Por definir"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate Sessions */}
      {sessions.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generar Sesiones</CardTitle>
            <CardDescription>
              Crea todas las sesiones de tu unidad basándose en los datos del Acelerador 5
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={generateAllSessions} 
              disabled={generating}
              size="lg"
              className="w-full"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando sesiones...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Generar todas las sesiones
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Sessions List */}
      {sessions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Sesiones Generadas</h2>
            <Button onClick={generateAllSessions} disabled={generating} variant="outline">
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Regenerando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Regenerar todas
                </>
              )}
            </Button>
          </div>

          <div className="grid gap-4">
            {sessions.map((session) => (
              <Card key={session.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Sesión {session.session_index}: {session.titulo}
                      </CardTitle>
                      <CardDescription>{session.proposito}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getEstadoBadge(session.estado)}
                      {session.has_all_rubrics && (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Rúbricas OK
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {session.duracion_min} min
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Rúbricas: {session.rubrics_count}/3
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Competencias: {session.competencias_ids.length}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/etapa3/sesion/${session.id}/editar`)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/etapa3/sesion/${session.id}/editar`)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                      {session.can_export && (
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => exportSession(session.id, session.session_index)}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Exportar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <Alert>
        <AlertDescription>
          <strong>Importante:</strong> Las sesiones generadas son propuestas pedagógicas automáticas. 
          Pueden contener errores. Valídelas y ajústelas antes de su aplicación en aula.
        </AlertDescription>
      </Alert>
    </div>
  );
}