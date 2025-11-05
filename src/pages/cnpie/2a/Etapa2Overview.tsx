import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useCNPIEProject } from "@/hooks/useCNPIEProject";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Target, Users, Leaf, CheckCircle2, MessageSquare, ArrowLeft, BookOpen
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const aceleradores = [
  {
    numero: 2,
    titulo: "Vinculación al CNEB",
    descripcion: "Vincula tu proyecto con competencias, capacidades y desempeños del CNEB",
    icon: Target,
    color: "#00A6A6",
    ruta: '/cnpie/2a/etapa2/acelerador2'
  },
  {
    numero: 3,
    titulo: "Impacto y Resultados",
    descripcion: "Documenta los resultados e impactos de tu proyecto consolidado",
    icon: CheckCircle2,
    color: "#1BBEAE",
    ruta: '/cnpie/2a/etapa2/acelerador3'
  },
  {
    numero: 4,
    titulo: "Participación Comunitaria",
    descripcion: "Registra la participación de estudiantes, familias y comunidad educativa",
    icon: Users,
    color: "#00A6A6",
    ruta: '/cnpie/2a/etapa2/acelerador4'
  },
  {
    numero: 5,
    titulo: "Sostenibilidad",
    descripcion: "Analiza la sostenibilidad y escalabilidad de tu innovación",
    icon: Leaf,
    color: "#1BBEAE",
    ruta: '/cnpie/2a/etapa2/acelerador5'
  },
  {
    numero: 6,
    titulo: "Pertinencia Pedagógica",
    descripcion: "Valida la pertinencia y coherencia pedagógica del proyecto",
    icon: BookOpen,
    color: "#00A6A6",
    ruta: '/cnpie/2a/etapa2/acelerador6'
  },
  {
    numero: 7,
    titulo: "Reflexión y Aprendizajes",
    descripcion: "Reflexiona sobre desafíos, lecciones aprendidas y mejoras",
    icon: MessageSquare,
    color: "#1BBEAE",
    ruta: '/cnpie/2a/etapa2/acelerador7'
  }
];

export default function Etapa2Overview() {
  const navigate = useNavigate();
  const { proyecto } = useCNPIEProject('2A');

  const calcularProgreso = () => {
    if (!proyecto) return 0;
    const completados = aceleradores.filter(
      (acc) => proyecto.estado_aceleradores?.[`etapa2_acelerador${acc.numero}`] === 'completado'
    ).length;
    return Math.round((completados / aceleradores.length) * 100);
  };

  const getEstadoAccelerador = (numero: number) => {
    if (!proyecto) return 'bloqueado';
    const estado = proyecto.estado_aceleradores?.[`etapa2_acelerador${numero}`];
    if (estado === 'completado') return 'completado';
    // El primer acelerador siempre está disponible
    if (numero === 2) return 'disponible';
    // Los demás requieren que el anterior esté completo
    const anteriorCompleto = proyecto.estado_aceleradores?.[`etapa2_acelerador${numero - 1}`] === 'completado';
    return anteriorCompleto ? 'disponible' : 'bloqueado';
  };

  const progreso = calcularProgreso();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E6F4F1' }}>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Encabezado */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/proyectos/2a')}
            className="mb-4"
            style={{ color: '#005C6B' }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Dashboard 2A
          </Button>

          <h1 className="text-4xl font-bold mb-3" style={{ color: '#005C6B' }}>
            Etapa 2: Aceleración
          </h1>
          <p className="text-lg mb-4" style={{ color: '#00A6A6' }}>
            Desarrolla 6 aceleradores para fortalecer y sistematizar tu innovación consolidada
          </p>

          {/* Barra de progreso general */}
          <Card className="border-0 shadow-md" style={{ backgroundColor: '#DDF4F2' }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Progreso de Etapa 2</CardTitle>
                <Badge variant="outline" className="text-lg">
                  {progreso}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={progreso} className="h-3" />
              <p className="text-sm mt-2" style={{ color: '#1A1A1A' }}>
                {aceleradores.filter(acc => getEstadoAccelerador(acc.numero) === 'completado').length} de {aceleradores.length} aceleradores completados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Grid de aceleradores */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {aceleradores.map((acelerador) => {
            const IconComponent = acelerador.icon;
            const estado = getEstadoAccelerador(acelerador.numero);
            const disponible = estado !== 'bloqueado';
            const completado = estado === 'completado';

            return (
              <Card 
                key={acelerador.numero}
                className={`border-0 shadow-md hover:shadow-lg transition-shadow ${
                  completado ? 'border-2 border-green-500' : ''
                }`}
                style={{ backgroundColor: '#DDF4F2' }}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-3">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ 
                        backgroundColor: disponible ? acelerador.color : '#E6F4F1',
                        opacity: disponible ? 1 : 0.5
                      }}
                    >
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <Badge 
                      variant={completado ? "default" : "outline"}
                      style={{
                        backgroundColor: completado ? '#22c55e' : 'transparent',
                        color: completado ? 'white' : acelerador.color
                      }}
                    >
                      {completado ? 'Completado' : `A${acelerador.numero}`}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg" style={{ color: '#005C6B' }}>
                    {acelerador.titulo}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription 
                    className="text-sm min-h-[60px]"
                    style={{ color: '#1A1A1A' }}
                  >
                    {acelerador.descripcion}
                  </CardDescription>
                  <Button 
                    className="w-full font-medium"
                    disabled={!disponible}
                    onClick={() => disponible && navigate(acelerador.ruta)}
                    style={{ 
                      backgroundColor: disponible ? acelerador.color : '#E6F4F1',
                      color: disponible ? 'white' : '#005C6B',
                      opacity: disponible ? 1 : 0.6
                    }}
                  >
                    {completado ? 'Revisar' : disponible ? 'Comenzar' : 'Bloqueado'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Información adicional */}
        <Alert className="border-0" style={{ backgroundColor: '#DDF4F2' }}>
          <AlertDescription style={{ color: '#1A1A1A' }}>
            Completa todos los aceleradores en orden secuencial. Cada acelerador se desbloqueará al completar el anterior.
            Al finalizar esta etapa, tendrás documentada toda tu innovación de manera sistemática.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
