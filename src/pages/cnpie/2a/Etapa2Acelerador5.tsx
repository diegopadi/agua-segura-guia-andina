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
import { Leaf, CheckCircle2, XCircle, Sparkles, AlertCircle } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DocumentFieldSchema } from "@/types/document-extraction";

export default function Etapa2Acelerador5() {
  const { proyecto, saveAcceleratorData, validateAccelerator, getAcceleratorData, getAllData, getDocumentosPostulacion } = useCNPIEProject('2A');
  const { getCriterioByName } = useCNPIERubric('2A');
  const { toast } = useToast();

  const rubricaSostenibilidad = getCriterioByName('Sostenibilidad');
  const documentos = getDocumentosPostulacion();

  const [formData, setFormData] = useState({
    estrategiasSostenibilidad: '',
    institucionalizacion: '',
    capacidadesDesarrolladas: '',
    recursosNecesarios: '',
    presupuesto: '',
    escalabilidad: '',
    replicabilidad: '',
    tienePresupuesto: 'no' as 'si' | 'no',
    tienePlanEscalamiento: 'no' as 'si' | 'no'
  });

  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const documentFieldSchema: DocumentFieldSchema[] = [
    { fieldName: 'estrategiasSostenibilidad', label: 'Estrategias de Sostenibilidad', type: 'textarea', description: 'Estrategias para sostener el proyecto' },
    { fieldName: 'institucionalizacion', label: 'Institucionalización', type: 'textarea', description: 'Cómo se institucionaliza el proyecto' },
    { fieldName: 'capacidadesDesarrolladas', label: 'Capacidades Desarrolladas', type: 'textarea', description: 'Capacidades desarrolladas en el equipo' },
    { fieldName: 'recursosNecesarios', label: 'Recursos Necesarios', type: 'textarea', description: 'Recursos necesarios para sostener el proyecto' }
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
    const savedData = getAcceleratorData(2, 5);
    if (savedData) {
      setFormData(savedData);
    }
  }, [proyecto]);

  const handleSave = async () => {
    return await saveAcceleratorData(2, 5, formData);
  };

  const handleValidate = async () => {
    await handleSave();
    return await validateAccelerator(2, 5);
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const etapa1Data = proyecto?.datos_aceleradores?.etapa1_acelerador1 || {};
      
      const { data, error } = await supabase.functions.invoke('analyze-cnpie-sostenibilidad', {
        body: { ...formData, etapa1Data }
      });

      if (error) throw error;

      if (data.success) {
        setAnalysis(data.analysis);
        toast({
          title: "Análisis completado",
          description: `Puntaje estimado: ${data.analysis.puntaje_estimado}/20 puntos`
        });
      } else {
        throw new Error(data.error || "Error en el análisis");
      }
    } catch (error: any) {
      console.error('Error analyzing sustainability:', error);
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
    formData.estrategiasSostenibilidad && 
    formData.institucionalizacion && 
    formData.recursosNecesarios
  );

  const progress = (
    (formData.estrategiasSostenibilidad ? 25 : 0) +
    (formData.institucionalizacion ? 20 : 0) +
    (formData.capacidadesDesarrolladas ? 15 : 0) +
    (formData.recursosNecesarios ? 20 : 0) +
    (formData.escalabilidad ? 10 : 0) +
    (formData.replicabilidad ? 10 : 0)
  );

  if (!proyecto) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }

  return (
    <CNPIEAcceleratorLayout
      proyectoId={proyecto.id}
      tipoProyecto="2A"
      etapaNumber={2}
      aceleradorNumber={5}
      onSave={handleSave}
      onValidate={handleValidate}
      canProceed={canProceed}
      currentProgress={progress}
      titulo="Sostenibilidad"
      descripcion="Analiza la sostenibilidad y escalabilidad de tu innovación"
    >
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <DocumentosExtractionButton
            documentos={documentos}
            expectedFields={documentFieldSchema}
            contextoProyecto={getAllData()}
            onDataExtracted={handleAutoFill}
            aceleradorKey="etapa2_acelerador5"
          />

          {/* Botón de análisis IA */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Análisis IA de Sostenibilidad
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Obtén retroalimentación inmediata sobre las estrategias de sostenibilidad de tu proyecto según el criterio CNPIE (20 pts).
                  </p>
                  <Button 
                    onClick={handleAnalyze}
                    disabled={!canProceed || analyzing}
                    className="w-full"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {analyzing ? "Analizando..." : "Analizar Sostenibilidad con IA"}
                  </Button>
                </div>
              </div>

              {analysis && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                    <span className="font-medium">Puntaje Estimado:</span>
                    <Badge variant="default" className="text-lg">
                      {analysis.puntaje_estimado}/20 pts
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
          {/* Estrategias de Sostenibilidad */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="w-5 h-5" />
                Estrategias de Sostenibilidad
              </CardTitle>
              <CardDescription>
                Describe las estrategias para asegurar la continuidad del proyecto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.estrategiasSostenibilidad}
                onChange={(e) => setFormData(prev => ({ ...prev, estrategiasSostenibilidad: e.target.value }))}
                placeholder="Describe cómo se asegura la continuidad del proyecto: capacitación permanente, institucionalización, alianzas, recursos..."
                className="min-h-[150px]"
                maxLength={rubricaSostenibilidad?.extension_maxima || 2000}
              />
              <div className="text-xs text-muted-foreground mt-2">
                {formData.estrategiasSostenibilidad.length} / {rubricaSostenibilidad?.extension_maxima || 2000} caracteres
              </div>
            </CardContent>
          </Card>

          {/* Institucionalización */}
          <Card>
            <CardHeader>
              <CardTitle>Institucionalización</CardTitle>
              <CardDescription>
                Describe cómo el proyecto se ha integrado a la gestión institucional
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.institucionalizacion}
                onChange={(e) => setFormData(prev => ({ ...prev, institucionalizacion: e.target.value }))}
                placeholder="¿Está en el PEI? ¿En el PAT? ¿En documentos de gestión? ¿Tiene apoyo del equipo directivo?..."
                className="min-h-[120px]"
              />
            </CardContent>
          </Card>

          {/* Capacidades Desarrolladas */}
          <Card>
            <CardHeader>
              <CardTitle>Capacidades Desarrolladas</CardTitle>
              <CardDescription>
                Describe las capacidades que se han fortalecido en docentes y equipo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.capacidadesDesarrolladas}
                onChange={(e) => setFormData(prev => ({ ...prev, capacidadesDesarrolladas: e.target.value }))}
                placeholder="¿Qué capacidades nuevas han desarrollado los docentes? ¿Pueden continuar sin apoyo externo?..."
                className="min-h-[120px]"
              />
            </CardContent>
          </Card>

          {/* Recursos Necesarios */}
          <Card>
            <CardHeader>
              <CardTitle>Recursos Necesarios</CardTitle>
              <CardDescription>
                Detalla los recursos necesarios para continuar el proyecto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={formData.recursosNecesarios}
                onChange={(e) => setFormData(prev => ({ ...prev, recursosNecesarios: e.target.value }))}
                placeholder="Describe recursos humanos, materiales, tecnológicos, financieros necesarios..."
                className="min-h-[120px]"
              />

              <div>
                <Label>¿Cuenta con presupuesto asignado?</Label>
                <RadioGroup
                  value={formData.tienePresupuesto}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, tienePresupuesto: value as 'si' | 'no' }))}
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="si" id="presupuesto-si" />
                    <Label htmlFor="presupuesto-si" className="flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      Sí
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="presupuesto-no" />
                    <Label htmlFor="presupuesto-no" className="flex items-center gap-1">
                      <XCircle className="w-4 h-4 text-red-600" />
                      No
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.tienePresupuesto === 'si' && (
                <div>
                  <Label>Detalle del Presupuesto</Label>
                  <Textarea
                    value={formData.presupuesto}
                    onChange={(e) => setFormData(prev => ({ ...prev, presupuesto: e.target.value }))}
                    placeholder="Describe el presupuesto anual estimado y fuentes de financiamiento..."
                    className="min-h-[100px]"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Escalabilidad */}
          <Card>
            <CardHeader>
              <CardTitle>Escalabilidad</CardTitle>
              <CardDescription>
                ¿Puede el proyecto ampliarse a más grados, secciones o áreas?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={formData.escalabilidad}
                onChange={(e) => setFormData(prev => ({ ...prev, escalabilidad: e.target.value }))}
                placeholder="Describe cómo se puede escalar el proyecto dentro de tu institución..."
                className="min-h-[100px]"
              />

              <div>
                <Label>¿Tiene plan de escalamiento?</Label>
                <RadioGroup
                  value={formData.tienePlanEscalamiento}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, tienePlanEscalamiento: value as 'si' | 'no' }))}
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="si" id="plan-si" />
                    <Label htmlFor="plan-si" className="flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      Sí
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="plan-no" />
                    <Label htmlFor="plan-no" className="flex items-center gap-1">
                      <XCircle className="w-4 h-4 text-red-600" />
                      No
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Replicabilidad */}
          <Card>
            <CardHeader>
              <CardTitle>Replicabilidad</CardTitle>
              <CardDescription>
                ¿Puede el proyecto replicarse en otras instituciones educativas?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.replicabilidad}
                onChange={(e) => setFormData(prev => ({ ...prev, replicabilidad: e.target.value }))}
                placeholder="Describe las condiciones necesarias para que otras IEs puedan replicar tu proyecto..."
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar con rúbrica */}
        <div className="md:col-span-1">
          <div className="sticky top-4">
            <CNPIERubricViewer
              rubricas={rubricaSostenibilidad ? [rubricaSostenibilidad] : []}
              destacarCriterios={['Sostenibilidad']}
            />
          </div>
        </div>
      </div>
    </CNPIEAcceleratorLayout>
  );
}
