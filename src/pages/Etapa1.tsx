
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Target, Clock, Users } from "lucide-react"

const Etapa1 = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Etapa 1: Diagnóstico Institucional</h1>
          <p className="text-muted-foreground mt-2">
            Evalúa el contexto hídrico y pedagógico de tu institución educativa
          </p>
        </div>
        <Badge variant="outline" className="gap-2">
          <Clock className="w-4 h-4" />
          En desarrollo
        </Badge>
      </div>

      {/* Progress Overview */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Progreso de Diagnóstico
          </CardTitle>
          <CardDescription>
            Completa cada acelerador para obtener un diagnóstico integral
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Progreso General</span>
              <span className="text-sm text-muted-foreground">0 de 5 aceleradores completados</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div className="bg-primary h-3 rounded-full w-0 transition-all duration-300"></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder para Aceleradores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-secondary" />
            Aceleradores de Diagnóstico
          </CardTitle>
          <CardDescription>
            Herramientas interactivas para evaluar tu contexto educativo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Espacio reservado para Aceleradores</h3>
            <p className="text-sm">
              Los aceleradores de diagnóstico se implementarán en la siguiente fase del desarrollo.
              Aquí encontrarás herramientas interactivas con integración a ChatGPT para evaluar 
              el contexto hídrico y pedagógico de tu institución.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Etapa1
