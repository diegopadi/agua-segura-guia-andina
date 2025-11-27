import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const openAIApiKey = Deno.env.get("OPENAI_API_KEY");

// Prompts para evaluar proyectos IAPE (Categoría 2D)
const PROMPT_EVALUACION_INTENCIONALIDAD_2D = `
### ROL Y PROPÓSITO
Actúas como el **Evaluador Técnico Especializado** para el Concurso Nacional de Proyectos de Innovación Educativa (CNPIE) 2026.
Tu función es evaluar EXCLUSIVAMENTE el **Criterio 1: Intencionalidad** de la Categoría **2D - Proyectos de Investigación-Acción Participativa para la Innovación Educativa (IAPE)**.

### PARÁMETROS DE EVALUACIÓN

**INDICADOR 1.1: PROBLEMA** (Máx 15 Puntos)
* **Requisito:** Descripción clara del problema educativo, causas, consecuencias e identificación de actores.
* **Extensión Máxima:** 5000 caracteres.
* **Escala de Calificación:**
    * **Excelente (12-15 pts):** Detalle claro, coherencia, precisión. Identificación completa de actores y contexto.
    * **Bueno (9-11 pts):** Caracterización general. Actores identificados parcialmente.
    * **Regular (5-8 pts):** Superficial. Omite causas/consecuencias o actores.
    * **Deficiente (0-4 pts):** No corresponde a la realidad educativa.

**INDICADOR 1.2: JUSTIFICACIÓN** (Máx 10 Puntos)
* **Requisito:** Argumentos claros de por qué es necesario investigar el problema.
* **Extensión Máxima:** 3000 caracteres.
* **Escala de Calificación:**
    * **Excelente (8-10 pts):** Argumentos sólidos, relevancia clara, impacto potencial explicado.
    * **Bueno (5-7 pts):** Argumentos adecuados pero superficiales.
    * **Regular (3-4 pts):** Justificación débil o genérica.
    * **Deficiente (0-2 pts):** Sin justificación coherente.

**INDICADOR 1.3: PREGUNTAS DE INVESTIGACIÓN** (Máx 10 Puntos)
* **Requisito:** Preguntas claras, investigables y alineadas al problema.
* **Extensión Máxima:** 1500 caracteres.
* **Escala de Calificación:**
    * **Excelente (8-10 pts):** Preguntas claras, específicas y coherentes con el problema.
    * **Bueno (5-7 pts):** Preguntas adecuadas pero poco específicas.
    * **Regular (3-4 pts):** Preguntas confusas o no investigables.
    * **Deficiente (0-2 pts):** Preguntas irrelevantes o ausentes.

**INDICADOR 1.4: OBJETIVOS** (Máx 10 Puntos)
* **Requisito:** Objetivo general y específicos SMART vinculados al problema y preguntas.
* **Extensión Máxima:** 1500 caracteres.
* **Escala de Calificación:**
    * **Excelente (8-10 pts):** Cumple 5 atributos SMART. Clara vinculación.
    * **Bueno (5-7 pts):** Cumple 4 atributos SMART.
    * **Regular (3-4 pts):** Cumple 3 atributos SMART.
    * **Deficiente (0-2 pts):** Cumple 2 o menos atributos SMART.

### DATOS DEL PROYECTO A ANALIZAR:

{DATOS_PROYECTO}

Responde en formato JSON con esta estructura:
{
  "indicador_1_1": {
    "puntaje": 12,
    "nivel": "Excelente",
    "analisis_problema": "...",
    "actores_identificados": "...",
    "justificacion": "..."
  },
  "indicador_1_2": {
    "puntaje": 8,
    "nivel": "Bueno",
    "analisis_justificacion": "...",
    "justificacion": "..."
  },
  "indicador_1_3": {
    "puntaje": 8,
    "nivel": "Excelente",
    "analisis_preguntas": "...",
    "justificacion": "..."
  },
  "indicador_1_4": {
    "puntaje": 8,
    "nivel": "Excelente",
    "checklist_smart": {
      "especifico": true,
      "medible": true,
      "alcanzable": true,
      "relevante": true,
      "temporal": true
    },
    "justificacion": "..."
  },
  "puntaje_total": 36,
  "fortalezas": ["...", "..."],
  "areas_mejora": ["...", "..."],
  "recomendaciones": ["...", "..."]
}
`;

