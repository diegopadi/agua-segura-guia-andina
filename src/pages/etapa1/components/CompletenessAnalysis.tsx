import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Brain, CheckCircle, AlertTriangle, Clock, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface CompletenessAnalysisProps {
  session: any
  onNext: (data: any) => void
  onPrev: () => void
}

interface AnalysisResult {
  overall_completeness: number
  missing_areas: string[]
  recommendations: string[]
  strengths: string[]
  additional_questions: Array<{
    question: string
    reason: string
    priority: 'high' | 'medium' | 'low'
  }>
}

const CompletenessAnalysis = ({ session, onNext, onPrev }: CompletenessAnalysisProps) => {
  const { toast } = useToast()
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    performAnalysis()
  }, [])

  const performAnalysis = async () => {
    setLoading(true)
    setError(null)

    try {
      // Call the analyze-pei edge function
      const { data, error: functionError } = await supabase.functions.invoke('analyze-pei', {
        body: {
          sessionId: session.id,
          peiFile: session.session_data?.pei_file,
          questions: session.session_data?.form_responses || {}
        }
      })

      if (functionError) throw functionError

      setAnalysis(data)

      // Save analysis results to session
      const { error: updateError } = await supabase
        .from('acelerador_sessions')
        .update({
          session_data: {
            ...session.session_data,
            completeness_analysis: data
          }
        })
        .eq('id', session.id)

      if (updateError) throw updateError

    } catch (error) {
      console.error('Error performing analysis:', error)
      setError('No se pudo completar el análisis. Verifica tu conexión e intenta nuevamente.')
      toast({
        title: "Error en el análisis",
        description: "No se pudo analizar la completitud. Intenta nuevamente.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getCompletenessColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getCompletenessStatus = (percentage: number) => {
    if (percentage >= 80) return "Excelente"
    if (percentage >= 60) return "Bueno"
    if (percentage >= 40) return "Regular"
    return "Necesita mejoras"
  }

  const handleNext = () => {
    if (!analysis) return

    onNext({
      completeness_analysis: analysis,
      needs_additional_questions: analysis.additional_questions.length > 0
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Paso 4: Análisis de Completitud con IA
          </CardTitle>
          <CardDescription>
            Analizando tu PEI y respuestas para identificar áreas de mejora...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              <div className="space-y-2">
                <p className="font-medium">Procesando con IA...</p>
                <p className="text-sm text-muted-foreground">
                  Esto puede tomar unos momentos. Estamos analizando tu PEI y respuestas.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Error en el Análisis
          </CardTitle>
          <CardDescription>
            Hubo un problema al procesar tu información
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-red-800">{error}</p>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={onPrev}>
              Volver
            </Button>
            <Button onClick={performAnalysis} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Reintentar análisis
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analysis) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          Paso 4: Análisis de Completitud
        </CardTitle>
        <CardDescription>
          Resultados del análisis automático de tu diagnóstico institucional
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Completeness */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Completitud General</h3>
            <Badge variant="outline" className={getCompletenessColor(analysis.overall_completeness)}>
              {getCompletenessStatus(analysis.overall_completeness)}
            </Badge>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Nivel de completitud</span>
              <span className={`text-2xl font-bold ${getCompletenessColor(analysis.overall_completeness)}`}>
                {analysis.overall_completeness}%
              </span>
            </div>
            <Progress value={analysis.overall_completeness} className="h-3" />
            <p className="text-sm text-muted-foreground">
              Tu diagnóstico tiene un {analysis.overall_completeness}% de completitud basado en el análisis de IA.
            </p>
          </div>
        </div>

        {/* Strengths */}
        {analysis.strengths.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Fortalezas Identificadas
            </h3>
            <div className="space-y-2">
              {analysis.strengths.map((strength, index) => (
                <div key={index} className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <p className="text-green-800 text-sm">{strength}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Missing Areas */}
        {analysis.missing_areas.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              Áreas que Necesitan Atención
            </h3>
            <div className="space-y-2">
              {analysis.missing_areas.map((area, index) => (
                <div key={index} className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <p className="text-yellow-800 text-sm">{area}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {analysis.recommendations.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-600" />
              Recomendaciones de IA
            </h3>
            <div className="space-y-2">
              {analysis.recommendations.map((recommendation, index) => (
                <div key={index} className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-blue-800 text-sm">{recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Questions Preview */}
        {analysis.additional_questions.length > 0 && (
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold text-orange-900">Preguntas Adicionales Sugeridas</h3>
            </div>
            <p className="text-orange-800 text-sm mb-3">
              La IA ha identificado {analysis.additional_questions.length} preguntas adicionales 
              que podrían enriquecer tu diagnóstico.
            </p>
            <div className="space-y-2">
              {analysis.additional_questions.slice(0, 2).map((item, index) => (
                <div key={index} className="bg-white p-2 rounded border">
                  <p className="text-sm font-medium">{item.question}</p>
                  <Badge variant={item.priority === 'high' ? 'destructive' : item.priority === 'medium' ? 'default' : 'secondary'}>
                    {item.priority === 'high' ? 'Alta prioridad' : item.priority === 'medium' ? 'Media prioridad' : 'Baja prioridad'}
                  </Badge>
                </div>
              ))}
              {analysis.additional_questions.length > 2 && (
                <p className="text-xs text-orange-700">
                  +{analysis.additional_questions.length - 2} preguntas más...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onPrev}>
            Anterior
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={performAnalysis} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Reanalizar
            </Button>
            <Button onClick={handleNext}>
              {analysis.additional_questions.length > 0 ? "Responder preguntas adicionales" : "Generar reporte"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default CompletenessAnalysis