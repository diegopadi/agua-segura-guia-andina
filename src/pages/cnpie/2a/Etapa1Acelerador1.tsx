import { useState, useEffect } from "react";
import { useCNPIEProject } from "@/hooks/useCNPIEProject";
import { useCNPIERubric } from "@/hooks/useCNPIERubric";
import { CNPIEAcceleratorLayout } from "@/components/cnpie/CNPIEAcceleratorLayout";
import { CNPIERubricViewer } from "@/components/cnpie/CNPIERubricViewer";
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
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Lightbulb,
  BookOpen,
  CheckCircle,
  Download,
  Sparkles,
  MessageSquare,
  FileText,
  Upload,
  Link as LinkIcon,
  Loader2,
  Save,
  Clock,
} from "lucide-react";
import { DocumentFieldSchema } from "@/types/document-extraction";
import {
  FormDataStep1,
  AnalysisStep2,
  FormDataStep3,
  FinalAnalysisStep4,
  ITEMS_FICHA_2A,
  ANEXO_2A_LIMITS,
  BienServicio,
} from "@/types/cnpie";

// Pasos del flujo
const STEPS = [
  {
    number: 1,
    title: "Respuestas Iniciales",
    icon: BookOpen,
    description: "Completa las preguntas de la ficha",
  },
  {
    number: 2,
    title: "Análisis de IA",
    icon: Sparkles,
    description: "Revisión inteligente por ítem",
  },
  {
    number: 3,
    title: "Preguntas Complementarias",
    icon: MessageSquare,
    description: "Profundiza tus respuestas",
  },
  {
    number: 4,
    title: "Resultado Final",
    icon: CheckCircle,
    description: "Análisis completo y descarga",
  },
];

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

  // Estado del paso actual y pasos completados
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Estados para cada paso
  const [step1Data, setStep1Data] = useState<FormDataStep1>({
    problema_descripcion: "",
    objetivo_general: "",
    objetivos_especificos: [],
    metodologia_descripcion: "",
    procedimiento_metodologico: "",
    video_url: "",
    impacto_evidencias: "",
    impacto_cambios: "",
    sostenibilidad_estrategias: "",
    sostenibilidad_viabilidad: "",
    sostenibilidad_bienes_servicios: "",
    bienes_servicios: [],
    area_curricular: "",
    competencias_cneb: [],
  });

  const [step2Data, setStep2Data] = useState<AnalysisStep2 | null>(null);
  const [step3Data, setStep3Data] = useState<FormDataStep3 | null>(null);
  const [step4Data, setStep4Data] = useState<FinalAnalysisStep4 | null>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);

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

  // Cargar datos guardados al montar el componente
  useEffect(() => {
    const savedData = getAcceleratorData(1, 1);
    if (savedData) {
      setCurrentStep(savedData.current_step || 1);
      setCompletedSteps(savedData.completed_steps || []);
      if (savedData.step1_data) setStep1Data(savedData.step1_data);
      if (savedData.step2_data) setStep2Data(savedData.step2_data);
      if (savedData.step3_data) setStep3Data(savedData.step3_data);
      if (savedData.step4_data) setStep4Data(savedData.step4_data);
    }
  }, [proyecto, getAcceleratorData]);

  // Guardar datos
  const handleSave = async () => {
    setSaving(true);
    try {
      const dataToSave = {
        current_step: currentStep,
        completed_steps: completedSteps,
        step1_data: step1Data,
        step2_data: step2Data,
        step3_data: step3Data,
        step4_data: step4Data,
        last_updated: new Date().toISOString(),
      };

      return await saveAcceleratorData(1, 1, dataToSave);
    } finally {
      setSaving(false);
    }
  };

  const handleValidate = async () => {
    await handleSave();
    return await validateAccelerator(1, 1);
  };

  // Validar si se puede avanzar
  const canProceedToStep2 = () => {
    return (
      step1Data.problema_descripcion.trim().length > 0 &&
      step1Data.objetivo_general.trim().length > 0 &&
      step1Data.metodologia_descripcion.trim().length > 0
    );
  };

  // Analizar con IA (Paso 1 → Paso 2)
  const handleAnalyze = async () => {
    if (!canProceedToStep2()) {
      toast({
        title: "Campos incompletos",
        description: "Completa los campos obligatorios antes de continuar",
        variant: "destructive",
      });
      return;
    }

    try {
      setAnalyzing(true);

      const { data, error } = await supabase.functions.invoke(
        "analyze-cnpie-intencionalidad",
        {
          body: step1Data,
        }
      );

      if (error) throw error;

      if (data.success) {
        setStep2Data(data.analysis);
        setCompletedSteps([...completedSteps, 1]);
        setCurrentStep(2);
        await handleSave();
        toast({
          title: "Análisis completado",
          description: "La IA ha analizado tu proyecto",
        });
      }
    } catch (error: unknown) {
      console.error("Error analyzing:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const getStepStatus = (stepNumber: number) => {
    if (completedSteps.includes(stepNumber)) return "completed";
    if (stepNumber === currentStep) return "current";
    return "pending";
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return null;
    }
  };

  // PASO 1: Respuestas Iniciales (ANEXO N° 2A)
  const renderStep1 = () => {
    return (
      <div className="space-y-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6 pb-2">
            <Accordion type="single" collapsible className="w-full space-y-3">
              {/* SECCIÓN 1: IDENTIFICACIÓN DEL PROBLEMA Y DESCRIPCIÓN DE OBJETIVOS */}
              <AccordionItem value="item-1" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-base">
                      1. {ITEMS_FICHA_2A[0].titulo}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-6">
                  {/* Pregunta 1.1 */}
                  <div className="space-y-4">
                    <Card className="bg-amber-50 border-amber-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-amber-900">
                          Pregunta {ITEMS_FICHA_2A[0].preguntas[0].numero}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700">
                          {ITEMS_FICHA_2A[0].preguntas[0].texto}
                        </p>
                      </CardContent>
                    </Card>
                    <Textarea
                      value={step1Data.problema_descripcion}
                      onChange={(e) =>
                        setStep1Data({
                          ...step1Data,
                          problema_descripcion: e.target.value,
                        })
                      }
                      placeholder="Describe el problema educativo identificado en tu IE..."
                      className="min-h-[200px]"
                      maxLength={ANEXO_2A_LIMITS.PROBLEMA_CARACTERIZACION}
                    />
                    <div className="flex justify-end">
                      <span className="text-xs text-muted-foreground">
                        {step1Data.problema_descripcion.length} /{" "}
                        {ANEXO_2A_LIMITS.PROBLEMA_CARACTERIZACION} caracteres
                      </span>
                    </div>
                  </div>

                  {/* Pregunta 1.2 */}
                  <div className="space-y-4">
                    <Card className="bg-amber-50 border-amber-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-amber-900">
                          Pregunta {ITEMS_FICHA_2A[0].preguntas[1].numero}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700">
                          {ITEMS_FICHA_2A[0].preguntas[1].texto}
                        </p>
                      </CardContent>
                    </Card>
                    <Textarea
                      value={step1Data.objetivo_general}
                      onChange={(e) =>
                        setStep1Data({
                          ...step1Data,
                          objetivo_general: e.target.value,
                        })
                      }
                      placeholder="Redacta el objetivo general del PIE..."
                      className="min-h-[120px]"
                      maxLength={ANEXO_2A_LIMITS.OBJETIVOS}
                    />
                    <div className="flex justify-end">
                      <span className="text-xs text-muted-foreground">
                        {step1Data.objetivo_general.length} /{" "}
                        {ANEXO_2A_LIMITS.OBJETIVOS} caracteres
                      </span>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* SECCIÓN 2: SOLUCIÓN INNOVADORA */}
              <AccordionItem value="item-2" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-base">
                      2. {ITEMS_FICHA_2A[1].titulo}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-6">
                  {/* Pregunta 2.1 */}
                  <div className="space-y-4">
                    <Card className="bg-amber-50 border-amber-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-amber-900">
                          Pregunta {ITEMS_FICHA_2A[1].preguntas[0].numero}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700">
                          {ITEMS_FICHA_2A[1].preguntas[0].texto}
                        </p>
                      </CardContent>
                    </Card>
                    <Textarea
                      value={step1Data.metodologia_descripcion}
                      onChange={(e) =>
                        setStep1Data({
                          ...step1Data,
                          metodologia_descripcion: e.target.value,
                        })
                      }
                      placeholder="Describe la metodología pedagógica..."
                      className="min-h-[150px]"
                      maxLength={ANEXO_2A_LIMITS.METODOLOGIA_DESCRIPCION}
                    />
                    <div className="flex justify-end">
                      <span className="text-xs text-muted-foreground">
                        {step1Data.metodologia_descripcion.length} /{" "}
                        {ANEXO_2A_LIMITS.METODOLOGIA_DESCRIPCION} caracteres
                      </span>
                    </div>
                  </div>

                  {/* Pregunta 2.2 */}
                  <div className="space-y-4">
                    <Card className="bg-amber-50 border-amber-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-amber-900">
                          Pregunta {ITEMS_FICHA_2A[1].preguntas[1].numero}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700">
                          {ITEMS_FICHA_2A[1].preguntas[1].texto}
                        </p>
                      </CardContent>
                    </Card>
                    <Textarea
                      value={step1Data.procedimiento_metodologico}
                      onChange={(e) =>
                        setStep1Data({
                          ...step1Data,
                          procedimiento_metodologico: e.target.value,
                        })
                      }
                      placeholder="Describe el procedimiento paso a paso..."
                      className="min-h-[200px]"
                      maxLength={ANEXO_2A_LIMITS.PROCEDIMIENTO_METODOLOGICO}
                    />
                    <div className="flex justify-end">
                      <span className="text-xs text-muted-foreground">
                        {step1Data.procedimiento_metodologico.length} /{" "}
                        {ANEXO_2A_LIMITS.PROCEDIMIENTO_METODOLOGICO} caracteres
                      </span>
                    </div>

                    {/* Video opcional */}
                    <div className="pt-2">
                      <Label className="text-sm font-medium mb-2 block">
                        Video explicativo (opcional - máximo 3 minutos)
                      </Label>
                      <Input
                        type="url"
                        value={step1Data.video_url || ""}
                        onChange={(e) =>
                          setStep1Data({
                            ...step1Data,
                            video_url: e.target.value,
                          })
                        }
                        placeholder="https://youtube.com/watch?v=..."
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* SECCIÓN 3: IMPACTO DE LA IMPLEMENTACIÓN */}
              <AccordionItem value="item-3" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-base">
                      3. {ITEMS_FICHA_2A[2].titulo}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-6">
                  {/* Pregunta 3.1 */}
                  <div className="space-y-4">
                    <Card className="bg-amber-50 border-amber-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-amber-900">
                          Pregunta {ITEMS_FICHA_2A[2].preguntas[0].numero}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700">
                          {ITEMS_FICHA_2A[2].preguntas[0].texto}
                        </p>
                      </CardContent>
                    </Card>
                    <Textarea
                      value={step1Data.impacto_evidencias || ""}
                      onChange={(e) =>
                        setStep1Data({
                          ...step1Data,
                          impacto_evidencias: e.target.value,
                        })
                      }
                      placeholder="Sustenta con evidencias los resultados obtenidos..."
                      className="min-h-[200px]"
                      maxLength={ANEXO_2A_LIMITS.IMPACTO_EVIDENCIAS}
                    />
                    <div className="flex justify-end">
                      <span className="text-xs text-muted-foreground">
                        {(step1Data.impacto_evidencias || "").length} /{" "}
                        {ANEXO_2A_LIMITS.IMPACTO_EVIDENCIAS} caracteres
                      </span>
                    </div>
                  </div>

                  {/* Pregunta 3.2 */}
                  <div className="space-y-4">
                    <Card className="bg-amber-50 border-amber-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-amber-900">
                          Pregunta {ITEMS_FICHA_2A[2].preguntas[1].numero}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700">
                          {ITEMS_FICHA_2A[2].preguntas[1].texto}
                        </p>
                      </CardContent>
                    </Card>
                    <Textarea
                      value={step1Data.impacto_cambios || ""}
                      onChange={(e) =>
                        setStep1Data({
                          ...step1Data,
                          impacto_cambios: e.target.value,
                        })
                      }
                      placeholder="Explica los cambios o efectos logrados..."
                      className="min-h-[150px]"
                      maxLength={ANEXO_2A_LIMITS.IMPACTO_CAMBIOS}
                    />
                    <div className="flex justify-end">
                      <span className="text-xs text-muted-foreground">
                        {(step1Data.impacto_cambios || "").length} /{" "}
                        {ANEXO_2A_LIMITS.IMPACTO_CAMBIOS} caracteres
                      </span>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* SECCIÓN 4: SOSTENIBILIDAD */}
              <AccordionItem value="item-4" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-base">
                      4. {ITEMS_FICHA_2A[3].titulo}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-6">
                  {/* Pregunta 4.1 */}
                  <div className="space-y-4">
                    <Card className="bg-amber-50 border-amber-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-amber-900">
                          Pregunta {ITEMS_FICHA_2A[3].preguntas[0].numero}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700">
                          {ITEMS_FICHA_2A[3].preguntas[0].texto}
                        </p>
                      </CardContent>
                    </Card>
                    <Textarea
                      value={step1Data.sostenibilidad_estrategias || ""}
                      onChange={(e) =>
                        setStep1Data({
                          ...step1Data,
                          sostenibilidad_estrategias: e.target.value,
                        })
                      }
                      placeholder="Describe las estrategias para fomentar la continuidad..."
                      className="min-h-[150px]"
                      maxLength={ANEXO_2A_LIMITS.SOSTENIBILIDAD_ESTRATEGIAS}
                    />
                    <div className="flex justify-end">
                      <span className="text-xs text-muted-foreground">
                        {(step1Data.sostenibilidad_estrategias || "").length} /{" "}
                        {ANEXO_2A_LIMITS.SOSTENIBILIDAD_ESTRATEGIAS} caracteres
                      </span>
                    </div>
                  </div>

                  {/* Pregunta 4.2 */}
                  <div className="space-y-4">
                    <Card className="bg-amber-50 border-amber-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-amber-900">
                          Pregunta {ITEMS_FICHA_2A[3].preguntas[1].numero}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700">
                          {ITEMS_FICHA_2A[3].preguntas[1].texto}
                        </p>
                      </CardContent>
                    </Card>
                    <Textarea
                      value={step1Data.sostenibilidad_viabilidad || ""}
                      onChange={(e) =>
                        setStep1Data({
                          ...step1Data,
                          sostenibilidad_viabilidad: e.target.value,
                        })
                      }
                      placeholder="Describe las estrategias para asegurar la viabilidad..."
                      className="min-h-[150px]"
                      maxLength={ANEXO_2A_LIMITS.SOSTENIBILIDAD_VIABILIDAD}
                    />
                    <div className="flex justify-end">
                      <span className="text-xs text-muted-foreground">
                        {(step1Data.sostenibilidad_viabilidad || "").length} /{" "}
                        {ANEXO_2A_LIMITS.SOSTENIBILIDAD_VIABILIDAD} caracteres
                      </span>
                    </div>
                  </div>

                  {/* Pregunta 4.3 */}
                  <div className="space-y-4">
                    <Card className="bg-amber-50 border-amber-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-amber-900">
                          Pregunta {ITEMS_FICHA_2A[3].preguntas[2].numero}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700">
                          {ITEMS_FICHA_2A[3].preguntas[2].texto}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Tabla de bienes y servicios */}
                    <div className="space-y-3">
                      <div className="border rounded-lg overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-blue-500 text-white text-xs">
                              <th className="p-2 text-left border-r border-blue-400 min-w-[100px]">
                                Componente
                              </th>
                              <th className="p-2 text-left border-r border-blue-400 min-w-[150px]">
                                Denominación
                              </th>
                              <th className="p-2 text-left border-r border-blue-400 w-20">
                                Cant.
                              </th>
                              <th className="p-2 text-left border-r border-blue-400 w-24">
                                P. Unit.
                              </th>
                              <th className="p-2 text-left border-r border-blue-400 w-24">
                                Subtotal
                              </th>
                              <th className="p-2 text-left border-r border-blue-400 min-w-[180px]">
                                Utilidad
                              </th>
                              <th className="p-2 w-10"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {(step1Data.bienes_servicios || []).map(
                              (bien, index) => (
                                <tr
                                  key={index}
                                  className="border-b hover:bg-gray-50"
                                >
                                  <td className="p-1 border-r">
                                    <Input
                                      value={bien.componente}
                                      onChange={(e) => {
                                        const newBienes = [
                                          ...(step1Data.bienes_servicios || []),
                                        ];
                                        newBienes[index].componente =
                                          e.target.value;
                                        setStep1Data({
                                          ...step1Data,
                                          bienes_servicios: newBienes,
                                        });
                                      }}
                                      placeholder="Equipamiento"
                                      className="text-xs h-8 border-0 focus-visible:ring-1"
                                    />
                                  </td>
                                  <td className="p-1 border-r">
                                    <Input
                                      value={bien.denominacion}
                                      onChange={(e) => {
                                        const newBienes = [
                                          ...(step1Data.bienes_servicios || []),
                                        ];
                                        newBienes[index].denominacion =
                                          e.target.value;
                                        setStep1Data({
                                          ...step1Data,
                                          bienes_servicios: newBienes,
                                        });
                                      }}
                                      placeholder="Nombre"
                                      className="text-xs h-8 border-0 focus-visible:ring-1"
                                    />
                                  </td>
                                  <td className="p-1 border-r">
                                    <Input
                                      type="number"
                                      value={bien.cantidad}
                                      onChange={(e) => {
                                        const newBienes = [
                                          ...(step1Data.bienes_servicios || []),
                                        ];
                                        const cantidad = parseInt(
                                          e.target.value
                                        );
                                        newBienes[index].cantidad = cantidad;
                                        newBienes[index].subtotal =
                                          cantidad *
                                          newBienes[index].precio_unitario;
                                        setStep1Data({
                                          ...step1Data,
                                          bienes_servicios: newBienes,
                                        });
                                      }}
                                      placeholder="0"
                                      className="text-xs h-8 border-0 focus-visible:ring-1 text-center"
                                      min="0"
                                    />
                                  </td>
                                  <td className="p-1 border-r">
                                    <Input
                                      type="number"
                                      value={bien.precio_unitario}
                                      onChange={(e) => {
                                        const newBienes = [
                                          ...(step1Data.bienes_servicios || []),
                                        ];
                                        const precio = parseFloat(
                                          e.target.value
                                        );
                                        newBienes[index].precio_unitario =
                                          precio;
                                        newBienes[index].subtotal =
                                          newBienes[index].cantidad * precio;
                                        setStep1Data({
                                          ...step1Data,
                                          bienes_servicios: newBienes,
                                        });
                                      }}
                                      placeholder="0.00"
                                      className="text-xs h-8 border-0 focus-visible:ring-1 text-right"
                                      step="0.01"
                                      min="0"
                                    />
                                  </td>
                                  <td className="p-1 border-r bg-gray-50">
                                    <Input
                                      type="number"
                                      value={bien.subtotal.toFixed(2)}
                                      readOnly
                                      className="text-xs h-8 border-0 bg-transparent text-right font-medium"
                                    />
                                  </td>
                                  <td className="p-1 border-r">
                                    <Textarea
                                      value={bien.descripcion_utilidad}
                                      onChange={(e) => {
                                        const newBienes = [
                                          ...(step1Data.bienes_servicios || []),
                                        ];
                                        newBienes[index].descripcion_utilidad =
                                          e.target.value;
                                        setStep1Data({
                                          ...step1Data,
                                          bienes_servicios: newBienes,
                                        });
                                      }}
                                      placeholder="Utilidad..."
                                      className="text-xs min-h-[50px] resize-none border-0 focus-visible:ring-1"
                                    />
                                  </td>
                                  <td className="p-1 text-center">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const newBienes = (
                                          step1Data.bienes_servicios || []
                                        ).filter((_, i) => i !== index);
                                        setStep1Data({
                                          ...step1Data,
                                          bienes_servicios: newBienes,
                                        });
                                      }}
                                      className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      ×
                                    </Button>
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Botón agregar fila */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newBien: BienServicio = {
                            componente: "",
                            denominacion: "",
                            cantidad: 0,
                            precio_unitario: 0,
                            subtotal: 0,
                            descripcion_utilidad: "",
                          };
                          setStep1Data({
                            ...step1Data,
                            bienes_servicios: [
                              ...(step1Data.bienes_servicios || []),
                              newBien,
                            ],
                          });
                        }}
                        className="w-full h-8"
                      >
                        + Agregar bien o servicio
                      </Button>

                      {/* Total general */}
                      {(step1Data.bienes_servicios || []).length > 0 && (
                        <div className="flex justify-end">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                            <span className="text-sm font-semibold">
                              Total General: S/{" "}
                              {(step1Data.bienes_servicios || [])
                                .reduce(
                                  (acc, bien) => acc + (bien.subtotal || 0),
                                  0
                                )
                                .toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <Textarea
                      value={step1Data.sostenibilidad_bienes_servicios || ""}
                      onChange={(e) =>
                        setStep1Data({
                          ...step1Data,
                          sostenibilidad_bienes_servicios: e.target.value,
                        })
                      }
                      placeholder="Descripción adicional de los bienes y servicios (opcional)..."
                      className="min-h-[80px]"
                      maxLength={
                        ANEXO_2A_LIMITS.SOSTENIBILIDAD_BIENES_SERVICIOS
                      }
                    />
                    <div className="flex justify-end">
                      <span className="text-xs text-muted-foreground">
                        {
                          (step1Data.sostenibilidad_bienes_servicios || "")
                            .length
                        }{" "}
                        / {ANEXO_2A_LIMITS.SOSTENIBILIDAD_BIENES_SERVICIOS}{" "}
                        caracteres
                      </span>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Botones de acción */}
            <div className="flex justify-between mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Última actualización:{" "}
                {new Date().toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Guardar
                </Button>
                <Button
                  onClick={handleAnalyze}
                  disabled={analyzing || !canProceedToStep2()}
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Analizando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Analizar con IA
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // PASO 2: Análisis de IA por ítem
  const renderStep2 = () => {
    if (!step2Data) {
      return (
        <Alert>
          <AlertDescription>
            No hay datos de análisis. Regresa al Paso 1 para analizar.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              Análisis de IA por Criterio
            </CardTitle>
            <CardDescription>
              Revisión inteligente de los 4 criterios de evaluación
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Puntaje Total */}
            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">
                  Puntaje Total Estimado:
                </span>
                <Badge className="text-2xl px-4 py-2">
                  {step2Data.puntaje_total} / 80 pts
                </Badge>
              </div>
            </div>

            <Accordion type="single" collapsible className="w-full">
              {/* Criterio 1: Intencionalidad */}
              <AccordionItem
                value="criterio-1"
                className="border rounded-lg mb-4 px-4"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <span className="font-semibold text-base">
                      1. INTENCIONALIDAD
                    </span>
                    <Badge variant="outline" className="ml-auto mr-2">
                      {step2Data.intencionalidad.puntaje_total} / 25 pts
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-4">
                  {/* Indicador 1.1 */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">
                      Indicador 1.1: Caracterización del Problema
                    </h4>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge>
                        {step2Data.intencionalidad.indicador_1_1.puntaje} / 15
                        pts
                      </Badge>
                      <Badge variant="secondary">
                        {step2Data.intencionalidad.indicador_1_1.nivel}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700">
                      {step2Data.intencionalidad.indicador_1_1.justificacion}
                    </p>
                  </div>

                  {/* Indicador 1.2 */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">
                      Indicador 1.2: Objetivos del Proyecto
                    </h4>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge>
                        {step2Data.intencionalidad.indicador_1_2.puntaje} / 10
                        pts
                      </Badge>
                      <Badge variant="secondary">
                        {step2Data.intencionalidad.indicador_1_2.nivel}
                      </Badge>
                    </div>
                    <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                      <p className="font-medium">Checklist SMART:</p>
                      <div className="grid grid-cols-2 gap-1">
                        <span>
                          {step2Data.intencionalidad.indicador_1_2
                            .checklist_smart.especifico
                            ? "✅"
                            : "❌"}{" "}
                          Específico
                        </span>
                        <span>
                          {step2Data.intencionalidad.indicador_1_2
                            .checklist_smart.medible
                            ? "✅"
                            : "❌"}{" "}
                          Medible
                        </span>
                        <span>
                          {step2Data.intencionalidad.indicador_1_2
                            .checklist_smart.alcanzable
                            ? "✅"
                            : "❌"}{" "}
                          Alcanzable
                        </span>
                        <span>
                          {step2Data.intencionalidad.indicador_1_2
                            .checklist_smart.relevante
                            ? "✅"
                            : "❌"}{" "}
                          Relevante
                        </span>
                        <span>
                          {step2Data.intencionalidad.indicador_1_2
                            .checklist_smart.temporal
                            ? "✅"
                            : "❌"}{" "}
                          Temporal
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">
                      {step2Data.intencionalidad.indicador_1_2.justificacion}
                    </p>
                  </div>

                  {/* Fortalezas y Áreas de Mejora */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Fortalezas
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {step2Data.intencionalidad.fortalezas.map((f, i) => (
                        <li key={i}>• {f}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-700 mb-2">
                      Áreas a Mejorar
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {step2Data.intencionalidad.areas_mejora.map((a, i) => (
                        <li key={i}>• {a}</li>
                      ))}
                    </ul>
                  </div>

                  {step2Data.intencionalidad.recomendaciones && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-700 mb-2">
                        Recomendaciones
                      </h4>
                      <ul className="space-y-1 text-sm">
                        {step2Data.intencionalidad.recomendaciones.map(
                          (r, i) => (
                            <li key={i}>→ {r}</li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Criterio 2: Originalidad */}
              <AccordionItem
                value="criterio-2"
                className="border rounded-lg mb-4 px-4"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <span className="font-semibold text-base">
                      2. ORIGINALIDAD
                    </span>
                    <Badge variant="outline" className="ml-auto mr-2">
                      {step2Data.originalidad.puntaje_total} / 30 pts
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-4">
                  {/* Indicador 2.1 */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">
                      Indicador 2.1: Metodología o Estrategia
                    </h4>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge>
                        {step2Data.originalidad.indicador_2_1.puntaje} / 10 pts
                      </Badge>
                      <Badge variant="secondary">
                        {step2Data.originalidad.indicador_2_1.nivel}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700">
                      {step2Data.originalidad.indicador_2_1.analisis}
                    </p>
                  </div>

                  {/* Indicador 2.2 */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">
                      Indicador 2.2: Procedimiento y Video
                    </h4>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge>
                        {step2Data.originalidad.indicador_2_2.puntaje} / 20 pts
                      </Badge>
                      <Badge variant="secondary">
                        {step2Data.originalidad.indicador_2_2.nivel}
                      </Badge>
                    </div>
                    <div className="bg-gray-50 p-3 rounded text-sm space-y-2">
                      <p>
                        <strong>Video:</strong>{" "}
                        {step2Data.originalidad.indicador_2_2.video_detectado
                          ? "✅ Detectado"
                          : "❌ No detectado"}{" "}
                        ({step2Data.originalidad.indicador_2_2.puntaje_video}{" "}
                        pts)
                      </p>
                      <p>
                        <strong>Procedimiento:</strong>{" "}
                        {
                          step2Data.originalidad.indicador_2_2
                            .calidad_procedimiento
                        }
                      </p>
                    </div>
                    <p className="text-sm text-gray-700">
                      {step2Data.originalidad.indicador_2_2.observacion}
                    </p>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Fortalezas
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {step2Data.originalidad.fortalezas.map((f, i) => (
                        <li key={i}>• {f}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-700 mb-2">
                      Áreas a Mejorar
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {step2Data.originalidad.areas_mejora.map((a, i) => (
                        <li key={i}>• {a}</li>
                      ))}
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Criterio 3: Impacto */}
              <AccordionItem
                value="criterio-3"
                className="border rounded-lg mb-4 px-4"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <span className="font-semibold text-base">3. IMPACTO</span>
                    <Badge variant="outline" className="ml-auto mr-2">
                      {step2Data.impacto.puntaje_total} / 15 pts
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-4">
                  {/* Indicador 3.1 */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">
                      Indicador 3.1: Resultados de Aprendizaje
                    </h4>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge>
                        {step2Data.impacto.indicador_3_1.puntaje} / 10 pts
                      </Badge>
                      <Badge variant="secondary">
                        {step2Data.impacto.indicador_3_1.nivel}
                      </Badge>
                    </div>
                    <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                      <p>
                        <strong>Evidencias:</strong>{" "}
                        {
                          step2Data.impacto.indicador_3_1.analisis_evidencias
                            .listado_archivos
                        }
                      </p>
                      <p>
                        <strong>Uso en texto:</strong>{" "}
                        {
                          step2Data.impacto.indicador_3_1.analisis_evidencias
                            .uso_en_texto
                        }
                      </p>
                      <p>
                        <strong>Vinculación:</strong>{" "}
                        {
                          step2Data.impacto.indicador_3_1.analisis_evidencias
                            .vinculacion_competencia
                        }
                      </p>
                    </div>
                  </div>

                  {/* Indicador 3.2 */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">
                      Indicador 3.2: Cambios Sistémicos
                    </h4>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge>
                        {step2Data.impacto.indicador_3_2.puntaje} / 5 pts
                      </Badge>
                      <Badge variant="secondary">
                        {step2Data.impacto.indicador_3_2.nivel}
                      </Badge>
                    </div>
                    <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                      <p>
                        <strong>Práctica/Gestión:</strong>{" "}
                        {
                          step2Data.impacto.indicador_3_2
                            .analisis_transformacion.practica_docente_gestion
                        }
                      </p>
                      <p>
                        <strong>Comunidad:</strong>{" "}
                        {
                          step2Data.impacto.indicador_3_2
                            .analisis_transformacion.comunidad
                        }
                      </p>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Fortalezas
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {step2Data.impacto.fortalezas.map((f, i) => (
                        <li key={i}>• {f}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-700 mb-2">
                      Áreas a Mejorar
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {step2Data.impacto.areas_mejora.map((a, i) => (
                        <li key={i}>• {a}</li>
                      ))}
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Criterio 4: Sostenibilidad */}
              <AccordionItem
                value="criterio-4"
                className="border rounded-lg mb-4 px-4"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <span className="font-semibold text-base">
                      4. SOSTENIBILIDAD
                    </span>
                    <Badge variant="outline" className="ml-auto mr-2">
                      {step2Data.sostenibilidad.puntaje_total} / 30 pts
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-4">
                  {/* Indicador 4.1 */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">
                      Indicador 4.1: Estrategias de Continuidad
                    </h4>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge>
                        {step2Data.sostenibilidad.indicador_4_1.puntaje} / 15
                        pts
                      </Badge>
                      <Badge variant="secondary">
                        {step2Data.sostenibilidad.indicador_4_1.nivel}
                      </Badge>
                    </div>
                    <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                      <p>
                        <strong>Institucionalización:</strong>{" "}
                        {
                          step2Data.sostenibilidad.indicador_4_1.analisis
                            .institucionalizacion
                        }
                      </p>
                      <p>
                        <strong>Evidencias:</strong>{" "}
                        {
                          step2Data.sostenibilidad.indicador_4_1.analisis
                            .evidencias
                        }
                      </p>
                    </div>
                  </div>

                  {/* Indicador 4.2 */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">
                      Indicador 4.2: Viabilidad y Aliados
                    </h4>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge>
                        {step2Data.sostenibilidad.indicador_4_2.puntaje} / 5 pts
                      </Badge>
                      <Badge variant="secondary">
                        {step2Data.sostenibilidad.indicador_4_2.nivel}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700">
                      {
                        step2Data.sostenibilidad.indicador_4_2.analisis
                          .aliados_estrategicos
                      }
                    </p>
                  </div>

                  {/* Indicador 4.3 */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">
                      Indicador 4.3: Bienes y Servicios
                    </h4>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge>
                        {step2Data.sostenibilidad.indicador_4_3.puntaje} / 10
                        pts
                      </Badge>
                      <Badge variant="secondary">
                        {step2Data.sostenibilidad.indicador_4_3.nivel}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700">
                      {
                        step2Data.sostenibilidad.indicador_4_3.analisis
                          .pertinencia
                      }
                    </p>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Fortalezas
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {step2Data.sostenibilidad.fortalezas.map((f, i) => (
                        <li key={i}>• {f}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-700 mb-2">
                      Áreas a Mejorar
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {step2Data.sostenibilidad.areas_mejora.map((a, i) => (
                        <li key={i}>• {a}</li>
                      ))}
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep(1)} size="lg">
            Anterior
          </Button>
          <Button onClick={() => setCurrentStep(3)} size="lg" className="gap-2">
            Continuar a Preguntas
            <MessageSquare className="w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  };

  // PASO 3: Preguntas Complementarias
  const renderStep3 = () => (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100">
          <CardTitle className="text-2xl flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            Preguntas Complementarias
          </CardTitle>
          <CardDescription>
            Profundiza tus respuestas para mejorar tu puntaje
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Accordion type="single" collapsible className="w-full">
            {/* Preguntas para Ítem 1 */}
            <AccordionItem
              value="item-1"
              className="border rounded-lg mb-4 px-4"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-base">
                    Profundización: Problema y Objetivos
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-6">
                <div className="space-y-4">
                  <Card className="bg-purple-50 border-purple-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-purple-900">
                        Pregunta Complementaria 1.1
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700">
                        ¿Qué datos específicos demuestran la magnitud del
                        problema en tu institución?
                      </p>
                    </CardContent>
                  </Card>
                  <Textarea
                    placeholder="Ej: Según evaluaciones internas, el 60% de estudiantes..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-4">
                  <Card className="bg-purple-50 border-purple-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-purple-900">
                        Pregunta Complementaria 1.2
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700">
                        ¿Qué indicadores utilizarás para medir el logro de tu
                        objetivo?
                      </p>
                    </CardContent>
                  </Card>
                  <Textarea
                    placeholder="Ej: Aumento del 30% en la comprensión lectora medido a través de..."
                    className="min-h-[100px]"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Preguntas para Ítem 2 */}
            <AccordionItem
              value="item-2"
              className="border rounded-lg mb-4 px-4"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-base">
                    Profundización: Solución Innovadora
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-6">
                <div className="space-y-4">
                  <Card className="bg-purple-50 border-purple-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-purple-900">
                        Pregunta Complementaria 2.1
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700">
                        ¿Qué recursos tecnológicos y materiales tienes
                        disponibles para implementar tu solución?
                      </p>
                    </CardContent>
                  </Card>
                  <Textarea
                    placeholder="Ej: La institución cuenta con 30 tablets, proyector multimedia..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-4">
                  <Card className="bg-purple-50 border-purple-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-purple-900">
                        Pregunta Complementaria 2.2
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700">
                        ¿Qué hace innovadora tu propuesta comparada con lo que
                        ya se hace en tu institución?
                      </p>
                    </CardContent>
                  </Card>
                  <Textarea
                    placeholder="Ej: A diferencia del método tradicional, nuestra propuesta integra..."
                    className="min-h-[100px]"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep(2)} size="lg">
          Anterior
        </Button>
        <Button onClick={() => setCurrentStep(4)} size="lg" className="gap-2">
          Ver Resultado Final
          <CheckCircle className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );

  // PASO 4: Resultado Final
  const renderStep4 = () => (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-green-50 to-green-100">
          <CardTitle className="text-2xl flex items-center gap-2">
            <CheckCircle className="w-6 h-6" />
            Análisis Completo
          </CardTitle>
          <CardDescription>
            Resultado final con todas las respuestas integradas
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Puntaje Global */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 rounded-xl p-6">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-bold">Puntaje Estimado Total</h3>
              <div className="flex items-center justify-center gap-4">
                <Badge className="text-4xl px-6 py-3">72 / 100 pts</Badge>
                <Badge variant="outline" className="text-lg">
                  Nivel: BUENO
                </Badge>
              </div>
              <Progress value={72} className="h-3" />
              <p className="text-sm text-muted-foreground">
                Tu proyecto tiene una base sólida. Implementa las sugerencias
                para alcanzar nivel EXCELENTE
              </p>
            </div>
          </div>

          {/* Resumen por Criterio */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Resumen por Criterio</h3>

            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Intencionalidad</CardTitle>
                  <Badge>18 / 20 pts</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">
                  Problema y objetivo bien definidos. Incluye datos
                  cuantitativos para fortalecer la justificación.
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Originalidad</CardTitle>
                  <Badge>15 / 20 pts</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">
                  Propuesta innovadora. Agrega más detalles sobre cómo se
                  diferencia de lo existente.
                </p>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Pertinencia</CardTitle>
                  <Badge>14 / 20 pts</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">
                  Alineación curricular presente. Especifica competencias del
                  CNEB a desarrollar.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recomendaciones Finales */}
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Recomendaciones Prioritarias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Badge className="mt-1">1</Badge>
                  <div>
                    <p className="font-medium">
                      Agregar evidencias cuantitativas
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Incluye porcentajes, estadísticas o resultados de
                      evaluaciones previas
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Badge className="mt-1">2</Badge>
                  <div>
                    <p className="font-medium">
                      Especificar competencias del CNEB
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Indica qué competencias, capacidades y desempeños
                      desarrollarás
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Badge className="mt-1">3</Badge>
                  <div>
                    <p className="font-medium">Detallar indicadores de éxito</p>
                    <p className="text-sm text-muted-foreground">
                      Define cómo medirás el impacto de tu proyecto (KPIs)
                    </p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep(3)} size="lg">
          Anterior
        </Button>
        <div className="flex gap-3">
          <Button
            onClick={() => setCurrentStep(1)}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            <BookOpen className="w-5 h-5" />
            Editar Respuestas
          </Button>
          <Button size="lg" className="gap-2">
            <Download className="w-5 h-5" />
            Descargar Informe
          </Button>
        </div>
      </div>
    </div>
  );

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
      canProceed={true}
      currentProgress={0}
      titulo="Contexto e Intencionalidad"
      descripcion="Define el problema central, causas, consecuencias y objetivo de tu proyecto"
    >
      <div className="grid md:grid-cols-3 gap-6">
        {/* Contenido Principal */}
        <div className="md:col-span-2 space-y-6">
          {/* Progress Stepper */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                Progreso del Diagnóstico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Progress
                  value={(currentStep / STEPS.length) * 100}
                  className="h-2"
                />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {STEPS.map((step) => {
                    const status = getStepStatus(step.number);
                    const IconComponent = step.icon;
                    return (
                      <div
                        key={step.number}
                        className={`p-3 rounded-lg border text-center transition-colors cursor-pointer ${
                          status === "completed"
                            ? "bg-green-50 border-green-200 text-green-700"
                            : status === "current"
                            ? "bg-blue-50 border-blue-200 text-blue-700 ring-2 ring-blue-400"
                            : "bg-muted border-muted-foreground/20 text-muted-foreground"
                        }`}
                        onClick={() =>
                          status !== "pending" && setCurrentStep(step.number)
                        }
                      >
                        <div className="flex justify-center mb-2">
                          {status === "completed" ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <IconComponent className="w-5 h-5" />
                          )}
                        </div>
                        <div className="text-xs font-medium">{step.title}</div>
                        <div className="text-[10px] text-muted-foreground mt-1">
                          {step.description}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contenido del Paso Actual */}
          {renderStepContent()}
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
    </CNPIEAcceleratorLayout>
  );
}
