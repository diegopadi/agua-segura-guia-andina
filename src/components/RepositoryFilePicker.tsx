import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileText, FolderOpen, CheckCircle2 } from "lucide-react";
import { useFileManager, FileRecord } from "@/hooks/useFileManager";
import { Badge } from "@/components/ui/badge";

interface RepositoryFilePickerProps {
  onSelect: (files: FileRecord[]) => void;
  multiple?: boolean;
  triggerLabel?: string;
  filterType?: string;
}

export default function RepositoryFilePicker({
  onSelect,
  multiple = false,
  triggerLabel = "Adjuntar desde Repositorio",
  filterType,
}: RepositoryFilePickerProps) {
  const { files, loading, fetchFiles } = useFileManager();
  const [open, setOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileRecord[]>([]);

  useEffect(() => {
    if (open) {
      fetchFiles();
    }
  }, [open, fetchFiles]);

  const filteredFiles = filterType
    ? files.filter((f) => f.file_type === filterType)
    : files;

  const toggleFileSelection = (file: FileRecord) => {
    if (multiple) {
      setSelectedFiles((prev) => {
        const isSelected = prev.find((f) => f.id === file.id);
        if (isSelected) {
          return prev.filter((f) => f.id !== file.id);
        } else {
          return [...prev, file];
        }
      });
    } else {
      setSelectedFiles([file]);
    }
  };

  const handleConfirm = () => {
    onSelect(selectedFiles);
    setSelectedFiles([]);
    setOpen(false);
  };

  const isSelected = (fileId: string) => {
    return selectedFiles.find((f) => f.id === fileId) !== undefined;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="font-medium">
          <FolderOpen className="w-4 h-4 mr-2" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Seleccionar desde Repositorio</DialogTitle>
          <DialogDescription>
            {multiple
              ? "Selecciona uno o más archivos de tu repositorio"
              : "Selecciona un archivo de tu repositorio"}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="text-center py-8 text-muted-foreground">
            Cargando archivos...
          </div>
        )}

        {!loading && filteredFiles.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No hay archivos en tu repositorio.{" "}
            <a href="/repositorio" className="text-primary underline">
              Sube algunos primero.
            </a>
          </div>
        )}

        {!loading && filteredFiles.length > 0 && (
          <div className="space-y-2">
            {filteredFiles.map((file) => {
              const fileName = file.url.split("/").pop() || "archivo";
              const selected = isSelected(file.id);

              return (
                <div
                  key={file.id}
                  onClick={() => toggleFileSelection(file)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-accent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-medium ${
                            (file.original_name || fileName).length > 10
                              ? "break-words"
                              : "truncate"
                          }`}
                        >
                          {file.original_name || fileName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {file.file_type && (
                            <Badge variant="secondary" className="text-xs">
                              {file.file_type}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {(file.size_bytes / (1024 * 1024)).toFixed(2)} MB
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(file.created_at).toLocaleDateString(
                              "es-PE"
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    {selected && (
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedFiles([]);
              setOpen(false);
            }}
          >
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={selectedFiles.length === 0}>
            Adjuntar {selectedFiles.length > 0 && `(${selectedFiles.length})`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
