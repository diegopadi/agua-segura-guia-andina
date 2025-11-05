import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Download, Home, BookOpen, Trophy, Calendar } from "lucide-react";
import { useCNPIEProject } from "@/hooks/useCNPIEProject";

export default function ProyectoCompletado() {
  const navigate = useNavigate();
  const { proyecto } = useCNPIEProject('2A');

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E6F4F1' }}>
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header de Celebración */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-6" 
               style={{ backgroundColor: '#1BBEAE' }}>
            <Trophy className="w-12 h-12 text-white" />
          </div>
          
          <h1 className="text-5xl font-bold mb-4" style={{ color: '#005C6B' }}>
            ¡Felicitaciones! 🎉
          </h1>
          
          <p className="text-xl mb-2" style={{ color: '#00A6A6' }}>
            Tu proyecto CNPIE 2A está completo y listo para postular
          </p>
          
          <Badge className="text-lg px-4 py-2 mt-4" style={{ backgroundColor: '#1BBEAE' }}>
            Proyecto Validado ✓
          </Badge>
        </div>

        {/* Resumen del Proyecto */}
        <Card className="mb-8 border-0 shadow-lg" style={{ backgroundColor: '#FFFFFF' }}>
          <CardHeader style={{ backgroundColor: '#DDF4F2' }}>
            <CardTitle style={{ color: '#005C6B' }}>Resumen de tu Trabajo</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-sm mb-3" style={{ color: '#00A6A6' }}>
                  Etapas Completadas
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm">Etapa 1: Diagnóstico Institucional</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm">Etapa 2: Aceleradores CNPIE (6 completados)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm">Etapa 3: Evaluación Predictiva</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-sm mb-3" style={{ color: '#00A6A6' }}>
                  Documentación Generada
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm">PDF con todos los criterios CNPIE</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm">Puntaje predictivo generado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm">Recomendaciones de mejora</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Siguientes Pasos */}
        <Card className="mb-8 border-0 shadow-lg" style={{ backgroundColor: '#FFFFFF' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: '#005C6B' }}>
              <Calendar className="w-6 h-6" style={{ color: '#00A6A6' }} />
              Próximos Pasos para Postular
            </CardTitle>
            <CardDescription>
              Sigue estos pasos para completar tu postulación en la plataforma oficial CNPIE
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                     style={{ backgroundColor: '#1BBEAE' }}>
                  1
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Revisa el documento descargado</h4>
                  <p className="text-sm text-muted-foreground">
                    Asegúrate de que todos los textos están correctos y dentro de los límites de caracteres
                  </p>
                </div>
              </li>
              
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                     style={{ backgroundColor: '#1BBEAE' }}>
                  2
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Prepara evidencias adicionales</h4>
                  <p className="text-sm text-muted-foreground">
                    Reúne fotos (3-5), videos cortos (opcional), y otros documentos de soporte
                  </p>
                </div>
              </li>
              
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                     style={{ backgroundColor: '#1BBEAE' }}>
                  3
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Ingresa a la plataforma CNPIE</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Visita <strong>www.cnpie.gob.pe</strong> y crea tu usuario o inicia sesión
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://www.cnpie.gob.pe', '_blank')}
                  >
                    Ir a CNPIE →
                  </Button>
                </div>
              </li>
              
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                     style={{ backgroundColor: '#1BBEAE' }}>
                  4
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Copia y pega cada sección</h4>
                  <p className="text-sm text-muted-foreground">
                    Usa el documento PDF como guía y pega el contenido en los campos correspondientes
                  </p>
                </div>
              </li>
              
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                     style={{ backgroundColor: '#1BBEAE' }}>
                  5
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Sube evidencias y envía</h4>
                  <p className="text-sm text-muted-foreground">
                    Adjunta tus fotos y videos, revisa todo y envía tu postulación antes de la fecha límite
                  </p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate('/')}
          >
            <Home className="w-5 h-5 mr-2" />
            Volver al Inicio
          </Button>
          
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate('/repositorio')}
          >
            <BookOpen className="w-5 h-5 mr-2" />
            Ir al Repositorio
          </Button>
          
          <Button
            size="lg"
            onClick={() => navigate('/cnpie/2a/etapa2/evaluacion-final')}
            className="text-white"
            style={{ backgroundColor: '#00A6A6' }}
          >
            <Download className="w-5 h-5 mr-2" />
            Descargar PDF Nuevamente
          </Button>
        </div>
      </div>
    </div>
  );
}
