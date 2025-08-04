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
    const { session_id, message, chat_history, session_data, template_id } = await req.json();

    console.log('Processing chat refinement for session:', session_id);

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

    // Build conversation context
    const conversationMessages = [
      { 
        role: 'system', 
        content: `${template.system_prompt}

CONTEXTO DE LA SESIÓN:
- Estrategias generadas: ${JSON.stringify(session_data.ai_analysis_result?.strategies || [])}
- Contexto del aula: ${JSON.stringify(session_data.context_data || {})}

${template.chat_context}

Puedes:
1. Refinar y mejorar las estrategias existentes
2. Adaptar estrategias al contexto específico del aula
3. Generar preguntas de profundización (máximo 3)
4. Proporcionar sugerencias adicionales

Responde de manera conversacional y constructiva.`
      }
    ];

    // Add chat history
    chat_history.forEach((msg: any) => {
      conversationMessages.push({
        role: msg.role,
        content: msg.content
      });
    });

    // Add current message
    conversationMessages.push({
      role: 'user',
      content: message
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: conversationMessages,
        temperature: 0.8,
        max_tokens: 1000
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Error from OpenAI API');
    }

    const aiResponse = data.choices[0].message.content;

    // Check if this is a refinement request or question generation
    const isRefinementRequest = message.toLowerCase().includes('refina') || 
                               message.toLowerCase().includes('mejora') || 
                               message.toLowerCase().includes('ajusta');

    let refinedStrategies = null;
    if (isRefinementRequest && session_data.ai_analysis_result?.strategies) {
      // If it's a refinement, we might want to update the strategies
      refinedStrategies = session_data.ai_analysis_result.strategies; // In a real implementation, this would be parsed from the AI response
    }

    console.log('Chat refinement completed successfully');

    return new Response(JSON.stringify({
      success: true,
      response: aiResponse,
      refined_strategies: refinedStrategies
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat-strategies-refinement:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});