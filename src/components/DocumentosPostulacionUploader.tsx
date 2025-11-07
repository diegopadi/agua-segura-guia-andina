import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFileManager, FileRecord } from "@/hooks/useFileManager";
import RepositoryFilePicker from "@/components/RepositoryFilePicker";
import { Upload, FileText, Trash2, FileCheck, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Documento {
  id: string;
  nombre: string;
  url: string;
  tipo: string;
  tamaño_bytes: number;
  fecha_subida: string;
  descripcion?: string;
}

interface DocumentosPostulacionUploaderProps {
  documentos: Documento[];
  onChange: (documentos: Documento[]) => void;
  minDocuments?: number;
  maxDocuments?: number;
}

export function DocumentosPostulacionUploader({
  documentos,
  onChange,
  minDocuments = 1,
  maxDocuments = 10
}: DocumentosPostulacionUploaderProps) {
  const { uploadFile, loading } = useFileManager();
  const { toast } = useToast();
  const [showRepoPicker, setShowRepoPicker] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    if (documentos.length + files.length > maxDocuments) {
      toast({
        title: "Límite excedido",
        description: `Solo puedes subir máximo ${maxDocuments} documentos`,
        variant: "destructive"
      });
      return;
    }

    const newDocs: Documento[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = await uploadFile(file, 'postulacion_cnpie');
      
      if (url) {
        newDocs.push({
          id: crypto.randomUUID(),
          nombre: file.name,
          url: url,
          tipo: file.type,
          tamaño_bytes: file.size,
          fecha_subida: new Date().toISOString()
        });
      }
    }

    onChange([...documentos, ...newDocs]);
    event.target.value = ''; // Reset input
  };

  const handleRepoSelection = (files: FileRecord[]) => {
    if (documentos.length + files.length > maxDocuments) {
      toast({
        title: "Límite excedido",
        description: `Solo puedes agregar máximo ${maxDocuments} documentos`,
        variant: "destructive"
      });
      return;
    }

    const newDocs: Documento[] = files.map(file => ({
      id: file.id,
      nombre: file.original_name || file.url.split('/').pop() || 'documento',
      url: file.url,
      tipo: file.file_type || 'application/pdf',
      tamaño_bytes: file.size_bytes,
      fecha_subida: file.created_at
    }));

    onChange([...documentos, ...newDocs]);
    setShowRepoPicker(false);
  };

  const removeDocumento = (id: string) => {
    onChange(documentos.filter(d => d.id !== id));
  };

  const updateDescripcion = (id: string, descripcion: string) => {
    onChange(documentos.map(d => 
      d.id === id ? { ...d, descripcion } : d
    ));
  };

  const totalSize = documentos.reduce((sum, d) => sum + d.tamaño_bytes, 0);
  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);

  return (
    <Card className="border-2 border-blue-300 bg-blue-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-blue-600" />
          Documentación de Postulación
        </CardTitle>
        <CardDescription>
          Sube TODOS los documentos que sustentan tu postulación al CNPIE 2025. 
          Estos estarán disponibles para todos los aceleradores.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Botones de carga */}
        {documentos.length < maxDocuments && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => document.getElementById('postulacion-upload')?.click()}
              disabled={loading}
            >
              <Upload className="w-4 h-4 mr-2" />
              {loading ? "Subiendo..." : "Subir Archivos"}
            </Button>
            <input
              id="postulacion-upload"
              type="file"
              accept=".pdf,.docx,.doc,.xlsx,.xls,.txt"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setShowRepoPicker(true)}
            >
              <FileText className="w-4 h-4 mr-2" />
              Desde Repositorio
            </Button>
          </div>
        )}

        {/* Lista de documentos */}
        {documentos.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                Documentos cargados ({documentos.length}/{maxDocuments})
              </span>
              <Badge variant="outline">{totalSizeMB} MB total</Badge>
            </div>

            {documentos.map((doc) => (
              <Card key={doc.id} className="bg-white">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{doc.nombre}</p>
                      <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{(doc.tamaño_bytes / (1024 * 1024)).toFixed(2)} MB</span>
                        <span>•</span>
                        <span>{new Date(doc.fecha_subida).toLocaleDateString()}</span>
                      </div>
                      <Input
                        placeholder="Descripción opcional (ej: Informe anual 2024)"
                        value={doc.descripcion || ''}
                        onChange={(e) => updateDescripcion(doc.id, e.target.value)}
                        className="mt-2 text-xs h-8"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDocumento(doc.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Mínimo {minDocuments} documento(s) requerido(s).</strong>
              <br />
              Incluye: informes de proyecto, evidencias de metodología, resultados de evaluaciones, planes curriculares, etc.
            </AlertDescription>
          </Alert>
        )}

        {/* Formatos aceptados */}
        <div className="text-xs text-muted-foreground border-t pt-3">
          <p className="font-medium mb-1">Formatos aceptados:</p>
          <div className="flex flex-wrap gap-1">
            {['pdf', 'docx', 'doc', 'xlsx', 'xls', 'txt'].map(type => (
              <Badge key={type} variant="outline" className="text-xs">.{type}</Badge>
            ))}
          </div>
        </div>
      </CardContent>

      {/* Modal de repositorio */}
      {showRepoPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold">Seleccionar del Repositorio</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowRepoPicker(false)}>
                ×
              </Button>
            </div>
            <div className="p-4">
              <RepositoryFilePicker
                onSelect={handleRepoSelection}
                multiple={true}
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
