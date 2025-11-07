import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExtractionResult, DocumentFieldSchema } from "@/types/document-extraction";
import { CheckCircle, AlertCircle, AlertTriangle } from "lucide-react";

interface ExtractionPreviewModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  extractionResult: ExtractionResult;
  fieldSchemas: DocumentFieldSchema[];
}

export function ExtractionPreviewModal({
  open,
  onClose,
  onConfirm,
  extractionResult,
  fieldSchemas
}: ExtractionPreviewModalProps) {
  const { 
    extractedData = {}, 
    confidence = {}, 
    fieldsFound = [], 
    fieldsMissing = [], 
    warnings = [] 
  } = extractionResult || {};

  const fieldLabels = fieldSchemas.reduce((acc, field) => {
    acc[field.fieldName] = field.label;
    return acc;
  }, {} as Record<string, string>);

  const avgConfidence = fieldsFound.length > 0
    ? Math.round((fieldsFound.reduce((sum, field) => sum + (confidence[field] || 0), 0) / fieldsFound.length) * 100)
    : 0;

  const formatValue = (value: any): string => {
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : 'Lista vacía';
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Información Extraída del Documento</DialogTitle>
          <DialogDescription>
            Revisa la información que la IA detectó en tu documento antes de llenar el formulario
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Resumen */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumen de Extracción</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Campos encontrados</p>
                  <p className="text-2xl font-bold text-green-600">{fieldsFound.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Campos faltantes</p>
                  <p className="text-2xl font-bold text-yellow-600">{fieldsMissing.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Confianza promedio</p>
                  <p className="text-2xl font-bold">{avgConfidence}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campos extraídos */}
          {fieldsFound.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold">Campos detectados:</h4>
              {fieldsFound.map((fieldName) => {
                const value = extractedData[fieldName];
                const conf = confidence[fieldName] || 0;
                
                return (
                  <Card key={fieldName} className="border-green-200">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2 gap-2">
                            <h5 className="font-medium">{fieldLabels[fieldName] || fieldName}</h5>
                            <Badge variant="outline" className="bg-green-50 flex-shrink-0">
                              {Math.round(conf * 100)}% confianza
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground break-words whitespace-pre-wrap line-clamp-4">
                            {formatValue(value)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Campos faltantes */}
          {fieldsMissing.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-yellow-600">Campos que deberás completar manualmente:</h4>
              {fieldsMissing.map(fieldName => (
                <div key={fieldName} className="flex items-center gap-2 p-3 bg-yellow-50 rounded border border-yellow-200">
                  <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                  <span className="text-sm">{fieldLabels[fieldName] || fieldName}</span>
                </div>
              ))}
            </div>
          )}

          {/* Advertencias */}
          {warnings.length > 0 && (
            <Alert variant="default" className="border-yellow-500">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Advertencias</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-4 space-y-1 mt-2">
                  {warnings.map((warning, idx) => (
                    <li key={idx} className="text-sm">{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onConfirm}>
            Llenar Formulario con Estos Datos
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
