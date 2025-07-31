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

    // Validate Accelerator 1 data completeness
    const completeness = accelerator1Data.completeness_analysis?.overall_completeness || 0;
    if (completeness < 50) {
      throw new Error(`Los datos del Acelerador 1 están incompletos (${completeness}%). Es necesario completar al menos el 50% del Acelerador 1 antes de generar el informe.`);
    }

    console.log('Generating Acelerador 2 report with:', {
      hasAccelerator1Data: !!accelerator1Data,
      teacherResponsesKeys: Object.keys(teacherResponses),
      hasCorrectionInstructions: !!correctionInstructions
    });

    // Get the new plantilla3 template from Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: templateData } = await supabase
      .from('templates')
      .select('content')
      .eq('name', 'plantilla3')
      .single();

    const template = templateData?.content || {
      name: "plantilla3",
      content: [
        {
          bloque: "Portada y metadatos",
          subSecciones: ["Título del informe", "Docente", "Institución Educativa", "Fecha", "N.º de informe"],
          indicaciones: "Campos auto-rellenados"
        },
        {
          bloque: "Resumen del diagnóstico",
          subSecciones: ["Contexto y objetivo del informe", "Síntesis de la información del Acelerador 1", "Alcance de esta etapa"],
          indicaciones: "Texto continuo, máximo 200 palabras"
        },
        {
          bloque: "Resultados: Competencias previas",
          subSecciones: ["Pregunta 1 – Desarrollo de competencias previas", "Pregunta 2 – Desarrollo de competencias previas", "Pregunta 3 – Desarrollo de competencias previas"],
          indicaciones: "Cada sección debe incluir la pregunta, respuestas cualitativas agregadas y breves ejemplos o citas"
        },
        {
          bloque: "Resultados: Condiciones de seguridad hídrica",
          subSecciones: ["Pregunta 1 – Condiciones iniciales de seguridad hídrica", "Pregunta 2 – Condiciones iniciales de seguridad hídrica"],
          indicaciones: "Cada sección debe incluir la pregunta, respuestas cualitativas agregadas y 1–2 insights destacados"
        },
        {
          bloque: "Análisis de brechas",
          subSecciones: ["Principales fortalezas detectadas", "Áreas de mejora"],
          indicaciones: "Viñetas interpretativas que contrasten competencias vs. necesidades"
        },
        {
          bloque: "Recomendaciones pedagógicas",
          subSecciones: ["Acciones inmediatas", "Estrategias de mediano y largo plazo"],
          indicaciones: "Listas con justificación breve (1–2 líneas por recomendación)"
        }
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

FORMATO DE RESPUESTA:
Debes responder ÚNICAMENTE con un objeto JSON válido que tenga EXACTAMENTE esta estructura:

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

IMPORTANTE:
- NO uses formato markdown en tu respuesta (sin \`\`\`json ni \`\`\`)
- NO agregues texto antes o después del JSON
- El HTML debe incluir estilos CSS embebidos y estructura profesional
- Asegúrate de que el JSON sea válido y bien formateado
`;

    const correctionPrompt = correctionInstructions ? `

INSTRUCCIONES DE CORRECCIÓN:
${correctionInstructions}

IMPORTANTE: Aplica las correcciones solicitadas manteniendo la estructura y calidad del informe.
` : '';

    const finalPrompt = basePrompt + correctionPrompt;

    // Helper function to clean JSON content from markdown
    const cleanJsonContent = (content: string): string => {
      // Remove markdown code blocks
      let cleaned = content.replace(/```json\s*/, '').replace(/```\s*$/, '');
      // Remove any remaining backticks at start/end
      cleaned = cleaned.replace(/^`+|`+$/g, '');
      return cleaned.trim();
    };

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
            content: 'Eres un experto en educación para la seguridad hídrica. Generas informes diagnósticos detallados y profesionales. IMPORTANTE: Responde ÚNICAMENTE con JSON válido, sin formato markdown, sin backticks, sin texto adicional.'
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
    let generatedContent = data.choices[0].message.content;

    console.log('Generated content preview:', generatedContent.substring(0, 500) + '...');

    // Clean the content to remove markdown formatting
    generatedContent = cleanJsonContent(generatedContent);
    
    console.log('Cleaned content preview:', generatedContent.substring(0, 500) + '...');

    let parsedReport;
    try {
      parsedReport = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      console.error('Generated content:', generatedContent);
      console.error('Cleaned content:', generatedContent);
      
      // Try to extract JSON from the content if it's wrapped in text
      const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsedReport = JSON.parse(jsonMatch[0]);
          console.log('Successfully extracted JSON from content');
        } catch (secondParseError) {
          console.error('Second parse attempt failed:', secondParseError);
          throw new Error('Error al procesar la respuesta de IA: formato JSON inválido');
        }
      } else {
        throw new Error('Error al procesar la respuesta de IA: no se encontró JSON válido');
      }
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