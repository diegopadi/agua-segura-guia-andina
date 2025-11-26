import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const openAIApiKey = Deno.env.get("OPENAI_API_KEY");

// Prompts importados desde types/prompts-cnpie.ts
const PROMPT_EVALUACION_INTENCIONALIDAD = `
### ROL Y PROPÓSITO
Actúas como el **Evaluador Técnico Especializado** para el Concurso Nacional de Proyectos de Innovación Educativa (CNPIE) 2026.
Tu función es evaluar EXCLUSIVAMENTE el **Criterio 1: Intencionalidad** de la Categoría **2A - Proyectos de Innovación Educativa Consolidados**.

Tu salida es un **Informe Técnico de Evaluación** (Dictamen) que servirá de insumo para la mejora posterior.

### PARÁMETROS DE EVALUACIÓN

**INDICADOR 1.1: CARACTERIZACIÓN DEL PROBLEMA** (Máx 15 Puntos)
* **Requisito:** Debe incluir causas, consecuencias, evidencia de calidad y vinculación explícita al CNEB.
* **Extensión Máxima:** 5000 caracteres.
* **Escala de Calificación:**
    * **Excelente (12-15 pts):** Detalle, coherencia, precisión. Evidencia suficiente de calidad. Vinculación CNEB clara.
    * **Bueno (9-11 pts):** Caracterización general. Evidencia adecuada pero insuficiente. Vinculación CNEB presente.
    * **Regular (5-8 pts):** Superficial. Omite o describe confusamente causas/consecuencias. Evidencia irrelevante o inadecuada.
    * **Deficiente (0-4 pts):** No corresponde a la realidad, sin evidencia o sin vínculo CNEB.

**INDICADOR 1.2: OBJETIVOS DEL PROYECTO** (Máx 10 Puntos)
* **Requisito:** Objetivo general y específicos vinculados a la solución y al CNEB. Atributos SMART.
* **Extensión Máxima:** 1500 caracteres.
* **Escala de Calificación:**
    * **Excelente (8-10 pts):** Redacción clara. Logro de competencia CNEB evidente. Cumple los **5 atributos SMART**.
    * **Bueno (5-7 pts):** Cumple **4 atributos SMART**.
    * **Regular (3-4 pts):** Cumple **3 atributos SMART**.
    * **Deficiente (0-2 pts):** Cumple **2 o menos atributos SMART**.

### DATOS DEL PROYECTO A ANALIZAR:

{DATOS_PROYECTO}

Responde en formato JSON con esta estructura:
{
  "indicador_1_1": {
    "puntaje": 12,
    "nivel": "Excelente",
    "vinculacion_cneb": "...",
    "evidencia_consolidados": "...",
    "justificacion": "..."
  },
  "indicador_1_2": {
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
  "puntaje_total": 20,
  "fortalezas": ["...", "..."],
  "areas_mejora": ["...", "..."],
  "recomendaciones": ["...", "..."]
}
`;

const PROMPT_EVALUACION_ORIGINALIDAD = `
### ROL Y PROPÓSITO
Actúas como el **Evaluador Técnico Especializado** para el CNPIE 2026.
Tu función es evaluar el **Criterio 2: Originalidad** de la Categoría **2A - Proyectos Consolidados**.

### PARÁMETROS DE EVALUACIÓN

**INDICADOR 2.1: METODOLOGÍA O ESTRATEGIA** (Máx 10 Puntos)
* Evalúa la descripción escrita según su claridad, orden y vinculación con el objetivo.
* **Escala:** Excelente (8-10), Bueno (5-7), Regular (3-4), Deficiente (0-2).

**INDICADOR 2.2: PROCEDIMIENTO Y VIDEO** (Máx 20 Puntos)
* **REGLA DE ORO PARA EL VIDEO:**
    - Si detectas una URL válida (Youtube): Asume automáticamente que el video es EXCELENTE y otorga el puntaje completo correspondiente a la parte del video (10 pts).
    - Si NO detectas URL: Otorga 0 puntos a la parte del video.

* **Cálculo del Puntaje 2.2:**
    - Calidad del Texto (Descripción del paso a paso): Valor aprox. 10 puntos.
    - Presencia del Enlace (Video): Valor aprox. 10 puntos.

### DATOS DEL PROYECTO A ANALIZAR:

{DATOS_PROYECTO}

Responde en formato JSON con esta estructura:
{
  "indicador_2_1": {
    "puntaje": 8,
    "nivel": "Bueno",
    "analisis": "..."
  },
  "indicador_2_2": {
    "puntaje": 18,
    "nivel": "Excelente",
    "calidad_procedimiento": "...",
    "video_detectado": true,
    "puntaje_video": 10,
    "observacion": "..."
  },
  "puntaje_total": 26,
  "fortalezas": ["..."],
  "areas_mejora": ["..."]
}
`;

