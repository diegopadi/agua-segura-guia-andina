import { useState, useEffect } from "react";
import { useCNPIEProject } from "@/hooks/useCNPIEProject";
import { useCNPIERubric } from "@/hooks/useCNPIERubric";
import { CNPIEAcceleratorLayout } from "@/components/cnpie/CNPIEAcceleratorLayout";
import { CNPIERubricViewer } from "@/components/cnpie/CNPIERubricViewer";
import { CNPIERubricScoreButton } from "@/components/cnpie/CNPIERubricScoreButton";
import { RepositoryExtractionButton } from "@/components/RepositoryExtractionButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Lightbulb, Plus, X, BookOpen } from "lucide-react";
import { DocumentFieldSchema } from "@/types/document-extraction";

export default function Etapa1Acelerador1() {
  const {
    proyecto,
    saveAcceleratorData,
    validateAccelerator,
    getAcceleratorData,
    getAllData,
  } = useCNPIEProject("2A");
  const { rubricas, getCriterioByName } = useCNPIERubric("2A");
  const { toast } = useToast();

  const rubricaIntencionalidad = getCriterioByName("Intencionalidad");

  const [formData, setFormData] = useState({
    problemaDescripcion: "",
    causas: [] as string[],
    consecuencias: [] as string[],
    objetivo: "",
    contexto: "",
    areaCurricular: "",
  });

  const [nuevaCausa, setNuevaCausa] = useState("");
  const [nuevaConsecuencia, setNuevaConsecuencia] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const documentFieldSchema: DocumentFieldSchema[] = [
    {
      fieldName: "problemaDescripcion",
      label: "Problema Central",
      type: "textarea",
      description: "Descripción del problema educativo",
      maxLength: 3000,
    },
    {
      fieldName: "objetivo",
      label: "Objetivo",
      type: "textarea",
      description: "Objetivo SMART del proyecto",
      maxLength: 1500,
    },
    {
      fieldName: "contexto",
      label: "Contexto",
      type: "textarea",
      description: "Contexto institucional",
    },
    {
      fieldName: "areaCurricular",
      label: "Área Curricular",
      type: "text",
      description: "Área curricular del CNEB",
    },
  ];

  const handleAutoFill = (extractedData: any) => {
    setFormData((prev) => ({ ...prev, ...extractedData }));
    toast({
      title: "Datos extraídos",
      description: "Revisa y completa la información",
    });
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
    if (
      !formData.problemaDescripcion ||
      formData.causas.length === 0 ||
      !formData.objetivo
    ) {
      toast({
        title: "Campos incompletos",
        description:
          "Completa al menos el problema, causas y objetivo para analizar",
        variant: "destructive",
      });
      return;
    }

    try {
      setAnalyzing(true);

      const { data, error } = await supabase.functions.invoke(
        "analyze-cnpie-intencionalidad",
        {
          body: formData,
        }
      );

      if (error) throw error;

      if (data.success) {
        setAnalysis(data.analysis);
        toast({
          title: "Análisis completado",
          description: "La IA ha analizado tu intencionalidad",
        });
      }
    } catch (error: any) {
      console.error("Error analyzing:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const addCausa = () => {
    if (nuevaCausa.trim()) {
      setFormData((prev) => ({
        ...prev,
        causas: [...prev.causas, nuevaCausa.trim()],
      }));
      setNuevaCausa("");
    }
  };

  const removeCausa = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      causas: prev.causas.filter((_, i) => i !== index),
    }));
  };

  const addConsecuencia = () => {
    if (nuevaConsecuencia.trim()) {
      setFormData((prev) => ({
        ...prev,
        consecuencias: [...prev.consecuencias, nuevaConsecuencia.trim()],
      }));
      setNuevaConsecuencia("");
    }
  };

  const removeConsecuencia = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      consecuencias: prev.consecuencias.filter((_, i) => i !== index),
    }));
  };

  const canProceed = !!(
    formData.problemaDescripcion &&
    formData.causas.length > 0 &&
    formData.objetivo &&
    formData.areaCurricular
  );
  const progress =
    (formData.problemaDescripcion ? 20 : 0) +
    (formData.causas.length > 0 ? 20 : 0) +
    (formData.consecuencias.length > 0 ? 15 : 0) +
    (formData.objetivo ? 25 : 0) +
    (formData.areaCurricular ? 20 : 0);

  if (!proyecto) {
    return (
      <div className="flex items-center justify-center h-screen">
        Cargando...
      </div>
    );
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
      titulo="Contexto e Intencionalidadsss"
      descripcion="Define el problema central, causas, consecuencias y objetivo de tu proyecto"
    >
      <div className="grid md:grid-cols-3 gap-6">
        {/* Formulario principal */}
        <div className="md:col-span-2 space-y-6">
          <RepositoryExtractionButton
            expectedFields={documentFieldSchema}
            contextoProyecto={getAllData()}
            onDataExtracted={handleAutoFill}
            aceleradorKey="etapa1_acelerador1"
          />

          <Card className="border-0 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
              <CardTitle className="text-2xl">Ficha de postulación</CardTitle>
              <CardDescription>
                Completa cada sección para estructurar tu proyecto
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Accordion type="single" collapsible className="w-full">
                {/* 1. IDENTIFICACIÓN DEL PROBLEMA */}
                <AccordionItem
                  value="item-1"
                  className="border rounded-lg mb-4 px-4"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-base">
                        1. IDENTIFICACIÓN DEL PROBLEMA Y DESCRIPCIÓN DE
                        OBJETIVOS
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 space-y-6">
                    {/* Pregunta 1.1 */}
                    <div className="space-y-4">
                      <Card className="bg-amber-50 border-amber-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-amber-900">
                            Pregunta 1.1
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-700">
                            ¿Cuál es el problema educativo que quieres abordar?
                          </p>
                        </CardContent>
                      </Card>

                      <Textarea
                        value={formData.problemaDescripcion}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            problemaDescripcion: e.target.value,
                          })
                        }
                        placeholder="Escribe tu respuesta aquí..."
                        className="min-h-[120px]"
                      />
                    </div>

                    {/* Pregunta 1.2 */}
                    <div className="space-y-4">
                      <Card className="bg-amber-50 border-amber-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-amber-900">
                            Pregunta 1.2
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-700">
                            ¿Cuál es el objetivo principal de tu proyecto?
                          </p>
                        </CardContent>
                      </Card>

                      <Textarea
                        value={formData.objetivo}
                        onChange={(e) =>
                          setFormData({ ...formData, objetivo: e.target.value })
                        }
                        placeholder="Escribe tu respuesta aquí..."
                        className="min-h-[120px]"
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 2. SOLUCIÓN INNOVADORA */}
                <AccordionItem
                  value="item-2"
                  className="border rounded-lg mb-4 px-4"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-base">
                        2. SOLUCIÓN INNOVADORA
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 space-y-4">
                    <div>
                      <Label className="text-base font-semibold mb-3 block">
                        Contexto institucional
                      </Label>
                      <Textarea
                        value={formData.contexto}
                        onChange={(e) =>
                          setFormData({ ...formData, contexto: e.target.value })
                        }
                        placeholder="Describe el contexto de tu institución educativa..."
                        className="min-h-[120px]"
                      />
                    </div>
                    <div>
                      <Label className="text-base font-semibold mb-3 block">
                        Área Curricular
                      </Label>
                      <Input
                        value={formData.areaCurricular}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            areaCurricular: e.target.value,
                          })
                        }
                        placeholder="Ej: Matemática, Comunicación, etc."
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 3. IMPACTO DE LA IMPLEMENTACIÓN */}
                <AccordionItem
                  value="item-3"
                  className="border-2 border-blue-300 rounded-lg mb-4 px-4 bg-blue-50"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-base text-blue-900">
                        3. IMPACTO DE LA IMPLEMENTACIÓN
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <p className="text-sm text-gray-600 italic">
                      Esta sección se completará en etapas posteriores
                    </p>
                  </AccordionContent>
                </AccordionItem>

                {/* 4. SOSTENIBILIDAD */}
                <AccordionItem
                  value="item-4"
                  className="border rounded-lg mb-4 px-4"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-base">
                        4. SOSTENIBILIDAD
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <p className="text-sm text-gray-600 italic">
                      Esta sección se completará en etapas posteriores
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Botón de análisis */}
          <div className="flex justify-center">
            <Button
              onClick={handleAnalyze}
              disabled={analyzing}
              size="lg"
              className="gap-2"
            >
              {analyzing ? (
                <>
                  <Lightbulb className="w-5 h-5 animate-pulse" />
                  Analizando...
                </>
              ) : (
                <>
                  <Lightbulb className="w-5 h-5" />
                  Analizar con IA
                </>
              )}
            </Button>
          </div>

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
                    <h4 className="font-semibold text-green-600 mb-2">
                      Fortalezas
                    </h4>
                    <ul className="space-y-1">
                      {analysis.fortalezas.map((f: string, idx: number) => (
                        <li
                          key={idx}
                          className="text-sm flex items-start gap-2"
                        >
                          <span className="text-green-600">•</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.areas_mejorar &&
                  analysis.areas_mejorar.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-yellow-600 mb-2">
                        Áreas a mejorar
                      </h4>
                      <ul className="space-y-1">
                        {analysis.areas_mejorar.map(
                          (a: string, idx: number) => (
                            <li
                              key={idx}
                              className="text-sm flex items-start gap-2"
                            >
                              <span className="text-yellow-600">•</span>
                              <span>{a}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                {analysis.sugerencias && analysis.sugerencias.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Sugerencias</h4>
                    <ul className="space-y-1">
                      {analysis.sugerencias.map((s: string, idx: number) => (
                        <li
                          key={idx}
                          className="text-sm flex items-start gap-2"
                        >
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
              destacarCriterios={["Intencionalidad"]}
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
