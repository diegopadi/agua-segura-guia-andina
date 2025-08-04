import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Bot, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface AIAnalysisStepProps {
  sessionId: string;
  onNext: () => void;
  onPrev: () => void;
  sessionData: any;
  onUpdateSessionData: (data: any) => void;
  step: {
    title: string;
    description: string;
    template_id: string;
    icon: any;
  };
}

export const AIAnalysisStep: React.FC<AIAnalysisStepProps> = ({
  sessionId,
  onNext,
  onPrev,
  sessionData,
  onUpdateSessionData,
  step
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(sessionData?.ai_analysis_result || null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Auto-start analysis if no result exists
    if (!result && !loading) {
      handleAnalysis();
    }
  }, []);

  const handleAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      // Determine which edge function to call based on template_id
      let functionName = '';
      switch (step.template_id) {
        case 'plantilla6_estrategias_ac4':
          functionName = 'generate-strategies-ac4';
          break;
        case 'plantilla8_profundizacion_ac4':
          functionName = 'generate-profundization-questions';
          break;
        case 'plantilla7_informe_ac4':
          functionName = 'generate-strategies-report';
          break;
        default:
          throw new Error(`Template ${step.template_id} no reconocido`);
      }

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          session_id: sessionId,
          session_data: sessionData,
          template_id: step.template_id
        }
      });

      if (error) throw error;

      setResult(data);
      onUpdateSessionData({
        ...sessionData,
        ai_analysis_result: data
      });

      toast({
        title: "Análisis completado",
        description: "El análisis de IA ha sido generado exitosamente."
      });

    } catch (error: any) {
      console.error('Error in AI analysis:', error);
      setError(error.message || 'Error al procesar el análisis');
      toast({
        title: "Error en el análisis",
        description: error.message || "Hubo un problema al procesar el análisis.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const IconComponent = step.icon;

  return (
    <div className="space-y-6">
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
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <div className="text-center">
                <h3 className="font-medium">Procesando con IA...</h3>
                <p className="text-sm text-muted-foreground">
                  Esto puede tomar unos momentos
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <div className="text-destructive mb-4">
                <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <h3 className="font-medium">Error en el análisis</h3>
                <p className="text-sm">{error}</p>
              </div>
              <Button onClick={handleAnalysis} variant="outline">
                Reintentar análisis
              </Button>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Análisis completado</span>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Resultado del análisis:</h4>
                {typeof result.content === 'string' ? (
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm">{result.content}</pre>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {result.strategies && (
                      <div>
                        <h5 className="font-medium">Estrategias generadas:</h5>
                        <ul className="list-disc list-inside space-y-1">
                          {result.strategies.map((strategy: string, index: number) => (
                            <li key={index} className="text-sm">{strategy}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {result.questions && (
                      <div>
                        <h5 className="font-medium">Preguntas de profundización:</h5>
                        <ul className="list-disc list-inside space-y-1">
                          {result.questions.map((question: string, index: number) => (
                            <li key={index} className="text-sm">{question}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
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
          disabled={loading || !result}
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};