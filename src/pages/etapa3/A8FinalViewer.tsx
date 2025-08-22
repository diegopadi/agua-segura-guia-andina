import React, { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Download, Copy, Printer, AlertCircle, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useEtapa3V2 } from "@/hooks/useEtapa3V2";

export default function A8FinalViewer() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { unidad, rubrica, sesiones } = useEtapa3V2();

  useEffect(() => {
    console.log('[A8:VIEWER_DIAGNOSTIC]', {
      hasUnidad: !!unidad?.id,
      hasRubrica: !!rubrica?.id || !!rubrica?.estructura?.criteria,
      sesiones: sesiones?.length || 0
    });
  }, [unidad, rubrica, sesiones]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = async () => {
    try {
      const textContent = buildPlainTextDocument();
      await navigator.clipboard.writeText(textContent);
      toast({
        title: "Copiado",
        description: "Documento copiado al portapapeles"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar el documento",
        variant: "destructive"
      });
    }
  };

  const handleExportPDF = () => {
    // Use print as fallback for PDF export
    window.print();
  };

  const buildPlainTextDocument = (): string => {
    const sections = [];

    // I. Datos de la Unidad (A6)
    sections.push(`DOCUMENTO INTEGRADO - UNIDAD DE APRENDIZAJE

I. DATOS INFORMATIVOS
Título: ${unidad?.titulo || "—"}
Área Curricular: ${unidad?.area_curricular || "—"}
Grado: ${unidad?.grado || "—"}
Número de Sesiones: ${unidad?.numero_sesiones || "—"}
Duración por Sesión: ${unidad?.duracion_min || "—"} minutos
Propósito: ${unidad?.proposito || "—"}`);

    // II. Contexto y Diagnóstico (A6)
    if (unidad?.diagnostico_text) {
      sections.push(`II. CONTEXTO Y DIAGNÓSTICO
${unidad.diagnostico_text.slice(0, 2000)}${unidad.diagnostico_text.length > 2000 ? '...' : ''}`);
    }

    if (unidad?.ia_recomendaciones) {
      const recs = typeof unidad.ia_recomendaciones === 'string' 
        ? unidad.ia_recomendaciones 
        : JSON.stringify(unidad.ia_recomendaciones, null, 2);
      sections.push(`III. RECOMENDACIONES PEDAGÓGICAS
${recs.slice(0, 1500)}${recs.length > 1500 ? '...' : ''}`);
    }

    // IV. Competencias (A6)
    if (unidad?.competencias_ids) {
      const competencias = Array.isArray(unidad.competencias_ids) 
        ? unidad.competencias_ids.join(', ') 
        : unidad.competencias_ids;
      sections.push(`IV. COMPETENCIAS Y CAPACIDADES
Competencias seleccionadas: ${competencias}
Evidencias: ${unidad?.evidencias || "—"}`);
    }

    // V. Rúbrica de Evaluación (A7)
    if (rubrica?.estructura?.criteria && Array.isArray(rubrica.estructura.criteria)) {
      sections.push(`V. RÚBRICA DE EVALUACIÓN

Criterios de evaluación:`);
      
      rubrica.estructura.criteria.forEach((criterio: any, index: number) => {
        sections.push(`\nCriterio ${index + 1}: ${criterio.criterio || criterio.descripcion || 'Sin descripción'}
- Inicio: ${criterio.descriptores?.['Inicio'] || 'No definido'}
- Proceso: ${criterio.descriptores?.['Proceso'] || 'No definido'} 
- Logro: ${criterio.descriptores?.['Logro'] || 'No definido'}`);
      });
    }

    // VI. Estructura de Sesiones (A8)
    if (sesiones && Array.isArray(sesiones) && sesiones.length > 0) {
      sections.push(`VI. ESTRUCTURA DETALLADA DE SESIONES`);
      
      sesiones.forEach((sesion: any, index: number) => {
        sections.push(`\nSESIÓN ${index + 1}: ${sesion.titulo || 'Sin título'}

INICIO:
${sesion.inicio || 'No definido'}

DESARROLLO:
${sesion.desarrollo || 'No definido'}

CIERRE:
${sesion.cierre || 'No definido'}

EVIDENCIAS:
${Array.isArray(sesion.evidencias) ? sesion.evidencias.join(', ') : sesion.evidencias || 'No definidas'}

RÚBRICA DE SESIÓN:`);

        if (sesion.rubrica_sesion?.criteria && Array.isArray(sesion.rubrica_sesion.criteria)) {
          sesion.rubrica_sesion.criteria.forEach((criterio: any, critIndex: number) => {
            sections.push(`  ${critIndex + 1}. ${criterio.descripcion || criterio.nombre || 'Sin descripción'}`);
          });
        }
      });
    }

    return sections.join('\n\n');
  };

  if (!unidad) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay datos de unidad disponibles</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header with actions */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/etapa3/acelerador8')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a A8
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Documento Completo - Unidad de Aprendizaje</h1>
            <p className="text-muted-foreground">
              Integración de A6 (Unidad), A7 (Rúbrica) y A8 (Sesiones)
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleCopyText}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Copiar texto
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExportPDF}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar PDF
          </Button>
          <Button 
            variant="outline" 
            onClick={handlePrint}
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Document content */}
      <div className="print:shadow-none">
        <ScrollArea className="h-[calc(100vh-200px)] print:h-auto">
          <div className="space-y-6 print:space-y-4">
            
            {/* I. Datos de la Unidad (A6) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  I. Datos Informativos
                </CardTitle>
                <CardDescription>Información básica de la unidad de aprendizaje</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <strong>Título:</strong> {unidad.titulo || "—"}
                  </div>
                  <div>
                    <strong>Área Curricular:</strong> {unidad.area_curricular || "—"}
                  </div>
                  <div>
                    <strong>Grado:</strong> {unidad.grado || "—"}
                  </div>
                  <div>
                    <strong>Número de Sesiones:</strong> {unidad.numero_sesiones || "—"}
                  </div>
                  <div>
                    <strong>Duración por Sesión:</strong> {unidad.duracion_min || "—"} minutos
                  </div>
                </div>
                <div>
                  <strong>Propósito:</strong>
                  <p className="mt-2 text-sm">{unidad.proposito || "—"}</p>
                </div>
              </CardContent>
            </Card>

            {/* II. Contexto y Diagnóstico */}
            {unidad.diagnostico_text && (
              <Card>
                <CardHeader>
                  <CardTitle>II. Contexto y Diagnóstico</CardTitle>
                  <CardDescription>Análisis del contexto educativo</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm whitespace-pre-wrap bg-muted p-4 rounded-lg">
                    {unidad.diagnostico_text.slice(0, 2000)}
                    {unidad.diagnostico_text.length > 2000 && '...'}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* III. Recomendaciones */}
            {unidad.ia_recomendaciones && (
              <Card>
                <CardHeader>
                  <CardTitle>III. Recomendaciones Pedagógicas</CardTitle>
                  <CardDescription>Sugerencias basadas en el análisis inicial</CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    try {
                      const recomendacionesStr = typeof unidad.ia_recomendaciones === 'string' 
                        ? unidad.ia_recomendaciones 
                        : JSON.stringify(unidad.ia_recomendaciones);
                      
                      const parsed = JSON.parse(recomendacionesStr);
                      
                      if (parsed.recomendaciones && Array.isArray(parsed.recomendaciones) && parsed.recomendaciones.length > 0) {
                        return (
                          <div className="space-y-4">
                            {/* Coherencia Global */}
                            <div className="p-3 bg-muted/50 rounded-lg">
                              <div className="text-sm font-medium mb-2">
                                Coherencia Global: {parsed.coherencia_global || 'No especificada'}%
                              </div>
                              {parsed.hallazgos_clave && (
                                <div className="text-xs text-muted-foreground">
                                  {Array.isArray(parsed.hallazgos_clave) ? parsed.hallazgos_clave.length : 0} hallazgos identificados
                                </div>
                              )}
                            </div>
                            
                            {/* Recomendaciones */}
                            <div className="space-y-3">
                              {parsed.recomendaciones.map((rec: any, index: number) => (
                                <div key={index} className="border rounded-lg p-4 bg-card">
                                  <div className="flex items-start justify-between mb-3">
                                    <h4 className="font-medium text-sm flex-1">{rec.titulo || `Recomendación ${index + 1}`}</h4>
                                    <div className="flex gap-2 ml-3">
                                      {rec.impacto && (
                                        <span className={`px-2 py-1 rounded text-xs ${
                                          rec.impacto === 'alto' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                                          rec.impacto === 'medio' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                                          'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                        }`}>
                                          Impacto: {rec.impacto}
                                        </span>
                                      )}
                                      {rec.esfuerzo && (
                                        <span className={`px-2 py-1 rounded text-xs ${
                                          rec.esfuerzo === 'alto' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
                                          rec.esfuerzo === 'medio' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                                          'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                                        }`}>
                                          Esfuerzo: {rec.esfuerzo}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {rec.vinculo_diagnostico && (
                                    <p className="text-xs text-muted-foreground mb-3 italic">
                                      Vínculo: {rec.vinculo_diagnostico}
                                    </p>
                                  )}
                                  
                                  <div className="space-y-3 text-sm">
                                    {rec.por_que && (
                                      <div>
                                        <h5 className="font-medium text-blue-700 dark:text-blue-300 mb-1">¿Por qué es importante?</h5>
                                        <p className="text-muted-foreground">{rec.por_que}</p>
                                      </div>
                                    )}
                                    
                                    {rec.como && (
                                      <div>
                                        <h5 className="font-medium text-green-700 dark:text-green-300 mb-1">¿Cómo implementarlo?</h5>
                                        {Array.isArray(rec.como) ? (
                                          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                                            {rec.como.map((paso: string, pasoIndex: number) => (
                                              <li key={pasoIndex}>{paso}</li>
                                            ))}
                                          </ol>
                                        ) : (
                                          <p className="text-muted-foreground">{rec.como}</p>
                                        )}
                                      </div>
                                    )}
                                    
                                    {rec.ejemplo && (
                                      <div>
                                        <h5 className="font-medium text-purple-700 dark:text-purple-300 mb-1">Ejemplo</h5>
                                        <p className="text-muted-foreground italic">{rec.ejemplo}</p>
                                      </div>
                                    )}
                                    
                                     {rec.recursos && rec.recursos.length > 0 && (
                                       <div>
                                         <h5 className="font-medium text-orange-700 dark:text-orange-300 mb-1">Recursos</h5>
                                         <ul className="list-disc list-inside text-muted-foreground">
                                           {rec.recursos.map((recurso: any, recursoIndex: number) => (
                                             <li key={recursoIndex}>
                                               {typeof recurso === 'string' ? (
                                                 recurso
                                               ) : typeof recurso === 'object' && recurso !== null ? (
                                                 <div>
                                                   {recurso.cita && <span className="font-medium">"{recurso.cita}"</span>}
                                                   {recurso.ubicacion && (
                                                     <span className="text-xs text-muted-foreground ml-2">
                                                       ({recurso.ubicacion})
                                                     </span>
                                                   )}
                                                   {!recurso.cita && !recurso.ubicacion && (
                                                     <span>{JSON.stringify(recurso)}</span>
                                                   )}
                                                 </div>
                                               ) : (
                                                 String(recurso)
                                               )}
                                             </li>
                                           ))}
                                         </ul>
                                       </div>
                                     )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      } else {
                        // Fallback for non-structured JSON
                        return (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-orange-600 text-sm">
                              <AlertCircle className="h-4 w-4" />
                              <span>Formato de recomendaciones no estructurado</span>
                            </div>
                            <div className="text-sm whitespace-pre-wrap bg-muted p-4 rounded-lg">
                              {recomendacionesStr.slice(0, 1500)}
                              {recomendacionesStr.length > 1500 && '...'}
                            </div>
                          </div>
                        );
                      }
                    } catch (error) {
                      // Fallback for invalid JSON
                      const recomendacionesStr = typeof unidad.ia_recomendaciones === 'string' 
                        ? unidad.ia_recomendaciones 
                        : String(unidad.ia_recomendaciones);
                      
                      return (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-orange-600 text-sm">
                            <AlertCircle className="h-4 w-4" />
                            <span>Error parseando recomendaciones - mostrando texto plano</span>
                          </div>
                          <div className="text-sm whitespace-pre-wrap bg-muted p-4 rounded-lg">
                            {recomendacionesStr.slice(0, 1500)}
                            {recomendacionesStr.length > 1500 && '...'}
                          </div>
                        </div>
                      );
                    }
                  })()}
                </CardContent>
              </Card>
            )}

            {/* IV. Competencias */}
            <Card>
              <CardHeader>
                <CardTitle>IV. Competencias y Capacidades</CardTitle>
                <CardDescription>Competencias seleccionadas para la unidad</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <strong>Competencias:</strong>
                  <p className="mt-2 text-sm">
                    {Array.isArray(unidad.competencias_ids) 
                      ? unidad.competencias_ids.join(', ') 
                      : unidad.competencias_ids || "—"
                    }
                  </p>
                </div>
                <div>
                  <strong>Evidencias:</strong>
                  <p className="mt-2 text-sm">{unidad.evidencias || "—"}</p>
                </div>
              </CardContent>
            </Card>

            {/* V. Rúbrica de Evaluación (A7) */}
            {rubrica?.estructura?.criteria && Array.isArray(rubrica.estructura.criteria) && (
              <Card>
                <CardHeader>
                  <CardTitle>V. Rúbrica de Evaluación</CardTitle>
                  <CardDescription>Criterios y niveles de evaluación</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {rubrica.estructura.criteria.map((criterio: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-3">
                          Criterio {index + 1}: {criterio.criterio || criterio.descripcion || 'Sin descripción'}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <strong>Inicio:</strong>
                            <p className="mt-1">{criterio.descriptores?.['Inicio'] || 'No definido'}</p>
                          </div>
                          <div>
                            <strong>Proceso:</strong>
                            <p className="mt-1">{criterio.descriptores?.['Proceso'] || 'No definido'}</p>
                          </div>
                          <div>
                            <strong>Logro:</strong>
                            <p className="mt-1">{criterio.descriptores?.['Logro'] || 'No definido'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* VI. Estructura de Sesiones (A8) */}
            {sesiones && Array.isArray(sesiones) && sesiones.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>VI. Estructura Detallada de Sesiones</CardTitle>
                  <CardDescription>Desarrollo completo de cada sesión de aprendizaje</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {sesiones.map((sesion: any, index: number) => (
                      <div key={index} className="border rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4">
                          Sesión {index + 1}: {sesion.titulo || 'Sin título'}
                        </h3>
                        
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium text-green-700 mb-2">INICIO</h4>
                            <p className="text-sm bg-green-50 p-3 rounded border-l-4 border-green-200">
                              {sesion.inicio || 'No definido'}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-blue-700 mb-2">DESARROLLO</h4>
                            <p className="text-sm bg-blue-50 p-3 rounded border-l-4 border-blue-200">
                              {sesion.desarrollo || 'No definido'}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-orange-700 mb-2">CIERRE</h4>
                            <p className="text-sm bg-orange-50 p-3 rounded border-l-4 border-orange-200">
                              {sesion.cierre || 'No definido'}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-purple-700 mb-2">EVIDENCIAS</h4>
                            <p className="text-sm bg-purple-50 p-3 rounded border-l-4 border-purple-200">
                              {Array.isArray(sesion.evidencias) 
                                ? sesion.evidencias.join(', ') 
                                : sesion.evidencias || 'No definidas'
                              }
                            </p>
                          </div>
                          
                          {sesion.rubrica_sesion?.criteria && Array.isArray(sesion.rubrica_sesion.criteria) && (
                            <div>
                              <h4 className="font-medium text-gray-700 mb-2">RÚBRICA DE SESIÓN</h4>
                              <div className="bg-gray-50 p-3 rounded border-l-4 border-gray-200">
                                <ul className="text-sm space-y-1">
                                  {sesion.rubrica_sesion.criteria.map((criterio: any, critIndex: number) => (
                                    <li key={critIndex}>
                                      {critIndex + 1}. {criterio.descripcion || criterio.nombre || 'Sin descripción'}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

          </div>
        </ScrollArea>
      </div>
    </div>
  );
}