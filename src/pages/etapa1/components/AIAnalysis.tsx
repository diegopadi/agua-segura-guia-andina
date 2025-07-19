import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Brain, RefreshCw, CheckCircle } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "@/hooks/use-toast"

interface AIAnalysisProps {
  session: any
  onUpdate: (data: any) => void
  onNext: () => void
}

export function AIAnalysis({ session, onUpdate, onNext }: AIAnalysisProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [generatedData, setGeneratedData] = useState(session.session_data.ai_analysis || null)
  const [error, setError] = useState<string | null>(null)

  const generateSurveyQuestions = async () => {
    setLoading(true)
    setError(null)

    try {
      // Get Accelerator 1 data
      const { data: acc1Session } = await supabase
        .from('acelerador_sessions')
        .select('session_data')
        .eq('user_id', user!.id)
        .eq('acelerador_number', 1)
        .eq('status', 'completed')
        .single()

      if (!acc1Session) {
        throw new Error('No se encontró el diagnóstico del Acelerador 1')
      }

      // Call Edge Function
      const { data, error } = await supabase.functions.invoke('generate-survey-questions', {
        body: {
          instrumentData: session.session_data.instrument_design,
          accelerator1Data: acc1Session.session_data
        }
      })

      if (error) throw error

      setGeneratedData(data)
      onUpdate({ ai_analysis: data })

      toast({
        title: "Análisis completado",
        description: "Las preguntas han sido generadas exitosamente"
      })

    } catch (error) {
      console.error('Error generating questions:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
      toast({
        title: "Error en el análisis",
        description: "No se pudieron generar las preguntas. Intenta nuevamente.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const regenerateQuestions = () => {
    setGeneratedData(null)
    onUpdate({ ai_analysis: null })
    generateSurveyQuestions()
  }

  useEffect(() => {
    if (!generatedData && session.session_data.instrument_design) {
      generateSurveyQuestions()
    }
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-purple-600" />
            <div>
              <CardTitle>Análisis con Inteligencia Artificial</CardTitle>
              <CardDescription>
                Generación automática de preguntas específicas para tu evaluación diagnóstica
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <h3 className="font-semibold text-lg mb-2">Analizando con IA...</h3>
              <p className="text-muted-foreground">
                Estamos procesando tu configuración y el diagnóstico del Acelerador 1 para generar preguntas específicas.
                Este proceso puede tomar unos segundos.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-2">Error en el análisis</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <Button onClick={generateSurveyQuestions} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar análisis
              </Button>
            </div>
          )}

          {generatedData && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-800">Análisis completado exitosamente</h3>
                </div>
                <p className="text-green-700 text-sm">
                  Se han generado {generatedData.questions?.length || 0} preguntas específicas para tu evaluación diagnóstica.
                </p>
              </div>

              {/* Sample Size Recommendation */}
              {generatedData.sample_size && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recomendación de Muestra</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-800 mb-2">Muestra Recomendada</h4>
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          {generatedData.sample_size.recommended} estudiantes
                        </div>
                        <p className="text-blue-700 text-sm">Para resultados confiables</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-2">Muestra Estadística</h4>
                        <div className="text-2xl font-bold text-gray-600 mb-1">
                          {generatedData.sample_size.statistical} estudiantes
                        </div>
                        <p className="text-gray-700 text-sm">Para análisis estadístico robusto</p>
                      </div>
                    </div>
                    {generatedData.sample_size.explanation && (
                      <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                        <p className="text-amber-800 text-sm">
                          <strong>Explicación:</strong> {generatedData.sample_size.explanation}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Generated Questions Preview */}
              {generatedData.questions && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Preguntas Generadas</CardTitle>
                      <CardDescription>
                        Vista previa de las {generatedData.questions.length} preguntas para estudiantes
                      </CardDescription>
                    </div>
                    <Button onClick={regenerateQuestions} variant="outline" size="sm">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerar
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {generatedData.questions.map((question: any, index: number) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <Badge variant="outline">{question.nro}</Badge>
                            <div className="flex-1">
                              <p className="font-medium mb-2">{question.pregunta}</p>
                              <div className="flex gap-2 mb-2">
                                <Badge variant="secondary" className="text-xs">
                                  {question.tipo}
                                </Badge>
                                {question.variable && (
                                  <Badge variant="outline" className="text-xs">
                                    {question.variable}
                                  </Badge>
                                )}
                              </div>
                              {question.opciones && question.opciones.length > 0 && (
                                <div className="text-sm text-muted-foreground">
                                  <strong>Opciones:</strong> {question.opciones.slice(0, 3).join(', ')}
                                  {question.opciones.length > 3 && ` +${question.opciones.length - 3} más`}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end">
                <Button onClick={onNext}>
                  Continuar a visualización
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}