import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { A5InfoData } from "./types";

interface Props {
  data: A5InfoData;
  onChange: (data: A5InfoData) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function Step2Info({ data, onChange, onNext, onPrev }: Props) {
  const save = () => toast({ title: "Datos guardados", description: "Se guardará más adelante en la base de datos." });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos informativos</CardTitle>
        <CardDescription>Completa la información para identificar tu Unidad de Aprendizaje.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Institución educativa</Label>
            <Input value={data.institucion} onChange={(e) => onChange({ ...data, institucion: e.target.value })} />
          </div>
          <div>
            <Label>Distrito</Label>
            <Input value={data.distrito} onChange={(e) => onChange({ ...data, distrito: e.target.value })} />
          </div>
          <div>
            <Label>Provincia</Label>
            <Input value={data.provincia} onChange={(e) => onChange({ ...data, provincia: e.target.value })} />
          </div>
          <div>
            <Label>Región</Label>
            <Input value={data.region} onChange={(e) => onChange({ ...data, region: e.target.value })} />
          </div>
          <div>
            <Label>Director(a)</Label>
            <Input value={data.director} onChange={(e) => onChange({ ...data, director: e.target.value })} />
          </div>
          <div>
            <Label>Profesor(a)</Label>
            <Input value={data.profesor} onChange={(e) => onChange({ ...data, profesor: e.target.value })} />
          </div>
          <div>
            <Label>Área</Label>
            <Input value={data.area} onChange={(e) => onChange({ ...data, area: e.target.value })} />
          </div>
          <div>
            <Label>Grado</Label>
            <Input value={data.grado} onChange={(e) => onChange({ ...data, grado: e.target.value })} />
          </div>
          <div>
            <Label>Duración</Label>
            <Input value={data.duracion} onChange={(e) => onChange({ ...data, duracion: e.target.value })} />
          </div>
          <div>
            <Label>Periodo de ejecución</Label>
            <Input value={data.periodo} onChange={(e) => onChange({ ...data, periodo: e.target.value })} />
          </div>
          <div>
            <Label>Año académico</Label>
            <Input value={data.anio} onChange={(e) => onChange({ ...data, anio: e.target.value })} />
          </div>
        </div>

        <div className="flex justify-between gap-2 pt-2">
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
