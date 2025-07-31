import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { accelerator1Data } = await req.json();

    if (!accelerator1Data) {
      throw new Error('Se requieren los datos del Acelerador 1');
    }

    console.log('Generating teacher questions for accelerator data:', JSON.stringify(accelerator1Data, null, 2));

    const prompt = `
Eres un experto en educación para la seguridad hídrica. Basándote en el siguiente diagnóstico del Acelerador 1, genera exactamente 5 preguntas cualitativas para que el docente responda sobre sus estudiantes.

DIAGNÓSTICO DEL ACELERADOR 1:
${JSON.stringify(accelerator1Data, null, 2)}

CONTEXTO:
- Las preguntas son para un Acelerador 2 que evalúa competencias previas de estudiantes
- Deben ser específicas al contexto y diagnóstico proporcionado
- 3 preguntas deben enfocarse en competencias previas de los estudiantes
- 2 preguntas deben enfocarse en condiciones iniciales de seguridad hídrica

INSTRUCCIONES:
1. Analiza las fortalezas, debilidades y prioridades identificadas en el Acelerador 1
2. Genera 5 preguntas abiertas específicas para este contexto
3. Cada pregunta debe ayudar a personalizar el diagnóstico
4. Las preguntas deben ser claras y directas para el docente

FORMATO DE RESPUESTA (JSON válido):
{
  "questions": [
    {
      "id": "competencies_q1",
      "question_text": "Pregunta específica sobre competencias...",
      "context": "Breve contexto o explicación de por qué es importante esta pregunta",
      "category": "competencies"
    },
    {
      "id": "competencies_q2", 
      "question_text": "Segunda pregunta sobre competencias...",
      "context": "Contexto de la pregunta",
      "category": "competencies"
    },
    {
      "id": "competencies_q3",
      "question_text": "Tercera pregunta sobre competencias...", 
      "context": "Contexto de la pregunta",
      "category": "competencies"
    },
    {
      "id": "water_security_q1",
      "question_text": "Primera pregunta sobre seguridad hídrica...",
      "context": "Contexto de la pregunta", 
      "category": "water_security"
    },
    {
      "id": "water_security_q2",
      "question_text": "Segunda pregunta sobre seguridad hídrica...",
      "context": "Contexto de la pregunta",
      "category": "water_security"
    }
  ]
}

Responde ÚNICAMENTE con el JSON válido, sin texto adicional.
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'Eres un experto en educación para la seguridad hídrica. Generas preguntas pedagógicas específicas basadas en diagnósticos educativos. Siempre respondes en formato JSON válido.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    console.log('Generated content:', generatedContent);

    let parsedQuestions;
    try {
      parsedQuestions = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      console.error('Generated content:', generatedContent);
      throw new Error('Error al procesar la respuesta de IA');
    }

    // Validate the response structure
    if (!parsedQuestions.questions || !Array.isArray(parsedQuestions.questions) || parsedQuestions.questions.length !== 5) {
      throw new Error('Formato de respuesta inválido de IA');
    }

    console.log('Successfully generated teacher questions:', parsedQuestions);

    return new Response(JSON.stringify(parsedQuestions), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-teacher-questions function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Error interno del servidor',
      details: error.toString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});