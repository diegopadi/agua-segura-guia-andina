import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import { sanitizeFileName } from "@/lib/utils";

export interface FileRecord {
  id: string;
  user_id: string;
  url: string;
  file_type: string | null;
  size_bytes: number;
  created_at: string;
  original_name?: string; // Nombre original del archivo
}

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB por archivo
const MAX_STORAGE_BYTES = 500 * 1024 * 1024; // 500MB total

export function useFileManager() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchFiles = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los archivos",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  const getTotalStorageUsed = useCallback(() => {
    return files.reduce((total, file) => total + file.size_bytes, 0);
  }, [files]);

  const getStorageUsagePercentage = useCallback(() => {
    const used = getTotalStorageUsed();
    return (used / MAX_STORAGE_BYTES) * 100;
  }, [getTotalStorageUsed]);

  const uploadFile = async (file: File, fileType?: string): Promise<string | null> => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debe estar autenticado para subir archivos",
        variant: "destructive",
      });
      return null;
    }

    // Check file size limit (50MB per file)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast({
        title: "Archivo muy grande",
        description: `El archivo excede el límite de 50MB. Tamaño: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
        variant: "destructive",
      });
      return null;
    }

    // Check storage quota
    const currentUsage = getTotalStorageUsed();
    if (currentUsage + file.size > MAX_STORAGE_BYTES) {
      toast({
        title: "Cuota excedida",
        description: `El archivo excede su cuota de almacenamiento (${(MAX_STORAGE_BYTES / (1024 * 1024)).toFixed(0)}MB). Elimine otros archivos primero.`,
        variant: "destructive",
      });
      return null;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      // Generate unique filename preserving original name
      const sanitizedName = sanitizeFileName(file.name);
      const fileName = `${Date.now()}_${sanitizedName}`; // Timestamp + nombre limpio
      const filePath = `${user.id}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('user_uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('user_uploads')
        .getPublicUrl(filePath);

      // Save metadata
      const { error: dbError } = await supabase
        .from('files')
        .insert({
          user_id: user.id,
          url: urlData.publicUrl,
          file_type: fileType || 'documento',
          size_bytes: file.size,
          original_name: file.name, // Guardar nombre original
        });

      if (dbError) throw dbError;

      toast({
        title: "Archivo subido",
        description: `${file.name} se subió exitosamente`,
      });

      await fetchFiles(); // Refresh file list
      return urlData.publicUrl;

    } catch (error: any) {
      toast({
        title: "Error de subida",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const deleteFile = async (fileId: string, fileUrl: string) => {
    if (!user) return;

    try {
      // Extract file path from URL
      const url = new URL(fileUrl);
      const filePath = url.pathname.split('/').slice(-2).join('/'); // Get user_id/filename

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('user_uploads')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId)
        .eq('user_id', user.id);

      if (dbError) throw dbError;

      toast({
        title: "Archivo eliminado",
        description: "El archivo se eliminó exitosamente",
      });

      await fetchFiles(); // Refresh file list

    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el archivo",
        variant: "destructive",
      });
    }
  };

  const uploadMultipleFiles = async (files: FileList, fileType?: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const url = await uploadFile(files[i], fileType);
      if (url) {
        uploadedUrls.push(url);
      }
    }
    
    return uploadedUrls;
  };

  return {
    files,
    loading,
    uploadProgress,
    totalStorageUsed: getTotalStorageUsed(),
    storageUsagePercentage: getStorageUsagePercentage(),
    maxStorageBytes: MAX_STORAGE_BYTES,
    maxFileSize: MAX_FILE_SIZE_BYTES,
    fetchFiles,
    uploadFile,
    uploadMultipleFiles,
    deleteFile,
  };
}