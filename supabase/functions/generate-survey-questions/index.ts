import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { instrumentData, accelerator1Data } = await req.json();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: `Eres un experto en educación hídrica y diseño de instrumentos de evaluación. Tu tarea es generar preguntas específicas para una encuesta estudiantil basada en:

1. Las respuestas del docente sobre configuración del instrumento
2. El diagnóstico previo del Acelerador 1 (FODA, hallazgos, prioridades)

Debes generar entre 8-15 preguntas que evalúen competencias en seguridad hídrica según las áreas curriculares priorizadas.

Responde SOLO con un JSON válido con esta estructura:
{
  "questions": [
    {
      "nro": 1,
      "pregunta": "texto de la pregunta",
      "tipo": "multiple_choice|single_choice|text|scale|yes_no",
      "variable": "nombre_variable",
      "opciones": ["opcion1", "opcion2"] // solo para preguntas cerradas
    }
  ],
  "sample_size": {
    "recommended": 30,
    "statistical": 50,
    "explanation": "explicación del cálculo"
  }
}`
          },
          {
            role: 'user',
            content: `Configuración del instrumento:
${JSON.stringify(instrumentData, null, 2)}

Diagnóstico Acelerador 1:
${JSON.stringify(accelerator1Data, null, 2)}

Genera las preguntas de evaluación diagnóstica.`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      }),
    });

    const openAIResult = await response.json();
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${openAIResult.error?.message || 'Unknown error'}`);
    }

    const content = openAIResult.choices[0].message.content;
    const surveyData = JSON.parse(content);

    return new Response(JSON.stringify(surveyData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});