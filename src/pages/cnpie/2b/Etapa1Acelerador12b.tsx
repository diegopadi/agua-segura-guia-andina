import { useState, useEffect } from "react";
import { useCNPIEProject } from "@/hooks/useCNPIEProject";
import { useCNPIERubric } from "@/hooks/useCNPIERubric";
import { CNPIEAcceleratorLayout } from "@/components/cnpie/CNPIEAcceleratorLayout";
import { CNPIERubricViewer } from "@/components/cnpie/CNPIERubricViewer";
import { CriterioAccordionHeader } from "../components/CriterioAccordionHeader";
import { ProgressStepper } from "../components/ProgressStepper";
import { QuestionCardWithTextarea } from "../components/QuestionCardWithTextarea";
import jsPDF from "jspdf";
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
import { BienServicio } from "@/types/cnpie";

// ============================================
// TIPOS Y CONSTANTES PARA PROYECTO 2B
// ============================================

// Límites de caracteres para ANEXO 2B
const ANEXO_2B_LIMITS = {
  PROBLEMA_CARACTERIZACION: 5000,
  OBJETIVOS: 1500,
  METODOLOGIA_DESCRIPCION: 3500,
  PROCEDIMIENTO_METODOLOGICO: 5000,
  PERTINENCIA_INTERESES: 3000,
  PERTINENCIA_CONTEXTO: 3000,
  IMPACTO_EVIDENCIAS: 3500,
  IMPACTO_CAMBIOS: 3000,
  SOSTENIBILIDAD_VIABILIDAD: 3000,
  SOSTENIBILIDAD_BIENES: 3000,
} as const;

// Estructura de preguntas para ANEXO 2B
const ITEMS_FICHA_2B = [
  {
    id: "item1",
    numero: 1,
    titulo: "IDENTIFICACIÓN DEL PROBLEMA Y DESCRIPCIÓN DE OBJETIVOS",
    preguntas: [
      {
        numero: "1.1",
        texto:
          "Caracteriza el problema central o el desafío que su proyecto busca abordar o que ha motivado la implementación de su proyecto. La descripción debe incluir las causas y consecuencias que justifican su implementación en base a evidencias, y estar vinculada a la(s) competencia(s) del CNEB, la mejora de la práctica docente, la gestión escolar y los aprendizajes de los estudiantes. Sustente con información cualitativa y cuantitativa.",
        maxCaracteres: 5000,
      },
      {
        numero: "1.2",
        texto:
          "Formula el objetivo general y específicos del proyecto vinculados con la solución del problema central o el logro del desafío identificado, además de lograr la(s) competencia(s) del CNEB, considerando los atributos: específico, medible, alcanzable, relevante y plazo definido.",
        maxCaracteres: 1500,
      },
    ],
  },
  {
    id: "item2",
    numero: 2,
    titulo: "SOLUCIÓN INNOVADORA",
    preguntas: [
      {
        numero: "2.1",
        texto:
          "Describe de qué trata la metodología o estrategia innovadora que viene implementando en su proyecto, y cómo se vincula con el objetivo principal del proyecto.",
        maxCaracteres: 3500,
      },
      {
        numero: "2.2",
        texto:
          "Describe el procedimiento metodológico que viene implementando, a la vez debe adjuntar el enlace a un video (máximo 3 minutos) donde se describa dicho procedimiento. El video debe resaltar la originalidad y pertinencia de las herramientas y técnicas que viene utilizando.",
        maxCaracteres: 5000,
      },
    ],
  },
  {
    id: "item3",
    numero: 3,
    titulo: "PERTINENCIA",
    preguntas: [
      {
        numero: "3.1",
        texto:
          "Describe cómo el proyecto responde a los intereses y necesidades identificadas en la comunidad educativa, impulsando el desarrollo de la(s) competencia(s) del CNEB, la mejora de la práctica docente, la gestión escolar y los aprendizajes de los estudiantes.",
        maxCaracteres: 3000,
      },
      {
        numero: "3.2",
        texto:
          "Describe cómo el proyecto se adapta al contexto cultural, social y lingüístico de la comunidad educativa en la que se desarrolla desde una perspectiva de equidad.",
        maxCaracteres: 3000,
      },
    ],
  },
  {
    id: "item4",
    numero: 4,
    titulo: "IMPACTO DE LA IMPLEMENTACIÓN",
    preguntas: [
      {
        numero: "4.1",
        texto:
          "Sustenta con evidencias los resultados obtenidos durante la implementación del proyecto. Las evidencias deben mostrar la vinculación directa con el objetivo principal y con las competencias priorizadas.",
        maxCaracteres: 3500,
      },
      {
        numero: "4.2",
        texto:
          "Explica los cambios o efectos logrados en la práctica docente, la gestión escolar y la comunidad educativa y local desde el inicio de la implementación de su proyecto hasta la actualidad.",
        maxCaracteres: 3000,
      },
    ],
  },
  {
    id: "item5",
    numero: 5,
    titulo: "SOSTENIBILIDAD",
    preguntas: [
      {
        numero: "5.1",
        texto:
          "Describe las estrategias que desarrollarán para asegurar la viabilidad del proyecto y la permanencia de las mejoras, orientadas a la mejora de los aprendizajes.",
        maxCaracteres: 3000,
      },
      {
        numero: "5.2",
        texto:
          "Describe la pertinencia de los bienes y servicios que demanda el proyecto para garantizar su sostenibilidad y continuidad a largo plazo.",
        maxCaracteres: 3000,
        requiereTabla: true,
      },
    ],
  },
] as const;

// Tipos para FormData Step1 - Proyecto 2B
interface FormDataStep1 {
  // CRITERIO 1: INTENCIONALIDAD
  intencionalidad: {
    problema_descripcion: string;
    objetivo_general: string;
    objetivos_especificos: string[];
    competencias_cneb: string[];
    area_curricular: string;
  };

  // CRITERIO 2: ORIGINALIDAD
  originalidad: {
    metodologia_descripcion: string;
    procedimiento_metodologico: string;
    video_url: string;
  };

  // CRITERIO 3: PERTINENCIA
  pertinencia: {
    intereses_necesidades: string;
    contexto_cultural: string;
  };

  // CRITERIO 4: IMPACTO
  impacto: {
    evidencias_descripcion: string;
    cambios_practica_docente: string;
    cambios_gestion_escolar: string;
    cambios_comunidad: string;
  };

  // CRITERIO 5: SOSTENIBILIDAD
  sostenibilidad: {
    estrategias_viabilidad: string;
    bienes_servicios: BienServicio[];
  };
}

// Tipos para análisis (simplificados por ahora)
interface AnalysisStep2 {
  intencionalidad?: unknown;
  originalidad?: unknown;
  pertinencia?: unknown;
  impacto?: unknown;
  sostenibilidad?: unknown;
  puntaje_total: number;
  puntaje_maximo: number;
  timestamp: string;
}

interface FormDataStep3 {
  complementary_answers?: Record<string, unknown>;
}

interface FinalAnalysisStep4 {
  puntaje_total?: number;
}

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

