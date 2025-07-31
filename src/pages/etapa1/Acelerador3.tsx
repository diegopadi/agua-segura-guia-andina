import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Target, Users, Brain, FileText, AlertCircle } from "lucide-react"
import { Link } from "react-router-dom"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useProfile } from "@/hooks/useProfile"
import { useToast } from "@/hooks/use-toast"
import TeacherCapacityQuestionnaire from "./components/TeacherCapacityQuestionnaire"
import PriorityAnalysis from "./components/PriorityAnalysis"
import PriorityReportViewer from "./components/PriorityReportViewer"

const Acelerador3 = () => {
  const { user } = useAuth()
  const { profile } = useProfile()
  const { toast } = useToast()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionData, setSessionData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [prerequisitesError, setPrerequisitesError] = useState<string | null>(null)
  const [accelerator1Data, setAccelerator1Data] = useState<any>(null)
  const [accelerator2Data, setAccelerator2Data] = useState<any>(null)

  useEffect(() => {
    if (user?.id) {
      initializeAccelerator()
    }
  }, [user?.id])

  const initializeAccelerator = async () => {
    try {
      // Check prerequisites - Accelerators 1 and 2 must be completed
      const { data: sessions, error: sessionsError } = await supabase
        .from('acelerador_sessions')
        .select('*')
        .eq('user_id', user!.id)
        .in('acelerador_number', [1, 2, 3])
        .order('updated_at', { ascending: false })

      if (sessionsError) throw sessionsError

      const accelerator1Session = sessions?.find(s => s.acelerador_number === 1)
      const accelerator2Session = sessions?.find(s => s.acelerador_number === 2)
      const accelerator3Session = sessions?.find(s => s.acelerador_number === 3)

      // Validate prerequisites
      if (!accelerator1Session || accelerator1Session.status !== 'completed') {
        setPrerequisitesError('Debes completar el Acelerador 1 antes de continuar')
        setLoading(false)
        return
      }

      if (!accelerator2Session || accelerator2Session.status !== 'completed') {
        setPrerequisitesError('Debes completar el Acelerador 2 antes de continuar')
        setLoading(false)
        return
      }

      // Load data from previous accelerators
      setAccelerator1Data(accelerator1Session.session_data)
      setAccelerator2Data(accelerator2Session.session_data)

      // Handle Accelerator 3 session
      if (accelerator3Session) {
        setSessionId(accelerator3Session.id)
        setSessionData(accelerator3Session.session_data)
        setCurrentStep(accelerator3Session.current_step || 1)
      } else {
        // Create new session for Accelerator 3
        const { data: newSession, error: createError } = await supabase
          .from('acelerador_sessions')
          .insert({
            user_id: user!.id,
            acelerador_number: 3,
            current_step: 1,
            status: 'in_progress'
          })
          .select()
          .single()

        if (createError) throw createError

        setSessionId(newSession.id)
        setSessionData({})
        setCurrentStep(1)
      }

    } catch (error: any) {
      console.error('Error initializing accelerator:', error)
      toast({
        title: "Error",
        description: "No se pudo inicializar el acelerador",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateSessionStep = async (step: number) => {
    if (!sessionId) return

    try {
      await supabase
        .from('acelerador_sessions')
        .update({ current_step: step })
        .eq('id', sessionId)
      
      setCurrentStep(step)
    } catch (error: any) {
      console.error('Error updating session step:', error)
    }
  }

  const handleStepComplete = (data: any) => {
    if (currentStep === 2) {
      // Questionnaire completed, move to analysis
      setSessionData(prev => ({ ...prev, capacity_responses: data }))
      updateSessionStep(3)
    } else if (currentStep === 3) {
      // Analysis completed, move to report view
      setSessionData(prev => ({ ...prev, priority_report: data }))
      updateSessionStep(4)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      updateSessionStep(currentStep - 1)
    }
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Verificación de prerequisitos"
      case 2: return "Cuestionario de capacidades"
      case 3: return "Análisis con IA"
      case 4: return "Informe de prioridades"
      default: return "Acelerador 3"
    }
  }

  const getStepIcon = () => {
    switch (currentStep) {
      case 1: return <Target className="w-5 h-5" />
      case 2: return <Users className="w-5 h-5" />
      case 3: return <Brain className="w-5 h-5" />
      case 4: return <FileText className="w-5 h-5" />
      default: return <Target className="w-5 h-5" />
    }
  }

  if (loading) {
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
            <h1 className="text-2xl font-bold text-primary">Acelerador 3: Priorización de Necesidades</h1>
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </div>
      </div>
    )
  }

  if (prerequisitesError) {
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
            <h1 className="text-2xl font-bold text-primary">Acelerador 3: Priorización de Necesidades</h1>
            <p className="text-muted-foreground">
              Identifica las 5 principales necesidades hídricas de tu institución
            </p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {prerequisitesError}
          </AlertDescription>
        </Alert>

        <div className="flex gap-4 justify-center">
          <Button variant="outline" asChild>
            <Link to="/etapa1">
              Volver al dashboard
            </Link>
          </Button>
          <Button asChild>
            <Link to="/etapa1/acelerador1">
              Ir al Acelerador 1
            </Link>
          </Button>
        </div>
      </div>
    )
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
            <h1 className="text-2xl font-bold text-primary">Acelerador 3: Priorización de Necesidades</h1>
            <p className="text-muted-foreground">
              Identifica las 5 principales necesidades hídricas de tu institución
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStepIcon()}
          <Badge variant="outline">
            {getStepTitle()}
          </Badge>
        </div>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Progreso del Acelerador 3</CardTitle>
            <span className="text-sm text-muted-foreground">
              Paso {currentStep} de 4
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={(currentStep / 4) * 100} className="w-full" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Verificación</span>
            <span>Cuestionario</span>
            <span>Análisis</span>
            <span>Informe</span>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      {currentStep === 1 && (
        <div className="space-y-6">
          {/* Prerequisites Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Aceleradores Completados</CardTitle>
              <CardDescription>
                Revisa los resultados de los aceleradores anteriores antes de continuar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="border-green-200 bg-green-50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-green-100 text-green-800">Completado</Badge>
                      <Target className="w-5 h-5 text-green-600" />
                    </div>
                    <CardTitle className="text-lg">Acelerador 1</CardTitle>
                    <CardDescription>Diagnóstico de necesidades hídricas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-green-700">
                      ✓ PEI analizado y problemas identificados
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-green-100 text-green-800">Completado</Badge>
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <CardTitle className="text-lg">Acelerador 2</CardTitle>
                    <CardDescription>Características estudiantiles</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-green-700">
                      ✓ Perfil estudiantil y contexto analizado
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-between">
            <Button variant="outline" asChild>
              <Link to="/etapa1">
                Volver al dashboard
              </Link>
            </Button>
            <Button onClick={() => updateSessionStep(2)}>
              Continuar al cuestionario
            </Button>
          </div>
        </div>
      )}

      {currentStep === 2 && sessionId && (
        <TeacherCapacityQuestionnaire
          sessionId={sessionId}
          accelerator1Data={accelerator1Data}
          accelerator2Data={accelerator2Data}
          onComplete={handleStepComplete}
          onPrevious={handlePrevious}
        />
      )}

      {currentStep === 3 && sessionId && (
        <PriorityAnalysis
          sessionId={sessionId}
          accelerator1Data={accelerator1Data}
          accelerator2Data={accelerator2Data}
          accelerator3Data={sessionData}
          profileData={profile}
          onComplete={handleStepComplete}
          onPrevious={handlePrevious}
        />
      )}

      {currentStep === 4 && sessionData?.priority_report && (
        <PriorityReportViewer
          htmlContent={sessionData.priority_report.html_content}
          priorities={sessionData.priority_report.priorities}
          metadata={sessionData.priority_report.metadata}
          sessionId={sessionId!}
          onPrevious={handlePrevious}
        />
      )}
    </div>
  )
}

export default Acelerador3