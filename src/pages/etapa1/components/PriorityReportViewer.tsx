import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Copy, Printer, ArrowRight, CheckCircle } from "lucide-react"
import { Link } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"

interface PriorityReportViewerProps {
  htmlContent: string
  priorities: any[]
  metadata: any
  sessionId: string
  onPrevious: () => void
}

const PriorityReportViewer = ({
  htmlContent,
  priorities,
  metadata,
  sessionId,
  onPrevious
}: PriorityReportViewerProps) => {
  const { toast } = useToast()

  const handleCopyReport = () => {
    // Create a text version of the report
    const textContent = `
INFORME DE PRIORIZACIÓN DE NECESIDADES HÍDRICAS

Institución: ${metadata?.institution_name || 'No especificada'}
Docente: ${metadata?.teacher_name || 'No especificado'}
Fecha: ${new Date(metadata?.generated_date || new Date()).toLocaleDateString()}

PRIORIDADES IDENTIFICADAS:

${priorities?.map((priority, index) => `
${index + 1}. ${priority.title}
Descripción: ${priority.description}
Estrategias: ${priority.strategies?.join(', ') || 'No especificadas'}
`).join('\n') || 'No se encontraron prioridades'}

---
Este informe ha sido generado mediante análisis de inteligencia artificial.
    `.trim()

    navigator.clipboard.writeText(textContent).then(() => {
      toast({
        title: "Informe copiado",
        description: "El contenido del informe se ha copiado al portapapeles.",
      })
    }).catch(() => {
      toast({
        title: "Error",
        description: "No se pudo copiar el informe al portapapeles.",
        variant: "destructive",
      })
    })
  }

  const handleDownloadPDF = () => {
    // Create a printable version
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Informe de Priorización - ${metadata?.institution_name || 'Institución Educativa'}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #0066cc; padding-bottom: 20px; }
            .priority-item { margin-bottom: 30px; border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
            .priority-title { color: #0066cc; font-size: 18px; font-weight: bold; margin-bottom: 10px; }
            .section-title { color: #333; font-weight: bold; margin: 15px 0 8px 0; }
            ul { margin: 0; padding-left: 20px; }
            li { margin-bottom: 5px; }
            .footer { text-align: center; margin-top: 40px; font-style: italic; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
        </html>
      `)
      printWindow.document.close()
      
      // Focus and print
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
      }, 500)
    }
  }

  const handlePrint = () => {
    handleDownloadPDF()
  }

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-800">
            ¡Etapa 1 Completada!
          </CardTitle>
          <p className="text-green-700">
            Tu diagnóstico de necesidades hídricas ha sido completado exitosamente
          </p>
        </CardHeader>
      </Card>

      {/* Priorities Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge variant="secondary">Resumen</Badge>
            5 Prioridades Identificadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {priorities?.map((priority, index) => (
              <div 
                key={index}
                className="flex items-center gap-4 p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-transparent"
              >
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-primary">{priority.title}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {priority.description}
                  </p>
                </div>
              </div>
            )) || (
              <p className="text-center text-muted-foreground">
                No se encontraron prioridades en el informe
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Full Report */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Informe Completo</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyReport}>
                <Copy className="w-4 h-4 mr-2" />
                Copiar
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <Download className="w-4 h-4 mr-2" />
                Descargar
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex gap-4 justify-between pt-6">
        <Button variant="outline" onClick={onPrevious}>
          Anterior
        </Button>
        <div className="flex gap-4">
          <Button variant="outline" asChild>
            <Link to="/etapa1">
              Volver al dashboard
            </Link>
          </Button>
          <Button asChild>
            <Link to="/etapa2">
              <ArrowRight className="w-4 h-4 mr-2" />
              Continuar a Etapa 2
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PriorityReportViewer