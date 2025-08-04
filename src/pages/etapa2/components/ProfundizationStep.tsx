import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageSquare, CheckCircle } from 'lucide-react';
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
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [questionsGenerated, setQuestionsGenerated] = useState(false);

  useEffect(() => {
    // Check if questions are already generated
    if (sessionData?.profundization_questions?.length > 0) {
      console.log('Loading existing profundization questions:', sessionData.profundization_questions);
      setQuestions(sessionData.profundization_questions);
      setQuestionsGenerated(true);
      
      // Load existing responses if any
      if (sessionData?.profundization_responses) {
        console.log('Loading existing responses:', sessionData.profundization_responses);
        setResponses(sessionData.profundization_responses);
      }
    } else {
      console.log('No existing questions found, generating new ones...');
      generateQuestions();
    }
  }, [sessionId]);

  const generateQuestions = async () => {
    try {
      setLoading(true);
      console.log('Generating profundization questions...');

      const { data, error } = await supabase.functions.invoke('generate-profundization-questions', {
        body: {
          session_id: sessionId,
          session_data: sessionData,
          template_id: step.template_id
        }
      });

      if (error) {
        throw new Error(error.message || 'Error generating questions');
      }

      if (!data.success || !data.questions) {
        console.error('Invalid response from questions generator:', data);
        throw new Error('Invalid response from questions generator');
      }

      console.log('Generated questions from AI:', data.questions);
      
      // Validate question structure
      const validQuestions = data.questions.filter(q => 
        q && typeof q === 'object' && q.id && q.enfoque && q.pregunta
      );
      
      if (validQuestions.length === 0) {
        console.error('No valid questions found in response:', data.questions);
        throw new Error('No valid questions generated');
      }
      
      console.log('Valid questions to set:', validQuestions);
      setQuestions(validQuestions);
      setQuestionsGenerated(true);

      // Save questions to session
      const updatedData = {
        ...sessionData,
        profundization_questions: data.questions,
        profundization_context: data.context
      };

      onUpdateSession(updatedData);
      toast.success('Preguntas de profundización generadas exitosamente');

    } catch (error) {
      console.error('Error generating questions:', error);
      toast.error('Error al generar las preguntas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (questionId: number, response: string) => {
    const newResponses = { ...responses, [questionId]: response };
    setResponses(newResponses);
    
    // Save responses to session data immediately
    const updatedData = {
      ...sessionData,
      profundization_responses: newResponses
    };
    onUpdateSession(updatedData);
  };

  const canProceed = () => {
    return questions.every(q => responses[q.id]?.trim().length > 0);
  };

  const getEnfoqueColor = (enfoque: string) => {
    switch (enfoque) {
      case 'pertinencia': return 'bg-blue-100 text-blue-800';
      case 'viabilidad': return 'bg-green-100 text-green-800';
      case 'complejidad': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
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

  if (loading) {
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
              <p className="text-muted-foreground">Generando preguntas de profundización...</p>
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
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {step.title}
          </CardTitle>
          <CardDescription>{step.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {questionsGenerated && questions.length > 0 ? (
            <div className="space-y-6">
              <div className="text-sm text-muted-foreground">
                Responde las siguientes preguntas para optimizar las estrategias metodológicas según tu contexto específico:
              </div>
              
              {questions.map((question, index) => (
                <div key={`question-${question.id}-${index}`} className="space-y-3 p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={getEnfoqueColor(question.enfoque)}>
                      {getEnfoqueLabel(question.enfoque)}
                    </Badge>
                    <span className="text-sm font-medium">Pregunta {index + 1}</span>
                  </div>
                  
                  {/* Debug info - remove after fixing */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                      Debug: {JSON.stringify(question, null, 2)}
                    </div>
                  )}
                  
                  <p className="text-sm font-medium">
                    {question.pregunta || `[No question text available - check data structure: ${JSON.stringify(question)}]`}
                  </p>
                  
                  <Textarea
                    placeholder="Escribe tu respuesta aquí..."
                    value={responses[question.id] || ''}
                    onChange={(e) => handleResponseChange(question.id, e.target.value)}
                    className="min-h-[80px]"
                  />
                  
                  {responses[question.id]?.trim() && (
                    <div className="flex items-center gap-1 text-green-600 text-sm">
                      <CheckCircle className="h-4 w-4" />
                      Respondida
                    </div>
                  )}
                </div>
              ))}
              
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
              <p className="text-muted-foreground">No se pudieron generar las preguntas de profundización.</p>
              <Button 
                variant="outline" 
                onClick={generateQuestions}
                className="mt-4"
              >
                Reintentar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev}>
          Anterior
        </Button>
        <Button 
          onClick={onNext}
          disabled={!canProceed()}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
};