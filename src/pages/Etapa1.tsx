import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Target, Clock, Users, FileSearch, BookOpen, Lightbulb, ArrowRight, CheckCircle } from "lucide-react"
import { Link } from "react-router-dom"
import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"

interface AcceleratorSession {
  id: string
  acelerador_number: number
  current_step: number
  status: 'in_progress' | 'completed' | 'paused'
  session_data: any
  created_at: string
  updated_at: string
}

const accelerators = [
  {
    number: 1,
    title: "Diagnóstico Institucional",
    description: "Evalúa el contexto hídrico y pedagógico de tu institución educativa",
    icon: FileSearch,
    color: "bg-blue-500",
    steps: 6,
    estimatedTime: "45-60 min"
  },
  {
    number: 2,
    title: "Análisis de Recursos",
    description: "Identifica y mapea los recursos disponibles para la educación hídrica",
    icon: BookOpen,
    color: "bg-green-500",
    steps: 5,
    estimatedTime: "30-45 min"
  },
  {
    number: 3,
    title: "Propuesta Metodológica",
    description: "Desarrolla estrategias pedagógicas adaptadas a tu contexto",
    icon: Lightbulb,
    color: "bg-purple-500",
    steps: 4,
    estimatedTime: "30-40 min"
  }
]

const Etapa1 = () => {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<AcceleratorSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchSessions()
    }
  }, [user])

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('acelerador_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .in('acelerador_number', [1, 2, 3])

      if (error) throw error
      setSessions((data || []) as AcceleratorSession[])
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSessionProgress = (acceleratorNumber: number) => {
    const session = sessions.find(s => s.acelerador_number === acceleratorNumber)
    if (!session) return { progress: 0, status: 'not_started' as const }
    
    const accelerator = accelerators.find(a => a.number === acceleratorNumber)
    const progress = session.status === 'completed' ? 100 : (session.current_step / (accelerator?.steps || 1)) * 100
    
    return { progress, status: session.status }
  }

  const getStatusBadge = (acceleratorNumber: number) => {
    const { status } = getSessionProgress(acceleratorNumber)
    
    switch (status) {
      case 'completed':
        return <Badge className="gap-1 bg-green-100 text-green-700"><CheckCircle className="w-3 h-3" />Completado</Badge>
      case 'in_progress':
        return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" />En progreso</Badge>
      case 'paused':
        return <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" />Pausado</Badge>
      default:
        return <Badge variant="outline">No iniciado</Badge>
    }
  }

  const getOverallProgress = () => {
    const totalSessions = 3
    const completedSessions = sessions.filter(s => s.status === 'completed').length
    return (completedSessions / totalSessions) * 100
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Etapa 1: Diagnóstico Institucional</h1>
          <p className="text-muted-foreground mt-2">
            Completa los 3 aceleradores para obtener un diagnóstico integral de tu institución
          </p>
        </div>
        <Badge variant="outline" className="gap-2">
          <Target className="w-4 h-4" />
          {sessions.filter(s => s.status === 'completed').length} de 3 completados
        </Badge>
      </div>

      {/* Progress Overview */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Progreso General
          </CardTitle>
          <CardDescription>
            Tu avance en los aceleradores de diagnóstico institucional
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Progreso de Etapa 1</span>
              <span className="text-sm text-muted-foreground">
                {Math.round(getOverallProgress())}% completado
              </span>
            </div>
            <Progress value={getOverallProgress()} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Accelerators Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {accelerators.map((accelerator) => {
          const { progress } = getSessionProgress(accelerator.number)
          const IconComponent = accelerator.icon
          
          return (
            <Card key={accelerator.number} className="group hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-lg ${accelerator.color} text-white mb-3`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  {getStatusBadge(accelerator.number)}
                </div>
                <CardTitle className="text-lg">{accelerator.title}</CardTitle>
                <CardDescription className="text-sm">
                  {accelerator.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progreso</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {accelerator.steps} pasos
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {accelerator.estimatedTime}
                  </span>
                </div>

                <Button 
                  asChild 
                  className="w-full group-hover:bg-primary/90 transition-colors"
                  variant={progress > 0 ? "default" : "outline"}
                >
                  <Link to={`/etapa1/acelerador${accelerator.number}`} className="flex items-center gap-2">
                    {progress > 0 ? "Continuar" : "Comenzar"}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Help Section */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-secondary" />
            ¿Necesitas ayuda?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Los aceleradores están diseñados para guiarte paso a paso. Cada uno incluye 
            asistencia de IA para ayudarte a completar el diagnóstico de manera efectiva.
          </p>
          <Button variant="outline" asChild>
            <Link to="/ayuda">
              Ver guía completa
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default Etapa1