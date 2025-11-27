import { useState, useEffect } from "react";
import { useCNPIEProject } from "@/hooks/useCNPIEProject";
import { useCNPIERubric } from "@/hooks/useCNPIERubric";
import { CNPIEAcceleratorLayout } from "@/components/cnpie/CNPIEAcceleratorLayout";
import { CNPIERubricViewer } from "@/components/cnpie/CNPIERubricViewer";
import { CriterioAccordionHeader } from "../components/CriterioAccordionHeader";
import { ProgressStepper } from "../components/ProgressStepper";
import { QuestionCardWithTextarea } from "../components/QuestionCardWithTextarea";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";
import { saveAs } from "file-saver";
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
  BienServicio,
  ANEXO_2C_LIMITS,
  ITEMS_FICHA_2C,
  FormDataStep1_2C,
  AnalysisStep2_2C,
  FormDataStep3_2C,
  FinalAnalysisStep4_2C,
} from "@/types/cnpie";

// Alias para mantener compatibilidad con el código existente
type FormDataStep1 = FormDataStep1_2C;
type AnalysisStep2 = AnalysisStep2_2C;
type FormDataStep3 = FormDataStep3_2C;
type FinalAnalysisStep4 = FinalAnalysisStep4_2C;

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

export default function Etapa1Acelerador12c() {
  const {
    proyecto,
    saveAcceleratorData,
    validateAccelerator,
    getAcceleratorData,
    getAllData,
  } = useCNPIEProject("2C");

  const { rubricas, getCriterioByName } = useCNPIERubric("2C");
  const { toast } = useToast();

  const rubricaIntencionalidad = getCriterioByName("Intencionalidad");
  const rubricaOriginalidad = getCriterioByName("Originalidad");
  const rubricaPertinencia = getCriterioByName("Pertinencia");
  const rubricaParticipacion = getCriterioByName("Participación");
  const rubricaReflexion = getCriterioByName("Reflexión");
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
    },

    // CRITERIO 3: PERTINENCIA
    pertinencia: {
      intereses_necesidades: "",
      contexto_cultural: "",
    },

    // CRITERIO 4: PARTICIPACIÓN
    participacion: {
      actores_roles: "",
    },

    // CRITERIO 5: REFLEXIÓN
    reflexion: {
      mecanismos_reflexion: "",
    },

    // CRITERIO 6: SOSTENIBILIDAD
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
    pertinencia?: {
      respuesta_3_1: string;
      respuesta_3_2: string;
    };
    participacion?: {
      respuesta_4_1: string;
    };
    reflexion?: {
      respuesta_5_1: string;
    };
    sostenibilidad?: {
      respuesta_6_1: string;
      respuesta_6_2: string;
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
      oldData.participacion &&
      oldData.reflexion &&
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
      },
      pertinencia: {
        intereses_necesidades: (oldData.intereses_necesidades as string) || "",
        contexto_cultural: (oldData.contexto_cultural as string) || "",
      },
      participacion: {
        actores_roles: (oldData.actores_roles as string) || "",
      },
      reflexion: {
        mecanismos_reflexion: (oldData.mecanismos_reflexion as string) || "",
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
      const apiPromise = supabase.functions.invoke("analyze-cnpie-general-2b", {
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
            "📋 DICTAMEN TÉCNICO: INTENCIONALIDAD (IMPLEMENTACIÓN)"
          ];

        const indicador11 =
          dictamenInt?.["🔹 INDICADOR 1.1: Caracterización del Problema"];

        const indicador12 = dictamenInt?.["🔹 INDICADOR 1.2: Objetivos"];

        // Extraer datos de Originalidad
        const dictamenOrig =
          data.analysis.originalidad?.[
            "📋 DICTAMEN TÉCNICO: ORIGINALIDAD (IMPLEMENTACIÓN)"
          ];

        const indicador21 =
          dictamenOrig?.["🔹 INDICADOR 2.1: Metodología/Estrategia"];

        const indicador22 =
          dictamenOrig?.["🔹 INDICADOR 2.2: Procedimiento y Video"];

        // Extraer datos de Pertinencia (NUEVO en 2B)
        const dictamenPert =
          data.analysis.pertinencia?.[
            "📋 DICTAMEN TÉCNICO: PERTINENCIA (IMPLEMENTACIÓN)"
          ];

        const indicador31 =
          dictamenPert?.["🔹 INDICADOR 3.1: Intereses y Necesidades"];

        const indicador32 =
          dictamenPert?.["🔹 INDICADOR 3.2: Adaptación al Contexto"];

        // Extraer datos de Impacto
        const dictamenImp =
          data.analysis.impacto?.[
            "📋 DICTAMEN TÉCNICO: IMPACTO (IMPLEMENTACIÓN)"
          ];

        const indicador41 =
          dictamenImp?.["🔹 INDICADOR 4.1: Resultados de Aprendizaje"];

        const indicador42 =
          dictamenImp?.["🔹 INDICADOR 4.2: Cambios Sistémicos"];

        // Extraer datos de Sostenibilidad
        const dictamenSost =
          data.analysis.sostenibilidad?.[
            "📋 DICTAMEN TÉCNICO: SOSTENIBILIDAD (IMPLEMENTACIÓN)"
          ];

        const indicador51 =
          dictamenSost?.["🔹 INDICADOR 5.1: Estrategias de Viabilidad"];

        const indicador52 =
          dictamenSost?.["🔹 INDICADOR 5.2: Pertinencia de Bienes y Servicios"];

        // Calcular puntaje total (2B tiene 90 puntos máximos)
        const puntajeTotal =
          (indicador11?.PUNTAJE || 0) +
          (indicador12?.PUNTAJE || 0) +
          (indicador21?.PUNTAJE || 0) +
          (indicador22?.PUNTAJE || 0) +
          (indicador31?.PUNTAJE || 0) +
          (indicador32?.PUNTAJE || 0) +
          (indicador41?.PUNTAJE || 0) +
          (indicador42?.PUNTAJE || 0) +
          (indicador51?.PUNTAJE || 0) +
          (indicador52?.PUNTAJE || 0);

        // Transformar todos los criterios a estructura plana
        const transformedData = {
          intencionalidad: {
            indicador_1_1: {
              puntaje: indicador11?.PUNTAJE || 0,
              nivel: indicador11?.NIVEL || "N/A",
              vinculacion_cneb:
                indicador11?.["Análisis Técnico"]?.["Vinculación CNEB"] || "",
              evidencia:
                indicador11?.["Análisis Técnico"]?.[
                  "Evidencia (Contexto Implementación)"
                ] || "",
              causas_consecuencias:
                indicador11?.["Análisis Técnico"]?.["Causas/Consecuencias"] ||
                "",
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
              observacion_final: indicador12?.["Observación Final"] || "",
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
              calidad_procedimiento:
                indicador22?.["Desglose de Evaluación"]?.[
                  "Calidad del Procedimiento"
                ] || "",
              video_detectado:
                indicador22?.["Desglose de Evaluación"]?.["Video detectado"] ===
                "✅",
              puntaje_video:
                indicador22?.["Desglose de Evaluación"]?.["Puntaje Video"] || 0,
              observacion: indicador22?.["Observación Final"] || "",
            },
          },
          pertinencia: {
            indicador_3_1: {
              puntaje: indicador31?.PUNTAJE || 0,
              nivel: indicador31?.NIVEL || "N/A",
              analisis: indicador31?.["Análisis"] || {},
            },
            indicador_3_2: {
              puntaje: indicador32?.PUNTAJE || 0,
              nivel: indicador32?.NIVEL || "N/A",
              analisis: indicador32?.["Análisis"] || {},
            },
            observacion_final: dictamenPert?.["Observación Final"] || "",
          },
          impacto: {
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
            observacion_final: dictamenImp?.["Observación Final"] || "",
          },
          sostenibilidad: {
            indicador_5_1: {
              puntaje: indicador51?.PUNTAJE || 0,
              nivel: indicador51?.NIVEL || "N/A",
              analisis: indicador51?.["Análisis"] || {},
            },
            indicador_5_2: {
              puntaje: indicador52?.PUNTAJE || 0,
              nivel: indicador52?.NIVEL || "N/A",
              analisis: indicador52?.["Análisis"] || {},
            },
            observacion_final: dictamenSost?.["Observación Final"] || "",
          },
          puntaje_total: puntajeTotal,
          puntaje_maximo: 75,
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
          description: `Tu proyecto obtuvo ${puntajeTotal} puntos de 75 posibles. Revisa los detalles por criterio.`,
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
        `https://ihgfqdmcndcyzzsbliyp.supabase.co/functions/v1/generate-survey-questions-2B`,
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
      console.log("🟢 Respuesta de generate-survey-questions-2B:", result);

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
      // Crear objeto combinado separado por secciones (Incluye Pertinencia para 2B)
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
        pertinencia: {
          respuesta_original_3_1:
            step1Data.pertinencia?.intereses_necesidades || "",
          nueva_respuesta_3_1: step3Answers.pertinencia?.respuesta_1 || "",
          respuesta_original_3_2:
            step1Data.pertinencia?.contexto_cultural || "",
          nueva_respuesta_3_2: step3Answers.pertinencia?.respuesta_2 || "",
        },
        participacion: {
          respuesta_original_4_1: step1Data.participacion?.actores_roles || "",
          nueva_respuesta_4_1: step3Answers.participacion?.respuesta_1 || "",
        },
        reflexion: {
          respuesta_original_5_1:
            step1Data.reflexion?.mecanismos_reflexion || "",
          nueva_respuesta_5_1: step3Answers.reflexion?.respuesta_1 || "",
        },
        sostenibilidad: {
          respuesta_original_5_1:
            step1Data.sostenibilidad?.estrategias_viabilidad || "",
          nueva_respuesta_5_1: step3Answers.sostenibilidad?.respuesta_1 || "",
          respuesta_original_5_2:
            step1Data.sostenibilidad?.bienes_servicios
              ?.map((b) => b.descripcion_utilidad)
              .join(", ") || "",
          nueva_respuesta_5_2: step3Answers.sostenibilidad?.respuesta_2 || "",
        },
        timestamp: new Date().toISOString(),
      };

      console.log("📦 OBJETO COMBINADO PARA IA (2C):");
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
      console.log("\n3. PERTINENCIA:");
      console.log(
        "   Respuesta Original 3.1:",
        combinedData.pertinencia.respuesta_original_3_1.substring(0, 100) +
          "..."
      );
      console.log(
        "   Nueva Respuesta 3.1:",
        combinedData.pertinencia.nueva_respuesta_3_1
      );
      console.log(
        "   Respuesta Original 3.2:",
        combinedData.pertinencia.respuesta_original_3_2.substring(0, 100) +
          "..."
      );
      console.log(
        "   Nueva Respuesta 3.2:",
        combinedData.pertinencia.nueva_respuesta_3_2
      );
      console.log("\n4. PARTICIPACIÓN:");
      console.log(
        "   Respuesta Original 4.1:",
        combinedData.participacion.respuesta_original_4_1.substring(0, 100) +
          "..."
      );
      console.log(
        "   Nueva Respuesta 4.1:",
        combinedData.participacion.nueva_respuesta_4_1
      );
      console.log("\n5. REFLEXIÓN:");
      console.log(
        "   Respuesta Original 5.1:",
        combinedData.reflexion.respuesta_original_5_1.substring(0, 100) + "..."
      );
      console.log(
        "   Nueva Respuesta 5.1:",
        combinedData.reflexion.nueva_respuesta_5_1
      );
      console.log("\n6. SOSTENIBILIDAD:");
      console.log(
        "   Respuesta Original 6.1:",
        combinedData.sostenibilidad.respuesta_original_5_1.substring(0, 100) +
          "..."
      );
      console.log(
        "   Nueva Respuesta 6.1:",
        combinedData.sostenibilidad.nueva_respuesta_5_1
      );
      console.log(
        "   Respuesta Original 6.2:",
        combinedData.sostenibilidad.respuesta_original_5_2.substring(0, 100) +
          "..."
      );
      console.log(
        "   Nueva Respuesta 6.2:",
        combinedData.sostenibilidad.nueva_respuesta_5_2
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
        "https://ihgfqdmcndcyzzsbliyp.supabase.co/functions/v1/sintetisador-cnpie",
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

      // Autoguardar el resultado final
      await handleSave();

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
                      1. {ITEMS_FICHA_2C[0].titulo}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-6">
                  {/* Pregunta 1.1 */}
                  <QuestionCardWithTextarea
                    questionNumber={ITEMS_FICHA_2C[0].preguntas[0].numero}
                    questionText={ITEMS_FICHA_2C[0].preguntas[0].texto}
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
                    maxLength={ANEXO_2C_LIMITS.PROBLEMA_CARACTERIZACION}
                  />

                  {/* Pregunta 1.2 */}
                  <QuestionCardWithTextarea
                    questionNumber={ITEMS_FICHA_2C[0].preguntas[1].numero}
                    questionText={ITEMS_FICHA_2C[0].preguntas[1].texto}
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
                    maxLength={ANEXO_2C_LIMITS.OBJETIVOS}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* SECCIÓN 2: SOLUCIÓN INNOVADORA */}
              <AccordionItem value="item-2" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-base">
                      2. {ITEMS_FICHA_2C[1].titulo}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-6">
                  {/* Pregunta 2.1 */}
                  <QuestionCardWithTextarea
                    questionNumber={ITEMS_FICHA_2C[1].preguntas[0].numero}
                    questionText={ITEMS_FICHA_2C[1].preguntas[0].texto}
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
                    maxLength={ANEXO_2C_LIMITS.METODOLOGIA_DESCRIPCION}
                  />

                  {/* Pregunta 2.2 */}
                  <div className="space-y-4">
                    <QuestionCardWithTextarea
                      questionNumber={ITEMS_FICHA_2C[1].preguntas[1].numero}
                      questionText={ITEMS_FICHA_2C[1].preguntas[1].texto}
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
                      maxLength={ANEXO_2C_LIMITS.PROCEDIMIENTO_METODOLOGICO}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* SECCIÓN 3: PERTINENCIA */}
              <AccordionItem value="item-3" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-base">
                      3. {ITEMS_FICHA_2C[2].titulo}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-6">
                  {/* Pregunta 3.1 */}
                  <QuestionCardWithTextarea
                    questionNumber={ITEMS_FICHA_2C[2].preguntas[0].numero}
                    questionText={ITEMS_FICHA_2C[2].preguntas[0].texto}
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
                    maxLength={ANEXO_2C_LIMITS.PERTINENCIA_INTERESES}
                  />

                  {/* Pregunta 3.2 */}
                  <QuestionCardWithTextarea
                    questionNumber={ITEMS_FICHA_2C[2].preguntas[1].numero}
                    questionText={ITEMS_FICHA_2C[2].preguntas[1].texto}
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
                    maxLength={ANEXO_2C_LIMITS.PERTINENCIA_CONTEXTO}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* SECCIÓN 4: PARTICIPACIÓN */}
              <AccordionItem value="item-4" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-base">
                      4. {ITEMS_FICHA_2C[3].titulo}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-6">
                  {/* Pregunta 4.1 */}
                  <QuestionCardWithTextarea
                    questionNumber={ITEMS_FICHA_2C[3].preguntas[0].numero}
                    questionText={ITEMS_FICHA_2C[3].preguntas[0].texto}
                    value={step1Data.participacion.actores_roles || ""}
                    onChange={(value) =>
                      setStep1Data({
                        ...step1Data,
                        participacion: {
                          ...step1Data.participacion,
                          actores_roles: value,
                        },
                      })
                    }
                    placeholder="Identifica a los actores clave y sus roles..."
                    minHeight="min-h-[200px]"
                    maxLength={ANEXO_2C_LIMITS.PARTICIPACION_ACTORES}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* SECCIÓN 5: REFLEXIÓN */}
              <AccordionItem value="item-5" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-base">
                      5. {ITEMS_FICHA_2C[4].titulo}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-6">
                  {/* Pregunta 5.1 */}
                  <QuestionCardWithTextarea
                    questionNumber={ITEMS_FICHA_2C[4].preguntas[0].numero}
                    questionText={ITEMS_FICHA_2C[4].preguntas[0].texto}
                    value={step1Data.reflexion.mecanismos_reflexion || ""}
                    onChange={(value) =>
                      setStep1Data({
                        ...step1Data,
                        reflexion: {
                          ...step1Data.reflexion,
                          mecanismos_reflexion: value,
                        },
                      })
                    }
                    placeholder="Describe los mecanismos de reflexión..."
                    minHeight="min-h-[200px]"
                    maxLength={ANEXO_2C_LIMITS.REFLEXION_MECANISMOS}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* SECCIÓN 6: SOSTENIBILIDAD */}
              <AccordionItem value="item-6" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-base">
                      6. {ITEMS_FICHA_2C[5].titulo}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-6">
                  {/* Pregunta 6.1 */}
                  <QuestionCardWithTextarea
                    questionNumber={ITEMS_FICHA_2C[5].preguntas[0].numero}
                    questionText={ITEMS_FICHA_2C[5].preguntas[0].texto}
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
                    maxLength={ANEXO_2C_LIMITS.SOSTENIBILIDAD_VIABILIDAD}
                  />

                  {/* Pregunta 6.2 */}
                  <div className="space-y-4">
                    <Card className="bg-amber-50 border-amber-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-amber-900">
                          Pregunta {ITEMS_FICHA_2C[5].preguntas[1].numero}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700">
                          {ITEMS_FICHA_2C[5].preguntas[1].texto}
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
                    <span className="text-2xl text-gray-500">/75</span>
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
                        ?.causas_consecuencias && (
                        <div className="bg-white p-3 rounded">
                          <p className="font-semibold mb-1">
                            Causas y Consecuencias:
                          </p>
                          <p className="text-gray-700">
                            {
                              step2Data.intencionalidad?.indicador_1_1
                                ?.causas_consecuencias
                            }
                          </p>
                        </div>
                      )}
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
                      {step2Data.intencionalidad?.indicador_1_2
                        ?.observacion_final && (
                        <div className="bg-white p-3 rounded">
                          <p className="font-semibold mb-1">
                            Observación Final:
                          </p>
                          <p className="text-gray-700">
                            {
                              step2Data.intencionalidad?.indicador_1_2
                                ?.observacion_final
                            }
                          </p>
                        </div>
                      )}
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
                          / 20 pts
                        </Badge>
                        <Badge className="bg-purple-500">
                          {step2Data.originalidad?.indicador_2_2?.nivel}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="bg-white p-3 rounded">
                        <p className="font-semibold mb-2">Análisis:</p>
                        <div className="whitespace-pre-wrap text-gray-700">
                          {step2Data.originalidad?.indicador_2_2?.analisis ||
                            "No disponible"}
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </CriterioAccordionHeader>

              {/* PERTINENCIA - NUEVO en 2B */}
              <CriterioAccordionHeader
                value="pertinencia"
                icon={Lightbulb}
                iconBgColor="bg-purple-500"
                title="3. Pertinencia"
                subtitle="Intereses, necesidades y adaptación al contexto"
                currentScore={
                  (step2Data.pertinencia?.indicador_3_1?.puntaje || 0) +
                  (step2Data.pertinencia?.indicador_3_2?.puntaje || 0)
                }
                maxScore={15}
              >
                <AccordionContent className="px-4 pb-4">
                  {/* Indicador 3.1 */}
                  <div className="mb-4 p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-purple-900">
                        3.1 Intereses y Necesidades
                      </h4>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {step2Data.pertinencia?.indicador_3_1?.puntaje || 0} /
                          10 pts
                        </Badge>
                        <Badge className="bg-purple-500">
                          {step2Data.pertinencia?.indicador_3_1?.nivel}
                        </Badge>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded text-sm">
                      <p className="font-semibold mb-2">Análisis:</p>
                      <div className="whitespace-pre-wrap text-gray-700">
                        {typeof step2Data.pertinencia?.indicador_3_1
                          ?.analisis === "string"
                          ? step2Data.pertinencia?.indicador_3_1?.analisis
                          : typeof step2Data.pertinencia?.indicador_3_1
                              ?.analisis === "object" &&
                            step2Data.pertinencia?.indicador_3_1?.analisis !==
                              null
                          ? Object.entries(
                              step2Data.pertinencia.indicador_3_1.analisis
                            )
                              .map(([key, value]) => `${key}: ${value}`)
                              .join("\n\n")
                          : "No disponible"}
                      </div>
                    </div>
                  </div>

                  {/* Indicador 3.2 */}
                  <div className="mb-4 p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-purple-900">
                        3.2 Adaptación al Contexto
                      </h4>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {step2Data.pertinencia?.indicador_3_2?.puntaje || 0} /
                          5 pts
                        </Badge>
                        <Badge className="bg-purple-500">
                          {step2Data.pertinencia?.indicador_3_2?.nivel}
                        </Badge>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded text-sm">
                      <p className="font-semibold mb-2">Análisis:</p>
                      <div className="whitespace-pre-wrap text-gray-700">
                        {typeof step2Data.pertinencia?.indicador_3_2
                          ?.analisis === "string"
                          ? step2Data.pertinencia?.indicador_3_2?.analisis
                          : typeof step2Data.pertinencia?.indicador_3_2
                              ?.analisis === "object" &&
                            step2Data.pertinencia?.indicador_3_2?.analisis !==
                              null
                          ? Object.entries(
                              step2Data.pertinencia.indicador_3_2.analisis
                            )
                              .map(([key, value]) => `${key}: ${value}`)
                              .join("\n\n")
                          : "No disponible"}
                      </div>
                    </div>
                  </div>

                  {step2Data.pertinencia?.observacion_final && (
                    <div className="mt-4 p-3 bg-purple-100 rounded-lg">
                      <p className="font-semibold mb-1">Observación Final:</p>
                      <p className="text-gray-700">
                        {step2Data.pertinencia.observacion_final}
                      </p>
                    </div>
                  )}
                </AccordionContent>
              </CriterioAccordionHeader>

              {/* PARTICIPACIÓN - Nuevo en 2C */}
              <CriterioAccordionHeader
                value="participacion"
                icon={Sparkles}
                iconBgColor="bg-orange-500"
                title="4. Participación"
                subtitle="Actores clave y roles"
                currentScore={
                  step2Data.participacion?.indicador_4_1?.puntaje || 0
                }
                maxScore={10}
              >
                <AccordionContent className="px-4 pb-4">
                  {/* Indicador 4.1 */}
                  <div className="mb-4 p-4 bg-orange-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-orange-900">
                        4.1 Actores Clave del Equipo
                      </h4>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {step2Data.participacion?.indicador_4_1?.puntaje || 0}{" "}
                          / 10 pts
                        </Badge>
                        <Badge className="bg-purple-500">
                          {step2Data.participacion?.indicador_4_1?.nivel}
                        </Badge>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded text-sm">
                      <p className="font-semibold mb-2">Análisis:</p>
                      <div className="whitespace-pre-wrap text-gray-700">
                        {typeof step2Data.participacion?.indicador_4_1
                          ?.analisis === "string"
                          ? step2Data.participacion?.indicador_4_1?.analisis
                          : typeof step2Data.participacion?.indicador_4_1
                              ?.analisis === "object" &&
                            step2Data.participacion?.indicador_4_1?.analisis !==
                              null
                          ? Object.entries(
                              step2Data.participacion.indicador_4_1.analisis
                            )
                              .map(([key, value]) => `${key}: ${value}`)
                              .join("\n\n")
                          : "No disponible"}
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </CriterioAccordionHeader>

              {/* REFLEXIÓN - Nuevo en 2C */}
              <CriterioAccordionHeader
                value="reflexion"
                icon={CheckCircle}
                iconBgColor="bg-indigo-500"
                title="5. Reflexión"
                subtitle="Mecanismos de mejora continua"
                currentScore={step2Data.reflexion?.indicador_5_1?.puntaje || 0}
                maxScore={10}
              >
                <AccordionContent className="px-4 pb-4">
                  {/* Indicador 5.1 */}
                  <div className="mb-4 p-4 bg-indigo-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-indigo-900">
                        5.1 Espacios de Reflexión
                      </h4>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {step2Data.reflexion?.indicador_5_1?.puntaje || 0} /
                          10 pts
                        </Badge>
                        <Badge className="bg-purple-500">
                          {step2Data.reflexion?.indicador_5_1?.nivel}
                        </Badge>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded text-sm">
                      <p className="font-semibold mb-2">Análisis:</p>
                      <div className="whitespace-pre-wrap text-gray-700">
                        {typeof step2Data.reflexion?.indicador_5_1?.analisis ===
                        "string"
                          ? step2Data.reflexion?.indicador_5_1?.analisis
                          : typeof step2Data.reflexion?.indicador_5_1
                              ?.analisis === "object" &&
                            step2Data.reflexion?.indicador_5_1?.analisis !==
                              null
                          ? Object.entries(
                              step2Data.reflexion.indicador_5_1.analisis
                            )
                              .map(([key, value]) => `${key}: ${value}`)
                              .join("\n\n")
                          : "No disponible"}
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </CriterioAccordionHeader>

              {/* SOSTENIBILIDAD */}
              <CriterioAccordionHeader
                value="sostenibilidad"
                icon={CheckCircle}
                iconBgColor="bg-teal-500"
                title="6. Sostenibilidad"
                subtitle="Viabilidad y recursos"
                currentScore={
                  (step2Data.sostenibilidad?.indicador_6_1?.puntaje || 0) +
                  (step2Data.sostenibilidad?.indicador_6_2?.puntaje || 0)
                }
                maxScore={15}
              >
                <AccordionContent className="px-4 pb-4">
                  {/* Indicador 5.1 */}
                  <div className="mb-4 p-4 bg-teal-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-teal-900">
                        6.1 Estrategias de Viabilidad
                      </h4>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {step2Data.sostenibilidad?.indicador_6_1?.puntaje ||
                            0}{" "}
                          / 5 pts
                        </Badge>
                        <Badge className="bg-purple-500">
                          {step2Data.sostenibilidad?.indicador_6_1?.nivel}
                        </Badge>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded text-sm">
                      <p className="font-semibold mb-2">Análisis:</p>
                      <div className="whitespace-pre-wrap text-gray-700">
                        {typeof step2Data.sostenibilidad?.indicador_6_1
                          ?.analisis === "string"
                          ? step2Data.sostenibilidad?.indicador_6_1?.analisis
                          : typeof step2Data.sostenibilidad?.indicador_6_1
                              ?.analisis === "object" &&
                            step2Data.sostenibilidad?.indicador_6_1
                              ?.analisis !== null
                          ? Object.entries(
                              step2Data.sostenibilidad.indicador_6_1.analisis
                            )
                              .map(([key, value]) => `${key}: ${value}`)
                              .join("\n\n")
                          : "No disponible"}
                      </div>
                    </div>
                  </div>

                  {/* Indicador 6.2 */}
                  <div className="mb-4 p-4 bg-teal-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-teal-900">
                        6.2 Pertinencia de Bienes y Servicios
                      </h4>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {step2Data.sostenibilidad?.indicador_6_2?.puntaje ||
                            0}{" "}
                          / 10 pts
                        </Badge>
                        <Badge className="bg-purple-500">
                          {step2Data.sostenibilidad?.indicador_6_2?.nivel}
                        </Badge>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded text-sm">
                      <p className="font-semibold mb-2">Análisis:</p>
                      <div className="whitespace-pre-wrap text-gray-700">
                        {typeof step2Data.sostenibilidad?.indicador_6_2
                          ?.analisis === "string"
                          ? step2Data.sostenibilidad?.indicador_6_2?.analisis
                          : typeof step2Data.sostenibilidad?.indicador_6_2
                              ?.analisis === "object" &&
                            step2Data.sostenibilidad?.indicador_6_2
                              ?.analisis !== null
                          ? Object.entries(
                              step2Data.sostenibilidad.indicador_6_2.analisis
                            )
                              .map(([key, value]) => `${key}: ${value}`)
                              .join("\n\n")
                          : "No disponible"}
                      </div>
                    </div>
                  </div>

                  {step2Data.sostenibilidad?.observacion_final && (
                    <div className="mt-4 p-3 bg-teal-100 rounded-lg">
                      <p className="font-semibold mb-1">Observación Final:</p>
                      <p className="text-gray-700">
                        {step2Data.sostenibilidad.observacion_final}
                      </p>
                    </div>
                  )}
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
        case "pertinencia":
          return (
            (step2Data.pertinencia?.indicador_3_1?.puntaje || 0) +
              (step2Data.pertinencia?.indicador_3_2?.puntaje || 0) ===
            maxScore
          );
        case "participacion":
          return (
            (step2Data.participacion?.indicador_4_1?.puntaje || 0) === maxScore
          );
        case "reflexion":
          return (
            (step2Data.reflexion?.indicador_5_1?.puntaje || 0) === maxScore
          );
        case "sostenibilidad":
          return (
            (step2Data.sostenibilidad?.indicador_6_1?.puntaje || 0) +
              (step2Data.sostenibilidad?.indicador_6_2?.puntaje || 0) ===
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
        maxScore: 25,
        icon: Sparkles,
        color: "green",
      },
      {
        key: "pertinencia",
        name: "Pertinencia",
        maxScore: 15,
        icon: Lightbulb,
        color: "purple",
      },
      {
        key: "participacion",
        name: "Participación",
        maxScore: 10,
        icon: CheckCircle,
        color: "orange",
      },
      {
        key: "reflexion",
        name: "Reflexión",
        maxScore: 10,
        icon: Lightbulb,
        color: "indigo",
      },
      {
        key: "sostenibilidad",
        name: "Sostenibilidad",
        maxScore: 15,
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
                            : criterio.key === "pertinencia" &&
                              step2Data?.pertinencia
                            ? (step2Data.pertinencia.indicador_3_1?.puntaje ||
                                0) +
                              (step2Data.pertinencia.indicador_3_2?.puntaje ||
                                0)
                            : criterio.key === "participacion" &&
                              step2Data?.participacion
                            ? step2Data.participacion.indicador_4_1?.puntaje ||
                              0
                            : criterio.key === "reflexion" &&
                              step2Data?.reflexion
                            ? step2Data.reflexion.indicador_5_1?.puntaje || 0
                            : criterio.key === "sostenibilidad" &&
                              step2Data?.sostenibilidad
                            ? (step2Data.sostenibilidad.indicador_6_1
                                ?.puntaje || 0) +
                              (step2Data.sostenibilidad.indicador_6_2
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

    const generateDOCX = async () => {
      if (!improvedResponses || !proyecto) {
        toast({
          title: "❌ Error",
          description: "No hay respuestas mejoradas para generar el documento",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "🔄 Generando documento Word...",
        description: "Preparando el documento para descarga",
      });

      try {
        // Crear documento DOCX
        const doc = new Document({
          sections: [
            {
              properties: {},
              children: [
                // PORTADA
                new Paragraph({
                  text: "CNPIE 2026 - Anexo 2B",
                  heading: HeadingLevel.TITLE,
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 200 },
                }),
                new Paragraph({
                  text: "Respuestas Mejoradas por IA",
                  heading: HeadingLevel.HEADING_2,
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 400 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Fecha: ${new Date().toLocaleDateString("es-ES")}`,
                      size: 20,
                    }),
                  ],
                  spacing: { after: 400 },
                }),

                // 1. INTENCIONALIDAD
                new Paragraph({
                  text: "1. INTENCIONALIDAD",
                  heading: HeadingLevel.HEADING_1,
                  spacing: { before: 400, after: 200 },
                }),
                new Paragraph({
                  text: "1.1 Caracterización del Problema",
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 200, after: 100 },
                }),
                new Paragraph({
                  text:
                    improvedResponses.intencionalidad?.respuesta_1_1 ||
                    "(Sin respuesta)",
                  spacing: { after: 200 },
                }),
                new Paragraph({
                  text: "1.2 Objetivos del Proyecto",
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 200, after: 100 },
                }),
                new Paragraph({
                  text:
                    improvedResponses.intencionalidad?.respuesta_1_2 ||
                    "(Sin respuesta)",
                  spacing: { after: 300 },
                }),

                // 2. ORIGINALIDAD
                new Paragraph({
                  text: "2. ORIGINALIDAD",
                  heading: HeadingLevel.HEADING_1,
                  spacing: { before: 400, after: 200 },
                }),
                new Paragraph({
                  text: "2.1 Metodología o Estrategia",
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 200, after: 100 },
                }),
                new Paragraph({
                  text:
                    improvedResponses.originalidad?.respuesta_2_1 ||
                    "(Sin respuesta)",
                  spacing: { after: 200 },
                }),
                new Paragraph({
                  text: "2.2 Procedimiento Metodológico",
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 200, after: 100 },
                }),
                new Paragraph({
                  text:
                    improvedResponses.originalidad?.respuesta_2_2 ||
                    "(Sin respuesta)",
                  spacing: { after: 300 },
                }),

                // 3. PERTINENCIA (Solo en 2B)
                new Paragraph({
                  text: "3. PERTINENCIA",
                  heading: HeadingLevel.HEADING_1,
                  spacing: { before: 400, after: 200 },
                }),
                new Paragraph({
                  text: "3.1 Intereses y Necesidades",
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 200, after: 100 },
                }),
                new Paragraph({
                  text:
                    improvedResponses.pertinencia?.respuesta_3_1 ||
                    "(Sin respuesta)",
                  spacing: { after: 200 },
                }),
                new Paragraph({
                  text: "3.2 Adaptación al Contexto",
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 200, after: 100 },
                }),
                new Paragraph({
                  text:
                    improvedResponses.pertinencia?.respuesta_3_2 ||
                    "(Sin respuesta)",
                  spacing: { after: 300 },
                }),

                // 4. IMPACTO
                new Paragraph({
                  text: "4. IMPACTO",
                  heading: HeadingLevel.HEADING_1,
                  spacing: { before: 400, after: 200 },
                }),
                new Paragraph({
                  text: "4.1 Actores y Roles",
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 200, after: 100 },
                }),
                new Paragraph({
                  text:
                    improvedResponses.participacion?.respuesta_4_1 ||
                    "(Sin respuesta)",
                  spacing: { after: 300 },
                }),

                // 5. REFLEXIÓN
                new Paragraph({
                  text: "5. REFLEXIÓN",
                  heading: HeadingLevel.HEADING_1,
                  spacing: { before: 400, after: 200 },
                }),
                new Paragraph({
                  text: "5.1 Mecanismos de Reflexión",
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 200, after: 100 },
                }),
                new Paragraph({
                  text:
                    improvedResponses.reflexion?.respuesta_5_1 ||
                    "(Sin respuesta)",
                  spacing: { after: 300 },
                }),

                // 6. SOSTENIBILIDAD
                new Paragraph({
                  text: "6. SOSTENIBILIDAD",
                  heading: HeadingLevel.HEADING_1,
                  spacing: { before: 400, after: 200 },
                }),
                new Paragraph({
                  text: "6.1 Estrategias de Viabilidad",
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 200, after: 100 },
                }),
                new Paragraph({
                  text:
                    improvedResponses.sostenibilidad?.respuesta_6_1 ||
                    "(Sin respuesta)",
                  spacing: { after: 200 },
                }),
                new Paragraph({
                  text: "6.2 Pertinencia de Bienes y Servicios",
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 200, after: 100 },
                }),
                new Paragraph({
                  text:
                    improvedResponses.sostenibilidad?.respuesta_6_2 ||
                    "(Sin respuesta)",
                  spacing: { after: 300 },
                }),

                // PIE DE PÁGINA
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Generado por Agua Segura - Guía Andina",
                      size: 16,
                      italics: true,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 400 },
                }),
              ],
            },
          ],
        });

        // Generar y descargar el archivo
        const blob = await Packer.toBlob(doc);
        const fileName = `CNPIE_2B_${proyecto.id.replace(
          /[^a-z0-9]/gi,
          "_"
        )}_${new Date().getTime()}.docx`;
        saveAs(blob, fileName);

        toast({
          title: "✅ Documento generado",
          description: "El archivo Word se ha descargado correctamente",
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
      pertinencia: {
        respuesta_original_3_1:
          step1Data?.pertinencia?.intereses_necesidades || "",
        nueva_respuesta_3_1: step3Answers?.pertinencia?.respuesta_1 || "",
        respuesta_original_3_2: step1Data?.pertinencia?.contexto_cultural || "",
        nueva_respuesta_3_2: step3Answers?.pertinencia?.respuesta_2 || "",
      },
      participacion: {
        respuesta_original_4_1: step1Data?.participacion?.actores_roles || "",
        nueva_respuesta_4_1: step3Answers?.participacion?.respuesta_1 || "",
      },
      reflexion: {
        respuesta_original_5_1:
          step1Data?.reflexion?.mecanismos_reflexion || "",
        nueva_respuesta_5_1: step3Answers?.reflexion?.respuesta_1 || "",
      },
      sostenibilidad: {
        respuesta_original_6_1:
          step1Data?.sostenibilidad?.estrategias_viabilidad || "",
        nueva_respuesta_6_1: step3Answers?.sostenibilidad?.respuesta_1 || "",
        respuesta_original_6_2:
          step1Data?.sostenibilidad?.bienes_servicios
            ?.map((b) => b.descripcion_utilidad)
            .join(", ") || "",
        nueva_respuesta_6_2: step3Answers?.sostenibilidad?.respuesta_2 || "",
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
                onClick={generateDOCX}
                size="lg"
                className="gap-2"
                variant="default"
              >
                <Download className="w-5 h-5" />
                Descargar Word
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-8">
            {/* Respuestas Mejoradas por la IA */}
            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200 pt-10">
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

                {/* 4.1 */}
                <Card className="bg-white">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">
                        🔹 4.1 Actores y Roles
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          copyToClipboard(
                            improvedResponses.participacion?.respuesta_4_1 ||
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
                      {improvedResponses.participacion?.respuesta_4_1}
                    </p>
                  </CardContent>
                </Card>

                {/* 5.1 */}
                <Card className="bg-white">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">
                        🔹 5.1 Mecanismos de Reflexión
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          copyToClipboard(
                            improvedResponses.reflexion?.respuesta_5_1 || "",
                            "Respuesta 5.1"
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
                      {improvedResponses.reflexion?.respuesta_5_1}
                    </p>
                  </CardContent>
                </Card>

                {/* 6.1 */}
                <Card className="bg-white">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">
                        🔹 6.1 Continuidad
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          copyToClipboard(
                            improvedResponses.sostenibilidad?.respuesta_6_1 ||
                              "",
                            "Respuesta 6.1"
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
                      {improvedResponses.sostenibilidad?.respuesta_6_1}
                    </p>
                  </CardContent>
                </Card>

                {/* 6.2 */}
                <Card className="bg-white">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">
                        🔹 6.2 Viabilidad
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          copyToClipboard(
                            improvedResponses.sostenibilidad?.respuesta_6_2 ||
                              "",
                            "Respuesta 6.2"
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
                      {improvedResponses.sostenibilidad?.respuesta_6_2}
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
                rubricaSostenibilidad,
              ].filter(
                (r): r is NonNullable<typeof r> => r !== null && r !== undefined
              )}
              destacarCriterios={[
                "Intencionalidad",
                "Originalidad",
                "Pertinencia",
                "Participación",
                "Reflexión",
                "Sostenibilidad",
              ]}
            />
          </div>
        </div>
      </div>
    </CNPIEAcceleratorLayout>
  );
}
