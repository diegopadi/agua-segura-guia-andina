import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FileText, Trash2, Sparkles, AlertCircle, CheckCircle2, ArrowLeft, BookOpen, Loader2 } from "lucide-react";
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
  recomendacion: "2A" | "2B" | "2C";
  confianza: number;
  justificacion: string;
  fortalezas: string[];
  aspectos_a_fortalecer: string[];
}

export default function Generacion() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [diagnosticoImportado, setDiagnosticoImportado] = useState(false);
  const [adjuntos, setAdjuntos] = useState<FileRecord[]>([]);
  const [preguntasGeneradas, setPreguntasGeneradas] = useState<PreguntaGenerada[]>([]);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [recomendacion, setRecomendacion] = useState<Recomendacion | null>(null);
  const [generatingRecommendation, setGeneratingRecommendation] = useState(false);
  const { hallazgos, generating, generateSummary, hasData } = useAcceleratorsSummary();

  const importarDiagnostico = async () => {
    await generateSummary();
    setDiagnosticoImportado(true);
  };

  const handleSelectFiles = (files: FileRecord[]) => {
    setAdjuntos([...adjuntos, ...files]);
    toast({
      title: "Archivos adjuntados",
      description: `${files.length} archivo(s) agregado(s) al análisis`
    });
  };

  const quitarAdjunto = (id: string) => {
    setAdjuntos(adjuntos.filter(a => a.id !== id));
  };

  const generarPreguntas = async () => {
    if (!diagnosticoImportado || !hallazgos) {
      toast({
        title: "Error",
        description: "Debes importar el diagnóstico primero",
        variant: "destructive"
      });
      return;
    }

    try {
      setGeneratingQuestions(true);

      const { data, error } = await supabase.functions.invoke('generate-questions-from-context', {
        body: {
          diagnostico: hallazgos,
          experiencias: adjuntos
        }
      });

      if (error) throw error;

      if (data.success) {
        setPreguntasGeneradas(data.data.preguntas);
        toast({
          title: "Preguntas generadas",
          description: `${data.data.preguntas.length} preguntas creadas con IA`
        });
      }
    } catch (error) {
      console.error('Error generando preguntas:', error);
      toast({
        title: "Error",
        description: "No se pudieron generar las preguntas",
        variant: "destructive"
      });
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handleSubmitAnswers = async (respuestas: Record<string, string>) => {
    try {
      setGeneratingRecommendation(true);

      const { data, error } = await supabase.functions.invoke('recommend-project-type', {
        body: {
          diagnostico: hallazgos,
          experiencias: adjuntos,
          respuestas
        }
      });

      if (error) throw error;

      if (data.success) {
        setRecomendacion(data.data);
        toast({
          title: "Recomendación generada",
          description: `Proyecto ${data.data.recomendacion} sugerido`
        });
      }
    } catch (error) {
      console.error('Error generando recomendación:', error);
      toast({
        title: "Error",
        description: "No se pudo generar la recomendación",
        variant: "destructive"
      });
    } finally {
      setGeneratingRecommendation(false);
    }
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
                disabled={generating}
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importando y analizando...
                  </>
                ) : (
                  'Importar diagnóstico de Docentes.IA (modo lectura)'
                )}
              </Button>
            ) : (
              <div className="space-y-3">
                <Alert className="border-0" style={{ backgroundColor: '#E6F4F1' }}>
                  <AlertCircle className="h-4 w-4" style={{ color: '#00A6A6' }} />
                  <AlertDescription style={{ color: '#1A1A1A' }}>
                    Resumen generado automáticamente con IA a partir de tus aceleradores completados.
                  </AlertDescription>
                </Alert>
                {hasData && hallazgos ? (
                  <>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium" style={{ color: '#005C6B' }}>Docente:</p>
                        <p style={{ color: '#1A1A1A' }}>{hallazgos.docente}</p>
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: '#005C6B' }}>Institución:</p>
                        <p style={{ color: '#1A1A1A' }}>{hallazgos.institucion}</p>
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: '#005C6B' }}>Región:</p>
                        <p style={{ color: '#1A1A1A' }}>{hallazgos.region}</p>
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: '#005C6B' }}>Fecha:</p>
                        <p style={{ color: '#1A1A1A' }}>{hallazgos.fecha}</p>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium mb-2" style={{ color: '#005C6B' }}>Hallazgos clave:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm" style={{ color: '#1A1A1A' }}>
                        {hallazgos.hallazgos.map((hallazgo, i) => (
                          <li key={i}>{hallazgo}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="py-4 text-center">
                    <p style={{ color: '#1A1A1A' }}>
                      No se encontraron datos. Completa los aceleradores 1, 2 y 3 primero.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bloque B — Experiencias iniciales */}
        <Card className="mb-6 border-0 shadow-md" style={{ backgroundColor: '#DDF4F2' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: '#005C6B' }}>
              <FileText className="w-5 h-5" />
              Experiencias iniciales
            </CardTitle>
            <CardDescription style={{ color: '#1A1A1A', opacity: 0.7 }}>
              Adjunta tus informes/documentos existentes para que formen parte del análisis inicial.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RepositoryFilePicker
              onSelect={handleSelectFiles}
              multiple={true}
              triggerLabel="Adjuntar desde Repositorio"
            />

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
                          {adjunto.url.split('/').pop()}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#DDF4F2', color: '#005C6B' }}>
                            {adjunto.file_type || 'documento'}
                          </span>
                          <span className="text-xs" style={{ color: '#1A1A1A', opacity: 0.6 }}>
                            {(adjunto.size_bytes / (1024 * 1024)).toFixed(2)} MB
                          </span>
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
                Los archivos del repositorio se vinculan permanentemente para el análisis de IA.
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
                disabled={!diagnosticoImportado || generatingQuestions}
              >
                {generatingQuestions ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generando preguntas con IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generar preguntas
                  </>
                )}
              </Button>
            ) : (
              <QuestionsForm 
                preguntas={preguntasGeneradas}
                onSubmit={handleSubmitAnswers}
                loading={generatingRecommendation}
              />
            )}
          </CardContent>
        </Card>

        {/* Bloque D — Recomendación automática */}
        {recomendacion && (
          <Card className="mb-6 border-0 shadow-lg" style={{ backgroundColor: '#00A6A6' }}>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="w-8 h-8 text-white flex-shrink-0 mt-1" />
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
                  <p className="font-semibold text-white mb-2">Aspectos a fortalecer:</p>
                  <ul className="list-disc list-inside space-y-1 text-white/90">
                    {recomendacion.aspectos_a_fortalecer.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <Alert className="border-0 bg-white/10">
                <AlertDescription className="text-white text-sm">
                  Puedes continuar con la recomendación o elegir manualmente otro tipo de proyecto.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Bloque E — Navegación */}
        {recomendacion && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <Button
                onClick={() => navigate('/proyectos/2a')}
                className={`h-auto py-4 flex flex-col gap-2 ${recomendacion.recomendacion === '2A' ? 'ring-4 ring-offset-2' : ''}`}
                style={{ 
                  backgroundColor: recomendacion.recomendacion === '2A' ? '#005C6B' : '#DDF4F2',
                  color: recomendacion.recomendacion === '2A' ? 'white' : '#005C6B'
                }}
              >
                <span className="font-bold text-lg">Proyecto 2A</span>
                <span className="text-xs">Consolidado</span>
              </Button>
              
              <Button
                onClick={() => navigate('/proyectos/2b')}
                className={`h-auto py-4 flex flex-col gap-2 ${recomendacion.recomendacion === '2B' ? 'ring-4 ring-offset-2' : ''}`}
                style={{
                  backgroundColor: recomendacion.recomendacion === '2B' ? '#00A6A6' : '#DDF4F2',
                  color: recomendacion.recomendacion === '2B' ? 'white' : '#00A6A6'
                }}
              >
                <span className="font-bold text-lg">Proyecto 2B</span>
                <span className="text-xs">En Implementación</span>
              </Button>
              
              <Button
                onClick={() => navigate('/proyectos/2c')}
                className={`h-auto py-4 flex flex-col gap-2 ${recomendacion.recomendacion === '2C' ? 'ring-4 ring-offset-2' : ''}`}
                style={{ 
                  backgroundColor: recomendacion.recomendacion === '2C' ? '#1BBEAE' : '#DDF4F2',
                  color: recomendacion.recomendacion === '2C' ? 'white' : '#1BBEAE'
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
