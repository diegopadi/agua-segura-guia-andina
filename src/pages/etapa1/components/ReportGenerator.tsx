import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, CheckCircle, AlertTriangle, RefreshCw, ExternalLink, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useProfile } from "@/hooks/useProfile"
import { ReportViewer } from "./ReportViewer"

interface ReportGeneratorProps {
  session: any
  onPrev: () => void
}

interface ReportStatus {
  id: string
  status: 'pending' | 'generating' | 'completed' | 'error'
  document_number: number
  created_at: string
  metadata: {
    report_content?: string
    html_content?: string
    institution_name?: string
    completeness_score?: number
  }
}

const ReportGenerator = ({ session, onPrev }: ReportGeneratorProps) => {
  const { user } = useAuth()
  const { profile, updateProfile } = useProfile()
  const { toast } = useToast()
  const [report, setReport] = useState<ReportStatus | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showViewer, setShowViewer] = useState(false)

  useEffect(() => {
    checkExistingReport()
  }, [])

  const checkExistingReport = async () => {
    try {
      const { data, error } = await supabase
        .from('diagnostic_reports')
        .select('*')
        .eq('session_id', session.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) throw error

      if (data && data.length > 0) {
        setReport(data[0] as ReportStatus)
        // If report is completed, show viewer automatically
        if (data[0].status === 'completed') {
          setShowViewer(true)
        }
      }
    } catch (error) {
      console.error('Error checking existing report:', error)
    }
  }

  const generateReport = async () => {
    setGenerating(true)
    setError(null)
    setShowViewer(false)

    try {
      // Get next document number
      const nextDocNumber = (profile?.document_counter || 0) + 1

      // Create report record
      const { data: reportData, error: reportError } = await supabase
        .from('diagnostic_reports')
        .insert({
          user_id: user?.id,
          session_id: session.id,
          document_number: nextDocNumber,
          status: 'generating',
          metadata: {
            total_questions: Object.keys(session.session_data?.form_responses || {}).length,
            completeness_score: session.session_data?.completeness_analysis?.overall_completeness || 0,
            additional_questions: session.session_data?.completed_additional || 0
          }
        })
        .select()
        .single()

      if (reportError) throw reportError

      setReport(reportData as ReportStatus)

      // Call the generate-report edge function
      const { data, error: functionError } = await supabase.functions.invoke('generate-report', {
        body: {
          sessionId: session.id,
          userId: user?.id
        }
      })

      if (functionError) throw functionError

      // Update document counter
      await updateProfile({ document_counter: nextDocNumber })

      // Refresh report status
      await checkExistingReport()

      toast({
        title: "¡Reporte generado!",
        description: "Tu diagnóstico institucional está listo para visualizar"
      })

    } catch (error) {
      console.error('Error generating report:', error)
      setError('No se pudo generar el reporte. Intenta nuevamente.')
      toast({
        title: "Error",
        description: "No se pudo generar el reporte. Verifica tu conexión e intenta nuevamente.",
        variant: "destructive"
      })
    } finally {
      setGenerating(false)
    }
  }

  const redoAnalysis = async () => {
    if (!report) return

    // Confirm action
    const confirmed = window.confirm(
      '¿Estás seguro de que quieres rehacer el análisis? Se descartará el reporte actual y se generará uno nuevo.'
    )
    
    if (!confirmed) return

    setGenerating(true)
    setError(null)
    setShowViewer(false)

    try {
      // Delete existing report
      const { error: deleteError } = await supabase
        .from('diagnostic_reports')
        .delete()
        .eq('id', report.id)

      if (deleteError) throw deleteError

      // Clear current report state
      setReport(null)

      // Generate new report
      await generateReport()

      toast({
        title: "Análisis regenerado",
        description: "Se ha iniciado la generación de un nuevo reporte"
      })

    } catch (error) {
      console.error('Error redoing analysis:', error)
      setError('No se pudo rehacer el análisis. Intenta nuevamente.')
      toast({
        title: "Error",
        description: "No se pudo rehacer el análisis. Verifica tu conexión e intenta nuevamente.",
        variant: "destructive"
      })
      setGenerating(false)
    }
  }

  const markSessionComplete = async () => {
    try {
      await supabase
        .from('acelerador_sessions')
        .update({ 
          status: 'completed',
          current_step: 6 
        })
        .eq('id', session.id)
    } catch (error) {
      console.error('Error marking session complete:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700'
      case 'generating': return 'bg-blue-100 text-blue-700'
      case 'error': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Completado'
      case 'generating': return 'Generando...'
      case 'error': return 'Error'
      default: return 'Pendiente'
    }
  }

  // If showing viewer, render it
  if (showViewer && report?.status === 'completed' && report.metadata.html_content) {
    return (
      <ReportViewer
        htmlContent={report.metadata.html_content}
        markdownContent={report.metadata.report_content || ''}
        reportData={report}
        onRedoAnalysis={redoAnalysis}
      />
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Paso 6: Generar Reporte de Diagnóstico
        </CardTitle>
        <CardDescription>
          Crea tu reporte profesional con el análisis completo del diagnóstico institucional
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary of collected data */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Resumen de Información Recopilada</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>PEI subido:</span>
                <span className="text-green-600 font-medium">
                  {session.session_data?.pei_file ? '✓ Sí' : '✗ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Preguntas respondidas:</span>
                <span className="font-medium">
                  {Object.keys(session.session_data?.form_responses || {}).length} de 15
                </span>
              </div>
              <div className="flex justify-between">
                <span>Completitud general:</span>
                <span className="font-medium">
                  {session.session_data?.completeness_analysis?.overall_completeness || 0}%
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Análisis de IA:</span>
                <span className="text-green-600 font-medium">
                  {session.session_data?.completeness_analysis ? '✓ Completado' : '✗ Pendiente'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Preguntas adicionales:</span>
                <span className="font-medium">
                  {session.session_data?.completed_additional || 0} respondidas
                </span>
              </div>
              <div className="flex justify-between">
                <span>Documento número:</span>
                <span className="font-medium">
                  #{(profile?.document_counter || 0) + 1}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Report Status */}
        {report && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Estado del Reporte</h3>
              <Badge className={getStatusColor(report.status)}>
                {getStatusLabel(report.status)}
              </Badge>
            </div>

            {report.status === 'generating' && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    <div>
                      <p className="font-medium text-blue-900">Generando reporte...</p>
                      <p className="text-sm text-blue-700">
                        La IA está procesando toda tu información y creando el reporte. 
                        Esto puede tomar 1-2 minutos.
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={checkExistingReport}
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Verificar estado
                  </Button>
                </div>
              </div>
            )}

            {report.status === 'completed' && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">¡Reporte generado exitosamente!</p>
                      <p className="text-sm text-green-700">
                        Documento #{report.document_number} - Diagnóstico Institucional
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={redoAnalysis} 
                      disabled={generating}
                      className="gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Rehacer Análisis
                    </Button>
                    <Button 
                      onClick={() => setShowViewer(true)} 
                      className="gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Ver Reporte
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {report.status === 'error' && (
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-900">Error al generar el reporte</p>
                      <p className="text-sm text-red-700">
                        Hubo un problema durante la generación. Intenta nuevamente.
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={generateReport} 
                    disabled={generating}
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reintentar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* What's included in the report */}
        <div className="space-y-3">
          <h3 className="font-semibold">¿Qué incluye tu reporte?</h3>
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <ul className="space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Análisis completo del PEI
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Diagnóstico de seguridad hídrica
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Matriz FODA integrada
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Recomendaciones específicas
              </li>
            </ul>
            <ul className="space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Prioridades pedagógicas
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Alineación con CNEB
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Marco normativo
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Visor interno con opciones de copia e impresión
              </li>
            </ul>
          </div>
        </div>

        {/* New features callout */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border">
          <h4 className="font-medium text-purple-900 mb-2">📋 Nuevo: Visor de Reporte Integrado</h4>
          <p className="text-sm text-purple-800 mb-3">
            Ahora puedes ver tu reporte directamente en la aplicación con opciones para:
          </p>
          <ul className="text-sm text-purple-700 space-y-1">
            <li>• <strong>Copiar contenido completo</strong> para pegar en Word u otros editores</li>
            <li>• <strong>Imprimir o guardar como PDF</strong> directamente desde el navegador</li>
            <li>• <strong>Seleccionar secciones específicas</strong> para copiar partes del reporte</li>
            <li>• <strong>Vista optimizada</strong> con tablas y formato profesional</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onPrev} disabled={generating}>
            Anterior
          </Button>
          
          <div className="flex gap-2">
            {!report || report.status === 'error' ? (
              <Button 
                onClick={generateReport} 
                disabled={generating}
                className="gap-2"
              >
                {generating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                {generating ? 'Generando...' : 'Generar reporte'}
              </Button>
            ) : report.status === 'completed' ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={redoAnalysis} 
                  disabled={generating}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Rehacer Análisis
                </Button>
                <Button 
                  onClick={() => setShowViewer(true)} 
                  className="gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Ver Reporte
                </Button>
                <Button onClick={markSessionComplete} className="gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Finalizar acelerador
                </Button>
              </>
            ) : null}
          </div>
        </div>

        {/* Next steps */}
        {report?.status === 'completed' && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border">
            <h4 className="font-medium text-green-900 mb-2">Próximos pasos</h4>
            <p className="text-sm text-green-800 mb-3">
              ¡Felicitaciones! Has completado el Acelerador 1. Ahora puedes:
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href="/etapa1" className="gap-1">
                  <ExternalLink className="w-3 h-3" />
                  Ir a Acelerador 2
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="/etapa2" className="gap-1">
                  <ExternalLink className="w-3 h-3" />
                  Continuar a Etapa 2
                </a>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ReportGenerator