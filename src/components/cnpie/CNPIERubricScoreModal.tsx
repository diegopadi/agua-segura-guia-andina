import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CNPIERubricScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation: any;
  loading: boolean;
  categoria: '2A' | '2B' | '2C';
}

export function CNPIERubricScoreModal({
  isOpen,
  onClose,
  evaluation,
  loading,
  categoria
}: CNPIERubricScoreModalProps) {
  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">Analizando tu proyecto con la rúbrica CNPIE...</p>
            <p className="text-sm text-muted-foreground mt-2">Esto puede tomar unos momentos</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!evaluation) return null;

  // Límites de caracteres por criterio CNPIE 2A
  const caracteresLimites: Record<string, number> = {
    'Intencionalidad': 3000,
    'Originalidad': 8000,
    'Pertinencia': 2000,
    'Impacto': 4000,
    'Participación': 3000,
    'Sostenibilidad': 2500,
    'Reflexión': 1500
  };

  const getColorByPercentage = (percentage: number) => {
    if (percentage >= 75) return "text-green-600";
    if (percentage >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Evaluación Predictiva - Proyecto {categoria}
          </DialogTitle>
          <DialogDescription>
            Análisis basado en las rúbricas oficiales del CNPIE 2025
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Puntaje Total */}
            <Card className="border-primary/20">
              <CardContent className="pt-6">
                <div className="text-center mb-4">
                  <p className="text-sm text-muted-foreground mb-2">Puntaje Total Estimado</p>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className={`text-5xl font-bold ${getColorByPercentage(evaluation.porcentaje_cumplimiento)}`}>
                      {evaluation.puntaje_total}
                    </span>
                    <span className="text-2xl text-muted-foreground">/ {evaluation.puntaje_maximo}</span>
                  </div>
                </div>
                <Progress 
                  value={evaluation.porcentaje_cumplimiento} 
                  className="h-3"
                />
                <p className="text-center mt-2 text-sm font-medium">
                  {evaluation.porcentaje_cumplimiento}% de cumplimiento
                </p>
              </CardContent>
            </Card>

            {/* Puntajes por Criterio */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Desglose por Criterio
              </h3>
              <div className="space-y-3">
                {Object.entries(evaluation.puntajes_criterios).map(([criterio, datos]: [string, any]) => {
                  const limiteCaracteres = caracteresLimites[criterio] || 3000;
                  const caracteresUsados = datos.caracteres_usados || 0;
                  const porcentajeCaracteres = Math.round((caracteresUsados / limiteCaracteres) * 100);
                  const excedeCaracteres = caracteresUsados > limiteCaracteres;
                  
                  return (
                    <Card key={criterio}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <span className="font-medium">{criterio}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">
                                Caracteres: 
                              </span>
                              <span className={`text-xs font-mono ${excedeCaracteres ? 'text-red-600 font-bold' : 'text-green-600'}`}>
                                {caracteresUsados.toLocaleString()} / {limiteCaracteres.toLocaleString()}
                              </span>
                              {excedeCaracteres && (
                                <Badge variant="destructive" className="text-xs">¡Excede límite!</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-lg font-bold ${getColorByPercentage(datos.porcentaje)}`}>
                                {datos.puntaje}
                              </span>
                              <span className="text-muted-foreground text-sm">/ {datos.maximo} pts</span>
                            </div>
                            <Badge variant={datos.porcentaje >= 75 ? "default" : "secondary"}>
                              {datos.porcentaje}%
                            </Badge>
                          </div>
                        </div>
                        <Progress value={datos.porcentaje} className="h-2 mb-2" />
                        
                        {datos.justificacion && (
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            "{datos.justificacion}"
                          </p>
                        )}
                        
                        {excedeCaracteres && (
                          <Alert className="mt-2 py-2 border-red-500 bg-red-50">
                            <AlertDescription className="text-xs text-red-900">
                              Debes reducir el texto en {(caracteresUsados - limiteCaracteres).toLocaleString()} caracteres para cumplir con los requisitos de CNPIE.
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Áreas Fuertes */}
            {evaluation.areas_fuertes && evaluation.areas_fuertes.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  Fortalezas Identificadas
                </h3>
                <ul className="space-y-2">
                  {evaluation.areas_fuertes.map((area: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-green-600">•</span>
                      <span className="text-sm">{area}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Áreas a Mejorar */}
            {evaluation.areas_mejorar && evaluation.areas_mejorar.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-yellow-600">
                  <AlertCircle className="w-4 h-4" />
                  Áreas a Fortalecer
                </h3>
                <ul className="space-y-2">
                  {evaluation.areas_mejorar.map((area: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-yellow-600">•</span>
                      <span className="text-sm">{area}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recomendaciones IA */}
            {evaluation.recomendaciones_ia && evaluation.recomendaciones_ia.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Recomendaciones de la IA</h3>
                <div className="space-y-2">
                  {evaluation.recomendaciones_ia.map((rec: string, idx: number) => (
                    <Card key={idx} className="bg-muted/50">
                      <CardContent className="pt-3 pb-3">
                        <p className="text-sm">{rec}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
