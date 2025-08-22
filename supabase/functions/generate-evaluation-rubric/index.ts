import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { unidad_data_min, rubric_style } = await req.json();
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (!unidad_data_min) {
      throw new Error('Missing required parameter: unidad_data_min');
    }

    // Validate required fields
    if (!unidad_data_min.proposito || !unidad_data_min.evidencias) {
      return new Response(JSON.stringify({
        success: false,
        error: "unidad_incompleta",
        faltantes: [
          !unidad_data_min.proposito ? "proposito" : null,
          !unidad_data_min.evidencias ? "evidencias" : null
        ].filter(Boolean)
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Generating evaluation rubric for:', {
      titulo: unidad_data_min.titulo,
      area: unidad_data_min.area_curricular,
      style: rubric_style || 'analitica'
    });

    const systemPrompt = `Eres un especialista en evaluación educativa en Perú. 
Diseñas rúbricas analíticas cortas (4–6 criterios máximo), con descriptores progresivos alineados al CNEB. 
Cada criterio debe estar vinculado a las evidencias de la unidad. 
Incluye al menos un descriptor que considere pertinencia cultural o lingüística si el diagnóstico lo sugiere. 
Responde SIEMPRE en JSON válido, sin markdown. 
Si faltan datos críticos, devuelve error tipado.`;

    const userPrompt = `Genera una rúbrica de evaluación analítica para esta unidad. 
Debe contener 4–6 criterios observables, cada uno con 3 niveles (Inicial, En proceso, Logro). 
Los criterios deben estar vinculados a las evidencias de aprendizaje de la unidad.

DATOS DE LA UNIDAD:
Título: ${unidad_data_min.titulo}
Área: ${unidad_data_min.area_curricular}
Grado: ${unidad_data_min.grado}
Propósito: ${unidad_data_min.proposito}
Evidencias: ${unidad_data_min.evidencias}
Competencias: ${unidad_data_min.competencias_ids}

Devuelve también un campo 'alineacion_evidencias' explicando cómo los criterios se relacionan con las evidencias.`;

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

    let rubricResult;
    try {
      rubricResult = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      throw new Error('Invalid AI response format');
    }

    // Validate response structure
    if (!rubricResult.titulo || !rubricResult.criterios) {
      throw new Error('AI response missing required fields');
    }

    console.log('Evaluation rubric generated successfully');

    return new Response(JSON.stringify({
      success: true,
      rubrica: rubricResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-evaluation-rubric:', error);
    
    const requestId = crypto.randomUUID();
    const errorPreview = error.message.substring(0, 200);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      type: error.message.includes('Missing required') ? 'invalid_input' :
            error.message.includes('unidad_incompleta') ? 'invalid_input' :
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