
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Droplets, Users, BookOpen, Target, ChevronRight, Play, Mail, Loader2 } from "lucide-react"
import { Link } from "react-router-dom"
import { useState, useEffect } from "react"
import { useAcceleratorProgress } from "@/hooks/useAcceleratorProgress"

const Inicio = () => {
  const [isVideoOpen, setIsVideoOpen] = useState(false)
  const { progress, loading, refreshProgress } = useAcceleratorProgress()

  // Refresh progress when component mounts (user might be coming back from an accelerator)
  useEffect(() => {
    refreshProgress()
  }, [])

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl water-gradient p-8 text-white">
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-4">
            ¡Te damos la bienvenida a Mi Cole con Agua Segura!
          </h1>
          <p className="text-xl opacity-90 mb-6 max-w-2xl">
            Acompañamos a docentes de secundaria en zonas andinas del Perú para desarrollar 
            sesiones pedagógicas innovadoras sobre seguridad hídrica.
          </p>
          <Dialog open={isVideoOpen} onOpenChange={setIsVideoOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="lg" className="gap-2">
                <Play className="w-5 h-5" />
                Ver video de bienvenida
                <ChevronRight className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Video de Bienvenida - Mi Cole con Agua Segura</DialogTitle>
              </DialogHeader>
              <div className="aspect-video">
                <iframe
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ" // Placeholder URL - cambiar cuando tengas el video real
                  title="Video de Bienvenida"
                  className="w-full h-full rounded-lg"
                  allowFullScreen
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10" />
      </div>

      {/* Status Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Target className="w-4 h-4 text-primary" />
              </div>
              <CardTitle className="text-lg">Diagnóstico</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Evalúa el contexto hídrico de tu institución educativa
            </CardDescription>
            <div className="mt-4">
              <div className="text-sm text-muted-foreground mb-2">
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Cargando...
                  </div>
                ) : (
                  `Progreso: ${progress.accelerator1}%`
                )}
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${progress.accelerator1}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-secondary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-secondary" />
              </div>
              <CardTitle className="text-lg">Diseño Pedagógico</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Crea sesiones adaptadas a tu realidad local
            </CardDescription>
            <div className="mt-4">
              <div className="text-sm text-muted-foreground mb-2">
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Cargando...
                  </div>
                ) : (
                  `Progreso: ${progress.accelerator2}%`
                )}
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-secondary h-2 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${progress.accelerator2}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-accent/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                <Droplets className="w-4 h-4 text-accent" />
              </div>
              <CardTitle className="text-lg">Implementación</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Ejecuta y evalúa las sesiones con tus estudiantes
            </CardDescription>
            <div className="mt-4">
              <div className="text-sm text-muted-foreground mb-2">
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Cargando...
                  </div>
                ) : (
                  `Progreso: ${progress.accelerator3}%`
                )}
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-accent h-2 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${progress.accelerator3}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>
            Herramientas y recursos para comenzar tu trabajo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link to="/etapa1">
              <Button variant="outline" className="w-full h-auto p-4 flex flex-col gap-2">
                <Target className="w-6 h-6 text-primary" />
                <span className="font-medium">Iniciar Etapa 1</span>
                <span className="text-xs text-muted-foreground">Diagnóstico Institucional</span>
              </Button>
            </Link>
            
            <Link to="/documentos">
              <Button variant="outline" className="w-full h-auto p-4 flex flex-col gap-2">
                <BookOpen className="w-6 h-6 text-secondary" />
                <span className="font-medium">Ver Documentos</span>
                <span className="text-xs text-muted-foreground">Recursos y plantillas</span>
              </Button>
            </Link>
            
            <Link to="/ayuda">
              <Button variant="outline" className="w-full h-auto p-4 flex flex-col gap-2">
                <Users className="w-6 h-6 text-accent" />
                <span className="font-medium">Obtener Ayuda</span>
                <span className="text-xs text-muted-foreground">Guías y soporte</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Program Information */}
      <Card>
        <CardHeader>
          <CardTitle>Sobre la app Mi Cole con Agua Segura</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Esta app es parte del <em>Programa virtual de fortalecimiento de capacidades para la integración de estrategias pedagógicas para la seguridad hídrica con inteligencia artificial</em>, una iniciativa educativa del proyecto "Agua para Ciudades Andinas del Perú", organizado por <em>Helvetas Perú</em> y <em>Equilibria</em>, con el financiamiento de <em>EUROCLIMA+</em> y la <em>AFD</em>, y el apoyo de aliados como la <em>UGEL Abancay</em>, <em>SUNASS</em> y <em>EMUSAP Abancay</em>.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => window.location.href = 'mailto:luis.alban@helvetas.org?subject=Consulta sobre Mi Cole con Agua Segura'}
            >
              <Mail className="w-4 h-4" />
              Contactar a Helvetas Perú
            </Button>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => window.location.href = 'mailto:luva@equilibria.lat?subject=Consulta sobre Mi Cole con Agua Segura'}
            >
              <Mail className="w-4 h-4" />
              Contactar a Equilibria
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Partner Organizations Logos */}
      <div className="bg-background py-8">
        <div className="flex flex-wrap justify-center items-center gap-8 max-w-5xl mx-auto">
          {/* Placeholder for logos - replace with actual logo images when available */}
          <div className="text-center space-y-2">
            <div className="w-32 h-16 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
              Agua para Ciudades Andinas
            </div>
          </div>
          <div className="text-center space-y-2">
            <div className="w-32 h-16 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
              Global Gateway
            </div>
          </div>
          <div className="text-center space-y-2">
            <div className="w-32 h-16 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
              EUROCLIMA+
            </div>
          </div>
          <div className="text-center space-y-2">
            <div className="w-32 h-16 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
              AFD
            </div>
          </div>
          <div className="text-center space-y-2">
            <div className="w-32 h-16 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
              Helvetas Perú
            </div>
          </div>
          <div className="text-center space-y-2">
            <div className="w-32 h-16 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
              Equilibria
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Inicio
