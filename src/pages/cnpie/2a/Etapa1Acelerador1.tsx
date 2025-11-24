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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Lightbulb,
  Plus,
  X,
  BookOpen,
  CheckCircle,
  Download,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { DocumentFieldSchema } from "@/types/document-extraction";

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

  // Estado del paso actual
  const [currentStep, setCurrentStep] = useState(1);

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

  const getStepStatus = (stepNumber: number) => {
    if (stepNumber < currentStep) return "completed";
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

  // PASO 1: Respuestas Iniciales
  const renderStep1 = () => (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem
              value="item-1"
              className="border rounded-lg mb-4 px-4"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-base">
                    1. IDENTIFICACIÓN DEL PROBLEMA Y DESCRIPCIÓN DE OBJETIVOS
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-6">
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

      <div className="flex justify-end">
        <Button
          onClick={() => setCurrentStep(2)}
          disabled={!canProceed}
          size="lg"
          className="gap-2"
        >
          Guardar y Continuar
          <Sparkles className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );

  // PASO 2: Análisis de IA por ítem
  const renderStep2 = () => (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="w-6 h-6" />
            Análisis de IA por Ítem
          </CardTitle>
          <CardDescription>
            Revisión inteligente de cada sección de tu ficha
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Accordion type="single" collapsible className="w-full">
            {/* Ítem 1 */}
            <AccordionItem
              value="item-1"
              className="border rounded-lg mb-4 px-4"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <span className="font-semibold text-base">
                    1. IDENTIFICACIÓN DEL PROBLEMA Y OBJETIVOS
                  </span>
                  <Badge variant="outline" className="ml-auto mr-2">
                    Analizado
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Fortalezas Detectadas
                  </h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Problema claramente identificado</li>
                    <li>• Contexto educativo bien descrito</li>
                    <li>• Objetivo alineado con el problema</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-700 mb-2">
                    Áreas a Mejorar
                  </h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Agregar datos cuantitativos sobre el problema</li>
                    <li>• Especificar indicadores de éxito medibles</li>
                  </ul>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Puntaje estimado:</span>
                  <Badge className="text-base">15 / 20 pts</Badge>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Ítem 2 */}
            <AccordionItem
              value="item-2"
              className="border rounded-lg mb-4 px-4"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <span className="font-semibold text-base">
                    2. SOLUCIÓN INNOVADORA
                  </span>
                  <Badge variant="outline" className="ml-auto mr-2">
                    Analizado
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Fortalezas Detectadas
                  </h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Contexto institucional bien descrito</li>
                    <li>• Área curricular claramente definida</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-700 mb-2">
                    Sugerencias
                  </h4>
                  <ul className="space-y-1 text-sm">
                    <li>→ Incluir recursos tecnológicos disponibles</li>
                    <li>→ Detallar metodologías innovadoras a aplicar</li>
                  </ul>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Puntaje estimado:</span>
                  <Badge className="text-base">12 / 20 pts</Badge>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Ítems pendientes */}
            <AccordionItem
              value="item-3"
              className="border rounded-lg mb-4 px-4 opacity-50"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <span className="font-semibold text-base">
                    3. IMPACTO DE LA IMPLEMENTACIÓN
                  </span>
                  <Badge variant="secondary" className="ml-auto mr-2">
                    Pendiente
                  </Badge>
                </div>
              </AccordionTrigger>
            </AccordionItem>

            <AccordionItem
              value="item-4"
              className="border rounded-lg mb-4 px-4 opacity-50"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <span className="font-semibold text-base">
                    4. SOSTENIBILIDAD
                  </span>
                  <Badge variant="secondary" className="ml-auto mr-2">
                    Pendiente
                  </Badge>
                </div>
              </AccordionTrigger>
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
      canProceed={canProceed}
      currentProgress={progress}
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
          <div className="sticky top-4 mt-4">
            <RepositoryExtractionButton
              expectedFields={documentFieldSchema}
              contextoProyecto={getAllData()}
              onDataExtracted={handleAutoFill}
              aceleradorKey="etapa1_acelerador1"
            />
          </div>
        </div>
      </div>
    </CNPIEAcceleratorLayout>
  );
}
