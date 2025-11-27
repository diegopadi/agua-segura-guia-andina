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
    const { analysisData } = await req.json();

    if (!analysisData) {
      throw new Error('No se proporcionaron datos de análisis');
    }

    console.log('📊 Datos de análisis recibidos (2D - IAPE):', JSON.stringify(analysisData, null, 2));

    // Calcular puntaje total desde los indicadores
    let puntajeTotal = 0;
    let puntajeMaximo = 100;

    // Criterio 1: Intencionalidad (45 pts) - indicadores 1.1 a 1.4
    const intencionalidad = analysisData.intencionalidad || {};
    puntajeTotal += (intencionalidad.indicador_1_1?.puntaje || 0);
    puntajeTotal += (intencionalidad.indicador_1_2?.puntaje || 0);
    puntajeTotal += (intencionalidad.indicador_1_3?.puntaje || 0);
    puntajeTotal += (intencionalidad.indicador_1_4?.puntaje || 0);

    // Criterio 2: Participación (10 pts) - indicador 2.1
    const participacion = analysisData.participacion || {};
    puntajeTotal += (participacion.indicador_2_1?.puntaje || 0);

    // Criterio 3: Reflexión (10 pts) - indicador 3.1
    const reflexion = analysisData.reflexion || {};
    puntajeTotal += (reflexion.indicador_3_1?.puntaje || 0);

    // Criterio 4: Consistencia (35 pts) - indicadores 4.1 a 4.4
    const consistencia = analysisData.consistencia || {};
    puntajeTotal += (consistencia.indicador_4_1?.puntaje || 0);
    puntajeTotal += (consistencia.indicador_4_2?.puntaje || 0);
    puntajeTotal += (consistencia.indicador_4_3?.puntaje || 0);
    puntajeTotal += (consistencia.indicador_4_4?.puntaje || 0);

    console.log(`📈 Puntaje calculado: ${puntajeTotal}/${puntajeMaximo}`);

    // Construir contexto para la IA con los 4 criterios de IAPE
    const contextForAI = `
PROYECTO DE INVESTIGACIÓN-ACCIÓN PARTICIPATIVA (IAPE) - Categoría 2D

PUNTAJE ACTUAL: ${puntajeTotal}/${puntajeMaximo} puntos

=== CRITERIO 1: INTENCIONALIDAD (45 puntos) ===

1.1 PROBLEMA, CAUSAS Y CONSECUENCIAS (15 pts):
- Puntaje: ${intencionalidad.indicador_1_1?.puntaje || 0}/15
- Nivel: ${intencionalidad.indicador_1_1?.nivel || 'No evaluado'}
- Análisis: ${intencionalidad.indicador_1_1?.analisis || 'Sin análisis'}
- Fortalezas: ${intencionalidad.indicador_1_1?.fortalezas?.join(', ') || 'No identificadas'}
- Mejoras: ${intencionalidad.indicador_1_1?.areas_mejora?.join(', ') || 'No identificadas'}

1.2 JUSTIFICACIÓN (10 pts):
- Puntaje: ${intencionalidad.indicador_1_2?.puntaje || 0}/10
- Nivel: ${intencionalidad.indicador_1_2?.nivel || 'No evaluado'}
- Análisis: ${intencionalidad.indicador_1_2?.analisis || 'Sin análisis'}
- Fortalezas: ${intencionalidad.indicador_1_2?.fortalezas?.join(', ') || 'No identificadas'}
- Mejoras: ${intencionalidad.indicador_1_2?.areas_mejora?.join(', ') || 'No identificadas'}

1.3 PREGUNTAS DE INVESTIGACIÓN (10 pts):
- Puntaje: ${intencionalidad.indicador_1_3?.puntaje || 0}/10
- Nivel: ${intencionalidad.indicador_1_3?.nivel || 'No evaluado'}
- Análisis: ${intencionalidad.indicador_1_3?.analisis || 'Sin análisis'}
- Fortalezas: ${intencionalidad.indicador_1_3?.fortalezas?.join(', ') || 'No identificadas'}
- Mejoras: ${intencionalidad.indicador_1_3?.areas_mejora?.join(', ') || 'No identificadas'}

1.4 OBJETIVOS (10 pts):
- Puntaje: ${intencionalidad.indicador_1_4?.puntaje || 0}/10
- Nivel: ${intencionalidad.indicador_1_4?.nivel || 'No evaluado'}
- Análisis: ${intencionalidad.indicador_1_4?.analisis || 'Sin análisis'}
- Fortalezas: ${intencionalidad.indicador_1_4?.fortalezas?.join(', ') || 'No identificadas'}
- Mejoras: ${intencionalidad.indicador_1_4?.areas_mejora?.join(', ') || 'No identificadas'}

=== CRITERIO 2: PARTICIPACIÓN (10 puntos) ===

2.1 ACTORES Y ROLES (10 pts):
- Puntaje: ${participacion.indicador_2_1?.puntaje || 0}/10
- Nivel: ${participacion.indicador_2_1?.nivel || 'No evaluado'}
- Análisis: ${participacion.indicador_2_1?.analisis || 'Sin análisis'}
- Fortalezas: ${participacion.indicador_2_1?.fortalezas?.join(', ') || 'No identificadas'}
- Mejoras: ${participacion.indicador_2_1?.areas_mejora?.join(', ') || 'No identificadas'}

=== CRITERIO 3: REFLEXIÓN (10 puntos) ===

3.1 ESTRATEGIAS DE REFLEXIÓN (10 pts):
- Puntaje: ${reflexion.indicador_3_1?.puntaje || 0}/10
- Nivel: ${reflexion.indicador_3_1?.nivel || 'No evaluado'}
- Análisis: ${reflexion.indicador_3_1?.analisis || 'Sin análisis'}
- Fortalezas: ${reflexion.indicador_3_1?.fortalezas?.join(', ') || 'No identificadas'}
- Mejoras: ${reflexion.indicador_3_1?.areas_mejora?.join(', ') || 'No identificadas'}

=== CRITERIO 4: CONSISTENCIA (35 puntos) ===

4.1 PROCEDIMIENTO METODOLÓGICO (10 pts):
- Puntaje: ${consistencia.indicador_4_1?.puntaje || 0}/10
- Nivel: ${consistencia.indicador_4_1?.nivel || 'No evaluado'}
- Análisis: ${consistencia.indicador_4_1?.analisis || 'Sin análisis'}
- Fortalezas: ${consistencia.indicador_4_1?.fortalezas?.join(', ') || 'No identificadas'}
- Mejoras: ${consistencia.indicador_4_1?.areas_mejora?.join(', ') || 'No identificadas'}

4.2 TÉCNICAS E INSTRUMENTOS (10 pts):
- Puntaje: ${consistencia.indicador_4_2?.puntaje || 0}/10
- Nivel: ${consistencia.indicador_4_2?.nivel || 'No evaluado'}
- Análisis: ${consistencia.indicador_4_2?.analisis || 'Sin análisis'}
- Fortalezas: ${consistencia.indicador_4_2?.fortalezas?.join(', ') || 'No identificadas'}
- Mejoras: ${consistencia.indicador_4_2?.areas_mejora?.join(', ') || 'No identificadas'}

4.3 PLAN DE ACTIVIDADES (10 pts):
- Puntaje: ${consistencia.indicador_4_3?.puntaje || 0}/10
- Nivel: ${consistencia.indicador_4_3?.nivel || 'No evaluado'}
- Análisis: ${consistencia.indicador_4_3?.analisis || 'Sin análisis'}
- Fortalezas: ${consistencia.indicador_4_3?.fortalezas?.join(', ') || 'No identificadas'}
- Mejoras: ${consistencia.indicador_4_3?.areas_mejora?.join(', ') || 'No identificadas'}

4.4 BIENES Y SERVICIOS (5 pts):
- Puntaje: ${consistencia.indicador_4_4?.puntaje || 0}/5
- Nivel: ${consistencia.indicador_4_4?.nivel || 'No evaluado'}
- Análisis: ${consistencia.indicador_4_4?.analisis || 'Sin análisis'}
- Fortalezas: ${consistencia.indicador_4_4?.fortalezas?.join(', ') || 'No identificadas'}
- Mejoras: ${consistencia.indicador_4_4?.areas_mejora?.join(', ') || 'No identificadas'}
`;

    const systemPrompt = `Eres un experto evaluador del Concurso Nacional de Proyectos de Innovación Educativa (CNPIE) especializado en proyectos de Investigación-Acción Participativa para la Innovación Educativa (IAPE - Categoría 2D).

Tu tarea es generar preguntas de profundización para ayudar a los docentes a mejorar sus proyectos IAPE basándote en el análisis previo.

CRITERIOS DE EVALUACIÓN IAPE:
1. INTENCIONALIDAD (45 pts): Formulación del problema, justificación, preguntas de investigación y objetivos
2. PARTICIPACIÓN (10 pts): Identificación de actores y sus roles en la investigación participativa
3. REFLEXIÓN (10 pts): Estrategias de reflexión crítica sobre la práctica
4. CONSISTENCIA (35 pts): Coherencia metodológica, técnicas/instrumentos, plan de actividades, bienes/servicios

Genera preguntas específicas que ayuden a mejorar cada criterio según las áreas de mejora identificadas.

IMPORTANTE: Responde ÚNICAMENTE con un JSON válido (sin markdown ni texto adicional) con esta estructura exacta:
{
  "formulacion": {
    "titulo": "Formulación del problema y objetivos",
    "introduccion": "Texto explicativo sobre qué aspectos mejorar en intencionalidad",
    "preguntas": ["pregunta1", "pregunta2", "pregunta3"]
  },
  "participacion": {
    "titulo": "Participación de actores",
    "introduccion": "Texto explicativo sobre qué aspectos mejorar en participación",
    "preguntas": ["pregunta1", "pregunta2"]
  },
  "reflexion": {
    "titulo": "Estrategias de reflexión",
    "introduccion": "Texto explicativo sobre qué aspectos mejorar en reflexión",
    "preguntas": ["pregunta1", "pregunta2"]
  },
  "consistencia": {
    "titulo": "Consistencia metodológica",
    "introduccion": "Texto explicativo sobre qué aspectos mejorar en consistencia",
    "preguntas": ["pregunta1", "pregunta2", "pregunta3", "pregunta4"]
  },
  "puntaje_actual": ${puntajeTotal},
  "puntaje_maximo": ${puntajeMaximo}
}`;

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
          { role: 'user', content: contextForAI }
        ],
        temperature: 0.7,
        max_tokens: 3000
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

    const questions = JSON.parse(cleanContent);
    console.log('✅ Preguntas parseadas:', questions);

    return new Response(
      JSON.stringify({ 
        success: true, 
        questions,
        puntaje_actual: puntajeTotal,
        puntaje_maximo: puntajeMaximo
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error en generate-survey-questions-2D:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Error desconocido' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
