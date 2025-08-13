import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { A5CompetenciesData } from "./types";

interface Props {
  data: A5CompetenciesData;
  onChange: (data: A5CompetenciesData) => void;
  onNext: () => void;
  onPrev: () => void;
}

const competenciasOpc = ["Competencia 1", "Competencia 2", "Competencia 3"];
const enfoquesOpc = ["Enfoque 1", "Enfoque 2", "Enfoque 3"];

export default function Step4Competencies({ data, onChange, onNext, onPrev }: Props) {
  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const save = () => toast({ title: "Selección guardada", description: "Se integrará al documento final." });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Competencias y enfoques transversales</CardTitle>
        <CardDescription>Selecciona las competencias y enfoques transversales desde el catálogo del Currículo Nacional.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-sm font-medium mb-3">Competencias</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {competenciasOpc.map((c) => (
              <label key={c} className="flex items-center gap-2">
                <Checkbox
                  checked={data.competencias.includes(c)}
                  onCheckedChange={() => onChange({ ...data, competencias: toggle(data.competencias, c) })}
                />
                <span className="text-sm">{c}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-3">Enfoques transversales</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {enfoquesOpc.map((e) => (
              <label key={e} className="flex items-center gap-2">
                <Checkbox
                  checked={data.enfoques.includes(e)}
                  onCheckedChange={() => onChange({ ...data, enfoques: toggle(data.enfoques, e) })}
                />
                <span className="text-sm">{e}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-between gap-2">
          <Button variant="outline" onClick={onPrev}>Atrás</Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={save}>Guardar</Button>
            <Button onClick={onNext}>Siguiente</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
