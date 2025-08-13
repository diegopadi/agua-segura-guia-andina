import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { A5FeedbackData } from "./types";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  data: A5FeedbackData;
  onChange: (data: A5FeedbackData) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function Step6Feedback({ data, onChange, onNext, onPrev }: Props) {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [infoData, setInfoData] = useState<any>(null);
  const [situationData, setSituationData] = useState<any>(null);
  const [competenciesData, setCompetenciesData] = useState<any>(null);
  const [sessionsData, setSessionsData] = useState<any>(null);

  // Cargar datos de pasos anteriores
  useEffect(() => {
    const loadPreviousStepsData = async () => {
      if (!user?.id) return;

      try {
        const { data: sessionData, error } = await supabase
          .from('acelerador_sessions')
          .select('session_data')
          .eq('user_id', user.id)
          .eq('acelerador_number', 5)
          .single();

        if (error) throw error;

        const sessionInfo = sessionData?.session_data as any || {};
        setInfoData(sessionInfo.info || null);
        setSituationData(sessionInfo.situation || null);
        setCompetenciesData(sessionInfo.comp || null);
        setSessionsData(sessionInfo.sessions || null);
      } catch (error) {
        console.error('Error loading previous steps data:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos de pasos anteriores",
          variant: "destructive",
        });
      }
    };

    loadPreviousStepsData();
  }, [user?.id]);

  const generate = async () => {
    if (!infoData || !situationData || !competenciesData || !sessionsData) {
      toast({
        title: "Error",
        description: "Faltan datos de pasos anteriores. Completa los pasos 2, 3, 4 y 5 primero.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data: result, error } = await supabase.functions.invoke('generate-feedback-ac5', {
        body: {
          infoData,
          situationData,
          competenciesData,
          sessionsData
        }
      });

      if (error) throw error;

      if (result.success) {
        onChange({ feedback: result.feedback });
        toast({
          title: "Retroalimentación generada",
          description: "La IA ha analizado tu unidad y generado recomendaciones personalizadas.",
        });
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error generating feedback:', error);
      toast({
        title: "Error",
        description: "No se pudo generar la retroalimentación. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const save = () => {
    toast({ title: "Guardado", description: "Retroalimentación guardada automáticamente." });
  };

  // Verificar si tenemos todos los datos necesarios
  const canGenerate = infoData && situationData && competenciesData && sessionsData;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Retroalimentación personalizada</CardTitle>
        <CardDescription>
          La IA analizará todos los insumos de tu Unidad de Aprendizaje y generará recomendaciones pedagógicas específicas para fortalecerla.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!canGenerate && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
            <p className="text-sm text-yellow-800">
              <strong>Nota:</strong> Necesitas completar los pasos anteriores (2, 3, 4 y 5) para generar retroalimentación personalizada.
            </p>
          </div>
        )}
        
        <Textarea 
          rows={12} 
          value={data.feedback} 
          onChange={(e) => onChange({ feedback: e.target.value })}
          placeholder="La retroalimentación generada por la IA aparecerá aquí. Podrás editarla directamente si lo deseas."
          className="min-h-[300px]"
        />
        
        <div className="flex justify-between gap-2">
          <Button variant="outline" onClick={onPrev}>Atrás</Button>
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              onClick={generate}
              disabled={!canGenerate || isGenerating}
            >
              {isGenerating ? "Generando..." : "Generar con IA"}
            </Button>
            <Button 
              variant="secondary" 
              onClick={generate}
              disabled={!canGenerate || isGenerating || !data.feedback}
            >
              Re-generar
            </Button>
            <Button variant="secondary" onClick={save}>Guardar</Button>
            <Button onClick={onNext}>Siguiente</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
