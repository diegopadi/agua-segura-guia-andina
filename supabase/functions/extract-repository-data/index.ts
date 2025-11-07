import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { files, aceleradorKey, expectedFields, contexto_proyecto } = await req.json()

    if (!files || files.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No se proporcionaron archivos del repositorio' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`🔍 Analizando ${files.length} archivos del repositorio para ${aceleradorKey}`)

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const documentsContent: Array<{ nombre: string; contenido: string }> = []

    // Descargar y extraer contenido de cada archivo
    for (const file of files) {
      try {
        console.log(`📄 Procesando: ${file.nombre}`)
        
        // Extraer bucket y path de la URL
        const urlParts = file.url.split('/storage/v1/object/public/')
        if (urlParts.length < 2) {
          console.warn(`URL inválida: ${file.url}`)
          continue
        }

        const [bucketAndPath] = urlParts[1].split('/')
        const bucket = 'user_uploads'
        const filePath = urlParts[1].substring(bucket.length + 1)

        // Descargar archivo
        const { data: fileData, error: downloadError } = await supabase.storage
          .from(bucket)
          .download(filePath)

        if (downloadError) {
          console.error(`Error descargando ${file.nombre}:`, downloadError)
          continue
        }

        // Extraer texto según tipo
        let texto = ''
        const fileName = file.nombre.toLowerCase()

        if (fileName.endsWith('.pdf')) {
          // Para PDF, usar API de conversión (simplificado)
          const arrayBuffer = await fileData.arrayBuffer()
          const uint8Array = new Uint8Array(arrayBuffer)
          texto = new TextDecoder().decode(uint8Array)
          // Nota: En producción usar librería PDF especializada
        } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
          // Para Word, extraer como texto plano
          const arrayBuffer = await fileData.arrayBuffer()
          texto = new TextDecoder().decode(arrayBuffer)
        } else {
          // Archivo de texto plano
          texto = await fileData.text()
        }

        if (texto && texto.length > 50) {
          documentsContent.push({
            nombre: file.nombre,
            contenido: texto.substring(0, 15000) // Limitar para no exceder tokens
          })
          console.log(`✅ Extraído ${texto.length} caracteres de ${file.nombre}`)
        }
      } catch (error) {
        console.error(`Error procesando ${file.nombre}:`, error)
      }
    }

    if (documentsContent.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No se pudo extraer contenido de ningún archivo del repositorio' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Construir prompt para OpenAI
    const systemPrompt = `Eres un asistente experto en extraer información de documentos educativos para llenar formularios de proyectos pedagógicos.

**IMPORTANTE**: Tu tarea es analizar TODOS los documentos del repositorio del usuario y extraer información RELEVANTE que pueda llenar los campos del formulario solicitado.

## Documentos del Repositorio (${documentsContent.length} archivos):

${documentsContent.map((doc, idx) => `
### Documento ${idx + 1}: ${doc.nombre}
\`\`\`
${doc.contenido}
\`\`\`
`).join('\n\n')}

## Contexto del Proyecto:
${JSON.stringify(contexto_proyecto, null, 2)}

## Campos esperados a llenar:
${expectedFields.map(field => `
- **${field.label}** (${field.fieldName}): ${field.description}
  Tipo: ${field.type}
  ${field.maxLength ? `Máximo: ${field.maxLength} caracteres` : ''}
`).join('\n')}

## Instrucciones:
1. Analiza TODOS los documentos del repositorio
2. Busca información relevante para cada campo
3. Extrae y sintetiza la información de manera coherente
4. Si un campo no tiene información, déjalo vacío
5. Prioriza información explícita sobre inferencias
6. Respeta los límites de caracteres

Devuelve un JSON con esta estructura:
{
  "extractedData": {
    "campo1": "valor extraído",
    "campo2": "valor extraído"
  },
  "confidence": {
    "campo1": 0.9,
    "campo2": 0.7
  },
  "sources": {
    "campo1": "Documento 1: sección X",
    "campo2": "Documento 2 y 3"
  }
}`

    console.log('🤖 Enviando a OpenAI...')

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `Analiza todos los documentos del repositorio y extrae información para llenar el formulario de ${aceleradorKey}. Devuelve SOLO el JSON sin texto adicional.` 
          }
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error de OpenAI:', errorText)
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const aiData = await response.json()
    const contentText = aiData.choices[0].message.content.trim()
    
    console.log('📦 Respuesta de OpenAI recibida')

    // Parsear respuesta JSON
    let extractionResult
    try {
      // Limpiar markdown si existe
      const jsonText = contentText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      extractionResult = JSON.parse(jsonText)
    } catch (e) {
      console.error('Error parseando JSON:', e)
      throw new Error('No se pudo parsear la respuesta de la IA')
    }

    const { extractedData, confidence, sources } = extractionResult

    // Calcular campos encontrados y faltantes
    const fieldsFound = Object.keys(extractedData).filter(k => extractedData[k])
    const fieldsMissing = expectedFields
      .map(f => f.fieldName)
      .filter(name => !extractedData[name] || extractedData[name].trim() === '')

    console.log(`✅ Extracción completada: ${fieldsFound.length} campos encontrados`)

    return new Response(
      JSON.stringify({
        success: true,
        extractedData,
        confidence,
        sources,
        fieldsFound,
        fieldsMissing,
        documentAnalysis: {
          totalDocuments: documentsContent.length,
          processedDocuments: documentsContent.map(d => d.nombre),
          language: 'es'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('❌ Error en extract-repository-data:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Error procesando documentos del repositorio' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
