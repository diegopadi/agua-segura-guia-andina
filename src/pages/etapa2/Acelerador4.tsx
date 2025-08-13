import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, BookOpen, UploadCloud, MapPin, Wand2, MessageCircle, HelpCircle, FileText, CheckCircle, Clock, RefreshCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { FileUploaderStep } from './components/FileUploaderStep';
import { StaticFormStep } from './components/StaticFormStep';
import { AIAnalysisStep } from './components/AIAnalysisStep';
import { ProfundizationStep } from './components/ProfundizationStep';
import { InteractiveChatStep } from './components/InteractiveChatStep';
import { ReportViewerStep } from './components/ReportViewerStep';
import { WelcomeWithPrioritiesStep } from './components/WelcomeWithPrioritiesStep';
import { StrategiesViewerStep } from './components/StrategiesViewerStep';
import { getAppConfig, upsertAppConfig } from "@/integrations/supabase/appConfig";
import { APP_CONFIG_A4_DEFAULT } from "@/integrations/supabase/appConfigDefaults";

interface Session {
  id: string;
  acelerador_number: number;
  current_step: number;
  status: 'in_progress' | 'completed' | 'paused';
  session_data: any;
  created_at: string;
  updated_at: string;
}

interface AppConfig { estrategias_repo?: { items: any[] }; plantilla_informe_ac4?: any; }

const steps = [
  {
    number: 1,
    title: "Bienvenida y Selección de Prioridades",
    description: "Recupera los resultados del Acelerador 3 y selecciona las 2 prioridades principales",
    icon: BookOpen,
    type: "welcome",
    uses_ai: true,
    ui_component: "WelcomeWithPrioritiesStep",
    prev_step: null,
    next_step: 2
  },
  {
    number: 2,
    title: "Definición de Contexto",
    description: "Indica si tu aula es urbana o rural, multigrado/EIB y qué recursos TIC dispones",
    icon: MapPin,
    type: "form",
    uses_ai: false,
    ui_component: "StaticFormStep",
    static_data: {
      questions: [
        { id: 1, text: "¿Su aula es urbana o rural?", type: "select" as const, options: ["Urbana","Rural"], required: true },
        { id: 2, text: "¿Es multigrado, EIB o regular?", type: "select" as const, options: ["Multigrado","EIB","Regular"], required: true },
        { id: 3, text: "¿Qué recursos TIC tiene disponibles?", type: "textarea" as const, required: true }
      ]
    },
    prev_step: 1,
    next_step: 3
  },
  {
    number: 3,
    title: "Selección de estrategias",
    description: "Selecciona 2 estrategias por cada momento (inicio, desarrollo y cierre) del repositorio EEPE",
    icon: CheckCircle,
    type: "strategies_viewer",
    uses_ai: false,
    template_id: "plantilla6_estrategias_ac4",
    ui_component: "StrategiesViewerStep",
    prev_step: 2,
    next_step: 4
  },
  {
    number: 4,
    title: "Preguntas de Profundización",
    description: "IA formula hasta 3 preguntas para afinar pertinencia, viabilidad y nivel de complejidad",
    icon: HelpCircle,
    type: "profundization",
    uses_ai: true,
    template_id: "plantilla8_profundizacion_ac4",
    ui_component: "ProfundizationStep",
    prev_step: 3,
    next_step: 5
  },
  {
    number: 5,
    title: "Generar Informe de Estrategias",
    description: "Crea el informe justificativo con citas normativas y prepara insumos para el siguiente acelerador",
    icon: FileText,
    type: "report",
    uses_ai: true,
    template_id: "plantilla7_informe_ac4",
    ui_component: "ReportViewerStep",
    prev_step: 4,
    next_step: null
  }
];

