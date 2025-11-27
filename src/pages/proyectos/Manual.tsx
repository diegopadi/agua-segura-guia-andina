import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Sparkles,
  CheckCircle,
  ArrowLeft,
  BookOpen,
  Target,
  Clock,
  FileCheck,
  Users,
  BookMarked,
  Loader2,
  Trash2,
  Lightbulb,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAcceleratorsSummary } from "@/hooks/useAcceleratorsSummary";
import RepositoryFilePicker from "@/components/RepositoryFilePicker";
import { FileRecord } from "@/hooks/useFileManager";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import QuestionsForm from "@/components/QuestionsForm";

interface PreguntaGenerada {
  categoria: string;
  pregunta: string;
  objetivo: string;
}

interface Recomendacion {
  recomendacion: "2A" | "2B" | "2C" | "2D";
  confianza: number;
  justificacion: string;
  fortalezas: string[];
  aspectos_a_fortalecer: string[];
}

export default function Manual() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [experiencias, setExperiencias] = useState<FileRecord[]>([]);
  const [preguntasGeneradas, setPreguntasGeneradas] = useState<
    PreguntaGenerada[]
  >([]);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [recomendacion, setRecomendacion] = useState<Recomendacion | null>(
    null
  );
  const [generatingRecommendation, setGeneratingRecommendation] =
    useState(false);
  const { hallazgos, loading, generating, generateSummary, hasData } =
    useAcceleratorsSummary();

  useEffect(() => {
    if (!hasData && !loading && !generating) {
      generateSummary();
    }
  }, []);

  const handleSelectFiles = (files: FileRecord[]) => {
    setExperiencias([...experiencias, ...files]);
    toast({
      title: "Archivos adjuntados",
      description: `${files.length} archivo(s) agregado(s)`,
    });
  };

  const quitarExperiencia = (id: string) => {
    setExperiencias(experiencias.filter((e) => e.id !== id));
  };

  const generarPreguntas = async () => {
    if (!hallazgos) {
      toast({
        title: "Error",
        description: "Debes generar el resumen diagnóstico primero",
        variant: "destructive",
      });
      return;
    }

    try {
      setGeneratingQuestions(true);

      const { data, error } = await supabase.functions.invoke(
        "generate-questions-from-context",
        {
          body: {
            diagnostico: hallazgos,
            experiencias: experiencias,
          },
        }
      );

      if (error) throw error;

      if (data.success) {
        setPreguntasGeneradas(data.data.preguntas);
        toast({
          title: "Preguntas generadas",
          description: `${data.data.preguntas.length} preguntas creadas con IA`,
        });
      }
    } catch (error) {
      console.error("Error generando preguntas:", error);
      toast({
        title: "Error",
        description: "No se pudieron generar las preguntas",
        variant: "destructive",
      });
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handleSubmitAnswers = async (respuestas: Record<string, string>) => {
    try {
      setGeneratingRecommendation(true);

      const { data, error } = await supabase.functions.invoke(
        "recommend-project-type",
        {
          body: {
            diagnostico: hallazgos,
            experiencias: experiencias,
            respuestas,
          },
        }
      );

      if (error) throw error;

      if (data.success) {
        setRecomendacion(data.data);
        toast({
          title: "Recomendación generada",
          description: `Proyecto ${data.data.recomendacion} sugerido`,
        });

        setTimeout(() => {
          document
            .getElementById("recomendacion")
            ?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } catch (error) {
      console.error("Error generando recomendación:", error);
      toast({
        title: "Error",
        description: "No se pudo generar la recomendación",
        variant: "destructive",
      });
    } finally {
      setGeneratingRecommendation(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#E6F4F1" }}>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3" style={{ color: "#005C6B" }}>
            Elegir tipo de proyecto
          </h1>
          <p className="text-lg mb-2" style={{ color: "#00A6A6" }}>
            Selecciona la categoría de proyecto con la que deseas postular al
            CNPIE 2026.
          </p>
        </div>

        {/* Recomendación */}
        {recomendacion && (
          <Card
            id="recomendacion"
            className="mb-6 border-0 shadow-lg"
            style={{ backgroundColor: "#00A6A6" }}
          >
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-8 h-8 text-white flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">
                    Recomendación: Proyecto {recomendacion.recomendacion}
                  </h3>
                  <p className="text-white/90 mb-3">
                    {recomendacion.justificacion}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-white/80 mb-4">
                    <span>Confianza: {recomendacion.confianza}%</span>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="p-3 rounded-lg bg-white/10">
                  <p className="font-semibold text-white mb-2">Fortalezas:</p>
                  <ul className="list-disc list-inside space-y-1 text-white/90">
                    {recomendacion.fortalezas.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 rounded-lg bg-white/10">
                  <p className="font-semibold text-white mb-2">
                    Aspectos a fortalecer:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-white/90">
                    {recomendacion.aspectos_a_fortalecer.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <Alert className="border-0 bg-white/10">
                <AlertDescription className="text-white text-sm">
                  Continúa con la recomendación o elige manualmente otro tipo de
                  proyecto abajo.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Selección de tipo de proyecto */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4" style={{ color: "#005C6B" }}>
            Selecciona tu tipo de proyecto
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Tarjeta 2A */}
            <Card
              className="border-0 shadow-lg hover:shadow-xl transition-shadow"
              style={{ backgroundColor: "#005C6B" }}
            >
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white/20">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                </div>
                <CardTitle className="text-center text-white text-xl">
                  Proyecto 2A
                </CardTitle>
                <CardDescription className="text-center text-white/90 text-sm font-medium">
                  Proyectos de Innovación Educativa Consolidados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-white/90">
                  <p className="font-semibold mb-2 text-white">
                    "Para proyectos maduros y sostenibles."
                  </p>
                  <p>
                    Ideal si tu escuela ya tiene una innovación que funciona
                    desde hace 2 años o más. Aquí debes demostrar con evidencias
                    sólidas cómo ha mejorado los aprendizajes y que la solución
                    ya es parte de la cultura de tu escuela.
                  </p>
                </div>
                <Button
                  onClick={() => navigate("/cnpie/2a/etapa1/acelerador1")}
                  className="w-full bg-white font-medium hover:bg-white/90"
                  style={{ color: "#005C6B" }}
                >
                  Entrar a Proyecto 2A
                </Button>
              </CardContent>
            </Card>

            {/* Tarjeta 2B */}
            <Card
              className="border-0 shadow-lg hover:shadow-xl transition-shadow"
              style={{ backgroundColor: "#00A6A6" }}
            >
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white/20">
                    <Clock className="w-8 h-8 text-white" />
                  </div>
                </div>
                <CardTitle className="text-center text-white text-xl">
                  Proyecto 2B
                </CardTitle>
                <CardDescription className="text-center text-white/90 text-sm font-medium">
                  Proyectos en Proceso de Implementación
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-white/90">
                  <p className="font-semibold mb-2 text-white">
                    "Para iniciativas en marcha que buscan crecer."
                  </p>
                  <p>
                    Elige esta opción si tu proyecto tiene al menos 1 año
                    funcionando. Ya tienes un diagnóstico claro y has empezado a
                    aplicar estrategias, pero necesitas apoyo para consolidar la
                    propuesta y mejorar sus resultados.
                  </p>
                </div>
                <Button
                  onClick={() => navigate("/cnpie/2B/etapa1/acelerador1")}
                  className="w-full bg-white font-medium hover:bg-white/90"
                  style={{ color: "#00A6A6" }}
                >
                  Entrar a Proyecto 2B
                </Button>
              </CardContent>
            </Card>

            {/* Tarjeta 2C */}
            <Card
              className="border-0 shadow-lg hover:shadow-xl transition-shadow"
              style={{ backgroundColor: "#1BBEAE" }}
            >
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white/20">
                    <Target className="w-8 h-8 text-white" />
                  </div>
                </div>
                <CardTitle className="text-center text-white text-xl">
                  Proyecto 2C
                </CardTitle>
                <CardDescription className="text-center text-white/90 text-sm font-medium">
                  Proyectos de Innovación Educativa Promisorios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-white/90">
                  <p className="font-semibold mb-2 text-white">
                    "Para nuevas ideas con alto potencial."
                  </p>
                  <p>
                    Esta es la categoría para proyectos que aún no se han
                    ejecutado. Si tienes un diseño sólido, planificado
                    colaborativamente y listo para implementarse por primera vez
                    en el 2026, este es tu lugar.
                  </p>
                </div>
                <Button
                  onClick={() => navigate("/cnpie/2C/etapa1/acelerador1")}
                  className="w-full bg-white font-medium hover:bg-white/90"
                  style={{ color: "#1BBEAE" }}
                >
                  Entrar a Proyecto 2C
                </Button>
              </CardContent>
            </Card>

            {/* Tarjeta 2D */}
            <Card
              className="border-0 shadow-lg hover:shadow-xl transition-shadow"
              style={{ backgroundColor: "#50C9BD" }}
            >
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white/20">
                    <Lightbulb className="w-8 h-8 text-white" />
                  </div>
                </div>
                <CardTitle className="text-center text-white text-xl">
                  Proyecto 2D
                </CardTitle>
                <CardDescription className="text-center text-white/90 text-sm font-medium">
                  Investigación - Acción Participativa (IAPE)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-white/90">
                  <p className="font-semibold mb-2 text-white">
                    "Para docentes que investigan su propia práctica."
                  </p>
                  <p>
                    Si tu equipo quiere resolver un problema pedagógico mediante
                    un proceso riguroso de reflexión, análisis y construcción de
                    conocimiento (Investigación-Acción), elige esta ruta. Aquí
                    el foco es la metodología de investigación.
                  </p>
                </div>
                <Button
                  onClick={() => navigate("/cnpie/2D/etapa1/acelerador1")}
                  className="w-full bg-white font-medium hover:bg-white/90"
                  style={{ color: "#50C9BD" }}
                >
                  Entrar a Proyecto 2D
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bloque de navegación */}
        <div className="space-y-4">
          <Alert className="border-0" style={{ backgroundColor: "#DDF4F2" }}>
            <AlertDescription style={{ color: "#1A1A1A" }}>
              Puedes cambiar de tipo más adelante usando el botón de cambio
              rápido (Mini).
            </AlertDescription>
          </Alert>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 pt-4">
            <button
              onClick={() => navigate("/repositorio")}
              className="flex items-center gap-2 text-sm font-medium hover:underline"
              style={{ color: "#005C6B" }}
            >
              <BookOpen className="w-4 h-4" />
              Ir al Repositorio de experiencias
            </button>
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-sm font-medium hover:underline"
              style={{ color: "#005C6B" }}
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
