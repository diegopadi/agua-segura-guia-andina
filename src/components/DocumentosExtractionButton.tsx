import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DocumentFieldSchema } from "@/types/document-extraction";
import { ExtractionPreviewModal } from "./cnpie/ExtractionPreviewModal";

interface Documento {
  id: string;
  nombre: string;
  url: string;
  tipo: string;
  tamaño_bytes: number;
}

interface DocumentosExtractionButtonProps {
  documentos: Documento[];
  expectedFields: DocumentFieldSchema[];
  contextoProyecto: any;
  onDataExtracted: (data: any) => void;
  aceleradorKey: string;
}

export function DocumentosExtractionButton({
  documentos,
  expectedFields,
  contextoProyecto,
  onDataExtracted,
  aceleradorKey
}: DocumentosExtractionButtonProps) {
  const [extracting, setExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  const handleExtract = async () => {
    if (documentos.length === 0) {
      toast({
        title: "Sin documentos",
        description: "No hay documentos de postulación disponibles",
        variant: "destructive"
      });
      return;
    }

    try {
      setExtracting(true);

      const { data, error } = await supabase.functions.invoke('extract-document-data', {
        body: {
          documentos: documentos.map(d => ({ url: d.url, nombre: d.nombre })),
          aceleradorKey,
          expectedFields,
          contexto_proyecto: contextoProyecto
        }
      });

      if (error) throw error;

      if (data.success) {
        setExtractionResult(data);
        setShowPreview(true);
        
        toast({
          title: "Extracción completada",
          description: `${data.fieldsFound.length} campos extraídos de ${documentos.length} documento(s)`
        });
      } else {
        throw new Error(data.error || "Error en la extracción");
      }
    } catch (error: any) {
      console.error('Error extracting:', error);
      toast({
        title: "Error en la extracción",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setExtracting(false);
    }
  };

  const handleConfirm = () => {
    if (extractionResult) {
      onDataExtracted(extractionResult.extractedData);
      setShowPreview(false);
      setExtractionResult(null);
    }
  };

  const handleCancel = () => {
    setShowPreview(false);
    setExtractionResult(null);
  };

  if (documentos.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="border-blue-200 bg-blue-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-5 h-5 text-blue-600" />
            Documentos de Postulación ({documentos.length})
          </CardTitle>
          <CardDescription>
            Tienes {documentos.length} documento(s) cargado(s) desde la selección de proyecto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preview de primeros 3 documentos */}
          <div className="space-y-2">
            {documentos.slice(0, 3).map(doc => (
              <div key={doc.id} className="flex items-center gap-2 text-sm p-2 bg-white rounded border">
                <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span className="truncate flex-1">{doc.nombre}</span>
                <Badge variant="outline" className="text-xs">
                  {(doc.tamaño_bytes / 1024).toFixed(0)} KB
                </Badge>
              </div>
            ))}
            {documentos.length > 3 && (
              <p className="text-xs text-muted-foreground text-center">
                Y {documentos.length - 3} documento(s) más...
              </p>
            )}
          </div>

          {/* Botón de extracción */}
          <Button
            onClick={handleExtract}
            disabled={extracting}
            className="w-full"
            size="lg"
          >
            {extracting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analizando {documentos.length} documento(s)...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Extraer información de documentos
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            La IA analizará tus documentos y el diagnóstico para llenar automáticamente los campos
          </p>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      {extractionResult && (
        <ExtractionPreviewModal
          open={showPreview}
          onClose={handleCancel}
          onConfirm={handleConfirm}
          extractionResult={extractionResult}
          fieldSchemas={expectedFields}
        />
      )}
    </>
  );
}
