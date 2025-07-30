
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, BarChart3, Users, RefreshCw, CheckCircle, Download, Trash2, AlertTriangle } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ResponseCollectionProps {
  session: any
  onUpdate: (data: any) => void
  onNext: () => void
}

export function ResponseCollection({ session, onUpdate, onNext }: ResponseCollectionProps) {
  const [survey, setSurvey] = useState<any>(null)
  const [responses, setResponses] = useState<any[]>([])
  const [participants, setParticipants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [clearingData, setClearingData] = useState(false)
  const [downloadingData, setDownloadingData] = useState(false)

  useEffect(() => {
    loadSurveyData()
    const interval = setInterval(loadResponses, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [])

  const loadSurveyData = async () => {
    try {
      const surveyId = session.session_data.survey_id
      if (!surveyId) return

      // Load survey
      const { data: surveyData, error: surveyError } = await supabase
        .from('surveys')
        .select('*')
        .eq('id', surveyId)
        .single()

      if (surveyError) throw surveyError

      setSurvey(surveyData)
      await loadResponses()
    } catch (error) {
      console.error('Error loading survey data:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de la encuesta",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadResponses = async () => {
    if (!session.session_data.survey_id) return

    setRefreshing(true)
    try {
      // Load responses
      const { data: responsesData, error: responsesError } = await supabase
        .from('survey_responses')
        .select('*')
        .eq('survey_id', session.session_data.survey_id)

      if (responsesError) throw responsesError

      // Load participants
      const { data: participantsData, error: participantsError } = await supabase
        .from('survey_participants')
        .select('*')
        .eq('survey_id', session.session_data.survey_id)

      if (participantsError) throw participantsError

      setResponses(responsesData || [])
      setParticipants(participantsData || [])

      // Update session with current stats using the correct count
      const responseTokens = new Set((responsesData || []).map(r => r.participant_token))
      const participantTokens = new Set((participantsData || []).map(p => p.participant_token))
      const uniqueCount = Math.max(responseTokens.size, participantTokens.size)
      
      onUpdate({
        response_stats: {
          total_responses: responsesData?.length || 0,
          total_participants: uniqueCount,
          last_updated: new Date().toISOString()
        }
      })

    } catch (error) {
      console.error('Error loading responses:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const clearCollectedData = async () => {
    if (!session.session_data.survey_id) return

    setClearingData(true)
    try {
      // Delete all responses and participants for this survey
      await supabase
        .from('survey_responses')
        .delete()
        .eq('survey_id', session.session_data.survey_id)

      await supabase
        .from('survey_participants')
        .delete()
        .eq('survey_id', session.session_data.survey_id)

      // Reload data
      await loadResponses()

      toast({
        title: "Datos eliminados",
        description: "Todos los datos recolectados han sido eliminados. La encuesta sigue activa."
      })
    } catch (error) {
      console.error('Error clearing data:', error)
      toast({
        title: "Error",
        description: "No se pudieron eliminar los datos",
        variant: "destructive"
      })
    } finally {
      setClearingData(false)
    }
  }

  const downloadData = async () => {
    if (!session.session_data.survey_id || responses.length === 0) return

    setDownloadingData(true)
    try {
      // Get survey questions for headers
      const { data: questions, error: questionsError } = await supabase
        .from('survey_questions')
        .select('*')
        .eq('survey_id', session.session_data.survey_id)
        .order('order_number')

      if (questionsError) throw questionsError

      // Prepare CSV data
      const csvData = []
      
      // Headers
      const headers = [
        'Participante',
        'Fecha_Respuesta',
        'Pregunta_Numero',
        'Pregunta_Texto',
        'Respuesta',
        'Variable'
      ]
      csvData.push(headers.join(','))

      // Data rows
      responses.forEach(response => {
        const question = questions?.find(q => q.id === response.question_id)
        const responseText = typeof response.response_data === 'object' 
          ? JSON.stringify(response.response_data).replace(/"/g, '""')
          : String(response.response_data || '').replace(/"/g, '""')
        
        const row = [
          `"${response.participant_token.slice(-6)}"`,
          `"${new Date(response.submitted_at).toLocaleString('es-ES')}"`,
          question?.order_number || '',
          `"${question?.question_text?.replace(/"/g, '""') || ''}"`,
          `"${responseText}"`,
          `"${question?.variable_name || ''}"`
        ]
        csvData.push(row.join(','))
      })

      // Create and download file
      const csvContent = csvData.join('\n')
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `encuesta_respuestas_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }

      toast({
        title: "Descarga completada",
        description: `Se han descargado ${responses.length} respuestas en formato CSV`
      })
    } catch (error) {
      console.error('Error downloading data:', error)
      toast({
        title: "Error",
        description: "No se pudieron descargar los datos",
        variant: "destructive"
      })
    } finally {
      setDownloadingData(false)
    }
  }

  const getUniqueParticipants = () => {
    // Count unique participants from both participants table and responses
    const responseTokens = new Set(responses.map(r => r.participant_token))
    const participantTokens = new Set(participants.map(p => p.participant_token))
    
    // Use the higher count (in case there are mismatches, we want to be accurate)
    return Math.max(responseTokens.size, participantTokens.size)
  }

  const canProceedToReport = () => {
    const minResponses = 3 // Minimum responses needed for analysis
    return getUniqueParticipants() >= minResponses
  }

  // Temporary function to create test participants
  const createTestParticipants = async () => {
    if (!session.session_data.survey_id) return

    try {
      // Get survey questions first
      const { data: questions, error: questionsError } = await supabase
        .from('survey_questions')
        .select('*')
        .eq('survey_id', session.session_data.survey_id)
        .order('order_number')

      if (questionsError) throw questionsError

      // Create 5 test participants
      for (let i = 1; i <= 5; i++) {
        const participantToken = crypto.randomUUID()
        
        // Create participant record
        const { error: participantError } = await supabase
          .from('survey_participants')
          .insert({
            survey_id: session.session_data.survey_id,
            participant_token: participantToken,
            status: 'completed',
            completed_at: new Date().toISOString()
          })

        if (participantError) {
          console.error('Error creating test participant:', participantError)
          continue
        }

        // Create responses for each question
        const responseRecords = questions.map(question => ({
          survey_id: session.session_data.survey_id,
          question_id: question.id,
          participant_token: participantToken,
          response_data: `Test Response ${i} for Question ${question.order_number}`
        }))

        const { error: responseError } = await supabase
          .from('survey_responses')
          .insert(responseRecords)

        if (responseError) {
          console.error('Error creating test responses:', responseError)
        }
      }

      toast({
        title: "Datos de prueba creados",
        description: "Se han creado 5 participantes de prueba"
      })

      // Reload data
      await loadResponses()
    } catch (error) {
      console.error('Error creating test data:', error)
      toast({
        title: "Error",
        description: "No se pudieron crear los datos de prueba",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando datos de monitoreo...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const uniqueParticipants = getUniqueParticipants()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-purple-600" />
              <div>
                <CardTitle>Monitoreo de Respuestas</CardTitle>
                <CardDescription>
                  Seguimiento en tiempo real de la participación de estudiantes
                </CardDescription>
              </div>
            </div>
            <Button onClick={loadResponses} variant="outline" size="sm" disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {survey?.status !== 'active' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800 text-sm">
                <strong>Nota:</strong> La encuesta aún no está publicada. Los estudiantes no pueden acceder.
              </p>
            </div>
          )}

          {/* Simplified Stats - Only Participants */}
          <div className="grid md:grid-cols-1 gap-4 mb-6 max-w-sm">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600">{uniqueParticipants}</div>
                  <p className="text-lg text-muted-foreground">Participantes</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Management Actions */}
          <div className="flex flex-wrap gap-3 mb-6">
            <Button 
              onClick={downloadData}
              variant="outline"
              disabled={responses.length === 0 || downloadingData}
              className="flex items-center gap-2"
            >
              {downloadingData ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              ) : (
                <Download className="w-4 h-4" />
              )}
              Descargar datos
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline"
                  disabled={responses.length === 0 || clearingData}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                >
                  {clearingData ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Borrar datos recolectados
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    ¿Eliminar todos los datos?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción eliminará permanentemente todas las respuestas recolectadas 
                    ({responses.length} respuestas de {uniqueParticipants} participantes). 
                    La encuesta permanecerá activa, pero se perderán todos los datos actuales.
                    <br /><br />
                    <strong>Esta acción no se puede deshacer.</strong>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={clearCollectedData}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Sí, eliminar datos
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Temporary test button - remove in production */}
            <Button 
              onClick={createTestParticipants}
              variant="outline"
              className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
            >
              <Users className="w-4 h-4" />
              Crear 5 participantes de prueba
            </Button>
          </div>

          {/* Survey Link */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Enlace de la Encuesta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-3 rounded font-mono text-sm break-all">
                {`${window.location.origin}/encuesta/${session.session_data.survey_token}`}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          {responses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actividad Reciente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-40 overflow-y-auto">
                  {responses
                    .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
                    .slice(0, 10)
                    .map((response, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div className="flex items-center gap-3">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            Participante #{response.participant_token.slice(-6)}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(response.submitted_at).toLocaleString()}
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No responses yet */}
          {responses.length === 0 && survey?.status === 'active' && (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-600 mb-2">Esperando respuestas</h3>
              <p className="text-gray-500 text-sm">
                Comparte el enlace de la encuesta con tus estudiantes para comenzar a recibir respuestas.
              </p>
            </div>
          )}

          {/* Proceed to report */}
          {canProceedToReport() && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-800">Datos suficientes para análisis</h3>
                    <p className="text-green-700 text-sm">
                      Ya tienes suficientes respuestas para generar el informe diagnóstico
                    </p>
                  </div>
                </div>
                <Button onClick={onNext}>
                  Generar informe
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {!canProceedToReport() && responses.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <p className="text-blue-800 text-sm">
                <strong>Nota:</strong> Se necesitan al menos 3 respuestas únicas para generar un análisis confiable. 
                Actualmente tienes {uniqueParticipants} participantes.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
