import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Sparkles, Loader2, Trash2 } from "lucide-react";
import { useAcceleratorsSummary } from "@/hooks/useAcceleratorsSummary";
import RepositoryFilePicker from "@/components/RepositoryFilePicker";
import { FileRecord } from "@/hooks/useFileManager";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function ResumenDiagnostico() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [experiencias, setExperiencias] = useState<FileRecord[]>([]);
  const { hallazgos, loading, generating, generateSummary, hasData } =
    useAcceleratorsSummary();

  useEffect(() => {
    // Solo intentar generar el resumen si el usuario está autenticado
    if (user && !hasData && !loading && !generating) {
      generateSummary();
    }
  }, [user, hasData, loading, generating, generateSummary]);

  const handleSelectFiles = (files: FileRecord[]) => {
    setExperiencias([...experiencias, ...files]);
    toast({
      title: "Archivos adjuntados",
      description: `${files.length} archivo(s) agregado(s)`,
    });
  };

  const quitarExperiencia = (id: string) => {
    setExperiencias(experiencias.filter((e) => e.id !== id));
  };

  return (
    <Card
      className="mb-6 border-0 shadow-md"
      style={{ backgroundColor: "#DDF4F2" }}
    >
      <CardHeader>
        <CardTitle
          className="flex items-center gap-2"
          style={{ color: "#005C6B" }}
        >
          <FileText className="w-5 h-5" />
          Resumen de tu diagnóstico
        </CardTitle>
        <CardDescription style={{ color: "#1A1A1A", opacity: 0.7 }}>
          Los datos mostrados son solo de lectura; no editables.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading || generating ? (
          <div className="flex items-center justify-center py-8">
            <Loader2
              className="w-8 h-8 animate-spin"
              style={{ color: "#00A6A6" }}
            />
            <span className="ml-3" style={{ color: "#005C6B" }}>
              Generando resumen con IA...
            </span>
          </div>
        ) : !hasData ? (
          <div className="py-8 text-center">
            <p className="mb-4" style={{ color: "#1A1A1A" }}>
              No se encontraron datos de diagnóstico. Completa los aceleradores
              1, 2 y 3 primero.
            </p>
            <Button
              onClick={generateSummary}
              className="text-white font-medium"
              style={{ backgroundColor: "#00A6A6" }}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Intentar generar resumen
            </Button>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium" style={{ color: "#005C6B" }}>
                  Docente:
                </p>
                <p style={{ color: "#1A1A1A" }}>{hallazgos?.docente}</p>
              </div>
              <div>
                <p className="font-medium" style={{ color: "#005C6B" }}>
                  Institución:
                </p>
                <p style={{ color: "#1A1A1A" }}>{hallazgos?.institucion}</p>
              </div>
              <div>
                <p className="font-medium" style={{ color: "#005C6B" }}>
                  Región:
                </p>
                <p style={{ color: "#1A1A1A" }}>{hallazgos?.region}</p>
              </div>
              <div>
                <p className="font-medium" style={{ color: "#005C6B" }}>
                  Fecha:
                </p>
                <p style={{ color: "#1A1A1A" }}>{hallazgos?.fecha}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium" style={{ color: "#005C6B" }}>
                  Hallazgos clave:
                </p>
                <Button
                  onClick={generateSummary}
                  variant="ghost"
                  size="sm"
                  disabled={generating}
                  className="text-xs"
                  style={{ color: "#00A6A6" }}
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Regenerar
                </Button>
              </div>
              <ul
                className="list-disc list-inside space-y-1 text-sm"
                style={{ color: "#1A1A1A" }}
              >
                {hallazgos?.hallazgos.map((hallazgo, i) => (
                  <li key={i}>{hallazgo}</li>
                ))}
              </ul>
            </div>
          </>
        )}

        <div>
          <p className="font-medium mb-3" style={{ color: "#005C6B" }}>
            Experiencias registradas en tu repositorio:
          </p>

          {experiencias.length > 0 ? (
            <div className="space-y-2 mb-3">
              {experiencias.map((exp) => (
                <div
                  key={exp.id}
                  className="p-3 rounded-lg flex items-center justify-between"
                  style={{ backgroundColor: "#E6F4F1" }}
                >
                  <div className="flex-1">
                    <p
                      className="font-medium text-sm"
                      style={{ color: "#1A1A1A" }}
                    >
                      {exp.url.split("/").pop()}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <span
                        className="text-xs px-2 py-1 rounded"
                        style={{
                          backgroundColor: "#DDF4F2",
                          color: "#005C6B",
                        }}
                      >
                        {exp.file_type || "documento"}
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: "#1A1A1A", opacity: 0.6 }}
                      >
                        {(exp.size_bytes / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => quitarExperiencia(exp.id)}
                  >
                    <Trash2 className="w-4 h-4" style={{ color: "#005C6B" }} />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p
              className="text-sm mb-3"
              style={{ color: "#1A1A1A", opacity: 0.7 }}
            >
              No hay experiencias adjuntadas. Los documentos de tu repositorio
              serán utilizados por la IA.
            </p>
          )}

          <RepositoryFilePicker onSelect={handleSelectFiles} />
        </div>
      </CardContent>
    </Card>
  );
}
