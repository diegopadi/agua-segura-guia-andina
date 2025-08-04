import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id, session_data, template_id } = await req.json();

    console.log('Processing strategies generation for session:', session_id);

    // Get template from database
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const templateResponse = await fetch(`${supabaseUrl}/rest/v1/templates?name=eq.${template_id}&select=*`, {
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      }
    });

    if (!templateResponse.ok) {
      throw new Error('Error fetching template');
    }

    const templates = await templateResponse.json();
    if (templates.length === 0) {
      throw new Error(`Template ${template_id} not found`);
    }

    const template = templates[0].content;

    // Prepare context from session data
    const context = {
      uploaded_file: session_data.uploaded_file,
      context_data: session_data.context_data,
      classroom_type: session_data.context_data?.[1], // Urbana/Rural
      modality: session_data.context_data?.[2], // Multigrado/EIB/Regular
      tic_resources: session_data.context_data?.[3]
    };

    const systemPrompt = template.system_prompt;
    const userPrompt = `${template.user_prompt}

CONTEXTO DEL AULA:
- Tipo de aula: ${context.classroom_type || 'No especificado'}
- Modalidad: ${context.modality || 'No especificado'}
- Recursos TIC disponibles: ${context.tic_resources || 'No especificado'}

INFORME DE PRIORIZACIÓN CARGADO:
${context.uploaded_file ? `Archivo: ${context.uploaded_file.name}` : 'No se cargó archivo'}

Por favor, genera exactamente 6 estrategias metodológicas activas basadas en este contexto.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Error from OpenAI API');
    }

    const aiResponse = data.choices[0].message.content;

    // Try to parse as JSON, fallback to text
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch {
      // If not valid JSON, create a structured response
      parsedResponse = {
        strategies: aiResponse.split('\n').filter(line => line.trim().length > 0),
        context_analysis: `Análisis basado en: ${context.classroom_type}, ${context.modality}`,
        minedu_references: ['Documentos MINEDU consultados durante la generación']
      };
    }

    console.log('Generated strategies successfully');

    return new Response(JSON.stringify({
      success: true,
      content: parsedResponse,
      strategies: parsedResponse.strategies || [],
      context_analysis: parsedResponse.context_analysis,
      minedu_references: parsedResponse.minedu_references || []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-strategies-ac4:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});