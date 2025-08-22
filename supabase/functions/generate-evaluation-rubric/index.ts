import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { unidad_data } = await req.json();
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (!unidad_data) {
      throw new Error('Missing required parameter: unidad_data');
    }

    // Validate required fields
    if (!unidad_data.proposito || !unidad_data.evidencias) {
      return new Response(JSON.stringify({
        success: false,
        error: "unidad_incompleta",
        faltantes: [
          !unidad_data.proposito ? "proposito" : null,
          !unidad_data.evidencias ? "evidencias" : null
        ].filter(Boolean)
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Generating evaluation rubric for:', {
      titulo: unidad_data.titulo,
      area: unidad_data.area_curricular
    });

    const systemPrompt = `Eres un especialista en evaluación educativa en Perú. 
Genera una rúbrica de evaluación con exactamente 4-8 criterios, cada uno con exactamente 3 niveles de desempeño.
Los niveles SIEMPRE deben ser: "Inicio", "Proceso", "Logro".
Responde SIEMPRE en JSON válido con la estructura exacta requerida.`;

    const userPrompt = `Genera una rúbrica de evaluación para esta unidad de aprendizaje.

DATOS DE LA UNIDAD:
- Título: ${unidad_data.titulo}
- Área: ${unidad_data.area_curricular}
- Grado: ${unidad_data.grado}
- Propósito: ${unidad_data.proposito}
- Evidencias: ${unidad_data.evidencias}

ESTRUCTURA JSON REQUERIDA:
{
  "levels": ["Inicio", "Proceso", "Logro"],
  "criteria": [
    {
      "criterio": "Nombre del criterio de evaluación",
      "descriptores": {
        "Inicio": "Descripción para nivel inicial",
        "Proceso": "Descripción para nivel en proceso",
        "Logro": "Descripción para nivel de logro"
      }
    }
  ]
}

REQUISITOS:
- Incluye entre 4 y 8 criterios de evaluación
- Cada criterio debe tener exactamente 3 descriptores (uno por cada nivel)
- Los criterios deben evaluar aspectos clave de las evidencias de la unidad
- Los descriptores deben ser progresivos y específicos

Genera la rúbrica ahora:`;

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
    if (!rubricResult.levels || !rubricResult.criteria) {
      throw new Error('AI response missing required fields: levels or criteria');
    }

    // Validate criteria count (4-8 criteria)
    if (!Array.isArray(rubricResult.criteria) || rubricResult.criteria.length < 4 || rubricResult.criteria.length > 8) {
      throw new Error(`Invalid criteria count: ${rubricResult.criteria.length}. Must be between 4-8.`);
    }

    // Validate each criterion has proper structure
    for (const criterion of rubricResult.criteria) {
      if (!criterion.criterio || !criterion.descriptores) {
        throw new Error('Invalid criterion structure');
      }
      const expectedLevels = ['Inicio', 'Proceso', 'Logro'];
      for (const level of expectedLevels) {
        if (!criterion.descriptores[level]) {
          throw new Error(`Missing descriptor for level: ${level}`);
        }
      }
    }

    console.log('Evaluation rubric generated successfully with', rubricResult.criteria.length, 'criteria');

    return new Response(JSON.stringify({
      success: true,
      estructura: rubricResult
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