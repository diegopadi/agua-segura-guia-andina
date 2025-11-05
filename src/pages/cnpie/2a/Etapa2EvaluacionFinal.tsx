import { useNavigate } from "react-router-dom";
import { useCNPIEProject } from "@/hooks/useCNPIEProject";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle, Info, ArrowRight } from "lucide-react";

export default function Etapa2EvaluacionFinal() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { proyecto, validateEvaluacionFinal, saving } = useCNPIEProject('2A');

  const aceleradores = [
    { numero: 2, titulo: "Originalidad y CNEB", completado: proyecto?.estado_aceleradores?.etapa2_acelerador2 === 'completado' },
    { numero: 3, titulo: "Impacto y Resultados", completado: proyecto?.estado_aceleradores?.etapa2_acelerador3 === 'completado' },
    { numero: 4, titulo: "Participación Comunitaria", completado: proyecto?.estado_aceleradores?.etapa2_acelerador4 === 'completado' },
    { numero: 5, titulo: "Sostenibilidad", completado: proyecto?.estado_aceleradores?.etapa2_acelerador5 === 'completado' },
    { numero: 6, titulo: "Pertinencia Pedagógica", completado: proyecto?.estado_aceleradores?.etapa2_acelerador6 === 'completado' },
    { numero: 7, titulo: "Reflexión y Aprendizajes", completado: proyecto?.estado_aceleradores?.etapa2_acelerador7 === 'completado' },
  ];

  const todosCompletados = aceleradores.every(a => a.completado);
  const progreso = Math.round((aceleradores.filter(a => a.completado).length / aceleradores.length) * 100);

  const handleContinue = async () => {
    if (!todosCompletados) {
      toast({
        title: "Aceleradores incompletos",
        description: "Completa todos los aceleradores antes de continuar",
        variant: "destructive",
      });
      return;
    }

    const success = await validateEvaluacionFinal();
    if (success) {
      navigate('/cnpie/2a/etapa3/acelerador8');
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E6F4F1' }}>
      <div className="container mx-auto px-4 py-8 max-w-6xl pb-32">
        <Button variant="ghost" onClick={() => navigate('/cnpie/2a/etapa2/overview')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />Volver a Etapa 2
        </Button>
        
        <h1 className="text-4xl font-bold mb-3" style={{ color: '#005C6B' }}>Cierre de Etapa 2</h1>
        <p className="text-lg mb-6" style={{ color: '#00A6A6' }}>
          Revisa que todos los aceleradores estén completados antes de pasar a la evaluación final
        </p>

        {/* Progreso */}
        <Card className="mb-6 border-0 shadow-md" style={{ backgroundColor: '#DDF4F2' }}>
          <CardHeader>
            <CardTitle style={{ color: '#005C6B' }}>Progreso de Etapa 2: Aceleración</CardTitle>
            <CardDescription>Producción de información para CNPIE</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-4">
              {aceleradores.map((a) => (
                <div key={a.numero} className="flex items-center justify-between">
                  <span className="text-sm">A{a.numero}: {a.titulo}</span>
                  {a.completado ? (
                    <Badge className="bg-green-600 text-white">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Completado
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                      Pendiente
                    </Badge>
                  )}
                </div>
              ))}
            </div>
            <Progress value={progreso} className="h-2 mb-2" />
            <p className="text-xs text-center" style={{ color: '#1A1A1A' }}>
              {progreso}% completado
            </p>
          </CardContent>
        </Card>

        {/* Información sobre Etapa 3 */}
        <Card className="mb-6 border-0 shadow-md" style={{ backgroundColor: '#FFFFFF' }}>
          <CardHeader>
            <CardTitle style={{ color: '#005C6B' }}>Siguiente: Etapa 3 - Evaluación Final</CardTitle>
            <CardDescription>¿Qué encontrarás en la Etapa 3?</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Evaluación predictiva con rúbrica CNPIE:</strong> Obtén un puntaje estimado según los criterios oficiales</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Validación de límites de caracteres:</strong> Verifica que tu información cumpla los requisitos de la plataforma</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Descarga consolidada:</strong> PDF optimizado listo para copiar/pegar en la plataforma CNPIE</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Guía de evidencias:</strong> Recomendaciones de materiales adicionales para tu postulación</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Alertas */}
        {!todosCompletados && (
          <Alert className="mb-6 border-yellow-500 bg-yellow-50">
            <Info className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-900">
              Completa todos los aceleradores de la Etapa 2 antes de continuar a la evaluación final.
            </AlertDescription>
          </Alert>
        )}

        <Alert className="mb-6 border-0" style={{ backgroundColor: '#DDF4F2' }}>
          <Info className="h-4 w-4" style={{ color: '#00A6A6' }} />
          <AlertDescription style={{ color: '#1A1A1A' }}>
            La Etapa 3 es donde validarás tu proyecto contra las rúbricas oficiales de CNPIE 2025 
            y generarás toda la documentación necesaria para tu postulación.
          </AlertDescription>
        </Alert>
      </div>

      {/* Botón fijo */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 shadow-lg">
        <div className="container mx-auto flex justify-center">
          <Button 
            size="lg" 
            disabled={!todosCompletados || saving} 
            onClick={handleContinue} 
            className="text-white" 
            style={{ backgroundColor: todosCompletados ? '#005C6B' : '#E6F4F1', color: todosCompletados ? 'white' : '#005C6B' }}
          >
            {saving ? 'Validando...' : 'Continuar a Etapa 3: Evaluación Final'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
