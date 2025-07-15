
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Droplets, Clock, TrendingUp } from "lucide-react"

const Etapa3 = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-accent">Etapa 3: Implementación y Evaluación</h1>
          <p className="text-muted-foreground mt-2">
            Ejecuta las sesiones pedagógicas y evalúa su impacto en el aprendizaje
          </p>
        </div>
        <Badge variant="outline" className="gap-2">
          <Clock className="w-4 h-4" />
          Próximamente
        </Badge>
      </div>

      {/* Progress Overview */}
      <Card className="border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-accent" />
            Progreso de Implementación
          </CardTitle>
          <CardDescription>
            Ejecuta y evalúa el impacto de tus sesiones educativas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Progreso General</span>
              <span className="text-sm text-muted-foreground">0 de 3 aceleradores completados</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div className="bg-accent h-3 rounded-full w-0 transition-all duration-300"></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder para Aceleradores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Aceleradores de Implementación
          </CardTitle>
          <CardDescription>
            Herramientas para ejecutar y evaluar tus sesiones pedagógicas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Droplets className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Espacio reservado para Aceleradores</h3>
            <p className="text-sm">
              Los aceleradores de implementación se desarrollarán en la siguiente fase.
              Aquí encontrarás herramientas para gestionar la ejecución de tus sesiones,
              recopilar evidencias y evaluar el impacto en el aprendizaje de tus estudiantes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Etapa3
