import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Brain, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "@/hooks/use-toast"


interface SurveyResultsReportProps {
  session: any
  onUpdate: (data: any) => void
}

export function SurveyResultsReport({ session, onUpdate }: SurveyResultsReportProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState(session.session_data.survey_report || null)
  const [responses, setResponses] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadResponses()
  }, [])

  const loadResponses = async () => {
    try {
      const { data, error } = await supabase
        .from('survey_responses')
        .select('*')
        if (!session.session_data.survey_id) return

      if (error) throw error

      setResponses(data || [])
    } catch (error) {
      console.error('Error loading responses:', error)
    }
  }

  const generateReport = async () => {
    setLoading(true)
    setError(null)

    try {
      // Get profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single()

      // Get survey data with questions
      const { data: survey } = await supabase
        .from('surveys')
        .select(`
          *,
          survey_questions (*)
        `)
        .eq('id', session.session_data.survey_id)
        .single()

      // Call Edge Function to generate report
      const { data, error } = await supabase.functions.invoke('generate-survey-report', {
        body: {
          surveyData: {
            survey,
            questions: survey?.survey_questions || [],
            settings: session.session_data.ai_analysis
          },
          responses: responses,
          profileData: profile
        }
      })

      if (error) throw error

      setReportData(data.report)
      onUpdate({ 
        survey_report: data.report,
        report_generated_at: new Date().toISOString(),
        status: 'completed'
      })

      // Mark session as completed
      await supabase
        .from('acelerador_sessions')
        .update({ status: 'completed' })
        .eq('id', session.id)

      toast({
        title: "Informe generado",
        description: "El análisis diagnóstico ha sido completado exitosamente"
      })

    } catch (error) {
      console.error('Error generating report:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
      toast({
        title: "Error en el análisis",
        description: "No se pudo generar el informe. Intenta nuevamente.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const regenerateReport = () => {
    setReportData(null)
    onUpdate({ survey_report: null })
    generateReport()
  }

  const downloadReport = async () => {
    if (!reportData) return

    try {
      // Create a simple text version of the report for download
      let reportText = `INFORME DE EVALUACIÓN DIAGNÓSTICA
======================================

${reportData.portada?.titulo || 'Evaluación Diagnóstica'}
${reportData.portada?.resumen_ejecutivo || ''}

METODOLOGÍA
-----------
${reportData.metodologia?.descripcion_instrumento || ''}

RESULTADOS DESCRIPTIVOS
-----------------------
`

      if (reportData.resultados_descriptivos?.variables) {
        reportData.resultados_descriptivos.variables.forEach((variable: any) => {
          reportText += `\n${variable.variable}: ${variable.analisis}\n`
        })
      }

      reportText += `\nANÁLISIS DE BRECHAS
-------------------
Fortalezas:
${reportData.analisis_brechas?.fortalezas?.map((f: string) => `- ${f}`).join('\n') || ''}

Áreas de mejora:
${reportData.analisis_brechas?.areas_mejora?.map((a: string) => `- ${a}`).join('\n') || ''}

RECOMENDACIONES PEDAGÓGICAS
---------------------------
${reportData.recomendaciones_pedagogicas?.estrategias?.map((e: string) => `- ${e}`).join('\n') || ''}
`

      // Create and download file
      const blob = new Blob([reportText], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `informe-diagnostico-acelerador2-${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Informe descargado",
        description: "El informe ha sido descargado exitosamente"
      })

    } catch (error) {
      console.error('Error downloading report:', error)
      toast({
        title: "Error",
        description: "No se pudo descargar el informe",
        variant: "destructive"
      })
    }
  }

  const uniqueParticipants = new Set(responses.map(r => r.participant_token)).size

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-green-600" />
            <div>
              <CardTitle>Informe de Resultados</CardTitle>
              <CardDescription>
                Análisis diagnóstico completo con recomendaciones pedagógicas
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Survey Summary */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Respuestas recolectadas:</span> {responses.length}
              </div>
              <div>
                <span className="font-medium">Participantes únicos:</span> {uniqueParticipants}
              </div>
              <div>
                <span className="font-medium">Preguntas analizadas:</span> {session.session_data.ai_analysis?.questions?.length || 0}
              </div>
            </div>
          </div>

          {/* Insufficient data warning */}
          {uniqueParticipants < 3 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
                <div>
                  <h3 className="font-semibold text-yellow-800">Datos insuficientes</h3>
                  <p className="text-yellow-700 text-sm">
                    Se recomienda tener al menos 3 participantes para un análisis confiable. 
                    El informe puede generar conclusiones limitadas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Generate Report */}
          {!reportData && (
            <div className="text-center py-8">
              {loading ? (
                <div>
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <h3 className="font-semibold text-lg mb-2">Generando informe con IA...</h3>
                  <p className="text-muted-foreground">
                    Analizando las respuestas y generando recomendaciones pedagógicas personalizadas.
                    Este proceso puede tomar hasta 2 minutos.
                  </p>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <h3 className="font-semibold text-red-800 mb-2">Error en la generación</h3>
                  <p className="text-red-700 mb-4">{error}</p>
                  <Button onClick={generateReport} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reintentar generación
                  </Button>
                </div>
              ) : (
                <div>
                  <Brain className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Listo para generar informe</h3>
                  <p className="text-muted-foreground mb-6">
                    Se analizarán {responses.length} respuestas de {uniqueParticipants} participantes
                  </p>
                  <Button onClick={generateReport} size="lg">
                    <Brain className="w-5 h-5 mr-2" />
                    Generar informe con IA
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Generated Report */}
          {reportData && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <h3 className="font-semibold text-green-800">Informe generado exitosamente</h3>
                      <p className="text-green-700 text-sm">
                        Análisis completo con recomendaciones pedagógicas específicas
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={regenerateReport} variant="outline" size="sm">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerar
                    </Button>
                    <Button onClick={downloadReport} size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Descargar
                    </Button>
                  </div>
                </div>
              </div>

              {/* Report Viewer */}
              <Card>
                <CardHeader>
                  <CardTitle>Informe Diagnóstico</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <h3>{reportData.portada?.titulo}</h3>
                    <p>{reportData.portada?.resumen_ejecutivo}</p>
                    {/* Report content display - can be enhanced later */}
                  </div>
                </CardContent>
              </Card>

              {/* Completion Badge */}
              <div className="text-center py-6">
                <Badge variant="default" className="text-lg px-6 py-2">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Acelerador 2 Completado
                </Badge>
                <p className="text-muted-foreground mt-2">
                  ¡Felicidades! Has completado exitosamente la evaluación diagnóstica
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}