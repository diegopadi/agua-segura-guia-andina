import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FileText, Download, CheckCircle, Loader2, ExternalLink, RefreshCw, Copy, Printer, FileDown, PenTool, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
interface ReportViewerStepProps {
  sessionId: string;
  onPrev: () => void;
  sessionData: any;
  onUpdateSessionData: (data: any) => void;
  step: {
    title: string;
    description: string;
    template_id: string;
  };
}

export const ReportViewerStep: React.FC<ReportViewerStepProps> = ({
  sessionId,
  onPrev,
  sessionData,
  onUpdateSessionData,
  step
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(sessionData?.final_report || null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signatureData, setSignatureData] = useState({
    director_name: '',
    director_signature: '',
    date: new Date().toLocaleDateString('es-ES'),
  });
  useEffect(() => {
    console.log('ReportViewerStep mounted - sessionData:', sessionData);
    console.log('Initial report state:', report);
    console.log('SessionData final_report:', sessionData?.final_report);
    
    // Auto-generate report if it doesn't exist and we have valid data
    if (!report && !generatingReport && sessionId && sessionData) {
      console.log('No report found, generating...');
      generateReport();
    }
  }, [sessionId]);

  const generateReport = async () => {
    console.log('generateReport called');
    setGeneratingReport(true);
    setError(null);
    try {
      if (!sessionId || !sessionData) throw new Error('Faltan datos requeridos');

      // Invocar función Edge para generar informe detallado con IA
      const { data, error } = await supabase.functions.invoke('generate-strategies-report', {
        body: {
          session_id: sessionId,
          session_data: sessionData,
          template_id: step.template_id || 'plantilla7_informe_ac4',
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'No se pudo generar el informe');

      const result = {
        success: true,
        html_content: data.html_content,
        summary: data.summary,
        word_count: data.word_count,
        strategies_count: data.strategies_count,
        citations_count: data.citations_count,
      } as any;

      setReport(result);
      onUpdateSessionData({ ...sessionData, final_report: result });
      toast({ title: regenerating ? 'Informe regenerado' : 'Informe generado', description: 'Documento técnico creado con IA' });
    } catch (error: any) {
      console.error('Error generating report:', error);
      setError(error.message || 'Hubo un problema al generar el informe.');
      toast({ title: 'Error al generar informe', description: error.message || 'Hubo un problema al generar el informe.', variant: 'destructive' });
    } finally {
      setGeneratingReport(false);
      setRegenerating(false);
    }
  };

  const regenerateReport = async () => {
    setRegenerating(true);
    setReport(null);
    onUpdateSessionData({
      ...sessionData,
      final_report: null
    });
    
    await generateReport();
  };

  const downloadReport = () => {
    if (!report) return;

    const blob = new Blob([report.html_content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `informe_estrategias_ac4_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Descarga iniciada",
      description: "El informe se está descargando."
    });
  };

  const goToAccelerator5 = () => {
    navigate('/etapa2/acelerador5');
  };

  const handleCopyReport = async () => {
    if (!report?.html_content) return;
    try {
      const tempEl = document.createElement('div');
      tempEl.innerHTML = report.html_content;
      const textContent = tempEl.innerText;
      await navigator.clipboard.writeText(textContent);
      toast({ title: 'Contenido copiado', description: 'El informe completo ha sido copiado al portapapeles.' });
    } catch (e) {
      toast({ title: 'Error al copiar', description: 'No se pudo copiar el contenido. Intenta de nuevo.', variant: 'destructive' });
    }
  };

  const downloadTxtFile = () => {
    if (!report?.html_content) return;
    try {
      const tempEl = document.createElement('div');
      tempEl.innerHTML = report.html_content;
      const textContent = tempEl.innerText;
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = `informe_estrategias_ac4_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: 'Descarga iniciada', description: 'El informe se está descargando en formato texto.' });
    } catch (e) {
      toast({ title: 'Error en la descarga', description: 'No se pudo descargar el archivo.', variant: 'destructive' });
    }
  };

  const handlePrint = () => {
    if (!report?.html_content) return;
    const fullHtmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Informe de Estrategias - Acelerador 4</title>
          <meta charset="utf-8" />
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
          ${report.html_content}
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
              </div>
            </div>
            <div style="text-align: center; margin-top: 30px;">
              <p><strong>Fecha de validación:</strong> ${signatureData.date}</p>
              <p style="font-size: 0.9em; color: #666;">Documento generado por el Sistema de Aceleradores Pedagógicos<br/>Informe de Estrategias Metodológicas (AC4)</p>
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
    toast({ title: 'Datos de firma guardados', description: 'La información de firma se incluirá en las impresiones/descargas.' });
  };
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {step.title}
          </CardTitle>
          <CardDescription>
            {step.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {generatingReport && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <div className="text-center">
                <h3 className="font-medium">
                  {regenerating ? "Regenerando informe final..." : "Generando informe final..."}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {regenerating ? "Creando un nuevo informe con los insumos actualizados" : "Creando el informe con citas normativas"}
                </p>
              </div>
            </div>
          )}

          {error && !generatingReport && !report && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="text-center">
                <h3 className="font-medium text-destructive mb-2">Error al generar informe</h3>
                <p className="text-sm text-muted-foreground mb-4">{error}</p>
                <Button onClick={generateReport} variant="outline">
                  Reintentar
                </Button>
              </div>
            </div>
          )}

          {!generatingReport && !error && !report && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="text-center">
                <h3 className="font-medium mb-2">No hay informe disponible</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Haz clic en el botón para generar un nuevo informe
                </p>
                <Button onClick={generateReport}>
                  Generar Informe
                </Button>
              </div>
            </div>
          )}

          {report && !generatingReport && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Informe generado exitosamente</span>
              </div>

              <div className="bg-muted/50 rounded-lg p-6">
                <h4 className="font-medium mb-4">Resumen del informe:</h4>
                <div className="prose prose-sm max-w-none">
                  {report.summary && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {report.summary}
                    </p>
                  )}
                  
                  {report.strategies_count && (
                    <div className="flex items-center gap-4 text-sm">
                      <span>📋 {report.strategies_count} estrategias documentadas</span>
                      <span>📚 {report.citations_count || 0} citas normativas</span>
                      <span>📄 {Math.ceil((report.word_count || 0) / 250)} páginas aprox.</span>
                    </div>
                  )}
                </div>
              </div>

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
                      <Button variant="outline" size="sm" onClick={downloadReport}>
                        <Download className="w-4 h-4 mr-2" />
                        Descargar HTML
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[60vh] w-full">
                    <div
                      className="prose prose-sm max-w-none p-4"
                      dangerouslySetInnerHTML={{ __html: report.html_content }}
                    />
                  </ScrollArea>
                </CardContent>
              </Card>

              <div className="flex gap-3 flex-wrap">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={generatingReport}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerar Informe
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Regenerar informe?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción creará un nuevo informe utilizando los insumos actualizados del acelerador. 
                        El informe actual se perderá. ¿Deseas continuar?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={regenerateReport}>
                        Regenerar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button onClick={goToAccelerator5}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Continuar al Acelerador 5
                </Button>
              </div>

              <div className="border rounded-lg p-4 bg-blue-50/50 border-blue-200">
                <h5 className="font-medium text-blue-900 mb-2">✅ Acelerador 4 Completado</h5>
                <p className="text-sm text-blue-700">
                  Has completado exitosamente la selección de estrategias metodológicas. 
                  El informe generado servirá como insumo para el Acelerador 5: Planificación y Preparación de Unidades.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
                onChange={(e) => setSignatureData(prev => ({ ...prev, director_name: e.target.value }))}
                placeholder="Ingresa el nombre completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="director_signature">Firma Digital</Label>
              <Input
                id="director_signature"
                value={signatureData.director_signature}
                onChange={(e) => setSignatureData(prev => ({ ...prev, director_signature: e.target.value }))}
                placeholder="Escribe tu firma o iniciales"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Fecha de Validación</Label>
              <Input
                id="date"
                type="date"
                value={signatureData.date}
                onChange={(e) => setSignatureData(prev => ({ ...prev, date: e.target.value }))}
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

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev}>
          Anterior
        </Button>
        <Button 
          onClick={goToAccelerator5}
          disabled={!report}
          className="ml-auto"
        >
          Ir al Acelerador 5
        </Button>
      </div>
    </div>
  );
};