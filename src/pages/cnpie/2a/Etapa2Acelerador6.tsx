import { useState, useEffect } from "react";
import { useCNPIEProject } from "@/hooks/useCNPIEProject";
import { useCNPIERubric } from "@/hooks/useCNPIERubric";
import { CNPIEAcceleratorLayout } from "@/components/cnpie/CNPIEAcceleratorLayout";
import { CNPIERubricViewer } from "@/components/cnpie/CNPIERubricViewer";
import { DocumentosExtractionButton } from "@/components/DocumentosExtractionButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DocumentFieldSchema } from "@/types/document-extraction";

export default function Etapa2Acelerador6() {
  const { proyecto, saveAcceleratorData, validateAccelerator, getAcceleratorData, getAllData, getDocumentosPostulacion } = useCNPIEProject('2A');
  const { getCriterioByName } = useCNPIERubric('2A');
  const { toast } = useToast();

  const rubricaPertinencia = getCriterioByName('Pertinencia');
  const documentos = getDocumentosPostulacion();

  const [formData, setFormData] = useState({
    fundamentacionPedagogica: '',
    enfoquePedagogico: '',
    articulacionCurriculo: '',
    metodologias: '',
    evaluacionAprendizajes: '',
    adaptaciones: ''
  });

  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const documentFieldSchema: DocumentFieldSchema[] = [
    { fieldName: 'fundamentacionPedagogica', label: 'Fundamentación Pedagógica', type: 'textarea', description: 'Fundamentación pedagógica del proyecto' },
    { fieldName: 'enfoquePedagogico', label: 'Enfoque Pedagógico', type: 'textarea', description: 'Enfoque pedagógico utilizado' },
    { fieldName: 'articulacionCurriculo', label: 'Articulación con Currículo', type: 'textarea', description: 'Cómo se articula con el currículo nacional' },
    { fieldName: 'metodologias', label: 'Metodologías', type: 'textarea', description: 'Metodologías pedagógicas aplicadas' },
    { fieldName: 'evaluacionAprendizajes', label: 'Evaluación de Aprendizajes', type: 'textarea', description: 'Cómo se evalúan los aprendizajes' }
  ];

  const handleAutoFill = (extractedData: any) => {
    setFormData(prev => ({
      ...prev,
      ...extractedData
    }));
    toast({
      title: "Datos aplicados",
      description: "La información extraída se ha aplicado al formulario"
    });
  };

  useEffect(() => {
    const savedData = getAcceleratorData(2, 6);
    if (savedData) {
      setFormData(prev => ({
        fundamentacionPedagogica: savedData.fundamentacionPedagogica ?? '',
        enfoquePedagogico: savedData.enfoquePedagogico ?? '',
        articulacionCurriculo: savedData.articulacionCurriculo ?? '',
        metodologias: savedData.metodologias ?? '',
        evaluacionAprendizajes: savedData.evaluacionAprendizajes ?? '',
        adaptaciones: savedData.adaptaciones ?? ''
      }));
    }
  }, [proyecto]);

  const handleSave = async () => {
    return await saveAcceleratorData(2, 6, formData);
  };

  const handleValidate = async () => {
    await handleSave();
    return await validateAccelerator(2, 6);
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const etapa1Data = proyecto?.datos_aceleradores?.etapa1_acelerador1 || {};
      
      const { data, error } = await supabase.functions.invoke('analyze-cnpie-pertinencia', {
        body: { ...formData, etapa1Data }
      });

      if (error) throw error;

      if (data.success) {
        setAnalysis({
          ...data.analysis,
          fortalezas: data.analysis.fortalezas || [],
          areas_mejorar: data.analysis.areas_mejorar || [],
          sugerencias: data.analysis.sugerencias || []
        });
        toast({
          title: "Análisis completado",
          description: `Puntaje estimado: ${data.analysis.puntaje_estimado}/25 puntos`
        });
      } else {
        throw new Error(data.error || "Error en el análisis");
      }
    } catch (error: any) {
      console.error('Error analyzing pertinence:', error);
      toast({
        title: "Error en el análisis",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const canProceed = !!(
    formData.fundamentacionPedagogica && 
    formData.enfoquePedagogico && 
    formData.articulacionCurriculo
  );

  const progress = (
    (formData.fundamentacionPedagogica ? 25 : 0) +
    (formData.enfoquePedagogico ? 20 : 0) +
    (formData.articulacionCurriculo ? 20 : 0) +
    (formData.metodologias ? 15 : 0) +
    (formData.evaluacionAprendizajes ? 15 : 0) +
    (formData.adaptaciones ? 5 : 0)
  );

  if (!proyecto) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }

  return (
    <CNPIEAcceleratorLayout
      proyectoId={proyecto.id}
      tipoProyecto="2A"
      etapaNumber={2}
      aceleradorNumber={6}
      onSave={handleSave}
      onValidate={handleValidate}
      canProceed={canProceed}
      currentProgress={progress}
      titulo="Pertinencia Pedagógica"
      descripcion="Valida la pertinencia y coherencia pedagógica del proyecto"
    >
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <DocumentosExtractionButton
            documentos={documentos}
            expectedFields={documentFieldSchema}
            contextoProyecto={getAllData()}
            onDataExtracted={handleAutoFill}
            aceleradorKey="etapa2_acelerador6"
          />

          {/* Botón de análisis IA */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Análisis IA de Pertinencia Pedagógica
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Obtén retroalimentación sobre la fundamentación pedagógica y articulación curricular según el criterio CNPIE (25 pts).
                  </p>
                  <Button 
                    onClick={handleAnalyze}
                    disabled={!canProceed || analyzing}
                    className="w-full"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {analyzing ? "Analizando..." : "Analizar Pertinencia con IA"}
                  </Button>
                </div>
              </div>

              {analysis && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                    <span className="font-medium">Puntaje Estimado:</span>
                    <Badge variant="default" className="text-lg">
                      {analysis.puntaje_estimado}/25 pts
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                    <span className="font-medium">Completitud:</span>
                    <Badge variant="secondary">
                      {analysis.completitud}%
                    </Badge>
                  </div>

                  {analysis.fortalezas?.length > 0 && (
                    <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                        ✓ Fortalezas
                      </h4>
                      <ul className="text-sm space-y-1 text-green-800 dark:text-green-200">
                        {analysis.fortalezas.map((f: string, i: number) => (
                          <li key={i}>• {f}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.areas_mejorar?.length > 0 && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                      <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                        ⚠ Áreas de Mejora
                      </h4>
                      <ul className="text-sm space-y-1 text-yellow-800 dark:text-yellow-200">
                        {analysis.areas_mejorar.map((a: string, i: number) => (
                          <li key={i}>• {a}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.sugerencias?.length > 0 && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        💡 Sugerencias
                      </h4>
                      <ul className="text-sm space-y-1 text-blue-800 dark:text-blue-200">
                        {analysis.sugerencias.map((s: string, i: number) => (
                          <li key={i}>• {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          {/* Fundamentación Pedagógica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Fundamentación Pedagógica
              </CardTitle>
              <CardDescription>
                Describe las bases pedagógicas y teóricas que sustentan tu proyecto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.fundamentacionPedagogica ?? ''}
                onChange={(e) => setFormData(prev => ({ ...prev, fundamentacionPedagogica: e.target.value }))}
                placeholder="¿En qué teorías o enfoques pedagógicos se basa tu proyecto? (constructivismo, aprendizaje situado, pedagogía crítica, etc.)..."
                className="min-h-[150px]"
                maxLength={rubricaPertinencia?.extension_maxima || 2500}
              />
              <div className="text-xs text-muted-foreground mt-2">
                {(formData.fundamentacionPedagogica ?? '').length} / {rubricaPertinencia?.extension_maxima || 2500} caracteres
              </div>
            </CardContent>
          </Card>

          {/* Enfoque Pedagógico */}
          <Card>
            <CardHeader>
              <CardTitle>Enfoque Pedagógico Aplicado</CardTitle>
              <CardDescription>
                Describe el enfoque pedagógico predominante en tu proyecto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.enfoquePedagogico ?? ''}
                onChange={(e) => setFormData(prev => ({ ...prev, enfoquePedagogico: e.target.value }))}
                placeholder="Ej: Aprendizaje Basado en Proyectos (ABP), Aprendizaje Colaborativo, Gamificación, STEAM, etc..."
                className="min-h-[120px]"
              />
            </CardContent>
          </Card>

          {/* Articulación con Currículo */}
          <Card>
            <CardHeader>
              <CardTitle>Articulación con el Currículo Nacional</CardTitle>
              <CardDescription>
                Describe cómo se articula con el CNEB y documentos curriculares
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.articulacionCurriculo ?? ''}
                onChange={(e) => setFormData(prev => ({ ...prev, articulacionCurriculo: e.target.value }))}
                placeholder="¿Cómo se vincula con competencias, capacidades, desempeños del CNEB? ¿Responde a los enfoques transversales?..."
                className="min-h-[120px]"
              />
            </CardContent>
          </Card>

          {/* Metodologías */}
          <Card>
            <CardHeader>
              <CardTitle>Metodologías y Estrategias</CardTitle>
              <CardDescription>
                Describe las metodologías y estrategias didácticas empleadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.metodologias ?? ''}
                onChange={(e) => setFormData(prev => ({ ...prev, metodologias: e.target.value }))}
                placeholder="Describe las estrategias didácticas específicas: trabajo cooperativo, indagación, etc..."
                className="min-h-[120px]"
              />
            </CardContent>
          </Card>

          {/* Evaluación de Aprendizajes */}
          <Card>
            <CardHeader>
              <CardTitle>Evaluación de Aprendizajes</CardTitle>
              <CardDescription>
                Describe cómo se evalúa el progreso y logro de aprendizajes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.evaluacionAprendizajes ?? ''}
                onChange={(e) => setFormData(prev => ({ ...prev, evaluacionAprendizajes: e.target.value }))}
                placeholder="¿Qué instrumentos de evaluación se usan? ¿Cómo se da la retroalimentación? ¿Hay evaluación formativa?..."
                className="min-h-[120px]"
              />
            </CardContent>
          </Card>

          {/* Adaptaciones y Diferenciación */}
          <Card>
            <CardHeader>
              <CardTitle>Adaptaciones y Diferenciación</CardTitle>
              <CardDescription>
                ¿Cómo se adapta a las necesidades diversas de los estudiantes?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.adaptaciones ?? ''}
                onChange={(e) => setFormData(prev => ({ ...prev, adaptaciones: e.target.value }))}
                placeholder="Describe adaptaciones para estudiantes con NEE, ritmos de aprendizaje diversos, etc..."
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar con rúbrica */}
        <div className="md:col-span-1">
          <div className="sticky top-4">
            <CNPIERubricViewer
              rubricas={rubricaPertinencia ? [rubricaPertinencia] : []}
              destacarCriterios={['Pertinencia']}
            />
          </div>
        </div>
      </div>
    </CNPIEAcceleratorLayout>
  );
}
