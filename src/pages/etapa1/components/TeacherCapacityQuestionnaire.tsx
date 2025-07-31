import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, RefreshCw, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface Question {
  id: number
  dimension: string
  question_text: string
  question_type: string
  options: Array<{
    value: string
    label: string
  }>
}

interface TeacherCapacityQuestionnaireProps {
  sessionId: string
  accelerator1Data: any
  accelerator2Data: any
  onComplete: (responses: any) => void
  onPrevious: () => void
}

const TeacherCapacityQuestionnaire = ({
  sessionId,
  accelerator1Data,
  accelerator2Data,
  onComplete,
  onPrevious
}: TeacherCapacityQuestionnaireProps) => {
  const [questions, setQuestions] = useState<Question[]>([])
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Load existing responses from session data
  useEffect(() => {
    loadExistingData()
  }, [sessionId])

  const loadExistingData = async () => {
    try {
      const { data: session, error } = await supabase
        .from('acelerador_sessions')
        .select('session_data')
        .eq('id', sessionId)
        .single()

      if (error) throw error

      const sessionData = session.session_data as any || {}
      
      // Check if questionnaire already exists
      if (sessionData.questionnaire && sessionData.questionnaire.questions) {
        setQuestions(sessionData.questionnaire.questions)
        setResponses(sessionData.capacity_responses || {})
        setLoading(false)
      } else {
        // Generate new questionnaire
        await generateQuestionnaire()
      }
    } catch (error: any) {
      console.error('Error loading existing data:', error)
      setError('Error al cargar datos existentes')
      setLoading(false)
    }
  }

  const generateQuestionnaire = async () => {
    setGenerating(true)
    setError(null)

    try {
      const { data, error } = await supabase.functions.invoke(
        'generate-teacher-capacity-questionnaire',
        {
          body: {
            accelerator1Data,
            accelerator2Data
          }
        }
      )

      if (error) throw error

      if (!data.questionnaire || !data.questionnaire.questions) {
        throw new Error('No se recibió un cuestionario válido')
      }

      const generatedQuestions = data.questionnaire.questions
      setQuestions(generatedQuestions)

      // Save questionnaire to session
      await updateSession({
        questionnaire: data.questionnaire
      })

      toast({
        title: "Cuestionario generado",
        description: "Se han creado 10 preguntas personalizadas para evaluar las capacidades institucionales.",
      })

    } catch (error: any) {
      console.error('Error generating questionnaire:', error)
      setError(error.message || 'Error al generar el cuestionario')
      toast({
        title: "Error",
        description: "No se pudo generar el cuestionario. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
      setLoading(false)
    }
  }

  const updateSession = async (updates: any) => {
    try {
      const { error } = await supabase
        .from('acelerador_sessions')
        .update({
          session_data: {
            ...updates
          }
        })
        .eq('id', sessionId)

      if (error) throw error
    } catch (error: any) {
      console.error('Error updating session:', error)
    }
  }

  const handleResponseChange = async (questionId: string, value: string) => {
    const newResponses = {
      ...responses,
      [questionId]: value
    }
    setResponses(newResponses)

    // Auto-save responses
    try {
      await updateSession({
        questionnaire: { questions },
        capacity_responses: newResponses
      })
    } catch (error: any) {
      console.error('Error auto-saving responses:', error)
    }
  }

  const handleContinue = async () => {
    // Validate all questions are answered
    const unansweredQuestions = questions.filter(q => !responses[q.id.toString()])
    
    if (unansweredQuestions.length > 0) {
      toast({
        title: "Completa todas las preguntas",
        description: `Faltan ${unansweredQuestions.length} preguntas por responder.`,
        variant: "destructive",
      })
      return
    }

    // Save final responses and continue
    await updateSession({
      questionnaire: { questions },
      capacity_responses: responses
    })

    onComplete(responses)
  }

  const getCompletionPercentage = () => {
    if (questions.length === 0) return 0
    const answeredCount = Object.keys(responses).length
    return Math.round((answeredCount / questions.length) * 100)
  }

  const getDimensionColor = (dimension: string) => {
    const colors = {
      'técnicas': 'bg-blue-100 text-blue-800',
      'recursos': 'bg-green-100 text-green-800', 
      'gestión': 'bg-purple-100 text-purple-800',
      'redes': 'bg-orange-100 text-orange-800',
      'pedagógicas': 'bg-pink-100 text-pink-800'
    }
    
    const key = Object.keys(colors).find(k => dimension.toLowerCase().includes(k))
    return key ? colors[key as keyof typeof colors] : 'bg-gray-100 text-gray-800'
  }

  if (loading || generating) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <CardTitle>
              {generating ? 'Generando cuestionario de capacidades...' : 'Cargando cuestionario...'}
            </CardTitle>
            <CardDescription>
              {generating 
                ? 'Nuestro sistema está creando preguntas personalizadas basadas en tu diagnóstico'
                : 'Preparando las preguntas para evaluar tus capacidades institucionales'
              }
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
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
        
        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={onPrevious}>
            Anterior
          </Button>
          <Button onClick={generateQuestionnaire}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Evaluación de Capacidades Institucionales</CardTitle>
              <CardDescription>
                Responde las 10 preguntas para evaluar las capacidades de tu institución
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {Object.keys(responses).length}/10
              </div>
              <div className="text-sm text-muted-foreground">completadas</div>
            </div>
          </div>
          <Progress value={getCompletionPercentage()} className="mt-4" />
        </CardHeader>
      </Card>

      {/* Questions */}
      <div className="space-y-6">
        {questions.map((question, index) => {
          const isAnswered = !!responses[question.id.toString()]
          
          return (
            <Card key={question.id} className={`transition-all ${isAnswered ? 'border-green-200 bg-green-50/50' : ''}`}>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      isAnswered ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                    }`}>
                      {isAnswered ? <CheckCircle className="w-4 h-4" /> : index + 1}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline" className={getDimensionColor(question.dimension)}>
                        {question.dimension}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{question.question_text}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={responses[question.id.toString()] || ''}
                  onValueChange={(value) => handleResponseChange(question.id.toString(), value)}
                  className="space-y-3"
                >
                  {question.options.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`${question.id}-${option.value}`} />
                      <Label 
                        htmlFor={`${question.id}-${option.value}`}
                        className="flex-1 cursor-pointer"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Navigation */}
      <div className="flex gap-4 justify-between pt-6">
        <Button variant="outline" onClick={onPrevious}>
          Anterior
        </Button>
        <Button 
          onClick={handleContinue}
          disabled={Object.keys(responses).length < questions.length}
        >
          Continuar al análisis
        </Button>
      </div>
    </div>
  )
}

export default TeacherCapacityQuestionnaire