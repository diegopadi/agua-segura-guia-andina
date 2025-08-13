import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, MessageSquare, CheckCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
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
      const fixed = buildFixedQuestions(baseStrategies);
      setQuestions(fixed);
      setQuestionsGenerated(true);
      console.log(`[A4][Profundization] Prepared ${fixed.length} questions for ${baseStrategies.length} strategies (3 c/u)`);
      if (sessionData?.profundization_responses) {
        setResponses(sessionData.profundization_responses_flat || {});
      }
    } else {
      setQuestions([]);
      setQuestionsGenerated(false);
    }
  }, [sessionId]);

  const buildFixedQuestions = (strategies: any[]): Question[] => {
    const qs: Question[] = [];
    let idCounter = 1;
    strategies.forEach((_s, idx) => {
      qs.push({ id: idCounter++, enfoque: 'pertinencia', pregunta: `E${idx+1}. ¿Cómo asegurar pertinencia cultural/contextual para esta estrategia?` });
      qs.push({ id: idCounter++, enfoque: 'viabilidad', pregunta: `E${idx+1}. ¿Qué recursos (TIC y no TIC) concretos usarás y cómo los garantizarás?` });
      qs.push({ id: idCounter++, enfoque: 'complejidad', pregunta: `E${idx+1}. ¿Qué ajustes harás para el nivel de complejidad y andamiajes?` });
    });
    return qs;
  };

  const generateQuestions = async () => {
    try {
      setLoading(true);
      const baseStrategies = sessionData?.strategies_adapted?.strategies || sessionData?.strategies_result?.strategies || [];
      const fixed = buildFixedQuestions(baseStrategies);
      setQuestions(fixed);
      setQuestionsGenerated(true);
      const updatedData = { ...sessionData, profundization_questions: fixed };
      onUpdateSession(updatedData);
      console.log(`[A4][Profundization] Prepared ${fixed.length} questions for ${baseStrategies.length} strategies (3 c/u)`);
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
      const updatedData = { ...sessionData, profundization_responses: {}, profundization_responses_flat: {} };
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
    // Build structured responses grouped by strategy index
    const structured: any = {};
    Object.entries(newResponses).forEach(([qid, text]) => {
      const q = questions.find(q => q.id === Number(qid));
      if (!q) return;
      const strategyIdx = Math.ceil(Number(qid) / 3); // 3 preguntas por estrategia
      const enfoque = q.enfoque;
      if (!structured[strategyIdx]) structured[strategyIdx] = { pertinencia: '', viabilidad: '', complejidad: '' };
      structured[strategyIdx][enfoque] = text;
    });
    const updatedData = { ...sessionData, profundization_responses: structured, profundization_responses_flat: newResponses };
    onUpdateSession(updatedData);
  };

  const canProceed = () => {
    return questions.every(q => responses[q.id]?.trim().length > 0);
  };

  const getEnfoqueColor = (enfoque: string) => {
    switch (enfoque) {
      case 'pertinencia': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'viabilidad': return 'bg-green-50 text-green-700 border-green-200';
      case 'complejidad': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getEnfoqueLabel = (enfoque: string) => {
    switch (enfoque) {
      case 'pertinencia': return 'Pertinencia Cultural';
      case 'viabilidad': return 'Viabilidad de Recursos';
      case 'complejidad': return 'Nivel de Complejidad';
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
              {(() => {
                const baseStrategies = sessionData?.strategies_adapted?.strategies || sessionData?.strategies_result?.strategies || [];
                return (
                  <div className="space-y-8">
                    {baseStrategies.map((s: any, sIdx: number) => {
                      const startId = sIdx * 3 + 1;
                      const groupQs = [startId, startId + 1, startId + 2]
                        .map((id) => questions.find((q) => q.id === id))
                        .filter(Boolean) as Question[];
                      return (
                        <div key={`strategy-${sIdx}`} className="space-y-4 p-6 border rounded-lg bg-card">
                          <h3 className="text-base font-semibold">
                            {s?.title || s?.nombre || `Estrategia ${sIdx + 1}`}
                          </h3>
                          {groupQs.map((question, index) => (
                            <div key={`question-${question.id}-${index}`} className="space-y-3">
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
                      );
                    })}
                  </div>
                );
              })()}
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
              <p className="text-muted-foreground">Prepara las preguntas de profundización para cada estrategia.</p>
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
            variant="secondary"
            onClick={async () => {
              try {
                setLoading(true);
                const usedAdapted = Array.isArray(sessionData?.strategies_adapted?.strategies) && sessionData.strategies_adapted.strategies.length > 0;
                const baseStrategies = usedAdapted ? sessionData.strategies_adapted.strategies : (sessionData?.strategies_result?.strategies || []);
                const payloadSummary = {
                  strategies: baseStrategies.length,
                  responses: Object.keys(sessionData?.profundization_responses || {}).length,
                  contexto: Object.keys(sessionData?.contexto || {}).length,
                };
                console.log('[A4][Profundization] Adapt payload:', payloadSummary);
                const { data, error } = await supabase.functions.invoke('adapt-ac4-strategies', {
                  body: {
                    session_id: sessionId,
                    strategies: baseStrategies,
                    responses: sessionData?.profundization_responses,
                    contexto: sessionData?.contexto,
                  }
                });
                if (error) throw error;
                const adapted = { source: 'adapted', strategies: data?.strategies || baseStrategies };
                onUpdateSession({ ...sessionData, strategies_adapted: adapted });
                toast.success('Estrategias adaptadas con tus respuestas');
              } catch (e: any) {
                console.error(e);
                toast.error('No se pudo adaptar las estrategias');
              } finally {
                setLoading(false);
              }
            }}
            disabled={!canProceed()}
          >
            Adaptar estrategias
          </Button>
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