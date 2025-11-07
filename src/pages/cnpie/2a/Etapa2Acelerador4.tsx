import { useState, useEffect } from "react";
import { useCNPIEProject } from "@/hooks/useCNPIEProject";
import { useCNPIERubric } from "@/hooks/useCNPIERubric";
import { CNPIEAcceleratorLayout } from "@/components/cnpie/CNPIEAcceleratorLayout";
import { CNPIERubricViewer } from "@/components/cnpie/CNPIERubricViewer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Lightbulb, Users } from "lucide-react";

export default function Etapa2Acelerador4() {
  const { proyecto, saveAcceleratorData, validateAccelerator, getAcceleratorData } = useCNPIEProject('2A');
  const { getCriterioByName } = useCNPIERubric('2A');
  const { toast } = useToast();

  const rubricaParticipacion = getCriterioByName('Participación');

  const [formData, setFormData] = useState({
    participacionEstudiantes: '',
    numeroEstudiantes: '',
    rolEstudiantes: '',
    participacionFamilias: '',
    numeroFamilias: '',
    formasParticipacionFamilias: '',
    participacionDocentes: '',
    numeroDocentes: '',
    participacionComunidad: '',
    alianzas: ''
  });

  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  useEffect(() => {
    const savedData = getAcceleratorData(2, 4);
    if (savedData) {
      setFormData(savedData);
      if (savedData.analysis) setAnalysis(savedData.analysis);
    }
  }, [proyecto]);

  const handleSave = async () => {
    const dataToSave = { ...formData, analysis };
    return await saveAcceleratorData(2, 4, dataToSave);
  };

  const handleValidate = async () => {
    await handleSave();
    return await validateAccelerator(2, 4);
  };

  const handleAnalyze = async () => {
    if (!formData.participacionEstudiantes || !formData.numeroEstudiantes) {
      toast({
        title: "Campos incompletos",
        description: "Completa al menos la participación de estudiantes",
        variant: "destructive"
      });
      return;
    }

    try {
      setAnalyzing(true);
      const { data, error } = await supabase.functions.invoke('analyze-cnpie-participacion', {
        body: formData
      });

      if (error) throw error;

      if (data.success) {
        setAnalysis(data.analysis);
        toast({
          title: "Análisis completado",
          description: "La IA ha analizado la participación comunitaria"
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

  const canProceed = !!(formData.participacionEstudiantes && formData.numeroEstudiantes);
  const progress = (
    (formData.participacionEstudiantes ? 25 : 0) +
    (formData.participacionFamilias ? 20 : 0) +
    (formData.participacionDocentes ? 20 : 0) +
    (formData.participacionComunidad ? 20 : 0) +
    (formData.alianzas ? 15 : 0)
  );

  if (!proyecto) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }

  return (
    <CNPIEAcceleratorLayout
      proyectoId={proyecto.id}
      tipoProyecto="2A"
      etapaNumber={2}
      aceleradorNumber={4}
      onSave={handleSave}
      onValidate={handleValidate}
      canProceed={canProceed}
      currentProgress={progress}
      titulo="Participación Comunitaria"
      descripcion="Documenta la participación de estudiantes, familias y comunidad educativa"
    >
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <DocumentosExtractionButton
            documentos={documentos}
            expectedFields={documentFieldSchema}
            contextoProyecto={getAllData()}
            onDataExtracted={handleAutoFill}
            aceleradorKey="etapa2_acelerador4"
          />

          {/* Participación de Estudiantes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Participación de Estudiantes
              </CardTitle>
              <CardDescription>
                Describe cómo participan los estudiantes en el proyecto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Descripción de la Participación</Label>
                <Textarea
                  value={formData.participacionEstudiantes}
                  onChange={(e) => setFormData(prev => ({ ...prev, participacionEstudiantes: e.target.value }))}
                  placeholder="Describe cómo los estudiantes participan activamente en el proyecto, sus roles, responsabilidades..."
                  className="min-h-[120px]"
                  maxLength={rubricaParticipacion?.extension_maxima || 2000}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Número de Estudiantes Participantes</Label>
                  <Input
                    type="number"
                    value={formData.numeroEstudiantes}
                    onChange={(e) => setFormData(prev => ({ ...prev, numeroEstudiantes: e.target.value }))}
                    placeholder="Ej: 120"
                  />
                </div>
                <div>
                  <Label>Rol de los Estudiantes</Label>
                  <Input
                    value={formData.rolEstudiantes}
                    onChange={(e) => setFormData(prev => ({ ...prev, rolEstudiantes: e.target.value }))}
                    placeholder="Ej: Protagonistas, investigadores"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Participación de Familias */}
          <Card>
            <CardHeader>
              <CardTitle>Participación de Familias</CardTitle>
              <CardDescription>
                Describe la participación e involucramiento de las familias
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Descripción de la Participación</Label>
                <Textarea
                  value={formData.participacionFamilias}
                  onChange={(e) => setFormData(prev => ({ ...prev, participacionFamilias: e.target.value }))}
                  placeholder="Describe cómo las familias se involucran en el proyecto..."
                  className="min-h-[100px]"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Número de Familias Participantes</Label>
                  <Input
                    type="number"
                    value={formData.numeroFamilias}
                    onChange={(e) => setFormData(prev => ({ ...prev, numeroFamilias: e.target.value }))}
                    placeholder="Ej: 80"
                  />
                </div>
                <div>
                  <Label>Formas de Participación</Label>
                  <Input
                    value={formData.formasParticipacionFamilias}
                    onChange={(e) => setFormData(prev => ({ ...prev, formasParticipacionFamilias: e.target.value }))}
                    placeholder="Ej: Talleres, reuniones, actividades"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Participación de Docentes */}
          <Card>
            <CardHeader>
              <CardTitle>Participación de Docentes</CardTitle>
              <CardDescription>
                Describe la participación del equipo docente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Descripción de la Participación</Label>
                <Textarea
                  value={formData.participacionDocentes}
                  onChange={(e) => setFormData(prev => ({ ...prev, participacionDocentes: e.target.value }))}
                  placeholder="Describe cómo los docentes participan, se capacitan, colaboran..."
                  className="min-h-[100px]"
                />
              </div>
              <div>
                <Label>Número de Docentes Involucrados</Label>
                <Input
                  type="number"
                  value={formData.numeroDocentes}
                  onChange={(e) => setFormData(prev => ({ ...prev, numeroDocentes: e.target.value }))}
                  placeholder="Ej: 15"
                />
              </div>
            </CardContent>
          </Card>

          {/* Participación Comunitaria */}
          <Card>
            <CardHeader>
              <CardTitle>Participación de la Comunidad</CardTitle>
              <CardDescription>
                Describe la participación de actores comunitarios externos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.participacionComunidad}
                onChange={(e) => setFormData(prev => ({ ...prev, participacionComunidad: e.target.value }))}
                placeholder="Describe la participación de autoridades locales, organizaciones, empresas, etc..."
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>

          {/* Alianzas */}
          <Card>
            <CardHeader>
              <CardTitle>Alianzas y Colaboraciones</CardTitle>
              <CardDescription>
                Registra alianzas estratégicas establecidas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.alianzas}
                onChange={(e) => setFormData(prev => ({ ...prev, alianzas: e.target.value }))}
                placeholder="Describe convenios, alianzas o colaboraciones con instituciones externas..."
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>

          {/* Botón de Análisis */}
          <Button
            onClick={handleAnalyze}
            disabled={analyzing || !canProceed}
            className="w-full"
            size="lg"
          >
            <Lightbulb className="w-5 h-5 mr-2" />
            {analyzing ? "Analizando..." : "Analizar Participación con IA"}
          </Button>

          {/* Análisis de IA */}
          {analysis && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>Análisis de la IA</CardTitle>
                <Badge variant="default" className="text-lg w-fit">
                  {analysis.puntaje_estimado} / 20 pts
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysis.fortalezas && (
                  <div>
                    <h4 className="font-semibold text-green-600 mb-2">Fortalezas</h4>
                    <ul className="space-y-1">
                      {analysis.fortalezas.map((f: string, idx: number) => (
                        <li key={idx} className="text-sm">• {f}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.sugerencias && (
                  <div>
                    <h4 className="font-semibold mb-2">Sugerencias</h4>
                    <ul className="space-y-1">
                      {analysis.sugerencias.map((s: string, idx: number) => (
                        <li key={idx} className="text-sm">→ {s}</li>
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
              rubricas={rubricaParticipacion ? [rubricaParticipacion] : []}
              destacarCriterios={['Participación']}
            />
          </div>
        </div>
      </div>
    </CNPIEAcceleratorLayout>
  );
}
