import { useState, useEffect } from "react";
import { useCNPIEProject } from "@/hooks/useCNPIEProject";
import { useCNPIERubric } from "@/hooks/useCNPIERubric";
import { CNPIEAcceleratorLayout } from "@/components/cnpie/CNPIEAcceleratorLayout";
import { CNPIERubricViewer } from "@/components/cnpie/CNPIERubricViewer";
import { RepositoryExtractionButton } from "@/components/RepositoryExtractionButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Lightbulb } from "lucide-react";
import { DocumentFieldSchema } from "@/types/document-extraction";

export default function Etapa2Acelerador7() {
  const { proyecto, saveAcceleratorData, validateAccelerator, getAcceleratorData, getAllData, getDocumentosPostulacion } = useCNPIEProject('2A');
  const { getCriterioByName } = useCNPIERubric('2A');
  const { toast } = useToast();

  const rubricaReflexion = getCriterioByName('Reflexión');

  const [formData, setFormData] = useState({
    desafiosEnfrentados: '',
    estrategiasSuperacion: '',
    leccionesAprendidas: '',
    buenasPracticas: '',
    aspectosMejorar: '',
    proyeccionFuturo: ''
  });

  const [synthesizing, setSynthesizing] = useState(false);
  const [synthesis, setSynthesis] = useState<any>(null);

  const documentFieldSchema: DocumentFieldSchema[] = [
    { fieldName: 'desafiosEnfrentados', label: 'Desafíos Enfrentados', type: 'textarea', description: 'Principales desafíos y obstáculos' },
    { fieldName: 'estrategiasSuperacion', label: 'Estrategias de Superación', type: 'textarea', description: 'Cómo se superaron los desafíos' },
    { fieldName: 'leccionesAprendidas', label: 'Lecciones Aprendidas', type: 'textarea', description: 'Aprendizajes de la experiencia' },
    { fieldName: 'buenasPracticas', label: 'Buenas Prácticas', type: 'textarea', description: 'Prácticas exitosas identificadas' },
    { fieldName: 'aspectosMejorar', label: 'Aspectos a Mejorar', type: 'textarea', description: 'Qué mejorar en futuras implementaciones' },
    { fieldName: 'proyeccionFuturo', label: 'Proyección Futura', type: 'textarea', description: 'Planes y proyección del proyecto' }
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
    const savedData = getAcceleratorData(2, 7);
    if (savedData) {
      setFormData(savedData);
      if (savedData.synthesis) setSynthesis(savedData.synthesis);
    }
  }, [proyecto]);

  const handleSave = async () => {
    const dataToSave = { ...formData, synthesis };
    return await saveAcceleratorData(2, 7, dataToSave);
  };

  const handleValidate = async () => {
    await handleSave();
    return await validateAccelerator(2, 7);
  };

  const handleGenerateSynthesis = async () => {
    if (!proyecto) return;

    try {
      setSynthesizing(true);

      // Obtener todos los datos de Etapa 2
      const allData = proyecto.datos_aceleradores;

      const { data, error } = await supabase.functions.invoke('generate-etapa2-synthesis', {
        body: {
          proyectoId: proyecto.id,
          datosEtapa2: allData,
          reflexion: formData
        }
      });

      if (error) throw error;

      if (data.success) {
        setSynthesis(data.synthesis);
        toast({
          title: "Síntesis generada",
          description: "La IA ha generado una síntesis de tu Etapa 2"
        });
      }
    } catch (error: any) {
      console.error('Error generating synthesis:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSynthesizing(false);
    }
  };

  const canProceed = !!(
    formData.desafiosEnfrentados && 
    formData.leccionesAprendidas && 
    formData.proyeccionFuturo
  );

  const progress = (
    (formData.desafiosEnfrentados ? 20 : 0) +
    (formData.estrategiasSuperacion ? 15 : 0) +
    (formData.leccionesAprendidas ? 20 : 0) +
    (formData.buenasPracticas ? 15 : 0) +
    (formData.aspectosMejorar ? 15 : 0) +
    (formData.proyeccionFuturo ? 15 : 0)
  );

  if (!proyecto) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }

  return (
    <CNPIEAcceleratorLayout
      proyectoId={proyecto.id}
      tipoProyecto="2A"
      etapaNumber={2}
      aceleradorNumber={7}
      onSave={handleSave}
      onValidate={handleValidate}
      canProceed={canProceed}
      currentProgress={progress}
      titulo="Reflexión y Aprendizajes"
      descripcion="Reflexiona sobre desafíos, lecciones aprendidas y proyección futura"
    >
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <RepositoryExtractionButton
            expectedFields={documentFieldSchema}
            contextoProyecto={getAllData()}
            onDataExtracted={handleAutoFill}
            aceleradorKey="etapa2_acelerador7"
          />

          {/* Desafíos Enfrentados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Desafíos Enfrentados
              </CardTitle>
              <CardDescription>
                Describe los principales desafíos y dificultades durante la implementación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.desafiosEnfrentados}
                onChange={(e) => setFormData(prev => ({ ...prev, desafiosEnfrentados: e.target.value }))}
                placeholder="¿Qué obstáculos encontraste? ¿Qué fue más difícil de implementar?..."
                className="min-h-[150px]"
                maxLength={rubricaReflexion?.extension_maxima || 2000}
              />
              <div className="text-xs text-muted-foreground mt-2">
                {formData.desafiosEnfrentados.length} / {rubricaReflexion?.extension_maxima || 2000} caracteres
              </div>
            </CardContent>
          </Card>

          {/* Estrategias de Superación */}
          <Card>
            <CardHeader>
              <CardTitle>Estrategias de Superación</CardTitle>
              <CardDescription>
                ¿Cómo superaste esos desafíos?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.estrategiasSuperacion}
                onChange={(e) => setFormData(prev => ({ ...prev, estrategiasSuperacion: e.target.value }))}
                placeholder="Describe las estrategias, acciones o decisiones que te permitieron superar los desafíos..."
                className="min-h-[120px]"
              />
            </CardContent>
          </Card>

          {/* Lecciones Aprendidas */}
          <Card>
            <CardHeader>
              <CardTitle>Lecciones Aprendidas</CardTitle>
              <CardDescription>
                ¿Qué aprendiste de la experiencia de implementar este proyecto?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.leccionesAprendidas}
                onChange={(e) => setFormData(prev => ({ ...prev, leccionesAprendidas: e.target.value }))}
                placeholder="Reflexiona sobre aprendizajes personales, profesionales, organizacionales..."
                className="min-h-[120px]"
              />
            </CardContent>
          </Card>

          {/* Buenas Prácticas */}
          <Card>
            <CardHeader>
              <CardTitle>Buenas Prácticas Identificadas</CardTitle>
              <CardDescription>
                ¿Qué prácticas funcionaron especialmente bien?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.buenasPracticas}
                onChange={(e) => setFormData(prev => ({ ...prev, buenasPracticas: e.target.value }))}
                placeholder="Describe estrategias, metodologías o acciones que tuvieron resultados destacados..."
                className="min-h-[120px]"
              />
            </CardContent>
          </Card>

          {/* Aspectos a Mejorar */}
          <Card>
            <CardHeader>
              <CardTitle>Aspectos a Mejorar</CardTitle>
              <CardDescription>
                ¿Qué mejorarías si pudieras volver a comenzar?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.aspectosMejorar}
                onChange={(e) => setFormData(prev => ({ ...prev, aspectosMejorar: e.target.value }))}
                placeholder="Reflexiona sobre qué harías diferente o qué aspectos necesitan fortalecerse..."
                className="min-h-[120px]"
              />
            </CardContent>
          </Card>

          {/* Proyección Futura */}
          <Card>
            <CardHeader>
              <CardTitle>Proyección Futura</CardTitle>
              <CardDescription>
                ¿Hacia dónde proyectas tu proyecto? ¿Cuáles son los próximos pasos?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.proyeccionFuturo}
                onChange={(e) => setFormData(prev => ({ ...prev, proyeccionFuturo: e.target.value }))}
                placeholder="Describe tus planes para continuar, escalar o mejorar el proyecto..."
                className="min-h-[120px]"
              />
            </CardContent>
          </Card>

          {/* Generar Síntesis */}
          <Button
            onClick={handleGenerateSynthesis}
            disabled={synthesizing || !canProceed}
            className="w-full"
            size="lg"
          >
            <Lightbulb className="w-5 h-5 mr-2" />
            {synthesizing ? "Generando síntesis..." : "Generar Síntesis de Etapa 2 con IA"}
          </Button>

          {/* Síntesis Generada */}
          {synthesis && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>Síntesis de tu Etapa 2</CardTitle>
                <Badge variant="default">Generada por IA</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose prose-sm max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: synthesis.resumen_html || synthesis.resumen }} />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar con rúbrica */}
        <div className="md:col-span-1">
          <div className="sticky top-4">
            <CNPIERubricViewer
              rubricas={rubricaReflexion ? [rubricaReflexion] : []}
              destacarCriterios={['Reflexión']}
            />
          </div>
        </div>
      </div>
    </CNPIEAcceleratorLayout>
  );
}
