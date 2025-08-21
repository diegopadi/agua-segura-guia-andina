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

    console.log('Generating session structure for:', {
      titulo: unidad_data.titulo,
      numero_sesiones: unidad_data.numero_sesiones,
      duracion: unidad_data.duracion_min
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
          { role: 'system', content: 'You are an educational expert designing session structures.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: "json_object" },
        max_tokens: 4000,
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
    if (!sessionStructure.sessions || !Array.isArray(sessionStructure.sessions)) {
      throw new Error('AI response missing sessions array');
    }

    // Validate each session has required fields
    const validatedSessions = sessionStructure.sessions.map((session: any, index: number) => {
      if (!session.titulo || !session.inicio || !session.desarrollo || !session.cierre) {
        throw new Error(`Session ${index + 1} missing required fields`);
      }
      
      return {
        session_index: session.session_index || index + 1,
        titulo: session.titulo,
        inicio: session.inicio,
        desarrollo: session.desarrollo,
        cierre: session.cierre,
        evidencias: session.evidencias || [],
        rubrica_sesion: session.rubrica_sesion || { criteria: [] }
      };
    });

    console.log('Session structure generated successfully');

    return new Response(JSON.stringify({
      success: true,
      sessions: validatedSessions
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-session-structure:', error);
    
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