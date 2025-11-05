import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, CheckCircle, Download, FileText, Info, Target } from "lucide-react";
import { useCNPIEProject } from "@/hooks/useCNPIEProject";
import { CNPIERubricScoreModal } from "@/components/cnpie/CNPIERubricScoreModal";
import { useToast } from "@/hooks/use-toast";
import { generateCNPIEPDF } from "@/utils/cnpie-pdf-generator";
import { supabase } from "@/integrations/supabase/client";

interface EvaluacionData {
  proyecto_id: string;
  tipo_evaluacion: string;
  puntaje_total: number;
  puntaje_maximo: number;
  porcentaje_cumplimiento: number;
  areas_fuertes: string[];
  areas_mejorar: string[];
  recomendaciones_ia: string[];
  puntajes_criterios: any;
}

export default function Etapa2EvaluacionFinal() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { proyecto, validateEvaluacionFinal, saving } = useCNPIEProject('2A');
  const [evaluacion, setEvaluacion] = useState<EvaluacionData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  const aceleradores = [
    { numero: 2, titulo: "Vinculación al CNEB", completado: proyecto?.estado_aceleradores?.etapa2_acelerador2 === 'completado' },
    { numero: 3, titulo: "Impacto y Resultados", completado: proyecto?.estado_aceleradores?.etapa2_acelerador3 === 'completado' },
    { numero: 4, titulo: "Participación Comunitaria", completado: proyecto?.estado_aceleradores?.etapa2_acelerador4 === 'completado' },
    { numero: 5, titulo: "Sostenibilidad", completado: proyecto?.estado_aceleradores?.etapa2_acelerador5 === 'completado' },
    { numero: 6, titulo: "Pertinencia Pedagógica", completado: proyecto?.estado_aceleradores?.etapa2_acelerador6 === 'completado' },
    { numero: 7, titulo: "Reflexión y Aprendizajes", completado: proyecto?.estado_aceleradores?.etapa2_acelerador7 === 'completado' },
  ];

  const todosCompletados = aceleradores.every(a => a.completado);

  const handleEvaluationComplete = (evaluacionData: EvaluacionData) => {
    setEvaluacion(evaluacionData);
    setShowModal(true);
  };

  const handleDownloadPDF = async () => {
    if (!proyecto) return;
    
    setDownloadingPDF(true);
    try {
      await generateCNPIEPDF(proyecto, evaluacion);
      toast({
        title: "PDF generado",
        description: "La documentación ha sido descargada exitosamente",
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

  const handleValidateAndContinue = async () => {
    if (!evaluacion) {
      toast({
        title: "Evaluación requerida",
        description: "Primero debes generar la evaluación predictiva",
        variant: "destructive",
      });
      return;
    }

    const success = await validateEvaluacionFinal();
    if (success) {
      navigate('/etapa3');
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E6F4F1' }}>
      <div className="container mx-auto px-4 py-8 max-w-6xl pb-32">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/cnpie/2a/etapa2/overview')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Overview de Etapa 2
          </Button>
          
          <h1 className="text-4xl font-bold mb-3" style={{ color: '#005C6B' }}>
            Evaluación Final - Etapa 2
          </h1>
          <p className="text-lg" style={{ color: '#00A6A6' }}>
            Revisa tu proyecto según las rúbricas CNPIE 2025 antes de continuar a la Etapa 3
          </p>
        </div>

        {/* Progress Card */}
        <Card className="mb-6 border-0 shadow-md" style={{ backgroundColor: '#DDF4F2' }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle style={{ color: '#005C6B' }}>Progreso de Etapa 2</CardTitle>
              {todosCompletados && (
                <Badge className="text-white" style={{ backgroundColor: '#1BBEAE' }}>
                  100% Completado
                </Badge>
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
                  <span className={acelerador.completado ? 'text-gray-900' : 'text-gray-500'}>
                    Acelerador {acelerador.numero}: {acelerador.titulo}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Evaluación CNPIE */}
        <Card className="mb-6 border-0 shadow-md" style={{ backgroundColor: '#FFFFFF' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: '#005C6B' }}>
              <Target className="w-6 h-6" style={{ color: '#00A6A6' }} />
              Evaluación según Rúbricas CNPIE 2025
            </CardTitle>
            <CardDescription>
              Obtén un puntaje predictivo de cómo se evaluaría tu proyecto en CNPIE
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!evaluacion ? (
                <Button
                  onClick={async () => {
                    if (!proyecto) return;
                    try {
                      const { data, error } = await supabase.functions.invoke('evaluate-cnpie-project', {
                        body: {
                          proyectoId: proyecto.id,
                          categoria: '2A',
                          datosActuales: proyecto.datos_aceleradores
                        }
                      });
                      if (error) throw error;
                      if (data.success) {
                        handleEvaluationComplete(data.evaluation);
                      }
                    } catch (error: any) {
                      toast({
                        title: "Error",
                        description: error.message,
                        variant: "destructive"
                      });
                    }
                  }}
                  className="w-full sm:w-auto text-white"
                  style={{ backgroundColor: '#00A6A6' }}
                >
                  <Target className="w-4 h-4 mr-2" />
                  Generar Evaluación Predictiva
                </Button>
              ) : (
                <Alert className="border-green-500 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-900">
                    <strong>Evaluación completada:</strong> {evaluacion.puntaje_total}/{evaluacion.puntaje_maximo} puntos 
                    ({evaluacion.porcentaje_cumplimiento}% de cumplimiento)
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Descarga de Documentación */}
        <Card className="mb-6 border-0 shadow-md" style={{ backgroundColor: '#FFFFFF' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: '#005C6B' }}>
              <FileText className="w-6 h-6" style={{ color: '#00A6A6' }} />
              Documentación para CNPIE
            </CardTitle>
            <CardDescription>
              Descarga un documento completo con toda la información ingresada en los aceleradores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleDownloadPDF}
              disabled={!proyecto || downloadingPDF}
              className="w-full sm:w-auto text-white"
              style={{ backgroundColor: '#00A6A6' }}
            >
              <Download className="w-4 h-4 mr-2" />
              {downloadingPDF ? 'Generando PDF...' : 'Descargar Documentación Completa (PDF)'}
            </Button>
          </CardContent>
        </Card>

        {/* Información adicional */}
        <Alert className="mb-6 border-0" style={{ backgroundColor: '#DDF4F2' }}>
          <Info className="h-4 w-4" style={{ color: '#00A6A6' }} />
          <AlertDescription style={{ color: '#1A1A1A' }}>
            La evaluación predictiva es una herramienta orientativa. Los puntajes reales serán asignados 
            por los evaluadores de CNPIE según los criterios oficiales.
          </AlertDescription>
        </Alert>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 shadow-lg">
        <div className="container mx-auto flex justify-center">
          <Button 
            size="lg"
            disabled={!evaluacion || saving}
            onClick={handleValidateAndContinue}
            className="text-white font-medium"
            style={{ backgroundColor: evaluacion ? '#005C6B' : '#E6F4F1', color: evaluacion ? 'white' : '#005C6B' }}
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            {saving ? 'Validando...' : 'Validar Etapa 2 y Continuar a Etapa 3'}
          </Button>
        </div>
      </div>

      {/* Evaluation Modal */}
      {evaluacion && (
        <CNPIERubricScoreModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          evaluation={evaluacion}
          loading={false}
          categoria="2A"
        />
      )}
    </div>
  );
}
