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
    console.log('Template ID:', template_id);
    console.log('Session data:', JSON.stringify(session_data, null, 2));

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
    console.log('Template content:', JSON.stringify(template, null, 2));

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
      console.log('Accelerator 3 data:', JSON.stringify(accelerator3Data, null, 2));
    } else {
      console.log('No accelerator 3 data found');
    }

    // Extract context data with better defaults
    const grado = accelerator3Data?.priorities?.[0]?.grado || 
                  session_data.context_data?.["1"] || 
                  session_data.context_data?.[1] || 
                  'Primaria';
    const area = accelerator3Data?.priorities?.[0]?.area || 'Matemática';
    const competencia = accelerator3Data?.priorities?.[0]?.competencia || 'Resuelve problemas de cantidad';
    const tipoAula = session_data.context_data?.["1"] || session_data.context_data?.[1] || 'Urbana';
    const modalidad = session_data.context_data?.["2"] || session_data.context_data?.[2] || 'Regular';
    const recursos = session_data.context_data?.["3"] || session_data.context_data?.[3] || 'Computadores';

    console.log('Extracted context:', { grado, area, competencia, tipoAula, modalidad, recursos });

    // Create fallback strategies if needed
    const fallbackStrategies = [
      {
        momento: 'inicio',
        estrategia: 'Actividades de activación de conocimientos previos mediante lluvia de ideas',
        referencia: 'Orientaciones pedagógicas para la implementación del currículo - MINEDU'
      },
      {
        momento: 'inicio',
        estrategia: 'Presentación de casos problemáticos del contexto para motivar el aprendizaje',
        referencia: 'Guía de metodologías activas - MINEDU'
      },
      {
        momento: 'desarrollo',
        estrategia: 'Aprendizaje basado en proyectos con uso de TIC',
        referencia: 'Marco de referencia de TIC en la educación - MINEDU'
      },
      {
        momento: 'desarrollo',
        estrategia: 'Trabajo colaborativo en grupos heterogéneos',
        referencia: 'Orientaciones para el desarrollo de competencias - MINEDU'
      },
      {
        momento: 'cierre',
        estrategia: 'Reflexión metacognitiva sobre el proceso de aprendizaje',
        referencia: 'Orientaciones para la evaluación formativa - MINEDU'
      },
      {
        momento: 'cierre',
        estrategia: 'Consolidación de aprendizajes mediante organizadores visuales',
        referencia: 'Guía de buenas prácticas en el aula - MINEDU'
      }
    ];

    // Prepare the prompt for OpenAI with explicit JSON instructions
    const systemPrompt = `Eres un especialista en metodologías activas y diseño curricular del Ministerio de Educación del Perú. 

IMPORTANTE: Responde ÚNICAMENTE con un array JSON válido de 6 estrategias metodológicas, sin texto adicional.

El formato debe ser exactamente así:
[
  {
    "momento": "inicio",
    "estrategia": "descripción de la estrategia",
    "referencia": "documento específico del MINEDU"
  }
]

Debes generar exactamente 6 estrategias: 2 para "inicio", 2 para "desarrollo", 2 para "cierre".`;

    const userPrompt = `Genera 6 estrategias metodológicas activas para:

CONTEXTO EDUCATIVO:
- Grado: ${grado}
- Área: ${area}
- Competencia: ${competencia}
- Tipo de aula: ${tipoAula}
- Modalidad: ${modalidad}
- Recursos TIC: ${recursos}

REQUERIMIENTOS:
1. 2 estrategias para el momento de INICIO
2. 2 estrategias para el momento de DESARROLLO  
3. 2 estrategias para el momento de CIERRE
4. Cada estrategia debe estar alineada con documentos oficiales del MINEDU
5. Considera el uso de los recursos TIC disponibles
6. Las estrategias deben ser específicas para el grado y área indicados

Responde SOLO con el array JSON, sin explicaciones adicionales.`;

    console.log('Sending prompt to OpenAI...');

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
        temperature: 0.3,
        max_tokens: 2000
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error:', data);
      throw new Error(data.error?.message || 'Error from OpenAI API');
    }

    const aiResponse = data.choices[0].message.content;
    console.log('Raw OpenAI response:', aiResponse);

    // Try to parse as JSON with improved fallback
    let strategiesArray;
    try {
      // Clean the response to extract JSON
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        strategiesArray = JSON.parse(jsonMatch[0]);
      } else {
        strategiesArray = JSON.parse(aiResponse);
      }
      
      console.log('Successfully parsed strategies:', strategiesArray);
      
      // Validate structure
      if (!Array.isArray(strategiesArray) || strategiesArray.length === 0) {
        throw new Error('Invalid strategy format');
      }
      
      // Ensure all strategies have required fields
      strategiesArray = strategiesArray.map((strategy, index) => ({
        momento: strategy.momento || (index < 2 ? 'inicio' : index < 4 ? 'desarrollo' : 'cierre'),
        estrategia: strategy.estrategia || strategy.description || `Estrategia ${index + 1}`,
        referencia: strategy.referencia || strategy.reference || 'Documentos MINEDU'
      }));
      
    } catch (parseError) {
      console.log('JSON parsing failed, using fallback strategies:', parseError);
      strategiesArray = fallbackStrategies;
    }

    // Final validation - ensure we have exactly 6 strategies
    if (strategiesArray.length < 6) {
      console.log('Not enough strategies, padding with fallbacks');
      const needed = 6 - strategiesArray.length;
      strategiesArray = [...strategiesArray, ...fallbackStrategies.slice(0, needed)];
    }

    console.log('Final strategies array:', strategiesArray);

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
            <p><strong>Contexto:</strong> ${tipoAula} - ${modalidad} - ${recursos}</p>
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
**Contexto:** ${tipoAula} - ${modalidad} - ${recursos}

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
    console.log('Final result structure:', JSON.stringify(result, null, 2));

    return new Response(JSON.stringify({
      success: true,
      result: result,  // Changed from 'content' to 'result'
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