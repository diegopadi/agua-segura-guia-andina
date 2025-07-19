
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { originalQuestions, correctionRequest, instrumentData } = await req.json();

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
            content: `Eres un experto en educación hídrica y diseño de instrumentos de evaluación. Tu tarea es corregir preguntas específicas de una encuesta estudiantil basada en las solicitudes del docente.

INSTRUCCIONES IMPORTANTES:
- Solo modifica las preguntas que el docente solicite cambiar
- Mantén la coherencia con el resto del cuestionario
- Conserva el mismo número total de preguntas
- Respeta el formato original de las preguntas
- Mantén las variables y tipos de pregunta existentes a menos que se solicite cambiarlos

Responde SOLO con un JSON válido con esta estructura:
{
  "questions": [
    {
      "nro": 1,
      "pregunta": "texto de la pregunta corregida",
      "tipo": "multiple_choice|single_choice|text|scale|yes_no",
      "variable": "nombre_variable",
      "opciones": ["opcion1", "opcion2"] // solo para preguntas cerradas
    }
  ],
  "corrections_applied": ["descripción de cambios realizados"]
}`
          },
          {
            role: 'user',
            content: `Preguntas originales:
${JSON.stringify(originalQuestions, null, 2)}

Configuración del instrumento:
${JSON.stringify(instrumentData, null, 2)}

Solicitud de corrección del docente:
"${correctionRequest}"

Por favor, aplica las correcciones solicitadas manteniendo la coherencia del cuestionario.`
          }
        ],
        temperature: 0.3,
        max_tokens: 2500
      }),
    });

    const openAIResult = await response.json();
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${openAIResult.error?.message || 'Unknown error'}`);
    }

    const content = openAIResult.choices[0].message.content;
    const correctedData = JSON.parse(content);

    return new Response(JSON.stringify(correctedData), {
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