export default function Etapa1Acelerador12b() {
  const {
    proyecto,
    saveAcceleratorData,
    validateAccelerator,
    getAcceleratorData,
    getAllData,
  } = useCNPIEProject("2B");

  const { rubricas, getCriterioByName } = useCNPIERubric("2B");
  const { toast } = useToast();

  const rubricaIntencionalidad = getCriterioByName("Intencionalidad");
  const rubricaOriginalidad = getCriterioByName("Originalidad");
  const rubricaPertinencia = getCriterioByName("Pertinencia");
  const rubricaImpacto = getCriterioByName("Impacto");
  const rubricaSostenibilidad = getCriterioByName("Sostenibilidad");

  // Estado del paso actual y pasos completados
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Estados para cada paso
  const [step1Data, setStep1Data] = useState<FormDataStep1>({
    // CRITERIO 1: INTENCIONALIDAD
    intencionalidad: {
      problema_descripcion: "",
      objetivo_general: "",
      objetivos_especificos: [],
      competencias_cneb: [],
      area_curricular: "",
    },

    // CRITERIO 2: ORIGINALIDAD
    originalidad: {
      metodologia_descripcion: "",
      procedimiento_metodologico: "",
      video_url: "",
    },

    // CRITERIO 3: PERTINENCIA
    pertinencia: {
      intereses_necesidades: "",
      contexto_cultural: "",
    },

    // CRITERIO 4: IMPACTO
    impacto: {
      evidencias_descripcion: "",
      cambios_practica_docente: "",
      cambios_gestion_escolar: "",
      cambios_comunidad: "",
    },

    // CRITERIO 5: SOSTENIBILIDAD
    sostenibilidad: {
      estrategias_viabilidad: "",
      bienes_servicios: [],
    },
  });

  const [step2Data, setStep2Data] = useState<AnalysisStep2 | null>(null);
  const [step3Data, setStep3Data] = useState<FormDataStep3 | null>(null);
  const [step4Data, setStep4Data] = useState<FinalAnalysisStep4 | null>(null);
  const [improvedResponses, setImprovedResponses] = useState<{
    intencionalidad?: {
      respuesta_1_1: string;
      respuesta_1_2: string;
    };
    originalidad?: {
      respuesta_2_1: string;
      respuesta_2_2: string;
    };
    impacto?: {
      respuesta_3_1: string;
      respuesta_3_2: string;
    };
    sostenibilidad?: {
      respuesta_4_1: string;
      respuesta_4_2: string;
    };
  } | null>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<{
    intencionalidad?: {
      titulo: string;
      introduccion: string;
      preguntas: string[];
    };
    originalidad?: {
      titulo: string;
      introduccion: string;
      preguntas: string[];
    };
    impacto?: { titulo: string; introduccion: string; preguntas: string[] };
    sostenibilidad?: {
      titulo: string;
      introduccion: string;
      preguntas: string[];
    };
    puntaje_actual: number;
    puntaje_maximo: number;
  } | null>(null);
  const [step3Answers, setStep3Answers] = useState<
    Record<string, Record<string, string>>
  >({});

  // Función para migrar datos antiguos a la nueva estructura
  const migrateOldDataStructure = (
    oldData: Partial<FormDataStep1> & Record<string, unknown>
  ): FormDataStep1 => {
    // Si ya tiene la estructura nueva, retornar tal cual
    if (
      oldData.intencionalidad &&
      oldData.originalidad &&
      oldData.pertinencia &&
      oldData.impacto &&
      oldData.sostenibilidad
    ) {
      return oldData as FormDataStep1;
    }

    // Si tiene la estructura antigua (plana), migrar a la nueva estructura
    return {
      intencionalidad: {
        problema_descripcion: (oldData.problema_descripcion as string) || "",
        objetivo_general: (oldData.objetivo_general as string) || "",
        objetivos_especificos:
          (oldData.objetivos_especificos as string[]) || [],
        competencias_cneb: (oldData.competencias_cneb as string[]) || [],
        area_curricular: (oldData.area_curricular as string) || "",
      },
      originalidad: {
        metodologia_descripcion:
          (oldData.metodologia_descripcion as string) || "",
        procedimiento_metodologico:
          (oldData.procedimiento_metodologico as string) || "",
        video_url: (oldData.video_url as string) || "",
      },
      pertinencia: {
        intereses_necesidades: (oldData.intereses_necesidades as string) || "",
        contexto_cultural: (oldData.contexto_cultural as string) || "",
      },
      impacto: {
        evidencias_descripcion:
          (oldData.impacto_evidencias as string) ||
          (oldData.evidencias_descripcion as string) ||
          "",
        cambios_practica_docente:
          (oldData.impacto_cambios as string) ||
          (oldData.cambios_practica_docente as string) ||
          "",
        cambios_gestion_escolar:
          (oldData.cambios_gestion_escolar as string) || "",
        cambios_comunidad: (oldData.cambios_comunidad as string) || "",
      },
      sostenibilidad: {
        estrategias_viabilidad:
          (oldData.sostenibilidad_viabilidad as string) ||
          (oldData.estrategias_viabilidad as string) ||
          "",
        bienes_servicios: (oldData.bienes_servicios as BienServicio[]) || [],
      },
    };
  };

  useEffect(() => {
    // ⚠️ IMPORTANTE: Solo ejecutar cuando proyecto cambia, NO cuando getAcceleratorData cambia
    // para evitar loop infinito
    if (!proyecto?.id) {
      return;
    }

    const savedData = getAcceleratorData(1, 1);

    if (savedData) {
      setCurrentStep(savedData.current_step || 1);

      // Cargar completed_steps guardados
      const loadedCompletedSteps = savedData.completed_steps || [];

      // Auto-marcar pasos como completados basado en datos existentes
      const autoCompletedSteps = [...loadedCompletedSteps];

      if (savedData.step1_data) {
        // Migrar datos antiguos a nueva estructura si es necesario
        const migratedData = migrateOldDataStructure(savedData.step1_data);
        setStep1Data(migratedData);

        // Marcar paso 1 como completado si tiene datos
        if (!autoCompletedSteps.includes(1)) {
          autoCompletedSteps.push(1);
        }
      }
      if (savedData.step2_data) {
        setStep2Data(savedData.step2_data);
        // Marcar paso 2 como completado si tiene datos
        if (!autoCompletedSteps.includes(2)) {
          autoCompletedSteps.push(2);
        }
      }
      if (savedData.step3_data) {
        setStep3Data(savedData.step3_data);
      }
      if (savedData.step4_data) {
        setStep4Data(savedData.step4_data);
      }

      if (savedData.generated_questions) {
        setGeneratedQuestions(savedData.generated_questions);
        // Marcar paso 3 como completado si tiene preguntas generadas
        if (!autoCompletedSteps.includes(3)) {
          autoCompletedSteps.push(3);
        }
      }

      if (savedData.step3_answers) {
        setStep3Answers(savedData.step3_answers);
      }

      if (savedData.improved_responses) {
        setImprovedResponses(savedData.improved_responses);
        // Marcar paso 4 como completado si tiene respuestas mejoradas
        if (!autoCompletedSteps.includes(4)) {
          autoCompletedSteps.push(4);
        }
      }

      // Actualizar completed_steps con los pasos auto-detectados
      setCompletedSteps(autoCompletedSteps);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyecto?.id]);

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
        generated_questions: generatedQuestions,
        step3_answers: step3Answers,
        improved_responses: improvedResponses,
        last_updated: new Date().toISOString(),
      };

      return await saveAcceleratorData(1, 1, dataToSave);
    } catch (error) {
      console.error("🔴 Error en handleSave:", error);
      throw error;
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
      step1Data.intencionalidad?.problema_descripcion.trim().length > 0 &&
      step1Data.intencionalidad?.objetivo_general.trim().length > 0 &&
      step1Data.originalidad.metodologia_descripcion.trim().length > 0
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

      // Crear un timeout de 120 segundos (2 minutos)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("Timeout: La solicitud tardó más de 2 minutos"));
        }, 120000);
      });

      // Ejecutar la llamada a la API con timeout
      const apiPromise = supabase.functions.invoke("analyze-cnpie-general", {
        body: { step1Data },
      });

      const response = (await Promise.race([
        apiPromise,
        timeoutPromise,
      ])) as Awaited<typeof apiPromise>;
      const { data, error } = response;
      console.log("🔵 Data:", data);

      if (error) {
        throw error;
      }

      console.log("🔵 Datos recibidos del análisis:", data);

      if (data.success) {
        console.log("🔵 Analysis data completo:", data.analysis);

        // Transformar la estructura con emojis a estructura plana
        const dictamenInt =
          data.analysis.intencionalidad?.[
            "📋 DICTAMEN TÉCNICO: INTENCIONALIDAD (CONSOLIDADOS)"
          ];

        const indicador11 =
          dictamenInt?.["🔹 INDICADOR 1.1: Caracterización del Problema"];

        const indicador12 = dictamenInt?.["🔹 INDICADOR 1.2: Objetivos"];

        // Extraer datos de Originalidad
        const dictamenOrig =
          data.analysis.originalidad?.[
            "📋 DICTAMEN TÉCNICO: ORIGINALIDAD (CONSOLIDADOS)"
          ];

        const indicador21 =
          dictamenOrig?.["🔹 INDICADOR 2.1: Metodología/Estrategia"];

        const indicador22 =
          dictamenOrig?.["🔹 INDICADOR 2.2: Procedimiento y Video"];

        // Extraer datos de Impacto
        const dictamenImp =
          data.analysis.impacto?.[
            "📋 DICTAMEN TÉCNICO: IMPACTO (CONSOLIDADOS)"
          ];

        const indicador31 =
          dictamenImp?.["🔹 INDICADOR 3.1: Resultados de Aprendizaje"];

        const indicador32 =
          dictamenImp?.["🔹 INDICADOR 3.2: Cambios Sistémicos"];

        // Extraer datos de Sostenibilidad
        const dictamenSost =
          data.analysis.sostenibilidad?.[
            "📋 DICTAMEN TÉCNICO: SOSTENIBILIDAD (CONSOLIDADOS)"
          ];

        const indicador41 =
          dictamenSost?.["🔹 INDICADOR 4.1: Estrategias de Continuidad"];

        const indicador42 =
          dictamenSost?.["🔹 INDICADOR 4.2: Viabilidad y Aliados"];

        const indicador43 =
          dictamenSost?.["🔹 INDICADOR 4.3: Bienes y Servicios"];

        // Calcular puntaje total
        const puntajeTotal =
          (indicador11?.PUNTAJE || 0) +
          (indicador12?.PUNTAJE || 0) +
          (indicador21?.PUNTAJE || 0) +
          (indicador22?.PUNTAJE || 0) +
          (indicador31?.PUNTAJE || 0) +
          (indicador32?.PUNTAJE || 0) +
          (indicador41?.PUNTAJE || 0) +
          (indicador42?.PUNTAJE || 0) +
          (indicador43?.PUNTAJE || 0);

        // Transformar todos los criterios a estructura plana
        const transformedData = {
          intencionalidad: {
            indicador_1_1: {
              puntaje: indicador11?.PUNTAJE || 0,
              nivel: indicador11?.NIVEL || "N/A",
              vinculacion_cneb:
                indicador11?.["Análisis de Criterios"]?.["Vinculación CNEB"] ||
                "",
              evidencia:
                indicador11?.["Análisis de Criterios"]?.[
                  "Evidencia (Consolidados)"
                ] || "",
              justificacion:
                indicador11?.["Análisis de Criterios"]?.[
                  "Justificación del Puntaje"
                ] || "",
            },
            indicador_1_2: {
              puntaje: indicador12?.PUNTAJE || 0,
              nivel: indicador12?.NIVEL || "N/A",
              checklist_smart: {
                especifico:
                  indicador12?.["Checklist SMART"]?.["S (Específico)"] === "✅",
                medible:
                  indicador12?.["Checklist SMART"]?.["M (Medible)"] === "✅",
                alcanzable:
                  indicador12?.["Checklist SMART"]?.["A (Alcanzable)"] === "✅",
                relevante:
                  indicador12?.["Checklist SMART"]?.["R (Relevante)"] === "✅",
                temporal:
                  indicador12?.["Checklist SMART"]?.["T (Temporal)"] === "✅",
              },
              justificacion: indicador12?.["Justificación del Puntaje"] || "",
            },
          },
          originalidad: {
            indicador_2_1: {
              puntaje: indicador21?.PUNTAJE || 0,
              nivel: indicador21?.NIVEL || "N/A",
              analisis: indicador21?.["Análisis"] || "",
            },
            indicador_2_2: {
              puntaje: indicador22?.PUNTAJE || 0,
              nivel: indicador22?.NIVEL || "N/A",
              desglose: indicador22?.["Desglose de Evaluación"] || {},
              observacion: indicador22?.["Observación Final"] || "",
            },
          },
          impacto: {
            indicador_3_1: {
              puntaje: indicador31?.PUNTAJE || 0,
              nivel: indicador31?.NIVEL || "N/A",
              analisis_evidencias:
                indicador31?.["Análisis de Evidencias"] || {},
            },
            indicador_3_2: {
              puntaje: indicador32?.PUNTAJE || 0,
              nivel: indicador32?.NIVEL || "N/A",
              analisis_transformacion:
                indicador32?.["Análisis de Transformación"] || {},
            },
            observacion_final: dictamenImp?.["Observación Final"] || "",
          },
          sostenibilidad: {
            indicador_4_1: {
              puntaje: indicador41?.PUNTAJE || 0,
              nivel: indicador41?.NIVEL || "N/A",
              analisis: indicador41?.["Análisis"] || {},
            },
            indicador_4_2: {
              puntaje: indicador42?.PUNTAJE || 0,
              nivel: indicador42?.NIVEL || "N/A",
              analisis: indicador42?.["Análisis"] || {},
            },
            indicador_4_3: {
              puntaje: indicador43?.PUNTAJE || 0,
              nivel: indicador43?.NIVEL || "N/A",
              analisis: indicador43?.["Análisis"] || {},
            },
            observacion_final: dictamenSost?.["Observación Final"] || "",
          },
          puntaje_total: puntajeTotal,
          puntaje_maximo: 80,
          timestamp: new Date().toISOString(),
        };

        console.log("🔵 Puntaje total calculado:", puntajeTotal);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setStep2Data(transformedData as any);

        // Marcar pasos 1 y 2 como completados y avanzar al paso 2
        const newCompletedSteps = [...completedSteps];
        if (!newCompletedSteps.includes(1)) newCompletedSteps.push(1);
        if (!newCompletedSteps.includes(2)) newCompletedSteps.push(2);
        setCompletedSteps(newCompletedSteps);

        setCurrentStep(2);

        // Cerrar modal inmediatamente
        setAnalyzing(false);

        // Guardar en segundo plano
        handleSave();

        // Scroll suave al inicio después de un breve delay
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }, 100);

        toast({
          title: "✅ Análisis completado exitosamente",
          description: `Tu proyecto obtuvo ${puntajeTotal} puntos de 80 posibles. Revisa los detalles por criterio.`,
          duration: 5000,
        });
      } else {
        throw new Error(data.error || "Error en el análisis");
      }
    } catch (error: unknown) {
      console.error("🔴 Error en handleAnalyze:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      setAnalyzing(false);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleGenerateQuestions = async () => {
    if (!step2Data) {
      toast({
        title: "Error",
        description: "No hay análisis disponible para generar preguntas",
        variant: "destructive",
      });
      return;
    }

    setGeneratingQuestions(true);

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                "Timeout: La generación de preguntas tardó más de 120 segundos"
              )
            ),
          120000
        )
      );

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No hay sesión activa");
      }

      const requestPromise = fetch(
        `https://ihgfqdmcndcyzzsbliyp.supabase.co/functions/v1/generate-survey-questions-A2`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            "x-client-info": "agua-segura-guia-andina",
          },
          body: JSON.stringify({
            analysisData: step2Data,
          }),
        }
      );

      const response = (await Promise.race([
        requestPromise,
        timeoutPromise,
      ])) as Response;

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log("🟢 Respuesta de generate-survey-questions-A2:", result);

      if (result.success && result.questions) {
        console.log("🟢 Preguntas recibidas:", result.questions);
        setGeneratedQuestions(result.questions);
        console.log("🟢 Cambiando a paso 3...");

        // Marcar paso 3 como completado
        if (!completedSteps.includes(3)) {
          setCompletedSteps([...completedSteps, 3]);
        }

        setCurrentStep(3);
        toast({
          title: "✅ Preguntas generadas",
          description: "Se han generado las preguntas complementarias",
        });
      } else {
        console.error("❌ Error en resultado:", result);
        throw new Error(result.error || "Error al generar preguntas");
      }
    } catch (error: unknown) {
      console.error("❌ Error generando preguntas:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "No se pudieron generar las preguntas";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handleEvaluateStep3Answers = async () => {
    if (!step1Data || !step3Answers) {
      toast({
        title: "Error",
        description: "No hay datos suficientes para combinar",
        variant: "destructive",
      });
      return;
    }

    try {
      // Crear objeto combinado separado por secciones
      const combinedData = {
        intencionalidad: {
          respuesta_original_1_1:
            step1Data.intencionalidad?.problema_descripcion || "",
          nueva_respuesta_1_1: step3Answers.intencionalidad?.respuesta_1 || "",
          respuesta_original_1_2:
            step1Data.intencionalidad?.objetivo_general || "",
          nueva_respuesta_1_2: step3Answers.intencionalidad?.respuesta_2 || "",
        },
        originalidad: {
          respuesta_original_2_1:
            step1Data.originalidad?.metodologia_descripcion || "",
          nueva_respuesta_2_1: step3Answers.originalidad?.respuesta_1 || "",
          respuesta_original_2_2:
            step1Data.originalidad?.procedimiento_metodologico || "",
          nueva_respuesta_2_2: step3Answers.originalidad?.respuesta_2 || "",
        },
        impacto: {
          respuesta_original_3_1:
            step1Data.impacto?.evidencias_descripcion || "",
          nueva_respuesta_3_1: step3Answers.impacto?.respuesta_1 || "",
          respuesta_original_3_2:
            step1Data.impacto?.cambios_practica_docente || "",
          nueva_respuesta_3_2: step3Answers.impacto?.respuesta_2 || "",
        },
        sostenibilidad: {
          respuesta_original_4_1:
            step1Data.sostenibilidad?.estrategias_viabilidad || "",
          nueva_respuesta_4_1: step3Answers.sostenibilidad?.respuesta_1 || "",
          respuesta_original_4_2:
            step1Data.sostenibilidad?.estrategias_viabilidad || "",
          nueva_respuesta_4_2: step3Answers.sostenibilidad?.respuesta_2 || "",
        },
        timestamp: new Date().toISOString(),
      };

      console.log("📦 OBJETO COMBINADO PARA IA:");
      console.log("========================================");
      console.log("1. INTENCIONALIDAD:");
      console.log(
        "   Respuesta Original 1.1:",
        combinedData.intencionalidad.respuesta_original_1_1.substring(0, 100) +
          "..."
      );
      console.log(
        "   Nueva Respuesta 1.1:",
        combinedData.intencionalidad.nueva_respuesta_1_1
      );
      console.log(
        "   Respuesta Original 1.2:",
        combinedData.intencionalidad.respuesta_original_1_2.substring(0, 100) +
          "..."
      );
      console.log(
        "   Nueva Respuesta 1.2:",
        combinedData.intencionalidad.nueva_respuesta_1_2
      );
      console.log("\n2. ORIGINALIDAD:");
      console.log(
        "   Respuesta Original 2.1:",
        combinedData.originalidad.respuesta_original_2_1.substring(0, 100) +
          "..."
      );
      console.log(
        "   Nueva Respuesta 2.1:",
        combinedData.originalidad.nueva_respuesta_2_1
      );
      console.log(
        "   Respuesta Original 2.2:",
        combinedData.originalidad.respuesta_original_2_2.substring(0, 100) +
          "..."
      );
      console.log(
        "   Nueva Respuesta 2.2:",
        combinedData.originalidad.nueva_respuesta_2_2
      );
      console.log("\n3. IMPACTO:");
      console.log(
        "   Respuesta Original 3.1:",
        combinedData.impacto.respuesta_original_3_1.substring(0, 100) + "..."
      );
      console.log(
        "   Nueva Respuesta 3.1:",
        combinedData.impacto.nueva_respuesta_3_1
      );
      console.log(
        "   Respuesta Original 3.2:",
        combinedData.impacto.respuesta_original_3_2.substring(0, 100) + "..."
      );
      console.log(
        "   Nueva Respuesta 3.2:",
        combinedData.impacto.nueva_respuesta_3_2
      );
      console.log("\n4. SOSTENIBILIDAD:");
      console.log(
        "   Respuesta Original 4.1:",
        combinedData.sostenibilidad.respuesta_original_4_1.substring(0, 100) +
          "..."
      );
      console.log(
        "   Nueva Respuesta 4.1:",
        combinedData.sostenibilidad.nueva_respuesta_4_1
      );
      console.log(
        "   Respuesta Original 4.2:",
        combinedData.sostenibilidad.respuesta_original_4_2.substring(0, 100) +
          "..."
      );
      console.log(
        "   Nueva Respuesta 4.2:",
        combinedData.sostenibilidad.nueva_respuesta_4_2
      );
      console.log("========================================");
      console.log("📤 Objeto completo:", combinedData);

      // Llamar directamente al sintetizador externo
      toast({
        title: "⏳ Mejorando respuestas...",
        description: "La IA está procesando tus respuestas",
      });

      // Obtener sesión para autenticación
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No hay sesión activa");
      }

      const response = await fetch(
        "https://ihgfqdmcndcyzzsbliyp.supabase.co/functions/v1/sintetisador-cnpie-2A",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            "x-client-info": "agua-segura-guia-andina",
          },
          body: JSON.stringify({ combinedData }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(
          `Error del sintetizador (${response.status}): ${errorText}`
        );
      }

      const data = await response.json();

      if (!data?.success || !data?.improved_responses) {
        throw new Error("No se recibieron respuestas mejoradas");
      }

      console.log("✨ RESPUESTAS MEJORADAS:", data.improved_responses);
      setImprovedResponses(data.improved_responses);

      // Marcar paso 4 como completado
      if (!completedSteps.includes(4)) {
        setCompletedSteps([...completedSteps, 4]);
      }

      setCurrentStep(4);
      toast({
        title: "✅ Respuestas mejoradas generadas",
        description: "Puedes revisar y copiar las nuevas versiones",
        duration: 5000,
      });
    } catch (error: unknown) {
      console.error("❌ Error combinando respuestas:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "No se pudieron combinar las respuestas";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
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
        {/* Overlay de análisis */}
        {analyzing && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <Card className="w-96">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <div className="text-center">
                    <h3 className="font-semibold text-lg mb-2">
                      Analizando tu proyecto con IA
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Evaluando los 4 criterios: Intencionalidad, Originalidad,
                      Impacto y Sostenibilidad...
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      Esto puede tomar hasta 2 minutos
                    </p>
                  </div>
                  <Progress value={undefined} className="w-full" />
                  <p className="text-xs text-muted-foreground text-center">
                    Por favor no cierres esta ventana ni recargues la página
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6 pb-2">
            <Accordion type="single" collapsible className="w-full space-y-3">
              {/* SECCIÓN 1: IDENTIFICACIÓN DEL PROBLEMA Y DESCRIPCIÓN DE OBJETIVOS */}
              <AccordionItem value="item-1" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-base">
                      1. {ITEMS_FICHA_2B[0].titulo}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-6">
                  {/* Pregunta 1.1 */}
                  <QuestionCardWithTextarea
                    questionNumber={ITEMS_FICHA_2B[0].preguntas[0].numero}
                    questionText={ITEMS_FICHA_2B[0].preguntas[0].texto}
                    value={step1Data.intencionalidad?.problema_descripcion}
                    onChange={(value) =>
                      setStep1Data({
                        ...step1Data,
                        intencionalidad: {
                          ...step1Data.intencionalidad,
                          problema_descripcion: value,
                        },
                      })
                    }
                    placeholder="Describe el problema educativo identificado en tu IE..."
                    minHeight="min-h-[200px]"
                    maxLength={ANEXO_2B_LIMITS.PROBLEMA_CARACTERIZACION}
                  />

                  {/* Pregunta 1.2 */}
                  <QuestionCardWithTextarea
                    questionNumber={ITEMS_FICHA_2B[0].preguntas[1].numero}
                    questionText={ITEMS_FICHA_2B[0].preguntas[1].texto}
                    value={step1Data.intencionalidad?.objetivo_general}
                    onChange={(value) =>
                      setStep1Data({
                        ...step1Data,
                        intencionalidad: {
                          ...step1Data.intencionalidad,
                          objetivo_general: value,
                        },
                      })
                    }
                    placeholder="Redacta el objetivo general del PIE..."
                    minHeight="min-h-[120px]"
                    maxLength={ANEXO_2B_LIMITS.OBJETIVOS}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* SECCIÓN 2: SOLUCIÓN INNOVADORA */}
              <AccordionItem value="item-2" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-base">
                      2. {ITEMS_FICHA_2B[1].titulo}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-6">
                  {/* Pregunta 2.1 */}
                  <QuestionCardWithTextarea
                    questionNumber={ITEMS_FICHA_2B[1].preguntas[0].numero}
                    questionText={ITEMS_FICHA_2B[1].preguntas[0].texto}
                    value={step1Data.originalidad?.metodologia_descripcion}
                    onChange={(value) =>
                      setStep1Data({
                        ...step1Data,
                        originalidad: {
                          ...step1Data.originalidad,
                          metodologia_descripcion: value,
                        },
                      })
                    }
                    placeholder="Describe la metodología pedagógica..."
                    minHeight="min-h-[150px]"
                    maxLength={ANEXO_2B_LIMITS.METODOLOGIA_DESCRIPCION}
                  />

                  {/* Pregunta 2.2 */}
                  <div className="space-y-4">
                    <QuestionCardWithTextarea
                      questionNumber={ITEMS_FICHA_2B[1].preguntas[1].numero}
                      questionText={ITEMS_FICHA_2B[1].preguntas[1].texto}
                      value={step1Data.originalidad.procedimiento_metodologico}
                      onChange={(value) =>
                        setStep1Data({
                          ...step1Data,
                          originalidad: {
                            ...step1Data.originalidad,
                            procedimiento_metodologico: value,
                          },
                        })
                      }
                      placeholder="Describe el procedimiento paso a paso..."
                      minHeight="min-h-[200px]"
                      maxLength={ANEXO_2B_LIMITS.PROCEDIMIENTO_METODOLOGICO}
                    />

                    {/* Video opcional */}
                    <div className="pt-2">
                      <Label className="text-sm font-medium mb-2 block">
                        Video explicativo (opcional - máximo 3 minutos)
                      </Label>
                      <Input
                        type="url"
                        value={step1Data.originalidad.video_url || ""}
                        onChange={(e) =>
                          setStep1Data({
                            ...step1Data,
                            originalidad: {
                              ...step1Data.originalidad,
                              video_url: e.target.value,
                            },
                          })
                        }
                        placeholder="https://youtube.com/watch?v=..."
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* SECCIÓN 3: PERTINENCIA */}
              <AccordionItem value="item-3" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-base">
                      3. {ITEMS_FICHA_2B[2].titulo}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-6">
                  {/* Pregunta 3.1 */}
                  <QuestionCardWithTextarea
                    questionNumber={ITEMS_FICHA_2B[2].preguntas[0].numero}
                    questionText={ITEMS_FICHA_2B[2].preguntas[0].texto}
                    value={step1Data.pertinencia.intereses_necesidades || ""}
                    onChange={(value) =>
                      setStep1Data({
                        ...step1Data,
                        pertinencia: {
                          ...step1Data.pertinencia,
                          intereses_necesidades: value,
                        },
                      })
                    }
                    placeholder="Describe cómo el proyecto responde a los intereses..."
                    minHeight="min-h-[150px]"
                    maxLength={ANEXO_2B_LIMITS.PERTINENCIA_INTERESES}
                  />

                  {/* Pregunta 3.2 */}
                  <QuestionCardWithTextarea
                    questionNumber={ITEMS_FICHA_2B[2].preguntas[1].numero}
                    questionText={ITEMS_FICHA_2B[2].preguntas[1].texto}
                    value={step1Data.pertinencia.contexto_cultural || ""}
                    onChange={(value) =>
                      setStep1Data({
                        ...step1Data,
                        pertinencia: {
                          ...step1Data.pertinencia,
                          contexto_cultural: value,
                        },
                      })
                    }
                    placeholder="Describe cómo el proyecto se adapta al contexto..."
                    minHeight="min-h-[150px]"
                    maxLength={ANEXO_2B_LIMITS.PERTINENCIA_CONTEXTO}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* SECCIÓN 4: IMPACTO DE LA IMPLEMENTACIÓN */}
              <AccordionItem value="item-4" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-base">
                      4. {ITEMS_FICHA_2B[3].titulo}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-6">
                  {/* Pregunta 4.1 */}
                  <QuestionCardWithTextarea
                    questionNumber={ITEMS_FICHA_2B[3].preguntas[0].numero}
                    questionText={ITEMS_FICHA_2B[3].preguntas[0].texto}
                    value={step1Data.impacto.evidencias_descripcion || ""}
                    onChange={(value) =>
                      setStep1Data({
                        ...step1Data,
                        impacto: {
                          ...step1Data.impacto,
                          evidencias_descripcion: value,
                        },
                      })
                    }
                    placeholder="Sustenta con evidencias los resultados obtenidos..."
                    minHeight="min-h-[200px]"
                    maxLength={ANEXO_2B_LIMITS.IMPACTO_EVIDENCIAS}
                  />

                  {/* Pregunta 4.2 */}
                  <QuestionCardWithTextarea
                    questionNumber={ITEMS_FICHA_2B[3].preguntas[1].numero}
                    questionText={ITEMS_FICHA_2B[3].preguntas[1].texto}
                    value={step1Data.impacto.cambios_practica_docente || ""}
                    onChange={(value) =>
                      setStep1Data({
                        ...step1Data,
                        impacto: {
                          ...step1Data.impacto,
                          cambios_practica_docente: value,
                        },
                      })
                    }
                    placeholder="Explica los cambios o efectos logrados..."
                    minHeight="min-h-[150px]"
                    maxLength={ANEXO_2B_LIMITS.IMPACTO_CAMBIOS}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* SECCIÓN 5: SOSTENIBILIDAD */}
              <AccordionItem value="item-5" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-base">
                      5. {ITEMS_FICHA_2B[4].titulo}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-6">
                  {/* Pregunta 5.1 */}
                  <QuestionCardWithTextarea
                    questionNumber={ITEMS_FICHA_2B[4].preguntas[0].numero}
                    questionText={ITEMS_FICHA_2B[4].preguntas[0].texto}
                    value={
                      step1Data.sostenibilidad.estrategias_viabilidad || ""
                    }
                    onChange={(value) =>
                      setStep1Data({
                        ...step1Data,
                        sostenibilidad: {
                          ...step1Data.sostenibilidad,
                          estrategias_viabilidad: value,
                        },
                      })
                    }
                    placeholder="Describe las estrategias para asegurar la viabilidad..."
                    minHeight="min-h-[150px]"
                    maxLength={ANEXO_2B_LIMITS.SOSTENIBILIDAD_VIABILIDAD}
                  />

                  {/* Pregunta 5.2 */}
                  <div className="space-y-4">
                    <Card className="bg-amber-50 border-amber-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-amber-900">
                          Pregunta {ITEMS_FICHA_2B[4].preguntas[1].numero}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700">
                          {ITEMS_FICHA_2B[4].preguntas[1].texto}
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
                              <th className="p-2 text-left border-r border-blue-400 min-w-[100px]">
                                Denominación
                              </th>
                              <th className="p-2 text-left border-r border-blue-400 w-25">
                                Cant.
                              </th>
                              <th className="p-2 text-left border-r border-blue-400 w-30">
                                P. Unit.
                              </th>
                              <th className="p-2 text-left border-r border-blue-400 w-20">
                                Subtotal
                              </th>
                              <th className="p-2 text-left border-r border-blue-400 min-w-[50px]">
                                Utilidad
                              </th>
                              <th className="p-2 w-10"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {(
                              step1Data.sostenibilidad.bienes_servicios || []
                            ).map((bien, index) => (
                              <tr
                                key={index}
                                className="border-b hover:bg-gray-50"
                              >
                                <td className="p-1 border-r">
                                  <Input
                                    value={bien.componente}
                                    onChange={(e) => {
                                      const newBienes = [
                                        ...(step1Data.sostenibilidad
                                          .bienes_servicios || []),
                                      ];
                                      newBienes[index].componente =
                                        e.target.value;
                                      setStep1Data({
                                        ...step1Data,
                                        sostenibilidad: {
                                          ...step1Data.sostenibilidad,
                                          bienes_servicios: newBienes,
                                        },
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
                                        ...(step1Data.sostenibilidad
                                          .bienes_servicios || []),
                                      ];
                                      newBienes[index].denominacion =
                                        e.target.value;
                                      setStep1Data({
                                        ...step1Data,
                                        sostenibilidad: {
                                          ...step1Data.sostenibilidad,
                                          bienes_servicios: newBienes,
                                        },
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
                                        ...(step1Data.sostenibilidad
                                          .bienes_servicios || []),
                                      ];
                                      const cantidad = parseInt(e.target.value);
                                      newBienes[index].cantidad = cantidad;
                                      newBienes[index].subtotal =
                                        cantidad *
                                        newBienes[index].precio_unitario;
                                      setStep1Data({
                                        ...step1Data,
                                        sostenibilidad: {
                                          ...step1Data.sostenibilidad,
                                          bienes_servicios: newBienes,
                                        },
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
                                        ...(step1Data.sostenibilidad
                                          .bienes_servicios || []),
                                      ];
                                      const precio = parseFloat(e.target.value);
                                      newBienes[index].precio_unitario = precio;
                                      newBienes[index].subtotal =
                                        newBienes[index].cantidad * precio;
                                      setStep1Data({
                                        ...step1Data,
                                        sostenibilidad: {
                                          ...step1Data.sostenibilidad,
                                          bienes_servicios: newBienes,
                                        },
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
                                        ...(step1Data.sostenibilidad
                                          .bienes_servicios || []),
                                      ];
                                      newBienes[index].descripcion_utilidad =
                                        e.target.value;
                                      setStep1Data({
                                        ...step1Data,
                                        sostenibilidad: {
                                          ...step1Data.sostenibilidad,
                                          bienes_servicios: newBienes,
                                        },
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
                                        step1Data.sostenibilidad
                                          .bienes_servicios || []
                                      ).filter((_, i) => i !== index);
                                      setStep1Data({
                                        ...step1Data,
                                        sostenibilidad: {
                                          ...step1Data.sostenibilidad,
                                          bienes_servicios: newBienes,
                                        },
                                      });
                                    }}
                                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    ×
                                  </Button>
                                </td>
                              </tr>
                            ))}
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
                            sostenibilidad: {
                              ...step1Data.sostenibilidad,
                              bienes_servicios: [
                                ...(step1Data.sostenibilidad.bienes_servicios ||
                                  []),
                                newBien,
                              ],
                            },
                          });
                        }}
                        className="w-full h-8"
                      >
                        + Agregar bien o servicio
                      </Button>

                      {/* Total general */}
                      {(step1Data.sostenibilidad.bienes_servicios || [])
                        .length > 0 && (
                        <div className="flex justify-end">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                            <span className="text-sm font-semibold">
                              Total General: S/{" "}
                              {(step1Data.sostenibilidad.bienes_servicios || [])
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
        {/* Sección de Análisis de Consistencia */}
        <Card className="border-2 border-primary shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
            <CardDescription className="text-base">
              La IA ha analizado la consistencia de tu propuesta y especifica un
              resumen preliminar de todas las oportunidades de mejora en función
              a la rúbrica de evaluación.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Puntaje Total */}
            <div className="my-6">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-300 rounded-xl p-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Puntaje Total</p>
                  <p className="text-5xl font-bold text-purple-600">
                    {step2Data.puntaje_total || 0}
                    <span className="text-2xl text-gray-500">/80</span>
                  </p>
                  <p className="text-sm text-gray-600 mt-2">Puntos obtenidos</p>
                </div>
              </div>
            </div>

            {/* Accordion con todos los criterios */}
            <Accordion type="multiple" className="w-full space-y-4">
              {/* INTENCIONALIDAD */}
              <CriterioAccordionHeader
                value="intencionalidad"
                icon={FileText}
                iconBgColor="bg-blue-500"
                title="1. Intencionalidad"
                subtitle="Caracterización del problema y objetivos"
                currentScore={
                  (step2Data.intencionalidad?.indicador_1_1?.puntaje || 0) +
                  (step2Data.intencionalidad?.indicador_1_2?.puntaje || 0)
                }
                maxScore={25}
              >
                <AccordionContent className="px-4 pb-4">
                  {/* Indicador 1.1 */}
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-blue-900">
                        1.1 Caracterización del Problema
                      </h4>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {step2Data.intencionalidad?.indicador_1_1?.puntaje ||
                            0}{" "}
                          / 15 pts
                        </Badge>
                        <Badge className="bg-purple-500">
                          {step2Data.intencionalidad?.indicador_1_1?.nivel}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="bg-white p-3 rounded">
                        <p className="font-semibold mb-1">Vinculación CNEB:</p>
                        <p className="text-gray-700">
                          {
                            step2Data.intencionalidad?.indicador_1_1
                              ?.vinculacion_cneb
                          }
                        </p>
                      </div>
                      {step2Data.intencionalidad?.indicador_1_1
                        ?.evidencia_consolidados && (
                        <div className="bg-white p-3 rounded">
                          <p className="font-semibold mb-1">Evidencia:</p>
                          <p className="text-gray-700">
                            {
                              step2Data.intencionalidad?.indicador_1_1
                                ?.evidencia_consolidados
                            }
                          </p>
                        </div>
                      )}
                      <div className="bg-white p-3 rounded">
                        <p className="font-semibold mb-1">Justificación:</p>
                        <p className="text-gray-700">
                          {
                            step2Data.intencionalidad?.indicador_1_1
                              ?.justificacion
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Indicador 1.2 */}
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-blue-900">
                        1.2 Objetivos (SMART)
                      </h4>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {step2Data.intencionalidad?.indicador_1_2?.puntaje ||
                            0}{" "}
                          / 10 pts
                        </Badge>
                        <Badge className="bg-purple-500">
                          {step2Data.intencionalidad?.indicador_1_2?.nivel}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="bg-white p-3 rounded">
                        <p className="font-semibold mb-2">Checklist SMART:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(
                            step2Data.intencionalidad?.indicador_1_2
                              ?.checklist_smart || {}
                          ).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-2">
                              <span>{value ? "✅" : "❌"}</span>
                              <span className="capitalize">{key}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded">
                        <p className="font-semibold mb-1">Justificación:</p>
                        <p className="text-gray-700">
                          {
                            step2Data.intencionalidad?.indicador_1_2
                              ?.justificacion
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </CriterioAccordionHeader>

              {/* ORIGINALIDAD */}
              <CriterioAccordionHeader
                value="originalidad"
                icon={Lightbulb}
                iconBgColor="bg-green-500"
                title="2. Originalidad"
                subtitle="Metodología y procedimiento"
                currentScore={
                  (step2Data.originalidad?.indicador_2_1?.puntaje || 0) +
                  (step2Data.originalidad?.indicador_2_2?.puntaje || 0)
                }
                maxScore={25}
              >
                <AccordionContent className="px-4 pb-4">
                  {/* Indicador 2.1 */}
                  <div className="mb-4 p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-green-900">
                        2.1 Metodología/Estrategia
                      </h4>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {step2Data.originalidad?.indicador_2_1?.puntaje || 0}{" "}
                          / 15 pts
                        </Badge>
                        <Badge className="bg-purple-500">
                          {step2Data.originalidad?.indicador_2_1?.nivel}
                        </Badge>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded text-sm">
                      <p className="text-gray-700">
                        {step2Data.originalidad?.indicador_2_1?.analisis}
                      </p>
                    </div>
                  </div>

                  {/* Indicador 2.2 */}
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-green-900">
                        2.2 Procedimiento y Video
                      </h4>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {step2Data.originalidad?.indicador_2_2?.puntaje || 0}{" "}
                          / 10 pts
                        </Badge>
                        <Badge className="bg-purple-500">
                          {step2Data.originalidad?.indicador_2_2?.nivel}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="bg-white p-3 rounded">
                        <p className="font-semibold mb-2">
                          Calidad del Procedimiento:
                        </p>
                        <p className="text-gray-700">
                          {
                            step2Data.originalidad?.indicador_2_2
                              ?.calidad_procedimiento
                          }
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded">
                        <p className="font-semibold mb-2">Video Detectado:</p>
                        <p className="text-gray-700">
                          {step2Data.originalidad?.indicador_2_2
                            ?.video_detectado
                            ? "✅ Sí"
                            : "❌ No"}{" "}
                          - Puntaje:{" "}
                          {step2Data.originalidad?.indicador_2_2?.puntaje_video}{" "}
                          pts
                        </p>
                      </div>
                      {step2Data.originalidad?.indicador_2_2?.observacion && (
                        <div className="bg-white p-3 rounded">
                          <p className="font-semibold mb-1">Observación:</p>
                          <p className="text-gray-700">
                            {step2Data.originalidad?.indicador_2_2?.observacion}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </CriterioAccordionHeader>

              {/* IMPACTO */}
              <CriterioAccordionHeader
                value="impacto"
                icon={Sparkles}
                iconBgColor="bg-orange-500"
                title="3. Impacto"
                subtitle="Resultados y cambios sistémicos"
                currentScore={
                  (step2Data.impacto?.indicador_3_1?.puntaje || 0) +
                  (step2Data.impacto?.indicador_3_2?.puntaje || 0)
                }
                maxScore={15}
              >
                <AccordionContent className="px-4 pb-4">
                  {/* Indicador 3.1 */}
                  <div className="mb-4 p-4 bg-orange-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-orange-900">
                        3.1 Resultados de Aprendizaje
                      </h4>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {step2Data.impacto?.indicador_3_1?.puntaje || 0} / 10
                          pts
                        </Badge>
                        <Badge className="bg-purple-500">
                          {step2Data.impacto?.indicador_3_1?.nivel}
                        </Badge>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded text-sm">
                      <p className="font-semibold mb-2">
                        Análisis de Evidencias:
                      </p>
                      <pre className="whitespace-pre-wrap text-gray-700">
                        {JSON.stringify(
                          step2Data.impacto?.indicador_3_1?.analisis_evidencias,
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  </div>

                  {/* Indicador 3.2 */}
                  <div className="mb-4 p-4 bg-orange-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-orange-900">
                        3.2 Cambios Sistémicos
                      </h4>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {step2Data.impacto?.indicador_3_2?.puntaje || 0} / 5
                          pts
                        </Badge>
                        <Badge className="bg-purple-500">
                          {step2Data.impacto?.indicador_3_2?.nivel}
                        </Badge>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded text-sm">
                      <p className="font-semibold mb-2">
                        Análisis de Transformación:
                      </p>
                      <pre className="whitespace-pre-wrap text-gray-700">
                        {JSON.stringify(
                          step2Data.impacto?.indicador_3_2
                            ?.analisis_transformacion,
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  </div>
                </AccordionContent>
              </CriterioAccordionHeader>

              {/* SOSTENIBILIDAD */}
              <CriterioAccordionHeader
                value="sostenibilidad"
                icon={CheckCircle}
                iconBgColor="bg-teal-500"
                title="4. Sostenibilidad"
                subtitle="Continuidad, viabilidad y recursos"
                currentScore={
                  (step2Data.sostenibilidad?.indicador_4_1?.puntaje || 0) +
                  (step2Data.sostenibilidad?.indicador_4_2?.puntaje || 0) +
                  (step2Data.sostenibilidad?.indicador_4_3?.puntaje || 0)
                }
                maxScore={15}
              >
                <AccordionContent className="px-4 pb-4">
                  {/* Indicador 4.1 */}
                  <div className="mb-4 p-4 bg-teal-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-teal-900">
                        4.1 Estrategias de Continuidad
                      </h4>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {step2Data.sostenibilidad?.indicador_4_1?.puntaje ||
                            0}{" "}
                          / 15 pts
                        </Badge>
                        <Badge className="bg-purple-500">
                          {step2Data.sostenibilidad?.indicador_4_1?.nivel}
                        </Badge>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded text-sm">
                      <p className="font-semibold mb-2">Análisis:</p>
                      <pre className="whitespace-pre-wrap text-gray-700">
                        {JSON.stringify(
                          step2Data.sostenibilidad?.indicador_4_1?.analisis,
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  </div>

                  {/* Indicador 4.2 */}
                  <div className="mb-4 p-4 bg-teal-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-teal-900">
                        4.2 Viabilidad y Aliados
                      </h4>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {step2Data.sostenibilidad?.indicador_4_2?.puntaje ||
                            0}{" "}
                          / 5 pts
                        </Badge>
                        <Badge className="bg-purple-500">
                          {step2Data.sostenibilidad?.indicador_4_2?.nivel}
                        </Badge>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded text-sm">
                      <p className="font-semibold mb-2">Análisis:</p>
                      <pre className="whitespace-pre-wrap text-gray-700">
                        {JSON.stringify(
                          step2Data.sostenibilidad?.indicador_4_2?.analisis,
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  </div>

                  {/* Indicador 4.3 */}
                  <div className="mb-4 p-4 bg-teal-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-teal-900">
                        4.3 Bienes y Servicios
                      </h4>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {step2Data.sostenibilidad?.indicador_4_3?.puntaje ||
                            0}{" "}
                          / 10 pts
                        </Badge>
                        <Badge className="bg-purple-500">
                          {step2Data.sostenibilidad?.indicador_4_3?.nivel}
                        </Badge>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded text-sm">
                      <p className="font-semibold mb-2">Análisis:</p>
                      <pre className="whitespace-pre-wrap text-gray-700">
                        {JSON.stringify(
                          step2Data.sostenibilidad?.indicador_4_3?.analisis,
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  </div>
                </AccordionContent>
              </CriterioAccordionHeader>
            </Accordion>

            {/* Botones de navegación */}
            <div className="flex justify-between mt-6 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(1)}
                size="lg"
                disabled={generatingQuestions}
              >
                Volver a Editar
              </Button>
              <Button
                onClick={handleGenerateQuestions}
                size="lg"
                className="gap-2"
                disabled={generatingQuestions}
              >
                {generatingQuestions ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generando preguntas...
                  </>
                ) : (
                  <>
                    Continuar
                    <MessageSquare className="w-5 h-5" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // PASO 3: Preguntas Complementarias
  const renderStep3 = () => {
    if (!generatedQuestions) {
      return (
        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Loader2 className="w-12 h-12 animate-spin text-purple-500 mb-4" />
                <p className="text-lg font-medium">Cargando preguntas...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Función auxiliar para determinar si una sección tiene puntaje completo
    const hasFullScore = (criterio: string, maxScore: number) => {
      if (!step2Data) return false;

      switch (criterio) {
        case "intencionalidad":
          return (
            (step2Data.intencionalidad?.indicador_1_1?.puntaje || 0) +
              (step2Data.intencionalidad?.indicador_1_2?.puntaje || 0) ===
            maxScore
          );
        case "originalidad":
          return (
            (step2Data.originalidad?.indicador_2_1?.puntaje || 0) +
              (step2Data.originalidad?.indicador_2_2?.puntaje || 0) ===
            maxScore
          );
        case "impacto":
          return (
            (step2Data.impacto?.indicador_3_1?.puntaje || 0) +
              (step2Data.impacto?.indicador_3_2?.puntaje || 0) ===
            maxScore
          );
        case "sostenibilidad":
          return (
            (step2Data.sostenibilidad?.indicador_4_1?.puntaje || 0) +
              (step2Data.sostenibilidad?.indicador_4_2?.puntaje || 0) +
              (step2Data.sostenibilidad?.indicador_4_3?.puntaje || 0) ===
            maxScore
          );
        default:
          return false;
      }
    };

    const criterios = [
      {
        key: "intencionalidad",
        name: "Intencionalidad",
        maxScore: 25,
        icon: Lightbulb,
        color: "blue",
      },
      {
        key: "originalidad",
        name: "Originalidad",
        maxScore: 30,
        icon: Sparkles,
        color: "green",
      },
      {
        key: "impacto",
        name: "Impacto",
        maxScore: 15,
        icon: CheckCircle,
        color: "orange",
      },
      {
        key: "sostenibilidad",
        name: "Sostenibilidad",
        maxScore: 30,
        icon: Clock,
        color: "teal",
      },
    ];

    // Filtrar criterios que NO tienen puntaje completo
    const criteriosConPreguntas = criterios.filter(
      (criterio) => !hasFullScore(criterio.key, criterio.maxScore)
    );

    // Si todos tienen puntaje completo, mostrar mensaje y pasar directamente al paso 4
    if (criteriosConPreguntas.length === 0) {
      return (
        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-green-50 to-green-100">
              <CardTitle className="text-2xl flex items-center gap-2">
                <CheckCircle className="w-6 h-6" />
                ¡Excelente trabajo!
              </CardTitle>
              <CardDescription>
                Has obtenido el puntaje máximo en todos los criterios
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="bg-green-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-16 h-16 text-green-600" />
                </div>
                <p className="text-lg">
                  No necesitas responder preguntas complementarias.
                </p>
                <p className="text-muted-foreground">
                  Tu proyecto ha alcanzado la máxima calificación en el análisis
                  inicial.
                </p>
                <Button
                  onClick={() => setCurrentStep(4)}
                  size="lg"
                  className="mt-6 gap-2"
                >
                  Ver Resultado Final
                  <CheckCircle className="w-5 h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100">
            <CardTitle className="text-2xl flex items-center gap-2">
              <MessageSquare className="w-6 h-6" />
              Preguntas Complementarias
            </CardTitle>
            <CardDescription>
              Responde estas preguntas para mejorar tu puntaje en las áreas
              identificadas
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Mostrar puntaje actual */}
            <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Puntaje Actual</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {generatedQuestions.puntaje_actual} /{" "}
                    {generatedQuestions.puntaje_maximo} pts
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Áreas a mejorar</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {criteriosConPreguntas.length}
                  </p>
                </div>
              </div>
            </div>

            <Accordion type="multiple" className="w-full">
              {criteriosConPreguntas.map((criterio) => {
                const questions = generatedQuestions[criterio.key];
                if (
                  !questions ||
                  !questions.preguntas ||
                  questions.preguntas.length === 0
                ) {
                  return null;
                }

                const Icon = criterio.icon;
                const colorClasses = {
                  blue: "bg-blue-500 border-blue-200",
                  green: "bg-green-500 border-green-200",
                  orange: "bg-orange-500 border-orange-200",
                  teal: "bg-teal-500 border-teal-200",
                };

                return (
                  <AccordionItem
                    key={criterio.key}
                    value={criterio.key}
                    className="border rounded-lg mb-4"
                  >
                    <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`${
                              colorClasses[
                                criterio.color as keyof typeof colorClasses
                              ]
                            } text-white rounded-lg p-2`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <p className="font-semibold">{criterio.name}</p>
                            <p className="text-sm text-gray-500">
                              {questions.preguntas.length} pregunta
                              {questions.preguntas.length > 1 ? "s" : ""} para
                              mejorar
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {criterio.key === "intencionalidad" &&
                          step2Data?.intencionalidad
                            ? (step2Data.intencionalidad.indicador_1_1
                                ?.puntaje || 0) +
                              (step2Data.intencionalidad.indicador_1_2
                                ?.puntaje || 0)
                            : criterio.key === "originalidad" &&
                              step2Data?.originalidad
                            ? (step2Data.originalidad.indicador_2_1?.puntaje ||
                                0) +
                              (step2Data.originalidad.indicador_2_2?.puntaje ||
                                0)
                            : criterio.key === "impacto" && step2Data?.impacto
                            ? (step2Data.impacto.indicador_3_1?.puntaje || 0) +
                              (step2Data.impacto.indicador_3_2?.puntaje || 0)
                            : criterio.key === "sostenibilidad" &&
                              step2Data?.sostenibilidad
                            ? (step2Data.sostenibilidad.indicador_4_1
                                ?.puntaje || 0) +
                              (step2Data.sostenibilidad.indicador_4_2
                                ?.puntaje || 0) +
                              (step2Data.sostenibilidad.indicador_4_3
                                ?.puntaje || 0)
                            : 0}{" "}
                          / {criterio.maxScore} pts
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 space-y-6">
                      {/* Introducción */}
                      {questions.introduccion && (
                        <Alert className="bg-purple-50 border-purple-200">
                          <MessageSquare className="w-4 h-4" />
                          <AlertDescription>
                            {questions.introduccion}
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Preguntas */}
                      {questions.preguntas.map(
                        (pregunta: string, idx: number) => (
                          <div key={idx} className="space-y-3">
                            <Card className="bg-purple-50 border-purple-200">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-purple-900">
                                  Pregunta {idx + 1}
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                  {pregunta}
                                </p>
                              </CardContent>
                            </Card>
                            <Textarea
                              placeholder="Escribe tu respuesta aquí..."
                              className="min-h-[120px]"
                              value={
                                step3Answers[criterio.key]?.[
                                  `respuesta_${idx + 1}`
                                ] || ""
                              }
                              onChange={(e) => {
                                setStep3Answers((prev) => ({
                                  ...prev,
                                  [criterio.key]: {
                                    ...(prev[criterio.key] || {}),
                                    [`respuesta_${idx + 1}`]: e.target.value,
                                  },
                                }));
                              }}
                            />
                          </div>
                        )
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep(2)} size="lg">
            Anterior
          </Button>
          <Button
            onClick={handleEvaluateStep3Answers}
            size="lg"
            className="gap-2"
          >
            Evaluar y Ver Resultado
            <CheckCircle className="w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  };

  // PASO 4: Resultado Final
  const renderStep4 = () => {
    const copyToClipboard = (text: string, label: string) => {
      navigator.clipboard.writeText(text);
      toast({
        title: "✅ Copiado",
        description: `${label} copiado al portapapeles`,
        duration: 2000,
      });
    };

    const generatePDF = () => {
      if (!improvedResponses || !proyecto) {
        toast({
          title: "❌ Error",
          description: "No hay respuestas mejoradas para generar el PDF",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "🔄 Generando PDF...",
        description: "Preparando el documento para descarga",
      });

      try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const margin = 20;
        const maxWidth = pageWidth - 2 * margin;
        let yPos = 20;

        // Helper para agregar texto con salto de página automático
        const addText = (
          text: string,
          fontSize: number,
          isBold = false,
          color: [number, number, number] = [0, 0, 0]
        ) => {
          doc.setFontSize(fontSize);
          doc.setTextColor(color[0], color[1], color[2]);

          if (isBold) {
            doc.setFont("helvetica", "bold");
          } else {
            doc.setFont("helvetica", "normal");
          }

          const lines = doc.splitTextToSize(text, maxWidth);
          const lineHeight = fontSize * 0.5;

          lines.forEach((line: string) => {
            if (yPos + lineHeight > doc.internal.pageSize.height - 20) {
              doc.addPage();
              yPos = 20;
            }
            doc.text(line, margin, yPos);
            yPos += lineHeight;
          });

          yPos += 5; // Espacio después del texto
        };

        const addSection = (title: string, content: string) => {
          // Título de la pregunta
          addText(title, 12, true, [41, 128, 185]); // Azul
          yPos += 2;

          // Contenido de la respuesta
          addText(content || "(Sin respuesta)", 10, false, [0, 0, 0]);
          yPos += 8; // Espacio entre secciones
        };

        // === PORTADA ===
        doc.setFillColor(41, 128, 185);
        doc.rect(0, 0, pageWidth, 60, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.text("CNPIE 2026 - Anexo 2A", pageWidth / 2, 30, {
          align: "center",
        });

        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        doc.text("Respuestas Mejoradas por IA", pageWidth / 2, 45, {
          align: "center",
        });

        yPos = 80;
        doc.setTextColor(0, 0, 0);

        addText(`Fecha: ${new Date().toLocaleDateString("es-ES")}`, 10);
        yPos += 10;

        // === 1. INTENCIONALIDAD ===
        doc.setFillColor(52, 152, 219);
        doc.rect(margin - 5, yPos - 5, maxWidth + 10, 12, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("1. INTENCIONALIDAD", margin, yPos + 5);
        yPos += 20;
        doc.setTextColor(0, 0, 0);

        addSection(
          "1.1 Caracterización del Problema",
          improvedResponses.intencionalidad?.respuesta_1_1 || ""
        );

        addSection(
          "1.2 Objetivos del Proyecto",
          improvedResponses.intencionalidad?.respuesta_1_2 || ""
        );

        // === 2. ORIGINALIDAD ===
        if (yPos > doc.internal.pageSize.height - 60) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFillColor(46, 204, 113);
        doc.rect(margin - 5, yPos - 5, maxWidth + 10, 12, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("2. ORIGINALIDAD", margin, yPos + 5);
        yPos += 20;
        doc.setTextColor(0, 0, 0);

        addSection(
          "2.1 Metodología o Estrategia",
          improvedResponses.originalidad?.respuesta_2_1 || ""
        );

        addSection(
          "2.2 Procedimiento Metodológico",
          improvedResponses.originalidad?.respuesta_2_2 || ""
        );

        // === 3. IMPACTO ===
        if (yPos > doc.internal.pageSize.height - 60) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFillColor(230, 126, 34);
        doc.rect(margin - 5, yPos - 5, maxWidth + 10, 12, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("3. IMPACTO", margin, yPos + 5);
        yPos += 20;
        doc.setTextColor(0, 0, 0);

        addSection(
          "3.1 Resultados de Aprendizaje",
          improvedResponses.impacto?.respuesta_3_1 || ""
        );

        addSection(
          "3.2 Cambios Sistémicos",
          improvedResponses.impacto?.respuesta_3_2 || ""
        );

        // === 4. SOSTENIBILIDAD ===
        if (yPos > doc.internal.pageSize.height - 60) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFillColor(26, 188, 156);
        doc.rect(margin - 5, yPos - 5, maxWidth + 10, 12, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("4. SOSTENIBILIDAD", margin, yPos + 5);
        yPos += 20;
        doc.setTextColor(0, 0, 0);

        addSection(
          "4.1 Estrategias de Continuidad",
          improvedResponses.sostenibilidad?.respuesta_4_1 || ""
        );

        addSection(
          "4.2 Viabilidad y Aliados",
          improvedResponses.sostenibilidad?.respuesta_4_2 || ""
        );

        // === PIE DE PÁGINA EN TODAS LAS PÁGINAS ===
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(128, 128, 128);
          doc.text(
            `Página ${i} de ${pageCount} | Generado por Agua Segura - Guía Andina`,
            pageWidth / 2,
            doc.internal.pageSize.height - 10,
            { align: "center" }
          );
        }

        // Descargar PDF
        const fileName = `CNPIE_2A_${proyecto.id.replace(
          /[^a-z0-9]/gi,
          "_"
        )}_${new Date().getTime()}.pdf`;
        doc.save(fileName);

        toast({
          title: "✅ PDF Generado",
          description: "El documento se ha descargado correctamente",
        });
      } catch (error) {
        console.error("Error generando PDF:", error);
        toast({
          title: "❌ Error",
          description: "No se pudo generar el PDF",
          variant: "destructive",
        });
      }
    };

    if (!improvedResponses) {
      return (
        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
              <CardTitle className="text-3xl flex items-center gap-3">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                Generando Respuestas Mejoradas
              </CardTitle>
              <CardDescription className="text-base">
                La IA está procesando tus respuestas...
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      );
    }

    // Reconstruir el objeto combinado para mostrar
    const combinedDataForDisplay = {
      intencionalidad: {
        respuesta_original_1_1:
          step1Data?.intencionalidad?.problema_descripcion || "",
        nueva_respuesta_1_1: step3Answers?.intencionalidad?.respuesta_1 || "",
        respuesta_original_1_2:
          step1Data?.intencionalidad?.objetivo_general || "",
        nueva_respuesta_1_2: step3Answers?.intencionalidad?.respuesta_2 || "",
      },
      originalidad: {
        respuesta_original_2_1:
          step1Data?.originalidad?.metodologia_descripcion || "",
        nueva_respuesta_2_1: step3Answers?.originalidad?.respuesta_1 || "",
        respuesta_original_2_2:
          step1Data?.originalidad?.procedimiento_metodologico || "",
        nueva_respuesta_2_2: step3Answers?.originalidad?.respuesta_2 || "",
      },
      impacto: {
        respuesta_original_3_1:
          step1Data?.impacto?.evidencias_descripcion || "",
        nueva_respuesta_3_1: step3Answers?.impacto?.respuesta_1 || "",
        respuesta_original_3_2:
          step1Data?.impacto?.cambios_practica_docente || "",
        nueva_respuesta_3_2: step3Answers?.impacto?.respuesta_2 || "",
      },
      sostenibilidad: {
        respuesta_original_4_1:
          step1Data?.sostenibilidad?.estrategias_continuidad || "",
        nueva_respuesta_4_1: step3Answers?.sostenibilidad?.respuesta_1 || "",
        respuesta_original_4_2:
          step1Data?.sostenibilidad?.estrategias_viabilidad || "",
        nueva_respuesta_4_2: step3Answers?.sostenibilidad?.respuesta_2 || "",
      },
    };

    return (
      <div className="space-y-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl flex items-center gap-3">
                  <Sparkles className="w-8 h-8 text-purple-600" />
                  Respuestas Mejoradas - Listas para Copiar
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  La IA ha integrado tus respuestas originales con la
                  información complementaria del coaching
                </CardDescription>
              </div>
              <Button
                onClick={generatePDF}
                size="lg"
                className="gap-2"
                variant="default"
              >
                <Download className="w-5 h-5" />
                Descargar PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-8">
            {/* Respuestas Mejoradas por la IA */}
            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-3">
                  <Sparkles className="w-7 h-7 text-purple-600" />✨ Respuestas
                  Mejoradas por IA
                </CardTitle>
                <CardDescription className="text-base">
                  Las 8 respuestas finales integradas y optimizadas - Listas
                  para copiar al formato oficial
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 1.1 */}
                <Card className="bg-white">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">🔹 1.1 Problema</CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          copyToClipboard(
                            improvedResponses.intencionalidad?.respuesta_1_1 ||
                              "",
                            "Respuesta 1.1"
                          )
                        }
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Copiar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm">
                      {improvedResponses.intencionalidad?.respuesta_1_1}
                    </p>
                  </CardContent>
                </Card>

                {/* 1.2 */}
                <Card className="bg-white">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">
                        🔹 1.2 Objetivos
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          copyToClipboard(
                            improvedResponses.intencionalidad?.respuesta_1_2 ||
                              "",
                            "Respuesta 1.2"
                          )
                        }
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Copiar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm">
                      {improvedResponses.intencionalidad?.respuesta_1_2}
                    </p>
                  </CardContent>
                </Card>

                {/* 2.1 */}
                <Card className="bg-white">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">
                        🔹 2.1 Metodología
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          copyToClipboard(
                            improvedResponses.originalidad?.respuesta_2_1 || "",
                            "Respuesta 2.1"
                          )
                        }
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Copiar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm">
                      {improvedResponses.originalidad?.respuesta_2_1}
                    </p>
                  </CardContent>
                </Card>

                {/* 2.2 */}
                <Card className="bg-white">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">
                        🔹 2.2 Procedimiento
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          copyToClipboard(
                            improvedResponses.originalidad?.respuesta_2_2 || "",
                            "Respuesta 2.2"
                          )
                        }
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Copiar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm">
                      {improvedResponses.originalidad?.respuesta_2_2}
                    </p>
                  </CardContent>
                </Card>

                {/* 3.1 */}
                <Card className="bg-white">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">
                        🔹 3.1 Resultados
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          copyToClipboard(
                            improvedResponses.impacto?.respuesta_3_1 || "",
                            "Respuesta 3.1"
                          )
                        }
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Copiar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm">
                      {improvedResponses.impacto?.respuesta_3_1}
                    </p>
                  </CardContent>
                </Card>

                {/* 3.2 */}
                <Card className="bg-white">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">
                        🔹 3.2 Cambios Sistémicos
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          copyToClipboard(
                            improvedResponses.impacto?.respuesta_3_2 || "",
                            "Respuesta 3.2"
                          )
                        }
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Copiar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm">
                      {improvedResponses.impacto?.respuesta_3_2}
                    </p>
                  </CardContent>
                </Card>

                {/* 4.1 */}
                <Card className="bg-white">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">
                        🔹 4.1 Continuidad
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          copyToClipboard(
                            improvedResponses.sostenibilidad?.respuesta_4_1 ||
                              "",
                            "Respuesta 4.1"
                          )
                        }
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Copiar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm">
                      {improvedResponses.sostenibilidad?.respuesta_4_1}
                    </p>
                  </CardContent>
                </Card>

                {/* 4.2 */}
                <Card className="bg-white">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">
                        🔹 4.2 Viabilidad
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          copyToClipboard(
                            improvedResponses.sostenibilidad?.respuesta_4_2 ||
                              "",
                            "Respuesta 4.2"
                          )
                        }
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Copiar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm">
                      {improvedResponses.sostenibilidad?.respuesta_4_2}
                    </p>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            {/* Botones de acción */}
            <div className="flex justify-between items-center pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(3)}
                size="lg"
              >
                Volver
              </Button>
              <Button
                onClick={() => {
                  toast({
                    title: "💾 Listo",
                    description:
                      "Todas las respuestas están disponibles para copiar",
                  });
                }}
                size="lg"
                className="gap-2"
              >
                <Save className="w-5 h-5" />
                Cerrar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

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
      tipoProyecto="2B"
      etapaNumber={1}
      aceleradorNumber={1}
      onSave={handleSave}
      onValidate={handleValidate}
      canProceed={true}
      currentProgress={0}
      titulo="Ficha Descriptiva - Proyecto en Implementación"
      descripcion="Completa la ficha descriptiva de tu proyecto de innovación educativa en proceso de implementación"
    >
      <div className="grid lg:grid-cols-[1fr_350px] md:grid-cols-1 gap-6">
        {/* Contenido Principal */}
        <div className="space-y-6">
          {/* Progress Stepper */}
          <ProgressStepper
            steps={STEPS}
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={setCurrentStep}
          />
          {renderStepContent()}
        </div>

        {/* Sidebar con rúbrica */}
        <div className="lg:block hidden">
          <div className="sticky top-4">
            <CNPIERubricViewer
              rubricas={[
                rubricaIntencionalidad,
                rubricaOriginalidad,
                rubricaPertinencia,
                rubricaImpacto,
                rubricaSostenibilidad,
              ].filter(
                (r): r is NonNullable<typeof r> => r !== null && r !== undefined
              )}
              destacarCriterios={[
                "Intencionalidad",
                "Originalidad",
                "Pertinencia",
                "Impacto",
                "Sostenibilidad",
              ]}
            />
          </div>
        </div>
      </div>
    </CNPIEAcceleratorLayout>
  );
}
