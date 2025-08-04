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

    // Get strategies from previous steps - check the correct data structure
    console.log('Session data structure for debugging:', JSON.stringify(session_data, null, 2));
    
    let strategies = [];
    
    // Try to get strategies from various possible locations
    if (session_data.strategies_result?.strategies) {
      strategies = session_data.strategies_result.strategies;
    } else if (session_data.refined_result?.strategies) {
      strategies = session_data.refined_result.strategies;
    } else if (session_data.ai_analysis_result?.strategies) {
      strategies = session_data.ai_analysis_result.strategies;
    }

    console.log('Found strategies:', strategies);
    console.log('Strategies count:', strategies.length);
    console.log('Strategies structure:', Array.isArray(strategies) ? 'Array' : typeof strategies);

    // Prepare context variables - handle both array of objects and array of strings
    let estrategiasText = '';
    if (Array.isArray(strategies)) {
      estrategiasText = strategies.map((strategy: any, index: number) => {
        if (typeof strategy === 'string') {
          return `${index + 1}. ${strategy}`;
        } else if (strategy && strategy.estrategia) {
          return `${index + 1}. ${strategy.estrategia} (${strategy.momento})`;
        } else {
          return `${index + 1}. ${JSON.stringify(strategy)}`;
        }
      }).join('\n');
    } else if (typeof strategies === 'string') {
      // Handle the case where strategies might be stored as a single text block
      estrategiasText = strategies;
    }

    console.log('Final estrategias text for prompt:', estrategiasText);

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
    console.log('AI Response content:', aiResponse);
    
    // Parse JSON response
    let parsedResult;
    try {
      // Clean the content to ensure it's valid JSON
      const cleanContent = aiResponse.trim().replace(/```json\n?|\n?```/g, '');
      console.log('Cleaned content for parsing:', cleanContent);
      
      parsedResult = JSON.parse(cleanContent);
      console.log('Parsed result:', JSON.stringify(parsedResult, null, 2));
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      console.error('Raw AI response:', aiResponse);
      throw new Error(`Invalid JSON response from AI: ${parseError.message}`);
    }

    let questions = parsedResult.preguntas || parsedResult.questions || parsedResult || [];
    
    // Ensure questions is an array
    if (!Array.isArray(questions)) {
      console.error('Questions is not an array:', questions);
      throw new Error('AI response should contain an array of questions');
    }
    
    // Validate and normalize question structure
    questions = questions.map((q, index) => ({
      id: q.id || index + 1,
      enfoque: q.enfoque || q.focus || 'general',
      pregunta: q.pregunta || q.question || q.text || 'Pregunta no disponible'
    }));
    
    console.log('Final normalized questions:', JSON.stringify(questions, null, 2));
    
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