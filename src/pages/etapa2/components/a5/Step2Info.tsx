import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { A5InfoData } from "./types";
import cnebCatalogo from "@/data/cneb_secundaria_catalogo.json";

interface Props {
  data: A5InfoData;
  onChange: (data: A5InfoData) => void;
  onNext: () => void;
  onPrev: () => void;
  onSaveVars?: (vars: Record<string, string>) => void;
}

export default function Step2Info({ data, onChange, onNext, onPrev, onSaveVars }: Props) {
  const areasDisponibles = Object.keys(cnebCatalogo.competencias);
  const gradosDisponibles = ["1", "2", "3", "4", "5"];

  const isComplete = (d: A5InfoData) =>
    d.institucion && d.distrito && d.provincia && d.region && d.director && d.profesor && d.area && d.grado && d.duracion && d.periodo && d.anio;

  const buildVars = (d: A5InfoData): Record<string, string> => ({
    ua_institucion: d.institucion.trim(),
    ua_distrito: d.distrito.trim(),
    ua_provincia: d.provincia.trim(),
    ua_region: d.region.trim(),
    ua_director: d.director.trim(),
    ua_profesor: d.profesor.trim(),
    ua_area: d.area.trim(),
    ua_grado: d.grado.trim(),
    ua_duracion: d.duracion.trim(),
    ua_periodo: d.periodo.trim(),
    ua_anio: d.anio.trim(),
  });

  const handleSave = () => {
    if (!isComplete(data)) {
      toast({ title: "Campos incompletos", description: "Por favor completa todos los campos para guardar.", variant: "destructive" });
      return;
    }
    onSaveVars?.(buildVars(data));
    toast({ title: "Datos guardados", description: "Se insertarán en el documento final (Numeral I)." });
  };

  const handleNext = () => {
    if (!isComplete(data)) {
      toast({ title: "Datos requeridos", description: "Por favor completa todos los campos para continuar.", variant: "destructive" });
      return;
    }
    onSaveVars?.(buildVars(data)); // Autoguardado al avanzar
    onNext();
  };

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
            <Select value={data.area} onValueChange={(value) => onChange({ ...data, area: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar área curricular" />
              </SelectTrigger>
              <SelectContent>
                {areasDisponibles.map((area) => (
                  <SelectItem key={area} value={area}>{area}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Grado</Label>
            <Select value={data.grado} onValueChange={(value) => onChange({ ...data, grado: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar grado" />
              </SelectTrigger>
              <SelectContent>
                {gradosDisponibles.map((grado) => (
                  <SelectItem key={grado} value={grado}>{grado}° Secundaria</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Duración</Label>
            <Input value={data.duracion} onChange={(e) => onChange({ ...data, duracion: e.target.value })} />
            <p className="text-sm text-muted-foreground mt-1">Indicar fechas estimadas de inicio y final de esta Unidad</p>
          </div>
          <div>
            <Label>Periodo de ejecución</Label>
            <Input value={data.periodo} onChange={(e) => onChange({ ...data, periodo: e.target.value })} />
            <p className="text-sm text-muted-foreground mt-1">Indicar el número de semanas de esta Unidad</p>
          </div>
          <div>
            <Label>Año académico</Label>
            <Input value={data.anio} onChange={(e) => onChange({ ...data, anio: e.target.value })} />
          </div>
        </div>

        <div className="flex justify-between gap-2 pt-2">
          <Button variant="outline" onClick={onPrev}>Atrás</Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleSave}>Guardar</Button>
            <Button onClick={handleNext}>Siguiente</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
