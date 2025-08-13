import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { A5MaterialsData, A5MaterialItem } from "./types";

interface Props {
  data: A5MaterialsData;
  onChange: (data: A5MaterialsData) => void;
  onNext: () => void;
  onPrev: () => void;
}

const demoList: A5MaterialItem[] = [
  { nombre: "Cartulinas", descripcion: "Para mapas conceptuales y afiches." },
  { nombre: "Marcadores", descripcion: "Colores básicos para trabajo grupal." },
  { nombre: "Botellas recicladas", descripcion: "Para prototipos relacionados al agua." },
];

export default function Step7Materials({ data, onChange, onNext, onPrev }: Props) {
  const add = () => onChange({ materiales: [...data.materiales, { nombre: "", descripcion: "" }] });
  const remove = (idx: number) => onChange({ materiales: data.materiales.filter((_, i) => i !== idx) });

  const generate = () => {
    onChange({ materiales: demoList });
    toast({ title: "Lista generada (demo)", description: "Materiales ficticios agregados." });
  };
  const save = () => toast({ title: "Guardado", description: "Se almacenará más adelante." });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de materiales</CardTitle>
        <CardDescription>La IA analizará tu Unidad de Aprendizaje y sugerirá materiales adaptados a la realidad de tu IE.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {data.materiales.map((m, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
              <div className="md:col-span-2">
                <Label>Nombre</Label>
                <Input value={m.nombre} onChange={(e) => {
                  const materiales = data.materiales.map((it, i) => i === idx ? { ...it, nombre: e.target.value } : it)
                  onChange({ materiales })
                }} />
              </div>
              <div className="md:col-span-3">
                <Label>Descripción</Label>
                <Input value={m.descripcion} onChange={(e) => {
                  const materiales = data.materiales.map((it, i) => i === idx ? { ...it, descripcion: e.target.value } : it)
                  onChange({ materiales })
                }} />
              </div>
              <div className="flex md:justify-end">
                <Button variant="ghost" onClick={() => remove(idx)}>Quitar</Button>
              </div>
            </div>
          ))}
          {data.materiales.length === 0 && (
            <p className="text-sm text-muted-foreground">Aún no hay materiales añadidos.</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button variant="secondary" onClick={add}>Agregar material</Button>
          <Button variant="secondary" onClick={generate}>Generar con IA</Button>
          <Button variant="secondary" onClick={generate}>Re-generar</Button>
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
