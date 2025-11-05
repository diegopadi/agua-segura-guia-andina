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
import { Lightbulb, Plus, X, TrendingUp } from "lucide-react";

interface Indicador {
  nombre: string;
  lineaBase: string;
  resultadoActual: string;
  porcentajeMejora: string;
}

export default function Etapa2Acelerador3() {
  const { proyecto, saveAcceleratorData, validateAccelerator, getAcceleratorData } = useCNPIEProject('2A');
  const { getCriterioByName } = useCNPIERubric('2A');
  const { toast } = useToast();

  const rubricaImpacto = getCriterioByName('Impacto');

  const [formData, setFormData] = useState({
    descripcionImpacto: '',
    indicadores: [] as Indicador[],
    evidenciasDocumentales: '',
    testimonios: '',
    datosComparativos: ''
  });

  const [nuevoIndicador, setNuevoIndicador] = useState<Indicador>({
    nombre: '',
    lineaBase: '',
    resultadoActual: '',
    porcentajeMejora: ''
  });

  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  useEffect(() => {
    const savedData = getAcceleratorData(2, 3);
    if (savedData) {
      setFormData(savedData);
      if (savedData.analysis) setAnalysis(savedData.analysis);
    }
  }, [proyecto]);

  const handleSave = async () => {
    const dataToSave = { ...formData, analysis };
    return await saveAcceleratorData(2, 3, dataToSave);
  };

  const handleValidate = async () => {
    await handleSave();
    return await validateAccelerator(2, 3);
  };

  const handleAnalyze = async () => {
    if (!formData.descripcionImpacto || formData.indicadores.length === 0) {
      toast({
        title: "Campos incompletos",
        description: "Completa al menos la descripción y un indicador",
        variant: "destructive"
      });
      return;
    }

    try {
      setAnalyzing(true);
      const { data, error } = await supabase.functions.invoke('analyze-cnpie-impacto', {
        body: formData
      });

      if (error) throw error;

      if (data.success) {
        setAnalysis(data.analysis);
        toast({
          title: "Análisis completado",
          description: "La IA ha analizado el impacto de tu proyecto"
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

  const addIndicador = () => {
    if (nuevoIndicador.nombre.trim() && nuevoIndicador.lineaBase.trim()) {
      setFormData(prev => ({
        ...prev,
        indicadores: [...prev.indicadores, { ...nuevoIndicador }]
      }));
      setNuevoIndicador({ nombre: '', lineaBase: '', resultadoActual: '', porcentajeMejora: '' });
    }
  };

  const removeIndicador = (index: number) => {
    setFormData(prev => ({
      ...prev,
      indicadores: prev.indicadores.filter((_, i) => i !== index)
    }));
  };

  const canProceed = !!(formData.descripcionImpacto && formData.indicadores.length > 0);
  const progress = (
    (formData.descripcionImpacto ? 30 : 0) +
    (formData.indicadores.length > 0 ? 30 : 0) +
    (formData.evidenciasDocumentales ? 20 : 0) +
    (formData.testimonios ? 20 : 0)
  );

  if (!proyecto) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }

  return (
    <CNPIEAcceleratorLayout
      proyectoId={proyecto.id}
      tipoProyecto="2A"
      etapaNumber={2}
      aceleradorNumber={3}
      onSave={handleSave}
      onValidate={handleValidate}
      canProceed={canProceed}
      currentProgress={progress}
      titulo="Impacto y Resultados"
      descripcion="Documenta los resultados cuantitativos y cualitativos de tu proyecto"
    >
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Descripción del Impacto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Descripción del Impacto
              </CardTitle>
              <CardDescription>
                Describe de manera general el impacto observado en estudiantes y la comunidad educativa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.descripcionImpacto}
                onChange={(e) => setFormData(prev => ({ ...prev, descripcionImpacto: e.target.value }))}
                placeholder="Describe los cambios observados en aprendizajes, actitudes, prácticas pedagógicas, clima institucional, etc..."
                className="min-h-[150px]"
                maxLength={rubricaImpacto?.extension_maxima || 3000}
              />
              <div className="text-xs text-muted-foreground mt-2">
                {formData.descripcionImpacto.length} / {rubricaImpacto?.extension_maxima || 3000} caracteres
              </div>
            </CardContent>
          </Card>

          {/* Indicadores Cuantitativos */}
          <Card>
            <CardHeader>
              <CardTitle>Indicadores Cuantitativos</CardTitle>
              <CardDescription>
                Registra indicadores medibles con línea base y resultados actuales
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 p-4 bg-muted rounded-lg">
                <div>
                  <Label>Nombre del Indicador</Label>
                  <Input
                    value={nuevoIndicador.nombre}
                    onChange={(e) => setNuevoIndicador(prev => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Ej: Nivel de logro en competencia matemática"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <Label>Línea Base (inicio)</Label>
                    <Input
                      value={nuevoIndicador.lineaBase}
                      onChange={(e) => setNuevoIndicador(prev => ({ ...prev, lineaBase: e.target.value }))}
                      placeholder="Ej: 35% en nivel logrado"
                    />
                  </div>
                  <div>
                    <Label>Resultado Actual</Label>
                    <Input
                      value={nuevoIndicador.resultadoActual}
                      onChange={(e) => setNuevoIndicador(prev => ({ ...prev, resultadoActual: e.target.value }))}
                      placeholder="Ej: 68% en nivel logrado"
                    />
                  </div>
                </div>
                <div>
                  <Label>Porcentaje de Mejora (%)</Label>
                  <Input
                    value={nuevoIndicador.porcentajeMejora}
                    onChange={(e) => setNuevoIndicador(prev => ({ ...prev, porcentajeMejora: e.target.value }))}
                    placeholder="Ej: 94% de mejora"
                  />
                </div>
                <Button onClick={addIndicador} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Indicador
                </Button>
              </div>

              <div className="space-y-2">
                {formData.indicadores.map((ind, idx) => (
                  <div key={idx} className="p-3 border rounded-lg bg-card">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold">{ind.nombre}</h4>
                      <Button variant="ghost" size="icon" onClick={() => removeIndicador(idx)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="text-sm space-y-1">
                      <p><span className="font-medium">Línea Base:</span> {ind.lineaBase}</p>
                      <p><span className="font-medium">Resultado Actual:</span> {ind.resultadoActual}</p>
                      {ind.porcentajeMejora && (
                        <p><span className="font-medium">Mejora:</span> {ind.porcentajeMejora}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Evidencias Documentales */}
          <Card>
            <CardHeader>
              <CardTitle>Evidencias Documentales</CardTitle>
              <CardDescription>
                Describe las evidencias que respaldan el impacto (fotos, videos, registros, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.evidenciasDocumentales}
                onChange={(e) => setFormData(prev => ({ ...prev, evidenciasDocumentales: e.target.value }))}
                placeholder="Enumera y describe las evidencias documentales del impacto..."
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>

          {/* Testimonios */}
          <Card>
            <CardHeader>
              <CardTitle>Testimonios y Percepciones</CardTitle>
              <CardDescription>
                Registra testimonios de estudiantes, docentes o familias sobre el proyecto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.testimonios}
                onChange={(e) => setFormData(prev => ({ ...prev, testimonios: e.target.value }))}
                placeholder="Cita testimonios representativos que evidencien el impacto del proyecto..."
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
            {analyzing ? "Analizando..." : "Analizar Impacto con IA"}
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
              rubricas={rubricaImpacto ? [rubricaImpacto] : []}
              destacarCriterios={['Impacto']}
            />
          </div>
        </div>
      </div>
    </CNPIEAcceleratorLayout>
  );
}
