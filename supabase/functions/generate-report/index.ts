import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Function to convert markdown content to clean HTML
function markdownToHtml(content: string): string {
  let html = content;

  // Handle tables first
  const lines = content.split('\n');
  let processedLines: string[] = [];
  let inTable = false;
  let tableHtml = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes('|') && !line.includes('---')) {
      if (!inTable) {
        inTable = true;
        tableHtml = '<table style="border-collapse: collapse; width: 100%; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">';
        
        // Check if next line is separator to determine if this is header
        const isHeader = i + 1 < lines.length && lines[i + 1].includes('---');
        const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
        
        if (isHeader) {
          tableHtml += '<thead><tr>';
          cells.forEach(cell => {
            tableHtml += `<th style="border: 1px solid #e5e7eb; padding: 12px; background-color: #f9fafb; font-weight: bold; color: #374151;">${cell}</th>`;
          });
          tableHtml += '</tr></thead><tbody>';
        } else {
          if (!tableHtml.includes('<tbody>')) {
            tableHtml += '<tbody>';
          }
          tableHtml += '<tr>';
          cells.forEach(cell => {
            tableHtml += `<td style="border: 1px solid #e5e7eb; padding: 12px; color: #6b7280;">${cell}</td>`;
          });
          tableHtml += '</tr>';
        }
      } else {
        const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
        tableHtml += '<tr>';
        cells.forEach(cell => {
          tableHtml += `<td style="border: 1px solid #e5e7eb; padding: 12px; color: #6b7280;">${cell}</td>`;
        });
        tableHtml += '</tr>';
      }
    } else if (line.includes('---') && inTable) {
      // Skip separator line
      continue;
    } else {
      if (inTable) {
        tableHtml += '</tbody></table>';
        processedLines.push(tableHtml);
        tableHtml = '';
        inTable = false;
      }
      processedLines.push(line);
    }
  }

  if (inTable) {
    tableHtml += '</tbody></table>';
    processedLines.push(tableHtml);
  }

  // Re-process the content with tables
  let finalHtml = processedLines.join('\n');
  
  // Apply markdown transformations
  finalHtml = finalHtml
    // Headers
    .replace(/^### (.*$)/gim, '<h3 style="color: #1e40af; margin-top: 30px; margin-bottom: 15px; font-size: 1.25rem; font-weight: 600; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="color: #1e3a8a; margin-top: 35px; margin-bottom: 20px; font-size: 1.5rem; font-weight: 700; border-bottom: 3px solid #3b82f6; padding-bottom: 10px;">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 style="color: #1e40af; margin-top: 40px; margin-bottom: 25px; font-size: 2rem; font-weight: 800; text-align: center; border-bottom: 4px solid #2563eb; padding-bottom: 15px;">$1</h1>')
    // Bold text
    .replace(/\*\*(.*?)\*\*/gim, '<strong style="color: #374151; font-weight: 600;">$1</strong>')
    // Lists
    .replace(/^\* (.*$)/gim, '<li style="margin-bottom: 8px; color: #4b5563;">$1</li>')
    .replace(/^- (.*$)/gim, '<li style="margin-bottom: 8px; color: #4b5563;">$1</li>')
    // Line breaks
    .replace(/\n\n/gim, '</p><p style="margin-bottom: 15px; line-height: 1.7; color: #374151;">')
    .replace(/\n/gim, '<br>');

  // Wrap in styled container
  return `<div style="font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; line-height: 1.7; color: #374151; max-width: 900px; margin: 0 auto; padding: 30px; background: white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border-radius: 8px;">
    <p style="margin-bottom: 15px; line-height: 1.7; color: #374151;">${finalHtml}</p>
  </div>`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let sessionId, userId;

  try {
    const { sessionId: reqSessionId, userId: reqUserId } = await req.json();
    sessionId = reqSessionId;
    userId = reqUserId;

    if (!sessionId || !userId) {
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

    // Get session data with analysis results
    const { data: session, error: sessionError } = await supabase
      .from('acelerador_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      throw new Error('Session not found');
    }

    // Get user profile for personalization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.warn('Profile not found, using default values');
    }

    // Get Template 2 for report format
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .select('content')
      .eq('name', 'plantilla2')
      .single();

    if (templateError) {
      throw new Error('Failed to fetch report template');
    }

    // Get all form responses for this session
    const { data: responses, error: responsesError } = await supabase
      .from('form_responses')
      .select('*')
      .eq('session_id', sessionId)
      .order('question_number');

    if (responsesError) {
      console.warn('No form responses found');
    }

    const reportPrompt = `
Genera un reporte de diagnóstico institucional completo basado en el análisis del PEI y las respuestas del formulario.

INFORMACIÓN DE LA INSTITUCIÓN:
- Nombre: ${profile?.ie_name || 'No especificado'}
- Región: ${profile?.ie_region || 'No especificado'}
- Provincia: ${profile?.ie_province || 'No especificado'}
- Distrito: ${profile?.ie_district || 'No especificado'}

PLANTILLA DEL REPORTE (Plantilla 2):
${JSON.stringify(template.content, null, 2)}

ANÁLISIS PREVIO DEL PEI:
${JSON.stringify(session.session_data, null, 2)}

RESPUESTAS DEL FORMULARIO:
${JSON.stringify(responses || [], null, 2)}

INSTRUCCIONES:
1. Utiliza la estructura de la Plantilla 2 como base
2. Personaliza el contenido con la información específica de la institución
3. Incluye el análisis de completitud realizado previamente
4. Incorpora las respuestas del formulario en las secciones correspondientes
5. Proporciona recomendaciones específicas y accionables
6. Mantén un tono profesional y educativo
7. El reporte debe ser apto para presentar a directivos y autoridades educativas

FORMATO: Genera un documento estructurado en formato markdown que incluya tablas para datos comparativos.

Incluye:
- Portada con datos de la institución
- Resumen ejecutivo
- Metodología
- Diagnóstico por dimensiones
- Fortalezas identificadas
- Oportunidades de mejora
- Plan de acción recomendado
- Anexos con criterios utilizados

El reporte debe tener entre 8-12 páginas de contenido substantivo.
`;

    console.log('Generating comprehensive report...');
    
    // Add timeout wrapper
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes timeout
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'Eres un consultor experto en educación y gestión institucional especializado en seguridad hídrica y sostenibilidad. Generas reportes profesionales de diagnóstico institucional en formato markdown con tablas bien estructuradas.' 
          },
          { role: 'user', content: reportPrompt }
        ],
        temperature: 0.2,
        max_tokens: 8000,
      }),
    });

    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const reportContent = data.choices[0].message.content;
    
    console.log('Report generated successfully');

    // Convert markdown to HTML
    const htmlContent = markdownToHtml(reportContent);

    // Get next document number for this user
    const { data: lastReport } = await supabase
      .from('diagnostic_reports')
      .select('document_number')
      .eq('user_id', userId)
      .order('document_number', { ascending: false })
      .limit(1)
      .single();

    const nextDocNumber = (lastReport?.document_number || 0) + 1;

    console.log('Saving report to database...');

    // Save the report with HTML content
    const { data: savedReport, error: saveError } = await supabase
      .from('diagnostic_reports')
      .insert({
        user_id: userId,
        session_id: sessionId,
        document_number: nextDocNumber,
        status: 'completed',
        metadata: {
          report_content: reportContent,
          html_content: htmlContent,
          generated_at: new Date().toISOString(),
          institution_name: profile?.ie_name,
          completeness_score: session.session_data?.completeness_score,
        }
      })
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save report:', saveError);
      throw new Error('Failed to save report');
    }

    // Update session status
    await supabase
      .from('acelerador_sessions')
      .update({ 
        status: 'completed',
        session_data: {
          ...session.session_data,
          report_generated: true,
          report_id: savedReport.id
        }
      })
      .eq('id', sessionId);

    console.log('Report generation completed');

    return new Response(
      JSON.stringify({
        success: true,
        report_id: savedReport.id,
        document_number: nextDocNumber,
        content: reportContent,
        html_content: htmlContent,
        viewer_available: true
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in generate-report function:', error);
    
    // Update any stuck report to error status
    if (sessionId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        await supabase
          .from('diagnostic_reports')
          .update({ status: 'error' })
          .eq('session_id', sessionId)
          .eq('status', 'generating');
      } catch (updateError) {
        console.error('Failed to update report status:', updateError);
      }
    }
    
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