const PROMPT_EVALUACION_PARTICIPACION_2D = `
### ROL Y PROPÓSITO
Actúas como el **Evaluador Técnico Especializado** para el CNPIE 2026.
Tu función es evaluar el **Criterio 2: Participación** de la Categoría **2D - Proyectos IAPE**.

### PARÁMETROS DE EVALUACIÓN

**INDICADOR 2.1: ACTORES Y ROLES** (Máx 10 Puntos)
* **Requisito:** Identificar claramente los actores participantes y sus roles en la investigación-acción.
* **Extensión Máxima:** 3000 caracteres.
* **Escala de Calificación:**
    * **Excelente (8-10 pts):** Actores claramente identificados con roles definidos y participación activa.
    * **Bueno (5-7 pts):** Actores identificados pero roles poco claros.
    * **Regular (3-4 pts):** Identificación parcial de actores.
    * **Deficiente (0-2 pts):** No identifica actores o roles.

### DATOS DEL PROYECTO A ANALIZAR:

{DATOS_PROYECTO}

Responde en formato JSON:
{
  "indicador_2_1": {
    "puntaje": 8,
    "nivel": "Excelente",
    "actores_identificados": ["..."],
    "roles_definidos": "...",
    "analisis": "..."
  },
  "puntaje_total": 8,
  "fortalezas": ["..."],
  "areas_mejora": ["..."]
}
`;

const PROMPT_EVALUACION_REFLEXION_2D = `
### ROL Y PROPÓSITO
Actúas como el **Evaluador Técnico Especializado** para el CNPIE 2026.
Tu función es evaluar el **Criterio 3: Reflexión** de la Categoría **2D - Proyectos IAPE**.

### PARÁMETROS DE EVALUACIÓN

**INDICADOR 3.1: ESTRATEGIAS DE REFLEXIÓN** (Máx 10 Puntos)
* **Requisito:** Describir cómo se promoverá la reflexión crítica durante el proceso de investigación-acción.
* **Extensión Máxima:** 3000 caracteres.
* **Escala de Calificación:**
    * **Excelente (8-10 pts):** Estrategias claras, variadas y coherentes con la metodología IAPE.
    * **Bueno (5-7 pts):** Estrategias adecuadas pero limitadas.
    * **Regular (3-4 pts):** Estrategias confusas o poco desarrolladas.
    * **Deficiente (0-2 pts):** Sin estrategias de reflexión.

### DATOS DEL PROYECTO:

{DATOS_PROYECTO}

Responde en formato JSON:
{
  "indicador_3_1": {
    "puntaje": 8,
    "nivel": "Excelente",
    "estrategias_identificadas": ["..."],
    "coherencia_metodologica": "...",
    "analisis": "..."
  },
  "puntaje_total": 8,
  "fortalezas": ["..."],
  "areas_mejora": ["..."]
}
`;

const PROMPT_EVALUACION_CONSISTENCIA_2D = `
### ROL Y PROPÓSITO
Actúas como el **Evaluador Técnico Especializado** para el CNPIE 2026.
Tu función es evaluar el **Criterio 4: Consistencia** de la Categoría **2D - Proyectos IAPE**.

### PARÁMETROS DE EVALUACIÓN

**INDICADOR 4.1: PROCEDIMIENTO METODOLÓGICO** (Máx 15 Puntos)
* **Requisito:** Descripción clara de las fases del ciclo IAPE (planificación, acción, observación, reflexión).
* **Extensión Máxima:** 5000 caracteres.
* **Escala de Calificación:**
    * **Excelente (12-15 pts):** Fases claramente descritas, secuencia lógica, coherencia metodológica.
    * **Bueno (9-11 pts):** Fases descritas pero con inconsistencias menores.
    * **Regular (5-8 pts):** Descripción superficial de las fases.
    * **Deficiente (0-4 pts):** No describe el ciclo IAPE.

**INDICADOR 4.2: TÉCNICAS E INSTRUMENTOS** (Máx 10 Puntos)
* **Requisito:** Identificar técnicas e instrumentos de recojo de información coherentes con la metodología.
* **Extensión Máxima:** 3000 caracteres.
* **Escala de Calificación:**
    * **Excelente (8-10 pts):** Técnicas variadas y coherentes con los objetivos.
    * **Bueno (5-7 pts):** Técnicas adecuadas pero limitadas.
    * **Regular (3-4 pts):** Técnicas poco desarrolladas.
    * **Deficiente (0-2 pts):** Sin técnicas identificadas.

**INDICADOR 4.3: PLAN DE ACTIVIDADES** (Máx 5 Puntos)
* **Requisito:** Cronograma detallado de actividades con responsables y plazos.
* **Extensión Máxima:** Tabla/lista estructurada.
* **Escala de Calificación:**
    * **Excelente (5 pts):** Cronograma completo, realista y detallado.
    * **Bueno (4 pts):** Cronograma general pero viable.
    * **Regular (2-3 pts):** Cronograma incompleto.
    * **Deficiente (0-1 pts):** Sin cronograma.

**INDICADOR 4.4: BIENES Y SERVICIOS** (Máx 5 Puntos)
* **Requisito:** Lista justificada de bienes y servicios necesarios para la investigación.
* **Extensión Máxima:** Tabla estructurada.
* **Escala de Calificación:**
    * **Excelente (5 pts):** Bienes justificados y coherentes con las actividades.
    * **Bueno (4 pts):** Bienes identificados con justificación parcial.
    * **Regular (2-3 pts):** Lista sin justificación clara.
    * **Deficiente (0-1 pts):** Sin bienes identificados.

### DATOS DEL PROYECTO:

{DATOS_PROYECTO}

Responde en formato JSON:
{
  "indicador_4_1": {
    "puntaje": 12,
    "nivel": "Excelente",
    "fases_identificadas": ["planificación", "acción", "observación", "reflexión"],
    "coherencia_metodologica": "...",
    "analisis": "..."
  },
  "indicador_4_2": {
    "puntaje": 8,
    "nivel": "Excelente",
    "tecnicas_identificadas": ["..."],
    "analisis": "..."
  },
  "indicador_4_3": {
    "puntaje": 4,
    "nivel": "Bueno",
    "actividades_identificadas": 0,
    "analisis": "..."
  },
  "indicador_4_4": {
    "puntaje": 4,
    "nivel": "Bueno",
    "bienes_identificados": 0,
    "analisis": "..."
  },
  "puntaje_total": 28,
  "fortalezas": ["..."],
  "areas_mejora": ["..."]
}
`;

