
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HelpCircle, MessageCircle, BookOpen, Video, Phone } from "lucide-react"

const Ayuda = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary">Centro de Ayuda</h1>
        <p className="text-muted-foreground mt-2">
          Encuentra respuestas, tutoriales y soporte para usar la aplicación efectivamente
        </p>
      </div>

      {/* Quick Help Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              Preguntas Frecuentes
            </CardTitle>
            <CardDescription>
              Respuestas a las consultas más comunes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-l-4 border-primary/20 pl-4">
                <h4 className="font-medium">¿Cómo inicio mi primer diagnóstico?</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Ve a la Etapa 1 y completa los aceleradores paso a paso...
                </p>
              </div>
              <div className="border-l-4 border-secondary/20 pl-4">
                <h4 className="font-medium">¿Puedo personalizar las sesiones pedagógicas?</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Sí, todos los recursos se adaptan a tu contexto local...
                </p>
              </div>
              <div className="border-l-4 border-accent/20 pl-4">
                <h4 className="font-medium">¿Cómo descargar mis documentos?</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Ve a la sección Documentos para encontrar todos tus archivos...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-secondary" />
              Guías de Usuario
            </CardTitle>
            <CardDescription>
              Tutoriales paso a paso para cada funcionalidad
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Video className="w-4 h-4" />
                Tutorial: Primeros pasos
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Video className="w-4 h-4" />
                Cómo usar los aceleradores
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Video className="w-4 h-4" />
                Personalizar sesiones pedagógicas
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <BookOpen className="w-4 h-4" />
                Manual completo (PDF)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Support */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-accent" />
            Contactar Soporte
          </CardTitle>
          <CardDescription>
            ¿No encuentras lo que buscas? Nuestro equipo está aquí para ayudarte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            <Button className="gap-2">
              <MessageCircle className="w-4 h-4" />
              Chat en vivo
            </Button>
            <Button variant="outline" className="gap-2">
              <Phone className="w-4 h-4" />
              Solicitar llamada
            </Button>
          </div>
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Horario de atención:</strong> Lunes a Viernes, 8:00 AM - 6:00 PM (GMT-5)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Ayuda
