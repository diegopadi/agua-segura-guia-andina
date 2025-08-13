import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { A5FeedbackData } from "./types";

interface Props {
  data: A5FeedbackData;
  onChange: (data: A5FeedbackData) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function Step6Feedback({ data, onChange, onNext, onPrev }: Props) {
  const generate = () => {
    onChange({ feedback: "Recomendaciones ficticias para mejorar la Unidad de Aprendizaje en coherencia con los datos ingresados." });
    toast({ title: "Retroalimentación generada (demo)", description: "Contenido ficticio listo para revisar." });
  };
  const save = () => toast({ title: "Guardado", description: "Se almacenará más adelante." });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Retroalimentación personalizada</CardTitle>
        <CardDescription>La IA propondrá recomendaciones para mejorar tu Unidad de Aprendizaje basándose en la información previa.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea rows={10} value={data.feedback} onChange={(e) => onChange({ feedback: e.target.value })} />
        <div className="flex justify-between gap-2">
          <Button variant="outline" onClick={onPrev}>Atrás</Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={generate}>Generar con IA</Button>
            <Button variant="secondary" onClick={generate}>Re-generar</Button>
            <Button variant="secondary" onClick={save}>Guardar</Button>
            <Button onClick={onNext}>Siguiente</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
