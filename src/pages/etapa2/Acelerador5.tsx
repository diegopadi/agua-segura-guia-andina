import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, FileText, UploadCloud, CheckSquare, Book, Edit3, Clipboard, File, MessageCircle, Check, FileCheck, CheckCircle, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface Session {
  id: string;
  acelerador_number: number;
  current_step: number;
  status: 'in_progress' | 'completed' | 'paused';
  session_data: any;
  created_at: string;
  updated_at: string;
}

const steps = [
  {
    number: 1,
    title: "Cargar Informe de Estrategias",
    description: "Ingesta del informe generado por Acelerador 4",
    icon: UploadCloud
  },
  {
    number: 2,
    title: "Selección de Competencia CNEB",
    description: "Marca la competencia del CNEB sin consultar el documento original",
    icon: CheckSquare
  },
  {
    number: 3,
    title: "Carga de PCI y Reconfirmación",
    description: "Sube el PCI y responde hasta 5 preguntas de contexto",
    icon: Book
  },
  {
    number: 4,
    title: "Generar Preguntas Clave",
    description: "Crea 10 preguntas que guiarán el diseño de la unidad",
    icon: Edit3
  },
  {
    number: 5,
    title: "Responder Preguntas Clave",
    description: "Completa las 10 preguntas para alimentar el diseño",
    icon: Clipboard
  },
  {
    number: 6,
    title: "Borrador de Unidad",
    description: "Genera el primer borrador de la unidad con base en insumos",
    icon: File
  },
  {
    number: 7,
    title: "Revisión y Feedback de Unidad",
    description: "Chat único para ajustes menores del borrador",
    icon: MessageCircle
  },
  {
    number: 8,
    title: "Versión Final de la Unidad",
    description: "Refina y genera la versión definitiva de la unidad",
    icon: Check
  },
  {
    number: 9,
    title: "Entrega de Documento de Unidad",
    description: "Presenta el documento indexado y con evidencias para Acelerador 6",
    icon: FileCheck
  }
];

const Acelerador5 = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (user) {
      loadOrCreateSession();
    }
  }, [user]);

  const loadOrCreateSession = async () => {
    try {
      // Try to find existing session
      let { data: existingSession, error } = await supabase
        .from('acelerador_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('acelerador_number', 5)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!existingSession) {
        // Create new session
        const { data: newSession, error: createError } = await supabase
          .from('acelerador_sessions')
          .insert({
            user_id: user?.id,
            acelerador_number: 5,
            current_step: 1,
            status: 'in_progress',
            session_data: {}
          })
          .select()
          .single();

        if (createError) throw createError;
        existingSession = newSession;
      }

      setSession(existingSession as Session);
      setCurrentStep(existingSession.current_step);
    } catch (error) {
      console.error('Error loading session:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la sesión del acelerador",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSession = async (step: number, data: any = {}) => {
    if (!session) return;

    try {
      const { error } = await supabase
        .from('acelerador_sessions')
        .update({
          current_step: step,
          session_data: { ...session.session_data, ...data },
          updated_at: new Date().toISOString()
        })
        .eq('id', session.id);

      if (error) throw error;

      setSession(prev => prev ? {
        ...prev,
        current_step: step,
        session_data: { ...prev.session_data, ...data }
      } : null);
      setCurrentStep(step);
    } catch (error) {
      console.error('Error updating session:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el progreso",
        variant: "destructive",
      });
    }
  };

  const nextStep = (data: any = {}) => {
    const next = Math.min(currentStep + 1, steps.length);
    updateSession(next, data);
  };

  const prevStep = () => {
    const prev = Math.max(currentStep - 1, 1);
    updateSession(prev);
  };

  const getStepStatus = (stepNumber: number) => {
    if (stepNumber < currentStep) return 'completed';
    if (stepNumber === currentStep) return 'current';
    return 'pending';
  };

  const renderCurrentStep = () => {
    if (!session) return null;

    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Bienvenido al Acelerador 5: Planificación y Preparación de Unidades
              </CardTitle>
              <CardDescription>
                Este acelerador te guiará para diseñar una unidad didáctica completa a partir de estrategias priorizadas, CNEB y PCI.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">¿Qué lograrás?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Unidad didáctica completa alineada con CNEB y PCI</li>
                  <li>• Competencias específicas bien definidas</li>
                  <li>• Actividades pedagógicas secuenciadas</li>
                  <li>• Documento indexado con evidencias de aprendizaje</li>
                </ul>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2">Lo que necesitarás:</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Informe de estrategias del Acelerador 4</li>
                  <li>• Documento PCI de tu institución</li>
                  <li>• Conocimiento de competencias del CNEB</li>
                </ul>
              </div>
              <Button onClick={() => nextStep()} className="w-full">
                Comenzar planificación de unidad
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        );
      default:
        return (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Paso en desarrollo</h3>
                <p className="text-sm">
                  Este paso del acelerador se está desarrollando. Pronto estará disponible con todas las funcionalidades.
                </p>
              </div>
            </CardContent>
          </Card>
        );
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/etapa2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Etapa 2
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-primary">Acelerador 5: Planificación y Preparación de Unidades</h1>
            <p className="text-muted-foreground">
              Paso {currentStep} de {steps.length}: {steps[currentStep - 1]?.title}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="gap-2">
          <Clock className="w-4 h-4" />
          En desarrollo
        </Badge>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Progreso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={(currentStep / steps.length) * 100} className="h-2" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {steps.map((step) => {
                const status = getStepStatus(step.number);
                const IconComponent = step.icon;
                return (
                  <div
                    key={step.number}
                    className={`p-3 rounded-lg border text-center transition-colors ${
                      status === 'completed'
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : status === 'current'
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-muted border-muted-foreground/20 text-muted-foreground'
                    }`}
                  >
                    <div className="flex justify-center mb-2">
                      {status === 'completed' ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <IconComponent className="w-5 h-5" />
                      )}
                    </div>
                    <p className="text-xs font-medium">{step.title}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Step Content */}
      {renderCurrentStep()}
    </div>
  );
};

export default Acelerador5;