import { useState, useEffect, useCallback, useRef } from "react";
import { useCNPIEProject } from "@/hooks/useCNPIEProject";
import { useCNPIERubric } from "@/hooks/useCNPIERubric";
import { useCNPIEAutoSave, formatLastSaved } from "@/hooks/useCNPIEAutoSave";
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
  CheckCircle2,
  Download,
  Sparkles,
  MessageSquare,
  FileText,
  Upload,
  Link as LinkIcon,
  Loader2,
  Save,
  Clock,
  Users,
  Cloud,
  CloudOff,
} from "lucide-react";
import { DocumentFieldSchema } from "@/types/document-extraction";
import {
  BienServicio,
  ANEXO_2D_LIMITS,
  ITEMS_FICHA_2D,
  FormDataStep1_2D,
  AnalysisStep2_2D,
  FormDataStep3_2D,
  FinalAnalysisStep4_2D,
} from "@/types/cnpie";

// Alias para mantener compatibilidad con el código existente
type FormDataStep1 = FormDataStep1_2D;
type AnalysisStep2 = AnalysisStep2_2D;
type FormDataStep3 = FormDataStep3_2D;
type FinalAnalysisStep4 = FinalAnalysisStep4_2D;

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

export default function Etapa1Acelerador12d() {
  const {
    proyecto,
    saveAcceleratorData,
    validateAccelerator,
    getAcceleratorData,
    getAllData,
  } = useCNPIEProject("2D");

  const { rubricas, getCriterioByName } = useCNPIERubric("2D");
  const { toast } = useToast();

  const rubricaIntencionalidad = getCriterioByName("Intencionalidad");
  const rubricaParticipacion = getCriterioByName("Participación");
  const rubricaReflexion = getCriterioByName("Reflexión");
  const rubricaConsistencia = getCriterioByName("Consistencia");

  // Estado del paso actual y pasos completados
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Estados para cada paso
  const [step1Data, setStep1Data] = useState<FormDataStep1>({
    // CRITERIO 1: FORMULACIÓN DEL PROBLEMA Y OBJETIVO
    formulacion: {
      problema_causas_consecuencias: "",
      justificacion: "",
      preguntas_investigacion: "",
      objetivos: "",
    },

    // CRITERIO 2: PARTICIPACIÓN
    participacion: {
      actores_roles: "",
    },

    // CRITERIO 3: REFLEXIÓN
    reflexion: {
      estrategias_reflexion: "",
    },

    // CRITERIO 4: CONSISTENCIA
    consistencia: {
      procedimiento_metodologico: "",
      tecnicas_instrumentos: "",
      plan_acciones: [],
      bienes_servicios: [],
    },
  });

  const [step2Data, setStep2Data] = useState<AnalysisStep2 | null>(null);
  const [step3Data, setStep3Data] = useState<FormDataStep3 | null>(null);
  const [step4Data, setStep4Data] = useState<FinalAnalysisStep4 | null>(null);
  const [improvedResponses, setImprovedResponses] = useState<FinalAnalysisStep4 | null>(null);

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

  // Función para migrar datos antiguos a la nueva estructura (2D no necesita migración)
  const migrateOldDataStructure = (
    oldData: Partial<FormDataStep1_2D> & Record<string, unknown>
  ): FormDataStep1_2D => {
    // Si ya tiene la estructura 2D, retornar tal cual
    if (
      oldData.formulacion &&
      oldData.participacion &&
      oldData.reflexion &&
      oldData.consistencia
    ) {
      return oldData as FormDataStep1_2D;
    }

    // Si no, retornar estructura vacía por defecto
    return {
      formulacion: {
        problema_causas_consecuencias: "",
        justificacion: "",
        preguntas_investigacion: "",
        objetivos: "",
      },
      participacion: {
        actores_roles: "",
      },
      reflexion: {
        estrategias_reflexion: "",
      },
      consistencia: {
        procedimiento_metodologico: "",
        tecnicas_instrumentos: "",
        plan_acciones: [],
        bienes_servicios: [],
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
        // Si ya tiene resultado final, mostrar paso 4 directamente
        setCurrentStep(4);
      }

      // Actualizar completed_steps con los pasos auto-detectados
      setCompletedSteps(autoCompletedSteps);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyecto?.id]);

  // Guardar datos
  const handleSave = useCallback(async () => {
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
  }, [currentStep, completedSteps, step1Data, step2Data, step3Data, step4Data, generatedQuestions, step3Answers, improvedResponses, saveAcceleratorData]);

  // Auto-guardado con debounce
  const { debouncedSave, isSaving: isAutoSaving, lastSaved } = useCNPIEAutoSave({
    onSave: handleSave,
    debounceMs: 3000,
    enabled: !!proyecto?.id,
  });

  // Trigger auto-save on data changes
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (proyecto?.id) {
      debouncedSave();
    }
  }, [step1Data, step2Data, step3Data, step4Data, generatedQuestions, step3Answers, improvedResponses, currentStep, completedSteps]);

  const handleValidate = async () => {
    await handleSave();
    return await validateAccelerator(1, 1);
  };

  // Validar si se puede avanzar
  const canProceedToStep2 = () => {
    return (
      step1Data.formulacion.problema_causas_consecuencias.trim().length > 0 &&
      step1Data.formulacion.justificacion.trim().length > 0 &&
      step1Data.formulacion.preguntas_investigacion.trim().length > 0 &&
      step1Data.formulacion.objetivos.trim().length > 0 &&
      step1Data.participacion.actores_roles.trim().length > 0 &&
      step1Data.reflexion.estrategias_reflexion.trim().length > 0 &&
      step1Data.consistencia.procedimiento_metodologico.trim().length > 0 &&
      step1Data.consistencia.tecnicas_instrumentos.trim().length > 0
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
      const apiPromise = supabase.functions.invoke("analyze-cnpie-general-2d", {
        body: step1Data,
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

        // La edge function ya devuelve la estructura correcta
        const analysis = data.analysis;

        // Transformar a estructura plana esperada por el componente
        const transformedData = {
          formulacion: {
            indicador_1_1: {
              puntaje: analysis.formulacion?.indicador_1_1?.puntaje || 0,
              nivel: analysis.formulacion?.indicador_1_1?.nivel || "N/A",
              analisis: analysis.formulacion?.indicador_1_1?.justificacion || analysis.formulacion?.indicador_1_1?.analisis_problema || "",
            },
            indicador_1_2: {
              puntaje: analysis.formulacion?.indicador_1_2?.puntaje || 0,
              nivel: analysis.formulacion?.indicador_1_2?.nivel || "N/A",
              analisis: analysis.formulacion?.indicador_1_2?.justificacion || analysis.formulacion?.indicador_1_2?.analisis_justificacion || "",
            },
            indicador_1_3: {
              puntaje: analysis.formulacion?.indicador_1_3?.puntaje || 0,
              nivel: analysis.formulacion?.indicador_1_3?.nivel || "N/A",
              analisis: analysis.formulacion?.indicador_1_3?.justificacion || analysis.formulacion?.indicador_1_3?.analisis_preguntas || "",
            },
            indicador_1_4: {
              puntaje: analysis.formulacion?.indicador_1_4?.puntaje || 0,
              nivel: analysis.formulacion?.indicador_1_4?.nivel || "N/A",
              analisis: analysis.formulacion?.indicador_1_4?.justificacion || "",
            },
            fortalezas: analysis.formulacion?.fortalezas || [],
            areas_mejora: analysis.formulacion?.areas_mejora || [],
            recomendaciones: analysis.formulacion?.recomendaciones || [],
          },
          participacion: {
            indicador_2_1: {
              puntaje: analysis.participacion?.indicador_2_1?.puntaje || 0,
              nivel: analysis.participacion?.indicador_2_1?.nivel || "N/A",
              analisis: analysis.participacion?.indicador_2_1?.analisis || "",
            },
            fortalezas: analysis.participacion?.fortalezas || [],
            areas_mejora: analysis.participacion?.areas_mejora || [],
          },
          reflexion: {
            indicador_3_1: {
              puntaje: analysis.reflexion?.indicador_3_1?.puntaje || 0,
              nivel: analysis.reflexion?.indicador_3_1?.nivel || "N/A",
              analisis: analysis.reflexion?.indicador_3_1?.analisis || "",
            },
            fortalezas: analysis.reflexion?.fortalezas || [],
            areas_mejora: analysis.reflexion?.areas_mejora || [],
          },
          consistencia: {
            indicador_4_1: {
              puntaje: analysis.consistencia?.indicador_4_1?.puntaje || 0,
              nivel: analysis.consistencia?.indicador_4_1?.nivel || "N/A",
              analisis: analysis.consistencia?.indicador_4_1?.analisis || "",
            },
            indicador_4_2: {
              puntaje: analysis.consistencia?.indicador_4_2?.puntaje || 0,
              nivel: analysis.consistencia?.indicador_4_2?.nivel || "N/A",
              analisis: analysis.consistencia?.indicador_4_2?.analisis || "",
            },
            indicador_4_3: {
              puntaje: analysis.consistencia?.indicador_4_3?.puntaje || 0,
              nivel: analysis.consistencia?.indicador_4_3?.nivel || "N/A",
              analisis: analysis.consistencia?.indicador_4_3?.analisis || "",
            },
            indicador_4_4: {
              puntaje: analysis.consistencia?.indicador_4_4?.puntaje || 0,
              nivel: analysis.consistencia?.indicador_4_4?.nivel || "N/A",
              analisis: analysis.consistencia?.indicador_4_4?.analisis || "",
            },
            fortalezas: analysis.consistencia?.fortalezas || [],
            areas_mejora: analysis.consistencia?.areas_mejora || [],
          },
          puntaje_total: analysis.puntaje_total || 0,
          puntaje_maximo: analysis.puntaje_maximo || 100,
          timestamp: analysis.timestamp || new Date().toISOString(),
        };

        const puntajeTotal = transformedData.puntaje_total;

        console.log("🔵 Puntaje total calculado:", puntajeTotal);

        setStep2Data(transformedData);

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
          description: `Tu proyecto obtuvo ${puntajeTotal} puntos de 100 posibles. Revisa los detalles por criterio.`,
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
      // Crear objeto combinado separado por secciones (2D: Formulación, Participación, Reflexión, Consistencia)
      const combinedData = {
        formulacion: {
          respuesta_original_1_1:
            step1Data.formulacion.problema_causas_consecuencias || "",
          nueva_respuesta_1_1: step3Answers.formulacion?.respuesta_1 || "",
          respuesta_original_1_2: step1Data.formulacion.justificacion || "",
          nueva_respuesta_1_2: step3Answers.formulacion?.respuesta_2 || "",
          respuesta_original_1_3:
            step1Data.formulacion.preguntas_investigacion || "",
          nueva_respuesta_1_3: step3Answers.formulacion?.respuesta_3 || "",
          respuesta_original_1_4: step1Data.formulacion.objetivos || "",
          nueva_respuesta_1_4: step3Answers.formulacion?.respuesta_4 || "",
        },
        participacion: {
          respuesta_original_2_1: step1Data.participacion.actores_roles || "",
          nueva_respuesta_2_1: step3Answers.participacion?.respuesta_1 || "",
        },
        reflexion: {
          respuesta_original_3_1:
            step1Data.reflexion.estrategias_reflexion || "",
          nueva_respuesta_3_1: step3Answers.reflexion?.respuesta_1 || "",
        },
        consistencia: {
          respuesta_original_4_1:
            step1Data.consistencia.procedimiento_metodologico || "",
          nueva_respuesta_4_1: step3Answers.consistencia?.respuesta_1 || "",
          respuesta_original_4_2:
            step1Data.consistencia.tecnicas_instrumentos || "",
          nueva_respuesta_4_2: step3Answers.consistencia?.respuesta_2 || "",
          respuesta_original_4_3:
            step1Data.consistencia.plan_acciones
              ?.map((a) => `${a.objetivo}: ${a.acciones}`)
              .join(", ") || "",
          nueva_respuesta_4_3: step3Answers.consistencia?.respuesta_3 || "",
          respuesta_original_4_4:
            step1Data.consistencia.bienes_servicios
              ?.map((b) => `${b.denominacion}: ${b.descripcion_utilidad}`)
              .join(", ") || "",
          nueva_respuesta_4_4: step3Answers.consistencia?.respuesta_4 || "",
        },
        timestamp: new Date().toISOString(),
      };

      console.log("📦 OBJETO COMBINADO PARA IA (2D):");
      console.log("========================================");
      console.log("1. FORMULACIÓN:");
      console.log(
        "   Respuesta Original 1.1:",
        combinedData.formulacion.respuesta_original_1_1.substring(0, 100) +
          "..."
      );
      console.log(
        "   Nueva Respuesta 1.1:",
        combinedData.formulacion.nueva_respuesta_1_1
      );
      console.log(
        "   Respuesta Original 1.2:",
        combinedData.formulacion.respuesta_original_1_2.substring(0, 100) +
          "..."
      );
      console.log(
        "   Nueva Respuesta 1.2:",
        combinedData.formulacion.nueva_respuesta_1_2
      );
      console.log(
        "   Respuesta Original 1.3:",
        combinedData.formulacion.respuesta_original_1_3.substring(0, 100) +
          "..."
      );
      console.log(
        "   Nueva Respuesta 1.3:",
        combinedData.formulacion.nueva_respuesta_1_3
      );
      console.log(
        "   Respuesta Original 1.4:",
        combinedData.formulacion.respuesta_original_1_4.substring(0, 100) +
          "..."
      );
      console.log(
        "   Nueva Respuesta 1.4:",
        combinedData.formulacion.nueva_respuesta_1_4
      );
      console.log("\n2. PARTICIPACIÓN:");
      console.log(
        "   Respuesta Original 2.1:",
        combinedData.participacion.respuesta_original_2_1.substring(0, 100) +
          "..."
      );
      console.log(
        "   Nueva Respuesta 2.1:",
        combinedData.participacion.nueva_respuesta_2_1
      );
      console.log("\n3. REFLEXIÓN:");
      console.log(
        "   Respuesta Original 3.1:",
        combinedData.reflexion.respuesta_original_3_1.substring(0, 100) + "..."
      );
      console.log(
        "   Nueva Respuesta 3.1:",
        combinedData.reflexion.nueva_respuesta_3_1
      );
      console.log("\n4. CONSISTENCIA:");
      console.log(
        "   Respuesta Original 4.1:",
        combinedData.consistencia.respuesta_original_4_1.substring(0, 100) +
          "..."
      );
      console.log(
        "   Nueva Respuesta 4.1:",
        combinedData.consistencia.nueva_respuesta_4_1
      );
      console.log(
        "   Respuesta Original 4.2:",
        combinedData.consistencia.respuesta_original_4_2.substring(0, 100) +
          "..."
      );
      console.log(
        "   Nueva Respuesta 4.2:",
        combinedData.consistencia.nueva_respuesta_4_2
      );
      console.log(
        "   Respuesta Original 4.3:",
        combinedData.consistencia.respuesta_original_4_3.substring(0, 100) +
          "..."
      );
      console.log(
        "   Nueva Respuesta 4.3:",
        combinedData.consistencia.nueva_respuesta_4_3
      );
      console.log(
        "   Respuesta Original 4.4:",
        combinedData.consistencia.respuesta_original_4_4.substring(0, 100) +
          "..."
      );
      console.log(
        "   Nueva Respuesta 4.4:",
        combinedData.consistencia.nueva_respuesta_4_4
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
        "https://ihgfqdmcndcyzzsbliyp.supabase.co/functions/v1/sintetisador-cnpie-2D",
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
              {/* SECCIÓN 1: FORMULACIÓN DEL PROBLEMA Y OBJETIVO */}
              <AccordionItem value="item-1" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-base">
                      1. {ITEMS_FICHA_2D[0].titulo}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-6">
                  {/* Pregunta 1.1 */}
                  <QuestionCardWithTextarea
                    questionNumber={ITEMS_FICHA_2D[0].preguntas[0].numero}
                    questionText={ITEMS_FICHA_2D[0].preguntas[0].texto}
                    value={step1Data.formulacion.problema_causas_consecuencias}
                    onChange={(value) =>
                      setStep1Data({
                        ...step1Data,
                        formulacion: {
                          ...step1Data.formulacion,
                          problema_causas_consecuencias: value,
                        },
                      })
                    }
                    placeholder="Caracteriza el problema educativo que aborda tu investigación-acción..."
                    minHeight="min-h-[200px]"
                    maxLength={
                      ANEXO_2D_LIMITS.formulacion.problema_causas_consecuencias
                    }
                  />

                  {/* Pregunta 1.2 */}
                  <QuestionCardWithTextarea
                    questionNumber={ITEMS_FICHA_2D[0].preguntas[1].numero}
                    questionText={ITEMS_FICHA_2D[0].preguntas[1].texto}
                    value={step1Data.formulacion.justificacion}
                    onChange={(value) =>
                      setStep1Data({
                        ...step1Data,
                        formulacion: {
                          ...step1Data.formulacion,
                          justificacion: value,
                        },
                      })
                    }
                    placeholder="Justifica la importancia y relevancia de tu investigación-acción..."
                    minHeight="min-h-[120px]"
                    maxLength={ANEXO_2D_LIMITS.formulacion.justificacion}
                  />

                  {/* Pregunta 1.3 */}
                  <QuestionCardWithTextarea
                    questionNumber={ITEMS_FICHA_2D[0].preguntas[2].numero}
                    questionText={ITEMS_FICHA_2D[0].preguntas[2].texto}
                    value={step1Data.formulacion.preguntas_investigacion}
                    onChange={(value) =>
                      setStep1Data({
                        ...step1Data,
                        formulacion: {
                          ...step1Data.formulacion,
                          preguntas_investigacion: value,
                        },
                      })
                    }
                    placeholder="Plantea las preguntas de investigación..."
                    minHeight="min-h-[120px]"
                    maxLength={
                      ANEXO_2D_LIMITS.formulacion.preguntas_investigacion
                    }
                  />

                  {/* Pregunta 1.4 */}
                  <QuestionCardWithTextarea
                    questionNumber={ITEMS_FICHA_2D[0].preguntas[3].numero}
                    questionText={ITEMS_FICHA_2D[0].preguntas[3].texto}
                    value={step1Data.formulacion.objetivos}
                    onChange={(value) =>
                      setStep1Data({
                        ...step1Data,
                        formulacion: {
                          ...step1Data.formulacion,
                          objetivos: value,
                        },
                      })
                    }
                    placeholder="Describe los objetivos de tu investigación-acción..."
                    minHeight="min-h-[120px]"
                    maxLength={ANEXO_2D_LIMITS.formulacion.objetivos}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* SECCIÓN 2: PARTICIPACIÓN */}
              <AccordionItem value="item-2" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-base">
                      2. {ITEMS_FICHA_2D[1].titulo}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-6">
                  {/* Pregunta 2.1 */}
                  <QuestionCardWithTextarea
                    questionNumber={ITEMS_FICHA_2D[1].preguntas[0].numero}
                    questionText={ITEMS_FICHA_2D[1].preguntas[0].texto}
                    value={step1Data.participacion.actores_roles}
                    onChange={(value) =>
                      setStep1Data({
                        ...step1Data,
                        participacion: {
                          ...step1Data.participacion,
                          actores_roles: value,
                        },
                      })
                    }
                    placeholder="Describe cómo participaron los estudiantes y otros actores en la investigación-acción..."
                    minHeight="min-h-[150px]"
                    maxLength={ANEXO_2D_LIMITS.participacion.actores_roles}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* SECCIÓN 3: REFLEXIÓN */}
              <AccordionItem value="item-3" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-base">
                      3. {ITEMS_FICHA_2D[2].titulo}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-6">
                  {/* Pregunta 3.1 */}
                  <QuestionCardWithTextarea
                    questionNumber={ITEMS_FICHA_2D[2].preguntas[0].numero}
                    questionText={ITEMS_FICHA_2D[2].preguntas[0].texto}
                    value={step1Data.reflexion.estrategias_reflexion}
                    onChange={(value) =>
                      setStep1Data({
                        ...step1Data,
                        reflexion: {
                          ...step1Data.reflexion,
                          estrategias_reflexion: value,
                        },
                      })
                    }
                    placeholder="Describe las estrategias de reflexión utilizadas en tu investigación-acción..."
                    minHeight="min-h-[150px]"
                    maxLength={ANEXO_2D_LIMITS.reflexion.estrategias_reflexion}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* SECCIÓN 4: CONSISTENCIA */}
              <AccordionItem value="item-4" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-base">
                      4. {ITEMS_FICHA_2D[3].titulo}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-6">
                  {/* Pregunta 4.1 */}
                  <QuestionCardWithTextarea
                    questionNumber={ITEMS_FICHA_2D[3].preguntas[0].numero}
                    questionText={ITEMS_FICHA_2D[3].preguntas[0].texto}
                    value={step1Data.consistencia.procedimiento_metodologico}
                    onChange={(value) =>
                      setStep1Data({
                        ...step1Data,
                        consistencia: {
                          ...step1Data.consistencia,
                          procedimiento_metodologico: value,
                        },
                      })
                    }
                    placeholder="Describe el procedimiento metodológico de tu investigación-acción..."
                    minHeight="min-h-[200px]"
                    maxLength={
                      ANEXO_2D_LIMITS.consistencia.procedimiento_metodologico
                    }
                  />

                  {/* Pregunta 4.2 */}
                  <QuestionCardWithTextarea
                    questionNumber={ITEMS_FICHA_2D[3].preguntas[1].numero}
                    questionText={ITEMS_FICHA_2D[3].preguntas[1].texto}
                    value={step1Data.consistencia.tecnicas_instrumentos}
                    onChange={(value) =>
                      setStep1Data({
                        ...step1Data,
                        consistencia: {
                          ...step1Data.consistencia,
                          tecnicas_instrumentos: value,
                        },
                      })
                    }
                    placeholder="Describe las técnicas e instrumentos utilizados..."
                    minHeight="min-h-[150px]"
                    maxLength={
                      ANEXO_2D_LIMITS.consistencia.tecnicas_instrumentos
                    }
                  />

                  {/* Pregunta 4.3: Matriz de Acciones */}
                  <div className="space-y-4">
                    <Card className="bg-amber-50 border-amber-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-amber-900">
                          Pregunta {ITEMS_FICHA_2D[3].preguntas[2].numero}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700">
                          {ITEMS_FICHA_2D[3].preguntas[2].texto}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Tabla de plan de acciones */}
                    <div className="space-y-3">
                      <div className="border rounded-lg overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-blue-500 text-white text-xs">
                              <th className="p-2 text-left border-r border-blue-400 min-w-[150px]">
                                Objetivo
                              </th>
                              <th className="p-2 text-left border-r border-blue-400 min-w-[200px]">
                                Acciones
                              </th>
                              <th className="p-2 text-left border-r border-blue-400 min-w-[150px]">
                                Recursos
                              </th>
                              <th className="p-2 text-left border-r border-blue-400 min-w-[100px]">
                                Responsable
                              </th>
                              <th className="p-2 text-center border-r border-blue-400 min-w-[200px]">
                                Cronograma
                              </th>
                              <th className="p-2 w-10"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {step1Data.consistencia.plan_acciones.map(
                              (accion, index) => (
                                <tr
                                  key={index}
                                  className="border-b hover:bg-gray-50"
                                >
                                  <td className="p-1 border-r">
                                    <Textarea
                                      value={accion.objetivo}
                                      onChange={(e) => {
                                        const newAcciones = [
                                          ...step1Data.consistencia
                                            .plan_acciones,
                                        ];
                                        newAcciones[index].objetivo =
                                          e.target.value;
                                        setStep1Data({
                                          ...step1Data,
                                          consistencia: {
                                            ...step1Data.consistencia,
                                            plan_acciones: newAcciones,
                                          },
                                        });
                                      }}
                                      placeholder="Objetivo..."
                                      className="text-xs min-h-[60px] resize-none border-0 focus-visible:ring-1"
                                    />
                                  </td>
                                  <td className="p-1 border-r">
                                    <Textarea
                                      value={accion.acciones}
                                      onChange={(e) => {
                                        const newAcciones = [
                                          ...step1Data.consistencia
                                            .plan_acciones,
                                        ];
                                        newAcciones[index].acciones =
                                          e.target.value;
                                        setStep1Data({
                                          ...step1Data,
                                          consistencia: {
                                            ...step1Data.consistencia,
                                            plan_acciones: newAcciones,
                                          },
                                        });
                                      }}
                                      placeholder="Acciones..."
                                      className="text-xs min-h-[60px] resize-none border-0 focus-visible:ring-1"
                                    />
                                  </td>
                                  <td className="p-1 border-r">
                                    <Textarea
                                      value={accion.recursos}
                                      onChange={(e) => {
                                        const newAcciones = [
                                          ...step1Data.consistencia
                                            .plan_acciones,
                                        ];
                                        newAcciones[index].recursos =
                                          e.target.value;
                                        setStep1Data({
                                          ...step1Data,
                                          consistencia: {
                                            ...step1Data.consistencia,
                                            plan_acciones: newAcciones,
                                          },
                                        });
                                      }}
                                      placeholder="Recursos..."
                                      className="text-xs min-h-[60px] resize-none border-0 focus-visible:ring-1"
                                    />
                                  </td>
                                  <td className="p-1 border-r">
                                    <Input
                                      value={accion.responsable}
                                      onChange={(e) => {
                                        const newAcciones = [
                                          ...step1Data.consistencia
                                            .plan_acciones,
                                        ];
                                        newAcciones[index].responsable =
                                          e.target.value;
                                        setStep1Data({
                                          ...step1Data,
                                          consistencia: {
                                            ...step1Data.consistencia,
                                            plan_acciones: newAcciones,
                                          },
                                        });
                                      }}
                                      placeholder="Responsable"
                                      className="text-xs h-8 border-0 focus-visible:ring-1"
                                    />
                                  </td>
                                  <td className="p-1 border-r">
                                    <div className="flex gap-1 justify-center flex-wrap">
                                      {[
                                        "M",
                                        "A",
                                        "M2",
                                        "J",
                                        "J2",
                                        "A2",
                                        "S",
                                        "O",
                                        "N",
                                        "D",
                                      ].map((mes) => (
                                        <label
                                          key={mes}
                                          className="flex items-center gap-1 cursor-pointer"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={
                                              accion.cronograma[
                                                mes as keyof typeof accion.cronograma
                                              ]
                                            }
                                            onChange={(e) => {
                                              const newAcciones = [
                                                ...step1Data.consistencia
                                                  .plan_acciones,
                                              ];
                                              newAcciones[index].cronograma[
                                                mes as keyof typeof accion.cronograma
                                              ] = e.target.checked;
                                              setStep1Data({
                                                ...step1Data,
                                                consistencia: {
                                                  ...step1Data.consistencia,
                                                  plan_acciones: newAcciones,
                                                },
                                              });
                                            }}
                                            className="w-3 h-3"
                                          />
                                          <span className="text-[10px]">
                                            {mes}
                                          </span>
                                        </label>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="p-1 text-center">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const newAcciones =
                                          step1Data.consistencia.plan_acciones.filter(
                                            (_, i) => i !== index
                                          );
                                        setStep1Data({
                                          ...step1Data,
                                          consistencia: {
                                            ...step1Data.consistencia,
                                            plan_acciones: newAcciones,
                                          },
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
                          setStep1Data({
                            ...step1Data,
                            consistencia: {
                              ...step1Data.consistencia,
                              plan_acciones: [
                                ...step1Data.consistencia.plan_acciones,
                                {
                                  objetivo: "",
                                  acciones: "",
                                  recursos: "",
                                  responsable: "",
                                  cronograma: {
                                    M: false,
                                    A: false,
                                    M2: false,
                                    J: false,
                                    J2: false,
                                    A2: false,
                                    S: false,
                                    O: false,
                                    N: false,
                                    D: false,
                                  },
                                },
                              ],
                            },
                          });
                        }}
                        className="w-full h-8"
                      >
                        + Agregar acción
                      </Button>
                    </div>
                  </div>

                  {/* Pregunta 4.4: Tabla de Bienes y Servicios */}
                  <div className="space-y-4">
                    <Card className="bg-amber-50 border-amber-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-amber-900">
                          Pregunta {ITEMS_FICHA_2D[3].preguntas[3].numero}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700">
                          {ITEMS_FICHA_2D[3].preguntas[3].texto}
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
                            {step1Data.consistencia.bienes_servicios.map(
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
                                          ...step1Data.consistencia
                                            .bienes_servicios,
                                        ];
                                        newBienes[index].componente =
                                          e.target.value;
                                        setStep1Data({
                                          ...step1Data,
                                          consistencia: {
                                            ...step1Data.consistencia,
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
                                          ...step1Data.consistencia
                                            .bienes_servicios,
                                        ];
                                        newBienes[index].denominacion =
                                          e.target.value;
                                        setStep1Data({
                                          ...step1Data,
                                          consistencia: {
                                            ...step1Data.consistencia,
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
                                          ...step1Data.consistencia
                                            .bienes_servicios,
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
                                          consistencia: {
                                            ...step1Data.consistencia,
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
                                          ...step1Data.consistencia
                                            .bienes_servicios,
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
                                          consistencia: {
                                            ...step1Data.consistencia,
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
                                          ...step1Data.consistencia
                                            .bienes_servicios,
                                        ];
                                        newBienes[index].descripcion_utilidad =
                                          e.target.value;
                                        setStep1Data({
                                          ...step1Data,
                                          consistencia: {
                                            ...step1Data.consistencia,
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
                                        const newBienes =
                                          step1Data.consistencia.bienes_servicios.filter(
                                            (_, i) => i !== index
                                          );
                                        setStep1Data({
                                          ...step1Data,
                                          consistencia: {
                                            ...step1Data.consistencia,
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
                            consistencia: {
                              ...step1Data.consistencia,
                              bienes_servicios: [
                                ...step1Data.consistencia.bienes_servicios,
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
                      {step1Data.consistencia.bienes_servicios.length > 0 && (
                        <div className="flex justify-end">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                            <span className="text-sm font-semibold">
                              Total General: S/{" "}
                              {step1Data.consistencia.bienes_servicios
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
                    <span className="text-2xl text-gray-500">/100</span>
                  </p>
                  <p className="text-sm text-gray-600 mt-2">Puntos obtenidos</p>
                </div>
              </div>
            </div>

            {/* Accordion con todos los criterios */}
            <Accordion type="multiple" className="w-full space-y-4">
              {/* FORMULACIÓN */}
              <CriterioAccordionHeader
                value="formulacion"
                icon={FileText}
                iconBgColor="bg-blue-500"
                title="1. Formulación del Problema y Objetivo"
                subtitle="Caracterización, justificación, preguntas y objetivos"
                currentScore={
                  (step2Data.formulacion?.indicador_1_1?.puntaje || 0) +
                  (step2Data.formulacion?.indicador_1_2?.puntaje || 0) +
                  (step2Data.formulacion?.indicador_1_3?.puntaje || 0) +
                  (step2Data.formulacion?.indicador_1_4?.puntaje || 0)
                }
                maxScore={40}
              >
                <AccordionContent className="px-4 pb-4">
                  {/* Indicador 1.1 */}
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-blue-900">
                        1.1 Problema y Causas/Consecuencias
                      </h4>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {step2Data.formulacion?.indicador_1_1?.puntaje || 0} /
                          10 pts
                        </Badge>
                        <Badge className="bg-purple-500">
                          {step2Data.formulacion?.indicador_1_1?.nivel}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="bg-white p-3 rounded">
                        <p className="font-semibold mb-1">Análisis:</p>
                        <p className="text-gray-700">
                          {step2Data.formulacion?.indicador_1_1?.analisis}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Indicador 1.2 */}
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-blue-900">
                        1.2 Justificación
                      </h4>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {step2Data.formulacion?.indicador_1_2?.puntaje || 0} /
                          10 pts
                        </Badge>
                        <Badge className="bg-purple-500">
                          {step2Data.formulacion?.indicador_1_2?.nivel}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="bg-white p-3 rounded">
                        <p className="font-semibold mb-1">Análisis:</p>
                        <p className="text-gray-700">
                          {step2Data.formulacion?.indicador_1_2?.analisis}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Indicador 1.3 */}
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-blue-900">
                        1.3 Preguntas de Investigación
                      </h4>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {step2Data.formulacion?.indicador_1_3?.puntaje || 0} /
                          10 pts
                        </Badge>
                        <Badge className="bg-purple-500">
                          {step2Data.formulacion?.indicador_1_3?.nivel}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="bg-white p-3 rounded">
                        <p className="font-semibold mb-1">Análisis:</p>
                        <p className="text-gray-700">
                          {step2Data.formulacion?.indicador_1_3?.analisis}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Indicador 1.4 */}
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-blue-900">
                        1.4 Objetivos
                      </h4>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {step2Data.formulacion?.indicador_1_4?.puntaje || 0} /
                          10 pts
                        </Badge>
                        <Badge className="bg-purple-500">
                          {step2Data.formulacion?.indicador_1_4?.nivel}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="bg-white p-3 rounded">
                        <p className="font-semibold mb-1">Análisis:</p>
                        <p className="text-gray-700">
                          {step2Data.formulacion?.indicador_1_4?.analisis}
                        </p>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </CriterioAccordionHeader>

              {/* PARTICIPACIÓN */}
              <CriterioAccordionHeader
                value="participacion"
                icon={Users}
                iconBgColor="bg-green-500"
                title="2. Participación"
                subtitle="Actores y roles en la investigación-acción"
                currentScore={
                  step2Data.participacion?.indicador_2_1?.puntaje || 0
                }
                maxScore={20}
              >
                <AccordionContent className="px-4 pb-4">
                  {/* Indicador 2.1 */}
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-green-900">
                        2.1 Actores y Roles
                      </h4>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {step2Data.participacion?.indicador_2_1?.puntaje || 0}{" "}
                          / 20 pts
                        </Badge>
                        <Badge className="bg-purple-500">
                          {step2Data.participacion?.indicador_2_1?.nivel}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="bg-white p-3 rounded">
                        <p className="font-semibold mb-1">Análisis:</p>
                        <p className="text-gray-700">
                          {step2Data.participacion?.indicador_2_1?.analisis}
                        </p>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </CriterioAccordionHeader>

              {/* REFLEXIÓN */}
              <CriterioAccordionHeader
                value="reflexion"
                icon={Lightbulb}
                iconBgColor="bg-purple-500"
                title="3. Reflexión"
                subtitle="Estrategias de reflexión en la investigación-acción"
                currentScore={step2Data.reflexion?.indicador_3_1?.puntaje || 0}
                maxScore={10}
              >
                <AccordionContent className="px-4 pb-4">
                  {/* Indicador 3.1 */}
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-purple-900">
                        3.1 Estrategias de Reflexión
                      </h4>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {step2Data.reflexion?.indicador_3_1?.puntaje || 0} /
                          10 pts
                        </Badge>
                        <Badge className="bg-purple-500">
                          {step2Data.reflexion?.indicador_3_1?.nivel}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="bg-white p-3 rounded">
                        <p className="font-semibold mb-1">Análisis:</p>
                        <p className="text-gray-700">
                          {step2Data.reflexion?.indicador_3_1?.analisis}
                        </p>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </CriterioAccordionHeader>

              {/* CONSISTENCIA */}
              <CriterioAccordionHeader
                value="consistencia"
                icon={CheckCircle2}
                iconBgColor="bg-orange-500"
                title="4. Consistencia"
                subtitle="Coherencia entre teoría, práctica y evidencia"
                currentScore={
                  (step2Data.consistencia?.indicador_4_1?.puntaje || 0) +
                  (step2Data.consistencia?.indicador_4_2?.puntaje || 0) +
                  (step2Data.consistencia?.indicador_4_3?.puntaje || 0) +
                  (step2Data.consistencia?.indicador_4_4?.puntaje || 0)
                }
                maxScore={30}
              >
                <AccordionContent className="px-4 pb-4">
                  {/* Indicador 4.1 */}
                  <div className="mb-4 p-4 bg-orange-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-orange-900">
                        4.1 Consistencia Teórica
                      </h4>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {step2Data.consistencia?.indicador_4_1?.puntaje || 0}{" "}
                          / 10 pts
                        </Badge>
                        <Badge className="bg-purple-500">
                          {step2Data.consistencia?.indicador_4_1?.nivel}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="bg-white p-3 rounded">
                        <p className="font-semibold mb-1">Análisis:</p>
                        <p className="text-gray-700">
                          {step2Data.consistencia?.indicador_4_1?.analisis}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Indicador 4.2 */}
                  <div className="mb-4 p-4 bg-orange-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-orange-900">
                        4.2 Consistencia Metodológica
                      </h4>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {step2Data.consistencia?.indicador_4_2?.puntaje || 0}{" "}
                          / 5 pts
                        </Badge>
                        <Badge className="bg-purple-500">
                          {step2Data.consistencia?.indicador_4_2?.nivel}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="bg-white p-3 rounded">
                        <p className="font-semibold mb-1">Análisis:</p>
                        <p className="text-gray-700">
                          {step2Data.consistencia?.indicador_4_2?.analisis}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Indicador 4.3 */}
                  <div className="mb-4 p-4 bg-orange-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-orange-900">
                        4.3 Consistencia Práctica
                      </h4>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {step2Data.consistencia?.indicador_4_3?.puntaje || 0}{" "}
                          / 10 pts
                        </Badge>
                        <Badge className="bg-purple-500">
                          {step2Data.consistencia?.indicador_4_3?.nivel}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="bg-white p-3 rounded">
                        <p className="font-semibold mb-1">Análisis:</p>
                        <p className="text-gray-700">
                          {step2Data.consistencia?.indicador_4_3?.analisis}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Indicador 4.4 */}
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-orange-900">
                        4.4 Consistencia Evidencial
                      </h4>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {step2Data.consistencia?.indicador_4_4?.puntaje || 0}{" "}
                          / 5 pts
                        </Badge>
                        <Badge className="bg-purple-500">
                          {step2Data.consistencia?.indicador_4_4?.nivel}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="bg-white p-3 rounded">
                        <p className="font-semibold mb-1">Análisis:</p>
                        <p className="text-gray-700">
                          {step2Data.consistencia?.indicador_4_4?.analisis}
                        </p>
                      </div>
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
        case "formulacion":
          return (
            (step2Data.formulacion?.indicador_1_1?.puntaje || 0) +
              (step2Data.formulacion?.indicador_1_2?.puntaje || 0) +
              (step2Data.formulacion?.indicador_1_3?.puntaje || 0) +
              (step2Data.formulacion?.indicador_1_4?.puntaje || 0) ===
            maxScore
          );
        case "participacion":
          return (
            (step2Data.participacion?.indicador_2_1?.puntaje || 0) === maxScore
          );
        case "reflexion":
          return (
            (step2Data.reflexion?.indicador_3_1?.puntaje || 0) === maxScore
          );
        case "consistencia":
          return (
            (step2Data.consistencia?.indicador_4_1?.puntaje || 0) +
              (step2Data.consistencia?.indicador_4_2?.puntaje || 0) +
              (step2Data.consistencia?.indicador_4_3?.puntaje || 0) +
              (step2Data.consistencia?.indicador_4_4?.puntaje || 0) ===
            maxScore
          );
        default:
          return false;
      }
    };

    const criterios = [
      {
        key: "formulacion",
        name: "Formulación",
        maxScore: 40,
        icon: Lightbulb,
        color: "blue",
      },
      {
        key: "participacion",
        name: "Participación",
        maxScore: 20,
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
        key: "consistencia",
        name: "Consistencia",
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
                          {criterio.key === "formulacion" &&
                          step2Data?.formulacion
                            ? (step2Data.formulacion.indicador_1_1?.puntaje ||
                                0) +
                              (step2Data.formulacion.indicador_1_2?.puntaje ||
                                0) +
                              (step2Data.formulacion.indicador_1_3?.puntaje ||
                                0) +
                              (step2Data.formulacion.indicador_1_4?.puntaje ||
                                0)
                            : criterio.key === "participacion" &&
                              step2Data?.participacion
                            ? step2Data.participacion.indicador_2_1?.puntaje ||
                              0
                            : criterio.key === "reflexion" &&
                              step2Data?.reflexion
                            ? step2Data.reflexion.indicador_3_1?.puntaje || 0
                            : criterio.key === "consistencia" &&
                              step2Data?.consistencia
                            ? (step2Data.consistencia.indicador_4_1?.puntaje ||
                                0) +
                              (step2Data.consistencia.indicador_4_2?.puntaje ||
                                0) +
                              (step2Data.consistencia.indicador_4_3?.puntaje ||
                                0) +
                              (step2Data.consistencia.indicador_4_4?.puntaje ||
                                0)
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
                  text: "CNPIE 2026 - Anexo 2D (IAPE)",
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

                // 1. FORMULACIÓN
                new Paragraph({
                  text: "1. FORMULACIÓN DEL PROBLEMA Y OBJETIVO",
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
                    improvedResponses.formulacion?.respuesta_1_1 ||
                    "(Sin respuesta)",
                  spacing: { after: 200 },
                }),
                new Paragraph({
                  text: "1.2 Justificación",
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 200, after: 100 },
                }),
                new Paragraph({
                  text:
                    improvedResponses.formulacion?.respuesta_1_2 ||
                    "(Sin respuesta)",
                  spacing: { after: 200 },
                }),
                new Paragraph({
                  text: "1.3 Preguntas de Investigación",
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 200, after: 100 },
                }),
                new Paragraph({
                  text:
                    improvedResponses.formulacion?.respuesta_1_3 ||
                    "(Sin respuesta)",
                  spacing: { after: 200 },
                }),
                new Paragraph({
                  text: "1.4 Objetivos",
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 200, after: 100 },
                }),
                new Paragraph({
                  text:
                    improvedResponses.formulacion?.respuesta_1_4 ||
                    "(Sin respuesta)",
                  spacing: { after: 300 },
                }),

                // 2. PARTICIPACIÓN
                new Paragraph({
                  text: "2. PARTICIPACIÓN",
                  heading: HeadingLevel.HEADING_1,
                  spacing: { before: 400, after: 200 },
                }),
                new Paragraph({
                  text: "2.1 Actores y Roles",
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 200, after: 100 },
                }),
                new Paragraph({
                  text:
                    improvedResponses.participacion?.respuesta_2_1 ||
                    "(Sin respuesta)",
                  spacing: { after: 300 },
                }),

                // 3. REFLEXIÓN
                new Paragraph({
                  text: "3. REFLEXIÓN",
                  heading: HeadingLevel.HEADING_1,
                  spacing: { before: 400, after: 200 },
                }),
                new Paragraph({
                  text: "3.1 Estrategias de Reflexión",
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 200, after: 100 },
                }),
                new Paragraph({
                  text:
                    improvedResponses.reflexion?.respuesta_3_1 ||
                    "(Sin respuesta)",
                  spacing: { after: 300 },
                }),

                // 4. CONSISTENCIA
                new Paragraph({
                  text: "4. CONSISTENCIA",
                  heading: HeadingLevel.HEADING_1,
                  spacing: { before: 400, after: 200 },
                }),
                new Paragraph({
                  text: "4.1 Procedimiento Metodológico",
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 200, after: 100 },
                }),
                new Paragraph({
                  text:
                    improvedResponses.consistencia?.respuesta_4_1 ||
                    "(Sin respuesta)",
                  spacing: { after: 200 },
                }),
                new Paragraph({
                  text: "4.2 Técnicas e Instrumentos",
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 200, after: 100 },
                }),
                new Paragraph({
                  text:
                    improvedResponses.consistencia?.respuesta_4_2 ||
                    "(Sin respuesta)",
                  spacing: { after: 200 },
                }),
                new Paragraph({
                  text: "4.3 Plan de Acciones",
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 200, after: 100 },
                }),
                new Paragraph({
                  text:
                    improvedResponses.consistencia?.respuesta_4_3 ||
                    "(Sin respuesta)",
                  spacing: { after: 200 },
                }),
                new Paragraph({
                  text: "4.4 Bienes y Servicios",
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 200, after: 100 },
                }),
                new Paragraph({
                  text:
                    improvedResponses.consistencia?.respuesta_4_4 ||
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
        const fileName = `CNPIE_2D_${proyecto.id.replace(
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

    // Reconstruir el objeto combinado para mostrar (estructura 2D)
    const combinedDataForDisplay = {
      formulacion: {
        respuesta_original_1_1:
          step1Data?.formulacion?.problema_causas_consecuencias || "",
        nueva_respuesta_1_1: step3Answers?.formulacion?.respuesta_1_1 || "",
        respuesta_original_1_2: step1Data?.formulacion?.justificacion || "",
        nueva_respuesta_1_2: step3Answers?.formulacion?.respuesta_1_2 || "",
        respuesta_original_1_3:
          step1Data?.formulacion?.preguntas_investigacion || "",
        nueva_respuesta_1_3: step3Answers?.formulacion?.respuesta_1_3 || "",
        respuesta_original_1_4: step1Data?.formulacion?.objetivos || "",
        nueva_respuesta_1_4: step3Answers?.formulacion?.respuesta_1_4 || "",
      },
      participacion: {
        respuesta_original_2_1: step1Data?.participacion?.actores_roles || "",
        nueva_respuesta_2_1: step3Answers?.participacion?.respuesta_2_1 || "",
      },
      reflexion: {
        respuesta_original_3_1:
          step1Data?.reflexion?.estrategias_reflexion || "",
        nueva_respuesta_3_1: step3Answers?.reflexion?.respuesta_3_1 || "",
      },
      consistencia: {
        respuesta_original_4_1:
          step1Data?.consistencia?.procedimiento_metodologico || "",
        nueva_respuesta_4_1: step3Answers?.consistencia?.respuesta_4_1 || "",
        respuesta_original_4_2:
          step1Data?.consistencia?.tecnicas_instrumentos || "",
        nueva_respuesta_4_2: step3Answers?.consistencia?.respuesta_4_2 || "",
        respuesta_original_4_3:
          step1Data?.consistencia?.plan_acciones
            ?.map((a) => `${a.objetivo}: ${a.acciones}`)
            .join(", ") || "",
        nueva_respuesta_4_3: step3Answers?.consistencia?.respuesta_4_3 || "",
        respuesta_original_4_4:
          step1Data?.consistencia?.bienes_servicios
            ?.map((b) => b.descripcion_utilidad)
            .join(", ") || "",
        nueva_respuesta_4_4: step3Answers?.consistencia?.respuesta_4_4 || "",
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
                {/* 1.1 Problema */}
                <Card className="bg-white">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">🔹 1.1 Problema de Investigación</CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          copyToClipboard(
                            improvedResponses?.formulacion?.respuesta_1_1 || "",
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
                      {improvedResponses?.formulacion?.respuesta_1_1}
                    </p>
                  </CardContent>
                </Card>

                {/* 1.2 Justificación */}
                <Card className="bg-white">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">🔹 1.2 Justificación</CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          copyToClipboard(
                            improvedResponses?.formulacion?.respuesta_1_2 || "",
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
                      {improvedResponses?.formulacion?.respuesta_1_2}
                    </p>
                  </CardContent>
                </Card>

                {/* 1.3 Preguntas de Investigación */}
                <Card className="bg-white">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">🔹 1.3 Preguntas de Investigación</CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          copyToClipboard(
                            improvedResponses?.formulacion?.respuesta_1_3 || "",
                            "Respuesta 1.3"
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
                      {improvedResponses?.formulacion?.respuesta_1_3}
                    </p>
                  </CardContent>
                </Card>

                {/* 1.4 Objetivos */}
                <Card className="bg-white">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">🔹 1.4 Objetivos</CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          copyToClipboard(
                            improvedResponses?.formulacion?.respuesta_1_4 || "",
                            "Respuesta 1.4"
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
                      {improvedResponses?.formulacion?.respuesta_1_4}
                    </p>
                  </CardContent>
                </Card>

                {/* 2.1 Participación */}
                <Card className="bg-white">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">🔹 2.1 Actores y Roles</CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          copyToClipboard(
                            improvedResponses?.participacion?.respuesta_2_1 || "",
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
                      {improvedResponses?.participacion?.respuesta_2_1}
                    </p>
                  </CardContent>
                </Card>

                {/* 3.1 Reflexión */}
                <Card className="bg-white">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">🔹 3.1 Estrategias de Reflexión</CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          copyToClipboard(
                            improvedResponses?.reflexion?.respuesta_3_1 || "",
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
                      {improvedResponses?.reflexion?.respuesta_3_1}
                    </p>
                  </CardContent>
                </Card>

                {/* 4.1 Procedimiento Metodológico */}
                <Card className="bg-white">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">🔹 4.1 Procedimiento Metodológico</CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          copyToClipboard(
                            improvedResponses?.consistencia?.respuesta_4_1 || "",
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
                      {improvedResponses?.consistencia?.respuesta_4_1}
                    </p>
                  </CardContent>
                </Card>

                {/* 4.2 Técnicas e Instrumentos */}
                <Card className="bg-white">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">🔹 4.2 Técnicas e Instrumentos</CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          copyToClipboard(
                            improvedResponses?.consistencia?.respuesta_4_2 || "",
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
                      {improvedResponses?.consistencia?.respuesta_4_2}
                    </p>
                  </CardContent>
                </Card>

                {/* 4.3 Plan de Acciones */}
                <Card className="bg-white">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">🔹 4.3 Plan de Acciones</CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          copyToClipboard(
                            improvedResponses?.consistencia?.respuesta_4_3 || "",
                            "Respuesta 4.3"
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
                      {improvedResponses?.consistencia?.respuesta_4_3}
                    </p>
                  </CardContent>
                </Card>

                {/* 4.4 Bienes y Servicios */}
                <Card className="bg-white">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">🔹 4.4 Bienes y Servicios</CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          copyToClipboard(
                            improvedResponses?.consistencia?.respuesta_4_4 || "",
                            "Respuesta 4.4"
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
                      {improvedResponses?.consistencia?.respuesta_4_4}
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
          {/* Auto-save indicator */}
          <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
            {isAutoSaving || saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : lastSaved ? (
              <>
                <Cloud className="h-4 w-4 text-green-500" />
                <span>{formatLastSaved(lastSaved)}</span>
              </>
            ) : (
              <>
                <CloudOff className="h-4 w-4" />
                <span>Auto-guardado activado</span>
              </>
            )}
          </div>
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
              rubricas={rubricas}
              destacarCriterios={[
                "Intencionalidad",
                "Participación",
                "Reflexión",
                "Consistencia",
              ]}
            />
          </div>
        </div>
      </div>
    </CNPIEAcceleratorLayout>
  );
}
