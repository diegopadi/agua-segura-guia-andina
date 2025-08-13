import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { A5SituationPurposeData } from "./types";

interface Props {
  data: A5SituationPurposeData;
  onChange: (data: A5SituationPurposeData) => void;
  onNext: () => void;
  onPrev: () => void;
}

const demo = {
  situacion: "Situación significativa ficticia de ejemplo relacionada con seguridad hídrica.",
  proposito: "Propósito preliminar para orientar el aprendizaje durante la unidad.",
  reto: "Reto planteado para que los estudiantes apliquen lo aprendido en su contexto.",
  producto: "Producto esperado: informe, prototipo o presentación.",
};

export default function Step3SituationPurpose({ data, onChange, onNext, onPrev }: Props) {
  const generate = () => {
    onChange({ ...demo, producto: demo.producto + " (versión " + new Date().toLocaleTimeString() + ")" });
    toast({ title: "Generado con IA (demo)", description: "Contenido ficticio actualizado." });
  };
  const save = () => toast({ title: "Guardado", description: "Se almacenará más adelante." });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Situación significativa y propósitos de aprendizaje</CardTitle>
        <CardDescription>Aquí generaremos con IA: la situación significativa, el propósito, el reto y el producto de la Unidad de Aprendizaje.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium mb-2">Situación significativa</p>
            <Textarea rows={6} value={data.situacion} onChange={(e) => onChange({ ...data, situacion: e.target.value })} />
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Propósito</p>
            <Textarea rows={6} value={data.proposito} onChange={(e) => onChange({ ...data, proposito: e.target.value })} />
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Reto</p>
            <Textarea rows={6} value={data.reto} onChange={(e) => onChange({ ...data, reto: e.target.value })} />
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Producto</p>
            <Textarea rows={6} value={data.producto} onChange={(e) => onChange({ ...data, producto: e.target.value })} />
          </div>
        </div>

        <div className="flex justify-between gap-2 pt-2">
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
