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
  FileSearch,
  Zap,
  ClipboardCheck,
  ArrowLeft,
  BookOpen,
  Info,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MiniCambioProyecto } from "@/components/MiniCambioProyecto";
import ResumenDiagnostico from "@/components/ResumenDiagnostico";

export default function Proyecto2C() {
  const navigate = useNavigate();

  const etapas = [
    {
      numero: 1,
      titulo: "Diagnóstico",
      descripcion:
        "Exploración participativa de necesidades y oportunidades en la comunidad educativa.",
      icon: FileSearch,
      color: "#1BBEAE",
      disponible: false,
    },
    {
      numero: 2,
      titulo: "Aceleración",
      descripcion:
        "Co-diseño de estrategias y metodologías para la investigación-acción participativa.",
      icon: Zap,
      color: "#00A6A6",
      disponible: false,
    },
    {
      numero: 3,
      titulo: "Evaluación y cierre",
      descripcion:
        "Sistematización de aprendizajes y propuesta de continuidad para CNPIE 2025.",
      icon: ClipboardCheck,
      color: "#005C6B",
      disponible: false,
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#E6F4F1" }}>
      <MiniCambioProyecto variant="floating" />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3" style={{ color: "#1BBEAE" }}>
            Proyecto 2C — Investigación Acción Participativa
          </h1>
          <p className="text-lg mb-2" style={{ color: "#005C6B" }}>
            Fase exploratoria o de descubrimiento.
          </p>
          <p className="text-base max-w-3xl" style={{ color: "#1A1A1A" }}>
            Este proyecto explora nuevas relaciones entre práctica pedagógica y
            participación comunitaria, promoviendo la indagación colaborativa y
            el descubrimiento conjunto.
          </p>
        </div>

        {/* Resumen de diagnóstico */}
        <ResumenDiagnostico />

        {/* Panel de etapas */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6" style={{ color: "#1BBEAE" }}>
            Etapas del Proyecto 2C
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {etapas.map((etapa) => {
              const IconComponent = etapa.icon;
              return (
                <Card
                  key={etapa.numero}
                  className="border-0 shadow-md hover:shadow-lg transition-shadow"
                  style={{ backgroundColor: "#DDF4F2" }}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: etapa.color }}
                      >
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <span
                        className="text-xs font-bold px-3 py-1 rounded-full"
                        style={{
                          backgroundColor: "#E6F4F1",
                          color: etapa.color,
                        }}
                      >
                        Etapa {etapa.numero}
                      </span>
                    </div>
                    <CardTitle className="text-xl" style={{ color: "#1BBEAE" }}>
                      {etapa.titulo}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CardDescription
                      className="text-sm min-h-[60px]"
                      style={{ color: "#1A1A1A" }}
                    >
                      {etapa.descripcion}
                    </CardDescription>
                    <Button
                      className="w-full font-medium"
                      disabled={!etapa.disponible}
                      style={{
                        backgroundColor: etapa.disponible
                          ? etapa.color
                          : "#E6F4F1",
                        color: etapa.disponible ? "white" : "#1BBEAE",
                        opacity: etapa.disponible ? 1 : 0.6,
                      }}
                    >
                      {etapa.disponible ? "Ver etapa" : "Próximamente"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Información adicional */}
        <Alert className="mb-6 border-0" style={{ backgroundColor: "#DDF4F2" }}>
          <Info className="h-4 w-4" style={{ color: "#1BBEAE" }} />
          <AlertDescription style={{ color: "#1A1A1A" }}>
            Las etapas y aceleradores específicos del Proyecto 2C se habilitarán
            progresivamente. Cada etapa incluirá metodologías participativas y
            herramientas de co-diseño adaptadas a proyectos de
            investigación-acción.
          </AlertDescription>
        </Alert>

        {/* Panel de navegación */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => navigate("/proyectos/manual")}
              className="font-medium text-white"
              style={{ backgroundColor: "#1BBEAE" }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Elegir tipo manualmente
            </Button>
            <Button
              onClick={() => navigate("/repositorio")}
              variant="outline"
              className="font-medium"
              style={{
                backgroundColor: "#DDF4F2",
                color: "#1BBEAE",
                borderColor: "#1BBEAE",
              }}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Ir al Repositorio de experiencias
            </Button>
          </div>

          <Alert className="border-0" style={{ backgroundColor: "#E6F4F1" }}>
            <AlertDescription className="text-sm" style={{ color: "#1A1A1A" }}>
              Puedes cambiar de tipo de proyecto desde el botón "Cambiar tipo"
              (Mini).
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
