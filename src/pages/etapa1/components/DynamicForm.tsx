import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Brain, Save } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface DynamicFormProps {
  session: any
  onNext: (data: any) => void
  onPrev: () => void
}

interface Question {
  nro: number
  focoTematico: string
  pregunta: string
  tipoRespuesta: string
}

const DynamicForm = ({ session, onNext, onPrev }: DynamicFormProps) => {
  const { toast } = useToast()
  const [questions, setQuestions] = useState<Question[]>([])
  const [responses, setResponses] = useState<Record<number, any>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadTemplate()
    loadExistingResponses()
  }, [])

  const loadTemplate = async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('content')
        .eq('name', 'plantilla1')
        .single()

      if (error) throw error
      setQuestions(data.content as unknown as Question[])
    } catch (error) {
      console.error('Error loading template:', error)
      toast({
        title: "Error",
        description: "No se pudo cargar el formulario",
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

      if (error) throw error

      const responseMap: Record<number, any> = {}
      data?.forEach(response => {
        responseMap[response.question_number] = {
          text: response.response_text,
          data: response.response_data
        }
      })
      setResponses(responseMap)
    } catch (error) {
      console.error('Error loading responses:', error)
    }
  }

  const saveResponse = async (questionNumber: number, responseText: string, responseData: any = {}) => {
    try {
      const { error } = await supabase
        .from('form_responses')
        .upsert({
          session_id: session.id,
          question_number: questionNumber,
          response_text: responseText,
          response_data: responseData
        }, {
          onConflict: 'session_id,question_number'
        })

      if (error) throw error
    } catch (error) {
      console.error('Error saving response:', error)
      throw error
    }
  }

  const handleResponseChange = async (questionNumber: number, value: string, additionalData: any = {}) => {
    const newResponse = { text: value, data: additionalData }
    setResponses(prev => ({
      ...prev,
      [questionNumber]: newResponse
    }))

    // Auto-save after 1 second of no typing
    try {
      await saveResponse(questionNumber, value, additionalData)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la respuesta",
        variant: "destructive"
      })
    }
  }

  const renderQuestionInput = (question: Question) => {
    const response = responses[question.nro]

    switch (question.tipoRespuesta) {
      case "Escala 1-5 + explicación breve":
        return (
          <div className="space-y-3">
            <RadioGroup
              value={response?.data?.scale?.toString() || ""}
              onValueChange={(value) => {
                const newData = { ...response?.data, scale: parseInt(value) }
                handleResponseChange(question.nro, response?.text || "", newData)
              }}
            >
              <div className="flex gap-4">
                {[1, 2, 3, 4, 5].map(num => (
                  <div key={num} className="flex items-center space-x-2">
                    <RadioGroupItem value={num.toString()} id={`q${question.nro}-${num}`} />
                    <Label htmlFor={`q${question.nro}-${num}`}>{num}</Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
            <Textarea
              placeholder="Explica brevemente tu respuesta..."
              value={response?.text || ""}
              onChange={(e) => handleResponseChange(question.nro, e.target.value, response?.data)}
              className="min-h-[80px]"
            />
          </div>
        )

      case "Sí/No + caso(s)":
        return (
          <div className="space-y-3">
            <RadioGroup
              value={response?.data?.answer || ""}
              onValueChange={(value) => {
                const newData = { ...response?.data, answer: value }
                handleResponseChange(question.nro, response?.text || "", newData)
              }}
            >
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="si" id={`q${question.nro}-si`} />
                  <Label htmlFor={`q${question.nro}-si`}>Sí</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id={`q${question.nro}-no`} />
                  <Label htmlFor={`q${question.nro}-no`}>No</Label>
                </div>
              </div>
            </RadioGroup>
            {response?.data?.answer === "si" && (
              <Textarea
                placeholder="Describe los casos observados..."
                value={response?.text || ""}
                onChange={(e) => handleResponseChange(question.nro, e.target.value, response?.data)}
                className="min-h-[80px]"
              />
            )}
          </div>
        )

      case "Bueno/Regular/Malo + comentario":
        return (
          <div className="space-y-3">
            <RadioGroup
              value={response?.data?.rating || ""}
              onValueChange={(value) => {
                const newData = { ...response?.data, rating: value }
                handleResponseChange(question.nro, response?.text || "", newData)
              }}
            >
              <div className="flex gap-4">
                {["Bueno", "Regular", "Malo"].map(rating => (
                  <div key={rating} className="flex items-center space-x-2">
                    <RadioGroupItem value={rating.toLowerCase()} id={`q${question.nro}-${rating}`} />
                    <Label htmlFor={`q${question.nro}-${rating}`}>{rating}</Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
            <Textarea
              placeholder="Agrega comentarios adicionales..."
              value={response?.text || ""}
              onChange={(e) => handleResponseChange(question.nro, e.target.value, response?.data)}
              className="min-h-[80px]"
            />
          </div>
        )

      default:
        return (
          <Textarea
            placeholder="Escribe tu respuesta aquí..."
            value={response?.text || ""}
            onChange={(e) => handleResponseChange(question.nro, e.target.value, response?.data)}
            className="min-h-[100px]"
          />
        )
    }
  }

  const getCompletedQuestions = () => {
    return Object.keys(responses).filter(key => {
      const response = responses[parseInt(key)]
      return response?.text?.trim() || response?.data
    }).length
  }

  const handleNext = async () => {
    const completedCount = getCompletedQuestions()
    
    if (completedCount < questions.length * 0.8) { // At least 80% completed
      toast({
        title: "Formulario incompleto",
        description: `Completa al menos ${Math.ceil(questions.length * 0.8)} preguntas para continuar`,
        variant: "destructive"
      })
      return
    }

    setSaving(true)
    try {
      // Save completion status
      onNext({ form_responses: responses, completed_questions: completedCount })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el progreso",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          Paso 3: Preguntas Orientadoras
        </CardTitle>
        <CardDescription>
          Responde las siguientes preguntas para construir el diagnóstico de tu institución.
          Las respuestas se guardan automáticamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progreso del formulario</span>
            <span>{getCompletedQuestions()} de {questions.length} preguntas</span>
          </div>
          <Progress value={(getCompletedQuestions() / questions.length) * 100} className="h-2" />
        </div>

        {/* Questions */}
        <div className="space-y-8">
          {questions.map((question, index) => (
            <div key={question.nro} className="space-y-4">
              <div className="pb-2 border-b">
                <div className="flex items-start gap-3">
                  <span className="bg-primary text-primary-foreground text-sm font-medium px-2 py-1 rounded-full mt-1">
                    {question.nro}
                  </span>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {question.focoTematico}
                    </p>
                    <p className="font-medium">{question.pregunta}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tipo: {question.tipoRespuesta}
                    </p>
                  </div>
                  {responses[question.nro]?.text && (
                    <Save className="w-4 h-4 text-green-600" />
                  )}
                </div>
              </div>
              
              {renderQuestionInput(question)}
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t">
          <Button variant="outline" onClick={onPrev}>
            Anterior
          </Button>
          <Button onClick={handleNext} disabled={saving}>
            {saving ? "Guardando..." : "Continuar al análisis"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default DynamicForm