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
      metodologiaDescripcion, 
      nombreMetodologia,
      estrategias,
      pensamientoCritico,
      justificacionInnovacion,
      pertinenciaContexto,
      competenciasCNEB,
      etapa1Data
    } = await req.json();

    console.log('Analyzing methodology originality for CNPIE project...');

    const systemPrompt = `Eres un experto evaluador de proyectos del CNPIE (Concurso Nacional de Proyectos de Innovación Educativa) de Perú, especializado en el criterio de ORIGINALIDAD Y METODOLOGÍA (30 puntos).

CRITERIO OFICIAL:
- La metodología es innovadora (no tradicional)
- Promueve el pensamiento crítico y la resolución de problemas
- Está bien fundamentada pedagógicamente
- Incluye estrategias concretas y replicables
- Está contextualizada al entorno específico

RÚBRICA DE PUNTAJE:
- 25-30 pts: Metodología altamente innovadora, fundamentación sólida, pensamiento crítico explícito
- 18-24 pts: Metodología innovadora con algunos elementos tradicionales, pensamiento crítico presente
- 10-17 pts: Metodología con pocos elementos innovadores, pensamiento crítico limitado
- 0-9 pts: Metodología tradicional sin innovación clara

Responde SOLO con un JSON válido con esta estructura exacta:
{
  "puntaje_estimado": number (0-30),
  "completitud": number (0-100),
  "fortalezas": ["string", "string", ...],
  "areas_mejorar": ["string", "string", ...],
  "sugerencias": ["string", "string", ...]
}`;

    const estrategiasTexto = estrategias?.length > 0 
      ? estrategias.map((e: any, i: number) => `${i+1}. ${e.nombre} (${e.frecuencia}): ${e.descripcion}`).join('\n')
      : 'No especificadas';

    const userPrompt = `Analiza la originalidad y metodología de este proyecto educativo:

**METODOLOGÍA:**
Nombre: ${nombreMetodologia || 'No especificado'}
Descripción: ${metodologiaDescripcion || 'No especificada'}

**PENSAMIENTO CRÍTICO:**
${pensamientoCritico || 'No especificado'}

**JUSTIFICACIÓN DE INNOVACIÓN:**
${justificacionInnovacion || 'No especificada'}

**PERTINENCIA AL CONTEXTO:**
${pertinenciaContexto || 'No especificada'}

**ESTRATEGIAS PEDAGÓGICAS (${estrategias?.length || 0}):**
${estrategiasTexto}

**COMPETENCIAS CNEB DESARROLLADAS:** ${competenciasCNEB?.join(', ') || 'No especificadas'}

**CONTEXTO DEL PROYECTO (Etapa 1):**
Problema: ${etapa1Data?.problemaDescripcion || 'No especificado'}
Objetivo: ${etapa1Data?.objetivo || 'No especificado'}
Contexto: ${etapa1Data?.contextoEscolar || 'No especificado'}

Proporciona un análisis detallado del criterio de originalidad y metodología.`;

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

    console.log('Originality analysis completed. Score:', analysis.puntaje_estimado);

    return new Response(JSON.stringify({ 
      success: true, 
      analysis 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-cnpie-originalidad:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
