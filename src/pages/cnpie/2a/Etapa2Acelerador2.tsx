import { useState, useEffect } from "react";
import { useCNPIEProject } from "@/hooks/useCNPIEProject";
import { useCNPIERubric } from "@/hooks/useCNPIERubric";
import { CNPIEAcceleratorLayout } from "@/components/cnpie/CNPIEAcceleratorLayout";
import { CNPIERubricViewer } from "@/components/cnpie/CNPIERubricViewer";
import { DocumentosExtractionButton } from "@/components/DocumentosExtractionButton";
import { RepositoryExtractionButton } from "@/components/RepositoryExtractionButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Lightbulb, Plus, X, BookOpen } from "lucide-react";
import { DocumentFieldSchema } from "@/types/document-extraction";
import CompetenciasMultiSelect from "@/components/CompetenciasMultiSelect";

export default function Etapa2Acelerador2() {
  const { proyecto, saveAcceleratorData, validateAccelerator, getAcceleratorData, getAllData, getDocumentosPostulacion } = useCNPIEProject('2A');
  const { getCriterioByName } = useCNPIERubric('2A');
  const { toast } = useToast();

  const rubricaOriginalidad = getCriterioByName('Originalidad');
  const etapa1Data = getAcceleratorData(1, 1);
  const areaFaltante = !etapa1Data?.areaCurricular;
  const documentos = getDocumentosPostulacion();

  const [formData, setFormData] = useState({
    metodologiaDescripcion: '',
    nombreMetodologia: '',
    estrategias: [] as Array<{ nombre: string; descripcion: string; frecuencia: string }>,
    pensamientoCritico: '',
    justificacionInnovacion: '',
    pertinenciaContexto: '',
    competenciasCNEB: [] as string[]
  });

  const [nuevaEstrategia, setNuevaEstrategia] = useState({
    nombre: '',
    descripcion: '',
    frecuencia: 'Semanal'
  });

  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  useEffect(() => {
    const savedData = getAcceleratorData(2, 2);
    if (savedData) {
      setFormData(savedData);
      if (savedData.analysis) {
        setAnalysis(savedData.analysis);
      }
    }
  }, [proyecto]);

  const documentFieldSchema: DocumentFieldSchema[] = [
    {
      fieldName: "metodologiaDescripcion",
      label: "Descripción de la Metodología",
      type: "textarea",
      description: "Descripción completa de la metodología innovadora implementada en el proyecto educativo",
      maxLength: 8000
    },
    {
      fieldName: "nombreMetodologia",
      label: "Nombre de la Metodología",
      type: "text",
      description: "Nombre o etiqueta de la metodología (ej: ABP, Design Thinking, Aula Invertida)",
      maxLength: 200
    },
    {
      fieldName: "pensamientoCritico",
      label: "Desarrollo del Pensamiento Crítico",
      type: "textarea",
      description: "Cómo la metodología promueve el pensamiento crítico, análisis y resolución de problemas",
      maxLength: 3000
    },
    {
      fieldName: "justificacionInnovacion",
      label: "Justificación de Innovación",
      type: "textarea",
      description: "Qué hace innovadora a esta metodología, qué problema pedagógico resuelve de manera diferente",
      maxLength: 3000
    },
    {
      fieldName: "pertinenciaContexto",
      label: "Pertinencia al Contexto",
      type: "textarea",
      description: "Cómo se adaptó la metodología al contexto específico de la institución",
      maxLength: 2000
    }
  ];

  const handleAutoFill = (extractedData: any) => {
    setFormData(prev => ({
      ...prev,
      ...extractedData
    }));
    
    toast({
      title: "Formulario actualizado",
      description: "Los campos se llenaron con la información extraída. Revisa y completa lo que falta."
    });
  };

  const handleSave = async () => {
    const dataToSave = { ...formData, analysis };
    return await saveAcceleratorData(2, 2, dataToSave);
  };

  const handleValidate = async () => {
    await handleSave();
    return await validateAccelerator(2, 2);
  };

  const handleAnalyze = async () => {
    if (!formData.metodologiaDescripcion || !formData.nombreMetodologia) {
      toast({
        title: "Campos incompletos",
        description: "Completa al menos la descripción y nombre de la metodología",
        variant: "destructive"
      });
      return;
    }

    try {
      setAnalyzing(true);

      const { data, error } = await supabase.functions.invoke('analyze-cnpie-originalidad', {
        body: { ...formData, etapa1Data }
      });

      if (error) throw error;

      if (data.success) {
        setAnalysis(data.analysis);
        toast({
          title: "Análisis completado",
          description: "La IA ha analizado tu metodología"
        });
      }
    } catch (error: any) {
      console.error('Error analyzing:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const addEstrategia = () => {
    if (nuevaEstrategia.nombre.trim() && nuevaEstrategia.descripcion.trim()) {
      setFormData(prev => ({
        ...prev,
        estrategias: [...prev.estrategias, { ...nuevaEstrategia }]
      }));
      setNuevaEstrategia({ nombre: '', descripcion: '', frecuencia: 'Semanal' });
    }
  };

  const removeEstrategia = (index: number) => {
    setFormData(prev => ({
      ...prev,
      estrategias: prev.estrategias.filter((_, i) => i !== index)
    }));
  };

  const canProceed = !!(
    formData.metodologiaDescripcion &&
    formData.nombreMetodologia &&
    formData.estrategias.length >= 3
  );

  const progress = (
    (formData.metodologiaDescripcion ? 25 : 0) +
    (formData.nombreMetodologia ? 15 : 0) +
    (formData.estrategias.length >= 3 ? 20 : 0) +
    (formData.pensamientoCritico ? 15 : 0) +
    (formData.competenciasCNEB.length >= 2 ? 25 : 0)
  );

  if (!proyecto) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }

  return (
    <CNPIEAcceleratorLayout
      proyectoId={proyecto.id}
      tipoProyecto="2A"
      etapaNumber={2}
      aceleradorNumber={2}
      onSave={handleSave}
      onValidate={handleValidate}
      canProceed={canProceed}
      currentProgress={progress}
      titulo="Originalidad y CNEB"
      descripcion="Documenta tu metodología innovadora y su vinculación con competencias del CNEB"
    >
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Contexto de Etapa 1 */}
          {etapa1Data && (
            <Alert>
              <BookOpen className="h-4 w-4" />
              <AlertTitle>Resumen de tu Proyecto</AlertTitle>
              <AlertDescription className="space-y-1 text-sm mt-2">
                <p><strong>Problema:</strong> {etapa1Data.problemaDescripcion?.substring(0, 150)}...</p>
                <p><strong>Objetivo:</strong> {etapa1Data.objetivo}</p>
              </AlertDescription>
            </Alert>
          )}

          <DocumentosExtractionButton
            documentos={documentos}
            expectedFields={documentFieldSchema}
            contextoProyecto={getAllData()}
            onDataExtracted={handleAutoFill}
            aceleradorKey="etapa2_acelerador2"
          />

          <RepositoryExtractionButton
            expectedFields={documentFieldSchema}
            contextoProyecto={getAllData()}
            onDataExtracted={handleAutoFill}
            aceleradorKey="etapa2_acelerador2"
          />

          {/* Nombre de la Metodología */}
          <Card>
            <CardHeader>
              <CardTitle>Nombre de tu Metodología</CardTitle>
              <CardDescription>Dale un nombre o etiqueta a tu metodología</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                value={formData.nombreMetodologia}
                onChange={(e) => setFormData(prev => ({ ...prev, nombreMetodologia: e.target.value }))}
                placeholder="Ej: ABP+STEAM, Aula Invertida Contextualizada, Design Thinking Comunitario..."
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground mt-2">
                {formData.nombreMetodologia.length} / 200 caracteres
              </p>
            </CardContent>
          </Card>

          {/* Descripción de la Metodología */}
          <Card>
            <CardHeader>
              <CardTitle>Descripción de tu Metodología</CardTitle>
              <CardDescription>
                Describe detalladamente cómo implementas tu metodología innovadora
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.metodologiaDescripcion}
                onChange={(e) => setFormData(prev => ({ ...prev, metodologiaDescripcion: e.target.value }))}
                placeholder="Describe tu metodología: ¿Qué la hace diferente? ¿Cómo la implementas paso a paso? ¿Qué innovación introduces en la enseñanza?"
                className="min-h-[200px]"
                maxLength={8000}
              />
              <p className="text-xs text-muted-foreground mt-2">
                {formData.metodologiaDescripcion.length} / 8000 caracteres
              </p>
            </CardContent>
          </Card>

          {/* Estrategias Pedagógicas */}
          <Card>
            <CardHeader>
              <CardTitle>Estrategias Pedagógicas Concretas</CardTitle>
              <CardDescription>Describe al menos 3 estrategias específicas que utilizas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Input
                  value={nuevaEstrategia.nombre}
                  onChange={(e) => setNuevaEstrategia(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Nombre de la estrategia"
                />
                <Textarea
                  value={nuevaEstrategia.descripcion}
                  onChange={(e) => setNuevaEstrategia(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Descripción detallada"
                  className="min-h-[80px]"
                  maxLength={500}
                />
                <div className="flex gap-2">
                  <select
                    value={nuevaEstrategia.frecuencia}
                    onChange={(e) => setNuevaEstrategia(prev => ({ ...prev, frecuencia: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option>Diaria</option>
                    <option>Semanal</option>
                    <option>Quincenal</option>
                    <option>Mensual</option>
                  </select>
                  <Button onClick={addEstrategia}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {formData.estrategias.map((est, idx) => (
                  <Card key={idx} className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">{est.nombre}</h4>
                          <Badge variant="outline" className="text-xs">{est.frecuencia}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{est.descripcion}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeEstrategia(idx)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pensamiento Crítico */}
          <Card>
            <CardHeader>
              <CardTitle>Desarrollo del Pensamiento Crítico</CardTitle>
              <CardDescription>
                ¿Cómo tu metodología promueve el análisis, evaluación y pensamiento crítico?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.pensamientoCritico}
                onChange={(e) => setFormData(prev => ({ ...prev, pensamientoCritico: e.target.value }))}
                placeholder="¿Qué preguntas desafiantes planteas? ¿Qué problemas abiertos resuelven? ¿Cómo evalúas el pensamiento crítico?"
                className="min-h-[120px]"
                maxLength={3000}
              />
              <p className="text-xs text-muted-foreground mt-2">
                {formData.pensamientoCritico.length} / 3000 caracteres
              </p>
            </CardContent>
          </Card>

          {/* Justificación de Innovación */}
          <Card>
            <CardHeader>
              <CardTitle>¿Qué hace innovadora tu metodología?</CardTitle>
              <CardDescription>
                Explica qué la diferencia de las prácticas tradicionales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.justificacionInnovacion}
                onChange={(e) => setFormData(prev => ({ ...prev, justificacionInnovacion: e.target.value }))}
                placeholder="¿Qué elementos nuevos introduces? ¿Qué problema pedagógico resuelves de manera diferente?"
                className="min-h-[120px]"
                maxLength={3000}
              />
            </CardContent>
          </Card>

          {/* Pertinencia al Contexto */}
          <Card>
            <CardHeader>
              <CardTitle>Adaptación al Contexto</CardTitle>
              <CardDescription>
                ¿Cómo adaptaste esta metodología a tu contexto específico?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.pertinenciaContexto}
                onChange={(e) => setFormData(prev => ({ ...prev, pertinenciaContexto: e.target.value }))}
                placeholder="Características de tus estudiantes, recursos disponibles, contexto territorial..."
                className="min-h-[100px]"
                maxLength={2000}
              />
            </CardContent>
          </Card>

          {/* Competencias CNEB */}
          {areaFaltante && (
            <Alert className="border-yellow-500 bg-yellow-50">
              <Lightbulb className="h-4 w-4 text-yellow-600" />
              <AlertTitle>Área Curricular no definida</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>No has definido el área curricular en la Etapa 1. Las competencias CNEB se filtran por área.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = '/cnpie/2a/etapa1/acelerador1'}
                  className="mt-2"
                >
                  Ir a Etapa 1 para completar
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          {!areaFaltante ? (
            <Card>
              <CardHeader>
                <CardTitle>Competencias CNEB Desarrolladas</CardTitle>
                <CardDescription>Selecciona al menos 2 competencias</CardDescription>
              </CardHeader>
              <CardContent>
                <CompetenciasMultiSelect
                  areaCurricular={etapa1Data?.areaCurricular || ''}
                  selectedCompetencias={formData.competenciasCNEB}
                  onCompetenciasChange={(competencias) => setFormData(prev => ({ ...prev, competenciasCNEB: competencias }))}
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="border-yellow-500">
              <CardHeader>
                <CardTitle className="text-yellow-700">Competencias CNEB (Opcional)</CardTitle>
                <CardDescription>Define el área curricular en Etapa 1 para seleccionar competencias específicas</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Las competencias CNEB se filtran por área curricular. Completa este campo en la Etapa 1 para continuar.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Advertencia: Competencias CNEB recomendadas */}
          {!areaFaltante && formData.competenciasCNEB.length < 2 && (
            <Alert className="border-blue-500 bg-blue-50">
              <Lightbulb className="h-4 w-4 text-blue-600" />
              <AlertTitle>Recomendación importante</AlertTitle>
              <AlertDescription>
                <p className="text-sm">
                  Se recomienda seleccionar al menos <strong>2 competencias CNEB</strong> para una evaluación más completa de tu proyecto. 
                  Las competencias ayudan a evidenciar la alineación curricular de tu metodología.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Botón de Análisis */}
          <Button
            onClick={handleAnalyze}
            disabled={analyzing || !formData.metodologiaDescripcion}
            className="w-full"
            size="lg"
          >
            <Lightbulb className="w-5 h-5 mr-2" />
            {analyzing ? "Analizando..." : "Analizar Originalidad con IA"}
          </Button>

          {/* Resultados del Análisis */}
          {analysis && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>Análisis de IA - Originalidad</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm">Puntaje estimado:</span>
                  <Badge variant="default" className="text-lg">
                    {analysis.puntaje_estimado} / 30 pts
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysis.fortalezas && analysis.fortalezas.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-green-600 mb-2">Fortalezas</h4>
                    <ul className="space-y-1">
                      {analysis.fortalezas.map((f: string, idx: number) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <span className="text-green-600">•</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.areas_mejorar && analysis.areas_mejorar.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-yellow-600 mb-2">Áreas a mejorar</h4>
                    <ul className="space-y-1">
                      {analysis.areas_mejorar.map((a: string, idx: number) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <span className="text-yellow-600">•</span>
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.sugerencias && analysis.sugerencias.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Sugerencias</h4>
                    <ul className="space-y-1">
                      {analysis.sugerencias.map((s: string, idx: number) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <span>→</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar con rúbrica */}
        <div className="md:col-span-1">
          <div className="sticky top-4">
            <CNPIERubricViewer
              rubricas={rubricaOriginalidad ? [rubricaOriginalidad] : []}
              destacarCriterios={['Originalidad']}
            />
          </div>
        </div>
      </div>
    </CNPIEAcceleratorLayout>
  );
}
