
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Clock, Lightbulb, FileText, ArrowRight, Settings, Play } from "lucide-react"
import { Link } from "react-router-dom"
import { useAcceleratorProgress } from "@/hooks/useAcceleratorProgress"

const accelerators = [
  {
    id: 4,
    title: "Selección de Estrategias Metodológicas",
    description: "Genera y ajusta un catálogo de estrategias pedagógicas activas basadas en normativa MINEDU",
    icon: Settings,
    color: "bg-green-500",
    estimatedTime: "45-60 min",
    path: "/etapa2/acelerador4"
  },
  {
    id: 5,
    title: "Planificación y Preparación de Unidades",
    description: "Diseña la unidad didáctica completa a partir de estrategias priorizadas, CNEB y PCI",
    icon: FileText,
    color: "bg-blue-500",
    estimatedTime: "60-90 min",
    path: "/etapa2/acelerador5"
  }
];

const Etapa2 = () => {
  const { progress, loading } = useAcceleratorProgress();
  
  // Calculate Etapa 2 progress (accelerators 4 and 5)
  const etapa2Progress = loading ? 0 : Math.round((progress.accelerator1 + progress.accelerator2 + progress.accelerator3) / 3);
  const completedAccelerators = [
    progress.accelerator1 === 100 ? 1 : 0,
    progress.accelerator2 === 100 ? 1 : 0, 
    progress.accelerator3 === 100 ? 1 : 0
  ].reduce((a, b) => a + b, 0);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary">Etapa 2: Diseño Pedagógico</h1>
          <p className="text-muted-foreground mt-2">
            Diseña sesiones pedagógicas adaptadas a tu contexto local y necesidades específicas
          </p>
        </div>
        <Badge variant="outline" className="gap-2">
          <Clock className="w-4 h-4" />
          En construcción
        </Badge>
      </div>

      {/* Progress Overview */}
      <Card className="border-secondary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-secondary" />
            Progreso de Diseño
          </CardTitle>
          <CardDescription>
            Crea sesiones pedagógicas innovadoras basadas en tu diagnóstico
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Progreso General Etapa 1</span>
              <span className="text-sm text-muted-foreground">{completedAccelerators} de 3 aceleradores completados</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div className="bg-secondary h-3 rounded-full transition-all duration-300" style={{ width: `${etapa2Progress}%` }}></div>
            </div>
            {etapa2Progress < 100 && (
              <div className="bg-amber-50 p-3 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Nota:</strong> Es recomendable completar los 3 aceleradores de la Etapa 1 antes de continuar con la Etapa 2.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Aceleradores de Etapa 2 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-accent" />
          <h2 className="text-xl font-semibold">Aceleradores de Diseño Pedagógico</h2>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          {accelerators.map((accelerator) => {
            const IconComponent = accelerator.icon;
            const isAccessible = etapa2Progress >= 75; // Require 75% of Etapa 1 completion
            
            return (
              <Card key={accelerator.id} className={`${isAccessible ? 'hover:shadow-md transition-shadow' : 'opacity-60'}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${accelerator.color} text-white`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Acelerador {accelerator.id}</CardTitle>
                        <CardDescription className="text-sm font-medium">
                          {accelerator.title}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {accelerator.estimatedTime}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {accelerator.description}
                  </p>
                  
                  {isAccessible ? (
                    <Button asChild className="w-full">
                      <Link to={accelerator.path}>
                        <Play className="w-4 h-4 mr-2" />
                        Comenzar acelerador
                      </Link>
                    </Button>
                  ) : (
                    <Button disabled className="w-full">
                      <Clock className="w-4 h-4 mr-2" />
                      Completa Etapa 1 primero
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        <Card className="border-dashed">
          <CardContent className="text-center py-8 text-muted-foreground">
            <div className="space-y-2">
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                  <BookOpen className="w-6 h-6" />
                </div>
              </div>
              <h3 className="font-medium">Más aceleradores próximamente</h3>
              <p className="text-sm">
                Estamos desarrollando aceleradores adicionales para completar tu experiencia de diseño pedagógico.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Etapa2
