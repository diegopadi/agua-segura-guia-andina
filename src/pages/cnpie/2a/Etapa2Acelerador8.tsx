import { useState, useEffect } from "react";
import { useCNPIEProject } from "@/hooks/useCNPIEProject";
import { useCNPIERubric } from "@/hooks/useCNPIERubric";
import { CNPIEAcceleratorLayout } from "@/components/cnpie/CNPIEAcceleratorLayout";
import { CNPIERubricViewer } from "@/components/cnpie/CNPIERubricViewer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BookOpen } from "lucide-react";

export default function Etapa2Acelerador8() {
  const { proyecto, saveAcceleratorData, validateAccelerator, getAcceleratorData } = useCNPIEProject('2A');
  const { getCriterioByName } = useCNPIERubric('2A');
  const { toast } = useToast();

  const rubricaPertinencia = getCriterioByName('Pertinencia');

  const [formData, setFormData] = useState({
    fundamentacionPedagogica: '',
    enfoquePedagogico: '',
    articulacionCurriculo: '',
    metodologias: '',
    evaluacionAprendizajes: '',
    adaptaciones: ''
  });

  useEffect(() => {
    const savedData = getAcceleratorData(2, 8);
    if (savedData) {
      setFormData(savedData);
    }
  }, [proyecto]);

  const handleSave = async () => {
    return await saveAcceleratorData(2, 8, formData);
  };

  const handleValidate = async () => {
    await handleSave();
    return await validateAccelerator(2, 8);
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
      aceleradorNumber={8}
      onSave={handleSave}
      onValidate={handleValidate}
      canProceed={canProceed}
      currentProgress={progress}
      titulo="Pertinencia Pedagógica"
      descripcion="Valida la pertinencia y coherencia pedagógica del proyecto"
    >
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
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
                value={formData.fundamentacionPedagogica}
                onChange={(e) => setFormData(prev => ({ ...prev, fundamentacionPedagogica: e.target.value }))}
                placeholder="¿En qué teorías o enfoques pedagógicos se basa tu proyecto? (constructivismo, aprendizaje situado, pedagogía crítica, etc.)..."
                className="min-h-[150px]"
                maxLength={rubricaPertinencia?.extension_maxima || 2500}
              />
              <div className="text-xs text-muted-foreground mt-2">
                {formData.fundamentacionPedagogica.length} / {rubricaPertinencia?.extension_maxima || 2500} caracteres
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
                value={formData.enfoquePedagogico}
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
                value={formData.articulacionCurriculo}
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
                value={formData.metodologias}
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
                value={formData.evaluacionAprendizajes}
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
                value={formData.adaptaciones}
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
