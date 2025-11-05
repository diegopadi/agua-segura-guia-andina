import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FileText, Sparkles, CheckCircle, ArrowLeft, BookOpen, Target, Clock, FileCheck, Users, BookMarked, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAcceleratorsSummary } from "@/hooks/useAcceleratorsSummary";

interface Experiencia {
  fuente: "Repositorio" | "Subida local";
  nombre: string;
  etiquetas: string[];
  fecha: string;
}

export default function Manual() {
  const navigate = useNavigate();
  const [preguntasGeneradas, setPreguntasGeneradas] = useState(false);
  const { hallazgos, loading, generating, generateSummary, hasData } = useAcceleratorsSummary();

  // Generar resumen automáticamente al cargar
  useEffect(() => {
    if (!hasData && !loading && !generating) {
      generateSummary();
    }
  }, []);

  const experiencias: Experiencia[] = [
    {
      fuente: "Repositorio",
      nombre: "Informe_Agua_Segura_2024.pdf",
      etiquetas: ["Agua", "2024", "Validado"],
      fecha: "15/10/2024"
    },
    {
      fuente: "Subida local",
      nombre: "Documento_Experiencia.pdf",
      etiquetas: ["Temporal", "Análisis"],
      fecha: "20/10/2024"
    }
  ];

  const preguntasSugeridas = [
    {
      categoria: "Pertinencia",
      icon: Target,
      pregunta: "¿Tu propuesta responde a una necesidad prioritaria en tu comunidad educativa?"
    },
    {
      categoria: "Madurez",
      icon: Clock,
      pregunta: "¿Cuánto tiempo lleva implementándose esta innovación?"
    },
    {
      categoria: "Evidencias",
      icon: FileCheck,
      pregunta: "¿Qué documentos respaldan tus avances?"
    },
    {
      categoria: "Participación",
      icon: Users,
      pregunta: "¿Qué actores están involucrados en la ejecución?"
    },
    {
      categoria: "Sistematización",
      icon: BookMarked,
      pregunta: "¿Cómo registrarás los resultados del proceso?"
    }
  ];

  const generarPreguntas = () => {
    setPreguntasGeneradas(true);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E6F4F1' }}>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3" style={{ color: '#005C6B' }}>
            Elegir tipo de proyecto
          </h1>
          <p className="text-lg mb-2" style={{ color: '#00A6A6' }}>
            Selecciona la categoría de proyecto con la que deseas postular al CNPIE 2025.
          </p>
          <p className="text-base" style={{ color: '#1A1A1A' }}>
            Puedes basarte en tu diagnóstico, tus experiencias y las preguntas sugeridas para tomar la mejor decisión.
          </p>
        </div>

        {/* Resumen del diagnóstico y experiencias */}
        <Card className="mb-6 border-0 shadow-md" style={{ backgroundColor: '#DDF4F2' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: '#005C6B' }}>
              <FileText className="w-5 h-5" />
              Resumen de tu diagnóstico
            </CardTitle>
            <CardDescription style={{ color: '#1A1A1A', opacity: 0.7 }}>
              Los datos mostrados son solo de lectura; no editables.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading || generating ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#00A6A6' }} />
                <span className="ml-3" style={{ color: '#005C6B' }}>
                  Generando resumen con IA...
                </span>
              </div>
            ) : !hasData ? (
              <div className="py-8 text-center">
                <p className="mb-4" style={{ color: '#1A1A1A' }}>
                  No se encontraron datos de diagnóstico. Completa los aceleradores 1, 2 y 3 primero.
                </p>
                <Button 
                  onClick={generateSummary}
                  className="text-white font-medium"
                  style={{ backgroundColor: '#00A6A6' }}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Intentar generar resumen
                </Button>
              </div>
            ) : (
              <>
                {/* Datos del diagnóstico */}
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium" style={{ color: '#005C6B' }}>Docente:</p>
                    <p style={{ color: '#1A1A1A' }}>{hallazgos?.docente}</p>
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: '#005C6B' }}>Institución:</p>
                    <p style={{ color: '#1A1A1A' }}>{hallazgos?.institucion}</p>
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: '#005C6B' }}>Región:</p>
                    <p style={{ color: '#1A1A1A' }}>{hallazgos?.region}</p>
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: '#005C6B' }}>Fecha:</p>
                    <p style={{ color: '#1A1A1A' }}>{hallazgos?.fecha}</p>
                  </div>
                </div>

                {/* Hallazgos clave */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium" style={{ color: '#005C6B' }}>Hallazgos clave:</p>
                    <Button
                      onClick={generateSummary}
                      variant="ghost"
                      size="sm"
                      disabled={generating}
                      className="text-xs"
                      style={{ color: '#00A6A6' }}
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      Regenerar
                    </Button>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-sm" style={{ color: '#1A1A1A' }}>
                    {hallazgos?.hallazgos.map((hallazgo, i) => (
                      <li key={i}>{hallazgo}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {/* Tabla de experiencias */}
            <div>
              <p className="font-medium mb-3" style={{ color: '#005C6B' }}>
                Experiencias registradas:
              </p>
              <div className="space-y-2">
                {experiencias.map((exp, i) => (
                  <div 
                    key={i}
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: '#E6F4F1' }}
                  >
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <span className="font-medium" style={{ color: '#1A1A1A' }}>
                        {exp.nombre}
                      </span>
                      <span 
                        className="px-2 py-1 rounded text-xs"
                        style={{ backgroundColor: '#DDF4F2', color: '#005C6B' }}
                      >
                        {exp.fuente}
                      </span>
                      {exp.etiquetas.map((etiqueta, j) => (
                        <span 
                          key={j}
                          className="px-2 py-1 rounded text-xs"
                          style={{ backgroundColor: '#DDF4F2', color: '#00A6A6' }}
                        >
                          {etiqueta}
                        </span>
                      ))}
                      <span className="text-xs ml-auto" style={{ color: '#1A1A1A', opacity: 0.6 }}>
                        {exp.fecha}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => navigate('/repositorio')}
              className="text-sm font-medium hover:underline"
              style={{ color: '#00A6A6' }}
            >
              Ver más en el Repositorio →
            </button>
          </CardContent>
        </Card>

        {/* Panel de preguntas IA sugeridas */}
        <Card className="mb-6 border-0 shadow-md" style={{ backgroundColor: '#DDF4F2' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: '#005C6B' }}>
              <Sparkles className="w-5 h-5" />
              Preguntas que pueden ayudarte a decidir
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!preguntasGeneradas ? (
              <Button 
                onClick={generarPreguntas}
                className="text-white font-medium"
                style={{ backgroundColor: '#00A6A6' }}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generar nuevas preguntas
              </Button>
            ) : (
              <div className="space-y-3">
                {preguntasSugeridas.map((item, i) => {
                  const IconComponent = item.icon;
                  return (
                    <div 
                      key={i}
                      className="p-4 rounded-lg"
                      style={{ backgroundColor: '#E6F4F1' }}
                    >
                      <div className="flex items-start gap-3">
                        <div 
                          className="p-2 rounded-lg flex-shrink-0"
                          style={{ backgroundColor: '#00A6A6' }}
                        >
                          <IconComponent className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm mb-1" style={{ color: '#005C6B' }}>
                            {item.categoria}
                          </p>
                          <p className="text-sm" style={{ color: '#1A1A1A' }}>
                            {item.pregunta}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <Alert className="border-0 mt-4" style={{ backgroundColor: '#E6F4F1' }}>
                  <Sparkles className="h-4 w-4" style={{ color: '#00A6A6' }} />
                  <AlertDescription style={{ color: '#1A1A1A' }}>
                    En la versión final, este panel usará la IA del módulo Docentes 2 con base en la rúbrica CNPIE 2025.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selección de tipo de proyecto */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#005C6B' }}>
            Selecciona tu tipo de proyecto
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Tarjeta 2A - Consolidado */}
            <Card 
              className="border-0 shadow-lg hover:shadow-xl transition-shadow"
              style={{ backgroundColor: '#005C6B' }}
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
                <CardDescription className="text-center text-white/90 text-sm">
                  Consolidado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-white/90 text-center">
                  Innovación Educativa Consolidado (2 años o más de ejecución).
                </p>
                <Button 
                  onClick={() => navigate('/proyectos/2a')}
                  className="w-full bg-white font-medium hover:bg-white/90"
                  style={{ color: '#005C6B' }}
                >
                  Entrar a Proyecto 2A
                </Button>
              </CardContent>
            </Card>

            {/* Tarjeta 2B - Implementación */}
            <Card 
              className="border-0 shadow-lg hover:shadow-xl transition-shadow"
              style={{ backgroundColor: '#00A6A6' }}
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
                <CardDescription className="text-center text-white/90 text-sm">
                  Implementación
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-white/90 text-center">
                  Innovación Educativa en Implementación (menos de 1 año de ejecución).
                </p>
                <Button 
                  onClick={() => navigate('/proyectos/2b')}
                  className="w-full bg-white font-medium hover:bg-white/90"
                  style={{ color: '#00A6A6' }}
                >
                  Entrar a Proyecto 2B
                </Button>
              </CardContent>
            </Card>

            {/* Tarjeta 2C - Investigación-Acción */}
            <Card 
              className="border-0 shadow-lg hover:shadow-xl transition-shadow"
              style={{ backgroundColor: '#1BBEAE' }}
            >
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white/20">
                    <BookMarked className="w-8 h-8 text-white" />
                  </div>
                </div>
                <CardTitle className="text-center text-white text-xl">
                  Proyecto 2C
                </CardTitle>
                <CardDescription className="text-center text-white/90 text-sm">
                  Investigación-Acción
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-white/90 text-center">
                  Proyecto de Investigación-Acción Participativa (fase exploratoria o de descubrimiento).
                </p>
                <Button 
                  onClick={() => navigate('/proyectos/2c')}
                  className="w-full bg-white font-medium hover:bg-white/90"
                  style={{ color: '#1BBEAE' }}
                >
                  Entrar a Proyecto 2C
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bloque de navegación */}
        <div className="space-y-4">
          <Alert className="border-0" style={{ backgroundColor: '#DDF4F2' }}>
            <AlertDescription style={{ color: '#1A1A1A' }}>
              Puedes cambiar de tipo más adelante usando el botón de cambio rápido (Mini).
            </AlertDescription>
          </Alert>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 pt-4 border-t border-gray-300">
            <button
              onClick={() => navigate('/proyectos')}
              className="flex items-center gap-2 text-sm font-medium hover:underline"
              style={{ color: '#005C6B' }}
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al menú CNPIE
            </button>
            <button
              onClick={() => navigate('/repositorio')}
              className="flex items-center gap-2 text-sm font-medium hover:underline"
              style={{ color: '#005C6B' }}
            >
              <BookOpen className="w-4 h-4" />
              Ir al Repositorio de experiencias
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
