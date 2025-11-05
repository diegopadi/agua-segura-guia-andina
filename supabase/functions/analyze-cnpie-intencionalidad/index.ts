import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { problemaDescripcion, causas, consecuencias, objetivo, contexto } = await req.json();

    const systemPrompt = `Eres un experto en el CNPIE 2025, especializado en el criterio de Intencionalidad (20 pts).

CRITERIO INTENCIONALIDAD:
- El problema central está claramente descrito
- Se identifican causas del problema
- Se identifican consecuencias del problema  
- El objetivo del proyecto está bien definido

Tu tarea es analizar la información proporcionada y:
1. Evaluar la claridad del problema central
2. Validar que las causas sean relevantes y estén bien identificadas
3. Validar que las consecuencias sean coherentes con el problema
4. Verificar que el objetivo sea SMART (Específico, Medible, Alcanzable, Relevante, Temporal)
5. Proporcionar retroalimentación constructiva
6. Sugerir mejoras específicas

Responde en formato JSON.`;

    const userPrompt = `Analiza la siguiente información de intencionalidad:

PROBLEMA: ${problemaDescripcion || 'No proporcionado'}
CAUSAS: ${Array.isArray(causas) ? causas.join(', ') : causas || 'No proporcionado'}
CONSECUENCIAS: ${Array.isArray(consecuencias) ? consecuencias.join(', ') : consecuencias || 'No proporcionado'}
OBJETIVO: ${objetivo || 'No proporcionado'}
CONTEXTO: ${contexto || 'No proporcionado'}

Proporciona tu análisis en este formato JSON:
{
  "puntaje_estimado": number (0-20),
  "analisis": {
    "problema": "análisis del problema",
    "causas": "análisis de las causas",
    "consecuencias": "análisis de las consecuencias",
    "objetivo": "análisis del objetivo"
  },
  "fortalezas": ["string"],
  "areas_mejorar": ["string"],
  "sugerencias": ["string"],
  "completitud": number (0-100)
}`;

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
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error('Error en la API de OpenAI');
    }

    const data = await response.json();
    let content = data.choices[0].message.content;
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const analysis = JSON.parse(content);

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in analyze-cnpie-intencionalidad:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
