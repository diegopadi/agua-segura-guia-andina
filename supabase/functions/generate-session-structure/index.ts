import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { unidad_data_min } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (!unidad_data_min) {
      throw new Error('Missing required parameter: unidad_data_min');
    }

    console.log('Generating session structure for:', {
      titulo: unidad_data_min.titulo,
      numero_sesiones: unidad_data_min.numero_sesiones,
      duracion: unidad_data_min.duracion_min
    });

    const systemPrompt = `Eres un diseñador curricular que crea plantillas de sesiones para secundaria en Perú. 
Diseñas estructuras generales por momentos pedagógicos (inicio, desarrollo, cierre) que reflejen el proceso estándar (activación, conflicto cognitivo, aprendizaje activo, evaluación formativa, cierre reflexivo). 
No diseñes sesiones completas individuales, solo plantillas reutilizables. 
Agrega una mini-rúbrica observacional simple (2–4 criterios). 
Responde SIEMPRE en JSON válido, sin markdown.`;

    const userPrompt = `Diseña plantillas pedagógicas generales para una unidad de ${unidad_data_min.numero_sesiones} sesiones de ${unidad_data_min.duracion_min} minutos. 
Incluye una mini-rúbrica observacional con 2–4 criterios simples. 
Si detectas posibles ajustes a la unidad (ej. reducir sesiones, modificar propósito), sugiérelos solo como comentarios en un campo aparte.

DATOS DE LA UNIDAD:
Título: ${unidad_data_min.titulo}
Área: ${unidad_data_min.area_curricular} 
Grado: ${unidad_data_min.grado}
Propósito: ${unidad_data_min.proposito}
Competencias: ${unidad_data_min.competencias_ids}`;

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
        max_completion_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    let sessionStructure;
    try {
      sessionStructure = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      throw new Error('Invalid AI response format');
    }

    // Validate response structure
    if (!sessionStructure.plantilla_inicio || !sessionStructure.plantilla_desarrollo || !sessionStructure.plantilla_cierre) {
      throw new Error('AI response missing required template fields');
    }

    console.log('Session structure generated successfully');

    return new Response(JSON.stringify({
      success: true,
      structure: sessionStructure
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-session-structure:', error);
    
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