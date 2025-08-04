import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HelpCircle, CheckCircle, AlertTriangle, Loader2, Lightbulb, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface QuestionsStepProps {
  sessionId: string;
  onNext: () => void;
  onPrev: () => void;
  sessionData: any;
  onUpdateSessionData: (data: any) => void;
}

interface Question {
  id: number;
  categoria: string;
  pregunta: string;
  descripcion?: string;
  respuesta?: string;
  isValid?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  proposito: 'bg-blue-100 text-blue-800 border-blue-200',
  contenidos: 'bg-green-100 text-green-800 border-green-200',
  metodologia: 'bg-purple-100 text-purple-800 border-purple-200',
  evaluacion: 'bg-orange-100 text-orange-800 border-orange-200',
  recursos: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  temporalizacion: 'bg-pink-100 text-pink-800 border-pink-200',
  diferenciacion: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  contextualizacion: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  integracion: 'bg-teal-100 text-teal-800 border-teal-200',
  proyeccion: 'bg-red-100 text-red-800 border-red-200',
};

const CATEGORY_NAMES: Record<string, string> = {
  proposito: 'Propósito',
  contenidos: 'Contenidos',
  metodologia: 'Metodología',
  evaluacion: 'Evaluación',
  recursos: 'Recursos',
  temporalizacion: 'Temporalización',
  diferenciacion: 'Diferenciación',
  contextualizacion: 'Contextualización',
  integracion: 'Integración',
  proyeccion: 'Proyección',
};

