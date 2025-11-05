import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BookOpen, Target, Users, Brain, CheckCircle, Play, Lock, Info } from "lucide-react";
import { useEtapa3V2 } from "@/hooks/useEtapa3V2";

// Configuration for each accelerator in Etapa 3 V2
const accelerators = [
  {
    number: 8,
    title: "Unidad de Aprendizaje",
    description: "Diseña una unidad de aprendizaje completa con diagnóstico y análisis de coherencia",
    icon: BookOpen,
    color: "bg-blue-500",
    route: "/etapa3/acelerador8",
    estimatedTime: "45-60 min"
  },
  {
    number: 9,
    title: "Rúbrica de Evaluación", 
    description: "Crea rúbricas personalizadas para evaluar los aprendizajes de la unidad",
    icon: Target,
    color: "bg-green-500",
    route: "/etapa3/acelerador9",
    estimatedTime: "30-45 min"
  },
  {
    number: 10,
    title: "Diseño de Sesiones",
    description: "Genera y estructura las sesiones de clase que componen la unidad",
    icon: Brain,
    color: "bg-purple-500",
    route: "/etapa3/acelerador10",
    estimatedTime: "30-40 min"
  }
];

export default function Etapa3() {
  const { unidad, rubrica, sesiones, loading, progress } = useEtapa3V2();
  const [showV2Notice, setShowV2Notice] = useState(true);

  const getStatusBadge = (acceleratorNumber: number) => {
    switch (acceleratorNumber) {
      case 8:
        return progress.a8_completed ? 
          <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Completado</Badge> :
          (unidad ? <Badge variant="default" className="bg-blue-600"><Play className="w-3 h-3 mr-1" />En progreso</Badge> :
           <Badge variant="secondary">No iniciado</Badge>);
      case 9:
        return progress.a9_completed ? 
          <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Completado</Badge> :
          (rubrica ? <Badge variant="default" className="bg-blue-600"><Play className="w-3 h-3 mr-1" />En progreso</Badge> :
           <Badge variant="secondary">No iniciado</Badge>);
      case 10:
        return progress.a10_completed ? 
          <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Completado</Badge> :
          (sesiones.length > 0 ? <Badge variant="default" className="bg-blue-600"><Play className="w-3 h-3 mr-1" />En progreso</Badge> :
           <Badge variant="secondary">No iniciado</Badge>);
      default:
        return <Badge variant="secondary">No iniciado</Badge>;
    }
  };

  const canAccess = (acceleratorNumber: number) => {
    switch (acceleratorNumber) {
      case 8:
        return true; // A8 always accessible
      case 9:
        return progress.a8_completed;
      case 10:
        return progress.a9_completed;
      default:
        return false;
    }
  };

  const getProgress = (acceleratorNumber: number) => {
    switch (acceleratorNumber) {
      case 8:
        return progress.a8_completed ? 100 : (unidad ? 50 : 0);
      case 9:
        return progress.a9_completed ? 100 : (rubrica ? 50 : 0);
      case 10:
        return progress.a10_completed ? 100 : (sesiones.length > 0 ? 50 : 0);
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando Etapa 3...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-6xl mx-auto">
        {/* V2 Notice */}
        {showV2Notice && (
          <Alert className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <div className="flex items-center justify-between">
                <span>
                  <strong>Etapa 3 Rediseñada:</strong> Nueva estructura simplificada A6 → A7 → A8. 
                  Los datos anteriores se han preservado como legacy.
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowV2Notice(false)}
                  className="text-blue-600 hover:text-blue-800 ml-4"
                >
                  Entendido
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Etapa 3</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Diseño de Unidad y Evaluación
          </p>
          
          {/* Overall Progress */}
          <div className="max-w-md mx-auto">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Progreso General</span>
              <span>{progress.overall_progress}%</span>
            </div>
            <Progress value={progress.overall_progress} className="h-3" />
          </div>
        </div>

        {/* Progress Overview Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Progreso General - Etapa 3
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {progress.overall_progress}%
              </div>
              <p className="text-muted-foreground">
                Completado ({[progress.a8_completed, progress.a9_completed, progress.a10_completed].filter(Boolean).length} de 3 aceleradores)
              </p>
              
              {unidad && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Unidad Actual:</p>
                  <p className="text-sm text-muted-foreground">
                    {unidad.titulo} - {unidad.area_curricular} ({unidad.grado})
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Accelerators Grid */}
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          {accelerators.map((accelerator) => {
            const IconComponent = accelerator.icon;
            const progressValue = getProgress(accelerator.number);
            const accessible = canAccess(accelerator.number);
            
            return (
              <Card key={accelerator.number} className={`relative overflow-hidden group hover:shadow-lg transition-shadow ${!accessible ? 'opacity-60' : ''}`}>
                <div className={`absolute top-0 left-0 right-0 h-1 ${accelerator.color}`} />
                
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${accelerator.color} text-white`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          Acelerador {accelerator.number}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground font-normal">
                          {accelerator.title}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(accelerator.number)}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {accelerator.description}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progreso</span>
                      <span className="font-medium">{progressValue}%</span>
                    </div>
                    <Progress value={progressValue} className="h-2" />
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">
                      {accelerator.estimatedTime}
                    </span>
                    
                    {accessible ? (
                      <Link to={accelerator.route}>
                        <Button 
                          size="sm"
                          variant={progressValue > 0 ? "default" : "outline"}
                        >
                          {progressValue > 0 ? "Continuar" : "Iniciar"}
                        </Button>
                      </Link>
                    ) : (
                      <Button size="sm" variant="outline" disabled>
                        <Lock className="h-3 w-3 mr-1" />
                        Bloqueado
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}