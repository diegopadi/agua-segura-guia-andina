import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowRight, Users, RefreshCw, AlertCircle, CheckCircle } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "@/hooks/use-toast"

interface StudentCharacteristicsProps {
  session: any
  onUpdate: (data: any) => void
  onNext: () => void
}

export function StudentCharacteristics({ session, onUpdate, onNext }: StudentCharacteristicsProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [teacherQuestions, setTeacherQuestions] = useState(
    session.session_data.teacher_questions || []
  )
  const [responses, setResponses] = useState(
    session.session_data.teacher_responses || {}
  )
  const [accelerator1Data, setAccelerator1Data] = useState<any>(null)

  // Native debounce implementation
  const debounce = useCallback((func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout
    return (...args: any[]) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func.apply(null, args), delay)
    }
  }, [])

  // Debounced save function
  const debouncedSave = useCallback(
    debounce((newResponses: any) => {
      onUpdate({
        teacher_responses: newResponses
      })
    }, 2000),
    [onUpdate]
  )

  useEffect(() => {
    loadAccelerator1Data()
  }, [])

  useEffect(() => {
    if (teacherQuestions.length === 0 && accelerator1Data && !loadingQuestions) {
      generateTeacherQuestions()
    }
  }, [accelerator1Data, teacherQuestions.length])

  const loadAccelerator1Data = async () => {
    try {
      const { data: acc1Session } = await supabase
        .from('acelerador_sessions')
        .select('session_data')
        .eq('user_id', user!.id)
        .eq('acelerador_number', 1)
        .eq('status', 'completed')
        .single()

      if (acc1Session) {
        setAccelerator1Data(acc1Session.session_data)
      }
    } catch (error) {
      console.error('Error loading Accelerator 1 data:', error)
    }
  }

  const generateTeacherQuestions = async () => {
    if (!accelerator1Data) {
      toast({
        title: "Datos no encontrados",
        description: "No se encontraron los datos del Acelerador 1",
        variant: "destructive"
      })
      return
    }

    setLoadingQuestions(true)

    try {
      const { data, error } = await supabase.functions.invoke('generate-teacher-questions', {
        body: {
          accelerator1Data: accelerator1Data
        }
      })

      if (error) throw error

      setTeacherQuestions(data.questions)
      onUpdate({
        teacher_questions: data.questions
      })

      toast({
        title: "Preguntas generadas",
        description: "Se han generado las preguntas específicas para tu contexto"
      })

    } catch (error) {
      console.error('Error generating teacher questions:', error)
      toast({
        title: "Error",
        description: "No se pudieron generar las preguntas. Intenta nuevamente.",
        variant: "destructive"
      })
    } finally {
      setLoadingQuestions(false)
    }
  }

  const handleResponseChange = (questionId: string, value: string) => {
    const newResponses = {
      ...responses,
      [questionId]: value
    }
    setResponses(newResponses)
    debouncedSave(newResponses)
  }

  const validateResponses = () => {
    return teacherQuestions.every((question: any) => {
      const response = responses[question.id] || ''
      return response.trim().length >= 10
    })
  }

  const isComplete = validateResponses()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-green-600" />
            <div>
              <CardTitle>Características de tus estudiantes</CardTitle>
              <CardDescription>
                Responde estas preguntas para personalizar el diagnóstico
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Accelerator 1 Status */}
          <div className={`border rounded-lg p-4 ${
            accelerator1Data 
              ? 'bg-green-50 border-green-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {accelerator1Data ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              )}
              <h3 className={`font-semibold ${
                accelerator1Data ? 'text-green-800' : 'text-yellow-800'
              }`}>
                {accelerator1Data ? 'Diagnóstico del Acelerador 1 cargado' : 'Cargando diagnóstico del Acelerador 1...'}
              </h3>
            </div>
            <p className={`text-sm ${
              accelerator1Data ? 'text-green-700' : 'text-yellow-700'
            }`}>
              {accelerator1Data 
                ? 'Se utilizarán las prioridades identificadas para generar preguntas específicas'
                : 'Se necesita el diagnóstico del Acelerador 1 para generar las preguntas'
              }
            </p>
          </div>

          {/* Loading Questions */}
          {loadingQuestions && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <h3 className="font-semibold text-lg mb-2">Generando preguntas...</h3>
              <p className="text-muted-foreground">
                Estamos creando preguntas específicas basadas en tu diagnóstico del Acelerador 1
              </p>
            </div>
          )}

          {/* Questions Form */}
          {teacherQuestions.length > 0 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Instrucciones</h3>
                <p className="text-blue-700 text-sm">
                  Responde cada pregunta con al menos 10 caracteres. Tus respuestas ayudarán a generar 
                  un diagnóstico más preciso y recomendaciones específicas para tu contexto educativo.
                </p>
              </div>

              <div className="space-y-6">
                {teacherQuestions.map((question: any, index: number) => (
                  <div key={question.id} className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Badge variant="outline" className="mt-1">
                        {index + 1}
                      </Badge>
                      <div className="flex-1 space-y-2">
                        <Label htmlFor={question.id} className="text-base font-medium">
                          {question.question_text}
                        </Label>
                        {question.context && (
                          <p className="text-sm text-muted-foreground">
                            {question.context}
                          </p>
                        )}
                        <Textarea
                          id={question.id}
                          placeholder="Escribe tu respuesta aquí..."
                          value={responses[question.id] || ''}
                          onChange={(e) => handleResponseChange(question.id, e.target.value)}
                          className="min-h-[100px]"
                        />
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>
                            {(responses[question.id] || '').length} caracteres
                          </span>
                          {(responses[question.id] || '').length >= 10 ? (
                            <span className="text-green-600 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Completo
                            </span>
                          ) : (
                            <span className="text-yellow-600">
                              Mínimo 10 caracteres
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Progress Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Progreso de respuestas</h3>
                  <Badge variant={isComplete ? "default" : "secondary"}>
                    {Object.values(responses).filter(r => (r as string)?.length >= 10).length} / {teacherQuestions.length}
                  </Badge>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {teacherQuestions.map((question: any, index: number) => {
                    const isAnswered = (responses[question.id] || '').length >= 10
                    return (
                      <div
                        key={question.id}
                        className={`h-2 rounded-full ${
                          isAnswered ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      />
                    )
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <Button 
                  onClick={generateTeacherQuestions} 
                  variant="outline"
                  disabled={loadingQuestions}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerar preguntas
                </Button>
                
                <Button 
                  onClick={onNext}
                  disabled={!isComplete}
                >
                  Continuar al análisis
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Manual Generate Button */}
          {teacherQuestions.length === 0 && !loadingQuestions && accelerator1Data && (
            <div className="text-center">
              <Button onClick={generateTeacherQuestions} size="lg">
                <Users className="w-5 h-5 mr-2" />
                Generar preguntas personalizadas
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}