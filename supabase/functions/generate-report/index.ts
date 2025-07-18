import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { Document, Paragraph, TextRun, HeadingLevel, Table, TableCell, TableRow, WidthType, AlignmentType, BorderStyle, Packer } from "https://esm.sh/docx@8.5.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to parse markdown content  
function parseMarkdownToSections(content: string) {
  const sections: any[] = [];
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Headers
    if (line.startsWith('###')) {
      sections.push(new Paragraph({
        text: line.replace('###', '').trim(),
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 300, after: 200 }
      }));
    } else if (line.startsWith('##')) {
      sections.push(new Paragraph({
        text: line.replace('##', '').trim(),
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 }
      }));
    } else if (line.startsWith('#')) {
      sections.push(new Paragraph({
        text: line.replace('#', '').trim(),
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }));
    }
    // Tables (simple markdown table detection)
    else if (line.includes('|') && line.split('|').length > 2) {
      const tableLines = [line];
      let j = i + 1;
      
      // Collect all table lines
      while (j < lines.length && lines[j].includes('|')) {
        tableLines.push(lines[j]);
        j++;
      }
      
      // Skip separator line if present
      if (tableLines[1] && tableLines[1].includes('---')) {
        tableLines.splice(1, 1);
      }
      
      // Create table
      const tableRows = tableLines.map(tableLine => {
        const cells = tableLine.split('|').filter(cell => cell.trim()).map(cell => cell.trim());
        return new TableRow({
          children: cells.map(cellText => 
            new TableCell({
              children: [new Paragraph({ text: cellText })],
              width: { size: 100 / cells.length, type: WidthType.PERCENTAGE }
            })
          )
        });
      });
      
      sections.push(new Table({
        rows: tableRows,
        width: { size: 100, type: WidthType.PERCENTAGE }
      }));
      
      i = j - 1; // Skip processed lines
    }
    // Regular paragraphs
    else {
      // Handle bold text
      const children: TextRun[] = [];
      const boldRegex = /\*\*(.*?)\*\*/g;
      let lastIndex = 0;
      let match;
      
      while ((match = boldRegex.exec(line)) !== null) {
        // Add text before bold
        if (match.index > lastIndex) {
          children.push(new TextRun({
            text: line.substring(lastIndex, match.index)
          }));
        }
        
        // Add bold text
        children.push(new TextRun({
          text: match[1],
          bold: true
        }));
        
        lastIndex = match.index + match[0].length;
      }
      
      // Add remaining text
      if (lastIndex < line.length) {
        children.push(new TextRun({
          text: line.substring(lastIndex)
        }));
      }
      
      if (children.length === 0) {
        children.push(new TextRun({ text: line }));
      }
      
      sections.push(new Paragraph({
        children,
        spacing: { after: 200 }
      }));
    }
  }
  
  return sections;
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
            content: 'Eres un consultor experto en educación y gestión institucional especializado en seguridad hídrica y sostenibilidad. Generas reportes profesionales de diagnóstico institucional.' 
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

    // Generate DOCX document
    console.log('Generating DOCX document...');
    
    // Parse markdown content to sections
    const sections = parseMarkdownToSections(reportContent);
    
    // Create DOCX document
    const doc = new Document({
      styles: {
        paragraphStyles: [
          {
            id: "title",
            name: "Title",
            basedOn: "Normal",
            next: "Normal",
            paragraph: {
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 }
            },
            run: {
              size: 32,
              bold: true,
              color: "0066CC"
            }
          },
          {
            id: "subtitle",
            name: "Subtitle", 
            basedOn: "Normal",
            next: "Normal",
            paragraph: {
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 }
            },
            run: {
              size: 24,
              bold: true,
              color: "333333"
            }
          }
        ]
      },
      sections: [{
        properties: {},
        children: [
          // Title
          new Paragraph({
            text: "REPORTE DE DIAGNÓSTICO INSTITUCIONAL",
            style: "title"
          }),
          
          // Institution info
          new Paragraph({
            children: [
              new TextRun({
                text: "Institución: ",
                bold: true,
                color: "0066CC"
              }),
              new TextRun({
                text: profile?.ie_name || 'No especificado'
              })
            ],
            spacing: { after: 100 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "Región: ",
                bold: true,
                color: "0066CC"
              }),
              new TextRun({
                text: profile?.ie_region || 'No especificado'
              })
            ],
            spacing: { after: 100 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "Provincia: ",
                bold: true,
                color: "0066CC"
              }),
              new TextRun({
                text: profile?.ie_province || 'No especificado'
              })
            ],
            spacing: { after: 100 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "Distrito: ",
                bold: true,
                color: "0066CC"
              }),
              new TextRun({
                text: profile?.ie_district || 'No especificado'
              })
            ],
            spacing: { after: 100 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "Fecha de generación: ",
                bold: true,
                color: "0066CC"
              }),
              new TextRun({
                text: new Date().toLocaleDateString('es-ES', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })
              })
            ],
            spacing: { after: 400 }
          }),
          
          // Content sections
          ...sections
        ]
      }]
    });

    // Generate DOCX buffer
    const docxBuffer = await Packer.toBuffer(doc);
    
    console.log('DOCX document generated, uploading to storage...');

    // Get next document number for this user
    const { data: lastReport } = await supabase
      .from('diagnostic_reports')
      .select('document_number')
      .eq('user_id', userId)
      .order('document_number', { ascending: false })
      .limit(1)
      .single();

    const nextDocNumber = (lastReport?.document_number || 0) + 1;

    // Upload DOCX file to storage
    const fileName = `reporte-diagnostico-${userId}-${nextDocNumber}-${Date.now()}.docx`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user_uploads')
      .upload(fileName, docxBuffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert: false
      });

    if (uploadError) {
      console.error('Failed to upload DOCX file:', uploadError);
      throw new Error('Failed to upload DOCX file');
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('user_uploads')
      .getPublicUrl(fileName);

    console.log('DOCX file uploaded successfully, saving report...');

    // Save the report with file URL
    const { data: savedReport, error: saveError } = await supabase
      .from('diagnostic_reports')
      .insert({
        user_id: userId,
        session_id: sessionId,
        document_number: nextDocNumber,
        status: 'completed',
        file_url: urlData.publicUrl,
        metadata: {
          report_content: reportContent,
          generated_at: new Date().toISOString(),
          institution_name: profile?.ie_name,
          completeness_score: session.session_data?.completeness_score,
          file_name: fileName,
          file_size: docxBuffer.byteLength
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
        file_url: urlData.publicUrl,
        download_available: true
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