export const QuestionsStep: React.FC<QuestionsStepProps> = ({
  sessionId,
  onNext,
  onPrev,
  sessionData,
  onUpdateSessionData,
}) => {
  const { toast } = useToast();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [autoSaving, setAutoSaving] = useState(false);

  useEffect(() => {
    // Cargar datos existentes o generar preguntas
    if (sessionData?.phase_data?.preguntas?.questions) {
      setQuestions(sessionData.phase_data.preguntas.questions);
      const existingResponses = sessionData.phase_data.preguntas.responses || {};
      setResponses(existingResponses);
    } else {
      generateKeyQuestions();
    }
  }, [sessionId, sessionData]);

  const generateKeyQuestions = async () => {
    setGeneratingQuestions(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-profundization-questions', {
        body: {
          session_id: sessionId,
          template_id: 'plantilla9_preguntas_clave',
          session_data: sessionData
        }
      });

      if (error) throw error;

      if (data?.preguntas) {
        const formattedQuestions: Question[] = data.preguntas.map((q: any, index: number) => ({
          id: q.id || index + 1,
          categoria: q.categoria || 'general',
          pregunta: q.pregunta,
          descripcion: q.descripcion,
          respuesta: '',
          isValid: false
        }));

        setQuestions(formattedQuestions);
        
        // Guardar preguntas en la sesión
        const updatedSessionData = {
          ...sessionData,
          phase_data: {
            ...sessionData.phase_data,
            preguntas: {
              questions: formattedQuestions,
              responses: {},
              generated_at: new Date().toISOString()
            }
          }
        };
        
        onUpdateSessionData(updatedSessionData);
        
        toast({
          title: "Preguntas generadas",
          description: `Se generaron ${formattedQuestions.length} preguntas clave para tu unidad didáctica`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron generar las preguntas. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handleResponseChange = (questionId: number, response: string) => {
    const newResponses = { ...responses, [questionId]: response };
    setResponses(newResponses);
    
    // Validar respuesta (mínimo 10 caracteres para considerar válida)
    const updatedQuestions = questions.map(q => 
      q.id === questionId 
        ? { ...q, respuesta: response, isValid: response.trim().length >= 10 }
        : q
    );
    setQuestions(updatedQuestions);
    
    // Auto-guardar después de 2 segundos de inactividad
    clearTimeout((window as any).autoSaveTimeout);
    (window as any).autoSaveTimeout = setTimeout(() => {
      autoSaveResponses(newResponses, updatedQuestions);
    }, 2000);
  };

  const autoSaveResponses = async (newResponses: Record<number, string>, updatedQuestions: Question[]) => {
    setAutoSaving(true);
    try {
      const updatedSessionData = {
        ...sessionData,
        phase_data: {
          ...sessionData.phase_data,
          preguntas: {
            ...sessionData.phase_data?.preguntas,
            questions: updatedQuestions,
            responses: newResponses,
            last_saved: new Date().toISOString()
          }
        }
      };
      
      onUpdateSessionData(updatedSessionData);
    } catch (error) {
      console.error('Error auto-saving:', error);
    } finally {
      setAutoSaving(false);
    }
  };

  const getProgressPercentage = () => {
    const validResponses = questions.filter(q => q.isValid).length;
    return questions.length > 0 ? (validResponses / questions.length) * 100 : 0;
  };

  const getCompletedCount = () => {
    return questions.filter(q => q.isValid).length;
  };

  const isPhaseComplete = () => {
    return questions.length > 0 && questions.every(q => q.isValid);
  };

  const getCategoryQuestions = (category: string) => {
    return questions.filter(q => q.categoria === category);
  };

  const getUniqueCategories = () => {
    return [...new Set(questions.map(q => q.categoria))];
  };

  if (generatingQuestions) {
    return (
      <Card className="w-full">
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
            <div>
              <h3 className="text-lg font-semibold">Generando preguntas clave</h3>
              <p className="text-muted-foreground">
                Analizando tus estrategias, competencias y contexto institucional para crear 10 preguntas específicas...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con progreso */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Fase 2: Diseño de Preguntas Clave
              </CardTitle>
              <CardDescription>
                Responde las preguntas para diseñar tu unidad didáctica de manera estructurada
              </CardDescription>
            </div>
            {autoSaving && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Save className="h-4 w-4 animate-pulse" />
                Guardando...
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progreso de respuestas</span>
              <span>{getCompletedCount()} de {questions.length} completadas</span>
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      {questions.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No hay preguntas disponibles</h3>
            <p className="text-muted-foreground mb-4">
              Parece que hubo un problema al generar las preguntas. 
            </p>
            <Button onClick={generateKeyQuestions} variant="outline">
              <Lightbulb className="h-4 w-4 mr-2" />
              Regenerar preguntas
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Alert informativo */}
      {questions.length > 0 && (
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertDescription>
            Estas preguntas fueron generadas específicamente para tu contexto. 
            Respóndelas con detalle para obtener una unidad didáctica más personalizada.
            <strong> Las respuestas se guardan automáticamente.</strong>
          </AlertDescription>
        </Alert>
      )}

      {/* Preguntas agrupadas por categoría */}
      {getUniqueCategories().map(category => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge className={CATEGORY_COLORS[category] || 'bg-gray-100 text-gray-800'}>
                {CATEGORY_NAMES[category] || category}
              </Badge>
              <span className="text-sm text-muted-foreground">
                ({getCategoryQuestions(category).filter(q => q.isValid).length}/{getCategoryQuestions(category).length} completadas)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {getCategoryQuestions(category).map((question, index) => (
              <div key={question.id} className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {question.isValid ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                    )}
                  </div>
                  <div className="flex-grow space-y-2">
                    <div>
                      <h4 className="font-medium text-sm leading-relaxed">
                        {question.pregunta}
                      </h4>
                      {question.descripcion && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {question.descripcion}
                        </p>
                      )}
                    </div>
                    
                    <Textarea
                      placeholder="Escribe tu respuesta aquí... (mínimo 10 caracteres)"
                      value={responses[question.id] || ''}
                      onChange={(e) => handleResponseChange(question.id, e.target.value)}
                      className={`min-h-[100px] text-sm ${
                        question.isValid 
                          ? 'border-green-200 bg-green-50/50' 
                          : responses[question.id]?.length > 0 
                            ? 'border-amber-200 bg-amber-50/50' 
                            : ''
                      }`}
                    />
                    
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>
                        {responses[question.id]?.length || 0} caracteres
                      </span>
                      {responses[question.id]?.length > 0 && responses[question.id]?.length < 10 && (
                        <span className="text-amber-600">
                          Respuesta muy corta (mínimo 10 caracteres)
                        </span>
                      )}
                      {question.isValid && (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Completa
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Resumen y navegación */}
      {questions.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="font-medium">Resumen de respuestas</h4>
                <p className="text-sm text-muted-foreground">
                  {getCompletedCount()} de {questions.length} preguntas respondidas
                  {isPhaseComplete() && (
                    <span className="text-green-600 ml-2">• Todas las preguntas completadas</span>
                  )}
                </p>
              </div>
              
              {!isPhaseComplete() && (
                <div className="text-right text-xs text-muted-foreground">
                  <p>Responde todas las preguntas</p>
                  <p>para continuar al siguiente paso</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navegación */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev}>
          Anterior
        </Button>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={generateKeyQuestions}
            disabled={generatingQuestions}
          >
            {generatingQuestions ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Lightbulb className="h-4 w-4 mr-2" />
            )}
            Regenerar preguntas
          </Button>
          
          <Button 
            onClick={onNext} 
            disabled={!isPhaseComplete()}
            className="flex items-center gap-2"
          >
            {isPhaseComplete() ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Generar Borrador de Unidad
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4" />
                Completa todas las preguntas
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};