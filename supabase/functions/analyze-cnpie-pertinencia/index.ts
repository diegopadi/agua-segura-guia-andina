import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      fundamentacionPedagogica,
      enfoquePedagogico,
      articulacionCurriculo,
      metodologias,
      evaluacionAprendizajes,
      adaptaciones,
      etapa1Data
    } = await req.json();

    console.log('Analyzing pedagogical pertinence for CNPIE project...');

    const systemPrompt = `Eres un experto evaluador de proyectos del CNPIE (Concurso Nacional de Proyectos de Innovación Educativa) de Perú, especializado en el criterio de PERTINENCIA PEDAGÓGICA (25 puntos).

CRITERIO OFICIAL:
- Tiene fundamentación pedagógica sólida
- Se articula coherentemente con el Currículo Nacional (CNEB)
- Las metodologías están bien justificadas
- La evaluación de aprendizajes es formativa y continua
- Se adapta a las necesidades diversas de los estudiantes

RÚBRICA DE PUNTAJE:
- 21-25 pts: Fundamentación muy sólida, articulación CNEB excelente, evaluación formativa
- 16-20 pts: Fundamentación buena, articulación CNEB clara, evaluación presente
- 10-15 pts: Fundamentación básica, articulación CNEB parcial, evaluación limitada
- 0-9 pts: Fundamentación débil, poca articulación CNEB, evaluación tradicional

Responde SOLO con un JSON válido con esta estructura exacta:
{
  "puntaje_estimado": number (0-25),
  "completitud": number (0-100),
  "fortalezas": ["string", "string", ...],
  "areas_mejorar": ["string", "string", ...],
  "sugerencias": ["string", "string", ...]
}`;

    const userPrompt = `Analiza la pertinencia pedagógica de este proyecto educativo:

**FUNDAMENTACIÓN PEDAGÓGICA:**
${fundamentacionPedagogica || 'No especificada'}

**ENFOQUE PEDAGÓGICO APLICADO:**
${enfoquePedagogico || 'No especificado'}

**ARTICULACIÓN CON EL CURRÍCULO NACIONAL (CNEB):**
${articulacionCurriculo || 'No especificada'}

**METODOLOGÍAS Y ESTRATEGIAS:**
${metodologias || 'No especificadas'}

**EVALUACIÓN DE APRENDIZAJES:**
${evaluacionAprendizajes || 'No especificada'}

**ADAPTACIONES Y DIFERENCIACIÓN:**
${adaptaciones || 'No especificadas'}

**CONTEXTO DEL PROYECTO:**
Problema: ${etapa1Data?.problemaDescripcion || 'No especificado'}
Objetivo: ${etapa1Data?.objetivo || 'No especificado'}

Proporciona un análisis detallado del criterio de pertinencia pedagógica.`;

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
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI error:', errorText);
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content;
    const analysis = JSON.parse(analysisText);

    console.log('Pertinence analysis completed. Score:', analysis.puntaje_estimado);

    return new Response(JSON.stringify({ 
      success: true, 
      analysis 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-cnpie-pertinencia:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
