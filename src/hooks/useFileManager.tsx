import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface FileRecord {
  id: string;
  user_id: string;
  url: string;
  file_type: string | null;
  size_bytes: number;
  created_at: string;
}

const MAX_STORAGE_BYTES = 100 * 1024 * 1024; // 100MB

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

    // Check storage quota
    const currentUsage = getTotalStorageUsed();
    if (currentUsage + file.size > MAX_STORAGE_BYTES) {
      toast({
        title: "Cuota excedida",
        description: `El archivo excede su cuota de 100MB. Elimine otros archivos primero.`,
        variant: "destructive",
      });
      return null;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
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

  return {
    files,
    loading,
    uploadProgress,
    totalStorageUsed: getTotalStorageUsed(),
    storageUsagePercentage: getStorageUsagePercentage(),
    maxStorageBytes: MAX_STORAGE_BYTES,
    fetchFiles,
    uploadFile,
    deleteFile,
  };
}