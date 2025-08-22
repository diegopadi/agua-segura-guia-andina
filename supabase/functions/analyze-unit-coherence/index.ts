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

    const systemPrompt = `Eres un experto pedagógico que analiza la coherencia entre diagnósticos escolares y unidades de aprendizaje para educación secundaria en Perú. 
Tu tarea es: 
1) Verificar si el diagnóstico contiene elementos clave (problemas priorizados, pertinencia cultural/bilingüe, condiciones institucionales, etc.). 
2) Evaluar si el diagnóstico sustenta la unidad propuesta. 
3) Identificar vacíos y, si algo no está presente en el diagnóstico, recomendar explícitamente cómo debería incorporarse. 
Responde SIEMPRE en JSON válido, sin markdown. 
Si el diagnóstico tiene menos de 300 caracteres, devuelve error tipado.`;

    const userPrompt = `Analiza la coherencia entre el siguiente diagnóstico y la unidad de aprendizaje. Evalúa si el diagnóstico sustenta las competencias, el propósito y las evidencias de la unidad. 
Si no encuentras información cultural, bilingüe o institucional relevante, indícalo y sugiere cómo debería incorporarse.

DIAGNÓSTICO:
${diagnostico_text}

UNIDAD:
Título: ${unidad_data.titulo}
Área: ${unidad_data.area_curricular}
Grado: ${unidad_data.grado}
Sesiones: ${unidad_data.numero_sesiones}
Duración: ${unidad_data.duracion_min} minutos
Propósito: ${unidad_data.proposito}
Competencias: ${unidad_data.competencias_ids}
Capacidades: ${unidad_data.capacidades}
Evidencias: ${unidad_data.evidencias}

Devuelve un JSON con:
- coherencia_global (0-100) 
- hallazgos 
- recomendaciones 
- riesgos 
- acciones_priorizadas (con impacto/esfuerzo) 
- ajustes_sugeridos_unidad (máx. 3)`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 2000,
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

    // Validate response structure
    if (!analysisResult.coherencia_global || !analysisResult.hallazgos || !analysisResult.recomendaciones) {
      throw new Error('AI response missing required fields');
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