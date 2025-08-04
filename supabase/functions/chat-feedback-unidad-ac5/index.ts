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
    const { draftHtml, feedback } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    console.log('Fetching template: plantilla13_feedback_unidad_ac5');

    // Obtener plantilla
    const { data: template, error: templateError } = await supabaseClient
      .from('templates')
      .select('content')
      .eq('name', 'plantilla13_feedback_unidad_ac5')
      .single();

    if (templateError) {
      console.error('Template error:', templateError);
      throw new Error(`Template not found: ${templateError.message}`);
    }

    const basePrompt = template.content.prompt;

    // Preparar el contexto con el HTML actual y el feedback
    const contextualPrompt = `${basePrompt}

DATOS DE ENTRADA ESPECÍFICOS:

HTML Actual del Borrador:
${draftHtml}

Feedback del Docente:
${feedback}

INSTRUCCIONES ESPECÍFICAS:
- Analiza el feedback proporcionado
- Identifica qué sección(es) del HTML necesitan modificación
- Realiza únicamente los cambios solicitados en el feedback
- Mantén el formato HTML y la estructura existente
- Devuelve solo la(s) sección(es) modificada(s) y la justificación
- Recuerda: solo se permite 1 interacción de refinamiento`;

    console.log('Sending request to OpenAI for unit refinement');

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
        temperature: 0.6,
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const aiResult = await openAIResponse.json();
    const responseText = aiResult.choices[0].message.content;

    console.log('AI response received, parsing refinement');

    // Parsear el JSON de respuesta
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    let refinementResult;
    
    if (jsonMatch) {
      try {
        refinementResult = JSON.parse(jsonMatch[1]);
      } catch (e) {
        console.error('JSON parsing error:', e);
        throw new Error('Error parsing refinement JSON');
      }
    } else {
      // Si no hay JSON, interpretar como respuesta directa
      refinementResult = {
        updatedHtml: responseText,
        justification: "Refinamiento aplicado según feedback del docente"
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        updatedHtml: refinementResult.updatedHtml,
        justification: refinementResult.justification,
        raw_response: responseText
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