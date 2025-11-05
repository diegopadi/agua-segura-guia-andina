import { useNavigate } from "react-router-dom";
import { useCNPIEProject } from "@/hooks/useCNPIEProject";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { ArrowLeft, Download, CheckCircle, Info, FileText, AlertCircle, CheckCircle2, Target } from "lucide-react";
import { CNPIERubricScoreModal } from "@/components/cnpie/CNPIERubricScoreModal";
import { generateCNPIEPDF } from "@/utils/cnpie-pdf-generator";

interface EvaluacionData {
  puntajes_criterios: any;
  puntaje_total: number;
  puntaje_maximo: number;
  porcentaje_cumplimiento: number;
  areas_fuertes: string[];
  areas_mejorar: string[];
  recomendaciones_ia: string[];
}

export default function Etapa3Acelerador8() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { proyecto, saving } = useCNPIEProject('2A');
  const [evaluacion, setEvaluacion] = useState<EvaluacionData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [evaluating, setEvaluating] = useState(false);

  const caracteresLimites: Record<string, number> = {
    originalidad: 8000,
    impacto: 4000,
    participacion: 3000,
    sostenibilidad: 2500,
    pertinencia: 2000,
    reflexion: 1500
  };

  const aceleradores = [
    { numero: 1, titulo: "Diagnóstico", completado: proyecto?.estado_aceleradores?.etapa1_acelerador1 === 'completado' },
    { numero: 2, titulo: "Originalidad y CNEB", completado: proyecto?.estado_aceleradores?.etapa2_acelerador2 === 'completado' },
    { numero: 3, titulo: "Impacto y Resultados", completado: proyecto?.estado_aceleradores?.etapa2_acelerador3 === 'completado' },
    { numero: 4, titulo: "Participación", completado: proyecto?.estado_aceleradores?.etapa2_acelerador4 === 'completado' },
    { numero: 5, titulo: "Sostenibilidad", completado: proyecto?.estado_aceleradores?.etapa2_acelerador5 === 'completado' },
    { numero: 6, titulo: "Pertinencia", completado: proyecto?.estado_aceleradores?.etapa2_acelerador6 === 'completado' },
    { numero: 7, titulo: "Reflexión", completado: proyecto?.estado_aceleradores?.etapa2_acelerador7 === 'completado' },
  ];

  const todosCompletados = aceleradores.every(a => a.completado);
  const progreso = Math.round((aceleradores.filter(a => a.completado).length / aceleradores.length) * 100);

  const validaciones = [
    {
      id: 'completitud',
      nombre: 'Todos los aceleradores completados',
      check: () => todosCompletados,
      mensaje: 'Completa todos los aceleradores antes de evaluar'
    },
    {
      id: 'metodologia',
      nombre: 'Metodología descrita (mín. 500 caracteres)',
      check: () => {
        const a2 = proyecto?.datos_aceleradores?.etapa2_acelerador2;
        return a2?.metodologiaDescripcion && a2.metodologiaDescripcion.length >= 500;
      },
      mensaje: 'La descripción de metodología debe tener al menos 500 caracteres'
    },
    {
      id: 'caracteres_originalidad',
      nombre: `Límite Originalidad (máx. ${caracteresLimites.originalidad.toLocaleString()})`,
      check: () => {
        const a2 = proyecto?.datos_aceleradores?.etapa2_acelerador2;
        return !a2?.metodologiaDescripcion || a2.metodologiaDescripcion.length <= caracteresLimites.originalidad;
      },
      mensaje: `Originalidad excede ${caracteresLimites.originalidad.toLocaleString()} caracteres`
    }
  ];

  const todoValidado = validaciones.every(v => v.check());

  const handleEvaluate = async () => {
    if (!proyecto) return;
    
    try {
      setEvaluating(true);
      setShowModal(true);

      const { data, error } = await supabase.functions.invoke('evaluate-cnpie-project', {
        body: {
          proyectoId: proyecto.id,
          categoria: '2A',
          datosActuales: proyecto.datos_aceleradores
        }
      });

      if (error) throw error;

      if (data.success) {
        setEvaluacion(data.evaluation);
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setShowModal(false);
    } finally {
      setEvaluating(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!proyecto) return;
    setDownloadingPDF(true);
    try {
      await generateCNPIEPDF(proyecto, evaluacion);
      toast({ title: "PDF generado", description: "La documentación ha sido descargada" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleComplete = async () => {
    if (!evaluacion) {
      toast({ title: "Evaluación requerida", description: "Genera la evaluación predictiva primero", variant: "destructive" });
      return;
    }

    // Marcar el acelerador 8 como completado
    if (!proyecto) return;
    
    try {
      const { error } = await supabase
        .from('cnpie_proyectos')
        .update({
          estado_aceleradores: {
            ...proyecto.estado_aceleradores,
            etapa3_acelerador8: 'completado'
          }
        })
        .eq('id', proyecto.id);

      if (error) throw error;

      navigate('/cnpie/2a/completado');
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E6F4F1' }}>
      <div className="container mx-auto px-4 py-8 max-w-6xl pb-32">
        <Button variant="ghost" onClick={() => navigate('/proyectos/2a')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />Volver al Dashboard
        </Button>
        
        <h1 className="text-4xl font-bold mb-3" style={{ color: '#005C6B' }}>
          Etapa 3: Evaluación Final
        </h1>
        <p className="text-lg mb-6" style={{ color: '#00A6A6' }}>
          Valida tu proyecto contra las rúbricas CNPIE y genera tu documentación final
        </p>

        {/* Progreso */}
        <Card className="mb-6 border-0 shadow-md" style={{ backgroundColor: '#DDF4F2' }}>
          <CardHeader>
            <CardTitle style={{ color: '#005C6B' }}>Resumen del Proyecto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              {aceleradores.map((a) => (
                <div key={a.numero} className="flex items-center justify-between text-sm">
                  <span>A{a.numero}: {a.titulo}</span>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
              ))}
            </div>
            <Progress value={100} className="h-2" />
          </CardContent>
        </Card>

        {/* Validación */}
        <Card className="mb-6 border-0 shadow-md" style={{ backgroundColor: todoValidado ? '#DCFCE7' : '#FEF3C7' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: '#005C6B' }}>
              <CheckCircle2 className={`w-6 h-6 ${todoValidado ? 'text-green-600' : 'text-yellow-600'}`} />
              Validación para Plataforma CNPIE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {validaciones.map(v => {
                const ok = v.check();
                return (
                  <div key={v.id} className="flex items-start gap-2">
                    <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center ${ok ? 'bg-green-500' : 'bg-yellow-500'}`}>
                      {ok ? <CheckCircle className="w-3 h-3 text-white" /> : <AlertCircle className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${ok ? 'text-gray-900' : 'text-yellow-900'}`}>{v.nombre}</p>
                      {!ok && <p className="text-xs text-yellow-700 mt-1">{v.mensaje}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Evaluación con Rúbrica */}
        <Card className="mb-6 border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: '#005C6B' }}>
              <Target className="w-6 h-6" style={{ color: '#00A6A6' }} />
              Evaluación Predictiva con Rúbrica CNPIE
            </CardTitle>
            <CardDescription>Obtén un puntaje estimado según los criterios oficiales</CardDescription>
          </CardHeader>
          <CardContent>
            {!evaluacion ? (
              <Button onClick={handleEvaluate} disabled={evaluating} className="w-full text-white" style={{ backgroundColor: '#00A6A6' }}>
                <Target className="w-4 h-4 mr-2" />
                {evaluating ? 'Evaluando...' : 'Generar Evaluación Predictiva'}
              </Button>
            ) : (
              <Alert className="border-green-500 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  <strong>Evaluación completada:</strong> {evaluacion.puntaje_total}/{evaluacion.puntaje_maximo} puntos 
                  ({evaluacion.porcentaje_cumplimiento}% de cumplimiento)
                  <Button variant="outline" size="sm" onClick={() => setShowModal(true)} className="ml-4">
                    Ver Detalles
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Descarga */}
        <Card className="mb-6 border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: '#005C6B' }}>
              <Download className="w-6 h-6" style={{ color: '#00A6A6' }} />
              Documentación Consolidada
            </CardTitle>
            <CardDescription>PDF optimizado para copiar/pegar en la plataforma CNPIE</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleDownloadPDF} disabled={downloadingPDF} className="w-full text-white" style={{ backgroundColor: '#00A6A6' }}>
              <Download className="w-4 h-4 mr-2" />
              {downloadingPDF ? 'Generando...' : 'Descargar PDF Completo'}
            </Button>
          </CardContent>
        </Card>

        {/* Guía Evidencias */}
        <Card className="mb-6 border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: '#005C6B' }}>
              <FileText className="w-6 h-6" style={{ color: '#00A6A6' }} />
              Guía de Evidencias Adicionales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Evidencias Recomendadas:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground ml-4">
                <li>📷 Fotos de estudiantes trabajando (3-5 fotos)</li>
                <li>📹 Videos cortos de sesiones (máx. 3 min)</li>
                <li>📊 Gráficos de resultados e impacto</li>
                <li>📝 Testimonios de estudiantes y familias</li>
              </ul>
            </div>
            <Alert className="border-blue-500 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900 text-sm">
                La plataforma CNPIE permite hasta 5 archivos adicionales. Formatos: JPG, PNG, MP4, PDF (máx. 10MB cada uno).
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* Botón fijo */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 shadow-lg">
        <div className="container mx-auto flex justify-center">
          <Button 
            size="lg" 
            disabled={!evaluacion || saving} 
            onClick={handleComplete} 
            className="text-white" 
            style={{ backgroundColor: '#005C6B' }}
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            {saving ? 'Finalizando...' : 'Finalizar y Ver Resumen'}
          </Button>
        </div>
      </div>

      {evaluacion && (
        <CNPIERubricScoreModal 
          isOpen={showModal} 
          onClose={() => setShowModal(false)} 
          evaluation={evaluacion} 
          loading={evaluating} 
          categoria="2A" 
        />
      )}
    </div>
  );
}
