import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft } from "lucide-react";
import Step1Welcome from "./components/a5/Step1Welcome";
import Step2Info from "./components/a5/Step2Info";
import Step3SituationPurpose from "./components/a5/Step3SituationPurpose";
import Step4Competencies from "./components/a5/Step4Competencies";
import Step5SessionsStructure from "./components/a5/Step5SessionsStructure";
import Step6Feedback from "./components/a5/Step6Feedback";
import Step7Materials from "./components/a5/Step7Materials";
import Step8FinalPreview from "./components/a5/Step8FinalPreview";
import { A5InfoData, A5SituationPurposeData, A5CompetenciesData, A5SessionsStructureData, A5FeedbackData, A5MaterialsData } from "./components/a5/types";
import type { A4Inputs } from "./components/a5/types";

const steps = [
  { number: 1, title: "Bienvenida", description: "Introducción al flujo" },
  { number: 2, title: "Datos informativos", description: "Numeral I" },
  { number: 3, title: "Situación y propósitos", description: "Bloques II y III (IA)" },
  { number: 4, title: "Competencias y enfoques", description: "Catálogo CNEB" },
  { number: 5, title: "Estructura de sesiones", description: "Generación (IA)" },
  { number: 6, title: "Retroalimentación", description: "Sugerencias (IA)" },
  { number: 7, title: "Materiales", description: "Sugeridos (IA)" },
  { number: 8, title: "Documento final", description: "Vista previa y exportación" },
];

export default function Acelerador5() {
  useEffect(() => {
    document.title = "Acelerador 5 – Diseño de Unidad de Aprendizaje";
  }, []);

  const [current, setCurrent] = useState(1);

  const [info, setInfo] = useState<A5InfoData>({
    institucion: "", distrito: "", provincia: "", region: "", director: "", profesor: "",
    area: "", grado: "", duracion: "", periodo: "", anio: "",
  });

  const [situation, setSituation] = useState<A5SituationPurposeData>({
    situacion: "", proposito: "", reto: "", producto: "",
  });

  const [comp, setComp] = useState<A5CompetenciesData>({ competencias: [], enfoques: [] });

  const [sessions, setSessions] = useState<A5SessionsStructureData>({
    numSesiones: 4, horasPorSesion: 2, numEstudiantes: 30, estructura: [],
  });

const [feedback, setFeedback] = useState<A5FeedbackData>({ feedback: "" });

const [materials, setMaterials] = useState<A5MaterialsData>({ materiales: [] });

// A4 recovered inputs for A5 usage
const [a4Inputs, setA4Inputs] = useState<A4Inputs | null>(null);

const next = () => setCurrent((c) => Math.min(c + 1, steps.length));
const prev = () => setCurrent((c) => Math.max(c - 1, 1));

  const render = () => {
    switch (current) {
      case 1:
        return <Step1Welcome onNext={next} onValidated={(inputs: A4Inputs) => { setA4Inputs(inputs); next(); }} />;
      case 2:
        return <Step2Info data={info} onChange={setInfo} onPrev={prev} onNext={next} />;
      case 3:
        return <Step3SituationPurpose data={situation} onChange={setSituation} onPrev={prev} onNext={next} />;
      case 4:
        return <Step4Competencies data={comp} onChange={setComp} onPrev={prev} onNext={next} />;
      case 5:
        return <Step5SessionsStructure data={sessions} onChange={setSessions} onPrev={prev} onNext={next} />;
      case 6:
        return <Step6Feedback data={feedback} onChange={setFeedback} onPrev={prev} onNext={next} />;
      case 7:
        return <Step7Materials data={materials} onChange={setMaterials} onPrev={prev} onNext={next} />;
      case 8:
        return (
          <Step8FinalPreview
            info={info}
            situation={situation}
            comp={comp}
            sessions={sessions}
            feedback={feedback}
            materials={materials}
            onPrev={prev}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/etapa2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Etapa 2
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Acelerador 5 – Diseño de Unidad de Aprendizaje</h1>
            <p className="text-muted-foreground">{`Paso ${current} de ${steps.length}: ${steps[current - 1]?.title}`}</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Progreso</CardTitle>
          <CardDescription>Avanza paso a paso. Puedes volver y editar cuando quieras.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={(current / steps.length) * 100} className="h-3" />
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
              {steps.map((s) => (
                <div key={s.number} className={`p-2 rounded-md border text-center text-xs ${s.number === current ? "bg-accent" : "bg-background"}`}>
                  <div className="font-medium">{s.title}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {render()}
    </div>
  );
}
