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

    // Get strategies from previous steps
    const strategies = session_data.ai_analysis_result?.strategies || 
                      session_data.refined_strategies || 
                      [];

    const chatHistory = session_data.chat_history || [];
    const context = session_data.context_data || {};

    const systemPrompt = `${template.system_prompt}

Tu tarea específica es formular exactamente 3 preguntas de profundización que ayuden a:
1. Evaluar la PERTINENCIA de las estrategias para el contexto específico
2. Verificar la VIABILIDAD con los recursos disponibles  
3. Ajustar el NIVEL DE COMPLEJIDAD según las características del aula

Contexto del aula:
- Tipo: ${context[1] || 'No especificado'}
- Modalidad: ${context[2] || 'No especificado'}
- Recursos TIC: ${context[3] || 'No especificado'}`;

    const userPrompt = `Basándote en las siguientes estrategias metodológicas:

${strategies.map((strategy: string, index: number) => `${index + 1}. ${strategy}`).join('\n')}

Y considerando el historial de refinamiento:
${chatHistory.length > 0 ? chatHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n') : 'Sin refinamientos previos'}

Formula exactamente 3 preguntas específicas que permitan:
1. Validar la pertinencia al contexto educativo
2. Evaluar la viabilidad con los recursos disponibles
3. Ajustar la complejidad según las necesidades del aula

Las preguntas deben ser concretas, orientadas a la acción y que permitan mejorar la implementación de las estrategias.`;

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

    // Extract questions from the response
    const questions = aiResponse
      .split('\n')
      .filter(line => line.match(/^\d+\./) || line.includes('?'))
      .slice(0, 3)
      .map(q => q.replace(/^\d+\.\s*/, '').trim());

    console.log('Generated profundization questions successfully');

    return new Response(JSON.stringify({
      success: true,
      content: aiResponse,
      questions: questions,
      analysis_focus: ['pertinencia', 'viabilidad', 'complejidad']
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