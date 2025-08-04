import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Download, 
  CheckCircle, 
  Loader2, 
  FileCheck,
  BookOpen,
  Target,
  Clock,
  Users,
  ArrowRight,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DeliveryStepProps {
  sessionId: string;
  onNext: () => void;
  onPrev: () => void;
  sessionData: any;
  onUpdateSessionData: (data: any) => void;
}

interface DocumentMetadata {
  title: string;
  area: string;
  grade: string;
  duration: string;
  competencies: string[];
  strategies: string[];
  activities_count: number;
  evaluation_instruments: string[];
  created_at: string;
  accelerator6_metadata: {
    implementation_indicators: string[];
    monitoring_points: string[];
    evidence_to_collect: string[];
  };
}

export const DeliveryStep: React.FC<DeliveryStepProps> = ({
  sessionId,
  onNext,
  onPrev,
  sessionData,
  onUpdateSessionData,
}) => {
  const { toast } = useToast();
  
  const [finalDocument, setFinalDocument] = useState<string>('');
  const [documentMetadata, setDocumentMetadata] = useState<DocumentMetadata | null>(null);
  const [generatingFinal, setGeneratingFinal] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string>('');

  useEffect(() => {
    // Cargar documento final existente o generarlo
    if (sessionData?.phase_data?.entrega?.final_document) {
      setFinalDocument(sessionData.phase_data.entrega.final_document);
      setDocumentMetadata(sessionData.phase_data.entrega.metadata);
      setDownloadUrl(sessionData.phase_data.entrega.download_url || '');
    } else {
      generateFinalDocument();
    }
  }, [sessionId, sessionData]);

  const generateFinalDocument = async () => {
    setGeneratingFinal(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-profundization-questions', {
        body: {
          session_id: sessionId,
          template_id: 'plantilla12_documento_final',
          session_data: sessionData
        }
      });

      if (error) throw error;

      if (data?.final_document) {
        setFinalDocument(data.final_document);
        setDocumentMetadata(data.metadata);
        
        // Generar URL de descarga (simulada)
        const fileName = `unidad-didactica-${sessionId.slice(0, 8)}.html`;
        setDownloadUrl(fileName);
        
        // Actualizar contador de documentos del usuario
        await updateUserDocumentCounter();
        
        // Guardar en sesión
        const updatedSessionData = {
          ...sessionData,
          phase_data: {
            ...sessionData.phase_data,
            entrega: {
              final_document: data.final_document,
              metadata: data.metadata,
              download_url: fileName,
              generated_at: new Date().toISOString(),
              document_number: sessionData.user_document_counter || 1
            }
          },
          status: 'completed'
        };
        
        onUpdateSessionData(updatedSessionData);
        
        toast({
          title: "Documento final generado",
          description: "Tu unidad didáctica está lista para usar e implementar",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo generar el documento final",
        variant: "destructive",
      });
    } finally {
      setGeneratingFinal(false);
    }
  };

  const updateUserDocumentCounter = async () => {
    try {
      // Incrementar contador de documentos del usuario
      const { error } = await supabase
        .from('profiles')
        .update({ document_counter: sessionData.user_document_counter + 1 })
        .eq('user_id', sessionData.user_id);
      
      if (error) console.error('Error updating document counter:', error);
    } catch (error) {
      console.error('Error updating document counter:', error);
    }
  };

  const downloadDocument = () => {
    if (!finalDocument) return;
    
    // Crear archivo HTML para descarga
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${documentMetadata?.title || 'Unidad Didáctica'}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
          .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .metadata { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .section { margin: 30px 0; }
          h1, h2, h3 { color: #333; }
          .competencies, .strategies { display: flex; flex-wrap: wrap; gap: 10px; margin: 10px 0; }
          .badge { background: #e3f2fd; padding: 5px 10px; border-radius: 15px; font-size: 0.9em; }
          .footer { border-top: 1px solid #ddd; padding-top: 20px; margin-top: 40px; font-size: 0.9em; color: #666; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        ${finalDocument}
        <div class="footer">
          <p>Documento generado el ${new Date().toLocaleDateString('es-ES')} | Acelerador Pedagógico 5</p>
        </div>
      </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unidad-didactica-${new Date().toISOString().split('T')[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Descarga iniciada",
      description: "El documento se está descargando",
    });
  };

  const proceedToAccelerator6 = () => {
    // Preparar datos para el Acelerador 6
    const accelerator6Data = {
      unit_title: documentMetadata?.title,
      implementation_date: new Date(),
      monitoring_points: documentMetadata?.accelerator6_metadata?.monitoring_points || [],
      evidence_requirements: documentMetadata?.accelerator6_metadata?.evidence_to_collect || [],
      source_session: sessionId
    };
    
    // Guardar preparación para A6
    const updatedSessionData = {
      ...sessionData,
      accelerator6_preparation: accelerator6Data,
      ready_for_implementation: true
    };
    
    onUpdateSessionData(updatedSessionData);
    
    toast({
      title: "Preparado para implementación",
      description: "Tu unidad está lista para el Acelerador 6",
    });
    
    onNext();
  };

  if (generatingFinal && !finalDocument) {
    return (
      <Card className="w-full">
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
            <div>
              <h3 className="text-lg font-semibold">Generando documento final</h3>
              <p className="text-muted-foreground">
                Creando la versión final indexada de tu unidad didáctica con metadatos para el Acelerador 6...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Fase 4: Entrega y Preparación
          </CardTitle>
          <CardDescription>
            Tu unidad didáctica está completa y lista para implementar
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Resumen de la unidad */}
      {documentMetadata && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Área Curricular</p>
                  <p className="text-xs text-muted-foreground">{documentMetadata.area}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Grado/Nivel</p>
                  <p className="text-xs text-muted-foreground">{documentMetadata.grade}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <div>
                  <p className="text-sm font-medium">Duración</p>
                  <p className="text-xs text-muted-foreground">{documentMetadata.duration}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-sm font-medium">Actividades</p>
                  <p className="text-xs text-muted-foreground">{documentMetadata.activities_count} planificadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Competencias y estrategias */}
      {documentMetadata && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Elementos Clave de la Unidad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Competencias CNEB desarrolladas:</h4>
              <div className="flex flex-wrap gap-2">
                {documentMetadata.competencies.map((competency, index) => (
                  <Badge key={index} variant="secondary">
                    {competency}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Estrategias pedagógicas implementadas:</h4>
              <div className="flex flex-wrap gap-2">
                {documentMetadata.strategies.map((strategy, index) => (
                  <Badge key={index} variant="outline">
                    {strategy}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Instrumentos de evaluación:</h4>
              <div className="flex flex-wrap gap-2">
                {documentMetadata.evaluation_instruments.map((instrument, index) => (
                  <Badge key={index} className="bg-green-100 text-green-800">
                    {instrument}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vista previa del documento */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documento Final
            </CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={downloadDocument}
                disabled={!finalDocument}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Descargar HTML
              </Button>
            </div>
          </div>
          <CardDescription>
            Versión final de tu unidad didáctica lista para implementar
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <ScrollArea className="h-[400px] border rounded-lg p-4">
            {finalDocument ? (
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: finalDocument }}
              />
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>El documento final se mostrará aquí</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Preparación para Acelerador 6 */}
      {documentMetadata?.accelerator6_metadata && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              Preparación para Acelerador 6
            </CardTitle>
            <CardDescription>
              Elementos configurados para el seguimiento de implementación
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Indicadores de implementación:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {documentMetadata.accelerator6_metadata.implementation_indicators.map((indicator, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 mt-1 text-green-600 flex-shrink-0" />
                    {indicator}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Puntos de seguimiento:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {documentMetadata.accelerator6_metadata.monitoring_points.map((point, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Target className="h-3 w-3 mt-1 text-blue-600 flex-shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Evidencias a recopilar:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {documentMetadata.accelerator6_metadata.evidence_to_collect.map((evidence, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <FileCheck className="h-3 w-3 mt-1 text-purple-600 flex-shrink-0" />
                    {evidence}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información importante */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>¡Felicitaciones!</strong> Has completado el diseño de tu unidad didáctica. 
          El documento incluye todos los elementos necesarios para la implementación y está 
          preparado con metadatos para el seguimiento en el Acelerador 6.
        </AlertDescription>
      </Alert>

      {/* Navegación */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev}>
          Anterior
        </Button>
        
        <div className="flex gap-2">
          <Button
            onClick={downloadDocument}
            disabled={!finalDocument}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Descargar Unidad
          </Button>
          
          <Button 
            onClick={proceedToAccelerator6}
            disabled={!finalDocument}
            className="flex items-center gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            Preparar para Implementación
          </Button>
        </div>
      </div>
    </div>
  );
};