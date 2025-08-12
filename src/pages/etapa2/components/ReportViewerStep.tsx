import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FileText, Download, CheckCircle, Loader2, ExternalLink, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

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
      const strategies = sessionData?.strategies_adapted?.strategies || sessionData?.strategies_result?.strategies || [];
      const sourceUsed = sessionData?.strategies_adapted?.strategies ? 'adapted' : 'result';
      const plantilla = sessionData?.app_config?.plantilla_informe_ac4 || {};
      console.log('[A4] Report: usando estrategias', sourceUsed, 'cantidad', strategies.length, 'plantilla título:', plantilla?.titulo);
      if (strategies.length === 0) throw new Error('No hay estrategias seleccionadas');

      const resumen = `Informe de estrategias metodológicas adaptadas. Total: ${strategies.length}.`;
      const estrategiasHtml = strategies.map((s: any, i: number) => `
        <article>
          <h3>${i+1}. ${s.title || s.nombre || 'Estrategia'}</h3>
          <p>${s.description || s.descripcion || ''}</p>
          <p><small>${s.reference || 'MINEDU - Currículo Nacional'}</small></p>
        </article>
      `).join('\n');

      const insumosA5 = `
        <section>
          <h2>Insumos para A5</h2>
          <ul>
            <li>Competencias y capacidades vinculadas</li>
            <li>Recursos TIC identificados</li>
            <li>Momentos pedagógicos sugeridos</li>
          </ul>
        </section>
      `;

      const html = `
        <section>
          <h2>${plantilla.titulo || 'Informe de Estrategias (AC4)'}</h2>
          <p>${plantilla.intro || ''}</p>
        </section>
        <section>
          <h2>Resumen</h2>
          <p>${resumen}</p>
        </section>
        <section>
          <h2>Estrategias Seleccionadas</h2>
          ${estrategiasHtml}
        </section>
        ${insumosA5}
      `;

      const wordCount = html.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
      const data = { success: true, html_content: html, summary: resumen, strategies_count: strategies.length, word_count: wordCount };
      setReport(data);
      onUpdateSessionData({ ...sessionData, final_report: data });
      toast({ title: regenerating ? 'Informe regenerado' : 'Informe generado', description: 'Se construyó con la plantilla de APP_CONFIG_A4' });
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

              <div className="flex gap-3 flex-wrap">
                <Button onClick={downloadReport} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Descargar Informe
                </Button>
                
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