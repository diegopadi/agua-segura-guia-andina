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
    const { session_id, message, chat_history, session_data, template_id, refinement_used = false } = await req.json();

    console.log('Processing chat refinement for session:', session_id);
    console.log('Refinement already used:', refinement_used);

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

    // Detect if this is a strategy refinement request
    const isStrategyRefinementRequest = !refinement_used && (
      message.toLowerCase().includes('refina') || 
      message.toLowerCase().includes('mejora') || 
      message.toLowerCase().includes('ajusta') ||
      message.toLowerCase().includes('modifica') ||
      message.toLowerCase().includes('cambia')
    );

    console.log('Is strategy refinement request:', isStrategyRefinementRequest);

    // Build conversation context
    const systemPrompt = isStrategyRefinementRequest ? 
      `Eres un especialista en metodologías activas educativas. El usuario quiere refinar las estrategias generadas.

CONTEXTO EDUCATIVO:
- Estrategias actuales: ${JSON.stringify(session_data.strategies_result?.strategies || [])}
- Contexto del aula: ${JSON.stringify(session_data.context_data || {})}

INSTRUCCIONES PARA REFINAMIENTO:
1. Genera EXACTAMENTE 6 nuevas estrategias basadas en la solicitud del usuario
2. Mantén la estructura: 2 para inicio, 2 para desarrollo, 2 para cierre
3. Usa el formato JSON exacto:
[
  {
    "momento": "inicio",
    "estrategia": "descripción de la estrategia",
    "referencia": "referencia MINEDU"
  },
  ...
]

4. Al final de tu respuesta, incluye las estrategias en formato JSON entre las etiquetas ###JSON### y ###/JSON###

Responde de manera conversacional explicando los cambios que hiciste.` :
      
      `${template.system_prompt}

CONTEXTO DE LA SESIÓN:
- Estrategias generadas: ${JSON.stringify(session_data.strategies_result?.strategies || [])}
- Contexto del aula: ${JSON.stringify(session_data.context_data || {})}

${template.chat_context}

IMPORTANTE: El usuario ya usó su token de refinamiento único, solo puedes responder preguntas y dar explicaciones, NO generar nuevas estrategias.

Responde de manera conversacional y constructiva.`;

    const conversationMessages = [
      { 
        role: 'system', 
        content: systemPrompt
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

    let refinedResult = null;

    // Parse new strategies if this was a refinement request
    if (isStrategyRefinementRequest) {
      console.log('Processing strategy refinement');
      
      try {
        // Extract JSON from AI response
        const jsonMatch = aiResponse.match(/###JSON###([\s\S]*?)###\/JSON###/);
        if (jsonMatch) {
          const newStrategies = JSON.parse(jsonMatch[1].trim());
          console.log('Parsed new strategies:', newStrategies);

          // Generate new HTML and markdown content
          const htmlContent = generateHTMLContent(newStrategies, session_data.context_data);
          const markdownContent = generateMarkdownContent(newStrategies, session_data.context_data);

          refinedResult = {
            strategies: newStrategies,
            html_content: htmlContent,
            markdown_content: markdownContent,
            context_analysis: `Estrategias refinadas para ${session_data.context_data?.[1] || 'N/A'}`,
            minedu_references: newStrategies.map((s: any) => s.referencia).filter((r: any, i: number, arr: any[]) => arr.indexOf(r) === i)
          };

          console.log('Generated refined result');
        }
      } catch (error) {
        console.error('Error parsing refined strategies:', error);
      }
    }

    console.log('Chat refinement completed successfully');

    return new Response(JSON.stringify({
      success: true,
      response: aiResponse,
      refined_result: refinedResult
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

// Helper functions to generate content
function generateHTMLContent(strategies: any[], contextData: any) {
  const grado = contextData?.[1] || 'N/A';
  const modalidad = contextData?.[2] || 'N/A';
  const recursos = contextData?.[3] || 'N/A';

  const groupedStrategies = {
    inicio: strategies.filter(s => s.momento === 'inicio'),
    desarrollo: strategies.filter(s => s.momento === 'desarrollo'),
    cierre: strategies.filter(s => s.momento === 'cierre')
  };

  return `
        <div class="estrategias-metodologicas">
          <h2>Estrategias Metodológicas Activas (Refinadas)</h2>
          <div class="contexto">
            <p><strong>Grado:</strong> ${grado}</p>
            <p><strong>Modalidad:</strong> ${modalidad}</p>
            <p><strong>Recursos:</strong> ${recursos}</p>
          </div>
          
          <div class="momentos">
            <div class="momento">
              <h3>🚀 Momento de Inicio</h3>
              ${groupedStrategies.inicio.map(s => `
                <div class="estrategia">
                  <p>${s.estrategia}</p>
                  <small><em>Referencia: ${s.referencia}</em></small>
                </div>
              `).join('')}
            </div>
            
            <div class="momento">
              <h3>🔄 Momento de Desarrollo</h3>
              ${groupedStrategies.desarrollo.map(s => `
                <div class="estrategia">
                  <p>${s.estrategia}</p>
                  <small><em>Referencia: ${s.referencia}</em></small>
                </div>
              `).join('')}
            </div>
            
            <div class="momento">
              <h3>✅ Momento de Cierre</h3>
              ${groupedStrategies.cierre.map(s => `
                <div class="estrategia">
                  <p>${s.estrategia}</p>
                  <small><em>Referencia: ${s.referencia}</em></small>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
}

function generateMarkdownContent(strategies: any[], contextData: any) {
  const grado = contextData?.[1] || 'N/A';
  const modalidad = contextData?.[2] || 'N/A';
  const recursos = contextData?.[3] || 'N/A';

  const groupedStrategies = {
    inicio: strategies.filter(s => s.momento === 'inicio'),
    desarrollo: strategies.filter(s => s.momento === 'desarrollo'),
    cierre: strategies.filter(s => s.momento === 'cierre')
  };

  return `# Estrategias Metodológicas Activas (Refinadas)

**Grado:** ${grado}  
**Modalidad:** ${modalidad}  
**Recursos:** ${recursos}

## 🚀 Momento de Inicio
${groupedStrategies.inicio.map(s => `- ${s.estrategia}
  *Referencia: ${s.referencia}*`).join('\n\n')}

## 🔄 Momento de Desarrollo
${groupedStrategies.desarrollo.map(s => `- ${s.estrategia}
  *Referencia: ${s.referencia}*`).join('\n\n')}

## ✅ Momento de Cierre
${groupedStrategies.cierre.map(s => `- ${s.estrategia}
  *Referencia: ${s.referencia}*`).join('\n\n')}`;
}