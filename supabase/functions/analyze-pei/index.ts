import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, peiContent, questions } = await req.json();

    if (!sessionId || !peiContent || !questions) {
      throw new Error('Missing required parameters');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Template 1 for analysis criteria
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .select('content')
      .eq('name', 'Plantilla 1')
      .single();

    if (templateError) {
      throw new Error('Failed to fetch analysis template');
    }

    const analysisPrompt = `
Analiza el siguiente Proyecto Educativo Institucional (PEI) en base a los criterios de seguridad hídrica y sostenibilidad:

CRITERIOS DE ANÁLISIS (Plantilla 1):
${JSON.stringify(template.content, null, 2)}

PEI A ANALIZAR:
${peiContent}

RESPUESTAS DEL FORMULARIO:
${JSON.stringify(questions, null, 2)}

INSTRUCCIONES:
1. Evalúa la completitud del PEI en relación a cada criterio de la plantilla
2. Identifica las fortalezas y debilidades principales
3. Determina qué información específica falta para cada criterio
4. Genera preguntas complementarias precisas para completar la información faltante
5. Asigna un puntaje de completitud del 0-100% para cada sección

FORMATO DE RESPUESTA (JSON):
{
  "completeness_score": 85,
  "analysis": {
    "strengths": ["fortaleza 1", "fortaleza 2"],
    "weaknesses": ["debilidad 1", "debilidad 2"],
    "missing_info": {
      "section_name": ["info faltante 1", "info faltante 2"]
    }
  },
  "supplementary_questions": [
    {
      "question": "Pregunta específica basada en lo que falta",
      "category": "contexto_hidrico|infraestructura|pedagogia|recursos",
      "priority": "alta|media|baja"
    }
  ],
  "recommendations": ["recomendación 1", "recomendación 2"]
}

Responde SOLO en formato JSON válido, sin texto adicional.
`;

    console.log('Sending request to OpenAI...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'Eres un experto en análisis de proyectos educativos institucionales con enfoque en seguridad hídrica y sostenibilidad. Respondes siempre en formato JSON válido.' 
          },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiAnalysis = data.choices[0].message.content;
    
    console.log('AI Analysis received:', aiAnalysis);

    // Parse the JSON response
    let analysisResult;
    try {
      analysisResult = JSON.parse(aiAnalysis);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', aiAnalysis);
      throw new Error('Invalid JSON response from AI');
    }

    // Update session with analysis results
    const { error: updateError } = await supabase
      .from('acelerador_sessions')
      .update({
        session_data: {
          ...analysisResult,
          analyzed_at: new Date().toISOString()
        }
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Failed to update session:', updateError);
      throw new Error('Failed to save analysis results');
    }

    console.log('Analysis completed successfully');

    return new Response(
      JSON.stringify(analysisResult),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in analyze-pei function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check function logs for more information'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});