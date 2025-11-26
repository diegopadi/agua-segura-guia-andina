// evaluate-final-cnpie-2a
// Función para evaluar el proyecto completo (step1 + step3) con los 4 criterios CNPIE 2A
import { createClient } from "npm:@supabase/supabase-js@2.47.10";

const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// ============================================
// PROMPTS DE EVALUACIÓN POR CRITERIO
// ============================================

export const PROMPT_EVALUAR_INTENCIONALIDAD = `
### ROL Y PROPÓSITO
Actúas como el **Evaluador Técnico Especializado** para el Concurso Nacional de Proyectos de Innovación Educativa (CNPIE) 2026.
Tu función es evaluar EXCLUSIVAMENTE el **Criterio 1: Intencionalidad** de la Categoría **2A - Proyectos de Innovación Educativa Consolidados**.

Tu salida es un **Informe Técnico de Evaluación** (Dictamen) que servirá de insumo para la mejora posterior. No conversas, no ayudas a redactar; solo evalúas con rigor según la rúbrica oficial.

### CONOCIMIENTO BASE (KNOWLEDGE BASE)
Consulta obligatoriamente el archivo \`bases-cnpie-2026.pdf\`.
Te regirás por:
1.  **Anexo 2A (Ficha Consolidados):** Páginas 53-55.
2.  **Rúbrica Consolidados (Intencionalidad):** Página 71.
3.  **Competencias CNEB:** Páginas 15-16.

### PARÁMETROS DE EVALUACIÓN (CATEGORÍA 2A - CONSOLIDADOS)

**INDICADOR 1.1: CARACTERIZACIÓN DEL PROBLEMA** (Máx 25 Puntos)
* **Requisito:** Debe incluir causas, consecuencias, evidencia de calidad y vinculación explícita al CNEB.
* **Extensión Máxima:** 5000 caracteres.
* **Escala de Calificación:**
    * **Excelente (21-25 pts):** Detalle, coherencia, precisión. Evidencia suficiente de calidad. Vinculación CNEB clara.
    * **Bueno (15-20 pts):** Caracterización general. Evidencia adecuada pero insuficiente. Vinculación CNEB presente.
    * **Regular (8-14 pts):** Superficial. Omite o describe confusamente causas/consecuencias. Evidencia irrelevante o inadecuada.
    * **Deficiente (0-7 pts):** No corresponde a la realidad, sin evidencia o sin vínculo CNEB.

**INDICADOR 1.2: OBJETIVOS DEL PROYECTO** (Máx 10 Puntos)
* **Requisito:** Objetivo general y específicos vinculados a la solución y al CNEB. Atributos SMART.
* **Extensión Máxima:** 1500 caracteres.
* **Escala de Calificación:**
    * **Excelente (8-10 pts):** Redacción clara. Logro de competencia CNEB evidente. Cumple los **5 atributos SMART**.
    * **Bueno (5-7 pts):** Cumple **4 atributos SMART**.
    * **Regular (3-4 pts):** Cumple **3 atributos SMART**.
    * **Deficiente (0-2 pts):** Cumple **2 o menos atributos SMART**.

### FORMATO DE RESPUESTA
Retorna un objeto JSON con esta estructura exacta:

{
  "indicador_1_1": {
    "puntaje": 23,
    "nivel": "Excelente",
    "vinculacion_cneb": "Sí, menciona la competencia...",
    "evidencia": "Sí, menciona evidencias de los últimos 2 años...",
    "justificacion": "La caracterización del problema es detallada..."
  },
  "indicador_1_2": {
    "puntaje": 9,
    "nivel": "Excelente",
    "checklist_smart": {
      "especifico": true,
      "medible": true,
      "alcanzable": true,
      "relevante": true,
      "temporal": true
    },
    "justificacion": "Los objetivos cumplen con los 5 atributos SMART..."
  }
}
`;

export const PROMPT_EVALUAR_ORIGINALIDAD = `
### ROL Y PROPÓSITO
Actúas como el **Evaluador Técnico Especializado** para el Concurso Nacional de Proyectos de Innovación Educativa (CNPIE) 2026.
Tu función es evaluar el **Criterio 2: Originalidad** de la Categoría **2A - Proyectos Consolidados**.

### PARÁMETROS DE EVALUACIÓN

**INDICADOR 2.1: METODOLOGÍA O ESTRATEGIA** (Máx 15 Puntos)
* Evalúa la descripción escrita según su claridad, orden y vinculación con el objetivo.
* **Escala:** Excelente (12-15), Bueno (8-11), Regular (4-7), Deficiente (0-3).

**INDICADOR 2.2: PROCEDIMIENTO Y VIDEO** (Máx 15 Puntos)
* **REGLA DE ORO PARA EL VIDEO:**
    - Detecta si hay URL de YouTube válida
    - Si SÍ: otorga puntaje completo por video (~8 pts)
    - Si NO: 0 puntos por video

### FORMATO DE RESPUESTA
{
  "indicador_2_1": {
    "puntaje": 13,
    "nivel": "Excelente",
    "analisis": "La metodología está claramente definida..."
  },
  "indicador_2_2": {
    "puntaje": 14,
    "nivel": "Excelente",
    "desglose": {
      "Calidad del Procedimiento Escrito": "El procedimiento está detallado...",
      "Verificación de Video": {
        "Estado": "ENLACE DETECTADO ✅",
        "Efecto en Puntaje": "Se otorga puntaje completo por video"
      }
    },
    "observacion": "El procedimiento escrito es claro..."
  }
}
`;

