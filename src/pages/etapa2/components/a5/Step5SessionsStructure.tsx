import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { A5SessionsStructureData, A5SessionRow } from "./types";

interface Props {
  data: A5SessionsStructureData;
  onChange: (data: A5SessionsStructureData) => void;
  onNext: () => void;
  onPrev: () => void;
}

function buildDemo(num: number): A5SessionRow[] {
  return Array.from({ length: num }).map((_, i) => ({
    sesion: i + 1,
    objetivo: `Objetivo preliminar de la sesión ${i + 1}`,
    actividades: `Actividades modelo para la sesión ${i + 1}`,
  }));
}

export default function Step5SessionsStructure({ data, onChange, onNext, onPrev }: Props) {
  const generate = () => {
    const estructura = buildDemo(Number(data.numSesiones || 4));
    onChange({ ...data, estructura });
    toast({ title: "Estructura generada (demo)", description: "Contenido ficticio listo para editar." });
  };
  const save = () => toast({ title: "Guardado", description: "Se almacenará más adelante." });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Diseño de la estructura de sesiones</CardTitle>
        <CardDescription>Indica cuántas sesiones, horas y estudiantes tendrá tu Unidad de Aprendizaje para que la IA genere la estructura.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Número de sesiones</Label>
            <Input type="number" min={1} value={data.numSesiones}
              onChange={(e) => onChange({ ...data, numSesiones: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Horas por sesión</Label>
            <Input type="number" min={1} value={data.horasPorSesion}
              onChange={(e) => onChange({ ...data, horasPorSesion: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Número de estudiantes</Label>
            <Input type="number" min={1} value={data.numEstudiantes}
              onChange={(e) => onChange({ ...data, numEstudiantes: Number(e.target.value) })} />
          </div>
        </div>

        <div className="overflow-x-auto border rounded-md">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-2">Sesión</th>
                <th className="text-left p-2">Objetivo</th>
                <th className="text-left p-2">Actividades</th>
              </tr>
            </thead>
            <tbody>
              {data.estructura.map((row) => (
                <tr key={row.sesion} className="border-t">
                  <td className="p-2 align-top w-16">{row.sesion}</td>
                  <td className="p-2 align-top">
                    <Input value={row.objetivo} onChange={(e) => {
                      const estructura = data.estructura.map((r) => r.sesion === row.sesion ? { ...r, objetivo: e.target.value } : r)
                      onChange({ ...data, estructura })
                    }} />
                  </td>
                  <td className="p-2 align-top">
                    <Input value={row.actividades} onChange={(e) => {
                      const estructura = data.estructura.map((r) => r.sesion === row.sesion ? { ...r, actividades: e.target.value } : r)
                      onChange({ ...data, estructura })
                    }} />
                  </td>
                </tr>
              ))}
              {data.estructura.length === 0 && (
                <tr>
                  <td className="p-3 text-muted-foreground" colSpan={3}>Sin estructura generada aún.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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
