import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, CheckCircle, Download, FileText, Info, Target, Loader2 } from "lucide-react";
import { useEtapa3V2 } from "@/hooks/useEtapa3V2";
import { useToast } from "@/hooks/use-toast";
import { generateEtapa3PDF } from "@/utils/etapa3-pdf-generator";
import { supabase } from "@/integrations/supabase/client";

interface CoherenceAnalysis {
  coherence_score: number;
  fortalezas: string[];
  areas_mejora: string[];
  recomendaciones: string[];
}

interface SesionClaseLocal {
  id: string;
  session_index: number;
  titulo: string;
  inicio?: string | null;
  desarrollo?: string | null;
  cierre?: string | null;
  evidencias?: string[];
}

export default function Etapa3EvaluacionFinal() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { unidad, rubrica, sesiones, progress, validateEtapa3Final, loading, saving } = useEtapa3V2();
  const [coherenceAnalysis, setCoherenceAnalysis] = useState<CoherenceAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  const aceleradores = [
    { numero: 8, titulo: "Unidad de Aprendizaje", completado: !!unidad && unidad.estado === 'CERRADO' },
    { numero: 9, titulo: "Rúbrica de Evaluación", completado: !!rubrica && rubrica.estado === 'CERRADO' },
    { numero: 10, titulo: "Sesiones de Clase", completado: sesiones.length > 0 && sesiones.every(s => s.estado === 'CERRADO') },
  ];

  const todosCompletados = aceleradores.every(a => a.completado);

  const handleAnalyzeCoherence = async () => {
    if (!unidad || !rubrica || sesiones.length === 0) {
      toast({
        title: "Datos incompletos",
        description: "Debes completar todos los aceleradores antes de analizar",
        variant: "destructive",
      });
      return;
    }

    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-etapa3-coherence', {
        body: {
          unidad_data: unidad,
          rubrica_data: rubrica,
          sesiones_data: sesiones
        }
      });

      if (error) throw error;

      setCoherenceAnalysis(data);
      toast({
        title: "Análisis completado",
        description: `Puntaje de coherencia: ${data.coherence_score}%`,
      });
    } catch (error: any) {
      console.error('Error analyzing coherence:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo realizar el análisis",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!unidad) return;
    
    setDownloadingPDF(true);
    try {
      // Convert sesiones to local type
      const sesionesLocal: SesionClaseLocal[] = sesiones.map(s => ({
        id: s.id,
        session_index: s.session_index,
        titulo: s.titulo,
        inicio: s.inicio,
        desarrollo: s.desarrollo,
        cierre: s.cierre,
        evidencias: s.evidencias || []
      }));
      
      await generateEtapa3PDF(unidad, rubrica, sesionesLocal, coherenceAnalysis);
      toast({
        title: "PDF generado",
        description: "La unidad completa ha sido descargada exitosamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo generar el PDF",
        variant: "destructive",
      });
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleValidateAndFinalize = async () => {
    if (!coherenceAnalysis) {
      toast({
        title: "Análisis requerido",
        description: "Primero debes generar el análisis de coherencia pedagógica",
        variant: "destructive",
      });
      return;
    }

    const success = await validateEtapa3Final();
    if (success) {
      navigate('/inicio');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-6xl pb-32">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/etapa3')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Etapa 3
          </Button>
          
          <h1 className="text-4xl font-bold mb-3">
            Evaluación Final - Etapa 3
          </h1>
          <p className="text-lg text-muted-foreground">
            Valida la coherencia pedagógica de tu unidad de aprendizaje completa
          </p>
        </div>

        {/* Progress Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Progreso de Etapa 3</CardTitle>
              {todosCompletados && (
                <Badge variant="default">100% Completado</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aceleradores.map(acelerador => (
                <div key={acelerador.numero} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    acelerador.completado ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                    {acelerador.completado && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                  <span className={acelerador.completado ? 'text-foreground' : 'text-muted-foreground'}>
                    Acelerador {acelerador.numero}: {acelerador.titulo}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Unidad Summary */}
        {unidad && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Resumen de la Unidad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Título:</strong> {unidad.titulo}</p>
              <p><strong>Área:</strong> {unidad.area_curricular}</p>
              <p><strong>Grado:</strong> {unidad.grado}</p>
              <p><strong>Sesiones:</strong> {unidad.numero_sesiones}</p>
              <p><strong>Duración:</strong> {unidad.duracion_min} minutos por sesión</p>
            </CardContent>
          </Card>
        )}

        {/* Coherence Analysis */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-6 h-6" />
              Análisis de Coherencia Pedagógica
            </CardTitle>
            <CardDescription>
              Valida que las sesiones desarrollen las competencias y que la rúbrica evalúe lo enseñado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!coherenceAnalysis ? (
                <Button 
                  onClick={handleAnalyzeCoherence}
                  disabled={!todosCompletados || analyzing}
                  className="w-full sm:w-auto"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analizando...
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4 mr-2" />
                      Analizar Coherencia Pedagógica
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-4">
                  <Alert className="border-green-500 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-900">
                      <strong>Análisis completado:</strong> {coherenceAnalysis.coherence_score}% de coherencia pedagógica
                    </AlertDescription>
                  </Alert>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Fortalezas:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {coherenceAnalysis.fortalezas.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Áreas de mejora:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {coherenceAnalysis.areas_mejora.map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Recomendaciones:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {coherenceAnalysis.recomendaciones.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Download Documentation */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-6 h-6" />
              Unidad Completa
            </CardTitle>
            <CardDescription>
              Descarga un documento con toda la unidad de aprendizaje lista para implementar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleDownloadPDF}
              disabled={!unidad || downloadingPDF}
              className="w-full sm:w-auto"
            >
              <Download className="w-4 h-4 mr-2" />
              {downloadingPDF ? 'Generando PDF...' : 'Descargar Unidad Completa (PDF)'}
            </Button>
          </CardContent>
        </Card>

        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            El análisis de coherencia es una herramienta para mejorar tu unidad. 
            Revisa las recomendaciones y ajusta tu diseño si es necesario.
          </AlertDescription>
        </Alert>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 shadow-lg">
        <div className="container mx-auto flex justify-center">
          <Button 
            size="lg"
            disabled={!coherenceAnalysis || saving}
            onClick={handleValidateAndFinalize}
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            {saving ? 'Validando...' : 'Validar Etapa 3 y Finalizar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
