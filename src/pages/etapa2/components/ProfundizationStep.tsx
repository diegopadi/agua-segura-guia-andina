import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, MessageSquare, CheckCircle, RefreshCw } from 'lucide-react';

import { toast } from 'sonner';

interface Question {
  id: number;
  enfoque: string;
  pregunta: string;
}

interface ProfundizationStepProps {
  sessionId: string;
  sessionData: any;
  onNext: () => void;
  onPrev: () => void;
  onUpdateSession: (data: any) => void;
  step: {
    title: string;
    description: string;
    template_id: string;
  };
}

export const ProfundizationStep: React.FC<ProfundizationStepProps> = ({
  sessionId,
  sessionData,
  onNext,
  onPrev,
  onUpdateSession,
  step
}) => {
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [questionsGenerated, setQuestionsGenerated] = useState(false);

  useEffect(() => {
    // Base strategies (adapted if available, else selected)
    const baseStrategies = sessionData?.strategies_adapted?.strategies || sessionData?.strategies_result?.strategies || [];
    if (baseStrategies.length > 0) {
      const fixed = buildFixedQuestions();
      setQuestions(fixed);
      setQuestionsGenerated(true);
      console.log(`[A4][Profundization] Preparadas ${fixed.length} preguntas universales para ${baseStrategies.length} estrategias`);
      if (sessionData?.profundization_global_flat) {
        setResponses(sessionData.profundization_global_flat || {});
      }
    } else {
      setQuestions([]);
      setQuestionsGenerated(false);
    }
  }, [sessionId]);

  const buildFixedQuestions = (): Question[] => ([
    { id: 1, enfoque: 'pertinencia', pregunta: '¿Por qué estas estrategias son pertinentes para tu contexto y prioridades?' },
    { id: 2, enfoque: 'viabilidad', pregunta: '¿Qué recursos concretos (TIC y no TIC) usarás y cómo asegurarás su disponibilidad?' },
    { id: 3, enfoque: 'riesgos', pregunta: '¿Qué riesgos u obstáculos anticipas y cómo los mitigarás?' },
    { id: 4, enfoque: 'evaluacion', pregunta: '¿Qué evidencias recogerás para evaluar su implementación y resultados?' },
    { id: 5, enfoque: 'inclusion', pregunta: '¿Cómo asegurarás inclusión y participación (p. ej., EIB/multigrado)?' },
  ]);

  const generateQuestions = async () => {
    try {
      setLoading(true);
      const fixed = buildFixedQuestions();
      setQuestions(fixed);
      setQuestionsGenerated(true);
      const updatedData = { ...sessionData, profundization_questions: fixed };
      onUpdateSession(updatedData);
      console.log(`[A4][Profundization] Preparadas ${fixed.length} preguntas universales`);
      toast.success('Preguntas preparadas');
    } catch (error: any) {
      console.error('Error generating questions:', error);
      toast.error('Error al preparar preguntas');
    } finally {
      setLoading(false);
    }
  };

  const regenerateQuestions = async () => {
    try {
      setRegenerating(true);
      setResponses({});
      await generateQuestions();
      const updatedData = { ...sessionData, profundization_global: {}, profundization_global_flat: {} };
      onUpdateSession(updatedData);
      toast.success('Preguntas regeneradas exitosamente');
    } catch (error: any) {
      console.error('Error regenerating questions:', error);
      toast.error('Error al regenerar las preguntas');
    } finally {
      setRegenerating(false);
    }
  };

  const handleResponseChange = (questionId: number, response: string) => {
    const newResponses = { ...responses, [questionId]: response };
    setResponses(newResponses);

    const structuredGlobal: any = {};
    Object.entries(newResponses).forEach(([qid, text]) => {
      const q = questions.find(q => q.id === Number(qid));
      if (!q) return;
      structuredGlobal[q.enfoque] = text;
    });

    const updatedData = { ...sessionData, profundization_global: structuredGlobal, profundization_global_flat: newResponses };
    onUpdateSession(updatedData);
  };

  const canProceed = () => {
    return questions.every(q => responses[q.id]?.trim().length > 0);
  };

  const getEnfoqueColor = (enfoque: string) => {
    switch (enfoque) {
      case 'pertinencia': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'viabilidad': return 'bg-green-50 text-green-700 border-green-200';
      case 'riesgos': return 'bg-red-50 text-red-700 border-red-200';
      case 'evaluacion': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'inclusion': return 'bg-pink-50 text-pink-700 border-pink-200';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getEnfoqueLabel = (enfoque: string) => {
    switch (enfoque) {
      case 'pertinencia': return 'Pertinencia Contextual';
      case 'viabilidad': return 'Viabilidad de Recursos';
      case 'riesgos': return 'Riesgos y mitigación';
      case 'evaluacion': return 'Evaluación y evidencias';
      case 'inclusion': return 'Inclusión y participación';
      default: return enfoque;
    }
  };

  if (loading || regenerating) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            {step.title}
          </CardTitle>
          <CardDescription>{step.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">
                {regenerating ? 'Regenerando preguntas de profundización...' : 'Generando preguntas de profundización...'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                {step.title}
              </CardTitle>
              <CardDescription>{step.description}</CardDescription>
            </div>
            {questionsGenerated && questions.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Regenerar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Regenerar preguntas?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esto generará nuevas preguntas de profundización. Las respuestas actuales se perderán. ¿Estás seguro de que quieres continuar?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={regenerateQuestions}>
                      Regenerar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {questionsGenerated && questions.length > 0 ? (
            <div className="space-y-6">
              <div className="text-sm text-muted-foreground">
                Responde las siguientes preguntas para optimizar las estrategias metodológicas según tu contexto específico:
              </div>
              <div className="space-y-6">
                {questions.map((question, index) => (
                  <div key={`question-${question.id}-${index}`} className="space-y-3 p-6 border rounded-lg bg-card">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={getEnfoqueColor(question.enfoque)}>
                          {getEnfoqueLabel(question.enfoque)}
                        </Badge>
                        <span className="text-sm font-medium text-muted-foreground">Pregunta {question.id}</span>
                      </div>
                      {responses[question.id]?.trim() && (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <p className="text-foreground leading-relaxed">{question.pregunta}</p>
                    <Textarea
                      placeholder="Escribe tu respuesta detallada aquí..."
                      value={responses[question.id] || ''}
                      onChange={(e) => handleResponseChange(question.id, e.target.value)}
                      className="min-h-[100px] resize-none"
                    />
                  </div>
                ))}
              </div>
              {questions.length > 0 && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Progreso:</strong> {Object.keys(responses).filter(k => responses[k]?.trim()).length} de {questions.length} preguntas respondidas
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Prepara las 5 preguntas de profundización universales.</p>
              <Button 
                variant="outline" 
                onClick={generateQuestions}
                className="mt-4"
              >
                Preparar preguntas
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between gap-2 flex-wrap">
        <Button variant="outline" onClick={onPrev}>
          Anterior
        </Button>
        <div className="flex gap-2">
          <Button 
            onClick={onNext}
            disabled={!canProceed()}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
};