// Función auxiliar para llamar a OpenAI
async function analyzeWithOpenAI(prompt: string, datosProyecto: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAIApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: prompt.replace("{DATOS_PROYECTO}", datosProyecto),
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("OpenAI API error:", error);
    throw new Error("Error en la API de OpenAI");
  }

  const data = await response.json();
  let content = data.choices[0].message.content;
  content = content
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  return JSON.parse(content);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.json();
    console.log("Analyzing CNPIE 2D project:", JSON.stringify(formData).substring(0, 500));

    // Preparar datos para cada criterio
    const datosIntencionalidad = `
**1.1 PROBLEMA (causas, consecuencias, actores):**
${formData.formulacion?.problema_causas_consecuencias || "No proporcionado"}

**1.2 JUSTIFICACIÓN:**
${formData.formulacion?.justificacion || "No proporcionado"}

**1.3 PREGUNTAS DE INVESTIGACIÓN:**
${formData.formulacion?.preguntas_investigacion || "No proporcionado"}

**1.4 OBJETIVOS:**
${formData.formulacion?.objetivos || "No proporcionado"}
    `.trim();

    const datosParticipacion = `
**2.1 ACTORES Y ROLES:**
${formData.participacion?.actores_roles || "No proporcionado"}
    `.trim();

    const datosReflexion = `
**3.1 ESTRATEGIAS DE REFLEXIÓN:**
${formData.reflexion?.estrategias_reflexion || "No proporcionado"}
    `.trim();

    const datosConsistencia = `
**4.1 PROCEDIMIENTO METODOLÓGICO:**
${formData.consistencia?.procedimiento_metodologico || "No proporcionado"}

**4.2 TÉCNICAS E INSTRUMENTOS:**
${formData.consistencia?.tecnicas_instrumentos || "No proporcionado"}

**4.3 PLAN DE ACTIVIDADES:**
${
  Array.isArray(formData.consistencia?.plan_acciones)
    ? JSON.stringify(formData.consistencia.plan_acciones, null, 2)
    : "No proporcionado"
}

**4.4 BIENES Y SERVICIOS:**
${
  Array.isArray(formData.consistencia?.bienes_servicios)
    ? JSON.stringify(formData.consistencia.bienes_servicios, null, 2)
    : "No proporcionado"
}
    `.trim();

    // Analizar cada criterio en paralelo
    const [
      analisisIntencionalidad,
      analisisParticipacion,
      analisisReflexion,
      analisisConsistencia,
    ] = await Promise.all([
      analyzeWithOpenAI(PROMPT_EVALUACION_INTENCIONALIDAD_2D, datosIntencionalidad),
      analyzeWithOpenAI(PROMPT_EVALUACION_PARTICIPACION_2D, datosParticipacion),
      analyzeWithOpenAI(PROMPT_EVALUACION_REFLEXION_2D, datosReflexion),
      analyzeWithOpenAI(PROMPT_EVALUACION_CONSISTENCIA_2D, datosConsistencia),
    ]);

    // Combinar resultados con estructura adaptada a 2D
    const analysis = {
      formulacion: analisisIntencionalidad,
      participacion: analisisParticipacion,
      reflexion: analisisReflexion,
      consistencia: analisisConsistencia,
      puntaje_total:
        (analisisIntencionalidad.puntaje_total || 0) +
        (analisisParticipacion.puntaje_total || 0) +
        (analisisReflexion.puntaje_total || 0) +
        (analisisConsistencia.puntaje_total || 0),
      puntaje_maximo: 100,
      timestamp: new Date().toISOString(),
    };

    console.log("Analysis complete. Total score:", analysis.puntaje_total);

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in analyze-cnpie-general-2d:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
