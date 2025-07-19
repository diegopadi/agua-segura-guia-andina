
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Brain, RefreshCw, CheckCircle, AlertCircle, Settings } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "@/hooks/use-toast"
import { QuestionCorrection } from "./QuestionCorrection"

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
  const [accelerator1Data, setAccelerator1Data] = useState<any>(null)
  const [correctionAttempts, setCorrectionAttempts] = useState(
    session.session_data.correction_attempts || 0
  )

  useEffect(() => {
    loadAccelerator1Data()
  }, [])

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

  const generateSurveyQuestions = async () => {
    if (!session.session_data.instrument_design) {
      toast({
        title: "Configuración incompleta",
        description: "Debes completar el diseño del instrumento primero",
        variant: "destructive"
      })
      return
    }

    if (!accelerator1Data) {
      toast({
        title: "Diagnóstico no encontrado",
        description: "No se encontró el diagnóstico del Acelerador 1. Asegúrate de haberlo completado.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('Sending data to AI:', {
        instrumentData: session.session_data.instrument_design,
        accelerator1Data: accelerator1Data
      })

      const { data, error } = await supabase.functions.invoke('generate-survey-questions', {
        body: {
          instrumentData: session.session_data.instrument_design,
          accelerator1Data: accelerator1Data
        }
      })

      if (error) throw error

      console.log('AI Response:', data)
      setGeneratedData(data)
      onUpdate({ 
        ai_analysis: data,
        correction_attempts: correctionAttempts
      })

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
    onUpdate({ 
      ai_analysis: null,
      correction_attempts: 0
    })
    setCorrectionAttempts(0)
    generateSurveyQuestions()
  }

  const handleCorrection = (correctedQuestions: any[], newAttempts: number) => {
    const updatedData = {
      ...generatedData,
      questions: correctedQuestions
    }
    setGeneratedData(updatedData)
    setCorrectionAttempts(newAttempts)
    onUpdate({ 
      ai_analysis: updatedData,
      correction_attempts: newAttempts,
      corrections_made: true
    })
  }

  // Auto-generate if configuration is ready and no previous analysis
  useEffect(() => {
    if (!generatedData && session.session_data.instrument_design && accelerator1Data && !loading) {
      generateSurveyQuestions()
    }
  }, [accelerator1Data, session.session_data.instrument_design])

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
        <CardContent className="space-y-6">
          {/* Configuration Summary */}
          {session.session_data.instrument_design && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Settings className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-800">Configuración del instrumento lista</h3>
              </div>
              <div className="space-y-2">
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div className="text-green-700">
                    <span className="font-medium">Grados escolares:</span> {
                      session.session_data.instrument_design.grados_escolares?.join(', ') || 'No especificado'
                    }
                  </div>
                  <div className="text-green-700">
                    <span className="font-medium">Estudiantes disponibles:</span> {
                      session.session_data.instrument_design.num_estudiantes_disponibles || 'No especificado'
                    }
                  </div>
                  <div className="text-green-700">
                    <span className="font-medium">Variables de interés:</span> {
                      session.session_data.instrument_design.variables_interes?.join(', ') || 'No especificado'
                    }
                  </div>
                  <div className="text-green-700">
                    <span className="font-medium">Enfoque temático:</span> {
                      session.session_data.instrument_design.enfoque_tematico || 'No especificado'
                    }
                  </div>
                </div>
              </div>
            </div>
          )}

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
                {accelerator1Data ? 'Diagnóstico del Acelerador 1 encontrado' : 'Buscando diagnóstico del Acelerador 1...'}
              </h3>
            </div>
            <p className={`text-sm ${
              accelerator1Data ? 'text-green-700' : 'text-yellow-700'
            }`}>
              {accelerator1Data 
                ? 'Se utilizará el análisis FODA y las prioridades identificadas para personalizar las preguntas'
                : 'Se necesita el diagnóstico del Acelerador 1 para generar preguntas personalizadas'
              }
            </p>
          </div>

          {/* Loading State */}
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

          {/* Error State */}
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

          {/* Manual Generate Button */}
          {!loading && !generatedData && !error && session.session_data.instrument_design && accelerator1Data && (
            <div className="text-center">
              <Button onClick={generateSurveyQuestions} size="lg">
                <Brain className="w-5 h-5 mr-2" />
                Generar preguntas con IA
              </Button>
            </div>
          )}

          {/* Generated Results */}
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
                    <CardTitle className="text-lg">Recomendación de Muestreo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-800 mb-2">Muestra Recomendada</h4>
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          {generatedData.sample_size.recommended} estudiantes
                        </div>
                        <p className="text-blue-700 text-sm">
                          {generatedData.sample_size.sampling_type === 'convenience' 
                            ? 'Muestreo por conveniencia (población completa)'
                            : 'Para resultados confiables'
                          }
                        </p>
                      </div>
                      {generatedData.sample_size.statistical && generatedData.sample_size.sampling_type !== 'convenience' && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-gray-800 mb-2">Muestra Estadística</h4>
                          <div className="text-2xl font-bold text-gray-600 mb-1">
                            {generatedData.sample_size.statistical} estudiantes
                          </div>
                          <p className="text-gray-700 text-sm">Para análisis estadístico robusto</p>
                        </div>
                      )}
                    </div>
                    {generatedData.sample_size.explanation && (
                      <div className="p-3 bg-amber-50 rounded-lg">
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

              {/* Question Correction Component */}
              <QuestionCorrection
                questions={generatedData.questions || []}
                instrumentData={session.session_data.instrument_design}
                correctionAttempts={correctionAttempts}
                onCorrection={handleCorrection}
              />

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
