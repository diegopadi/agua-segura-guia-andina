import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { surveyData, responses, profileData } = await req.json();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Eres un experto en análisis educativo y evaluación diagnóstica. Tu tarea es generar un informe completo basado en las respuestas de estudiantes a una encuesta de seguridad hídrica.

Debes analizar:
1. Patrones en las respuestas
2. Fortalezas y brechas identificadas
3. Perfiles de competencias de estudiantes
4. Recomendaciones pedagógicas específicas

Responde SOLO con un JSON válido con esta estructura:
{
  "report": {
    "portada": {
      "titulo": "string",
      "resumen_ejecutivo": "string"
    },
    "metodologia": {
      "descripcion_instrumento": "string",
      "muestra": "string",
      "proceso_aplicacion": "string"
    },
    "resultados_descriptivos": {
      "variables": [
        {
          "variable": "string",
          "analisis": "string",
          "estadisticas": {}
        }
      ]
    },
    "analisis_brechas": {
      "fortalezas": ["string"],
      "areas_mejora": ["string"],
      "competencias": {}
    },
    "perfiles_estudiantes": {
      "segmentos": [
        {
          "nombre": "string",
          "caracteristicas": "string",
          "porcentaje": "number"
        }
      ]
    },
    "recomendaciones_pedagogicas": {
      "estrategias": ["string"],
      "conexiones_curriculares": ["string"]
    }
  }
}`
          },
          {
            role: 'user',
            content: `Datos de la encuesta:
${JSON.stringify(surveyData, null, 2)}

Respuestas de estudiantes:
${JSON.stringify(responses, null, 2)}

Perfil del docente:
${JSON.stringify(profileData, null, 2)}

Genera el informe diagnóstico completo.`
          }
        ],
        temperature: 0.3,
        max_tokens: 3000
      }),
    });

    const openAIResult = await response.json();
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${openAIResult.error?.message || 'Unknown error'}`);
    }

    const content = openAIResult.choices[0].message.content;
    const reportData = JSON.parse(content);

    return new Response(JSON.stringify(reportData), {
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