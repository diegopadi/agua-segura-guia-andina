import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, BarChart3, Users, RefreshCw, CheckCircle } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "@/hooks/use-toast"

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

      // Update session with current stats
      onUpdate({
        response_stats: {
          total_responses: responsesData?.length || 0,
          total_participants: participantsData?.length || 0,
          last_updated: new Date().toISOString()
        }
      })

    } catch (error) {
      console.error('Error loading responses:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const getUniqueParticipants = () => {
    const uniqueTokens = new Set(responses.map(r => r.participant_token))
    return uniqueTokens.size
  }

  const getCompletionRate = () => {
    const questionsCount = session.session_data.ai_analysis?.questions?.length || 1
    const completedParticipants = participants.filter(p => p.completed_at).length
    return completedParticipants
  }

  const canProceedToReport = () => {
    const minResponses = 3 // Minimum responses needed for analysis
    return getUniqueParticipants() >= minResponses
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

  const targetStudents = survey?.settings?.target_students || 'No definido'
  const uniqueParticipants = getUniqueParticipants()
  const completedParticipants = getCompletionRate()

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

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{uniqueParticipants}</div>
                  <p className="text-sm text-muted-foreground">Participantes únicos</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{completedParticipants}</div>
                  <p className="text-sm text-muted-foreground">Encuestas completadas</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{responses.length}</div>
                  <p className="text-sm text-muted-foreground">Total respuestas</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-600">{targetStudents}</div>
                  <p className="text-sm text-muted-foreground">Estudiantes objetivo</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress towards target */}
          {typeof targetStudents === 'number' && (
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span>Progreso hacia meta</span>
                <span>{Math.round((uniqueParticipants / targetStudents) * 100)}%</span>
              </div>
              <Progress value={(uniqueParticipants / targetStudents) * 100} className="h-2" />
            </div>
          )}

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