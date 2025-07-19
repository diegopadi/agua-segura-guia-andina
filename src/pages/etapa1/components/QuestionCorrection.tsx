
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Edit3, Key, RefreshCw } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "@/hooks/use-toast"

interface QuestionCorrectionProps {
  questions: any[]
  instrumentData: any
  correctionAttempts: number
  onCorrection: (correctedQuestions: any[], newAttempts: number) => void
}

export function QuestionCorrection({ 
  questions, 
  instrumentData, 
  correctionAttempts, 
  onCorrection 
}: QuestionCorrectionProps) {
  const [correctionRequest, setCorrectionRequest] = useState('')
  const [masterKey, setMasterKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [showKeyInput, setShowKeyInput] = useState(false)

  const canCorrect = correctionAttempts < 1
  const hasUsedFreeCorrection = correctionAttempts >= 1

  const resetAttempts = () => {
    if (masterKey === 'AguaSegura2025') {
      onCorrection(questions, 0)
      setMasterKey('')
      setShowKeyInput(false)
      toast({
        title: "Contador reiniciado",
        description: "Puedes hacer correcciones nuevamente"
      })
    } else {
      toast({
        title: "Clave incorrecta",
        description: "La clave maestra no es válida",
        variant: "destructive"
      })
    }
  }

  const submitCorrection = async () => {
    if (!correctionRequest.trim()) {
      toast({
        title: "Solicitud vacía",
        description: "Por favor, describe qué cambios necesitas",
        variant: "destructive"
      })
      return
    }

    if (!canCorrect && masterKey !== 'AguaSegura2025') {
      toast({
        title: "Límite alcanzado",
        description: "Has usado tu corrección gratuita. Ingresa la clave maestra para continuar.",
        variant: "destructive"
      })
      setShowKeyInput(true)
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.functions.invoke('correct-survey-questions', {
        body: {
          originalQuestions: questions,
          correctionRequest: correctionRequest,
          instrumentData: instrumentData
        }
      })

      if (error) throw error

      onCorrection(data.questions, correctionAttempts + 1)
      setCorrectionRequest('')
      setMasterKey('')
      setShowKeyInput(false)

      toast({
        title: "Preguntas corregidas",
        description: `Se aplicaron las siguientes correcciones: ${data.corrections_applied?.join(', ') || 'Correcciones aplicadas'}`
      })

    } catch (error) {
      console.error('Error correcting questions:', error)
      toast({
        title: "Error en la corrección",
        description: "No se pudieron aplicar las correcciones. Intenta nuevamente.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Edit3 className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">Solicitar Correcciones</CardTitle>
          </div>
          <div className="flex gap-2">
            <Badge variant={canCorrect ? "default" : "secondary"}>
              {canCorrect ? "1 corrección disponible" : "Correcciones agotadas"}
            </Badge>
            {hasUsedFreeCorrection && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowKeyInput(!showKeyInput)}
              >
                <Key className="w-4 h-4 mr-2" />
                Clave maestra
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasUsedFreeCorrection && !canCorrect && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h4 className="font-semibold text-amber-800">Límite de correcciones alcanzado</h4>
            </div>
            <p className="text-amber-700 text-sm">
              Has usado tu corrección gratuita. Para hacer más correcciones, necesitas ingresar la clave maestra.
            </p>
          </div>
        )}

        {showKeyInput && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <Label htmlFor="master-key" className="text-sm font-medium">
              Clave maestra para correcciones adicionales
            </Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="master-key"
                type="password"
                placeholder="Ingresa la clave maestra"
                value={masterKey}
                onChange={(e) => setMasterKey(e.target.value)}
              />
              <Button onClick={resetAttempts} variant="outline">
                Validar
              </Button>
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="correction-request" className="text-sm font-medium">
            Describe los cambios que necesitas en las preguntas
          </Label>
          <Textarea
            id="correction-request"
            placeholder="Ejemplo: La pregunta 3 debería enfocarse más en el acceso al agua potable en lugar de saneamiento. La pregunta 7 necesita opciones más específicas para el contexto rural..."
            value={correctionRequest}
            onChange={(e) => setCorrectionRequest(e.target.value)}
            rows={4}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Sé específico sobre qué preguntas cambiar y cómo. Esto ayudará a la IA a hacer correcciones precisas.
          </p>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={submitCorrection}
            disabled={loading || (!canCorrect && masterKey !== 'AguaSegura2025')}
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Aplicando correcciones...
              </>
            ) : (
              <>
                <Edit3 className="w-4 h-4 mr-2" />
                Corregir preguntas
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
