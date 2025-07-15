
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download, BookOpen, FileImage } from "lucide-react"

const Documentos = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary">Documentos y Recursos</h1>
        <p className="text-muted-foreground mt-2">
          Plantillas, guías y recursos pedagógicos para apoyar tu trabajo docente
        </p>
      </div>

      {/* Categories */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Plantillas
            </CardTitle>
            <CardDescription>
              Formatos para diseñar y planificar sesiones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                <Download className="w-4 h-4" />
                Plantilla de Sesión Pedagógica
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                <Download className="w-4 h-4" />
                Formato de Diagnóstico
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                <Download className="w-4 h-4" />
                Rúbrica de Evaluación
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-secondary" />
              Guías Pedagógicas
            </CardTitle>
            <CardDescription>
              Material de apoyo para docentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                <Download className="w-4 h-4" />
                Metodologías Activas
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                <Download className="w-4 h-4" />
                Seguridad Hídrica - Conceptos
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                <Download className="w-4 h-4" />
                Evaluación por Competencias
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileImage className="w-5 h-5 text-accent" />
              Recursos Visuales
            </CardTitle>
            <CardDescription>
              Imágenes e infografías educativas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                <Download className="w-4 h-4" />
                Infografías de Agua Segura
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                <Download className="w-4 h-4" />
                Mapas Conceptuales
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                <Download className="w-4 h-4" />
                Fichas de Actividades
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Documentos Generados</CardTitle>
          <CardDescription>
            Documentos creados durante tu trabajo en la aplicación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No hay documentos generados aún</h3>
            <p className="text-sm">
              Los documentos que generes mediante los aceleradores aparecerán aquí para 
              que puedas descargarlos y utilizarlos en tu práctica pedagógica.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Documentos
