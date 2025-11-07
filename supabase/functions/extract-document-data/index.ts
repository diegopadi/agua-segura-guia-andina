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
    const { documentos, aceleradorKey, expectedFields, contexto_proyecto } = await req.json();

    // Validar que haya documentos (puede ser array o objeto único para backward compatibility)
    const docsArray = Array.isArray(documentos) ? documentos : 
                      documentos ? [documentos] : 
                      null;

    if (!docsArray || docsArray.length === 0) {
      throw new Error('Se requiere al menos un documento');
    }

    console.log(`Procesando ${docsArray.length} documento(s) para ${aceleradorKey}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Procesar todos los documentos
    const documentosTexto: Array<{nombre: string, contenido: string}> = [];

    for (const doc of docsArray) {
      const docUrl = doc.url || doc.documentUrl;
      const docName = doc.nombre || doc.documentName;
      
      if (!docUrl || !docName) {
        console.error('Documento sin URL o nombre, saltando...');
        continue;
      }

      console.log(`Descargando documento: ${docName}`);
      
      try {
        // Extraer path del storage desde la URL
        let filePath: string;
        let bucket: string;

        if (docUrl.includes('/storage/v1/object/public/')) {
          const urlParts = docUrl.split('/storage/v1/object/public/');
          const storagePath = urlParts[1];
          const pathComponents = storagePath.split('/');
          bucket = pathComponents[0];
          filePath = pathComponents.slice(1).join('/');
        } else if (docUrl.includes('/user_uploads/')) {
          bucket = 'user_uploads';
          const urlParts = docUrl.split('/user_uploads/');
          filePath = urlParts[1];
        } else {
          console.error(`URL format not recognized: ${docUrl}`);
          continue;
        }

        console.log('Downloading from bucket:', bucket, 'path:', filePath);

        const { data: fileData, error: downloadError } = await supabase.storage
          .from(bucket)
          .download(filePath);

        if (downloadError) {
          console.error(`Error descargando ${docName}:`, downloadError);
          continue;
        }

        // Extraer texto según el tipo de archivo
        let fileContent = '';
        const fileExt = docName.split('.').pop()?.toLowerCase();

        if (fileExt === 'pdf') {
          const arrayBuffer = await fileData.arrayBuffer();
          const pdfData = await pdf(new Uint8Array(arrayBuffer));
          fileContent = pdfData.text;
        } else if (fileExt === 'docx' || fileExt === 'doc') {
          const arrayBuffer = await fileData.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          fileContent = result.value;
        } else {
          fileContent = await fileData.text();
        }

        if (fileContent.trim().length > 100) {
          documentosTexto.push({
            nombre: docName,
            contenido: fileContent.substring(0, 15000) // Limitar por doc
          });
        }
      } catch (error) {
        console.error(`Error procesando ${docName}:`, error);
        continue;
      }
    }

    console.log(`✅ ${documentosTexto.length} documento(s) procesado(s) exitosamente`);

    if (documentosTexto.length === 0) {
      throw new Error('No se pudo extraer contenido de ningún documento');
    }

    // Construir prompt para OpenAI
    const fieldDescriptions = expectedFields.map((f: any) => 
      `- ${f.fieldName}: ${f.description} (tipo: ${f.type}${f.maxLength ? `, máximo ${f.maxLength} caracteres` : ''})`
    ).join('\n');

    const systemPrompt = `Eres un experto extractor de información de documentos educativos para el CNPIE 2025.

DOCUMENTOS DISPONIBLES (${documentosTexto.length} documento(s)):
${documentosTexto.map((doc, idx) => `
═══════════════════════════════════════
DOCUMENTO ${idx + 1}: "${doc.nombre}"
═══════════════════════════════════════
${doc.contenido}
`).join('\n\n')}

CAMPOS ESPERADOS:
${fieldDescriptions}

${contexto_proyecto ? `CONTEXTO DEL PROYECTO:
- Problema: ${contexto_proyecto.problemaDescripcion || 'N/A'}
- Objetivo: ${contexto_proyecto.objetivo || 'N/A'}
` : ''}

INSTRUCCIONES:
1. Analiza TODOS los documentos disponibles
2. Si un campo está en múltiples documentos, combina la información de forma coherente
3. Prioriza información más reciente y detallada
4. Si encuentras datos contradictorios, usa el documento más completo
5. Para cada campo extraído, indica la fuente (nombre del documento) agregando un campo "_fuente"
6. Solo extrae información que esté EXPLÍCITAMENTE presente
7. Respeta los límites de caracteres especificados`;

    const userPrompt = `Extrae la información de los ${documentosTexto.length} documento(s) según los campos solicitados.

FORMATO DE RESPUESTA (JSON):
{
  "extractedData": {
    "campo1": "valor extraído",
    "campo1_fuente": "nombre_documento.pdf",
    "campo2": ["item1", "item2"]
  },
  "confidence": {
    "campo1": 0.95,
    "campo2": 0.80
  },
  "missing_fields": ["campo3"],
  "warnings": ["mensaje si algo falta"]
}`;

    console.log('Calling OpenAI...');

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
        max_tokens: 4000,
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
    const fieldsFound = Object.keys(aiOutput.extractedData || {}).filter(k => !k.endsWith('_fuente'));
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
        documentCount: documentosTexto.length,
        documentNames: documentosTexto.map(d => d.nombre),
        language: 'es',
        totalWordCount: documentosTexto.reduce((sum, d) => 
          sum + d.contenido.split(/\s+/).length, 0
        )
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
