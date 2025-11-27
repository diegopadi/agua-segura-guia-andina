import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { combinedData } = await req.json();

    if (!combinedData) {
      throw new Error('No se proporcionaron datos combinados');
    }

    console.log('📊 Datos combinados recibidos (2D - IAPE):', JSON.stringify(combinedData, null, 2));

    const systemPrompt = `Eres un experto evaluador del Concurso Nacional de Proyectos de Innovación Educativa (CNPIE) especializado en proyectos de Investigación-Acción Participativa para la Innovación Educativa (IAPE - Categoría 2D).

Tu tarea es SINTETIZAR y MEJORAR las respuestas del docente combinando:
1. Las respuestas originales del formulario inicial
2. Las nuevas respuestas a las preguntas complementarias

CRITERIOS DE EVALUACIÓN IAPE (100 puntos total):
1. INTENCIONALIDAD (45 pts): Problema/causas/consecuencias (15), Justificación (10), Preguntas de investigación (10), Objetivos (10)
2. PARTICIPACIÓN (10 pts): Actores y roles en la investigación participativa
3. REFLEXIÓN (10 pts): Estrategias de reflexión crítica sobre la práctica
4. CONSISTENCIA (35 pts): Procedimiento metodológico (10), Técnicas e instrumentos (10), Plan de actividades (10), Bienes y servicios (5)

INSTRUCCIONES:
- Integra la información de ambas fuentes de manera coherente
- Mejora la redacción manteniendo la esencia del contenido original
- Asegúrate de que cada respuesta cumpla con los criterios de la rúbrica
- Mantén un tono académico y profesional
- No inventes información que no esté en las respuestas originales

IMPORTANTE: Responde ÚNICAMENTE con un JSON válido (sin markdown ni texto adicional) con esta estructura exacta:
{
  "formulacion": {
    "respuesta_1_1": "Texto mejorado sobre problema, causas y consecuencias",
    "respuesta_1_2": "Texto mejorado sobre justificación",
    "respuesta_1_3": "Texto mejorado sobre preguntas de investigación",
    "respuesta_1_4": "Texto mejorado sobre objetivos"
  },
  "participacion": {
    "respuesta_2_1": "Texto mejorado sobre actores y roles"
  },
  "reflexion": {
    "respuesta_3_1": "Texto mejorado sobre estrategias de reflexión"
  },
  "consistencia": {
    "respuesta_4_1": "Texto mejorado sobre procedimiento metodológico",
    "respuesta_4_2": "Texto mejorado sobre técnicas e instrumentos",
    "respuesta_4_3": "Texto mejorado sobre plan de actividades",
    "respuesta_4_4": "Texto mejorado sobre bienes y servicios"
  }
}`;

    const userPrompt = `Sintetiza y mejora las siguientes respuestas del proyecto IAPE:

=== CRITERIO 1: INTENCIONALIDAD ===

1.1 PROBLEMA, CAUSAS Y CONSECUENCIAS:
- Respuesta Original: ${combinedData.formulacion?.respuesta_original_1_1 || 'No proporcionada'}
- Nueva Respuesta (profundización): ${combinedData.formulacion?.nueva_respuesta_1_1 || 'No proporcionada'}

1.2 JUSTIFICACIÓN:
- Respuesta Original: ${combinedData.formulacion?.respuesta_original_1_2 || 'No proporcionada'}
- Nueva Respuesta (profundización): ${combinedData.formulacion?.nueva_respuesta_1_2 || 'No proporcionada'}

1.3 PREGUNTAS DE INVESTIGACIÓN:
- Respuesta Original: ${combinedData.formulacion?.respuesta_original_1_3 || 'No proporcionada'}
- Nueva Respuesta (profundización): ${combinedData.formulacion?.nueva_respuesta_1_3 || 'No proporcionada'}

1.4 OBJETIVOS:
- Respuesta Original: ${combinedData.formulacion?.respuesta_original_1_4 || 'No proporcionada'}
- Nueva Respuesta (profundización): ${combinedData.formulacion?.nueva_respuesta_1_4 || 'No proporcionada'}

=== CRITERIO 2: PARTICIPACIÓN ===

2.1 ACTORES Y ROLES:
- Respuesta Original: ${combinedData.participacion?.respuesta_original_2_1 || 'No proporcionada'}
- Nueva Respuesta (profundización): ${combinedData.participacion?.nueva_respuesta_2_1 || 'No proporcionada'}

=== CRITERIO 3: REFLEXIÓN ===

3.1 ESTRATEGIAS DE REFLEXIÓN:
- Respuesta Original: ${combinedData.reflexion?.respuesta_original_3_1 || 'No proporcionada'}
- Nueva Respuesta (profundización): ${combinedData.reflexion?.nueva_respuesta_3_1 || 'No proporcionada'}

=== CRITERIO 4: CONSISTENCIA ===

4.1 PROCEDIMIENTO METODOLÓGICO:
- Respuesta Original: ${combinedData.consistencia?.respuesta_original_4_1 || 'No proporcionada'}
- Nueva Respuesta (profundización): ${combinedData.consistencia?.nueva_respuesta_4_1 || 'No proporcionada'}

4.2 TÉCNICAS E INSTRUMENTOS:
- Respuesta Original: ${combinedData.consistencia?.respuesta_original_4_2 || 'No proporcionada'}
- Nueva Respuesta (profundización): ${combinedData.consistencia?.nueva_respuesta_4_2 || 'No proporcionada'}

4.3 PLAN DE ACTIVIDADES:
- Respuesta Original: ${combinedData.consistencia?.respuesta_original_4_3 || 'No proporcionada'}
- Nueva Respuesta (profundización): ${combinedData.consistencia?.nueva_respuesta_4_3 || 'No proporcionada'}

4.4 BIENES Y SERVICIOS:
- Respuesta Original: ${combinedData.consistencia?.respuesta_original_4_4 || 'No proporcionada'}
- Nueva Respuesta (profundización): ${combinedData.consistencia?.nueva_respuesta_4_4 || 'No proporcionada'}

Genera las respuestas mejoradas integrando toda la información proporcionada.`;

    console.log('🤖 Enviando solicitud a OpenAI...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 6000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error de OpenAI:', errorText);
      throw new Error(`Error de OpenAI: ${response.status} - ${errorText}`);
    }

    const openAIResult = await response.json();
    console.log('🟢 Respuesta de OpenAI recibida');

    const content = openAIResult.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No se recibió contenido de OpenAI');
    }

    console.log('📝 Contenido raw:', content);

    // Limpiar el contenido de markdown si existe
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.slice(7);
    }
    if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.slice(3);
    }
    if (cleanContent.endsWith('```')) {
      cleanContent = cleanContent.slice(0, -3);
    }
    cleanContent = cleanContent.trim();

    const improvedResponses = JSON.parse(cleanContent);
    console.log('✅ Respuestas mejoradas parseadas:', Object.keys(improvedResponses));

    return new Response(
      JSON.stringify({ 
        success: true, 
        improved_responses: improvedResponses
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error en sintetisador-cnpie-2D:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Error desconocido' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
