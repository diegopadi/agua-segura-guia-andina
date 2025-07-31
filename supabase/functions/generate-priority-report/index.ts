import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body
    const { accelerator1Data, accelerator2Data, accelerator3Data, profileData } = await req.json();

    if (!accelerator1Data || !accelerator2Data || !accelerator3Data) {
      throw new Error('Se requieren los datos de los 3 aceleradores');
    }

    // Get the template
    const { data: template, error: templateError } = await supabaseClient
      .from('templates')
      .select('content')
      .eq('name', 'priority_report_template')
      .single();

    if (templateError || !template) {
      throw new Error('Error al obtener la plantilla del informe');
    }

    const templateContent = template.content;

    // Prepare the AI prompt
    let aiPrompt = templateContent.ai_prompt
      .replace('{accelerator1_data}', JSON.stringify(accelerator1Data))
      .replace('{accelerator2_data}', JSON.stringify(accelerator2Data))
      .replace('{accelerator3_data}', JSON.stringify(accelerator3Data));

    console.log('Generating priority report with AI...');

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en educación ambiental hídrica y planificación estratégica educativa. Responde siempre con JSON válido siguiendo exactamente la estructura solicitada.'
          },
          {
            role: 'user',
            content: aiPrompt
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`Error en la API de OpenAI: ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    const generatedContent = openaiData.choices[0].message.content;

    console.log('Generated priority report content:', generatedContent);

    // Parse the generated JSON
    let report;
    try {
      // Clean the response in case it has markdown formatting
      let cleanedContent = generatedContent.replace(/```json\n?/g, '').replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
      
      // If the response is HTML instead of JSON, create the proper structure
      if (cleanedContent.startsWith('<div class="priority-report">')) {
        report = {
          html_content: cleanedContent,
          priorities: extractPrioritiesFromHTML(cleanedContent),
          metadata: {}
        };
      } else {
        // Try to parse as JSON
        report = JSON.parse(cleanedContent);
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('Raw AI response:', generatedContent);
      
      // If parsing fails, try to extract HTML content manually
      const htmlMatch = generatedContent.match(/<div class="priority-report">.*?<\/div>/s);
      if (htmlMatch) {
        report = {
          html_content: htmlMatch[0],
          priorities: extractPrioritiesFromHTML(htmlMatch[0]),
          metadata: {}
        };
      } else {
        throw new Error('Error al procesar la respuesta de la IA. Formato inválido.');
      }
    }

    // Handle both JSON and HTML responses
    let htmlContent: string;
    let priorities: any[];

    if (report.html_content) {
      // viene HTML, lo usamos
      htmlContent = report.html_content;
      priorities = extractPrioritiesFromHTML(htmlContent);

    } else if (report.informe?.prioridades) {
      // viene JSON, lo convertimos a HTML
      priorities = report.informe.prioridades;
      htmlContent = generateHTMLFromJSON(report.informe);

    } else {
      throw new Error('La respuesta de la IA no contiene contenido reconocible');
    }

    // asigna report.html_content = htmlContent y report.priorities = priorities
    report.html_content = htmlContent;
    report.priorities = priorities;

    if (report.priorities.length !== 5) {
      console.warn(`Se esperaban 5 prioridades, pero se encontraron ${report.priorities.length}`);
    }

    // Add metadata
    if (!report.metadata) {
      report.metadata = {};
    }
    
    report.metadata = {
      ...report.metadata,
      institution_name: profileData?.ie_name || 'No especificada',
      teacher_name: profileData?.full_name || 'No especificado',
      generated_date: new Date().toISOString(),
      total_priorities: 5
    };

    console.log('Priority report generated successfully');

    return new Response(
      JSON.stringify({ report }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in generate-priority-report function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Error interno del servidor',
        details: 'Error al generar el informe de priorización'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Helper function to extract priorities from HTML content
function extractPrioritiesFromHTML(htmlContent: string): any[] {
  const matches = [...htmlContent.matchAll(/<li data-priority="(.+?)">(.+?)<\/li>/g)];
  return matches.map(([, id, text]) => ({ id, text }));
}

// Helper function to generate HTML from JSON
function generateHTMLFromJSON(informe: any): string {
  const title = `<h2>${informe.titulo}</h2>`;
  const list = informe.prioridades
    .map((p: any, i: number) => 
      `<li data-priority="${i+1}">${p.descripcion || p.titulo || p}</li>`
    )
    .join('');
  return `${title}<ul>${list}</ul>`;
}