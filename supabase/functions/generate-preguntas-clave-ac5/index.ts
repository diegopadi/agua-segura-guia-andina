import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionData } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    console.log('Fetching template: plantilla11_preguntas_clave_ac5');

    // Obtener plantilla
    const { data: template, error: templateError } = await supabaseClient
      .from('templates')
      .select('content')
      .eq('name', 'plantilla11_preguntas_clave_ac5')
      .single();

    if (templateError) {
      console.error('Template error:', templateError);
      throw new Error(`Template not found: ${templateError.message}`);
    }

    const basePrompt = template.content.prompt;

    // Construir contexto específico con los datos de la sesión
    const { insumos } = sessionData;
    
    const contextualPrompt = `${basePrompt}

CONTEXTO ESPECÍFICO DE LA SESIÓN:

Estrategias priorizadas del Acelerador 4:
${JSON.stringify(insumos?.a4Results || {}, null, 2)}

Competencia CNEB seleccionada:
${JSON.stringify(insumos?.selectedCompetencies || [], null, 2)}

Respuestas al cuestionario de contexto PCI:
${JSON.stringify(insumos?.contextQuestions || [], null, 2)}

Con esta información específica, genera exactamente 10 preguntas clave distribuidas en las 10 categorías mencionadas, que sean pertinentes para el contexto educativo específico de este docente.`;

    console.log('Sending request to OpenAI for key questions generation');

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: contextualPrompt
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const aiResult = await openAIResponse.json();
    const preguntasText = aiResult.choices[0].message.content;

    console.log('AI response received, parsing key questions');

    // Parsear el JSON de preguntas clave
    const jsonMatch = preguntasText.match(/```json\n([\s\S]*?)\n```/);
    let preguntasList;
    
    if (jsonMatch) {
      try {
        preguntasList = JSON.parse(jsonMatch[1]);
      } catch (e) {
        console.error('JSON parsing error:', e);
        throw new Error('Error parsing key questions JSON');
      }
    } else {
      throw new Error('No valid JSON found in AI response');
    }

    return new Response(
      JSON.stringify({
        success: true,
        questions: preguntasList,
        raw_response: preguntasText
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});