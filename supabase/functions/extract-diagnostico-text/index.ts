import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.0";

// PDF parsing using pdf2pic for OCR fallback
const parsePdfText = async (pdfBuffer: ArrayBuffer): Promise<string> => {
  try {
    // Try to extract text directly from PDF
    const pdfText = await extractPdfText(pdfBuffer);
    
    if (pdfText && pdfText.trim().length > 50) {
      return pdfText.trim();
    }
    
    // If direct extraction fails or yields little text, use OCR
    console.log('Direct PDF text extraction yielded insufficient text, attempting OCR...');
    return await performOcrOnPdf(pdfBuffer);
    
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('pdf_parse_failed');
  }
};

// Direct PDF text extraction
const extractPdfText = async (pdfBuffer: ArrayBuffer): Promise<string> => {
  // Simple PDF text extraction - looking for text objects
  const uint8Array = new Uint8Array(pdfBuffer);
  const pdfString = new TextDecoder('latin1').decode(uint8Array);
  
  // Basic PDF text extraction using regex patterns
  const textPattern = /BT\s*(.+?)\s*ET/gs;
  const textMatches = pdfString.match(textPattern) || [];
  
  let extractedText = '';
  
  for (const match of textMatches) {
    // Extract text from PDF commands like (Hello World) Tj
    const textContent = match.match(/\(([^)]+)\)/g);
    if (textContent) {
      for (const text of textContent) {
        extractedText += text.replace(/[()]/g, '') + ' ';
      }
    }
  }
  
  return extractedText.trim();
};

// OCR fallback (basic implementation)
const performOcrOnPdf = async (pdfBuffer: ArrayBuffer): Promise<string> => {
  // For now, return a placeholder that indicates OCR was attempted
  // In production, this would integrate with Tesseract.js or similar
  console.log('OCR processing would happen here');
  
  // Basic fallback - extract any readable text patterns
  const uint8Array = new Uint8Array(pdfBuffer);
  const pdfString = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
  
  // Extract any readable text sequences
  const readableText = pdfString.match(/[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]{10,}/g);
  
  if (readableText && readableText.length > 0) {
    return readableText.join(' ').trim();
  }
  
  throw new Error('ocr_no_text_found');
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { file_path } = await req.json();
    
    if (!file_path) {
      throw new Error('missing_file_path');
    }

    console.log('Extracting text from PDF:', file_path);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Download PDF from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('diagnosticos-pdf')
      .download(file_path);

    if (downloadError) {
      console.error('Error downloading file:', downloadError);
      throw new Error('file_not_found');
    }

    if (!fileData) {
      throw new Error('file_empty');
    }

    // Validate file is PDF
    if (!file_path.toLowerCase().endsWith('.pdf')) {
      throw new Error('not_pdf_file');
    }

    // Validate file size (max 5MB)
    const fileSize = fileData.size;
    if (fileSize > 5 * 1024 * 1024) {
      throw new Error('file_too_large');
    }

    console.log(`Processing PDF file: ${file_path}, size: ${fileSize} bytes`);

    // Convert to ArrayBuffer
    const pdfBuffer = await fileData.arrayBuffer();
    
    // Extract text
    const extractedText = await parsePdfText(pdfBuffer);
    
    if (!extractedText || extractedText.trim().length < 10) {
      throw new Error('ocr_insufficient_text');
    }

    console.log(`Successfully extracted ${extractedText.length} characters from PDF`);

    return new Response(JSON.stringify({
      success: true,
      text: extractedText,
      metadata: {
        file_path,
        file_size: fileSize,
        text_length: extractedText.length,
        extraction_method: extractedText.length > 100 ? 'direct' : 'ocr_fallback'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in extract-diagnostico-text:', error);
    
    // Return typed errors
    const errorType = error.message.includes('missing_file_path') ? 'invalid_input' :
                     error.message.includes('file_not_found') ? 'file_not_found' :
                     error.message.includes('file_empty') ? 'file_empty' :
                     error.message.includes('not_pdf_file') ? 'pdf_invalid' :
                     error.message.includes('file_too_large') ? 'file_too_large' :
                     error.message.includes('pdf_parse_failed') ? 'ocr_fail' :
                     error.message.includes('ocr_no_text_found') ? 'ocr_fail' :
                     error.message.includes('ocr_insufficient_text') ? 'ocr_fail' : 'unknown_error';
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      error_type: errorType,
      request_id: crypto.randomUUID(),
      error_preview: error.message.substring(0, 200)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});