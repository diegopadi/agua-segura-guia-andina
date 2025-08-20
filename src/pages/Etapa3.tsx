import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Users, BarChart, Target, ArrowRight, Clock, CheckCircle } from "lucide-react"
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
    number: 6,
    title: "Diseñador de Sesiones de Aprendizaje",
    description: "Genera y personaliza sesiones de aprendizaje detalladas con objetivos, actividades y evaluación",
    icon: BookOpen,
    color: "bg-blue-500",
    steps: 6,
    estimatedTime: "60-90 min"
  },
  {
    number: 7,
    title: "Evaluación y Seguimiento",
    description: "Crea instrumentos de evaluación y sistemas de seguimiento para medir el progreso",
    icon: BarChart,
    color: "bg-green-500",
    steps: 5,
    estimatedTime: "45-60 min"
  },
  {
    number: 8,
    title: "Análisis y Mejora",
    description: "Analiza resultados y genera planes de mejora continua para tu institución",
    icon: Target,
    color: "bg-purple-500",
    steps: 4,
    estimatedTime: "30-45 min"
  }
]

const Etapa3 = () => {
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
        .in('acelerador_number', [6, 7, 8])

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
          <h1 className="text-3xl font-bold text-primary">Etapa 3: Implementación</h1>
          <p className="text-muted-foreground mt-2">
            Implementa sesiones educativas, evalúa y mejora continuamente tus estrategias pedagógicas
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
            Tu avance en los aceleradores de implementación y evaluación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Progreso de Etapa 3</span>
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
                </div>

                <Button 
                  asChild 
                  className="w-full group-hover:bg-primary/90 transition-colors"
                  variant={progress > 0 ? "default" : "outline"}
                >
                  <Link to={progress > 0 ? `/etapa3/acelerador${accelerator.number}/${sessions.find(s => s.acelerador_number === accelerator.number)?.id || ''}` : `/etapa3/acelerador${accelerator.number}`} className="flex items-center gap-2">
                    {progress > 0 ? "Continuar" : "Comenzar"}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

    </div>
  )
}

export default Etapa3