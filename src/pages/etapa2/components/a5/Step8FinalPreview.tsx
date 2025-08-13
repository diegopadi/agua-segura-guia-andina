import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { A5InfoData, A5SituationPurposeData, A5CompetenciesData, A5SessionsStructureData, A5FeedbackData, A5MaterialsData } from "./types";

interface Props {
  info: A5InfoData;
  situation: A5SituationPurposeData;
  comp: A5CompetenciesData;
  sessions: A5SessionsStructureData;
  feedback: A5FeedbackData;
  materials: A5MaterialsData;
  onPrev: () => void;
}

function buildPlainText(props: Props): string {
  const { info, situation, comp, sessions, feedback, materials } = props;
  const sesiones = sessions.estructura.map((r) => `Sesión ${r.sesion}: ${r.objetivo} | ${r.actividades}`).join("\n");
  const mats = materials.materiales.map((m) => `- ${m.nombre}: ${m.descripcion}`).join("\n");
  return `UNIDAD DE APRENDIZAJE\n\nI. Datos informativos\nInstitución: ${info.institucion}\nDistrito: ${info.distrito}\nProvincia: ${info.provincia}\nRegión: ${info.region}\nDirector(a): ${info.director}\nProfesor(a): ${info.profesor}\nÁrea: ${info.area}\nGrado: ${info.grado}\nDuración: ${info.duracion}\nPeriodo: ${info.periodo}\nAño: ${info.anio}\n\nII-III. Situación, propósito, reto, producto\nSituación: ${situation.situacion}\nPropósito: ${situation.proposito}\nReto: ${situation.reto}\nProducto: ${situation.producto}\n\nIV. Competencias y enfoques\nCompetencias: ${comp.competencias.join(", ")}\nEnfoques: ${comp.enfoques.join(", ")}\n\nV. Estructura de sesiones\n${sesiones || "(sin contenido)"}\n\nVI. Retroalimentación\n${feedback.feedback}\n\nVII. Materiales\n${mats || "(sin contenido)"}`;
}

export default function Step8FinalPreview(props: Props) {
  const copy = async () => {
    await navigator.clipboard.writeText(buildPlainText(props));
    toast({ title: "Copiado", description: "El contenido fue copiado como texto." });
  };

  const download = () => {
    const blob = new Blob([buildPlainText(props)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "unidad-aprendizaje.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const printDoc = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    const html = document.getElementById("a5-final-html")?.innerHTML || "";
    w.document.write(`<!DOCTYPE html><html><head><meta charset='utf-8'><title>Unidad de Aprendizaje</title><style>body{font-family: ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial; color:#000;} h1,h2{margin:0.5rem 0;} .section{margin:1rem 0;} table{width:100%; border-collapse:collapse;} th,td{border:1px solid #ddd; padding:8px;}</style></head><body>${html}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
    w.close();
  };

  const { info, situation, comp, sessions, feedback, materials } = props;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documento final</CardTitle>
        <CardDescription>Aquí verás tu Unidad de Aprendizaje completa, lista para exportar.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="secondary" onClick={copy}>Copiar</Button>
          <Button variant="secondary" onClick={download}>Descargar .txt</Button>
          <Button onClick={printDoc}>Imprimir</Button>
        </div>
        <div id="a5-final-html" className="border rounded-md">
          <ScrollArea className="h-[60vh] p-6">
            <article className="prose prose-neutral max-w-none">
              <h1>Unidad de Aprendizaje</h1>

              <section className="section">
                <h2>I. Datos informativos</h2>
                <p><strong>Institución:</strong> {info.institucion || "—"}</p>
                <p><strong>Distrito:</strong> {info.distrito || "—"}</p>
                <p><strong>Provincia:</strong> {info.provincia || "—"}</p>
                <p><strong>Región:</strong> {info.region || "—"}</p>
                <p><strong>Director(a):</strong> {info.director || "—"}</p>
                <p><strong>Profesor(a):</strong> {info.profesor || "—"}</p>
                <p><strong>Área:</strong> {info.area || "—"}</p>
                <p><strong>Grado:</strong> {info.grado || "—"}</p>
                <p><strong>Duración:</strong> {info.duracion || "—"}</p>
                <p><strong>Periodo:</strong> {info.periodo || "—"}</p>
                <p><strong>Año:</strong> {info.anio || "—"}</p>
              </section>

              <section className="section">
                <h2>II-III. Situación significativa, propósito, reto y producto</h2>
                <p><strong>Situación significativa:</strong> {situation.situacion || "—"}</p>
                <p><strong>Propósito:</strong> {situation.proposito || "—"}</p>
                <p><strong>Reto:</strong> {situation.reto || "—"}</p>
                <p><strong>Producto:</strong> {situation.producto || "—"}</p>
              </section>

              <section className="section">
                <h2>IV. Competencias y enfoques transversales</h2>
                <p><strong>Competencias:</strong> {comp.competencias.length ? comp.competencias.join(", ") : "—"}</p>
                <p><strong>Enfoques:</strong> {comp.enfoques.length ? comp.enfoques.join(", ") : "—"}</p>
              </section>

              <section className="section">
                <h2>V. Estructura de sesiones</h2>
                {sessions.estructura.length ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Sesión</th>
                        <th>Objetivo</th>
                        <th>Actividades</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.estructura.map((row) => (
                        <tr key={row.sesion}>
                          <td>{row.sesion}</td>
                          <td>{row.objetivo}</td>
                          <td>{row.actividades}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-muted-foreground">(sin contenido)</p>
                )}
              </section>

              <section className="section">
                <h2>VI. Retroalimentación</h2>
                <p>{feedback.feedback || "—"}</p>
              </section>

              <section className="section">
                <h2>VII. Materiales</h2>
                {materials.materiales.length ? (
                  <ul>
                    {materials.materiales.map((m, i) => (
                      <li key={i}><strong>{m.nombre}:</strong> {m.descripcion}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">(sin contenido)</p>
                )}
              </section>
            </article>
          </ScrollArea>
        </div>

        <div className="flex justify-between gap-2">
          <Button variant="outline" onClick={props.onPrev}>Atrás</Button>
          <div className="flex gap-2">
            <Button onClick={printDoc}>Imprimir</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
