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

    // Get Accelerator 3 results for context
    const accelerator3Response = await fetch(`${supabaseUrl}/functions/v1/get-accelerator3-results`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ session_id })
    });

    let accelerator3Data = null;
    if (accelerator3Response.ok) {
      accelerator3Data = await accelerator3Response.json();
    }

    // Extract context data
    const grado = accelerator3Data?.priorities?.[0]?.grado || session_data.context_data?.[0] || 'No especificado';
    const area = accelerator3Data?.priorities?.[0]?.area || 'No especificado';
    const competencia = accelerator3Data?.priorities?.[0]?.competencia || 'No especificado';
    const contexto = `${session_data.context_data?.[1] || 'No especificado'}, ${session_data.context_data?.[2] || 'No especificado'}`;

    // Replace template variables
    let promptWithVariables = template.prompt || template.user_prompt || '';
    promptWithVariables = promptWithVariables
      .replace(/\{\{grado\}\}/g, grado)
      .replace(/\{\{area\}\}/g, area)
      .replace(/\{\{competencia\}\}/g, competencia)
      .replace(/\{\{contexto\}\}/g, contexto);

    // Add additional context
    const enhancedPrompt = `${promptWithVariables}

CONTEXTO ADICIONAL:
- Tipo de aula: ${session_data.context_data?.[1] || 'No especificado'}
- Modalidad: ${session_data.context_data?.[2] || 'No especificado'}
- Recursos TIC disponibles: ${session_data.context_data?.[3] || 'No especificado'}
${session_data.uploaded_file ? `- Archivo de priorización: ${session_data.uploaded_file.name}` : ''}
${accelerator3Data?.priorities ? `- Prioridades identificadas: ${accelerator3Data.priorities.length}` : ''}`;

    const systemPrompt = template.system_prompt || 'Eres un especialista en metodologías activas y diseño curricular del Ministerio de Educación del Perú.';

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
          { role: 'user', content: enhancedPrompt }
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
    let strategiesArray;
    try {
      strategiesArray = JSON.parse(aiResponse);
    } catch {
      // If not valid JSON, try to extract strategies from text
      const lines = aiResponse.split('\n').filter(line => line.trim().length > 0);
      strategiesArray = lines.map((line, index) => ({
        momento: index < 2 ? 'inicio' : index < 4 ? 'desarrollo' : 'cierre',
        estrategia: line.trim(),
        referencia: 'Documentos MINEDU'
      }));
    }

    // Ensure we have an array of strategies
    if (!Array.isArray(strategiesArray)) {
      strategiesArray = [];
    }

    // Generate HTML content for display
    const generateHTML = (strategies) => {
      const momentos = {
        inicio: strategies.filter(s => s.momento === 'inicio'),
        desarrollo: strategies.filter(s => s.momento === 'desarrollo'),
        cierre: strategies.filter(s => s.momento === 'cierre')
      };

      return `
        <div class="estrategias-metodologicas">
          <h2>Estrategias Metodológicas Activas</h2>
          <div class="contexto">
            <p><strong>Grado:</strong> ${grado}</p>
            <p><strong>Área:</strong> ${area}</p>
            <p><strong>Competencia:</strong> ${competencia}</p>
            <p><strong>Contexto:</strong> ${contexto}</p>
          </div>
          
          <div class="momentos">
            <div class="momento">
              <h3>🚀 Momento de Inicio</h3>
              ${momentos.inicio.map(e => `
                <div class="estrategia">
                  <p>${e.estrategia}</p>
                  <small><em>Referencia: ${e.referencia}</em></small>
                </div>
              `).join('')}
            </div>
            
            <div class="momento">
              <h3>🔄 Momento de Desarrollo</h3>
              ${momentos.desarrollo.map(e => `
                <div class="estrategia">
                  <p>${e.estrategia}</p>
                  <small><em>Referencia: ${e.referencia}</em></small>
                </div>
              `).join('')}
            </div>
            
            <div class="momento">
              <h3>✅ Momento de Cierre</h3>
              ${momentos.cierre.map(e => `
                <div class="estrategia">
                  <p>${e.estrategia}</p>
                  <small><em>Referencia: ${e.referencia}</em></small>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    };

    // Generate markdown content
    const generateMarkdown = (strategies) => {
      const momentos = {
        inicio: strategies.filter(s => s.momento === 'inicio'),
        desarrollo: strategies.filter(s => s.momento === 'desarrollo'),
        cierre: strategies.filter(s => s.momento === 'cierre')
      };

      return `# Estrategias Metodológicas Activas

**Grado:** ${grado}  
**Área:** ${area}  
**Competencia:** ${competencia}  
**Contexto:** ${contexto}

## 🚀 Momento de Inicio
${momentos.inicio.map(e => `- ${e.estrategia}\n  *Referencia: ${e.referencia}*`).join('\n\n')}

## 🔄 Momento de Desarrollo
${momentos.desarrollo.map(e => `- ${e.estrategia}\n  *Referencia: ${e.referencia}*`).join('\n\n')}

## ✅ Momento de Cierre
${momentos.cierre.map(e => `- ${e.estrategia}\n  *Referencia: ${e.referencia}*`).join('\n\n')}`;
    };

    const result = {
      strategies: strategiesArray,
      html_content: generateHTML(strategiesArray),
      markdown_content: generateMarkdown(strategiesArray),
      context_analysis: `Estrategias generadas para ${grado} - ${area}, competencia: ${competencia}`,
      minedu_references: strategiesArray.map(s => s.referencia).filter((ref, index, arr) => arr.indexOf(ref) === index)
    };

    console.log('Generated strategies successfully');

    return new Response(JSON.stringify({
      success: true,
      content: result,
      strategies: strategiesArray,
      html_content: result.html_content,
      markdown_content: result.markdown_content,
      context_analysis: result.context_analysis,
      minedu_references: result.minedu_references
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