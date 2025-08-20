import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Download, Copy, Printer, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { A5InfoData, A5SituationPurposeData, A5CompetenciesData, A5SessionsStructureData, A5FeedbackData, A5MaterialsData } from "./types";
import { resolveCompetenceNames, parseCompetencyIndex, CompetencyIndex } from "@/utils/a5-competencies";

interface Props {
  onPrev: () => void;
}

interface UADocumento {
  meta: {
    version: string;
    generado_en: string;
    origen: string;
  };
  datos_informativos: A5InfoData;
  situacion_significativa: string;
  propositos: {
    proposito: string;
    reto: string;
    producto: string;
  };
  competencias: Array<{
    id: string;
    nombre: string;
    capacidades: string[];
  }>;
  enfoques: Array<{
    id: string;
    nombre: string;
  }>;
  estructura_sesiones: A5SessionsStructureData;
  retroalimentacion: string;
  materiales: A5MaterialsData['materiales'];
  aprobacion: {
    firmas: {
      director: string;
      docente: string;
    };
  };
}

// Helper function to build plain text document
function buildPlainText(documento: UADocumento): string {
  const { datos_informativos, situacion_significativa, propositos, competencias, enfoques, estructura_sesiones, retroalimentacion, materiales } = documento;
  
  const sesiones = estructura_sesiones.estructura?.map((r) => 
    `Sesión ${r.numero}: ${r.titulo}\n` +
    `  Propósito: ${r.proposito}\n` +
    `  Inicio: ${r.actividades.inicio}\n` +
    `  Desarrollo: ${r.actividades.desarrollo}\n` +
    `  Cierre: ${r.actividades.cierre}\n` +
    `  Recursos: ${r.recursos}\n` +
    `  Evidencias: ${r.evidencias}`
  ).join("\n\n") || "(Sin sesiones registradas)";
  
  const mats = materiales?.map((m) => `- ${m.nombre}: ${m.descripcion}`).join("\n") || "(Sin materiales registrados)";
  
  const comps = competencias?.map((c) => `- ${c.nombre}${c.capacidades?.length ? ` (Capacidades: ${c.capacidades.join(", ")})` : ""}`).join("\n") || "(Sin competencias registradas)";
  
  const enfs = enfoques?.map((e) => `- ${e.nombre}`).join("\n") || "(Sin enfoques registrados)";

  return `UNIDAD DE APRENDIZAJE

I. DATOS INFORMATIVOS
Institución educativa: ${datos_informativos.institucion || "—"}
Distrito: ${datos_informativos.distrito || "—"}
Provincia: ${datos_informativos.provincia || "—"}
Región: ${datos_informativos.region || "—"}
Director(a): ${datos_informativos.director || "—"}
Profesor(a): ${datos_informativos.profesor || "—"}
Área: ${datos_informativos.area || "—"}
Grado: ${datos_informativos.grado || "—"}
Duración: ${datos_informativos.duracion || "—"}
Periodo de ejecución: ${datos_informativos.periodo || "—"}
Año académico: ${datos_informativos.anio || "—"}

II. SITUACIÓN SIGNIFICATIVA
${situacion_significativa || "(Sin información registrada)"}

III. PROPÓSITOS DE APRENDIZAJE Y EVALUACIÓN
Propósito: ${propositos.proposito || "(Sin información registrada)"}
Reto: ${propositos.reto || "(Sin información registrada)"}
Producto: ${propositos.producto || "(Sin información registrada)"}

IV. ESTÁNDAR, COMPETENCIAS, CAPACIDADES Y DESEMPEÑOS
${comps}

Nota: El estándar y los desempeños completos deben trasladarse del CNEB según área y grado.

V. ENFOQUES TRANSVERSALES
${enfs}

VI. ESTRUCTURA DE SESIONES
${sesiones}

VII. RETROALIMENTACIÓN
${retroalimentacion || "(Sin información registrada)"}

VIII. MATERIALES BÁSICOS A UTILIZAR
${mats}

IX. APROBACIÓN
Firma del Director: _______________________
Firma del Docente: _______________________`;
}

