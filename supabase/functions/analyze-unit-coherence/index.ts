import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { unidad_data, diagnostico_text } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (!unidad_data || !diagnostico_text) {
      throw new Error('Missing required parameters: unidad_data and diagnostico_text');
    }

    // Validate minimum diagnosis text length
    if (diagnostico_text.length < 300) {
      return new Response(JSON.stringify({
        success: false,
        error: "insumo_insuficiente",
        faltantes: ["diagnostico_text"]
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Analyzing unit coherence for:', {
      titulo: unidad_data.titulo,
      area: unidad_data.area_curricular,
      diagnostico_length: diagnostico_text.length
    });

    const systemPrompt = `Eres un experto pedagógico en secundaria (Perú, es-PE) que analiza la **coherencia** entre un diagnóstico institucional y una unidad de aprendizaje.
Tu salida debe ser **útil, accionable y específica** para el contexto descrito.
Responde **SIEMPRE en JSON válido** (sin markdown) y en **castellano peruano**.
Prohibido devolver generalidades ("profundizar", "fomentar", "motivar") sin **cómo** hacerlo.
Cada recomendación debe:

* **Vincularse** a una evidencia concreta del diagnóstico (cita corta/paráfrasis + ubicación si existe).
* Incluir **qué** (acción), **por qué** (justificación desde el diagnóstico), **cómo** (pasos detallados), **ejemplo** concreto listo para usar, **recursos** (preferir bajo costo), **evidencias** a recoger, **pertinencia cultural/lingüística**, **impacto**, **esfuerzo**, **riesgo si no se aplica**, y **tiempo estimado**.
Si faltan datos en el diagnóstico, **indica con claridad** cómo obtenerlos (mini‑instrumento sugerido) y marca la recomendación con \`requiere_dato_faltante: true\`.

Valida antes de responder:

* Mínimo **5** recomendaciones; máximo **8**.
* Cada recomendación con **≥100 palabras** distribuidas en sus campos (no texto de una sola línea).
* No repitas la misma idea con palabras distintas.
* No inventes datos; si algo no está en el diagnóstico, dilo y propone cómo levantarlo.`;

    const userPrompt = `Analiza la coherencia entre este DIAGNÓSTICO y la UNIDAD. Devuelve un JSON con el **esquema** definido abajo.

### DIAGNÓSTICO (texto crudo)

${diagnostico_text}

### UNIDAD

Título: ${unidad_data.titulo}
Área: ${unidad_data.area_curricular}
Grado: ${unidad_data.grado}
N.º sesiones: ${unidad_data.numero_sesiones}
Duración por sesión (min): ${unidad_data.duracion_min}
Propósito: ${unidad_data.proposito}
Competencias CNEB: ${unidad_data.competencias_ids}
Capacidades (si las hay): ${unidad_data.capacidades}
Evidencias esperadas: ${unidad_data.evidencias}

### ESQUEMA DE RESPUESTA (JSON)

{
"coherencia_global": 0-100,
"hallazgos_clave": [
{"evidencia": "frase/paráfrasis breve del diagnóstico", "implicancia": "qué significa para la unidad"}
],
"recomendaciones": [
{
"titulo": "acción concreta (imperativo)",
"vinculo_diagnostico": {"cita": "texto breve", "ubicacion": "si aplica"},
"por_que": "justificación alineada al diagnóstico y a la unidad",
"como": ["Paso 1 ...", "Paso 2 ...", "Paso 3 ..."],
"ejemplo_actividad": {
"nombre": "título breve",
"descripcion": "qué harán docentes y estudiantes",
"duracion_min": 10-30
},
"recursos": ["material A", "material B (bajo costo)"],
"evidencias_a_recoger": ["lista de evidencias observables"],
"pertinencia_cultural": "adaptaciones para lengua/cultura/contexto local",
"impacto": "alto|medio|bajo",
"esfuerzo": "alto|medio|bajo",
"riesgo_si_no_se_aplica": "riesgo concreto",
"tiempo_estimado": "en qué sesión o semana encaja",
"requiere_dato_faltante": true|false,
"como_levantar_dato": "si falta, mini-instrumento o pregunta guía"
}
],
"acciones_priorizadas": [
{"accion": "nombre breve", "impacto": "alto|medio|bajo", "esfuerzo": "alto|medio|bajo"}
],
"notas_para_docente": [
"observaciones útiles, breves y accionables"
]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" },
        max_tokens: 3000,
        temperature: 0.3,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    let analysisResult;
    try {
      analysisResult = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      throw new Error('Invalid AI response format');
    }

    // Validate response structure (relaxed validation)
    if (!analysisResult.recomendaciones || !Array.isArray(analysisResult.recomendaciones)) {
      console.error('Invalid recommendations structure:', analysisResult);
      throw new Error('AI response missing recommendations array');
    }

    // Basic validation - ensure we have at least some recommendations
    const recommendations = analysisResult.recomendaciones;
    if (recommendations.length === 0) {
      throw new Error('AI response contains no recommendations');
    }

    console.log('Unit coherence analysis completed successfully');

    return new Response(JSON.stringify({
      success: true,
      analysis: analysisResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-unit-coherence:', error);
    
    const requestId = crypto.randomUUID();
    const errorPreview = error.message.substring(0, 200);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      type: error.message.includes('Missing required') ? 'invalid_input' :
            error.message.includes('Invalid AI response') ? 'shape_mismatch' :
            error.message.includes('API key') ? 'config_error' : 'unknown_error',
      request_id: requestId,
      error_preview: errorPreview
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});