import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { acceleratorsData, profileData } = await req.json();

    console.log('[generate-accelerators-summary] Processing data for:', profileData?.full_name);

    if (!acceleratorsData || acceleratorsData.length === 0) {
      throw new Error('No se encontraron datos de aceleradores');
    }

    // Preparar contexto para la IA
    const contexto = {
      acelerador1: acceleratorsData.find((a: any) => a.acelerador_number === 1)?.session_data || {},
      acelerador2: acceleratorsData.find((a: any) => a.acelerador_number === 2)?.session_data || {},
      acelerador3: acceleratorsData.find((a: any) => a.acelerador_number === 3)?.session_data || {},
      profile: profileData
    };

    const systemPrompt = `Eres un especialista en análisis educativo del MINEDU de Perú. 
Tu tarea es analizar los resultados de los aceleradores pedagógicos 1, 2 y 3 de Docentes.IA y generar un resumen ejecutivo de los hallazgos clave para el proyecto CNPIE 2025.

Los aceleradores contienen:
- Acelerador 1: Diagnóstico institucional y caracterización de estudiantes
- Acelerador 2: Priorización de necesidades y análisis de capacidades docentes  
- Acelerador 3: Análisis de coherencia curricular y estrategias pedagógicas

Debes generar entre 4-6 hallazgos clave que:
1. Resuman las necesidades prioritarias identificadas
2. Destaquen fortalezas institucionales o comunitarias
3. Identifiquen áreas de mejora específicas
4. Sean concretos y orientados a la acción
5. Reflejen el contexto real del docente y su institución

Responde SOLO con JSON válido en este formato:
{
  "hallazgos": ["hallazgo 1", "hallazgo 2", "hallazgo 3", "hallazgo 4", "hallazgo 5"]
}

Cada hallazgo debe ser una frase completa de máximo 15 palabras.`;

    const userPrompt = `Analiza estos datos de los aceleradores pedagógicos:

ACELERADOR 1 (Diagnóstico):
${JSON.stringify(contexto.acelerador1, null, 2)}

ACELERADOR 2 (Priorización):
${JSON.stringify(contexto.acelerador2, null, 2)}

ACELERADOR 3 (Estrategias):
${JSON.stringify(contexto.acelerador3, null, 2)}

PERFIL DOCENTE:
- Nombre: ${profileData.full_name}
- Institución: ${profileData.ie_name}
- Región: ${profileData.ie_region}
- Provincia: ${profileData.ie_province}

Genera los hallazgos clave en formato JSON.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 800,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[generate-accelerators-summary] OpenAI error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    let summary;
    try {
      summary = JSON.parse(content);
    } catch (e) {
      console.error('[generate-accelerators-summary] Failed to parse JSON:', content);
      throw new Error('No se pudo parsear la respuesta de IA');
    }

    console.log('[generate-accelerators-summary] Generated summary:', summary);

    return new Response(
      JSON.stringify({ success: true, summary }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('[generate-accelerators-summary] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Error desconocido'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