export default function Step8FinalPreview({ onPrev }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [documento, setDocumento] = useState<UADocumento | null>(null);
  const [missingData, setMissingData] = useState<string[]>([]);
  const [isCompleting, setIsCompleting] = useState(false);

  // Load all data from previous steps
  useEffect(() => {
    const loadAllData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        
        // Load session data from Supabase
        const { data: session, error } = await supabase
          .from('acelerador_sessions')
          .select('session_data')
          .eq('user_id', user.id)
          .eq('acelerador_number', 5)
          .maybeSingle();

        if (error) throw error;

        const sessionData = session?.session_data as any || {};
        const missing: string[] = [];

        // Extract data from each step
        const info: A5InfoData = sessionData.info || {};
        const situation: A5SituationPurposeData = sessionData.situation || {};
        const comp: A5CompetenciesData = sessionData.comp || {};
        const sessions: A5SessionsStructureData = sessionData.sessions || { numSesiones: 0, horasPorSesion: 0, numEstudiantes: 0, estructura: [] };
        const feedback: A5FeedbackData = sessionData.feedback || {};
        const materials: A5MaterialsData = sessionData.materials || { materiales: [] };

        // Load saved competencias and enfoques data with full information
        let savedCompetencias: any[] = [];
        let savedEnfoques: any[] = [];
        
        try {
          if (sessionData.ua_competencias) {
            savedCompetencias = JSON.parse(sessionData.ua_competencias);
          }
        } catch {
          console.warn('Could not parse ua_competencias');
        }
        
        try {
          if (sessionData.ua_enfoques) {
            savedEnfoques = JSON.parse(sessionData.ua_enfoques);
          }
        } catch {
          console.warn('Could not parse ua_enfoques');
        }

        // Load competency index for name resolution
        let competencyIndex: CompetencyIndex = {};
        const compIndexString = sessionData.ua_competencias_index;
        if (compIndexString) {
          competencyIndex = parseCompetencyIndex(compIndexString);
        } else {
          // Fallback: create index from saved competencies if available
          const competenciasData = sessionData.ua_competencias;
          if (competenciasData) {
            try {
              const competencias = JSON.parse(competenciasData);
              competencias.forEach((c: any) => {
                if (c.id && c.nombre) {
                  competencyIndex[c.id] = { nombre: c.nombre, capacidades: c.capacidades || [] };
                }
              });
              
              // Save the index for future use
              await supabase
                .from('acelerador_sessions')
                .update({ 
                  session_data: { 
                    ...sessionData, 
                    ua_competencias_index: JSON.stringify(competencyIndex) 
                  } 
                })
                .eq('user_id', user.id)
                .eq('acelerador_number', 5);
            } catch {
              console.warn('Could not parse competencias data for fallback index');
            }
          }
        }

        // Check for missing critical data
        if (!info.institucion || !info.area || !info.grado) {
          missing.push("Datos informativos (Paso 2)");
        }
        if (!situation.situacion || !situation.proposito) {
          missing.push("Situación significativa y propósito (Paso 3)");
        }
        if (!comp.competencias?.length) {
          missing.push("Competencias (Paso 4)");
        }
        if (!sessions.estructura?.length) {
          missing.push("Estructura de sesiones (Paso 5)");
        }

        setMissingData(missing);

        // Process competencies with resolved names
        const processedCompetencias = savedCompetencias.length > 0 
          ? savedCompetencias.map((comp) => ({
              id: comp.id,
              nombre: comp.nombre || comp.id,
              capacidades: comp.capacidades || []
            }))
          : comp.competencias?.map((compId) => {
              const compData = competencyIndex[compId];
              return {
                id: compId,
                nombre: compData?.nombre || compId,
                capacidades: compData?.capacidades || []
              };
            }) || [];

        // Create enfoques index for name resolution
        const enfoquesIndex: Record<string, string> = {};
        savedEnfoques.forEach((enfoque) => {
          if (enfoque.id && enfoque.nombre) {
            enfoquesIndex[enfoque.id] = enfoque.nombre;
          } else if (typeof enfoque === 'string') {
            enfoquesIndex[enfoque] = enfoque;
          }
        });

        // Decorate sessions with resolved competency and enfoques names
        const sesionesDecoradas = sessions.estructura?.map((sesion) => ({
          ...sesion,
          competencias_string: resolveCompetenceNames(sesion.competencias, competencyIndex).join(", "),
          capacidades_string: sesion.capacidades?.join(", ") || "",
          enfoques_string: sesion.enfoques?.map((enfoqueId) => 
            enfoquesIndex[enfoqueId] || enfoqueId
          ).join(", ") || ""
        })) || [];

        // Build master JSON document
        const masterDoc: UADocumento = {
          meta: {
            version: "1.0",
            generado_en: new Date().toISOString(),
            origen: "Acelerador 5"
          },
          datos_informativos: info,
          situacion_significativa: situation.situacion || "",
          propositos: {
            proposito: situation.proposito || "",
            reto: situation.reto || "",
            producto: situation.producto || ""
          },
          competencias: processedCompetencias,
          enfoques: savedEnfoques.length > 0 
            ? savedEnfoques.map((enfoque) => ({
                id: enfoque.id || `ENF${Math.random()}`,
                nombre: enfoque.nombre || enfoque
              }))
            : comp.enfoques?.map((nombre, index) => ({
                id: `ENF${index + 1}`,
                nombre
              })) || [],
          estructura_sesiones: {
            ...sessions,
            estructura: sesionesDecoradas
          },
          retroalimentacion: feedback.feedback || "",
          materiales: materials.materiales || [],
          aprobacion: {
            firmas: {
              director: "_______________________",
              docente: "_______________________"
            }
          }
        };

        setDocumento(masterDoc);

      } catch (error) {
        console.error('Error loading document data:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos del documento",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, [user?.id, toast]);

  const copyDocument = async () => {
    if (!documento) return;
    
    try {
      await navigator.clipboard.writeText(buildPlainText(documento));
      toast({ 
        title: "Copiado", 
        description: "El documento ha sido copiado al portapapeles" 
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar el documento",
        variant: "destructive",
      });
    }
  };

  const downloadTxt = () => {
    if (!documento) return;

    const { datos_informativos } = documento;
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const filename = `UA_${datos_informativos.institucion?.replace(/[^a-zA-Z0-9]/g, '') || 'IE'}_${datos_informativos.area?.replace(/[^a-zA-Z0-9]/g, '') || 'Area'}_${datos_informativos.grado?.replace(/[^a-zA-Z0-9]/g, '') || 'Grado'}_${today}.txt`;
    
    const blob = new Blob([buildPlainText(documento)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printDocument = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const htmlContent = document.getElementById("ua-document-preview")?.innerHTML || "";
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Unidad de Aprendizaje</title>
          <style>
            body { font-family: system-ui, Arial, sans-serif; font-size: 12px; color: #111; margin: 20mm 18mm; }
            h1 { font-size: 22px; margin: 0 0 8px; }
            h2 { font-size: 16px; margin: 18px 0 8px; }
            table { width: 100%; border-collapse: collapse; margin: 8px 0; }
            table.info td { border: 1px solid #ddd; padding: 6px; }
            table.sesiones th, table.sesiones td,
            table.materiales th, table.materiales td { border: 1px solid #ddd; padding: 6px; vertical-align: top; }
            .nota { font-size: 12px; color: #555; }
            .section { margin: 16px 0; }
            @page { margin: 20mm 18mm; }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const FinalizarAcceleradorButton = () => {
    const handleFinalize = async () => {
      if (!user?.id) return;
      
      try {
        setIsCompleting(true);
        
        // Update Acelerador 5 session to completed
        const { error } = await supabase
          .from('acelerador_sessions')
          .update({ 
            status: 'completed',
            current_step: 8,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('acelerador_number', 5);

        if (error) throw error;

        toast({
          title: "¡Acelerador 5 completado!",
          description: "Ya puedes acceder al Diseñador de Sesiones de Aprendizaje",
        });

        // Navigate to Acelerador 6
        navigate('/etapa3/acelerador6');
        
      } catch (error) {
        console.error('Error finalizing accelerator:', error);
        toast({
          title: "Error",
          description: "No se pudo finalizar el acelerador",
          variant: "destructive",
        });
      } finally {
        setIsCompleting(false);
      }
    };

    return (
      <Button 
        onClick={handleFinalize} 
        disabled={isCompleting}
        className="flex items-center gap-2"
      >
        <CheckCircle className="w-4 h-4" />
        {isCompleting ? "Finalizando..." : "Finalizar Acelerador"}
      </Button>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Cargando documento...</div>
        </CardContent>
      </Card>
    );
  }

  if (!documento) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No se pudieron cargar los datos del documento
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowLeft className="w-5 h-5" />
          Paso 8: Documento final ensamblado
        </CardTitle>
        <CardDescription>
          Aquí está tu Unidad de Aprendizaje completa, lista para descargar e imprimir.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Missing data warning */}
        {missingData.length > 0 && (
          <div className="flex items-start gap-2 p-4 bg-orange-50 border border-orange-200 rounded-md">
            <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-orange-800">Información incompleta</p>
              <p className="text-sm text-orange-700">
                Faltan datos en: {missingData.join(", ")}. 
                El documento se generará con la información disponible.
              </p>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="outline" onClick={copyDocument} className="flex items-center gap-2">
            <Copy className="w-4 h-4" />
            Copiar
          </Button>
          <Button variant="outline" onClick={downloadTxt} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Descargar TXT
          </Button>
          <Button onClick={printDocument} className="flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Imprimir
          </Button>
        </div>

        {/* Document preview */}
        <div className="border rounded-md">
          <ScrollArea className="h-[70vh]">
            <div id="ua-document-preview" className="p-6">
              <div className="doc">
                <h1>Unidad de Aprendizaje</h1>

                <section className="section">
                  <h2>I. Datos informativos</h2>
                  <table className="info">
                    <tbody>
                      <tr><td><strong>Institución educativa</strong></td><td>{documento.datos_informativos.institucion || "(Sin información registrada)"}</td></tr>
                      <tr><td><strong>Distrito</strong></td><td>{documento.datos_informativos.distrito || "(Sin información registrada)"}</td></tr>
                      <tr><td><strong>Provincia</strong></td><td>{documento.datos_informativos.provincia || "(Sin información registrada)"}</td></tr>
                      <tr><td><strong>Región</strong></td><td>{documento.datos_informativos.region || "(Sin información registrada)"}</td></tr>
                      <tr><td><strong>Director(a)</strong></td><td>{documento.datos_informativos.director || "(Sin información registrada)"}</td></tr>
                      <tr><td><strong>Profesor(a)</strong></td><td>{documento.datos_informativos.profesor || "(Sin información registrada)"}</td></tr>
                      <tr><td><strong>Área</strong></td><td>{documento.datos_informativos.area || "(Sin información registrada)"}</td></tr>
                      <tr><td><strong>Grado</strong></td><td>{documento.datos_informativos.grado || "(Sin información registrada)"}</td></tr>
                      <tr><td><strong>Duración</strong></td><td>{documento.datos_informativos.duracion || "(Sin información registrada)"}</td></tr>
                      <tr><td><strong>Periodo de ejecución</strong></td><td>{documento.datos_informativos.periodo || "(Sin información registrada)"}</td></tr>
                      <tr><td><strong>Año académico</strong></td><td>{documento.datos_informativos.anio || "(Sin información registrada)"}</td></tr>
                    </tbody>
                  </table>
                </section>

                <section className="section">
                  <h2>II. Situación significativa</h2>
                  <p>{documento.situacion_significativa || "(Sin información registrada)"}</p>
                </section>

                <section className="section">
                  <h2>III. Propósitos de aprendizaje y evaluación</h2>
                  <p><strong>Propósito:</strong> {documento.propositos.proposito || "(Sin información registrada)"}</p>
                  <p><strong>Reto:</strong> {documento.propositos.reto || "(Sin información registrada)"}</p>
                  <p><strong>Producto:</strong> {documento.propositos.producto || "(Sin información registrada)"}</p>
                </section>

                <section className="section">
                  <h2>IV. Estándar, competencias, capacidades y desempeños</h2>
                  {documento.competencias.length > 0 ? (
                    <ul>
                      {documento.competencias.map((comp) => (
                        <li key={comp.id}>
                          <strong>{comp.nombre}</strong>
                          {comp.capacidades?.length > 0 && (
                            <div><em>Capacidades:</em> {comp.capacidades.join(", ")}</div>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>(Sin competencias registradas)</p>
                  )}
                  <p className="nota">
                    Nota: El estándar y los desempeños completos deben trasladarse del CNEB según área y grado.
                  </p>
                </section>

                <section className="section">
                  <h2>V. Enfoques transversales</h2>
                  {documento.enfoques.length > 0 ? (
                    <ul>
                      {documento.enfoques.map((enfoque) => (
                        <li key={enfoque.id}>{enfoque.nombre}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>(Sin enfoques registrados)</p>
                  )}
                </section>

                <section className="section">
                  <h2>VI. Estructura de sesiones</h2>
                  {documento.estructura_sesiones.estructura?.length > 0 ? (
                    <table className="sesiones">
                      <thead>
                        <tr>
                          <th>N°</th>
                          <th>Título</th>
                          <th>Propósito</th>
                          <th>Actividades (inicio / desarrollo / cierre)</th>
                          <th>Competencias</th>
                          <th>Capacidades</th>
                          <th>Recursos</th>
                          <th>Evidencias</th>
                        </tr>
                      </thead>
                      <tbody>
                        {documento.estructura_sesiones.estructura.map((sesion) => (
                          <tr key={sesion.numero}>
                            <td>{sesion.numero}</td>
                            <td>{sesion.titulo}</td>
                            <td>{sesion.proposito}</td>
                            <td>
                              <div>
                                <strong>Inicio:</strong> {sesion.actividades.inicio}<br/>
                                <strong>Desarrollo:</strong> {sesion.actividades.desarrollo}<br/>
                                <strong>Cierre:</strong> {sesion.actividades.cierre}
                              </div>
                            </td>
                            <td>{(sesion as any).competencias_string || "—"}</td>
                            <td>{sesion.capacidades?.join(", ") || "—"}</td>
                            <td>{sesion.recursos || "—"}</td>
                            <td>{sesion.evidencias || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                      <p>Sin estructura de sesiones. <strong>Debes completar el Paso 5</strong> antes de exportar el documento.</p>
                    </div>
                  )}
                </section>

                <section className="section">
                  <h2>VII. Retroalimentación</h2>
                  <p>{documento.retroalimentacion || "(Sin información registrada)"}</p>
                </section>

                <section className="section">
                  <h2>VIII. Materiales básicos a utilizar</h2>
                  {documento.materiales.length > 0 ? (
                    <table className="materiales">
                      <thead>
                        <tr>
                          <th>Material</th>
                          <th>Descripción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {documento.materiales.map((material, index) => (
                          <tr key={index}>
                            <td>{material.nombre}</td>
                            <td>{material.descripcion}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p>(Sin materiales registrados)</p>
                  )}
                </section>

                <section className="section">
                  <h2>IX. Aprobación</h2>
                  <p>Firma del Director: _______________________</p>
                  <p>Firma del Docente: _______________________</p>
                </section>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Navigation */}
        <div className="flex justify-between gap-2">
          <Button variant="outline" onClick={onPrev} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver a editar
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadTxt} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Descargar TXT
            </Button>
            <Button variant="outline" onClick={printDocument} className="flex items-center gap-2">
              <Printer className="w-4 h-4" />
              Imprimir PDF
            </Button>
            <FinalizarAcceleradorButton />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}