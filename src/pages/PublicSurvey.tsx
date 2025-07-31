
import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertCircle, ArrowLeft, ArrowRight } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "@/hooks/use-toast"

interface Question {
  id: string
  question_text: string
  question_type: string
  options: string[]
  required: boolean
  order_number: number
}

interface Survey {
  id: string
  title: string
  description: string
  status: string
}

export default function PublicSurvey() {
  const { token: participantToken } = useParams<{ token: string }>()
  const navigate = useNavigate()
  
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [participantId, setParticipantId] = useState<string | null>(null)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (participantToken) {
      loadSurvey()
    }
  }, [participantToken])

  const loadSurvey = async () => {
    try {
      setLoading(true)
      setError(null)

      // Validate participant exists and get survey info
      const { data: participantData, error: participantError } = await supabase
        .from('survey_participants')
        .select('id, survey_id')
        .eq('participant_token', participantToken)
        .single()

      if (participantError) {
        if (participantError.code === 'PGRST116') {
          setError('Enlace de participante no válido o no encontrado')
        } else {
          setError('Error al validar el participante')
        }
        return
      }

      // Store participant ID in sessionStorage for persistence
      const storedParticipantId = sessionStorage.getItem(`participant_${participantToken}`)
      if (!storedParticipantId) {
        sessionStorage.setItem(`participant_${participantToken}`, participantData.id)
      }
      setParticipantId(participantData.id)

      // Load survey info
      const { data: surveyData, error: surveyError } = await supabase
        .from('surveys')
        .select('id, title, description, status')
        .eq('id', participantData.survey_id)
        .eq('status', 'active')
        .single()

      if (surveyError) {
        if (surveyError.code === 'PGRST116') {
          setError('Encuesta no encontrada o no está disponible')
        } else {
          setError('Error al cargar la encuesta')
        }
        return
      }

      setSurvey(surveyData)

      // Load questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('survey_questions')
        .select('*')
        .eq('survey_id', surveyData.id)
        .order('order_number')

      if (questionsError) {
        setError('Error al cargar las preguntas')
        return
      }

      setQuestions(questionsData.map(q => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: Array.isArray(q.options) ? q.options.map(String) : [],
        required: q.required ?? false,
        order_number: q.order_number
      })))
      
    } catch (error) {
      console.error('Error loading survey:', error)
      setError('Error inesperado al cargar la encuesta')
    } finally {
      setLoading(false)
    }
  }

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const handleMultipleChoice = (questionId: string, option: string, checked: boolean) => {
    const currentValues = responses[questionId] || []
    let newValues
    
    if (checked) {
      newValues = [...currentValues, option]
    } else {
      newValues = currentValues.filter((v: string) => v !== option)
    }
    
    handleResponseChange(questionId, newValues)
  }

  const validateCurrentQuestion = () => {
    const currentQuestion = questions[currentQuestionIndex]
    if (!currentQuestion?.required) return true
    
    const response = responses[currentQuestion.id]
    
    if (!response) return false
    if (Array.isArray(response) && response.length === 0) return false
    if (typeof response === 'string' && response.trim() === '') return false
    
    return true
  }

  const goToNext = () => {
    if (!validateCurrentQuestion()) {
      toast({
        title: "Campo requerido",
        description: "Por favor responde esta pregunta antes de continuar",
        variant: "destructive"
      })
      return
    }
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const submitSurvey = async () => {
    if (!survey) return

    // Validate all required questions
    const missingRequired = questions
      .filter(q => q.required)
      .find(q => {
        const response = responses[q.id]
        return !response || 
               (Array.isArray(response) && response.length === 0) ||
               (typeof response === 'string' && response.trim() === '')
      })

    if (missingRequired) {
      toast({
        title: "Campos incompletos",
        description: "Por favor completa todas las preguntas requeridas",
        variant: "destructive"
      })
      return
    }

    try {
      setSubmitting(true)

      // Update participant status to completed
      if (participantId) {
        const { error: participantError } = await supabase
          .from('survey_participants')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', participantId)

        if (participantError) {
          console.error('Error updating participant:', participantError)
        }
      }

      // Save all responses with both participant_id and participant_token
      const responseRecords = Object.entries(responses).map(([questionId, responseData]) => ({
        survey_id: survey.id,
        question_id: questionId,
        participant_id: participantId, // Use participant_id from FK
        participant_token: participantToken, // Still required by schema
        response_data: responseData
      }))

      const { error: responseError } = await supabase
        .from('survey_responses')
        .insert(responseRecords)

      if (responseError) {
        throw responseError
      }

      setSubmitted(true)
      toast({
        title: "¡Encuesta enviada!",
        description: "Gracias por tu participación"
      })

    } catch (error) {
      console.error('Error submitting survey:', error)
      toast({
        title: "Error al enviar",
        description: "Hubo un problema al enviar tu respuesta. Inténtalo de nuevo.",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const renderQuestion = (question: Question) => {
    const response = responses[question.id]

    switch (question.question_type) {
      case 'single_choice':
        return (
          <RadioGroup 
            value={response || ''} 
            onValueChange={(value) => handleResponseChange(question.id, value)}
            className="space-y-3 mt-4"
          >
            {question.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                <Label 
                  htmlFor={`${question.id}-${index}`}
                  className="text-sm leading-relaxed cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )

      case 'multiple_choice':
        return (
          <div className="space-y-3 mt-4">
            {question.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox 
                  id={`${question.id}-${index}`}
                  checked={(response || []).includes(option)}
                  onCheckedChange={(checked) => 
                    handleMultipleChoice(question.id, option, checked as boolean)
                  }
                />
                <Label 
                  htmlFor={`${question.id}-${index}`}
                  className="text-sm leading-relaxed cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            ))}
          </div>
        )

      case 'text':
        return (
          <Textarea
            value={response || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder="Escribe tu respuesta aquí..."
            className="mt-4 min-h-24"
          />
        )

      case 'number':
        return (
          <Input
            type="number"
            value={response || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder="Ingresa un número"
            className="mt-4"
          />
        )

      case 'scale':
        return (
          <RadioGroup 
            value={response || ''} 
            onValueChange={(value) => handleResponseChange(question.id, value)}
            className="flex flex-wrap gap-4 mt-4"
          >
            {question.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                <Label 
                  htmlFor={`${question.id}-${index}`}
                  className="text-sm cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )

      case 'yes_no':
        return (
          <RadioGroup 
            value={response || ''} 
            onValueChange={(value) => handleResponseChange(question.id, value)}
            className="flex gap-6 mt-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Sí" id={`${question.id}-yes`} />
              <Label 
                htmlFor={`${question.id}-yes`}
                className="text-sm cursor-pointer"
              >
                Sí
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="No" id={`${question.id}-no`} />
              <Label 
                htmlFor={`${question.id}-no`}
                className="text-sm cursor-pointer"
              >
                No
              </Label>
            </div>
          </RadioGroup>
        )

      default:
        return (
          <Input
            value={response || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder="Tu respuesta"
            className="mt-4"
          />
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando encuesta...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => navigate('/')} variant="outline">
                Ir al inicio
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">¡Encuesta completada!</h3>
              <p className="text-muted-foreground mb-4">
                Gracias por tu participación. Tus respuestas han sido guardadas exitosamente.
              </p>
              <Button onClick={() => navigate('/')} variant="outline">
                Ir al inicio
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!survey || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Encuesta no disponible</h3>
              <p className="text-muted-foreground">No se pudo cargar la encuesta solicitada.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 py-4 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">
            {survey.title}
          </h1>
          {survey.description && (
            <p className="text-muted-foreground text-sm md:text-base">
              {survey.description}
            </p>
          )}
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Pregunta {currentQuestionIndex + 1} de {questions.length}</span>
            <span>{Math.round(progress)}% completado</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">
              {currentQuestion.question_text}
              {currentQuestion.required && <span className="text-destructive ml-1">*</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderQuestion(currentQuestion)}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button 
            onClick={goToPrevious}
            disabled={currentQuestionIndex === 0}
            variant="outline"
            size={isMobile ? "sm" : "default"}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>

          {isLastQuestion ? (
            <Button 
              onClick={submitSurvey}
              disabled={submitting || !validateCurrentQuestion()}
              size={isMobile ? "sm" : "default"}
            >
              {submitting ? 'Enviando...' : 'Enviar encuesta'}
            </Button>
          ) : (
            <Button 
              onClick={goToNext}
              disabled={!validateCurrentQuestion()}
              size={isMobile ? "sm" : "default"}
            >
              Siguiente
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>

        {/* All questions view for desktop */}
        {!isMobile && questions.length <= 10 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-lg">Vista completa</CardTitle>
              <CardDescription>
                También puedes responder todas las preguntas aquí
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {questions.map((question, index) => (
                  <div key={question.id} className="border-b pb-6 last:border-b-0">
                    <div className="flex gap-3 mb-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-base mb-2">
                          {question.question_text}
                          {question.required && <span className="text-destructive ml-1">*</span>}
                        </h4>
                        {renderQuestion(question)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 text-center">
                <Button 
                  onClick={submitSurvey}
                  disabled={submitting}
                  size="lg"
                >
                  {submitting ? 'Enviando...' : 'Enviar todas las respuestas'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