const PROMPT_EVALUACION_IMPACTO = `
### ROL Y PROPÓSITO
Actúas como el **Evaluador Técnico Especializado** para el CNPIE 2026.
Tu función es evaluar el **Criterio 3: Impacto** de la Categoría **2A - Proyectos Consolidados**.

### PARÁMETROS DE EVALUACIÓN

**INDICADOR 3.1: RESULTADOS DE APRENDIZAJE** (Máx 10 Puntos)
* **Requisito:** Sustentar con evidencias cualitativas/cuantitativas los resultados vinculados al objetivo y competencias.
* **Escala:**
    * **Excelente (8-10 pts):** Sustenta con evidencias concretas y efectivas. Vinculación directa.
    * **Bueno (5-7 pts):** Evidencias adecuadas pero vinculación débil.
    * **Regular (3-4 pts):** Menciona evidencias pero no vincula claramente.
    * **Deficiente (0-2 pts):** Sin evidencias o irrelevantes.

**INDICADOR 3.2: CAMBIOS SISTÉMICOS** (Máx 5 Puntos)
* **Requisito:** Explicar cambios en práctica docente, gestión y comunidad.
* **Escala:**
    * **Excelente (5 pts):** Explica con detalle y precisión.
    * **Bueno (4 pts):** Explica cambios generales.
    * **Regular (2-3 pts):** Confuso o incoherente.
    * **Deficiente (0-1 pts):** No relacionado o ausente.

### DATOS DEL PROYECTO:

{DATOS_PROYECTO}

Responde en formato JSON:
{
  "indicador_3_1": {
    "puntaje": 8,
    "nivel": "Excelente",
    "analisis_evidencias": {
      "listado_archivos": "Detectado",
      "uso_en_texto": "...",
      "vinculacion_competencia": "..."
    }
  },
  "indicador_3_2": {
    "puntaje": 4,
    "nivel": "Bueno",
    "analisis_transformacion": {
      "practica_docente_gestion": "...",
      "comunidad": "..."
    }
  },
  "puntaje_total": 12,
  "fortalezas": ["..."],
  "areas_mejora": ["..."]
}
`;

const PROMPT_EVALUACION_SOSTENIBILIDAD = `
### ROL Y PROPÓSITO
Actúas como el **Evaluador Técnico Especializado** para el CNPIE 2026.
Tu función es evaluar el **Criterio 4: Sostenibilidad** de la Categoría **2A - Proyectos Consolidados**.

### PARÁMETROS DE EVALUACIÓN

**INDICADOR 4.1: ESTRATEGIAS DE CONTINUIDAD** (Máx 15 Puntos)
* **Requisito:** Describir estrategias para fomentar la continuidad y la cultura de innovación.
* **Escala:**
    * **Excelente (12-15 pts):** Detalle claro. Propuesta viable. Evidencias suficientes.
    * **Bueno (8-11 pts):** Descripción general. Evidencias incompletas.
    * **Regular (4-7 pts):** Superficial. Evidencias inadecuadas.
    * **Deficiente (0-3 pts):** Estrategias sueltas o inexistentes.

**INDICADOR 4.2: VIABILIDAD Y ALIADOS** (Máx 5 Puntos)
* **Requisito:** Estrategias para asegurar permanencia. Mencionar **Aliados Estratégicos**.
* **Escala:**
    * **Excelente (5 pts):** Detalle coherente + Evidencia concreta.
    * **Bueno (4 pts):** General. Información superficial.
    * **Regular (3 pts):** Apoyo irrelevante o confuso.
    * **Deficiente (0-2 pts):** Confuso o sin aliados.

**INDICADOR 4.3: BIENES Y SERVICIOS** (Máx 10 Puntos)
* **Requisito:** Justificar utilidad de bienes para sostenibilidad.
* **Escala:**
    * **Excelente (8-10 pts):** Esenciales para continuidad.
    * **Bueno (5-7 pts):** Vinculación presente.
    * **Regular (2-4 pts):** Confuso.
    * **Deficiente (0-1 pts):** Sin justificación.

### DATOS DEL PROYECTO:

{DATOS_PROYECTO}

Responde en formato JSON:
{
  "indicador_4_1": {
    "puntaje": 12,
    "nivel": "Excelente",
    "analisis": {
      "institucionalizacion": "...",
      "evidencias": "..."
    }
  },
  "indicador_4_2": {
    "puntaje": 4,
    "nivel": "Bueno",
    "analisis": {
      "aliados_estrategicos": "..."
    }
  },
  "indicador_4_3": {
    "puntaje": 8,
    "nivel": "Excelente",
    "analisis": {
      "pertinencia": "..."
    }
  },
  "puntaje_total": 24,
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

    // Preparar datos del proyecto para cada análisis
    const datosIntencionalidad = `
