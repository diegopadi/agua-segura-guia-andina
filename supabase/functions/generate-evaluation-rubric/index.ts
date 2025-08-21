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

    console.log('Generating evaluation rubric for:', {
      titulo: unidad_data.titulo,
      area: unidad_data.area_curricular,
      competencias: unidad_data.competencias_ids
    });

    // PLACEHOLDER: AI prompt will be provided by user later
    const prompt = `[AI PROMPT TO BE CONFIGURED]
    
    Unidad: ${JSON.stringify(unidad_data, null, 2)}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: 'You are an educational expert creating evaluation rubrics.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: "json_object" },
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    let rubricStructure;
    try {
      rubricStructure = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      throw new Error('Invalid AI response format');
    }

    // Validate response structure
    if (!rubricStructure.levels || !rubricStructure.criteria || !Array.isArray(rubricStructure.criteria)) {
      throw new Error('AI response missing required rubric structure');
    }

    // Ensure max 8 criteria
    if (rubricStructure.criteria.length > 8) {
      rubricStructure.criteria = rubricStructure.criteria.slice(0, 8);
    }

    console.log('Evaluation rubric generated successfully');

    return new Response(JSON.stringify({
      success: true,
      estructura: rubricStructure
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-evaluation-rubric:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      type: error.message.includes('Missing required') ? 'invalid_input' :
            error.message.includes('Invalid AI response') ? 'shape_mismatch' :
            error.message.includes('API key') ? 'config_error' : 'unknown_error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});