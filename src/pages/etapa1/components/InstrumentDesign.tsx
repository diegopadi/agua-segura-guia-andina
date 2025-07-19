
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowRight, Settings, CheckCircle2 } from "lucide-react"
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
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState(session.session_data.instrument_design || {})
  const [validationErrors, setValidationErrors] = useState<string[]>([])

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

  const handleInputChange = (questionKey: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [questionKey]: value
    }))
  }

  const validateForm = () => {
    const errors: string[] = []
    
    if (!template?.questions) return errors

    template.questions.forEach((question: any) => {
      if (question.required && !formData[question.key]) {
        errors.push(`${question.text} es obligatorio`)
      }
    })

    return errors
  }

  const handleFormSubmit = async () => {
    const errors = validateForm()
    setValidationErrors(errors)

    if (errors.length > 0) {
      toast({
        title: "Formulario incompleto",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive"
      })
      return
    }

    setSaving(true)
    try {
      const instrumentData = { instrument_design: formData }
      onUpdate(instrumentData)
      
      toast({
        title: "Configuración guardada",
        description: "La configuración del instrumento se ha guardado correctamente"
      })
    } catch (error) {
      console.error('Error saving form:', error)
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const renderFormField = (question: any) => {
    const { key, text, type, options, required } = question

    switch (type) {
      case 'multiple_choice':
        return (
          <div key={key} className="space-y-3">
            <Label className="text-base font-medium">
              {text} {required && <span className="text-red-500">*</span>}
            </Label>
            <div className="space-y-2">
              {options?.map((option: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${key}-${index}`}
                    checked={Array.isArray(formData[key]) ? formData[key].includes(option) : false}
                    onCheckedChange={(checked) => {
                      const currentValues = Array.isArray(formData[key]) ? formData[key] : []
                      if (checked) {
                        handleInputChange(key, [...currentValues, option])
                      } else {
                        handleInputChange(key, currentValues.filter((v: string) => v !== option))
                      }
                    }}
                  />
                  <Label htmlFor={`${key}-${index}`} className="text-sm">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )

      case 'single_choice':
        return (
          <div key={key} className="space-y-3">
            <Label className="text-base font-medium">
              {text} {required && <span className="text-red-500">*</span>}
            </Label>
            <RadioGroup
              value={formData[key] || ''}
              onValueChange={(value) => handleInputChange(key, value)}
            >
              {options?.map((option: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${key}-${index}`} />
                  <Label htmlFor={`${key}-${index}`} className="text-sm">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )

      case 'select':
        return (
          <div key={key} className="space-y-3">
            <Label className="text-base font-medium">
              {text} {required && <span className="text-red-500">*</span>}
            </Label>
            <Select
              value={formData[key] || ''}
              onValueChange={(value) => handleInputChange(key, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una opción" />
              </SelectTrigger>
              <SelectContent>
                {options?.map((option: string, index: number) => (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case 'number':
        return (
          <div key={key} className="space-y-3">
            <Label className="text-base font-medium">
              {text} {required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              type="number"
              value={formData[key] || ''}
              onChange={(e) => handleInputChange(key, parseInt(e.target.value) || '')}
              placeholder="Ingresa un número"
            />
          </div>
        )

      case 'text':
        return (
          <div key={key} className="space-y-3">
            <Label className="text-base font-medium">
              {text} {required && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              value={formData[key] || ''}
              onChange={(e) => handleInputChange(key, e.target.value)}
              placeholder="Escribe tu respuesta aquí..."
              rows={3}
            />
          </div>
        )

      default:
        return (
          <div key={key} className="space-y-3">
            <Label className="text-base font-medium">
              {text} {required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              value={formData[key] || ''}
              onChange={(e) => handleInputChange(key, e.target.value)}
              placeholder="Ingresa tu respuesta"
            />
          </div>
        )
    }
  }

  const canProceed = () => {
    return Object.keys(formData).length > 0 && validateForm().length === 0
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
            <div className="space-y-6">
              {template.questions?.map((question: any) => (
                <div key={question.key} className="border rounded-lg p-4 bg-gray-50">
                  {renderFormField(question)}
                </div>
              ))}

              {validationErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-2">Campos obligatorios:</h4>
                  <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-3">
                <Button 
                  onClick={handleFormSubmit} 
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? 'Guardando...' : 'Guardar configuración'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {canProceed() && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="font-semibold">Configuración completada</h3>
                  <p className="text-sm text-muted-foreground">
                    Procede al análisis con IA para generar las preguntas específicas
                  </p>
                </div>
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
