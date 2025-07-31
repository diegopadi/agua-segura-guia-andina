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
    const { 
      accelerator1Data, 
      teacherResponses, 
      correctionInstructions = null 
    } = await req.json();

    if (!accelerator1Data || !teacherResponses) {
      throw new Error('Se requieren los datos del Acelerador 1 y las respuestas del docente');
    }

    console.log('Generating Acelerador 2 report with:', {
      hasAccelerator1Data: !!accelerator1Data,
      teacherResponsesKeys: Object.keys(teacherResponses),
      hasCorrectionInstructions: !!correctionInstructions
    });

    // Get the report template from Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: templateData } = await supabase
      .from('templates')
      .select('content')
      .eq('name', 'acelerador_2_report_template')
      .single();

    const template = templateData?.content || {
      title: "Plantilla básica de informe diagnóstico",
      sections: [
        { title: "Resumen Ejecutivo", content: "Análisis general de competencias" },
        { title: "Metodología", content: "Proceso de evaluación aplicado" },
        { title: "Resultados", content: "Hallazgos principales del diagnóstico" },
        { title: "Recomendaciones", content: "Estrategias pedagógicas sugeridas" }
      ]
    };

    const basePrompt = `
Eres un experto en educación para la seguridad hídrica. Genera un informe diagnóstico completo basado en los siguientes datos:

DIAGNÓSTICO DEL ACELERADOR 1:
${JSON.stringify(accelerator1Data, null, 2)}

RESPUESTAS DEL DOCENTE SOBRE SUS ESTUDIANTES:
${JSON.stringify(teacherResponses, null, 2)}

ESTRUCTURA DEL INFORME (usar como guía):
${JSON.stringify(template, null, 2)}

INSTRUCCIONES:
1. Crea un informe diagnóstico completo y profesional
2. Conecta el diagnóstico del Acelerador 1 con las respuestas del docente
3. Incluye análisis específicos de competencias previas
4. Proporciona recomendaciones pedagógicas concretas
5. Usa un lenguaje profesional pero accesible para docentes
6. Estructura el contenido de manera clara y organizada

FORMATO DE RESPUESTA (JSON válido):
{
  "title": "Informe Diagnóstico - Acelerador 2",
  "html_content": "HTML completo del informe con estructura, estilos básicos y contenido",
  "markdown_content": "Versión en markdown del mismo contenido",
  "metadata": {
    "generated_at": "${new Date().toISOString()}",
    "sections_count": "número de secciones",
    "word_count": "estimación de palabras",
    "summary": "Resumen ejecutivo de 2-3 líneas"
  }
}

El HTML debe incluir:
- Estilos CSS básicos embebidos
- Estructura clara con títulos y secciones
- Contenido completo y detallado
- Formato profesional para impresión

Responde ÚNICAMENTE con el JSON válido, sin texto adicional.
`;

    const correctionPrompt = correctionInstructions ? `

INSTRUCCIONES DE CORRECCIÓN:
${correctionInstructions}

IMPORTANTE: Aplica las correcciones solicitadas manteniendo la estructura y calidad del informe.
` : '';

    const finalPrompt = basePrompt + correctionPrompt;

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
            content: 'Eres un experto en educación para la seguridad hídrica. Generas informes diagnósticos detallados y profesionales. Siempre respondes en formato JSON válido.'
          },
          { role: 'user', content: finalPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    console.log('Generated content preview:', generatedContent.substring(0, 500) + '...');

    let parsedReport;
    try {
      parsedReport = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      console.error('Generated content:', generatedContent);
      throw new Error('Error al procesar la respuesta de IA');
    }

    // Validate the response structure
    if (!parsedReport.html_content || !parsedReport.markdown_content || !parsedReport.metadata) {
      throw new Error('Formato de respuesta inválido de IA');
    }

    console.log('Successfully generated Acelerador 2 report');

    return new Response(JSON.stringify(parsedReport), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-acelerador2-report function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Error interno del servidor',
      details: error.toString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});