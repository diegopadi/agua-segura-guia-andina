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
    console.log('🚀 Starting generate-priority-report function');
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body
    const { accelerator1Data, accelerator2Data, accelerator3Data, profileData } = await req.json();
    console.log('📋 Request data received:', {
      hasAccelerator1: !!accelerator1Data,
      hasAccelerator2: !!accelerator2Data,
      hasAccelerator3: !!accelerator3Data,
      hasProfile: !!profileData
    });

    if (!accelerator1Data || !accelerator2Data || !accelerator3Data) {
      throw new Error('Se requieren los datos de los 3 aceleradores');
    }

    console.log('📄 Getting template from database...');
    // Get the template
    const { data: template, error: templateError } = await supabaseClient
      .from('templates')
      .select('content')
      .eq('name', 'priority_report_template')
      .single();

    if (templateError || !template) {
      console.error('❌ Template error:', templateError);
      throw new Error('Error al obtener la plantilla del informe');
    }

    console.log('✅ Template retrieved successfully');
    const templateContent = template.content;

    // Prepare the AI prompt
    let aiPrompt = templateContent.ai_prompt
      .replace('{accelerator1_data}', JSON.stringify(accelerator1Data))
      .replace('{accelerator2_data}', JSON.stringify(accelerator2Data))
      .replace('{accelerator3_data}', JSON.stringify(accelerator3Data));

    console.log('🤖 Calling OpenAI API...');
    console.log('📝 Prompt length:', aiPrompt.length);

    let openaiResponse;
    try {
      // Call OpenAI API
      openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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

      console.log('📡 OpenAI Response Status:', openaiResponse.status);
      console.log('📡 OpenAI Response Headers:', Object.fromEntries(openaiResponse.headers.entries()));

    } catch (fetchError) {
      console.error('🚨 OpenAI Fetch Error:', fetchError);
      throw new Error(`Error de conexión con OpenAI: ${fetchError.message}`);
    }

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('🚨 OpenAI API Error Status:', openaiResponse.status);
      console.error('🚨 OpenAI API Error Body:', errorText);
      throw new Error(`Error en la API de OpenAI: ${openaiResponse.status} - ${errorText}`);
    }

    let openaiData;
    try {
      openaiData = await openaiResponse.json();
      console.log('✅ OpenAI JSON parsed successfully');
    } catch (jsonError) {
      console.error('🚨 Error parsing OpenAI JSON response:', jsonError);
      const responseText = await openaiResponse.text();
      console.error('🚨 Raw OpenAI response:', responseText);
      throw new Error(`Error al procesar respuesta JSON de OpenAI: ${jsonError.message}`);
    }

    const generatedContent = openaiData.choices?.[0]?.message?.content;
    if (!generatedContent) {
      console.error('🚨 No content in OpenAI response:', openaiData);
      throw new Error('OpenAI no devolvió contenido válido');
    }

    console.log('📄 Generated content length:', generatedContent.length);
    console.log('📄 Generated content preview:', generatedContent.substring(0, 200) + '...');

    // Parse the generated JSON
    let report;
    try {
      console.log('🔍 Parsing AI response...');
      
      // Clean the response in case it has markdown formatting
      let cleanedContent = generatedContent.replace(/```json\n?/g, '').replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
      console.log('🧹 Cleaned content preview:', cleanedContent.substring(0, 200) + '...');
      
      // If the response is HTML instead of JSON, create the proper structure
      if (cleanedContent.startsWith('<div class="priority-report">')) {
        console.log('📝 Detected HTML format response');
        report = {
          html_content: cleanedContent,
          priorities: extractPrioritiesFromHTML(cleanedContent),
          metadata: {}
        };
      } else {
        console.log('📝 Attempting JSON parse...');
        // Try to parse as JSON
        report = JSON.parse(cleanedContent);
        console.log('✅ JSON parsed successfully');
      }
    } catch (parseError) {
      console.error('🚨 Error parsing AI response:', parseError);
      console.error('🚨 Parse error details:', parseError.message);
      console.error('🚨 Raw AI response (first 1000 chars):', generatedContent.substring(0, 1000));
      
      // If parsing fails, try to extract HTML content manually
      const htmlMatch = generatedContent.match(/<div class="priority-report">.*?<\/div>/s);
      if (htmlMatch) {
        console.log('🔧 Fallback: extracted HTML manually');
        report = {
          html_content: htmlMatch[0],
          priorities: extractPrioritiesFromHTML(htmlMatch[0]),
          metadata: {}
        };
      } else {
        throw new Error(`Error al procesar la respuesta de la IA. Formato inválido: ${parseError.message}`);
      }
    }

    console.log('🔄 Processing report structure...');
    console.log('📊 Report keys:', Object.keys(report));

    // Handle both JSON and HTML responses
    let htmlContent: string;
    let priorities: any[];

    if (report.html_content) {
      console.log('✅ Using HTML content from report');
      htmlContent = report.html_content;
      priorities = extractPrioritiesFromHTML(htmlContent);

    } else if (report.informe?.prioridades) {
      console.log('✅ Converting JSON to HTML');
      priorities = report.informe.prioridades;
      htmlContent = generateHTMLFromJSON(report.informe);

    } else {
      console.error('🚨 Report structure analysis:', {
        hasHtmlContent: !!report.html_content,
        hasInforme: !!report.informe,
        informeKeys: report.informe ? Object.keys(report.informe) : null,
        hasPrioridades: !!report.informe?.prioridades
      });
      throw new Error('La respuesta de la IA no contiene contenido reconocible');
    }

    // asigna report.html_content = htmlContent y report.priorities = priorities
    report.html_content = htmlContent;
    report.priorities = priorities;

    console.log('📈 Priorities count:', priorities.length);
    if (report.priorities.length !== 5) {
      console.warn(`⚠️ Se esperaban 5 prioridades, pero se encontraron ${report.priorities.length}`);
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

    console.log('✅ Priority report generated successfully');
    console.log('📊 Final report structure:', {
      hasHtmlContent: !!report.html_content,
      prioritiesCount: report.priorities?.length,
      hasMetadata: !!report.metadata
    });

    return new Response(
      JSON.stringify({ report }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('🚨 generate-priority-report error:', error);
    console.error('🚨 Error name:', error.name);
    console.error('🚨 Error message:', error.message);
    console.error('🚨 Error stack:', error.stack);

    // Loguear también el status y body de la respuesta de OpenAI si existe
    if (error.response) {
      console.error('🚨 Error response status:', error.response.status);
      try {
        const errorBody = await error.response.text();
        console.error('🚨 Error response body:', errorBody);
      } catch (bodyError) {
        console.error('🚨 Could not read error response body:', bodyError);
      }
    }

    // Devolver el mensaje completo al front para verlo en la UI
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Error interno del servidor',
        details: 'Error al generar el informe de priorización',
        stack: error.stack,
        timestamp: new Date().toISOString()
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