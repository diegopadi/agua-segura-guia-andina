/**
 * Tipos específicos para el módulo CNPIE
 * Estos complementan los tipos generados de Supabase
 */

import { Database } from "@/integrations/supabase/types";

// Tipo base del proyecto CNPIE desde Supabase
export type ProyectoCNPIE =
  Database["public"]["Tables"]["cnpie_proyectos"]["Row"];

// Tipo para bienes y servicios (pregunta 4.3)
export interface BienServicio {
  componente: string;
  denominacion: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  descripcion_utilidad: string;
}

// Tipos para el Paso 1: Datos iniciales de la ficha (estructurado por criterios)
export interface FormDataStep1 {
  // CRITERIO 1: INTENCIONALIDAD (25 puntos)
  intencionalidad: {
    // Indicador 1.1: Caracterización del Problema (15 pts)
    problema_descripcion: string; // Descripción completa con causas y consecuencias
    problema_evidencias?: string[]; // URLs de PDFs
    competencias_cneb?: string[]; // Competencias del CNEB vinculadas
    area_curricular?: string; // Área curricular

    // Indicador 1.2: Objetivos (10 pts)
    objetivo_general: string; // Objetivo general SMART
    objetivos_especificos?: string[]; // Objetivos específicos
    periodo?: string; // Periodo de implementación
  };

  // CRITERIO 2: ORIGINALIDAD (15 puntos)
  originalidad: {
    // Indicador 2.1: Metodología Innovadora (10 pts)
    metodologia_descripcion: string; // Descripción de la metodología innovadora
    vinculacion_objetivo?: string; // Cómo se vincula con el objetivo

    // Indicador 2.2: Procedimiento Metodológico (5 pts)
    procedimiento_metodologico: string; // Procedimiento paso a paso
    video_url?: string; // Video explicativo (opcional, máx 3 min)
  };

  // CRITERIO 3: IMPACTO (15 puntos)
  impacto: {
    // Indicador 3.1: Evidencias de Impacto (10 pts)
    evidencias_descripcion: string; // Sustento con evidencias de resultados
    evidencias_archivos?: string[]; // URLs de PDFs de evidencias
    resultados_cuantitativos?: string; // Datos numéricos de impacto

    // Indicador 3.2: Cambios Generados (5 pts)
    cambios_practica_docente?: string; // Cambios en la práctica docente
    cambios_gestion_escolar?: string; // Cambios en la gestión escolar
    cambios_comunidad?: string; // Cambios en la comunidad educativa
  };

  // CRITERIO 4: SOSTENIBILIDAD (15 puntos)
  sostenibilidad: {
    // Indicador 4.1: Estrategias de Continuidad (5 pts)
    estrategias_continuidad: string; // Estrategias desarrolladas

    // Indicador 4.2: Estrategias de Viabilidad (5 pts)
    estrategias_viabilidad: string; // Estrategias futuras

    // Indicador 4.3: Bienes y Servicios (5 pts)
    bienes_servicios_descripcion?: string; // Descripción general
    bienes_servicios?: BienServicio[]; // Tabla de bienes y servicios
  };

  // Campos adicionales para contexto general
  contexto?: string;
}

// Tipos para análisis de IA por ítem
export interface AnalysisItem {
  item_number: number;
  item_name: string;
  fortalezas: string[];
  areas_mejorar: string[];
  sugerencias: string[];
  puntaje_estimado: number;
  completitud: number;
}

// Tipos para el Paso 2: Análisis de IA
// Análisis del Paso 2 - Evaluación con IA de los 4 criterios
export interface AnalysisStep2 {
  intencionalidad: {
    indicador_1_1: {
      puntaje: number;
      nivel: string;
      vinculacion_cneb: string;
      evidencia_consolidados: string;
      justificacion: string;
    };
    indicador_1_2: {
      puntaje: number;
      nivel: string;
      checklist_smart: {
        especifico: boolean;
        medible: boolean;
        alcanzable: boolean;
        relevante: boolean;
        temporal: boolean;
      };
      justificacion: string;
    };
    puntaje_total: number;
    fortalezas: string[];
    areas_mejora: string[];
    recomendaciones: string[];
  };
  originalidad: {
    indicador_2_1: {
      puntaje: number;
      nivel: string;
      analisis: string;
    };
    indicador_2_2: {
      puntaje: number;
      nivel: string;
      calidad_procedimiento: string;
      video_detectado: boolean;
      puntaje_video: number;
      observacion: string;
    };
    puntaje_total: number;
    fortalezas: string[];
    areas_mejora: string[];
  };
  impacto: {
    indicador_3_1: {
      puntaje: number;
      nivel: string;
      analisis_evidencias: {
        listado_archivos: string;
        uso_en_texto: string;
        vinculacion_competencia: string;
      };
    };
    indicador_3_2: {
      puntaje: number;
      nivel: string;
      analisis_transformacion: {
        practica_docente_gestion: string;
        comunidad: string;
      };
    };
    puntaje_total: number;
    fortalezas: string[];
    areas_mejora: string[];
  };
  sostenibilidad: {
    indicador_4_1: {
      puntaje: number;
      nivel: string;
      analisis: {
        institucionalizacion: string;
        evidencias: string;
      };
    };
    indicador_4_2: {
      puntaje: number;
      nivel: string;
      analisis: {
        aliados_estrategicos: string;
      };
    };
    indicador_4_3: {
      puntaje: number;
      nivel: string;
      analisis: {
        pertinencia: string;
      };
    };
    puntaje_total: number;
    fortalezas: string[];
    areas_mejora: string[];
  };
  puntaje_total: number;
  timestamp: string;
}

