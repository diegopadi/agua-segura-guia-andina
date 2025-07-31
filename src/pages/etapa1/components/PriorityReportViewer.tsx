import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Download, Copy, Printer, ArrowRight, CheckCircle, PenTool, Save, FileDown } from "lucide-react"
import { Link } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"

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
  const [signatureData, setSignatureData] = useState({
    director_name: '',
    director_signature: '',
    date: new Date().toLocaleDateString('es-ES'),
    institution_seal: ''
  })

  const handleCopyReport = async () => {
    // Create a comprehensive text version of the report
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

VALIDACIÓN Y FIRMAS:
Director(a): ${signatureData.director_name || '[Pendiente]'}
Firma: ${signatureData.director_signature || '[Pendiente]'}
Fecha de validación: ${signatureData.date}
Institución: ${metadata?.institution_name || 'No especificada'}

---
Este informe ha sido generado mediante análisis de inteligencia artificial.
    `.trim()

    try {
      await navigator.clipboard.writeText(textContent)
      toast({
        title: "Contenido copiado",
        description: "El informe completo ha sido copiado al portapapeles en formato texto.",
      })
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      toast({
        title: "Error al copiar",
        description: "No se pudo copiar el contenido. Intenta seleccionar y copiar manualmente.",
        variant: "destructive",
      })
    }
  }

  const downloadTxtFile = () => {
    try {
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

VALIDACIÓN Y FIRMAS:
Director(a): ${signatureData.director_name || '[Pendiente]'}
Firma: ${signatureData.director_signature || '[Pendiente]'}
Fecha de validación: ${signatureData.date}
Institución: ${metadata?.institution_name || 'No especificada'}

---
Este informe ha sido generado mediante análisis de inteligencia artificial.
      `.trim()

      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `informe_priorizacion_${new Date().toISOString().split('T')[0]}.txt`)
      link.style.visibility = 'hidden'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
      
      toast({
        title: "Descarga iniciada",
        description: "El informe se está descargando en formato texto.",
      })
    } catch (error) {
      console.error('Error downloading file:', error)
      toast({
        title: "Error en la descarga",
        description: "No se pudo descargar el archivo. Intenta de nuevo.",
        variant: "destructive",
      })
    }
  }

  const handlePrint = () => {
    // Create comprehensive HTML for printing with signature
    const fullHtmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Informe de Priorización - ${metadata?.institution_name || 'Institución Educativa'}</title>
          <style>
            body {
              font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 900px;
              margin: 0 auto;
              padding: 20px;
            }
            .signature-section {
              margin-top: 40px;
              padding: 20px;
              border: 1px solid #ddd;
              border-radius: 8px;
              background-color: #f9f9f9;
              page-break-inside: avoid;
            }
            .signature-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              margin-top: 20px;
            }
            .signature-field {
              text-align: center;
              padding: 20px 0;
            }
            .signature-line {
              border-bottom: 1px solid #333;
              margin-bottom: 8px;
              height: 40px;
            }
            @media print {
              body { margin: 0; padding: 15px; }
              h1 { page-break-before: avoid; }
              table { page-break-inside: avoid; }
              .signature-section { page-break-before: auto; }
            }
            table {
              border-collapse: collapse;
              width: 100%;
              margin: 20px 0;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          ${htmlContent}
          
          <div class="signature-section">
            <h3 style="text-align: center; margin-bottom: 30px;">VALIDACIÓN Y FIRMAS</h3>
            
            <div class="signature-grid">
              <div class="signature-field">
                <div class="signature-line">${signatureData.director_signature || ''}</div>
                <p><strong>${signatureData.director_name || 'Nombre del Director(a)'}</strong></p>
                <p>Director(a) de la Institución Educativa</p>
              </div>
              
              <div class="signature-field">
                <div class="signature-line"></div>
                <p><strong>Sello de la Institución</strong></p>
                <p style="font-size: 0.9em; color: #666;">${metadata?.institution_name || 'Institución Educativa'}</p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p><strong>Fecha de validación:</strong> ${signatureData.date}</p>
              <p style="font-size: 0.9em; color: #666;">
                Documento generado por el Sistema de Aceleradores Pedagógicos<br>
                Informe de Priorización de Necesidades Hídricas
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(fullHtmlContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const saveSignature = () => {
    toast({
      title: "Datos de firma guardados",
      description: "La información de firma se incluirá en las descargas e impresiones.",
    })
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
              <Button variant="outline" size="sm" onClick={downloadTxtFile}>
                <FileDown className="w-4 h-4 mr-2" />
                Descargar como texto
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[60vh] w-full">
            <div 
              className="prose prose-sm max-w-none p-4"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Signature Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5" />
            Área de Firma Digital
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="director_name">Nombre del Director(a)</Label>
              <Input
                id="director_name"
                value={signatureData.director_name}
                onChange={(e) => setSignatureData(prev => ({...prev, director_name: e.target.value}))}
                placeholder="Ingresa el nombre completo"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="director_signature">Firma Digital</Label>
              <Input
                id="director_signature"
                value={signatureData.director_signature}
                onChange={(e) => setSignatureData(prev => ({...prev, director_signature: e.target.value}))}
                placeholder="Escribe tu firma o iniciales"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Fecha de Validación</Label>
              <Input
                id="date"
                type="date"
                value={signatureData.date}
                onChange={(e) => setSignatureData(prev => ({...prev, date: e.target.value}))}
              />
            </div>
            
            <div className="flex items-end">
              <Button onClick={saveSignature} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Guardar información de firma
              </Button>
            </div>
          </div>
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