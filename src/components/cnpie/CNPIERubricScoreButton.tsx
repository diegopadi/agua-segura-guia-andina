import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, Loader2 } from "lucide-react";
import { CNPIERubricScoreModal } from "./CNPIERubricScoreModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CNPIERubricScoreButtonProps {
  proyectoId: string;
  categoria: '2A' | '2B' | '2C';
  datosProyecto: any;
}

export function CNPIERubricScoreButton({
  proyectoId,
  categoria,
  datosProyecto
}: CNPIERubricScoreButtonProps) {
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);

  const hasData = datosProyecto && Object.keys(datosProyecto).length > 0;

  const handleEvaluate = async () => {
    if (!hasData) {
      toast({
        title: "Sin datos",
        description: "Primero debes guardar tu información para poder evaluarla",
        variant: "destructive"
      });
      return;
    }

    try {
      setEvaluating(true);
      setShowModal(true);

      const { data, error } = await supabase.functions.invoke('evaluate-cnpie-project', {
        body: {
          proyectoId,
          categoria,
          datosActuales: datosProyecto
        }
      });

      if (error) throw error;

      if (data.success) {
        setEvaluation(data.evaluation);
      } else {
        throw new Error(data.error || 'Error en la evaluación');
      }
    } catch (error: any) {
      console.error('Error evaluating project:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo realizar la evaluación",
        variant: "destructive"
      });
      setShowModal(false);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleEvaluate}
        disabled={!hasData || evaluating}
        className="fixed bottom-24 right-6 z-40 shadow-lg h-14 px-6"
        size="lg"
      >
        {evaluating ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Evaluando...
          </>
        ) : (
          <>
            <Target className="w-5 h-5 mr-2" />
            Evaluar con Rúbrica
            {evaluation && (
              <Badge className="ml-2" variant="secondary">
                {evaluation.porcentaje_cumplimiento}%
              </Badge>
            )}
          </>
        )}
      </Button>

      <CNPIERubricScoreModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        evaluation={evaluation}
        loading={evaluating}
        categoria={categoria}
      />
    </>
  );
}
