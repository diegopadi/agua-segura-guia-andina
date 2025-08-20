
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Droplets, Clock, TrendingUp, BookOpen, FileText, BarChart3, ArrowRight, CheckCircle } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

const Etapa3 = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [acceleratorProgress, setAcceleratorProgress] = useState({
    acelerador6: 0,
    acelerador7: 0,
    acelerador8: 0
  })

  useEffect(() => {
    checkProgress()
  }, [])

  const checkProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check progress for each accelerator
      const { data: sessions } = await supabase
        .from('acelerador_sessions')
        .select('acelerador_number, status')
        .eq('user_id', user.id)
        .in('acelerador_number', [6, 7, 8])

      const progress = { acelerador6: 0, acelerador7: 0, acelerador8: 0 }
      sessions?.forEach(session => {
        if (session.status === 'completed') {
          progress[`acelerador${session.acelerador_number}` as keyof typeof progress] = 100
        } else if (session.status === 'in_progress') {
          progress[`acelerador${session.acelerador_number}` as keyof typeof progress] = 50
        }
      })

      setAcceleratorProgress(progress)
    } catch (error) {
      console.error('Error checking progress:', error)
    }
  }

  const startAccelerator = async (acceleratorNumber: number, route: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check if we have A5 data for A6
      if (acceleratorNumber === 6) {
        const { data: a5Session } = await supabase
          .from('acelerador_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('acelerador_number', 5)
          .single()

        if (!a5Session?.session_data || !(a5Session.session_data as any)?.A5SessionsStructureData) {
          toast({
            title: "Datos Requeridos",
            description: "Necesitas completar el Acelerador 5 antes de continuar",
            variant: "destructive",
          })
          return
        }
      }

      // Create or get accelerator session
      const { data: existingSession } = await supabase
        .from('acelerador_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('acelerador_number', acceleratorNumber)
        .single()

      let sessionId = existingSession?.id

      if (!existingSession) {
        const { data: newSession, error } = await supabase
          .from('acelerador_sessions')
          .insert({
            user_id: user.id,
            acelerador_number: acceleratorNumber,
            current_step: 1,
            status: 'in_progress',
            session_data: acceleratorNumber === 6 ? { 
              A5SessionsStructureData: (await supabase
                .from('acelerador_sessions')
                .select('session_data')
                .eq('user_id', user.id)
                .eq('acelerador_number', 5)
                .single()).data?.session_data ? (((await supabase
                  .from('acelerador_sessions')
                  .select('session_data')
                  .eq('user_id', user.id)
                  .eq('acelerador_number', 5)
                  .single()).data?.session_data as any)?.A5SessionsStructureData) : null
            } : {}
          })
          .select()
          .single()

        if (error) throw error
        sessionId = newSession.id
      }

      navigate(`${route}/${sessionId}`)
    } catch (error) {
      console.error('Error starting accelerator:', error)
      toast({
        title: "Error",
        description: "No se pudo iniciar el acelerador",
        variant: "destructive",
      })
    }
  }

  const totalProgress = Object.values(acceleratorProgress).reduce((sum, val) => sum + val, 0) / 3

  const accelerators = [
    {
      number: 6,
      title: "Diseñador de Sesiones",
      description: "Crea sesiones detalladas basadas en tu unidad didáctica",
      icon: BookOpen,
      route: "/etapa3/acelerador6",
      progress: acceleratorProgress.acelerador6,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      number: 7, 
      title: "Planificador de Evaluación",
      description: "Diseña instrumentos de evaluación y seguimiento",
      icon: FileText,
      route: "/etapa3/acelerador7",
      progress: acceleratorProgress.acelerador7,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      number: 8,
      title: "Analista de Resultados",
      description: "Evalúa el impacto y mejora continua de tus sesiones",
      icon: BarChart3,
      route: "/etapa3/acelerador8", 
      progress: acceleratorProgress.acelerador8,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ]

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
        <Badge variant={totalProgress > 0 ? "default" : "outline"} className="gap-2">
          {totalProgress > 0 ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
          {totalProgress > 0 ? `${Math.round(totalProgress)}% Completado` : 'En Desarrollo'}
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
              <span className="text-sm text-muted-foreground">
                {Object.values(acceleratorProgress).filter(p => p === 100).length} de 3 aceleradores completados
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div 
                className="bg-accent h-3 rounded-full transition-all duration-300" 
                style={{ width: `${totalProgress}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accelerators Grid */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-semibold">Aceleradores de Implementación</h2>
        </div>
        
        <div className="grid gap-6">
          {accelerators.map((accelerator) => {
            const Icon = accelerator.icon
            const isCompleted = accelerator.progress === 100
            const isInProgress = accelerator.progress > 0 && accelerator.progress < 100
            const isAvailable = accelerator.number === 6 || acceleratorProgress.acelerador6 > 0
            
            return (
              <Card 
                key={accelerator.number} 
                className={`transition-all duration-200 ${
                  isAvailable ? 'hover:shadow-md cursor-pointer' : 'opacity-60'
                } ${isCompleted ? 'border-green-200 bg-green-50/30' : ''}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${accelerator.bgColor}`}>
                        <Icon className={`w-6 h-6 ${accelerator.color}`} />
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          Acelerador {accelerator.number}: {accelerator.title}
                          {isCompleted && <CheckCircle className="w-5 h-5 text-green-600" />}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {accelerator.description}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {accelerator.progress > 0 && (
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {accelerator.progress}%
                          </div>
                          <div className="w-16 bg-muted rounded-full h-2 mt-1">
                            <div 
                              className="bg-accent h-2 rounded-full transition-all duration-300"
                              style={{ width: `${accelerator.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      <Button
                        onClick={() => startAccelerator(accelerator.number, accelerator.route)}
                        disabled={!isAvailable}
                        variant={isCompleted ? "outline" : "default"}
                        size="sm"
                      >
                        {isCompleted ? 'Revisar' : isInProgress ? 'Continuar' : 'Iniciar'}
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {accelerator.progress > 0 && (
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      {isCompleted ? '✅ Acelerador completado' : 
                       isInProgress ? '🔄 En progreso' : 
                       '⏳ Por iniciar'}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Etapa3