// Tipos para preguntas complementarias generadas por IA
export interface ComplementaryQuestion {
  id: string;
  item_reference: string;
  question_text: string;
  placeholder: string;
  max_length?: number;
}

// Tipos para respuestas complementarias del Paso 3
export interface ComplementaryAnswers {
  [questionId: string]: string;
}

export interface FormDataStep3 {
  complementary_answers: ComplementaryAnswers;
  timestamp: string;
}

// Tipos para análisis final del Paso 4
export interface CriterioEvaluacion {
  nombre: string;
  puntaje: number;
  puntaje_maximo: number;
  feedback: string;
  nivel: "DEFICIENTE" | "REGULAR" | "BUENO" | "EXCELENTE";
}

export interface RecomendacionPrioritaria {
  numero: number;
  titulo: string;
  descripcion: string;
  impacto: "ALTO" | "MEDIO" | "BAJO";
}

export interface FinalAnalysisStep4 {
  puntaje_total: number;
  puntaje_maximo: number;
  porcentaje: number;
  nivel_global: "DEFICIENTE" | "REGULAR" | "BUENO" | "EXCELENTE";
  criterios: {
    intencionalidad: CriterioEvaluacion;
    originalidad: CriterioEvaluacion;
    pertinencia: CriterioEvaluacion;
    participacion: CriterioEvaluacion;
    impacto: CriterioEvaluacion;
    sostenibilidad: CriterioEvaluacion;
  };
  recomendaciones: RecomendacionPrioritaria[];
  timestamp: string;
}

// Estructura completa del acelerador con los 4 pasos
export interface Etapa1Acelerador1Data {
  current_step: number;
  completed_steps: number[];
  last_updated: string;

  step1_data?: FormDataStep1;
  step2_data?: AnalysisStep2;
  step3_data?: FormDataStep3;
  step4_data?: FinalAnalysisStep4;
}

// Respuesta de funciones de Supabase
export interface AnalysisResponse {
  success: boolean;
  analysis: AnalysisItem;
  message?: string;
}

export interface FinalAnalysisResponse {
  success: boolean;
  analysis: FinalAnalysisStep4;
  message?: string;
}

// Constantes para la ficha ANEXO 2A
export const ANEXO_2A_LIMITS = {
  PROBLEMA_CARACTERIZACION: 5000,
  OBJETIVOS: 1500,
  METODOLOGIA_DESCRIPCION: 3000,
  PROCEDIMIENTO_METODOLOGICO: 5000,
  IMPACTO_EVIDENCIAS: 3500,
  IMPACTO_CAMBIOS: 3000,
  SOSTENIBILIDAD_ESTRATEGIAS: 3000,
  SOSTENIBILIDAD_VIABILIDAD: 3000,
  SOSTENIBILIDAD_BIENES_SERVICIOS: 3000,
} as const;

export const ARCHIVO_EVIDENCIA_MAX_SIZE = 5 * 1024 * 1024; // 5MB
export const ARCHIVO_EVIDENCIA_ALLOWED_TYPES = ["application/pdf"] as const;

export const ITEMS_FICHA_2A = [
  {
    id: "item1",
    numero: 1,
    titulo: "IDENTIFICACIÓN DEL PROBLEMA Y DESCRIPCIÓN DE OBJETIVOS",
    preguntas: [
      {
        numero: "1.1",
        texto:
          "Caracteriza el problema central o el desafío que su proyecto busca abordar. La descripción debe incluir las causas y consecuencias que justifican su implementación.",
        maxCaracteres: 5000,
      },
      {
        numero: "1.2",
        texto:
          "Formula el objetivo general y específicos del proyecto vinculados con la solución del problema central.",
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
          "Describe de qué trata la metodología o estrategia innovadora que viene implementando en su proyecto.",
        maxCaracteres: 3000,
      },
      {
        numero: "2.2",
        texto:
          "Describe el procedimiento metodológico que viene implementando. Adjuntar enlace a video (máximo 3 minutos).",
        maxCaracteres: 5000,
      },
    ],
  },
  {
    id: "item3",
    numero: 3,
    titulo: "IMPACTO DE LA IMPLEMENTACIÓN",
    preguntas: [
      {
        numero: "3.1",
        texto:
          "Sustenta con evidencias los resultados obtenidos durante la implementación del proyecto.",
        maxCaracteres: 3500,
      },
      {
        numero: "3.2",
        texto:
          "Explica los cambios o efectos logrados en la práctica docente, la gestión escolar y la comunidad educativa.",
        maxCaracteres: 3000,
      },
    ],
  },
  {
    id: "item4",
    numero: 4,
    titulo: "SOSTENIBILIDAD",
    preguntas: [
      {
        numero: "4.1",
        texto:
          "Describe las estrategias que vienen desarrollando para fomentar la continuidad del proyecto.",
        maxCaracteres: 3000,
      },
      {
        numero: "4.2",
        texto:
          "Describe las estrategias que desarrollaran para asegurar la viabilidad del proyecto.",
        maxCaracteres: 3000,
      },
      {
        numero: "4.3",
        texto:
          "Describe la utilidad de los bienes y servicios que demanda el proyecto para garantizar su sostenibilidad y continuidad a largo plazo.",
        maxCaracteres: 3000,
        requiereTabla: true,
      },
    ],
  },
] as const;
