import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Brain, Save, CheckCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface SupplementaryQuestionsProps {
  session: any
  onNext: (data: any) => void
  onPrev: () => void
}

interface AdditionalQuestion {
  question: string
  reason: string
  priority: 'high' | 'medium' | 'low'
}

const SupplementaryQuestions = ({ session, onNext, onPrev }: SupplementaryQuestionsProps) => {
  const { toast } = useToast()
  const [questions, setQuestions] = useState<AdditionalQuestion[]>([])
  const [responses, setResponses] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAdditionalQuestions()
    loadExistingResponses()
  }, [])

  const loadAdditionalQuestions = () => {
    try {
      const analysis = session.session_data?.completeness_analysis
      if (analysis?.additional_questions) {
        setQuestions(analysis.additional_questions)
      }
    } catch (error) {
      console.error('Error loading additional questions:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las preguntas adicionales",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadExistingResponses = async () => {
    try {
      const { data, error } = await supabase
        .from('form_responses')
        .select('*')
        .eq('session_id', session.id)
        .gte('question_number', 1000) // Additional questions start from 1000

      if (error) throw error

      const responseMap: Record<number, string> = {}
      data?.forEach(response => {
        responseMap[response.question_number] = response.response_text || ""
      })
      setResponses(responseMap)
    } catch (error) {
      console.error('Error loading existing responses:', error)
    }
  }

  const saveResponse = async (questionIndex: number, responseText: string) => {
    const questionNumber = 1000 + questionIndex // Offset to avoid conflicts with main form

    try {
      const { error } = await supabase
        .from('form_responses')
        .upsert({
          session_id: session.id,
          question_number: questionNumber,
          response_text: responseText,
          response_data: { is_additional: true, priority: questions[questionIndex].priority }
        })

      if (error) throw error
    } catch (error) {
      console.error('Error saving response:', error)
      throw error
    }
  }

  const handleResponseChange = async (questionIndex: number, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionIndex]: value
    }))

    // Auto-save after 1 second of no typing
    try {
      await saveResponse(questionIndex, value)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la respuesta",
        variant: "destructive"
      })
    }
  }

  const getCompletedQuestions = () => {
    return Object.values(responses).filter(response => response.trim().length > 0).length
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      default: return 'bg-blue-100 text-blue-700 border-blue-200'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta prioridad'
      case 'medium': return 'Media prioridad'
      default: return 'Baja prioridad'
    }
  }

  const handleNext = () => {
    const completedCount = getCompletedQuestions()
    const highPriorityQuestions = questions.filter(q => q.priority === 'high').length
    const highPriorityCompleted = questions
      .filter((q, i) => q.priority === 'high')
      .filter((q, i) => responses[questions.indexOf(q)]?.trim()).length

    // Require all high priority questions to be answered
    if (highPriorityCompleted < highPriorityQuestions) {
      toast({
        title: "Preguntas de alta prioridad pendientes",
        description: `Completa las ${highPriorityQuestions - highPriorityCompleted} preguntas de alta prioridad restantes`,
        variant: "destructive"
      })
      return
    }

    onNext({
      additional_responses: responses,
      completed_additional: completedCount
    })
  }

  const handleSkip = () => {
    toast({
      title: "Preguntas adicionales omitidas",
      description: "Puedes regresar más tarde para completar estas preguntas",
    })
    onNext({
      additional_responses: responses,
      completed_additional: getCompletedQuestions(),
      skipped: true
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (questions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            ¡Diagnóstico Completo!
          </CardTitle>
          <CardDescription>
            Tu diagnóstico está suficientemente completo. No se requieren preguntas adicionales.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-green-800">
              El análisis de IA determinó que tu diagnóstico tiene toda la información necesaria 
              para generar un reporte comprensivo. Puedes proceder directamente a la generación del documento.
            </p>
          </div>
          
          <div className="flex justify-between">
            <Button variant="outline" onClick={onPrev}>
              Anterior
            </Button>
            <Button onClick={() => onNext({ skipped_no_questions_needed: true })}>
              Generar reporte
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          Paso 5: Preguntas Adicionales
        </CardTitle>
        <CardDescription>
          La IA ha identificado algunas áreas que podrían enriquecer tu diagnóstico.
          Responde las preguntas que consideres relevantes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progreso de preguntas adicionales</span>
            <span>{getCompletedQuestions()} de {questions.length} respondidas</span>
          </div>
          <Progress value={(getCompletedQuestions() / questions.length) * 100} className="h-2" />
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((question, index) => (
            <div key={index} className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="bg-primary text-primary-foreground text-sm font-medium px-2 py-1 rounded-full mt-1">
                    {index + 1}
                  </span>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{question.question}</p>
                      <div className="flex gap-2">
                        <Badge 
                          variant="outline" 
                          className={getPriorityColor(question.priority)}
                        >
                          {getPriorityLabel(question.priority)}
                        </Badge>
                        {responses[index]?.trim() && (
                          <Save className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">¿Por qué es importante?</span><br />
                        {question.reason}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="ml-12">
                  <Textarea
                    placeholder="Escribe tu respuesta aquí..."
                    value={responses[index] || ""}
                    onChange={(e) => handleResponseChange(index, e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </div>

              {index < questions.length - 1 && <hr className="my-6" />}
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">Resumen</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• Total de preguntas adicionales: {questions.length}</p>
            <p>• Preguntas de alta prioridad: {questions.filter(q => q.priority === 'high').length}</p>
            <p>• Preguntas completadas: {getCompletedQuestions()}</p>
            <p className="text-xs mt-2 text-blue-700">
              * Las preguntas de alta prioridad son altamente recomendadas para un diagnóstico completo
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onPrev}>
            Anterior
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSkip}>
              Omitir y continuar
            </Button>
            <Button onClick={handleNext}>
              Continuar al reporte
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default SupplementaryQuestions