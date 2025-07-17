import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Lightbulb, Construction } from "lucide-react"
import { Link } from "react-router-dom"

const Acelerador3 = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/etapa1">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Etapa 1
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-primary">Acelerador 3: Propuesta Metodológica</h1>
            <p className="text-muted-foreground">
              Desarrolla estrategias pedagógicas adaptadas a tu contexto
            </p>
          </div>
        </div>
        <Badge variant="outline" className="gap-2">
          <Construction className="w-4 h-4" />
          En desarrollo
        </Badge>
      </div>

      {/* Coming Soon Card */}
      <Card className="text-center py-12">
        <CardHeader>
          <div className="mx-auto mb-4 p-4 bg-purple-100 rounded-full w-fit">
            <Lightbulb className="w-8 h-8 text-purple-600" />
          </div>
          <CardTitle className="text-2xl">Acelerador 3: Propuesta Metodológica</CardTitle>
          <CardDescription className="text-lg max-w-2xl mx-auto">
            Este acelerador estará disponible próximamente. Te ayudará a diseñar estrategias 
            pedagógicas innovadoras y adaptadas al contexto específico de tu institución.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 p-6 rounded-lg">
            <h3 className="font-semibold text-lg mb-4">¿Qué incluirá este acelerador?</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <ul className="space-y-2 text-left">
                <li>• Diseño de sesiones de aprendizaje</li>
                <li>• Estrategias didácticas innovadoras</li>
                <li>• Actividades prácticas contextualizadas</li>
              </ul>
              <ul className="space-y-2 text-left">
                <li>• Evaluación de competencias hídricas</li>
                <li>• Proyectos de aprendizaje-servicio</li>
                <li>• Planificación curricular integrada</li>
              </ul>
            </div>
          </div>
          
          <div className="flex gap-4 justify-center">
            <Button variant="outline" asChild>
              <Link to="/etapa1">
                Volver al dashboard
              </Link>
            </Button>
            <Button asChild>
              <Link to="/etapa1/acelerador1">
                Completar aceleradores anteriores
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Acelerador3