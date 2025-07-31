import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight, Eye, Link2, Share, Copy, CheckCircle, RefreshCw, AlertTriangle, Users, Plus } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "@/hooks/use-toast"

interface SurveyPreviewProps {
  session: any
  onUpdate: (data: any) => void
  onNext: () => void
}

export function SurveyPreview({ session, onUpdate, onNext }: SurveyPreviewProps) {
  const { user } = useAuth()
  const [survey, setSurvey] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [generatingLinks, setGeneratingLinks] = useState(false)
  const [participantLinks, setParticipantLinks] = useState<string[]>([])
  const [numParticipants, setNumParticipants] = useState(10)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (session.session_data.survey_id) {
      loadSurvey()
    } else {
      createSurvey()
    }
  }, [])

  const createSurvey = async () => {
    setLoading(true)
    try {
      const instrumentData = session.session_data.instrument_design
      const questionsData = session.session_data.ai_analysis

      // Create survey
      const { data: surveyData, error: surveyError } = await supabase
        .from('surveys')
        .insert({
          user_id: user!.id,
          title: `Evaluación Diagnóstica - ${instrumentData.area_curricular || 'Seguridad Hídrica'}`,
          description: 'Encuesta diagnóstica para evaluar competencias iniciales en seguridad hídrica',
          settings: {
            anonymous: instrumentData.anonimato === 'Sí, completamente anónimas',
            time_limit: instrumentData.tiempo_maximo,
            target_students: instrumentData.num_estudiantes_disponibles
          },
          status: 'draft'
        })
        .select()
        .single()

      if (surveyError) throw surveyError

      // Create questions using the latest version (including corrections)
      const questionsToInsert = questionsData.questions.map((q: any, index: number) => ({
        survey_id: surveyData.id,
        question_text: q.pregunta,
        question_type: q.tipo,
        options: q.opciones || [],
        variable_name: q.variable,
        order_number: q.nro || index + 1,
        required: true
      }))

      const { error: questionsError } = await supabase
        .from('survey_questions')
        .insert(questionsToInsert)

      if (questionsError) throw questionsError

      setSurvey(surveyData)
      onUpdate({ survey_id: surveyData.id })

      toast({
        title: "Encuesta creada",
        description: "La encuesta ha sido generada exitosamente"
      })

    } catch (error) {
      console.error('Error creating survey:', error)
      toast({
        title: "Error",
        description: "No se pudo crear la encuesta",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const generateParticipantLinks = async () => {
    if (!survey) return

    setGeneratingLinks(true)
    try {
      const links = []
      
      // Generate specified number of unique participant links
      for (let i = 0; i < numParticipants; i++) {
        const { data, error } = await supabase.rpc('create_unique_participant', {
          survey_id_param: survey.id
        })

        if (error) throw error
        
        if (data && data.length > 0) {
          const participantToken = data[0].participant_token
          links.push(`${window.location.origin}/encuesta/${participantToken}`)
        }
      }

      setParticipantLinks(links)
      
      toast({
        title: "Enlaces generados",
        description: `Se han creado ${links.length} enlaces únicos para participantes`
      })
    } catch (error) {
      console.error('Error generating participant links:', error)
      toast({
        title: "Error",
        description: "No se pudieron generar los enlaces de participantes",
        variant: "destructive"
      })
    } finally {
      setGeneratingLinks(false)
    }
  }

  const updateSurveyQuestions = async () => {
    if (!survey || !session.session_data.corrections_made) return

    try {
      // Delete existing questions
      await supabase
        .from('survey_questions')
        .delete()
        .eq('survey_id', survey.id)

      // Insert updated questions
      const questionsData = session.session_data.ai_analysis
      const questionsToInsert = questionsData.questions.map((q: any, index: number) => ({
        survey_id: survey.id,
        question_text: q.pregunta,
        question_type: q.tipo,
        options: q.opciones || [],
        variable_name: q.variable,
        order_number: q.nro || index + 1,
        required: true
      }))

      const { error } = await supabase
        .from('survey_questions')
        .insert(questionsToInsert)

      if (error) throw error

      toast({
        title: "Preguntas actualizadas",
        description: "Las correcciones han sido aplicadas a la encuesta"
      })

    } catch (error) {
      console.error('Error updating questions:', error)
      toast({
        title: "Error",
        description: "No se pudieron actualizar las preguntas",
        variant: "destructive"
      })
    }
  }

  const loadSurvey = async () => {
    try {
      const { data, error } = await supabase
        .from('surveys')
        .select('*')
        .eq('id', session.session_data.survey_id)
        .single()

      if (error) throw error

      setSurvey(data)

      // Update questions if corrections were made
      if (session.session_data.corrections_made) {
        await updateSurveyQuestions()
      }
    } catch (error) {
      console.error('Error loading survey:', error)
    }
  }

  const publishSurvey = async () => {
    if (!survey) return

    try {
      // Ensure questions are up to date before publishing
      if (session.session_data.corrections_made) {
        await updateSurveyQuestions()
      }

      const { error } = await supabase
        .from('surveys')
        .update({ status: 'active' })
        .eq('id', survey.id)

      if (error) throw error

      setSurvey({ ...survey, status: 'active' })
      onUpdate({ survey_published: true })

      toast({
        title: "Encuesta publicada",
        description: "Los estudiantes ya pueden acceder a la encuesta con la versión final de las preguntas"
      })
    } catch (error) {
      console.error('Error publishing survey:', error)
      toast({
        title: "Error",
        description: "No se pudo publicar la encuesta",
        variant: "destructive"
      })
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: "Link copiado",
        description: "El enlace ha sido copiado al portapapeles"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar el enlace",
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
            <p className="text-muted-foreground">Generando encuesta...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const questions = session.session_data.ai_analysis?.questions || []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Eye className="w-8 h-8 text-green-600" />
            <div>
              <CardTitle>Vista Previa de la Encuesta</CardTitle>
              <CardDescription>
                Revisa cómo verán los estudiantes la encuesta antes de publicarla
                {session.session_data.corrections_made && " (con correcciones aplicadas)"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {survey && (
            <div className="space-y-6">
              {/* Correction Status */}
              {session.session_data.corrections_made && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-800">Correcciones aplicadas</h4>
                  </div>
                  <p className="text-blue-700 text-sm">
                    Esta encuesta incluye las correcciones que solicitaste. Las preguntas mostradas reflejan la versión final.
                  </p>
                </div>
              )}

              {/* Survey Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{survey.title}</h3>
                    <p className="text-muted-foreground">{survey.description}</p>
                  </div>
                  <Badge variant={survey.status === 'active' ? 'default' : 'secondary'}>
                    {survey.status === 'active' ? 'Publicada' : 'Borrador'}
                  </Badge>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Preguntas:</span> {questions.length}
                  </div>
                  <div>
                    <span className="font-medium">Tiempo estimado:</span> {survey.settings?.time_limit || 'No definido'}
                  </div>
                  <div>
                    <span className="font-medium">Estudiantes objetivo:</span> {survey.settings?.target_students || 'No definido'}
                  </div>
                </div>
              </div>

              {/* Participant Links Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Enlaces Únicos por Participante
                  </CardTitle>
                  <CardDescription>
                    Genera enlaces únicos para cada estudiante para garantizar datos individuales
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Link Generation Controls */}
                    <div className="flex gap-3 items-end">
                      <div className="flex-1">
                        <Label htmlFor="numParticipants">Número de participantes</Label>
                        <Input
                          id="numParticipants"
                          type="number"
                          min="1"
                          max="100"
                          value={numParticipants}
                          onChange={(e) => setNumParticipants(parseInt(e.target.value) || 10)}
                          className="w-full"
                        />
                      </div>
                      <Button 
                        onClick={generateParticipantLinks} 
                        disabled={generatingLinks}
                        className="flex items-center gap-2"
                      >
                        {generatingLinks ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                        Generar enlaces
                      </Button>
                    </div>

                    {/* Generated Links */}
                    {participantLinks.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Enlaces generados ({participantLinks.length})</h4>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              const allLinks = participantLinks.join('\n')
                              copyToClipboard(allLinks)
                            }}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copiar todos
                          </Button>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                          <div className="space-y-2">
                            {participantLinks.map((link, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <span className="font-mono text-xs bg-white px-2 py-1 rounded">
                                  {index + 1}
                                </span>
                                <code className="flex-1 bg-white px-2 py-1 rounded text-xs break-all">
                                  {link}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(link)}
                                  className="shrink-0"
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-blue-800 text-sm">
                          <p className="font-medium mb-1">Ventajas de los enlaces únicos:</p>
                          <ul className="list-disc list-inside space-y-1 text-blue-700">
                            <li>Cada estudiante tiene su propio enlace personalizado</li>
                            <li>Datos completamente separados por participante</li>
                            <li>Conteo preciso de participantes únicos</li>
                            <li>Mejor control y seguimiento individual</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    {survey.status !== 'active' && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-yellow-800 text-sm">
                          <strong>Nota:</strong> La encuesta está en borrador. Los estudiantes no podrán acceder hasta que la publiques.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Questions Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Vista Previa de Preguntas</CardTitle>
                  <CardDescription>
                    Así verán los estudiantes las preguntas de la encuesta
                    {session.session_data.corrections_made && " (versión corregida)"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6 max-h-96 overflow-y-auto">
                    {questions.slice(0, 3).map((question: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex gap-3">
                          <Badge variant="outline">{question.nro}</Badge>
                          <div className="flex-1">
                            <p className="font-medium mb-3">{question.pregunta}</p>
                            
                            {question.tipo === 'multiple_choice' && question.opciones && (
                              <div className="space-y-2">
                                {question.opciones.map((option: string, optIndex: number) => (
                                  <label key={optIndex} className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="rounded" disabled />
                                    <span className="text-sm">{option}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                            
                            {question.tipo === 'single_choice' && question.opciones && (
                              <div className="space-y-2">
                                {question.opciones.map((option: string, optIndex: number) => (
                                  <label key={optIndex} className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name={`q${question.nro}`} disabled />
                                    <span className="text-sm">{option}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                            
                            {question.tipo === 'text' && (
                              <textarea 
                                className="w-full p-2 border rounded-md resize-none" 
                                rows={3} 
                                placeholder="Los estudiantes escribirán su respuesta aquí..."
                                disabled
                              />
                            )}
                            
                            {question.tipo === 'scale' && question.opciones && (
                              <div className="flex flex-wrap gap-2">
                                {question.opciones.map((option: string, optIndex: number) => (
                                  <label key={optIndex} className="flex items-center gap-1 cursor-pointer">
                                    <input type="radio" name={`q${question.nro}`} disabled />
                                    <span className="text-sm">{option}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {questions.length > 3 && (
                      <div className="text-center py-4 bg-gray-50 rounded-lg">
                        <p className="text-muted-foreground">
                          ... y {questions.length - 3} preguntas más
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-4 justify-between">
                <div>
                  {survey.status !== 'active' && (
                    <Button onClick={publishSurvey} variant="default">
                      <Share className="w-4 h-4 mr-2" />
                      Publicar encuesta
                    </Button>
                  )}
                </div>
                
                <Button onClick={onNext} variant="outline">
                  Continuar al monitoreo
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
