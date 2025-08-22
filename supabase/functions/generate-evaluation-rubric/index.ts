import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Generate unique request ID for tracking
  const requestId = crypto.randomUUID();
  
  console.log('[A7:FN_START]', { 
    requestId, 
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString() 
  });

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check for dry run mode
    const url = new URL(req.url);
    const isDryRun = url.searchParams.get('dryRun') === '1';
    
    if (isDryRun) {
      console.log('[A7:DRYRUN]', { requestId });
      const mockEstructura = {
        levels: ["Inicio", "Proceso", "Logro"],
        criteria: [
          {
            criterio: "Comprensión conceptual",
            descripcion: "Evalúa el entendimiento de conceptos clave",
            descriptores: {
              "Inicio": "Demuestra comprensión básica de conceptos",
              "Proceso": "Comprende conceptos y los relaciona parcialmente",
              "Logro": "Domina conceptos y los aplica correctamente"
            }
          },
          {
            criterio: "Aplicación práctica",
            descripcion: "Evalúa la capacidad de aplicar conocimientos",
            descriptores: {
              "Inicio": "Aplica conocimientos con ayuda",
              "Proceso": "Aplica conocimientos con supervisión mínima",
              "Logro": "Aplica conocimientos de forma autónoma"
            }
          },
          {
            criterio: "Análisis crítico",
            descripcion: "Evalúa habilidades de análisis y reflexión",
            descriptores: {
              "Inicio": "Realiza análisis superficiales",
              "Proceso": "Desarrolla análisis con cierta profundidad",
              "Logro": "Produce análisis críticos profundos"
            }
          },
          {
            criterio: "Comunicación de resultados",
            descripcion: "Evalúa la capacidad de comunicar aprendizajes",
            descriptores: {
              "Inicio": "Comunica ideas básicas",
              "Proceso": "Comunica con claridad y organización",
              "Logro": "Comunica de manera efectiva y persuasiva"
            }
          }
        ]
      };
      
      return new Response(JSON.stringify({
        success: true,
        estructura: mockEstructura,
        request_id: requestId,
        dry_run: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const { unidad_data } = await req.json();
    
    console.log('[A7:INPUT_VALIDATION]', { 
      requestId,
      hasApiKey: !!openAIApiKey,
      hasUnidadData: !!unidad_data,
      unidadFields: unidad_data ? Object.keys(unidad_data) : []
    });
    
    if (!openAIApiKey) {
      console.log('[A7:FN_ERROR]', { requestId, error: 'MISSING_API_KEY' });
      return new Response(JSON.stringify({
        success: false,
        error_code: 'MISSING_API_KEY',
        message: 'OpenAI API key not configured',
        request_id: requestId
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!unidad_data) {
      console.log('[A7:FN_ERROR]', { requestId, error: 'INVALID_INPUT' });
      return new Response(JSON.stringify({
        success: false,
        error_code: 'INVALID_INPUT',
        message: 'Missing required parameter: unidad_data',
        request_id: requestId
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate required fields
    if (!unidad_data.proposito || !unidad_data.evidencias) {
      const faltantes = [
        !unidad_data.proposito ? "proposito" : null,
        !unidad_data.evidencias ? "evidencias" : null
      ].filter(Boolean);
      
      console.log('[A7:FN_ERROR]', { requestId, error: 'INVALID_INPUT', faltantes });
      return new Response(JSON.stringify({
        success: false,
        error_code: 'INVALID_INPUT',
        message: `Campos requeridos faltantes: ${faltantes.join(', ')}`,
        details: { faltantes },
        request_id: requestId
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Generating evaluation rubric for:', {
      titulo: unidad_data.titulo,
      area: unidad_data.area_curricular
    });

    const systemPrompt = `Eres un especialista en evaluación educativa en Perú especializado en seguridad hídrica y pertinencia local. 
Genera una rúbrica de evaluación con exactamente 4-8 criterios, cada uno con exactamente 3 niveles de desempeño.
Los niveles SIEMPRE deben ser: "Inicio", "Proceso", "Logro".
Cada descriptor DEBE incluir: verbo de desempeño + condición/contexto + evidencia observable.
Responde SIEMPRE en JSON válido con la estructura exacta requerida.`;

    const userPrompt = `Genera una rúbrica de evaluación para esta unidad de aprendizaje enfocada en seguridad hídrica y pertinencia local.

DATOS DE LA UNIDAD:
- Título: ${unidad_data.titulo}
- Área: ${unidad_data.area_curricular}
- Grado: ${unidad_data.grado}
- Número de sesiones: ${unidad_data.numero_sesiones}
- Duración: ${unidad_data.duracion_min} minutos
- Propósito: ${unidad_data.proposito}
- Evidencias: ${unidad_data.evidencias}
- Competencias: ${Array.isArray(unidad_data.competencias_ids) ? unidad_data.competencias_ids.join(', ') : 'N/A'}

ESTRUCTURA JSON REQUERIDA:
{
  "levels": ["Inicio", "Proceso", "Logro"],
  "criteria": [
    {
      "criterio": "Nombre del criterio de evaluación",
      "descripcion": "Descripción del criterio enfocado en seguridad hídrica y contexto local",
      "descriptores": {
        "Inicio": "VERBO + análisis básico con apoyo + evidencia observable específica",
        "Proceso": "VERBO + análisis autónomo parcial + evidencia verificable con datos locales",
        "Logro": "VERBO + análisis crítico completo + sustentación con múltiples evidencias locales"
      }
    }
  ]
}

REQUISITOS ESPECÍFICOS:
- Entre 4 y 8 criterios de evaluación
- Cada descriptor debe incluir: VERBO DE DESEMPEÑO + CONDICIÓN/CONTEXTO + EVIDENCIA OBSERVABLE
- Incorpora conceptos de seguridad hídrica cuando sea relevante (disponibilidad, accesibilidad, calidad, sostenibilidad)
- Incluye pertinencia local (referencias a la comunidad, contexto regional, datos locales)
- Los descriptores deben ser progresivos y específicos
- Usa verbos como: analiza, evalúa, propone, sustenta, compara, diseña, explica
- Ejemplos de evidencias observables: "con dos datos verificables", "mediante esquema completo", "sustentando con tres fuentes locales"

Genera la rúbrica ahora:`;

    console.log('[A7:OPENAI_REQ]', { 
      requestId,
      model: 'gpt-4o-mini',
      systemPromptLength: systemPrompt.length,
      userPromptLength: userPrompt.length
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
        response_format: { type: "json_object" },
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.log('[A7:FN_ERROR]', { 
        requestId, 
        error: 'OPENAI_ERROR', 
        status: response.status,
        errorPreview: errorData.substring(0, 200)
      });
      return new Response(JSON.stringify({
        success: false,
        error_code: 'OPENAI_ERROR',
        message: `OpenAI API error: ${response.status}`,
        details: { status: response.status, error: errorData.substring(0, 200) },
        request_id: requestId
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;
    
    console.log('[A7:OPENAI_RES]', { 
      requestId,
      hasResponse: !!aiResponse,
      responsePreview: aiResponse ? aiResponse.substring(0, 200) + '...' : 'null',
      usage: data.usage
    });

    if (!aiResponse) {
      console.log('[A7:FN_ERROR]', { requestId, error: 'INVALID_AI_JSON', message: 'No content in AI response' });
      return new Response(JSON.stringify({
        success: false,
        error_code: 'INVALID_AI_JSON',
        message: 'No content received from OpenAI',
        request_id: requestId
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let rubricResult;
    try {
      rubricResult = JSON.parse(aiResponse);
      console.log('[A7:PARSE_SUCCESS]', { 
        requestId,
        hasLevels: !!rubricResult.levels,
        hasCriteria: !!rubricResult.criteria,
        criteriaCount: Array.isArray(rubricResult.criteria) ? rubricResult.criteria.length : 0
      });
    } catch (parseError) {
      console.log('[A7:FN_ERROR]', { 
        requestId, 
        error: 'INVALID_AI_JSON', 
        parseError: parseError.message,
        responsePreview: aiResponse.substring(0, 300)
      });
      return new Response(JSON.stringify({
        success: false,
        error_code: 'INVALID_AI_JSON',
        message: 'Could not parse AI response as JSON',
        details: { parseError: parseError.message, responsePreview: aiResponse.substring(0, 200) },
        request_id: requestId
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate response structure
    const validationErrors = [];
    
    if (!rubricResult.levels || !rubricResult.criteria) {
      validationErrors.push('Missing required fields: levels or criteria');
    }
    
    if (!Array.isArray(rubricResult.criteria) || rubricResult.criteria.length < 4 || rubricResult.criteria.length > 8) {
      validationErrors.push(`Invalid criteria count: ${rubricResult.criteria?.length || 0}. Must be between 4-8.`);
    }
    
    if (!Array.isArray(rubricResult.levels) || !rubricResult.levels.includes('Inicio') || !rubricResult.levels.includes('Proceso') || !rubricResult.levels.includes('Logro')) {
      validationErrors.push('Invalid levels. Must include: Inicio, Proceso, Logro');
    }
    
    if (Array.isArray(rubricResult.criteria)) {
      rubricResult.criteria.forEach((criterion, index) => {
        if (!criterion.criterio || typeof criterion.criterio !== 'string' || criterion.criterio.trim() === '') {
          validationErrors.push(`Criterion ${index + 1}: missing or empty criterio`);
        }
        if (!criterion.descriptores || typeof criterion.descriptores !== 'object') {
          validationErrors.push(`Criterion ${index + 1}: missing descriptores object`);
        } else {
          const expectedLevels = ['Inicio', 'Proceso', 'Logro'];
          for (const level of expectedLevels) {
            if (!criterion.descriptores[level] || typeof criterion.descriptores[level] !== 'string' || criterion.descriptores[level].trim() === '') {
              validationErrors.push(`Criterion ${index + 1}: missing or empty descriptor for level ${level}`);
            }
          }
        }
      });
    }
    
    if (validationErrors.length > 0) {
      console.log('[A7:FN_ERROR]', { 
        requestId, 
        error: 'VALIDATION_FAIL', 
        validationErrors,
        criteriaCount: rubricResult.criteria?.length || 0
      });
      return new Response(JSON.stringify({
        success: false,
        error_code: 'VALIDATION_FAIL',
        message: 'Validation failed for generated rubric',
        details: { validationErrors },
        request_id: requestId
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[A7:VALIDATION]', { 
      requestId,
      criteriaCount: rubricResult.criteria.length,
      levelsCount: rubricResult.levels.length,
      allCriteriaValid: true
    });

    console.log('[A7:FN_SUCCESS]', { 
      requestId,
      criteriaCount: rubricResult.criteria.length,
      totalDescriptors: rubricResult.criteria.length * 3,
      timestamp: new Date().toISOString()
    });

    return new Response(JSON.stringify({
      success: true,
      estructura: rubricResult,
      request_id: requestId,
      metadata: {
        criteria_count: rubricResult.criteria.length,
        levels_count: rubricResult.levels.length,
        generated_at: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.log('[A7:FN_ERROR]', { 
      requestId: requestId || crypto.randomUUID(),
      error: 'UNEXPECTED',
      message: error.message,
      stack: error.stack?.substring(0, 500),
      timestamp: new Date().toISOString()
    });
    
    return new Response(JSON.stringify({
      success: false,
      error_code: 'UNEXPECTED',
      message: 'An unexpected error occurred',
      details: { error: error.message },
      request_id: requestId || crypto.randomUUID()
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});