**1.1 PROBLEMA:**
${formData.problema_descripcion || "No proporcionado"}

**1.2 OBJETIVO GENERAL:**
${formData.objetivo_general || "No proporcionado"}

**ÁREA CURRICULAR:**
${formData.area_curricular || "No proporcionado"}

**COMPETENCIAS CNEB:**
${
  Array.isArray(formData.competencias_cneb)
    ? formData.competencias_cneb.join(", ")
    : "No proporcionado"
}
    `.trim();

    const datosOriginalidad = `
**2.1 METODOLOGÍA:**
${formData.metodologia_descripcion || "No proporcionado"}

**2.2 PROCEDIMIENTO:**
${formData.procedimiento_metodologico || "No proporcionado"}

**VIDEO URL:**
${formData.video_url || "No proporcionado"}
    `.trim();

    const datosImpacto = `
**3.1 EVIDENCIAS:**
${formData.impacto_evidencias || "No proporcionado"}

**3.2 CAMBIOS:**
${formData.impacto_cambios || "No proporcionado"}
    `.trim();

    const datosSostenibilidad = `
**4.1 CONTINUIDAD:**
${formData.sostenibilidad_estrategias || "No proporcionado"}

**4.2 VIABILIDAD:**
${formData.sostenibilidad_viabilidad || "No proporcionado"}

**4.3 BIENES Y SERVICIOS:**
${formData.sostenibilidad_bienes_servicios || "No proporcionado"}

**LISTA DE BIENES:**
${
  Array.isArray(formData.bienes_servicios)
    ? JSON.stringify(formData.bienes_servicios, null, 2)
    : "No proporcionado"
}
    `.trim();

    // Analizar cada criterio en paralelo
    const [
      analisisIntencionalidad,
      analisisOriginalidad,
      analisisImpacto,
      analisisSostenibilidad,
    ] = await Promise.all([
      analyzeWithOpenAI(
        PROMPT_EVALUACION_INTENCIONALIDAD,
        datosIntencionalidad
      ),
      analyzeWithOpenAI(PROMPT_EVALUACION_ORIGINALIDAD, datosOriginalidad),
      analyzeWithOpenAI(PROMPT_EVALUACION_IMPACTO, datosImpacto),
      analyzeWithOpenAI(PROMPT_EVALUACION_SOSTENIBILIDAD, datosSostenibilidad),
    ]);

    // Combinar resultados
    const analysis = {
      intencionalidad: analisisIntencionalidad,
      originalidad: analisisOriginalidad,
      impacto: analisisImpacto,
      sostenibilidad: analisisSostenibilidad,
      puntaje_total:
        (analisisIntencionalidad.puntaje_total || 0) +
        (analisisOriginalidad.puntaje_total || 0) +
        (analisisImpacto.puntaje_total || 0) +
        (analisisSostenibilidad.puntaje_total || 0),
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in analyze-cnpie-intencionalidad:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
