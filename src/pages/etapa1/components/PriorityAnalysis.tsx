import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Brain, RefreshCw, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface PriorityAnalysisProps {
  sessionId: string
  accelerator1Data: any
  accelerator2Data: any
  accelerator3Data: any
  profileData: any
  onComplete: (report: any) => void
  onPrevious: () => void
}

const PriorityAnalysis = ({
  sessionId,
  accelerator1Data,
  accelerator2Data,
  accelerator3Data,
  profileData,
  onComplete,
  onPrevious
}: PriorityAnalysisProps) => {
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    // Check if analysis already exists
    checkExistingAnalysis()
  }, [sessionId])

  const checkExistingAnalysis = async () => {
    try {
      const { data: session, error } = await supabase
        .from('acelerador_sessions')
        .select('session_data')
        .eq('id', sessionId)
        .single()

      if (error) throw error

      const sessionData = session.session_data as any || {}
      
      if (sessionData.priority_report) {
        // Analysis already completed
        onComplete(sessionData.priority_report)
      } else {
        // Start analysis automatically
        startAnalysis()
      }
    } catch (error: any) {
      console.error('Error checking existing analysis:', error)
      startAnalysis()
    }
  }

  const startAnalysis = async () => {
    setAnalyzing(true)
    setError(null)
    setErrorDetails(null)
    setProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev < 90) return prev + 5
          return prev
        })
      }, 500)

      console.log('Calling generate-priority-report with data:', {
        accelerator1Data,
        accelerator2Data,
        accelerator3Data,
        profileData
      })

      const { data, error } = await supabase.functions.invoke(
        'generate-priority-report',
        {
          body: {
            accelerator1Data,
            accelerator2Data,
            accelerator3Data,
            profileData
          }
        }
      )

      console.log('Edge function response:', { data, error })

      clearInterval(progressInterval)
      setProgress(100)

      if (error) {
        console.error('Edge function error details:', error)
        setErrorDetails(JSON.stringify(error, null, 2))
        throw error
      }

      if (!data.report) {
        throw new Error('No se recibió un informe válido')
      }

      // Save report to session
      await updateSession({
        priority_report: data.report
      })

      // Update session status to completed and increment step
      await supabase
        .from('acelerador_sessions')
        .update({
          current_step: 4,
          status: 'completed'
        })
        .eq('id', sessionId)

      toast({
        title: "Análisis completado",
        description: "Se ha generado tu informe de priorización de necesidades hídricas.",
      })

      // Complete after a short delay to show 100% progress
      setTimeout(() => {
        onComplete(data.report)
      }, 1000)

    } catch (error: any) {
      console.error('Error generating priority report:', error)
      setError(error.message || 'Error al generar el informe de priorización')
      setAnalyzing(false)
      setProgress(0)
      
      toast({
        title: "Error en el análisis",
        description: "No se pudo completar el análisis. Inténtalo de nuevo.",
        variant: "destructive",
      })
    }
  }

  const updateSession = async (updates: any) => {
    try {
      const { data: currentSession } = await supabase
        .from('acelerador_sessions')
        .select('session_data')
        .eq('id', sessionId)
        .single()

      const currentData = currentSession?.session_data as any || {}

      const { error } = await supabase
        .from('acelerador_sessions')
        .update({
          session_data: {
            ...currentData,
            ...updates
          }
        })
        .eq('id', sessionId)

      if (error) throw error
    } catch (error: any) {
      console.error('Error updating session:', error)
    }
  }

  const handleRetry = () => {
    setError(null)
    setErrorDetails(null)
    startAnalysis()
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
        
        {errorDetails && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-800 mb-2">Detalles del error:</h4>
            <pre className="text-red-700 text-xs overflow-auto max-h-96 whitespace-pre-wrap">
              {errorDetails}
            </pre>
          </div>
        )}
        
        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={onPrevious}>
            Anterior
          </Button>
          <Button onClick={handleRetry}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar análisis
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-fit">
            <Brain className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <CardTitle className="text-2xl">Analizando con IA</CardTitle>
          <CardDescription className="text-lg">
            Procesando...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground">
              {progress}% completado
            </p>
          </div>
          
          <div className="bg-muted/50 p-6 rounded-lg">
            <h3 className="font-semibold text-lg mb-4">Proceso de análisis integral</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${progress > 20 ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span>Analizando diagnóstico hídrico (Acelerador 1)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${progress > 40 ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span>Evaluando características estudiantiles (Acelerador 2)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${progress > 60 ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span>Procesando capacidades institucionales (Acelerador 3)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${progress > 80 ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span>Generando priorización de necesidades</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${progress === 100 ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span>Creando informe final</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PriorityAnalysis