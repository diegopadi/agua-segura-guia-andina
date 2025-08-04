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

    console.log('Generating profundization questions for session:', session_id);

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

    // Get Accelerator 3 results for context
    const getAc3ResultsResponse = await fetch(`${supabaseUrl}/functions/v1/get-accelerator3-results`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ session_id })
    });

    let ac3Context = {};
    if (getAc3ResultsResponse.ok) {
      const ac3Data = await getAc3ResultsResponse.json();
      ac3Context = {
        grado: ac3Data.priorities?.[0]?.grado || 'No especificado',
        area: ac3Data.priorities?.[0]?.area || 'No especificado', 
        competencia: ac3Data.priorities?.[0]?.competencia || 'No especificado'
      };
    }

    // Get strategies from previous steps (prefer refined over original)
    const strategies = session_data.refined_result?.strategies || 
                      session_data.ai_analysis_result?.strategies || 
                      [];

    // Prepare context variables
    const estrategiasText = strategies.map((strategy: string, index: number) => 
      `${index + 1}. ${strategy}`
    ).join('\n');

    const contextoAdicional = `
Características del aula: ${session_data.context_data || 'No especificado'}
Refinamientos aplicados: ${session_data.refined_result ? 'Sí' : 'No'}
`;

    // Replace template variables
    let userPrompt = template.user_prompt
      .replace('{{grado}}', ac3Context.grado)
      .replace('{{area}}', ac3Context.area) 
      .replace('{{competencia}}', ac3Context.competencia)
      .replace('{{estrategias}}', estrategiasText)
      .replace('{{contexto_adicional}}', contextoAdicional);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: template.system_prompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Error from OpenAI API');
    }

    const aiResponse = data.choices[0].message.content;
    
    // Parse JSON response
    let parsedResult;
    try {
      parsedResult = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      throw new Error('Invalid JSON response from AI');
    }

    const questions = parsedResult.preguntas || [];
    
    console.log('Generated profundization questions successfully:', questions.length);

    return new Response(JSON.stringify({
      success: true,
      content: aiResponse,
      questions: questions,
      context: ac3Context,
      strategies_count: strategies.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-profundization-questions:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});