export const PROMPT_EVALUAR_IMPACTO = `
### ROL Y PROPÓSITO
Actúas como el **Evaluador Técnico Especializado** para el CNPIE 2026.
Tu función es evaluar el **Criterio 3: Impacto** de la Categoría **2A**.

### PARÁMETROS DE EVALUACIÓN

**INDICADOR 3.1: RESULTADOS DE APRENDIZAJE** (Máx 10 Puntos)
**INDICADOR 3.2: CAMBIOS SISTÉMICOS** (Máx 5 Puntos)

### FORMATO DE RESPUESTA
{
  "indicador_3_1": {
    "puntaje": 9,
    "nivel": "Excelente",
    "analisis_evidencias": {
      "Listado de Archivos": "Detectado",
      "Uso en el Texto": "Sí, el texto cita los datos...",
      "Vinculación Competencia": "Sí, demuestra mejora..."
    }
  },
  "indicador_3_2": {
    "puntaje": 5,
    "nivel": "Excelente",
    "analisis_transformacion": {
      "Práctica Docente/Gestión": "Sí, describe cambios reales...",
      "Comunidad": "Sí, menciona impacto en familias..."
    }
  },
  "observacion_final": "El proyecto presenta evidencias sólidas..."
}
`;

export const PROMPT_EVALUAR_SOSTENIBILIDAD = `
### ROL Y PROPÓSITO
Actúas como el **Evaluador Técnico Especializado** para el CNPIE 2026.
Tu función es evaluar el **Criterio 4: Sostenibilidad** de la Categoría **2A**.

### PARÁMETROS DE EVALUACIÓN

**INDICADOR 4.1: ESTRATEGIAS DE CONTINUIDAD** (Máx 15 Puntos)
**INDICADOR 4.2: VIABILIDAD Y ALIADOS** (Máx 5 Puntos)
**INDICADOR 4.3: BIENES Y SERVICIOS** (Máx 10 Puntos)

### FORMATO DE RESPUESTA
{
  "indicador_4_1": {
    "puntaje": 14,
    "nivel": "Excelente",
    "analisis": {
      "Institucionalización": "Sí, está en PEI/PAT",
      "Evidencias": "Listadas y citadas"
    }
  },
  "indicador_4_2": {
    "puntaje": 4,
    "nivel": "Bueno",
    "analisis": {
      "Aliados Estratégicos": "Mencionados..."
    }
  },
  "indicador_4_3": {
    "puntaje": 8,
    "nivel": "Excelente",
    "analisis": {
      "Pertinencia": "Los bienes garantizan sostenibilidad..."
    }
  },
  "observacion_final": "El proyecto muestra capacidad de continuidad..."
}
`;

// ============================================
// FUNCIONES HELPER
// ============================================

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, x-client-info, apikey",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
  });
}

function corsResponse() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, x-client-info, apikey",
      "Access-Control-Max-Age": "86400",
    },
  });
}

