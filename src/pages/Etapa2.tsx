
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Clock, Lightbulb } from "lucide-react"

const Etapa2 = () => {
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
          Próximamente
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
              <span className="text-sm font-medium">Progreso General</span>
              <span className="text-sm text-muted-foreground">0 de 4 aceleradores completados</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div className="bg-secondary h-3 rounded-full w-0 transition-all duration-300"></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder para Aceleradores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-accent" />
            Aceleradores de Diseño Pedagógico
          </CardTitle>
          <CardDescription>
            Herramientas para crear sesiones educativas sobre seguridad hídrica
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Espacio reservado para Aceleradores</h3>
            <p className="text-sm">
              Los aceleradores de diseño pedagógico se implementarán en la siguiente fase del desarrollo.
              Aquí encontrarás herramientas inteligentes que te ayudarán a crear sesiones educativas 
              personalizadas basadas en tu diagnóstico institucional.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Etapa2
