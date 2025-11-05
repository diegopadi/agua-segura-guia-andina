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
    const { diagnostico, experiencias, respuestas } = await req.json();

    console.log('Analizando respuestas para recomendar tipo de proyecto');

    const systemPrompt = `Eres un evaluador experto del CNPIE 2025 (Concurso Nacional de Proyectos de Innovación Educativa del Perú).

Tu tarea es analizar el diagnóstico, experiencias y respuestas del docente para recomendar el tipo de proyecto más adecuado:

**Proyecto 2A (Consolidado)**:
- Innovación con 2 o más años de implementación
- Evidencias sólidas de resultados y aprendizajes
- Procesos sistemáticos documentados
- Escalabilidad demostrada

**Proyecto 2B (Implementación)**:
- Innovación con menos de 1 año de ejecución
- Propuesta clara y planificada
- Primeras evidencias de implementación
- Potencial de crecimiento

**Proyecto 2C (Investigación-Acción)**:
- Proyecto en fase exploratoria o de descubrimiento
- Enfoque en investigación participativa
- Identificación de problemas y diseño de soluciones
- Metodología de investigación-acción

Responde en formato JSON con esta estructura:
{
  "recomendacion": "2A" | "2B" | "2C",
  "confianza": number (0-100),
  "justificacion": "string (explicación detallada de por qué esta recomendación)",
  "fortalezas": ["string"],
  "aspectos_a_fortalecer": ["string"]
}`;

    const userPrompt = `Analiza la siguiente información y recomienda el tipo de proyecto más adecuado:

DIAGNÓSTICO:
${JSON.stringify(diagnostico, null, 2)}

EXPERIENCIAS DOCUMENTADAS:
${experiencias && experiencias.length > 0 
  ? experiencias.map((exp: any, i: number) => `${i + 1}. ${exp.nombre || exp.url}`).join('\n')
  : 'Sin experiencias documentadas'}

RESPUESTAS DEL DOCENTE:
${JSON.stringify(respuestas, null, 2)}

Proporciona una recomendación fundamentada del tipo de proyecto (2A, 2B o 2C) más adecuado.`;

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
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content;
    
    // Limpiar markdown code blocks si existen
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const result = JSON.parse(content);

    console.log('Recomendación generada:', result.recomendacion);

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generando recomendación:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
