import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FileText, Upload, Plus, Trash2, Sparkles, AlertCircle, CheckCircle2, ArrowLeft, BookOpen } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Adjunto {
  id: string;
  nombre: string;
  origen: "Repositorio" | "Subida";
  etiquetas: string[];
}

interface PreguntaGenerada {
  categoria: string;
  preguntas: string[];
}

export default function Generacion() {
  const navigate = useNavigate();
  const [diagnosticoImportado, setDiagnosticoImportado] = useState(false);
  const [adjuntos, setAdjuntos] = useState<Adjunto[]>([]);
  const [preguntasGeneradas, setPreguntasGeneradas] = useState<PreguntaGenerada[]>([]);
  const [preguntasPropias, setPreguntasPropias] = useState<string[]>([]);
  const [nuevaPregunta, setNuevaPregunta] = useState("");
  const [recomendacion, setRecomendacion] = useState<"2A" | "2B" | "2C" | null>(null);

  const importarDiagnostico = () => {
    setDiagnosticoImportado(true);
  };

  const adjuntarDesdeRepositorio = () => {
    // Simulación: agregar archivo del repositorio
    const nuevoAdjunto: Adjunto = {
      id: Date.now().toString(),
      nombre: "Informe_Agua_Segura_2024.pdf",
      origen: "Repositorio",
      etiquetas: ["Agua", "2024", "Validado"]
    };
    setAdjuntos([...adjuntos, nuevoAdjunto]);
  };

  const subirArchivoTemporal = () => {
    // Simulación: subir archivo temporal
    const nuevoAdjunto: Adjunto = {
      id: Date.now().toString(),
      nombre: "Documento_Experiencia.pdf",
      origen: "Subida",
      etiquetas: ["Temporal", "Análisis"]
    };
    setAdjuntos([...adjuntos, nuevoAdjunto]);
  };

  const quitarAdjunto = (id: string) => {
    setAdjuntos(adjuntos.filter(a => a.id !== id));
  };

  const generarPreguntas = () => {
    // Simulación: generar preguntas IA
    const preguntas: PreguntaGenerada[] = [
      {
        categoria: "Coherencia (estrategias ↔ actividades ↔ resultados)",
        preguntas: [
          "¿Las actividades propuestas evidencian claramente el logro de los resultados esperados?",
          "¿Existe coherencia entre las estrategias pedagógicas y los objetivos del proyecto?",
          "¿Cómo se articulan las diferentes fases del proyecto para asegurar continuidad?"
        ]
      },
      {
        categoria: "Priorización de bienes y servicios (Validación CNPIE)",
        preguntas: [
          "¿Qué bienes y servicios son indispensables para iniciar y cuáles pueden postergarse?",
          "¿Los recursos solicitados están justificados con base en las actividades planificadas?",
          "¿Existe un análisis de costo-beneficio para cada componente del proyecto?"
        ]
      },
      {
        categoria: "Evidencias y sistematización",
        preguntas: [
          "¿Cómo clasificarás las evidencias para la sistematización de resultados?",
          "¿Qué mecanismos de seguimiento y evaluación se implementarán durante el proyecto?",
          "¿Dónde y cómo se registrarán las evidencias de impacto en los estudiantes?"
        ]
      }
    ];
    setPreguntasGeneradas(preguntas);
    
    // Generar recomendación automática
    const tipos: Array<"2A" | "2B" | "2C"> = ["2A", "2B", "2C"];
    const recomendacionSimulada = tipos[Math.floor(Math.random() * tipos.length)];
    setRecomendacion(recomendacionSimulada);
  };

  const agregarPreguntaPropia = () => {
    if (nuevaPregunta.trim()) {
      setPreguntasPropias([...preguntasPropias, nuevaPregunta]);
      setNuevaPregunta("");
    }
  };

  const getRecomendacionTexto = (tipo: "2A" | "2B" | "2C") => {
    const textos = {
      "2A": "Proyecto Consolidado (≥2 años de implementación)",
      "2B": "Proyecto En Implementación (<1 año de desarrollo)",
      "2C": "Proyecto de Investigación-Acción Participativa"
    };
    return textos[tipo];
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E6F4F1' }}>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3" style={{ color: '#005C6B' }}>
            Generación de Proyecto (guiada)
          </h1>
          <p className="text-lg" style={{ color: '#00A6A6' }}>
            Importa tu diagnóstico, añade tus experiencias y genera preguntas para afinar tu postulación.
          </p>
        </div>

        {/* Bloque A — Importar diagnóstico */}
        <Card className="mb-6 border-0 shadow-md" style={{ backgroundColor: '#DDF4F2' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: '#005C6B' }}>
              <FileText className="w-5 h-5" />
              Importar diagnóstico (solo lectura)
            </CardTitle>
            <CardDescription style={{ color: '#1A1A1A', opacity: 0.7 }}>
              Vista de solo lectura; no se edita aquí.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!diagnosticoImportado ? (
              <Button 
                onClick={importarDiagnostico}
                className="text-white font-medium"
                style={{ backgroundColor: '#005C6B' }}
              >
                Importar diagnóstico de Docentes.IA (modo lectura)
              </Button>
            ) : (
              <div className="space-y-3">
                <Alert className="border-0" style={{ backgroundColor: '#E6F4F1' }}>
                  <AlertCircle className="h-4 w-4" style={{ color: '#00A6A6' }} />
                  <AlertDescription style={{ color: '#1A1A1A' }}>
                    Esta es una vista de solo lectura; no se edita aquí.
                  </AlertDescription>
                </Alert>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium" style={{ color: '#005C6B' }}>Docente:</p>
                    <p style={{ color: '#1A1A1A' }}>María González Pérez</p>
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: '#005C6B' }}>Institución:</p>
                    <p style={{ color: '#1A1A1A' }}>IE San Martín de Porres</p>
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: '#005C6B' }}>Región:</p>
                    <p style={{ color: '#1A1A1A' }}>Apurímac, Abancay</p>
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: '#005C6B' }}>Fecha:</p>
                    <p style={{ color: '#1A1A1A' }}>15 de octubre, 2024</p>
                  </div>
                </div>
                <div>
                  <p className="font-medium mb-2" style={{ color: '#005C6B' }}>Hallazgos clave:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm" style={{ color: '#1A1A1A' }}>
                    <li>Necesidad de fortalecer prácticas de higiene en estudiantes</li>
                    <li>Infraestructura de agua requiere mejoras</li>
                    <li>Alto interés de la comunidad educativa</li>
                    <li>Experiencias previas en proyectos ambientales</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bloque B — Experiencias iniciales */}
        <Card className="mb-6 border-0 shadow-md" style={{ backgroundColor: '#DDF4F2' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: '#005C6B' }}>
              <Upload className="w-5 h-5" />
              Experiencias iniciales
            </CardTitle>
            <CardDescription style={{ color: '#1A1A1A', opacity: 0.7 }}>
              Adjunta tus informes/documentos existentes para que formen parte del análisis inicial.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Button 
                onClick={adjuntarDesdeRepositorio}
                className="text-white font-medium"
                style={{ backgroundColor: '#005C6B' }}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Adjuntar desde Repositorio
              </Button>
              <Button 
                onClick={subirArchivoTemporal}
                className="font-medium"
                style={{ backgroundColor: '#E6F4F1', color: '#005C6B' }}
              >
                <Upload className="w-4 h-4 mr-2" />
                Subir archivo temporal
              </Button>
            </div>

            {adjuntos.length > 0 && (
              <div>
                <p className="font-medium mb-3" style={{ color: '#005C6B' }}>
                  Adjuntos del análisis:
                </p>
                <div className="space-y-2">
                  {adjuntos.map(adjunto => (
                    <div 
                      key={adjunto.id}
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{ backgroundColor: '#E6F4F1' }}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm" style={{ color: '#1A1A1A' }}>
                          {adjunto.nombre}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#DDF4F2', color: '#005C6B' }}>
                            {adjunto.origen}
                          </span>
                          {adjunto.etiquetas.map((etiqueta, i) => (
                            <span 
                              key={i}
                              className="text-xs px-2 py-1 rounded"
                              style={{ backgroundColor: '#DDF4F2', color: '#00A6A6' }}
                            >
                              {etiqueta}
                            </span>
                          ))}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => quitarAdjunto(adjunto.id)}
                        className="ml-2"
                      >
                        <Trash2 className="w-4 h-4" style={{ color: '#005C6B' }} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Alert className="border-0" style={{ backgroundColor: '#E6F4F1' }}>
              <AlertCircle className="h-4 w-4" style={{ color: '#00A6A6' }} />
              <AlertDescription style={{ color: '#1A1A1A' }}>
                En producción estos archivos se enlazarán de forma persistente desde el Repositorio.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Bloque C — Generador de preguntas IA */}
        <Card className="mb-6 border-0 shadow-md" style={{ backgroundColor: '#DDF4F2' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: '#005C6B' }}>
              <Sparkles className="w-5 h-5" />
              Preguntas sugeridas a partir de tu diagnóstico y experiencias
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {preguntasGeneradas.length === 0 ? (
              <Button 
                onClick={generarPreguntas}
                className="text-white font-medium"
                style={{ backgroundColor: '#00A6A6' }}
                disabled={!diagnosticoImportado}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generar preguntas
              </Button>
            ) : (
              <div className="space-y-4">
                {preguntasGeneradas.map((grupo, i) => (
                  <div key={i}>
                    <h3 className="font-semibold mb-2" style={{ color: '#005C6B' }}>
                      {grupo.categoria}
                    </h3>
                    <ul className="space-y-2">
                      {grupo.preguntas.map((pregunta, j) => (
                        <li 
                          key={j}
                          className="p-3 rounded-lg text-sm"
                          style={{ backgroundColor: '#E6F4F1', color: '#1A1A1A' }}
                        >
                          {pregunta}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                {/* Preguntas propias */}
                <div>
                  <h3 className="font-semibold mb-2" style={{ color: '#005C6B' }}>
                    Añade tus propias preguntas
                  </h3>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={nuevaPregunta}
                      onChange={(e) => setNuevaPregunta(e.target.value)}
                      placeholder="Escribe tu pregunta..."
                      className="flex-1 px-3 py-2 rounded-lg border-0"
                      style={{ backgroundColor: '#E6F4F1', color: '#1A1A1A' }}
                      onKeyPress={(e) => e.key === 'Enter' && agregarPreguntaPropia()}
                    />
                    <Button
                      onClick={agregarPreguntaPropia}
                      size="icon"
                      style={{ backgroundColor: '#00A6A6' }}
                    >
                      <Plus className="w-4 h-4 text-white" />
                    </Button>
                  </div>
                  {preguntasPropias.length > 0 && (
                    <ul className="space-y-2">
                      {preguntasPropias.map((pregunta, i) => (
                        <li 
                          key={i}
                          className="p-3 rounded-lg text-sm"
                          style={{ backgroundColor: '#E6F4F1', color: '#1A1A1A' }}
                        >
                          {pregunta}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <Alert className="border-0" style={{ backgroundColor: '#E6F4F1' }}>
                  <AlertCircle className="h-4 w-4" style={{ color: '#00A6A6' }} />
                  <AlertDescription style={{ color: '#1A1A1A' }}>
                    En la versión final, este bloque usará el motor IA con la rúbrica CNPIE.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bloque D — Recomendación automática */}
        {recomendacion && (
          <Card className="mb-6 border-0 shadow-lg" style={{ backgroundColor: '#00A6A6' }}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="w-8 h-8 text-white flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">
                    Recomendación: Proyecto {recomendacion}
                  </h3>
                  <p className="text-white/90 mb-3">
                    {getRecomendacionTexto(recomendacion)}
                  </p>
                  <p className="text-sm text-white/80">
                    Puedes continuar con la recomendación o elegir manualmente otro tipo de proyecto.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bloque E — Navegación */}
        {recomendacion && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <Button
                onClick={() => navigate('/proyectos/2a')}
                className={`h-auto py-4 flex flex-col gap-2 ${recomendacion === '2A' ? 'ring-4 ring-offset-2' : ''}`}
                style={{ 
                  backgroundColor: recomendacion === '2A' ? '#005C6B' : '#DDF4F2',
                  color: recomendacion === '2A' ? 'white' : '#005C6B'
                }}
              >
                <span className="font-bold text-lg">Proyecto 2A</span>
                <span className="text-xs">Consolidado</span>
              </Button>
              
              <Button
                onClick={() => navigate('/proyectos/2b')}
                className={`h-auto py-4 flex flex-col gap-2 ${recomendacion === '2B' ? 'ring-4 ring-offset-2' : ''}`}
                style={{ 
                  backgroundColor: recomendacion === '2B' ? '#005C6B' : '#DDF4F2',
                  color: recomendacion === '2B' ? 'white' : '#005C6B'
                }}
              >
                <span className="font-bold text-lg">Proyecto 2B</span>
                <span className="text-xs">En Implementación</span>
              </Button>
              
              <Button
                onClick={() => navigate('/proyectos/2c')}
                className={`h-auto py-4 flex flex-col gap-2 ${recomendacion === '2C' ? 'ring-4 ring-offset-2' : ''}`}
                style={{ 
                  backgroundColor: recomendacion === '2C' ? '#005C6B' : '#DDF4F2',
                  color: recomendacion === '2C' ? 'white' : '#005C6B'
                }}
              >
                <span className="font-bold text-lg">Proyecto 2C</span>
                <span className="text-xs">Investigación-Acción</span>
              </Button>
            </div>

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
                Ir al Repositorio
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
