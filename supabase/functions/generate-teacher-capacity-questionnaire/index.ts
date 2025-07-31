import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body
    const { accelerator1Data, accelerator2Data } = await req.json();

    if (!accelerator1Data || !accelerator2Data) {
      throw new Error('Se requieren los datos de los Aceleradores 1 y 2');
    }

    // Get the template
    const { data: template, error: templateError } = await supabaseClient
      .from('templates')
      .select('content')
      .eq('name', 'teacher_capacity_questionnaire_template')
      .single();

    if (templateError || !template) {
      throw new Error('Error al obtener la plantilla del cuestionario');
    }

    const templateContent = template.content;

    // Prepare the AI prompt
    let aiPrompt = templateContent.ai_prompt
      .replace('{accelerator1_data}', JSON.stringify(accelerator1Data))
      .replace('{accelerator2_data}', JSON.stringify(accelerator2Data));

    console.log('Generating teacher capacity questionnaire with AI...');

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en educación ambiental hídrica. Responde siempre con JSON válido siguiendo exactamente la estructura solicitada.'
          },
          {
            role: 'user',
            content: aiPrompt
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`Error en la API de OpenAI: ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    const generatedContent = openaiData.choices[0].message.content;

    console.log('Generated questionnaire content:', generatedContent);

    // Parse the generated JSON
    let questionnaire;
    try {
      // Clean the response in case it has markdown formatting
      const cleanedContent = generatedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      questionnaire = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('Raw AI response:', generatedContent);
      throw new Error('Error al procesar la respuesta de la IA. Formato JSON inválido.');
    }

    // Validate the questionnaire structure
    if (!questionnaire.questions || !Array.isArray(questionnaire.questions)) {
      throw new Error('La respuesta de la IA no contiene preguntas válidas');
    }

    if (questionnaire.questions.length !== 10) {
      throw new Error(`Se esperaban 10 preguntas, pero se generaron ${questionnaire.questions.length}`);
    }

    // Validate each question has the required structure
    for (const question of questionnaire.questions) {
      if (!question.id || !question.dimension || !question.question_text || !question.options) {
        throw new Error('Estructura de pregunta inválida');
      }
      if (!Array.isArray(question.options) || question.options.length !== 5) {
        throw new Error('Cada pregunta debe tener exactamente 5 opciones');
      }
    }

    console.log('Teacher capacity questionnaire generated successfully');

    return new Response(
      JSON.stringify({ questionnaire }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in generate-teacher-capacity-questionnaire function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Error interno del servidor',
        details: 'Error al generar el cuestionario de capacidades docentes'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});