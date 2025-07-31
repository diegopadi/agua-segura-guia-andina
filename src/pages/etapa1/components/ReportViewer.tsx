
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Printer, RotateCcw, FileDown, PenTool, Save } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface ReportViewerProps {
  htmlContent: string;
  markdownContent: string;
  reportData: {
    id: string;
    document_number: number;
    created_at: string;
    metadata: {
      institution_name?: string;
      completeness_score?: number;
    };
  };
  onRedoAnalysis: () => void;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({
  htmlContent,
  markdownContent,
  reportData,
  onRedoAnalysis
}) => {
  const { toast } = useToast();
  const [signatureData, setSignatureData] = useState({
    director_name: '',
    director_signature: '',
    date: new Date().toLocaleDateString('es-ES'),
    institution_seal: ''
  });

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(markdownContent);
      toast({
        title: "Contenido copiado",
        description: "El reporte ha sido copiado al portapapeles en formato texto.",
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        variant: "destructive",
        title: "Error al copiar",
        description: "No se pudo copiar el contenido. Intenta seleccionar y copiar manualmente.",
      });
    }
  };

  const downloadTxtFile = () => {
    try {
      const blob = new Blob([markdownContent], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `reporte_diagnostico_${reportData?.document_number || 'doc'}_${new Date().toISOString().split('T')[0]}.txt`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      toast({
        title: "Descarga iniciada",
        description: "El reporte se está descargando en formato texto.",
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        variant: "destructive",
        title: "Error en la descarga",
        description: "No se pudo descargar el archivo. Intenta de nuevo.",
      });
    }
  };

  const handlePrint = () => {
    // Create comprehensive HTML for printing with signature
    const fullHtmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Reporte de Evaluación Diagnóstica</title>
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
                <p style="font-size: 0.9em; color: #666;">${reportData?.metadata?.institution_name || 'Institución Educativa'}</p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p><strong>Fecha de validación:</strong> ${signatureData.date}</p>
              <p style="font-size: 0.9em; color: #666;">
                Documento generado por el Sistema de Aceleradores Pedagógicos<br>
                Reporte #${reportData?.document_number || 'N/A'}
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(fullHtmlContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const saveSignature = () => {
    toast({
      title: "Datos de firma guardados",
      description: "La información de firma se incluirá en las descargas e impresiones.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-primary">
                Reporte de Evaluación Diagnóstica
              </h2>
              <p className="text-sm text-muted-foreground">
                Documento #{reportData?.document_number || 'N/A'} • {reportData?.metadata?.institution_name || 'Institución Educativa'} • 
                Generado el {reportData?.created_at ? new Date(reportData.created_at).toLocaleDateString('es-ES') : 'Fecha no disponible'}
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={copyToClipboard}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copiar contenido completo
            </Button>
            
            <Button 
              onClick={downloadTxtFile}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <FileDown className="h-4 w-4" />
              Descargar como texto
            </Button>
            
            <Button 
              onClick={handlePrint}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Imprimir / Guardar PDF
            </Button>
            
            <Button 
              onClick={onRedoAnalysis}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Generar nuevo reporte
            </Button>
          </div>
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

      {/* Content viewer */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[80vh] w-full">
            <div 
              className="prose max-w-none p-6"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </ScrollArea>
        </CardContent>
      </Card>

    </div>
  );
};
