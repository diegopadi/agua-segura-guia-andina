import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FileSearch, Zap, ClipboardCheck, ArrowLeft, BookOpen, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MiniCambioProyecto } from "@/components/MiniCambioProyecto";

export default function Proyecto2A() {
  const navigate = useNavigate();

  const etapas = [
    {
      numero: 1,
      titulo: "Diagnóstico",
      descripcion: "Lectura del diagnóstico importado y análisis de la situación actual del proyecto consolidado.",
      icon: FileSearch,
      color: "#005C6B",
      disponible: false
    },
    {
      numero: 2,
      titulo: "Aceleración",
      descripcion: "Desarrollo de aceleradores específicos para fortalecer y sistematizar tu innovación educativa.",
      icon: Zap,
      color: "#00A6A6",
      disponible: false
    },
    {
      numero: 3,
      titulo: "Evaluación y cierre",
      descripcion: "Generación de entregables para CNPIE 2025: evidencias, sistematización y documentación final.",
      icon: ClipboardCheck,
      color: "#1BBEAE",
      disponible: false
    }
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E6F4F1' }}>
      <MiniCambioProyecto variant="floating" />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3" style={{ color: '#005C6B' }}>
            Proyecto 2A — Innovación Educativa Consolidado
          </h1>
          <p className="text-lg mb-2" style={{ color: '#00A6A6' }}>
            Proyectos con 2 años o más de ejecución.
          </p>
          <p className="text-base max-w-3xl" style={{ color: '#1A1A1A' }}>
            En esta sección trabajarás las etapas de planificación, validación y sistematización de tu proyecto consolidado.
          </p>
        </div>

        {/* Panel de etapas */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#005C6B' }}>
            Etapas del Proyecto 2A
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {etapas.map((etapa) => {
              const IconComponent = etapa.icon;
              return (
                <Card 
                  key={etapa.numero}
                  className="border-0 shadow-md hover:shadow-lg transition-shadow"
                  style={{ backgroundColor: '#DDF4F2' }}
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
                          backgroundColor: '#E6F4F1',
                          color: etapa.color 
                        }}
                      >
                        Etapa {etapa.numero}
                      </span>
                    </div>
                    <CardTitle className="text-xl" style={{ color: '#005C6B' }}>
                      {etapa.titulo}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CardDescription 
                      className="text-sm min-h-[60px]"
                      style={{ color: '#1A1A1A' }}
                    >
                      {etapa.descripcion}
                    </CardDescription>
                    <Button 
                      className="w-full font-medium"
                      disabled={!etapa.disponible}
                      style={{ 
                        backgroundColor: etapa.disponible ? etapa.color : '#E6F4F1',
                        color: etapa.disponible ? 'white' : '#005C6B',
                        opacity: etapa.disponible ? 1 : 0.6
                      }}
                    >
                      {etapa.disponible ? 'Ver etapa' : 'Próximamente'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Información adicional */}
        <Alert className="mb-6 border-0" style={{ backgroundColor: '#DDF4F2' }}>
          <Info className="h-4 w-4" style={{ color: '#00A6A6' }} />
          <AlertDescription style={{ color: '#1A1A1A' }}>
            Las etapas y aceleradores específicos del Proyecto 2A se habilitarán progresivamente. 
            Cada etapa incluirá herramientas de análisis, validación y documentación adaptadas a proyectos consolidados.
          </AlertDescription>
        </Alert>

        {/* Panel de navegación */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => navigate('/proyectos/manual')}
              className="font-medium text-white"
              style={{ backgroundColor: '#005C6B' }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Elegir tipo manualmente
            </Button>
            <Button
              onClick={() => navigate('/repositorio')}
              variant="outline"
              className="font-medium"
              style={{ 
                backgroundColor: '#DDF4F2',
                color: '#005C6B',
                borderColor: '#00A6A6'
              }}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Ir al Repositorio de experiencias
            </Button>
          </div>

          <Alert className="border-0" style={{ backgroundColor: '#E6F4F1' }}>
            <AlertDescription className="text-sm" style={{ color: '#1A1A1A' }}>
              Puedes cambiar de tipo de proyecto desde el botón "Cambiar tipo" (Mini).
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
