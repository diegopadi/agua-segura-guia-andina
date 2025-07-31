import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { User, Calendar, MessageSquare } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "@/hooks/use-toast"

interface Question {
  id: string
  question_text: string
  question_type: string
  order_number: number
  variable_name?: string
}

interface Response {
  id: string
  question_id: string
  response_data: any
  submitted_at: string
}

interface ParticipantResponseModalProps {
  surveyId: string
  participantToken: string
  onClose: () => void
}

export function ParticipantResponseModal({ 
  surveyId, 
  participantToken, 
  onClose 
}: ParticipantResponseModalProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [responses, setResponses] = useState<Response[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadParticipantData()
  }, [surveyId, participantToken])

  const loadParticipantData = async () => {
    try {
      setLoading(true)
      
      // Load questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('survey_questions')
        .select('*')
        .eq('survey_id', surveyId)
        .order('order_number')

      if (questionsError) throw questionsError

      // Load responses for this participant
      const { data: responsesData, error: responsesError } = await supabase
        .from('survey_responses')
        .select('*')
        .eq('survey_id', surveyId)
        .eq('participant_token', participantToken)

      if (responsesError) throw responsesError

      setQuestions(questionsData || [])
      setResponses(responsesData || [])
    } catch (error) {
      console.error('Error loading participant data:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las respuestas del participante",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getResponseForQuestion = (questionId: string) => {
    return responses.find(r => r.question_id === questionId)
  }

  const formatResponse = (response: any, questionType: string) => {
    if (!response) return "Sin respuesta"
    
    if (Array.isArray(response)) {
      return response.join(", ")
    }
    
    if (typeof response === 'object') {
      return JSON.stringify(response)
    }
    
    return String(response)
  }

  const getQuestionTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'single_choice': 'Opción única',
      'multiple_choice': 'Opción múltiple',
      'text': 'Texto libre',
      'number': 'Número',
      'scale': 'Escala',
      'yes_no': 'Sí/No'
    }
    return types[type] || type
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const submissionDate = responses.length > 0 ? 
    new Date(Math.max(...responses.map(r => new Date(r.submitted_at).getTime()))) : 
    null

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Respuestas del Participante #{participantToken.slice(-6)}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              {responses.length} respuestas de {questions.length} preguntas
            </span>
            {submissionDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(submissionDate.toISOString())}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando respuestas...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => {
                const response = getResponseForQuestion(question.id)
                
                return (
                  <Card key={question.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-base flex items-start gap-2">
                            <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center mt-0.5">
                              {question.order_number}
                            </span>
                            <span>{question.question_text}</span>
                          </CardTitle>
                          
                          <CardDescription className="flex items-center gap-4 mt-2">
                            <Badge variant="outline">
                              {getQuestionTypeLabel(question.question_type)}
                            </Badge>
                            {question.variable_name && (
                              <span className="text-xs text-muted-foreground">
                                Variable: {question.variable_name}
                              </span>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="bg-muted/30 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium mb-1">Respuesta:</p>
                            <p className="text-sm text-muted-foreground">
                              {response ? 
                                formatResponse(response.response_data, question.question_type) : 
                                "Sin respuesta"
                              }
                            </p>
                            {response && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Respondido: {formatDate(response.submitted_at)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              
              {questions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No se encontraron preguntas para esta encuesta</p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}