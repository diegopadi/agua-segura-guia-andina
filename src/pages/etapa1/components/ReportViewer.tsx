import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Printer, RotateCcw } from 'lucide-react';
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

  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Reporte de Diagnóstico Institucional</title>
            <style>
              body {
                font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 900px;
                margin: 0 auto;
                padding: 20px;
              }
              @media print {
                body { margin: 0; padding: 15px; }
                h1 { page-break-before: always; }
                table { page-break-inside: avoid; }
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
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-primary">
                Reporte de Diagnóstico Institucional
              </h2>
              <p className="text-sm text-muted-foreground">
                Documento #{reportData.document_number} • {reportData.metadata.institution_name || 'Institución'} • 
                Generado el {new Date(reportData.created_at).toLocaleDateString('es-ES')}
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

      {/* Instructions */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-2">💡 Opciones disponibles:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li><strong>Copiar contenido:</strong> Copia todo el reporte en formato texto para pegar en Word u otro editor</li>
              <li><strong>Imprimir/PDF:</strong> Abre una ventana optimizada para imprimir o guardar como PDF</li>
              <li><strong>Selección manual:</strong> Puedes seleccionar y copiar secciones específicas del reporte</li>
              <li><strong>Nuevo reporte:</strong> Genera un análisis completamente nuevo con datos actualizados</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};