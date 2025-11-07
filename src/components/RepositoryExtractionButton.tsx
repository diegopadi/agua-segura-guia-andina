import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DocumentFieldSchema } from "@/types/document-extraction";
import { ExtractionPreviewModal } from "./cnpie/ExtractionPreviewModal";
import { useFileManager } from "@/hooks/useFileManager";

interface RepositoryExtractionButtonProps {
  expectedFields: DocumentFieldSchema[];
  contextoProyecto: any;
  onDataExtracted: (data: any) => void;
  aceleradorKey: string;
}

export function RepositoryExtractionButton({
  expectedFields,
  contextoProyecto,
  onDataExtracted,
  aceleradorKey
}: RepositoryExtractionButtonProps) {
  const [extracting, setExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();
  const { files } = useFileManager();

  const handleExtract = async () => {
    if (files.length === 0) {
      toast({
        title: "Sin documentos en el repositorio",
        description: "Sube documentos a tu repositorio primero",
        variant: "destructive"
      });
      return;
    }

    try {
      setExtracting(true);

      // Preparar archivos del repositorio
      const repositoryFiles = files.map(f => ({
        url: f.url,
        nombre: f.original_name || 'documento',
        tipo: f.file_type
      }));

      const { data, error } = await supabase.functions.invoke('extract-repository-data', {
        body: {
          files: repositoryFiles,
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
          description: `${data.fieldsFound.length} campos extraídos de ${files.length} documento(s) del repositorio`
        });
      } else {
        throw new Error(data.error || "Error en la extracción");
      }
    } catch (error: any) {
      console.error('Error extracting from repository:', error);
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

  const hasFiles = files.length > 0;

  return (
    <>
      <Card className={hasFiles ? "border-purple-200 bg-purple-50/30" : "border-orange-200 bg-orange-50/30"}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {hasFiles ? (
              <>
                <FileText className="w-5 h-5 text-purple-600" />
                Repositorio de Documentos ({files.length})
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-orange-600" />
                Autocompletar con IA desde tu Repositorio
              </>
            )}
          </CardTitle>
          <CardDescription>
            {hasFiles 
              ? `Tienes ${files.length} documento(s) en tu repositorio personal`
              : 'Sube documentos a tu repositorio para autocompletar este formulario con IA'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasFiles ? (
            <>
              {/* Preview de primeros 3 documentos */}
              <div className="space-y-2">
                {files.slice(0, 3).map(file => (
                  <div key={file.id} className="flex items-center gap-2 text-sm p-2 bg-white rounded border">
                    <FileText className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    <span className="truncate flex-1">{file.original_name || 'Sin nombre'}</span>
                    <Badge variant="outline" className="text-xs">
                      {(file.size_bytes / 1024).toFixed(0)} KB
                    </Badge>
                  </div>
                ))}
                {files.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center">
                    Y {files.length - 3} documento(s) más...
                  </p>
                )}
              </div>

              {/* Botón de extracción */}
              <Button
                onClick={handleExtract}
                disabled={extracting}
                className="w-full bg-purple-600 hover:bg-purple-700"
                size="lg"
              >
                {extracting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analizando {files.length} documento(s)...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Autocompletar campos con IA
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                La IA analizará todos tus documentos del repositorio para autocompletar este formulario
              </p>
            </>
          ) : (
            <>
              {/* Sin archivos - mostrar call to action */}
              <div className="text-center py-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  No hay documentos en tu repositorio todavía
                </p>
                <Button
                  onClick={() => {
                    toast({
                      title: "Ve al Repositorio",
                      description: "Sube tus documentos del proyecto en la sección Repositorio del menú lateral"
                    });
                  }}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  Ir al Repositorio para subir documentos
                </Button>
              </div>
            </>
          )}
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
