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
    const { sessionId, userId } = await req.json();

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
      .eq('name', 'Plantilla 2')
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

FORMATO: Genera un documento estructurado en formato markdown que pueda ser convertido a PDF/DOCX.

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
            content: 'Eres un consultor experto en educación y gestión institucional especializado en seguridad hídrica y sostenibilidad. Generas reportes profesionales de diagnóstico institucional.' 
          },
          { role: 'user', content: reportPrompt }
        ],
        temperature: 0.2,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const reportContent = data.choices[0].message.content;
    
    console.log('Report generated successfully');

    // Get next document number for this user
    const { data: lastReport } = await supabase
      .from('diagnostic_reports')
      .select('document_number')
      .eq('user_id', userId)
      .order('document_number', { ascending: false })
      .limit(1)
      .single();

    const nextDocNumber = (lastReport?.document_number || 0) + 1;

    // Save the report
    const { data: savedReport, error: saveError } = await supabase
      .from('diagnostic_reports')
      .insert({
        user_id: userId,
        session_id: sessionId,
        document_number: nextDocNumber,
        status: 'completed',
        metadata: {
          report_content: reportContent,
          generated_at: new Date().toISOString(),
          institution_name: profile?.ie_name,
          completeness_score: session.session_data?.completeness_score
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
        download_available: true
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in generate-report function:', error);
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