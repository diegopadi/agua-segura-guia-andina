import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Users, Eye, Trash2, Calendar, CheckSquare } from "lucide-react"
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
import { ParticipantResponseModal } from "./ParticipantResponseModal"

interface Participant {
  id: string
  participant_token: string
  started_at: string
  completed_at: string
  status: string
}

interface ParticipantListProps {
  surveyId: string
  onUpdate: () => void
}

export function ParticipantList({ surveyId, onUpdate }: ParticipantListProps) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null)

  useEffect(() => {
    loadParticipants()
  }, [surveyId])

  const loadParticipants = async () => {
    try {
      setLoading(true)
      
      // Load participants from survey_participants table
      const { data: participantsData, error: participantsError } = await supabase
        .from('survey_participants')
        .select('*')
        .eq('survey_id', surveyId)
        .order('completed_at', { ascending: false })

      if (participantsError) throw participantsError

      // Also get unique participants from responses in case some are missing from participants table
      const { data: responsesData, error: responsesError } = await supabase
        .from('survey_responses')
        .select('participant_token, submitted_at')
        .eq('survey_id', surveyId)

      if (responsesError) throw responsesError

      // Combine both sources and create unique participant list
      const participantTokens = new Set(participantsData?.map(p => p.participant_token) || [])
      const responseTokens = new Map<string, string>()
      
      responsesData?.forEach(r => {
        if (!participantTokens.has(r.participant_token)) {
          responseTokens.set(r.participant_token, r.submitted_at)
        }
      })

      // Create complete participant list
      const allParticipants: Participant[] = [
        ...(participantsData || []),
        ...Array.from(responseTokens.entries()).map(([token, submitted_at]) => ({
          id: token,
          participant_token: token,
          started_at: submitted_at,
          completed_at: submitted_at,
          status: 'completed'
        }))
      ]

      setParticipants(allParticipants)
    } catch (error) {
      console.error('Error loading participants:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los participantes",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleParticipantSelection = (participantId: string) => {
    const newSelection = new Set(selectedParticipants)
    if (newSelection.has(participantId)) {
      newSelection.delete(participantId)
    } else {
      newSelection.add(participantId)
    }
    setSelectedParticipants(newSelection)
  }

  const selectAllParticipants = () => {
    if (selectedParticipants.size === participants.length) {
      setSelectedParticipants(new Set())
    } else {
      setSelectedParticipants(new Set(participants.map(p => p.id)))
    }
  }

  const deleteSelectedParticipants = async () => {
    if (selectedParticipants.size === 0) return

    setDeleting(true)
    try {
      const tokenList = Array.from(selectedParticipants).map(id => {
        const participant = participants.find(p => p.id === id)
        return participant?.participant_token
      }).filter(Boolean)

      // Delete from both tables
      await supabase
        .from('survey_responses')
        .delete()
        .eq('survey_id', surveyId)
        .in('participant_token', tokenList)

      await supabase
        .from('survey_participants')
        .delete()
        .eq('survey_id', surveyId)
        .in('participant_token', tokenList)

      setSelectedParticipants(new Set())
      await loadParticipants()
      onUpdate() // Update parent component

      toast({
        title: "Participantes eliminados",
        description: `Se eliminaron ${selectedParticipants.size} participantes y sus respuestas`
      })
    } catch (error) {
      console.error('Error deleting participants:', error)
      toast({
        title: "Error",
        description: "No se pudieron eliminar los participantes",
        variant: "destructive"
      })
    } finally {
      setDeleting(false)
    }
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

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center min-h-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Cargando participantes...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-blue-600" />
              <div>
                <CardTitle>Lista de Participantes</CardTitle>
                <CardDescription>
                  {participants.length} participantes registrados
                </CardDescription>
              </div>
            </div>
            
            {participants.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllParticipants}
                >
                  <CheckSquare className="w-4 h-4 mr-2" />
                  {selectedParticipants.size === participants.length ? 'Deseleccionar' : 'Seleccionar'} todo
                </Button>
                
                {selectedParticipants.size > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={deleting}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar ({selectedParticipants.size})
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar participantes seleccionados?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción eliminará permanentemente {selectedParticipants.size} participante(s) 
                          y todas sus respuestas. Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={deleteSelectedParticipants}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {participants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay participantes registrados aún</p>
            </div>
          ) : (
            <div className="space-y-3">
              {participants.map((participant) => (
                <div 
                  key={participant.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedParticipants.has(participant.id)}
                      onCheckedChange={() => toggleParticipantSelection(participant.id)}
                    />
                    
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            Participante #{participant.participant_token.slice(-6)}
                          </span>
                          <Badge variant={participant.status === 'completed' ? 'default' : 'secondary'}>
                            {participant.status === 'completed' ? 'Completado' : 'En progreso'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <Calendar className="w-3 h-3" />
                          {participant.completed_at ? 
                            `Completado: ${formatDate(participant.completed_at)}` :
                            `Iniciado: ${formatDate(participant.started_at)}`
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedParticipant(participant.participant_token)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver respuestas
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedParticipant && (
        <ParticipantResponseModal
          surveyId={surveyId}
          participantToken={selectedParticipant}
          onClose={() => setSelectedParticipant(null)}
        />
      )}
    </>
  )
}