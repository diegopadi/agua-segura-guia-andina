import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, File, CheckCircle, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';

interface FileUploaderStepProps {
  sessionId: string;
  onNext: () => void;
  onPrev: () => void;
  sessionData: any;
  onUpdateSessionData: (data: any) => void;
}

export const FileUploaderStep: React.FC<FileUploaderStepProps> = ({
  sessionId,
  onNext,
  onPrev,
  sessionData,
  onUpdateSessionData
}) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(sessionData?.uploaded_file || null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast({
        title: "Tipo de archivo no válido",
        description: "Por favor sube un archivo PDF del Informe de Priorización del Acelerador 3.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/acelerador4/${sessionId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('user_uploads')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user_uploads')
        .getPublicUrl(fileName);

      // Save file info to database
      const { error: fileError } = await supabase
        .from('files')
        .insert({
          user_id: user.id,
          url: publicUrl,
          file_type: file.type,
          size_bytes: file.size
        });

      if (fileError) throw fileError;

      const fileData = {
        name: file.name,
        url: publicUrl,
        type: file.type,
        size: file.size
      };

      setUploadedFile(fileData);
      onUpdateSessionData({
        ...sessionData,
        uploaded_file: fileData
      });

      toast({
        title: "Archivo subido exitosamente",
        description: "El informe de priorización ha sido cargado correctamente."
      });

    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error al subir archivo",
        description: error.message || "Hubo un problema al subir el archivo.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    onUpdateSessionData({
      ...sessionData,
      uploaded_file: null
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Cargar Informe de Priorización
          </CardTitle>
          <CardDescription>
            Sube el producto final del Acelerador 3 (Informe de Priorización) en formato PDF.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!uploadedFile ? (
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Arrastra el archivo PDF aquí o haz clic para seleccionar
                </p>
                <Button
                  variant="outline"
                  disabled={uploading}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  {uploading ? 'Subiendo...' : 'Seleccionar archivo'}
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <File className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-medium">{uploadedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeFile}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev}>
          Anterior
        </Button>
        <Button 
          onClick={onNext}
          disabled={!uploadedFile}
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};