async function callOpenAI(prompt: string) {
  if (!openAIApiKey) {
    throw new Error("Falta la variable OPENAI_API_KEY");
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAIApiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "Eres un evaluador técnico experto del CNPIE 2026. Evalúas proyectos con rigor según rúbricas oficiales. Retornas SOLO JSON válido.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: {
        type: "json_object",
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Error OpenAI (${res.status}): ${text}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Respuesta de OpenAI vacía o malformada");

  try {
    return JSON.parse(content);
  } catch {
    throw new Error("OpenAI no devolvió JSON válido");
  }
}

// ============================================
// HANDLER PRINCIPAL
// ============================================

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") return corsResponse();

  if (req.method !== "POST") {
    return jsonResponse(
      {
        success: false,
        error: "Método no permitido",
      },
      405
    );
  }

  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return jsonResponse(
        {
          success: false,
          error: "Faltan variables SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY",
        },
        500
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let payload = null;
    try {
      payload = await req.json();
    } catch {
      return jsonResponse(
        {
          success: false,
          error: "Body JSON inválido",
        },
        400
      );
    }

    const { step1Data, step3Answers } = payload ?? {};

    if (!step1Data || !step3Answers) {
      return jsonResponse(
        {
          success: false,
          error: "Faltan step1Data o step3Answers",
        },
        400
      );
    }

    // ============================================
    // COMBINAR RESPUESTAS PASO 1 + PASO 3
    // ============================================

    const intencionalidadData = {
      problema_original: step1Data.intencionalidad?.problema_descripcion || "",
      objetivo_original: step1Data.intencionalidad?.objetivo_general || "",
      competencias_cneb: step1Data.intencionalidad?.competencias_cneb || [],
      respuestas_complementarias: step3Answers.intencionalidad || {},
    };

    const originalidadData = {
      metodologia_original:
        step1Data.originalidad?.metodologia_descripcion || "",
      procedimiento_original:
        step1Data.originalidad?.procedimiento_metodologico || "",
      video_url: step1Data.originalidad?.video_url || "",
      respuestas_complementarias: step3Answers.originalidad || {},
    };

    const impactoData = {
      resultados_original: step1Data.impacto?.evidencias_descripcion || "",
      cambios_practica: step1Data.impacto?.cambios_practica_docente || "",
      cambios_comunidad: step1Data.impacto?.cambios_comunidad || "",
      cambios_gestion: step1Data.impacto?.cambios_gestion_escolar || "",
      respuestas_complementarias: step3Answers.impacto || {},
    };

    const sostenibilidadData = {
      continuidad_original:
        step1Data.sostenibilidad?.estrategias_continuidad || "",
      viabilidad_original:
        step1Data.sostenibilidad?.estrategias_viabilidad || "",
      bienes_servicios: step1Data.sostenibilidad?.bienes_servicios || [],
      respuestas_complementarias: step3Answers.sostenibilidad || {},
    };

    // ============================================
    // EVALUACIÓN CON IA
    // ============================================

    console.log("🔍 Evaluando Intencionalidad...");
    const intencionalidadPrompt = `${PROMPT_EVALUAR_INTENCIONALIDAD}

### DATOS A EVALUAR:
${JSON.stringify(intencionalidadData, null, 2)}

Evalúa considerando original + complementarias. Retorna JSON válido.`;

    const intencionalidadResult = await callOpenAI(intencionalidadPrompt);

    console.log("🎨 Evaluando Originalidad...");
    const originalidadPrompt = `${PROMPT_EVALUAR_ORIGINALIDAD}

### DATOS A EVALUAR:
${JSON.stringify(originalidadData, null, 2)}

Evalúa considerando original + complementarias. Retorna JSON válido.`;

    const originalidadResult = await callOpenAI(originalidadPrompt);

    console.log("📊 Evaluando Impacto...");
    const impactoPrompt = `${PROMPT_EVALUAR_IMPACTO}

### DATOS A EVALUAR:
${JSON.stringify(impactoData, null, 2)}

Evalúa considerando original + complementarias. Retorna JSON válido.`;

    const impactoResult = await callOpenAI(impactoPrompt);

    console.log("🌱 Evaluando Sostenibilidad...");
    const sostenibilidadPrompt = `${PROMPT_EVALUAR_SOSTENIBILIDAD}

### DATOS A EVALUAR:
${JSON.stringify(sostenibilidadData, null, 2)}

Evalúa considerando original + complementarias. Retorna JSON válido.`;

    const sostenibilidadResult = await callOpenAI(sostenibilidadPrompt);

    // ============================================
    // CALCULAR PUNTAJE TOTAL
    // ============================================

    const calcularPuntaje = (obj: any): number => {
      let total = 0;
      for (const key in obj) {
        if (key.startsWith("indicador_") && obj[key]?.puntaje !== undefined) {
          const puntaje = obj[key].puntaje;
          if (typeof puntaje === "number") {
            total += puntaje;
          } else if (typeof puntaje === "string") {
            const match = puntaje.match(/^(\d+)/);
            if (match) total += parseInt(match[1]);
          }
        }
      }
      return total;
    };

    const puntaje_intencionalidad = calcularPuntaje(intencionalidadResult);
    const puntaje_originalidad = calcularPuntaje(originalidadResult);
    const puntaje_impacto = calcularPuntaje(impactoResult);
    const puntaje_sostenibilidad = calcularPuntaje(sostenibilidadResult);

    const puntaje_total =
      puntaje_intencionalidad +
      puntaje_originalidad +
      puntaje_impacto +
      puntaje_sostenibilidad;

    const puntaje_maximo = 80;
    const porcentaje = Math.round((puntaje_total / puntaje_maximo) * 100);

    let nivel_final = "DEFICIENTE";
    if (porcentaje >= 90) nivel_final = "EXCELENTE";
    else if (porcentaje >= 75) nivel_final = "BUENO";
    else if (porcentaje >= 50) nivel_final = "REGULAR";

    const resultadoFinal = {
      intencionalidad: intencionalidadResult,
      originalidad: originalidadResult,
      impacto: impactoResult,
      sostenibilidad: sostenibilidadResult,
      resumen: {
        puntaje_intencionalidad,
        puntaje_originalidad,
        puntaje_impacto,
        puntaje_sostenibilidad,
        puntaje_total,
        puntaje_maximo,
        porcentaje,
        nivel_final,
      },
      timestamp: new Date().toISOString(),
    };

    console.log("✅ Evaluación completada:", resultadoFinal.resumen);

    return jsonResponse(
      {
        success: true,
        evaluation: resultadoFinal,
      },
      200
    );
  } catch (error) {
    console.error("❌ Error en evaluate-final-cnpie-2a:", error);
    const message =
      error instanceof Error ? error.message : "Error interno del servidor";
    return jsonResponse(
      {
        success: false,
        error: message,
      },
      500
    );
  }
});
