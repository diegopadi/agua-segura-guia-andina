
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Brain, RefreshCw, CheckCircle, AlertCircle } from "lucide-react"
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
  const [generatedData, setGeneratedData] = useState(session.session_data.final_report || null)
  const [error, setError] = useState<string | null>(null)
  const [accelerator1Data, setAccelerator1Data] = useState<any>(null)

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

  const generateReport = async () => {
    if (!session.session_data.teacher_responses) {
      setError('No hay respuestas del docente disponibles para generar el informe');
      return;
    }

    if (!accelerator1Data) {
      setError('No se encontraron datos del Acelerador 1. Es necesario completar el Acelerador 1 primero.');
      return;
    }

    // Check Accelerator 1 data completeness
    const completeness = accelerator1Data.completeness_analysis?.overall_completeness || 0;
    if (completeness < 50) {
      setError(`Los datos del Acelerador 1 están incompletos (${completeness}%). Es necesario completar al menos el 50% del Acelerador 1 antes de generar el informe.`);
      return;
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.functions.invoke('generate-acelerador2-report', {
        body: {
          accelerator1Data: accelerator1Data,
          teacherResponses: session.session_data.teacher_responses
        }
      })

      if (error) throw error

      setGeneratedData(data)
      onUpdate({ 
        ai_analysis: { report_generated: true },
        final_report: data
      })

      toast({
        title: "Informe generado",
        description: "El informe diagnóstico ha sido creado exitosamente"
      })

    } catch (error) {
      console.error('Error generating report:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setError(errorMessage)
      
      // Show specific error guidance based on the error type
      if (errorMessage.includes('incompletos')) {
        toast({
          title: "Datos insuficientes",
          description: "Por favor, regrese al Acelerador 1 para completar más información.",
          variant: "destructive"
        })
      } else if (errorMessage.includes('formato JSON')) {
        toast({
          title: "Error de procesamiento",
          description: "Error en el procesamiento del informe. Intente regenerar el informe.",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Error en el análisis",
          description: "No se pudo generar el informe. Intenta nuevamente.",
          variant: "destructive"
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const regenerateReport = () => {
    setGeneratedData(null)
    onUpdate({ 
      ai_analysis: null,
      final_report: null
    })
    generateReport()
  }

  // Auto-generate if teacher responses are ready and no previous report
  useEffect(() => {
    if (!generatedData && session.session_data.teacher_responses && accelerator1Data && !loading) {
      generateReport()
    }
  }, [accelerator1Data, session.session_data.teacher_responses])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-purple-600" />
            <div>
              <CardTitle>Análisis con Inteligencia Artificial</CardTitle>
              <CardDescription>
                Generación automática del informe diagnóstico personalizado
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Teacher Responses Summary */}
          {session.session_data.teacher_responses && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-800">Respuestas del docente completadas</h3>
              </div>
              <div className="space-y-2">
                <p className="text-green-700 text-sm">
                  Se han registrado {Object.keys(session.session_data.teacher_responses).length} respuestas sobre las características de los estudiantes.
                </p>
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {Object.entries(session.session_data.teacher_responses).map(([key, value], index) => (
                    <div
                      key={key}
                      className={`h-2 rounded-full ${
                        (value as string).length >= 10 ? 'bg-green-500' : 'bg-yellow-400'
                      }`}
                      title={`Respuesta ${index + 1}: ${(value as string).length} caracteres`}
                    />
                  ))}
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
                ? 'Se utilizará el análisis FODA y las prioridades identificadas para generar el informe'
                : 'Se necesita el diagnóstico del Acelerador 1 para generar el informe personalizado'
              }
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <div className="text-center">
                <p className="text-muted-foreground">Generando informe diagnóstico...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Analizando datos del Acelerador 1 y respuestas del docente
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-2">Error al generar el informe</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    setError(null);
                    generateReport();
                  }}
                  variant="outline" 
                  size="sm"
                  disabled={loading}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Intentar de nuevo
                </Button>
                {error.includes('incompletos') && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.location.href = '/etapa1/acelerador1'}
                  >
                    Ir al Acelerador 1
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Manual Generate Button */}
          {!loading && !generatedData && !error && session.session_data.teacher_responses && accelerator1Data && (
            <div className="text-center">
              <Button onClick={generateReport} size="lg">
                <Brain className="w-5 h-5 mr-2" />
                Generar informe con IA
              </Button>
            </div>
          )}

          {/* Generated Results */}
          {generatedData && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-800">Informe generado exitosamente</h3>
                </div>
                <p className="text-green-700 text-sm">
                  Se ha creado el informe diagnóstico personalizado basado en tus respuestas y el análisis del Acelerador 1.
                </p>
              </div>

              {/* Report Preview */}
              {generatedData.html_content && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Vista previa del informe</CardTitle>
                      <CardDescription>
                        Informe diagnóstico generado basado en las respuestas del docente
                      </CardDescription>
                    </div>
                    <Button onClick={regenerateReport} variant="outline" size="sm">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerar
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                      <div 
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: generatedData.html_content.substring(0, 1000) + '...' }}
                      />
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground">
                          Vista previa recortada. El informe completo estará disponible en el siguiente paso.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end">
                <Button onClick={onNext}>
                  Ver informe completo
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
