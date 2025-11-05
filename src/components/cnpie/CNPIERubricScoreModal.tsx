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
import { Loader2, TrendingUp, AlertCircle, CheckCircle2, Target } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

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

  // Calcular puntaje máximo con fallback defensivo
  const puntajeMaximoCalculado = evaluation.puntaje_maximo || 
    Object.values(evaluation.puntajes_criterios).reduce(
      (sum: number, criterio: any) => sum + (criterio.maximo || 0), 
      0
    ) || 100;

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

  // Mapeo de criterio → acelerador para navegación
  const criterioToAcelerador: Record<string, { numero: number, ruta: string, etapa: string }> = {
    'Intencionalidad': { numero: 1, ruta: '/cnpie/2a/etapa1/acelerador1', etapa: 'Etapa 1' },
    'Originalidad': { numero: 2, ruta: '/cnpie/2a/etapa2/acelerador2', etapa: 'Etapa 2' },
    'Impacto': { numero: 3, ruta: '/cnpie/2a/etapa2/acelerador3', etapa: 'Etapa 2' },
    'Participación': { numero: 4, ruta: '/cnpie/2a/etapa2/acelerador4', etapa: 'Etapa 2' },
    'Sostenibilidad': { numero: 5, ruta: '/cnpie/2a/etapa2/acelerador5', etapa: 'Etapa 2' },
    'Pertinencia': { numero: 6, ruta: '/cnpie/2a/etapa2/acelerador6', etapa: 'Etapa 2' },
    'Reflexión': { numero: 7, ruta: '/cnpie/2a/etapa2/acelerador7', etapa: 'Etapa 2' }
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
            {/* Puntaje Total - Diseño Mejorado */}
            <div className="relative overflow-hidden rounded-lg border-2 border-primary/20 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-6">
              <div className="text-center">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  Puntaje Total Estimado
                </p>
                
                <div className="flex items-baseline justify-center gap-3 mb-4">
                  <span className={`text-6xl font-black ${getColorByPercentage(evaluation.porcentaje_cumplimiento)}`}>
                    {evaluation.puntaje_total}
                  </span>
                  <span className="text-3xl font-bold text-muted-foreground">/ {puntajeMaximoCalculado}</span>
                  <span className="text-lg text-muted-foreground">puntos</span>
                </div>
                
                <Progress 
                  value={evaluation.porcentaje_cumplimiento} 
                  className="h-4 mb-3"
                />
                
                <div className="flex items-center justify-center gap-4 text-sm flex-wrap">
                  <Badge variant={evaluation.porcentaje_cumplimiento >= 85 ? "default" : "secondary"} className="text-base px-4 py-1">
                    {evaluation.porcentaje_cumplimiento}% de cumplimiento
                  </Badge>
                  
                  {evaluation.porcentaje_cumplimiento < 85 && (
                    <span className="text-xs text-muted-foreground">
                      (85%+ recomendado para ser competitivo)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Desglose por Criterio - Diseño mejorado con navegación */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Desglose por Criterio
              </h3>
              <div className="space-y-3">
                {Object.entries(evaluation.puntajes_criterios).map(([criterio, datos]: [string, any]) => {
                  const limiteCaracteres = caracteresLimites[criterio] || 3000;
                  const caracteresUsados = datos.caracteres_usados || 0;
                  const excedeCaracteres = caracteresUsados > limiteCaracteres;
                  const aceleradorInfo = criterioToAcelerador[criterio];
                  
                  // Generar estrellas según porcentaje
                  const estrellas = Math.round((datos.porcentaje / 100) * 5);
                  const estrellasViz = '⭐'.repeat(estrellas) + '☆'.repeat(5 - estrellas);
                  
                  return (
                    <Card key={criterio} className="border-2 hover:border-primary/50 transition-colors">
                      <CardContent className="pt-4">
                        {/* Header con número de acelerador */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                Acelerador {aceleradorInfo?.numero}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{aceleradorInfo?.etapa}</span>
                            </div>
                            <h4 className="font-bold text-lg">{criterio}</h4>
                          </div>
                          <div className="text-right">
                            <div className="flex items-baseline gap-1">
                              <span className={`text-3xl font-bold ${getColorByPercentage(datos.porcentaje)}`}>
                                {datos.puntaje}
                              </span>
                              <span className="text-muted-foreground font-medium">/ {datos.maximo} pts</span>
                            </div>
                            <div className="text-sm mt-1">{estrellasViz}</div>
                          </div>
                        </div>
                        
                        <Progress value={datos.porcentaje} className="h-2 mb-3" />
                        
                        {/* Caracteres */}
                        <div className="bg-muted/50 p-2 rounded text-xs mb-2">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Caracteres usados:</span>
                            <span className={`font-mono font-bold ${excedeCaracteres ? 'text-red-600' : 'text-green-600'}`}>
                              {caracteresUsados.toLocaleString()} / {limiteCaracteres.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        
                        {/* Justificación */}
                        {datos.justificacion && (
                          <p className="text-xs text-muted-foreground italic mb-3 border-l-2 border-primary/30 pl-2">
                            💡 {datos.justificacion}
                          </p>
                        )}
                        
                        {/* Alerta si excede caracteres */}
                        {excedeCaracteres && (
                          <Alert className="mb-3 py-2 border-red-500 bg-red-50 dark:bg-red-950">
                            <AlertCircle className="h-3 w-3" />
                            <AlertDescription className="text-xs">
                              <strong>Reduce {(caracteresUsados - limiteCaracteres).toLocaleString()} caracteres</strong> para cumplir requisitos CNPIE
                            </AlertDescription>
                          </Alert>
                        )}
                        
                        {/* Botón de navegación */}
                        {aceleradorInfo && (
                          <Button 
                            variant={datos.porcentaje < 75 ? "default" : "outline"}
                            size="sm" 
                            className="w-full"
                            onClick={() => {
                              onClose();
                              window.location.href = aceleradorInfo.ruta;
                            }}
                          >
                            {datos.porcentaje < 75 ? '🔧 Mejorar' : '👁️ Revisar'} en Acelerador {aceleradorInfo.numero}
                          </Button>
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

            {/* Recomendaciones Prioritarias */}
            {evaluation.recomendaciones_ia && evaluation.recomendaciones_ia.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Recomendaciones Prioritarias {typeof evaluation.recomendaciones_ia[0] === 'object' && '(ordenadas por impacto)'}
                </h3>
                <div className="space-y-3">
                  {evaluation.recomendaciones_ia
                    .sort((a: any, b: any) => {
                      if (typeof a === 'object' && typeof b === 'object') {
                        return (b.puntos_potenciales || 0) - (a.puntos_potenciales || 0);
                      }
                      return 0;
                    })
                    .map((rec: any, idx: number) => {
                      const isObjeto = typeof rec === 'object';
                      
                      if (isObjeto) {
                        const aceleradorInfo = criterioToAcelerador[rec.criterio];
                        return (
                          <Card key={idx} className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
                            <CardContent className="pt-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <Badge variant={rec.prioridad === 'alta' ? 'destructive' : rec.prioridad === 'media' ? 'default' : 'secondary'} className="mb-2">
                                    {rec.prioridad?.toUpperCase() || 'MEDIA'}
                                  </Badge>
                                  <h4 className="font-semibold text-sm">
                                    {rec.criterio} (Acelerador {rec.acelerador})
                                  </h4>
                                </div>
                                <Badge className="bg-green-600 text-white">
                                  +{rec.puntos_potenciales} pts
                                </Badge>
                              </div>
                              
                              <p className="text-sm mb-3">{rec.accion}</p>
                              
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 flex-wrap">
                                <span>Actual: {rec.puntaje_actual}/{rec.puntaje_maximo} pts</span>
                                <span>→</span>
                                <span className="text-green-600 font-medium">
                                  Potencial: {rec.puntaje_actual + rec.puntos_potenciales}/{rec.puntaje_maximo} pts
                                </span>
                              </div>
                              
                              {aceleradorInfo && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-full mt-2"
                                  onClick={() => {
                                    onClose();
                                    window.location.href = aceleradorInfo.ruta;
                                  }}
                                >
                                  🔧 Ir a Acelerador {rec.acelerador}
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        );
                      } else {
                        // Formato antiguo (string simple)
                        return (
                          <Card key={idx} className="bg-muted/50">
                            <CardContent className="pt-3 pb-3">
                              <p className="text-sm">{rec}</p>
                            </CardContent>
                          </Card>
                        );
                      }
                    })}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