const Acelerador4 = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

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
        .eq('acelerador_number', 4)
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
            acelerador_number: 4,
            current_step: 1,
            status: 'in_progress',
            session_data: {}
          })
          .select()
          .single();

        if (createError) throw createError;
        existingSession = newSession;
      }

      // Cache APP_CONFIG_A4 into session_data.app_config (once)
      try {
        let appConfig = (existingSession as any).session_data?.app_config;
        if (!appConfig) {
          const cfg = await getAppConfig<any>("APP_CONFIG_A4");
          if (!cfg) {
            toast({ title: "APP_CONFIG_A4 no encontrada", description: "Se cargó la configuración por defecto (repo y plantilla)." });
            await upsertAppConfig("APP_CONFIG_A4", APP_CONFIG_A4_DEFAULT);
            appConfig = APP_CONFIG_A4_DEFAULT;
          } else {
            appConfig = cfg.data;
          }
          const newData = { ...((existingSession as any).session_data || {}), app_config: appConfig };
          await supabase.from('acelerador_sessions').update({ session_data: newData }).eq('id', (existingSession as any).id);
          (existingSession as any).session_data = newData;
        }
      } catch (e) {
        console.error('Error caching APP_CONFIG_A4:', e);
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

  const updateSession = async (newSession: Session) => {
    if (!newSession) return;

    try {
      const { error } = await supabase
        .from('acelerador_sessions')
        .update({
          current_step: newSession.current_step,
          session_data: newSession.session_data,
          status: newSession.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', newSession.id);

      if (error) throw error;

      setSession(newSession);
      setCurrentStep(newSession.current_step);
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
    if (!session) return;
    const next = Math.min(currentStep + 1, steps.length);
    const updatedSession = {
      ...session,
      current_step: next
    };
    updateSession(updatedSession);
  };

  const prevStep = () => {
    if (!session) return;
    const prev = Math.max(currentStep - 1, 1);
    const updatedSession = {
      ...session,
      current_step: prev
    };
    updateSession(updatedSession);
  };

  const handleRefreshConfig = async () => {
    if (!session) return;
    try {
      setRefreshing(true);
      const cfg = await getAppConfig<any>("APP_CONFIG_A4");
      if (!cfg || !cfg.data?.estrategias_repo?.items?.length || !cfg.data?.plantilla_informe_ac4) {
        await upsertAppConfig("APP_CONFIG_A4", APP_CONFIG_A4_DEFAULT);
        console.log('[A4] upsert APP_CONFIG_A4 (refresh): OK');
      }
      const updatedCfg = await getAppConfig<any>("APP_CONFIG_A4");
      const newAppConfig = updatedCfg?.data ?? APP_CONFIG_A4_DEFAULT;
      const updatedSession = {
        ...session,
        // Keep current step as-is
        session_data: { ...(session.session_data || {}), app_config: newAppConfig }
      };
      await updateSession(updatedSession);
      console.log('[A4] refresh: session_data.app_config reloaded');
      toast({ title: "Configuración recargada" });
    } catch (e) {
      console.error("Error refreshing APP_CONFIG_A4", e);
      toast({ title: "Error", description: "No se pudo recargar la configuración", variant: "destructive" });
    } finally {
      setRefreshing(false);
    }
  };

  const handleReplaceConfig = async () => {
    if (!session) return;
    try {
      setRefreshing(true);
      await upsertAppConfig("APP_CONFIG_A4", APP_CONFIG_A4_DEFAULT);
      console.log('[A4] upsert APP_CONFIG_A4 (replace): OK');
      const updatedCfg = await getAppConfig<any>("APP_CONFIG_A4");
      const newAppConfig = updatedCfg?.data ?? APP_CONFIG_A4_DEFAULT;
      const updatedSession = {
        ...session,
        session_data: { ...(session.session_data || {}), app_config: newAppConfig }
      };
      await updateSession(updatedSession);
      console.log('[A4] replace: session_data.app_config reloaded');
      toast({ title: "Configuración reemplazada" });
    } catch (e) {
      console.error("Error replacing APP_CONFIG_A4", e);
      toast({ title: "Error", description: "No se pudo reemplazar la configuración", variant: "destructive" });
    } finally {
      setRefreshing(false);
    }
  };

  const getStepStatus = (stepNumber: number) => {
    if (stepNumber < currentStep) return 'completed';
    if (stepNumber === currentStep) return 'current';
    return 'pending';
  };

  const renderCurrentStep = () => {
    // Handle case where current_step exceeds available steps
    const stepNumber = Math.min(currentStep, steps.length);
    const step = steps.find(s => s.number === stepNumber);
    if (!step || !session) return null;

    const commonProps = {
      sessionId: session.id,
      onNext: nextStep,
      onPrev: prevStep,
      sessionData: session.session_data || {},
      onUpdateSessionData: (data: any) => {
        const updatedSession = {
          ...session,
          session_data: data
        };
        updateSession(updatedSession);
      },
      step
    };

    // Render component based on ui_component
    switch (step.ui_component) {
      case 'WelcomeWithPrioritiesStep':
        return <WelcomeWithPrioritiesStep {...commonProps} />;
        
      case 'FileUploaderStep':
        return <FileUploaderStep {...commonProps} />;
      
      case 'StaticFormStep':
        return <StaticFormStep {...commonProps} staticData={step.static_data} />;
      
      case 'StrategiesViewerStep':
        return step.template_id ? <StrategiesViewerStep {...commonProps} step={{
          title: step.title,
          description: step.description,
          template_id: step.template_id,
          icon: step.icon
        }} /> : null;
      
      case 'ProfundizationStep':
        return step.template_id ? <ProfundizationStep 
          {...commonProps} 
          onUpdateSession={(data: any) => {
            const updatedSession = { ...session, session_data: data };
            updateSession(updatedSession);
          }}
          step={{
            title: step.title,
            description: step.description,
            template_id: step.template_id
          }} 
        /> : null;
      
      case 'AIAnalysisStep':
        return step.template_id ? <AIAnalysisStep {...commonProps} step={{
          title: step.title,
          description: step.description,
          template_id: step.template_id,
          icon: step.icon
        }} /> : null;
      
      case 'InteractiveChatStep':
        return step.template_id ? <InteractiveChatStep {...commonProps} step={{
          title: step.title,
          description: step.description,
          template_id: step.template_id
        }} /> : null;
      
      case 'ReportViewerStep':
        return step.template_id ? <ReportViewerStep 
          sessionId={session.id}
          onPrev={prevStep}
          sessionData={session.session_data || {}}
          onUpdateSessionData={(data: any) => {
            const updatedSession = { ...session, session_data: data };
            updateSession(updatedSession);
          }}
          step={{
            title: step.title,
            description: step.description,
            template_id: step.template_id
          }}
        /> : null;
      
      default:
        // Welcome step for step 1
        if (currentStep === 1) {
          return (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Bienvenido al Acelerador 4: Selección de Estrategias Metodológicas
                </CardTitle>
                <CardDescription>
                  Este acelerador te guiará para seleccionar 6 estrategias (2 por momento) adaptadas del libro EEPE: Enseñanza de Ecología en el Patio de la Escuela.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">¿Qué lograrás?</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Selección de 6 estrategias pedagógicas alineadas a tu contexto</li>
                    <li>• Estrategias basadas en el libro EEPE y seguridad hídrica</li>
                    <li>• Informe justificativo listo para descargar</li>
                    <li>• Insumos preparados para diseño de unidades didácticas</li>
                  </ul>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Lo que necesitarás:</h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Informe de priorización del Acelerador 3</li>
                    <li>• Información sobre tu contexto educativo (urbano/rural, multigrado, recursos TIC)</li>
                  </ul>
                </div>
                <Button onClick={() => nextStep()} className="w-full">
                  Comenzar selección de estrategias
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          );
        }
        
        // Fallback for development
        const IconComponent = step.icon;
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconComponent className="w-5 h-5" />
                {step.title}
              </CardTitle>
              <CardDescription>
                {step.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8">
                  <div className="text-muted-foreground">
                    <IconComponent className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Paso {step.number}</h3>
                    <p className="text-sm">{step.description}</p>
                    <p className="text-xs mt-4 text-yellow-600">
                      🚧 Componente {step.ui_component} en desarrollo
                    </p>
                  </div>
                </div>
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
            <h1 className="text-2xl font-bold text-primary">Acelerador 4: Selección de Estrategias Metodológicas</h1>
            <p className="text-muted-foreground">
              Paso {currentStep} de {steps.length}: {steps[currentStep - 1]?.title}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReplaceConfig} disabled={refreshing}>
            <RefreshCcw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Reemplazar configuración
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefreshConfig} disabled={refreshing}>
            <RefreshCcw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Actualizar configuración
          </Button>
          <Badge variant="outline" className="gap-2">
            <Clock className="w-4 h-4" />
            En desarrollo
          </Badge>
        </div>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Progreso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={(currentStep / steps.length) * 100} className="h-2" />
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-2">
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

export default Acelerador4;