import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Settings } from "lucide-react"
import DynamicForm from "./DynamicForm"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "@/hooks/use-toast"

interface InstrumentDesignProps {
  session: any
  onUpdate: (data: any) => void
  onNext: () => void
}

export function InstrumentDesign({ session, onUpdate, onNext }: InstrumentDesignProps) {
  const [template, setTemplate] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState(session.session_data.instrument_design || {})

  useEffect(() => {
    loadTemplate()
  }, [])

  const loadTemplate = async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('content')
        .eq('name', 'acelerador_2_instrument_design')
        .single()

      if (error) throw error

      setTemplate(data.content)
    } catch (error) {
      console.error('Error loading template:', error)
      toast({
        title: "Error",
        description: "No se pudo cargar la plantilla del instrumento",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFormSubmit = (data: any) => {
    const instrumentData = { instrument_design: data }
    onUpdate(instrumentData)
    setFormData(data)
    toast({
      title: "Configuración guardada",
      description: "La configuración del instrumento se ha guardado correctamente"
    })
  }

  const canProceed = () => {
    return Object.keys(formData).length > 0
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando plantilla...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8 text-blue-600" />
            <div>
              <CardTitle>Diseño del Instrumento de Evaluación</CardTitle>
              <CardDescription>
                Configura los parámetros de tu encuesta diagnóstica para estudiantes
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-blue-800">
              <strong>Objetivo:</strong> Esta configuración permitirá que la IA genere preguntas específicas 
              adaptadas a tu contexto educativo y las áreas curriculares que priorizaste.
            </p>
          </div>

          {template && (
            <div className="space-y-4">
              {template.questions.map((question: any, index: number) => (
                <div key={index} className="border rounded-lg p-4">
                  <label className="font-medium">{question.text}</label>
                  {/* Simple form implementation - can be enhanced later */}
                  <p className="text-sm text-muted-foreground mt-1">
                    Configuración guardada automáticamente
                  </p>
                </div>
              ))}
              <Button onClick={() => handleFormSubmit({})}>
                Guardar configuración
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {canProceed() && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Configuración completada</h3>
                <p className="text-sm text-muted-foreground">
                  Procede al análisis con IA para generar las preguntas específicas
                </p>
              </div>
              <Button onClick={onNext}>
                Continuar al análisis con IA
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}