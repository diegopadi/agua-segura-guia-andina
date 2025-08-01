import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, FileText, Upload, Brain, Download, CheckCircle, Clock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

// Import step components
import PEIUploader from "./components/PEIUploader";
import DynamicForm from "./components/DynamicForm";
import CompletenessAnalysis from "./components/CompletenessAnalysis";
import SupplementaryQuestions from "./components/SupplementaryQuestions";
import ReportGenerator from "./components/ReportGenerator";
interface Session {
  id: string;
  acelerador_number: number;
  current_step: number;
  status: 'in_progress' | 'completed' | 'paused';
  session_data: any;
  created_at: string;
  updated_at: string;
}
const steps = [{
  number: 1,
  title: "Bienvenida",
  description: "Introducción al acelerador",
  icon: FileText
}, {
  number: 2,
  title: "Subir PEI",
  description: "Carga tu Proyecto Educativo Institucional",
  icon: Upload
}, {
  number: 3,
  title: "Formulario",
  description: "Responde las preguntas orientadoras",
  icon: Brain
}, {
  number: 4,
  title: "Análisis IA",
  description: "Revisión automática de completitud",
  icon: Brain
}, {
  number: 5,
  title: "Preguntas adicionales",
  description: "Completa información faltante",
  icon: Brain
}, {
  number: 6,
  title: "Generar reporte",
  description: "Descarga tu diagnóstico institucional",
  icon: Download
}];
const Acelerador1 = () => {
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
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
      let {
        data: existingSession,
        error
      } = await supabase.from('acelerador_sessions').select('*').eq('user_id', user?.id).eq('acelerador_number', 1).single();
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      if (!existingSession) {
        // Create new session
        const {
          data: newSession,
          error: createError
        } = await supabase.from('acelerador_sessions').insert({
          user_id: user?.id,
          acelerador_number: 1,
          current_step: 1,
          status: 'in_progress',
          session_data: {}
        }).select().single();
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
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const updateSession = async (step: number, data: any = {}) => {
    if (!session) return;
    try {
      const {
        error
      } = await supabase.from('acelerador_sessions').update({
        current_step: step,
        session_data: {
          ...session.session_data,
          ...data
        },
        updated_at: new Date().toISOString()
      }).eq('id', session.id);
      if (error) throw error;
      setSession(prev => prev ? {
        ...prev,
        current_step: step,
        session_data: {
          ...prev.session_data,
          ...data
        }
      } : null);
      setCurrentStep(step);
    } catch (error) {
      console.error('Error updating session:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el progreso",
        variant: "destructive"
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
        return <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Bienvenido al Acelerador 1: Diagnóstico Institucional
              </CardTitle>
              <CardDescription>
                Este acelerador te guiará para crear un diagnóstico completo del contexto 
                hídrico y pedagógico de tu institución educativa.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">¿Qué lograrás?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Análisis completo de tu PEI con enfoque en seguridad hídrica</li>
                  <li>• Evaluación del contexto local y recursos disponibles</li>
                  <li>• Documento PDF profesional con recomendaciones específicas</li>
                  <li>• Prioridades pedagógicas alineadas al CNEB</li>
                </ul>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2">Lo que necesitarás:</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Tu Proyecto Educativo Institucional (PEI) en formato PDF</li>
                  
                  <li>• Conocimiento sobre tu institución y comunidad</li>
                </ul>
              </div>
              <Button onClick={() => nextStep()} className="w-full">
                Comenzar diagnóstico
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>;
      case 2:
        return <PEIUploader session={session} onNext={nextStep} onPrev={prevStep} />;
      case 3:
        return <DynamicForm session={session} onNext={nextStep} onPrev={prevStep} />;
      case 4:
        return <CompletenessAnalysis session={session} onNext={nextStep} onPrev={prevStep} />;
      case 5:
        return <SupplementaryQuestions session={session} onNext={nextStep} onPrev={prevStep} />;
      case 6:
        return <ReportGenerator session={session} onPrev={prevStep} />;
      default:
        return null;
    }
  };
  if (loading) {
    return <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
        </div>
      </div>;
  }
  return <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/etapa1">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Etapa 1
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-primary">Acelerador 1: Diagnóstico Institucional</h1>
            <p className="text-muted-foreground">
              Paso {currentStep} de {steps.length}: {steps[currentStep - 1]?.title}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="gap-2">
          <Clock className="w-4 h-4" />
          En progreso
        </Badge>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Progreso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={currentStep / steps.length * 100} className="h-2" />
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {steps.map(step => {
              const status = getStepStatus(step.number);
              const IconComponent = step.icon;
              return <div key={step.number} className={`p-3 rounded-lg border text-center transition-colors ${status === 'completed' ? 'bg-green-50 border-green-200 text-green-700' : status === 'current' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-muted border-muted-foreground/20 text-muted-foreground'}`}>
                    <div className="flex justify-center mb-2">
                      {status === 'completed' ? <CheckCircle className="w-5 h-5" /> : <IconComponent className="w-5 h-5" />}
                    </div>
                    <p className="text-xs font-medium">{step.title}</p>
                  </div>;
            })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Step Content */}
      {renderCurrentStep()}
    </div>;
};
export default Acelerador1;