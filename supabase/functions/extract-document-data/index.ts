import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';
import pdf from 'npm:pdf-parse@1.1.1';
import mammoth from 'npm:mammoth@1.8.0';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentUrl, documentName, aceleradorKey, expectedFields, contexto_proyecto } = await req.json();

    console.log('Extracting data from document:', documentName, 'for:', aceleradorKey);

    // Descargar el documento
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Extraer path del storage desde la URL
    const urlParts = documentUrl.split('/storage/v1/object/public/');
    if (urlParts.length < 2) {
      throw new Error('Invalid document URL format');
    }
    
    const storagePath = urlParts[1];
    const [bucket, ...pathParts] = storagePath.split('/');
    const filePath = pathParts.join('/');

    console.log('Downloading from bucket:', bucket, 'path:', filePath);

    const { data: fileData, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(filePath);

    if (downloadError) {
      console.error('Download error:', downloadError);
      throw new Error(`Error descargando documento: ${downloadError.message}`);
    }

    // Extraer texto según el tipo de archivo
    let fileContent = '';
    const fileExt = documentName.split('.').pop()?.toLowerCase();

    if (fileExt === 'pdf') {
      // Extraer texto de PDF
      const arrayBuffer = await fileData.arrayBuffer();
      const pdfData = await pdf(new Uint8Array(arrayBuffer));
      fileContent = pdfData.text;
      console.log('PDF extracted. Pages:', pdfData.numpages, 'Text length:', fileContent.length);
      
    } else if (fileExt === 'docx' || fileExt === 'doc') {
      // Extraer texto de DOCX
      const arrayBuffer = await fileData.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      fileContent = result.value;
      console.log('DOCX extracted. Text length:', fileContent.length);
      
    } else {
      // Para otros formatos, intentar como texto plano
      fileContent = await fileData.text();
      console.log('Plain text extracted. Length:', fileContent.length);
    }

    console.log('File type:', fileExt, 'Content length:', fileContent.length);

    // Validar que el contenido sea útil
    const meaningfulContent = fileContent.trim().replace(/\s+/g, ' ');
    if (meaningfulContent.length < 100) {
      return new Response(JSON.stringify({
        success: false,
        error: 'El documento parece estar vacío, es muy corto, o puede ser una imagen escaneada sin texto OCR. Por favor, verifica que el documento contenga texto seleccionable.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Document extraction summary:', {
      fileName: documentName,
      fileType: fileExt,
      contentLength: fileContent.length,
      wordCount: fileContent.split(/\s+/).length,
      hasUsefulContent: fileContent.length > 100
    });

    // Construir el prompt para GPT
    const fieldDescriptions = expectedFields.map((f: any) => 
      `- ${f.fieldName}: ${f.description} (tipo: ${f.type}${f.maxLength ? `, máximo ${f.maxLength} caracteres` : ''})`
    ).join('\n');

    const systemPrompt = `Eres un experto extractor de información de documentos educativos. Tu tarea es analizar documentos y extraer información estructurada de manera precisa.

REGLAS IMPORTANTES:
1. Solo extrae información que esté EXPLÍCITAMENTE presente en el documento
2. Si un campo no tiene información clara, devuelve null
3. Respeta los límites de caracteres especificados
4. Para listas, identifica elementos claros y separados
5. Mantén el contexto y significado original del texto
6. Si el documento no parece relacionado con los campos solicitados, indícalo`;

    const userPrompt = `Analiza este documento educativo y extrae la siguiente información:

CAMPOS ESPERADOS:
${fieldDescriptions}

${contexto_proyecto ? `CONTEXTO DEL PROYECTO:
- Problema: ${contexto_proyecto.problemaDescripcion || 'N/A'}
- Objetivo: ${contexto_proyecto.objetivo || 'N/A'}
` : ''}

DOCUMENTO A ANALIZAR:
${fileContent.substring(0, 15000)} ${fileContent.length > 15000 ? '...(documento truncado)' : ''}

INSTRUCCIONES DE OUTPUT:
Devuelve un JSON con esta estructura exacta:
{
  "extractedData": {
    // Campos encontrados con sus valores
  },
  "confidence": {
    // Nivel de confianza para cada campo (0.0 a 1.0)
  },
  "missing_fields": [
    // Array con nombres de campos no encontrados
  ],
  "warnings": [
    // Array con advertencias sobre la calidad de extracción
  ]
}`;

    console.log('Calling OpenAI...');

    // Llamar a OpenAI
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 3000,
        response_format: { type: "json_object" }
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI error:', errorText);
      throw new Error(`Error de OpenAI: ${openAIResponse.statusText}`);
    }

    const aiResult = await openAIResponse.json();
    const aiOutput = JSON.parse(aiResult.choices[0].message.content);

    console.log('Extraction completed. Fields found:', Object.keys(aiOutput.extractedData || {}).length);

    // Construir respuesta final
    const fieldsFound = Object.keys(aiOutput.extractedData || {});
    const allFieldNames = expectedFields.map((f: any) => f.fieldName);
    const fieldsMissing = allFieldNames.filter((name: string) => !fieldsFound.includes(name));

    const result = {
      success: true,
      extractedData: aiOutput.extractedData || {},
      confidence: aiOutput.confidence || {},
      fieldsFound,
      fieldsMissing,
      warnings: aiOutput.warnings || [],
      documentAnalysis: {
        wordCount: fileContent.split(/\s+/).length,
        language: 'es',
        fileType: fileExt || 'unknown'
      }
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in extract-document-data:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
