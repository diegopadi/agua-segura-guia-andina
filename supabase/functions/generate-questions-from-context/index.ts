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
    const { diagnostico, experiencias } = await req.json();

    console.log('Generando preguntas con IA basadas en diagnóstico y experiencias');

    const systemPrompt = `Eres un asistente pedagógico experto en el proceso de postulación al CNPIE 2025 (Concurso Nacional de Proyectos de Innovación Educativa).

Tu tarea es generar entre 8-12 preguntas estratégicas que ayuden al docente a profundizar en su proyecto. Las preguntas deben:

1. Estar basadas en el diagnóstico y las experiencias previas del docente
2. Enfocarse en las categorías clave del CNPIE: Coherencia, Priorización, Evidencias, Participación, Sistematización
3. Ser abiertas y reflexivas para que el docente pueda completar campos de texto
4. Ayudar a identificar si el proyecto es 2A (Consolidado), 2B (Implementación) o 2C (Investigación-Acción)

Responde en formato JSON con esta estructura:
{
  "preguntas": [
    {
      "categoria": "string (Coherencia, Priorización, Evidencias, Participación, o Sistematización)",
      "pregunta": "string (pregunta abierta)",
      "objetivo": "string (qué busca identificar esta pregunta)"
    }
  ]
}`;

    const userPrompt = `Analiza la siguiente información y genera preguntas estratégicas:

DIAGNÓSTICO:
${JSON.stringify(diagnostico, null, 2)}

EXPERIENCIAS DOCUMENTADAS:
${experiencias && experiencias.length > 0 
  ? experiencias.map((exp: any, i: number) => `${i + 1}. ${exp.nombre || exp.url} - ${exp.file_type || 'documento'}`).join('\n')
  : 'No hay experiencias documentadas aún'}

Genera 8-12 preguntas que ayuden al docente a reflexionar y completar información clave para su postulación.`;

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
        temperature: 0.7,
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

    console.log('Preguntas generadas exitosamente:', result.preguntas.length);

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generando preguntas:', error);
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
