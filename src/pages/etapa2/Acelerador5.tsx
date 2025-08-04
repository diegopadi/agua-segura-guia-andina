import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, FileText, CheckCircle, Clock, BookOpen, MessageSquare, FileCheck, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { InsumosStep } from "./components/InsumosStep";
import { QuestionsStep } from "./components/QuestionsStep";
import { DraftRefineStep } from "./components/DraftRefineStep";
import { DeliveryStep } from "./components/DeliveryStep";

interface Session {
  id: string;
  acelerador_number: number;
  current_phase: number;
  status: 'in_progress' | 'completed' | 'paused';
  phase_data: any;
  validations: any;
  created_at: string;
  updated_at: string;
}

const phases = [
  {
    number: 1,
    title: "Recopilación de Insumos",
    description: "Informe A4, Competencias CNEB y PCI",
    icon: BookOpen,
    color: "blue"
  },
  {
    number: 2,
    title: "Preguntas de Diseño",
    description: "10 preguntas clave para la unidad",
    icon: MessageSquare,
    color: "green"
  },
  {
    number: 3,
    title: "Borrador y Refinamiento",
    description: "Chat interactivo para perfeccionar",
    icon: FileText,
    color: "orange"
  },
  {
    number: 4,
    title: "Entrega Final",
    description: "Documento indexado y evidencias",
    icon: Send,
    color: "purple"
  }
];

const Acelerador5 = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPhase, setCurrentPhase] = useState(1);

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
            current_phase: 1,
            status: 'in_progress',
            phase_data: {},
            validations: {}
          })
          .select()
          .single();

        if (createError) throw createError;
        existingSession = newSession;
      }

      setSession(existingSession as Session);
      setCurrentPhase(existingSession.current_phase || 1);
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

  const updateSession = async (phase: number, data: any = {}) => {
    if (!session) return;

    try {
      const { error } = await supabase
        .from('acelerador_sessions')
        .update({
          current_phase: phase,
          phase_data: { ...session.phase_data, ...data },
          updated_at: new Date().toISOString()
        })
        .eq('id', session.id);

      if (error) throw error;

      setSession(prev => prev ? {
        ...prev,
        current_phase: phase,
        phase_data: { ...prev.phase_data, ...data }
      } : null);
      setCurrentPhase(phase);
    } catch (error) {
      console.error('Error updating session:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el progreso",
        variant: "destructive",
      });
    }
  };

  const nextPhase = (data: any = {}) => {
    const next = Math.min(currentPhase + 1, phases.length);
    updateSession(next, data);
  };

  const prevPhase = () => {
    const prev = Math.max(currentPhase - 1, 1);
    updateSession(prev);
  };

  const getPhaseStatus = (phaseNumber: number) => {
    if (phaseNumber < currentPhase) return 'completed';
    if (phaseNumber === currentPhase) return 'current';
    return 'pending';
  };

  const renderCurrentPhase = () => {
    if (!session) return null;

    const sessionId = session.id;
    const sessionData = session.phase_data || {};

    switch (currentPhase) {
      case 1:
        return (
          <InsumosStep 
            sessionId={sessionId}
            onNext={() => nextPhase()}
            onPrev={() => prevPhase()}
            sessionData={sessionData}
            onUpdateSessionData={(data) => updateSession(currentPhase, data)}
          />
        );
      case 2:
        return (
          <QuestionsStep 
            sessionId={sessionId}
            onNext={() => nextPhase()}
            onPrev={() => prevPhase()}
            sessionData={sessionData}
            onUpdateSessionData={(data) => updateSession(currentPhase, data)}
          />
        );
      case 3:
        return (
          <DraftRefineStep 
            sessionId={sessionId}
            onNext={() => nextPhase()}
            onPrev={() => prevPhase()}
            sessionData={sessionData}
            onUpdateSessionData={(data) => updateSession(currentPhase, data)}
          />
        );
      case 4:
        return (
          <DeliveryStep 
            sessionId={sessionId}
            onNext={() => nextPhase()}
            onPrev={() => prevPhase()}
            sessionData={sessionData}
            onUpdateSessionData={(data) => updateSession(currentPhase, data)}
          />
        );
      default:
        return (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Fase completada</h3>
                <p className="text-sm">
                  Has completado todas las fases del Acelerador 5.
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
              Fase {currentPhase} de {phases.length}: {phases[currentPhase - 1]?.title}
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="gap-2">
          <FileCheck className="w-4 h-4" />
          Optimizado
        </Badge>
      </div>

      {/* Progress Phases */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Progreso por Fases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={(currentPhase / phases.length) * 100} className="h-3" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {phases.map((phase) => {
                const status = getPhaseStatus(phase.number);
                const IconComponent = phase.icon;
                return (
                  <div
                    key={phase.number}
                    className={`p-4 rounded-lg border text-center transition-all duration-200 ${
                      status === 'completed'
                        ? 'bg-green-50 border-green-200 text-green-700 shadow-sm'
                        : status === 'current'
                        ? 'bg-blue-50 border-blue-200 text-blue-700 ring-2 ring-blue-100'
                        : 'bg-muted border-muted-foreground/20 text-muted-foreground'
                    }`}
                  >
                    <div className="flex justify-center mb-2">
                      {status === 'completed' ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <IconComponent className="w-6 h-6" />
                      )}
                    </div>
                    <p className="text-sm font-medium mb-1">{phase.title}</p>
                    <p className="text-xs opacity-80">{phase.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Phase Content */}
      {renderCurrentPhase()}
    </div>
  );
};

export default Acelerador5;