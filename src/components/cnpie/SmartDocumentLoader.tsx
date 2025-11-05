import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDocumentExtraction } from "@/hooks/useDocumentExtraction";
import { useFileManager } from "@/hooks/useFileManager";
import RepositoryFilePicker from "@/components/RepositoryFilePicker";
import { DocumentFieldSchema } from "@/types/document-extraction";
import { Upload, FileText, Sparkles, X } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ExtractionPreviewModal } from "./ExtractionPreviewModal";

interface SmartDocumentLoaderProps {
  aceleradorKey: string;
  expectedFields: DocumentFieldSchema[];
  onDataExtracted: (data: any) => void;
  allowedFileTypes?: string[];
  title?: string;
  description?: string;
  contextoProyecto?: any;
}

export function SmartDocumentLoader({
  aceleradorKey,
  expectedFields,
  onDataExtracted,
  allowedFileTypes = ['pdf', 'docx', 'doc'],
  title = "¿Ya tienes un documento?",
  description = "Sube tu documento o selecciónalo del repositorio. La IA extraerá automáticamente la información.",
  contextoProyecto
}: SmartDocumentLoaderProps) {
  const [selectedFile, setSelectedFile] = useState<{ url: string; name: string } | null>(null);
  const [showRepoPicker, setShowRepoPicker] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { extracting, extractionResult, extractDocumentData, clearExtraction } = useDocumentExtraction();
  const { uploadFile, loading: uploading } = useFileManager();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!allowedFileTypes.includes(fileExt || '')) {
      return;
    }

    const url = await uploadFile(file, 'documento');
    if (url) {
      setSelectedFile({ url, name: file.name });
    }
  };

  const handleRepoSelection = (files: any[]) => {
    if (files.length > 0) {
      setSelectedFile({ url: files[0].url, name: files[0].url.split('/').pop() || 'documento' });
      setShowRepoPicker(false);
    }
  };

  const handleExtract = async () => {
    if (!selectedFile) return;

    const result = await extractDocumentData(
      selectedFile.url,
      selectedFile.name,
      aceleradorKey,
      expectedFields,
      contextoProyecto
    );

    if (result) {
      setShowPreview(true);
    }
  };

  const handleConfirmExtraction = () => {
    if (extractionResult) {
      onDataExtracted(extractionResult.extractedData);
      setShowPreview(false);
      setSelectedFile(null);
      clearExtraction();
    }
  };

  const handleCancelExtraction = () => {
    setShowPreview(false);
    clearExtraction();
  };

  const removeFile = () => {
    setSelectedFile(null);
    clearExtraction();
  };

  return (
    <>
      <Card className="border-blue-200 bg-blue-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedFile ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => document.getElementById(`file-upload-${aceleradorKey}`)?.click()}
                disabled={uploading}
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? "Subiendo..." : "Subir Archivo"}
              </Button>
              <input
                id={`file-upload-${aceleradorKey}`}
                type="file"
                accept={allowedFileTypes.map(t => `.${t}`).join(',')}
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <Dialog open={showRepoPicker} onOpenChange={setShowRepoPicker}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1">
                    <FileText className="w-4 h-4 mr-2" />
                    Traer del Repositorio
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <RepositoryFilePicker
                    onSelect={handleRepoSelection}
                    multiple={false}
                  />
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-sm">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">Listo para extraer</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={removeFile}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <Button
                onClick={handleExtract}
                disabled={extracting}
                className="w-full"
                size="lg"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                {extracting ? "Extrayendo información..." : "Extraer Información con IA"}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                La IA leerá el documento y llenará automáticamente los campos que encuentre
              </p>
            </div>
          )}

          <div className="text-xs text-muted-foreground border-t pt-3">
            <p className="font-medium mb-1">Formatos aceptados:</p>
            <div className="flex flex-wrap gap-1">
              {allowedFileTypes.map(type => (
                <Badge key={type} variant="outline" className="text-xs">
                  .{type}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {extractionResult && (
        <ExtractionPreviewModal
          open={showPreview}
          onClose={handleCancelExtraction}
          onConfirm={handleConfirmExtraction}
          extractionResult={extractionResult}
          fieldSchemas={expectedFields}
        />
      )}
    </>
  );
}
