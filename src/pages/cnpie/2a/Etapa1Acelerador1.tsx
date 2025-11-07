import { useState, useEffect } from "react";
import { useCNPIEProject } from "@/hooks/useCNPIEProject";
import { useCNPIERubric } from "@/hooks/useCNPIERubric";
import { CNPIEAcceleratorLayout } from "@/components/cnpie/CNPIEAcceleratorLayout";
import { CNPIERubricViewer } from "@/components/cnpie/CNPIERubricViewer";
import { CNPIERubricScoreButton } from "@/components/cnpie/CNPIERubricScoreButton";
import { DocumentosExtractionButton } from "@/components/DocumentosExtractionButton";
import { RepositoryExtractionButton } from "@/components/RepositoryExtractionButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Lightbulb, Plus, X, BookOpen } from "lucide-react";
import { DocumentFieldSchema } from "@/types/document-extraction";

export default function Etapa1Acelerador1() {
  const { proyecto, saveAcceleratorData, validateAccelerator, getAcceleratorData, getAllData, getDocumentosPostulacion } = useCNPIEProject('2A');
  const { rubricas, getCriterioByName } = useCNPIERubric('2A');
  const { toast } = useToast();

  const rubricaIntencionalidad = getCriterioByName('Intencionalidad');
  const documentos = getDocumentosPostulacion();

  const [formData, setFormData] = useState({
    problemaDescripcion: '',
    causas: [] as string[],
    consecuencias: [] as string[],
    objetivo: '',
    contexto: '',
    areaCurricular: ''
  });

  const [nuevaCausa, setNuevaCausa] = useState('');
  const [nuevaConsecuencia, setNuevaConsecuencia] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const documentFieldSchema: DocumentFieldSchema[] = [
    { fieldName: "problemaDescripcion", label: "Problema Central", type: "textarea", description: "Descripción del problema educativo", maxLength: 3000 },
    { fieldName: "objetivo", label: "Objetivo", type: "textarea", description: "Objetivo SMART del proyecto", maxLength: 1500 },
    { fieldName: "contexto", label: "Contexto", type: "textarea", description: "Contexto institucional" },
    { fieldName: "areaCurricular", label: "Área Curricular", type: "text", description: "Área curricular del CNEB" }
  ];

  const handleAutoFill = (extractedData: any) => {
    setFormData(prev => ({ ...prev, ...extractedData }));
    toast({ title: "Datos extraídos", description: "Revisa y completa la información" });
  };

  useEffect(() => {
    const savedData = getAcceleratorData(1, 1);
    if (savedData) {
      setFormData(savedData);
      if (savedData.analysis) {
        setAnalysis(savedData.analysis);
      }
    }
  }, [proyecto]);

  const handleSave = async () => {
    const dataToSave = { ...formData, analysis };
    return await saveAcceleratorData(1, 1, dataToSave);
  };

  const handleValidate = async () => {
    await handleSave();
    return await validateAccelerator(1, 1);
  };

  const handleAnalyze = async () => {
    if (!formData.problemaDescripcion || formData.causas.length === 0 || !formData.objetivo) {
      toast({
        title: "Campos incompletos",
        description: "Completa al menos el problema, causas y objetivo para analizar",
        variant: "destructive"
      });
      return;
    }

    try {
      setAnalyzing(true);

      const { data, error } = await supabase.functions.invoke('analyze-cnpie-intencionalidad', {
        body: formData
      });

      if (error) throw error;

      if (data.success) {
        setAnalysis(data.analysis);
        toast({
          title: "Análisis completado",
          description: "La IA ha analizado tu intencionalidad"
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

  const addCausa = () => {
    if (nuevaCausa.trim()) {
      setFormData(prev => ({
        ...prev,
        causas: [...prev.causas, nuevaCausa.trim()]
      }));
      setNuevaCausa('');
    }
  };

  const removeCausa = (index: number) => {
    setFormData(prev => ({
      ...prev,
      causas: prev.causas.filter((_, i) => i !== index)
    }));
  };

  const addConsecuencia = () => {
    if (nuevaConsecuencia.trim()) {
      setFormData(prev => ({
        ...prev,
        consecuencias: [...prev.consecuencias, nuevaConsecuencia.trim()]
      }));
      setNuevaConsecuencia('');
    }
  };

  const removeConsecuencia = (index: number) => {
    setFormData(prev => ({
      ...prev,
      consecuencias: prev.consecuencias.filter((_, i) => i !== index)
    }));
  };

  const canProceed = !!(formData.problemaDescripcion && formData.causas.length > 0 && formData.objetivo && formData.areaCurricular);
  const progress = (
    (formData.problemaDescripcion ? 20 : 0) +
    (formData.causas.length > 0 ? 20 : 0) +
    (formData.consecuencias.length > 0 ? 15 : 0) +
    (formData.objetivo ? 25 : 0) +
    (formData.areaCurricular ? 20 : 0)
  );

  if (!proyecto) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }

  return (
    <CNPIEAcceleratorLayout
      proyectoId={proyecto.id}
      tipoProyecto="2A"
      etapaNumber={1}
      aceleradorNumber={1}
      onSave={handleSave}
      onValidate={handleValidate}
      canProceed={canProceed}
      currentProgress={progress}
      titulo="Contexto e Intencionalidad"
      descripcion="Define el problema central, causas, consecuencias y objetivo de tu proyecto"
    >
      <div className="grid md:grid-cols-3 gap-6">
        {/* Formulario principal */}
        <div className="md:col-span-2 space-y-6">
          <DocumentosExtractionButton
            documentos={documentos}
            expectedFields={documentFieldSchema}
            contextoProyecto={getAllData()}
            onDataExtracted={handleAutoFill}
            aceleradorKey="etapa1_acelerador1"
          />

          <RepositoryExtractionButton
            expectedFields={documentFieldSchema}
            contextoProyecto={getAllData()}
            onDataExtracted={handleAutoFill}
            aceleradorKey="etapa1_acelerador1"
          />

          {/* Área Curricular - NUEVO */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Área Curricular
              </CardTitle>
              <CardDescription>
                Selecciona el área curricular en la que desarrollarás tu proyecto pedagógico (según CNEB Secundaria)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={formData.areaCurricular}
                onValueChange={(value) => setFormData(prev => ({ ...prev, areaCurricular: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un área curricular..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Comunicación">Comunicación</SelectItem>
                  <SelectItem value="Matemática">Matemática</SelectItem>
                  <SelectItem value="Ciencia y Tecnología">Ciencia y Tecnología</SelectItem>
                  <SelectItem value="Ciencias Sociales">Ciencias Sociales</SelectItem>
                  <SelectItem value="Desarrollo Personal, Ciudadanía y Cívica">Desarrollo Personal, Ciudadanía y Cívica</SelectItem>
                  <SelectItem value="Educación para el Trabajo">Educación para el Trabajo</SelectItem>
                  <SelectItem value="Educación Física">Educación Física</SelectItem>
                  <SelectItem value="Arte y Cultura">Arte y Cultura</SelectItem>
                  <SelectItem value="Educación Religiosa">Educación Religiosa</SelectItem>
                  <SelectItem value="Inglés como Lengua Extranjera">Inglés como Lengua Extranjera</SelectItem>
                </SelectContent>
              </Select>
              {formData.areaCurricular && (
                <div className="mt-3 p-3 bg-primary/5 rounded-md">
                  <p className="text-sm text-muted-foreground">
                    <strong>Área seleccionada:</strong> {formData.areaCurricular}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Las competencias CNEB que podrás seleccionar en los siguientes aceleradores estarán filtradas según esta área.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Problema Central */}
          <Card>
            <CardHeader>
              <CardTitle>Problema Central</CardTitle>
              <CardDescription>
                Describe claramente el problema educativo que motivó tu proyecto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.problemaDescripcion}
                onChange={(e) => setFormData(prev => ({ ...prev, problemaDescripcion: e.target.value }))}
                placeholder="Describe el problema central de manera específica, identificando qué está sucediendo, a quiénes afecta y en qué contexto..."
                className="min-h-[150px]"
                maxLength={rubricaIntencionalidad?.extension_maxima || 3000}
              />
              <div className="text-xs text-muted-foreground mt-2">
                {formData.problemaDescripcion.length} / {rubricaIntencionalidad?.extension_maxima || 3000} caracteres
              </div>
            </CardContent>
          </Card>

          {/* Causas */}
          <Card>
            <CardHeader>
              <CardTitle>Causas del Problema</CardTitle>
              <CardDescription>
                Identifica las causas que originan este problema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={nuevaCausa}
                  onChange={(e) => setNuevaCausa(e.target.value)}
                  placeholder="Escribe una causa..."
                  onKeyPress={(e) => e.key === 'Enter' && addCausa()}
                />
                <Button onClick={addCausa} size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {formData.causas.map((causa, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded">
                    <span className="flex-1 text-sm">{causa}</span>
                    <Button variant="ghost" size="icon" onClick={() => removeCausa(idx)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Consecuencias */}
          <Card>
            <CardHeader>
              <CardTitle>Consecuencias</CardTitle>
              <CardDescription>
                ¿Qué sucede como resultado de este problema?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={nuevaConsecuencia}
                  onChange={(e) => setNuevaConsecuencia(e.target.value)}
                  placeholder="Escribe una consecuencia..."
                  onKeyPress={(e) => e.key === 'Enter' && addConsecuencia()}
                />
                <Button onClick={addConsecuencia} size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {formData.consecuencias.map((cons, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded">
                    <span className="flex-1 text-sm">{cons}</span>
                    <Button variant="ghost" size="icon" onClick={() => removeConsecuencia(idx)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Objetivo */}
          <Card>
            <CardHeader>
              <CardTitle>Objetivo del Proyecto</CardTitle>
              <CardDescription>
                Define un objetivo SMART (Específico, Medible, Alcanzable, Relevante, Temporal)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.objetivo}
                onChange={(e) => setFormData(prev => ({ ...prev, objetivo: e.target.value }))}
                placeholder="Ej: Mejorar en un 30% el desarrollo de la competencia 'Resuelve problemas de cantidad' en estudiantes de 4to grado, mediante la metodología ABP, durante el año escolar 2025..."
                className="min-h-[100px]"
                maxLength={1500}
              />
              <div className="text-xs text-muted-foreground mt-2">
                {formData.objetivo.length} / 1500 caracteres
              </div>
            </CardContent>
          </Card>

          {/* Contexto Adicional */}
          <Card>
            <CardHeader>
              <CardTitle>Contexto Institucional</CardTitle>
              <CardDescription>
                Describe brevemente el contexto de tu institución educativa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.contexto}
                onChange={(e) => setFormData(prev => ({ ...prev, contexto: e.target.value }))}
                placeholder="Ubicación, nivel educativo, características de estudiantes, recursos disponibles, etc..."
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
            {analyzing ? "Analizando..." : "Analizar con IA"}
          </Button>

          {/* Resultados del Análisis */}
          {analysis && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>Análisis de la IA</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm">Puntaje estimado:</span>
                  <Badge variant="default" className="text-lg">
                    {analysis.puntaje_estimado} / 20 pts
                  </Badge>
                  <Badge variant="outline">
                    {analysis.completitud}% completo
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
              rubricas={rubricaIntencionalidad ? [rubricaIntencionalidad] : []}
              destacarCriterios={['Intencionalidad']}
            />
          </div>
        </div>
      </div>

      <CNPIERubricScoreButton
        proyectoId={proyecto.id}
        categoria="2A"
        datosProyecto={getAllData()}
      />
    </CNPIEAcceleratorLayout>
  );
}
