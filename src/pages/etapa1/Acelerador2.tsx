import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, CheckCircle, Users, AlertCircle } from "lucide-react"
import { Link } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "@/hooks/use-toast"


// Import step components
import { StudentCharacteristics } from "./components/StudentCharacteristics"
import { AIAnalysis } from "./components/AIAnalysis"
import { ReportViewer } from "./components/ReportViewer"

type AcceleratorSession = {
  id: string
  user_id: string
  acelerador_number: number
  current_step: number
  status: string
  session_data: any
  created_at: string
  updated_at: string
}

const STEPS = [
  { number: 1, title: "Bienvenida", description: "Verificación de requisitos e instrucciones" },
  { number: 2, title: "Características", description: "Información sobre tus estudiantes" },
  { number: 3, title: "Análisis con IA", description: "Generación del informe diagnóstico" },
  { number: 4, title: "Informe", description: "Informe diagnóstico completo" }
]

const Acelerador2 = () => {
  const { user } = useAuth()
  const [session, setSession] = useState<AcceleratorSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasAccelerator1, setHasAccelerator1] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  useEffect(() => {
    if (user?.id) {
      checkPrerequisitesAndLoadSession()
    }
  }, [user?.id])

  const checkPrerequisitesAndLoadSession = async () => {
    try {
      // Check if Accelerator 1 is completed
      const { data: acc1Data } = await supabase
        .from('acelerador_sessions')
        .select('*')
        .eq('user_id', user!.id)
        .eq('acelerador_number', 1)
        .eq('status', 'completed')
        .single()

      setHasAccelerator1(!!acc1Data)

      if (!acc1Data) {
        setLoading(false)
        return
      }

      // Load existing session for Accelerator 2
      const { data: sessionData } = await supabase
        .from('acelerador_sessions')
        .select('*')
        .eq('user_id', user!.id)
        .eq('acelerador_number', 2)
        .single()

      if (sessionData) {
        setSession(sessionData)
        setCurrentStep(sessionData.current_step)
      } else {
        // Create new session
        await createNewSession()
      }
    } catch (error) {
      console.error('Error loading session:', error)
    } finally {
      setLoading(false)
    }
  }

  const createNewSession = async () => {
    try {
      const { data, error } = await supabase
        .from('acelerador_sessions')
        .insert({
          user_id: user!.id,
          acelerador_number: 2,
          current_step: 1,
          status: 'in_progress',
          session_data: {}
        })
        .select()
        .single()

      if (error) throw error

      setSession(data)
      setCurrentStep(1)
    } catch (error) {
      console.error('Error creating session:', error)
      toast({
        title: "Error",
        description: "No se pudo crear la sesión del acelerador",
        variant: "destructive"
      })
    }
  }

  const updateSession = async (newData: any, step?: number) => {
    if (!session) return

    try {
      const updateData = {
        session_data: { ...session.session_data, ...newData },
        current_step: step || currentStep,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('acelerador_sessions')
        .update(updateData)
        .eq('id', session.id)

      if (error) throw error

      setSession({ ...session, ...updateData })
      if (step) setCurrentStep(step)
    } catch (error) {
      console.error('Error updating session:', error)
      toast({
        title: "Error",
        description: "No se pudo guardar el progreso",
        variant: "destructive"
      })
    }
  }

  const goToStep = (step: number) => {
    if (step <= currentStep + 1 && step >= 1 && step <= 4) {
      setCurrentStep(step)
      updateSession({}, step)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando acelerador...</p>
        </div>
      </div>
    )
  }

  if (!hasAccelerator1) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/etapa1">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Etapa 1
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-primary">Acelerador 2: Evaluación Diagnóstica</h1>
            <p className="text-muted-foreground">
              Evalúa el nivel inicial de competencias en seguridad hídrica de tus estudiantes
            </p>
          </div>
        </div>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-yellow-600" />
              <div>
                <CardTitle className="text-yellow-800">Prerequisito requerido</CardTitle>
                <CardDescription className="text-yellow-700">
                  Debes completar el Acelerador 1 antes de acceder a este acelerador
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button variant="outline" asChild>
                <Link to="/etapa1">
                  Volver al dashboard
                </Link>
              </Button>
              <Button asChild>
                <Link to="/etapa1/acelerador1">
                  Completar Acelerador 1
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderStepContent = () => {
    if (!session) return null

    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                <div>
                  <CardTitle>Bienvenido al Acelerador 2</CardTitle>
                  <CardDescription>
                    Evaluación diagnóstica de la situación actual de tus estudiantes
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-4">Objetivos de este acelerador</h3>
                <ul className="space-y-2 text-sm">
                  <li>• Conocer el nivel de desarrollo de competencias previas de tus estudiantes</li>
                  <li>• Identificar las condiciones iniciales del grupo en relación con la seguridad hídrica</li>
                  <li>• Proporcionar información específica sobre las características de tus estudiantes</li>
                  <li>• Generar un informe diagnóstico personalizado con recomendaciones pedagógicas</li>
                </ul>
              </div>

              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-4">¿Qué haremos en este acelerador?</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <ul className="space-y-2">
                    <li>• Responder preguntas sobre tus estudiantes</li>
                    <li>• Proporcionar contexto específico de tu aula</li>
                    <li>• Generar análisis personalizado con IA</li>
                  </ul>
                  <ul className="space-y-2">
                    <li>• Revisar y corregir el informe diagnóstico</li>
                    <li>• Descargar informe completo con recomendaciones</li>
                    <li>• Obtener estrategias pedagógicas específicas</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => goToStep(2)}>
                  Comenzar evaluación
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )

      case 2:
        return <StudentCharacteristics 
          session={session} 
          onUpdate={updateSession} 
          onNext={() => goToStep(3)} 
        />

      case 3:
        return <AIAnalysis 
          session={session} 
          onUpdate={updateSession} 
          onNext={() => goToStep(4)} 
        />

      case 4:
        // Construct complete reportData object with all required fields
        const reportData = {
          id: session.id,
          document_number: parseInt(session.id.slice(-6), 16) || Math.floor(Math.random() * 999999),
          created_at: new Date().toISOString(), // Use current date instead of session creation date
          metadata: {
            institution_name: session.session_data.final_report?.metadata?.institution_name,
            completeness_score: session.session_data.final_report?.metadata?.completeness_score,
            ...session.session_data.final_report?.metadata
          }
        };
        
        // Debug logging to trace date issues
        console.log('Report date debugging:', {
          sessionCreatedAt: session.created_at,
          currentDate: new Date().toISOString(),
          reportDataCreatedAt: reportData.created_at
        });
        
        return <ReportViewer 
          htmlContent={session.session_data.final_report?.html_content || ''}
          markdownContent={session.session_data.final_report?.markdown_content || ''}
          reportData={reportData}
          onRedoAnalysis={() => goToStep(3)}
        />

      default:
        return null
    }
  }

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
            <h1 className="text-2xl font-bold text-primary">Acelerador 2: Evaluación Diagnóstica</h1>
            <p className="text-muted-foreground">
              Paso {currentStep} de 4: {STEPS[currentStep - 1].description}
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="gap-2">
          <CheckCircle className="w-4 h-4" />
          Activo
        </Badge>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Progreso del acelerador</span>
              <span>{Math.round((currentStep / 4) * 100)}%</span>
            </div>
            <Progress value={(currentStep / 4) * 100} className="h-2" />
            
            <div className="grid grid-cols-4 gap-2 mt-4">
              {STEPS.map((step) => (
                <button
                  key={step.number}
                  onClick={() => goToStep(step.number)}
                  disabled={step.number > currentStep + 1}
                  className={`p-2 rounded text-xs text-center transition-colors ${
                    step.number === currentStep
                      ? 'bg-primary text-primary-foreground'
                      : step.number < currentStep
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : step.number === currentStep + 1
                      ? 'bg-muted hover:bg-muted-foreground/10'
                      : 'bg-muted/50 text-muted-foreground/50 cursor-not-allowed'
                  }`}
                >
                  <div className="font-medium">{step.number}</div>
                  <div className="truncate">{step.title}</div>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      {renderStepContent()}
    </div>
  )
}

export default Acelerador2