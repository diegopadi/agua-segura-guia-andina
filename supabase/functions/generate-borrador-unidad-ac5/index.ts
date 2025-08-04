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
    const { questionResponses, sessionData } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    console.log('Fetching template: plantilla12_borrador_unidad_ac5');

    // Obtener plantilla
    const { data: template, error: templateError } = await supabaseClient
      .from('templates')
      .select('content')
      .eq('name', 'plantilla12_borrador_unidad_ac5')
      .single();

    if (templateError) {
      console.error('Template error:', templateError);
      throw new Error(`Template not found: ${templateError.message}`);
    }

    const basePrompt = template.content.prompt;

    // Preparar el contexto con las respuestas a las preguntas clave
    const contextualPrompt = `${basePrompt}

DATOS DE ENTRADA (JSON con respuestas a preguntas clave):

${JSON.stringify(questionResponses, null, 2)}

CONTEXTO ADICIONAL DE LA SESIÓN:

Competencia seleccionada:
${JSON.stringify(sessionData?.insumos?.selectedCompetencies || [], null, 2)}

Estrategias del Acelerador 4:
${JSON.stringify(sessionData?.insumos?.a4Results || {}, null, 2)}

Respuestas del contexto PCI:
${JSON.stringify(sessionData?.insumos?.contextQuestions || [], null, 2)}

INSTRUCCIONES ESPECÍFICAS:
- Genera un HTML bien estructurado con las 7 secciones mencionadas
- Cada sección debe tener aproximadamente una página de contenido
- Usa etiquetas semánticas HTML5 apropiadas
- Asegúrate de que el contenido sea específico y detallado
- Incluye ejemplos concretos basados en las respuestas proporcionadas`;

    console.log('Sending request to OpenAI for unit draft generation');

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
    const htmlContent = aiResult.choices[0].message.content;

    console.log('AI response received, returning HTML draft');

    return new Response(
      JSON.stringify({
        success: true,
        htmlContent: htmlContent,
        raw_response: htmlContent
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