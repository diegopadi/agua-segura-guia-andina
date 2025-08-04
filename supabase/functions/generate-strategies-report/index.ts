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

    console.log('Generating strategies report for session:', session_id);

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

    // Compile all session data
    const strategies = session_data.ai_analysis_result?.strategies || 
                      session_data.refined_strategies || 
                      [];
    
    const context = session_data.context_data || {};
    const chatHistory = session_data.chat_history || [];
    const profundizationQuestions = session_data.profundization_questions || [];

    const systemPrompt = template.system_prompt;
    
    const userPrompt = `${template.user_prompt}

DATOS DE LA SESIÓN:

1. CONTEXTO EDUCATIVO:
- Tipo de aula: ${context[1] || 'No especificado'}
- Modalidad educativa: ${context[2] || 'No especificado'}
- Recursos TIC disponibles: ${context[3] || 'No especificado'}

2. ESTRATEGIAS METODOLÓGICAS SELECCIONADAS:
${strategies.map((strategy: string, index: number) => `${index + 1}. ${strategy}`).join('\n')}

3. PROCESO DE REFINAMIENTO:
${chatHistory.length > 0 ? 
  chatHistory.map((msg: any) => `${msg.role === 'user' ? 'Docente' : 'Asistente'}: ${msg.content}`).join('\n\n') : 
  'No se realizaron refinamientos adicionales'
}

4. PREGUNTAS DE PROFUNDIZACIÓN ABORDADAS:
${profundizationQuestions.length > 0 ? 
  profundizationQuestions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n') : 
  'Pendientes de análisis'
}

Genera un informe técnico completo que sirva como insumo directo para el Acelerador 5: Planificación y Preparación de Unidades.`;

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
        temperature: 0.6
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Error from OpenAI API');
    }

    const reportContent = data.choices[0].message.content;

    // Generate HTML version
    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Informe de Estrategias Metodológicas - Acelerador 4</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; margin: 40px; }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        h3 { color: #7f8c8d; }
        .strategy { background: #f8f9fa; padding: 15px; margin: 10px 0; border-left: 4px solid #3498db; }
        .context-box { background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .citation { font-style: italic; color: #666; background: #f0f0f0; padding: 10px; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>📋 Informe de Estrategias Metodológicas</h1>
    <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
    <p><strong>Acelerador:</strong> 4 - Selección de Estrategias Metodológicas</p>
    
    <div class="context-box">
        <h3>📍 Contexto Educativo</h3>
        <ul>
            <li><strong>Tipo de aula:</strong> ${context[1] || 'No especificado'}</li>
            <li><strong>Modalidad:</strong> ${context[2] || 'No especificado'}</li>
            <li><strong>Recursos TIC:</strong> ${context[3] || 'No especificado'}</li>
        </ul>
    </div>

    ${reportContent.replace(/\n/g, '<br>').replace(/##\s(.+)/g, '<h2>$1</h2>').replace(/###\s(.+)/g, '<h3>$1</h3>')}
    
    <hr>
    <p><em>Este informe ha sido generado automáticamente por el sistema de IA pedagógica y está listo para ser utilizado como insumo en el Acelerador 5: Planificación y Preparación de Unidades.</em></p>
</body>
</html>`;

    // Calculate report metrics
    const wordCount = reportContent.split(' ').length;
    const strategiesCount = strategies.length;
    const citationsCount = (reportContent.match(/MINEDU|Ministerio de Educación|CNEB/gi) || []).length;

    console.log('Generated strategies report successfully');

    return new Response(JSON.stringify({
      success: true,
      content: reportContent,
      html_content: htmlContent,
      summary: `Informe técnico con ${strategiesCount} estrategias metodológicas validadas y contextualizadas para ${context[1] || 'contexto'} ${context[2] || 'educativo'}.`,
      word_count: wordCount,
      strategies_count: strategiesCount,
      citations_count: citationsCount,
      ready_for_accelerator_5: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-strategies-report:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});