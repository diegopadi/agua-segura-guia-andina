import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      }
    });
  }

  let request_id: string | undefined;

  try {
    // Parse JSON with error handling
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.log('[A8:EDGE_PARSE_ERROR]', { 
        error: parseError.message,
        timestamp: new Date().toISOString() 
      });
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid JSON',
        error_code: 'PARSE_ERROR'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { unidad_data, unidad_data_min, request_id: requestId, force, source_hash, previous_sessions_ids } = requestBody;
    request_id = requestId;
    
    // Accept either format for backward compatibility
    const unidadData = unidad_data || unidad_data_min;

    console.log('[A8:EDGE_START]', {
      request_id,
      method: req.method,
      hasUnidadData: !!unidadData
    });

    if (!unidadData) {
      throw new Error('Missing required parameter: unidad_data');
    }

    console.log('[A8:EDGE_INPUT]', {
      request_id,
      hasUnidadData: !!unidadData,
      titulo: unidadData?.titulo || 'N/A',
      numero_sesiones: unidadData?.numero_sesiones || 0,
      duracion: unidadData?.duracion_min || 0,
      force: !!force,
      source_hash: source_hash || 'none',
      previous_sessions_count: previous_sessions_ids?.length || 0,
      timestamp: new Date().toISOString()
    });

    // Check API key
    if (!openAIApiKey) {
      console.log('[A8:EDGE_MISSING_API_KEY]', { 
        request_id,
        timestamp: new Date().toISOString() 
      });
      
      throw new Error('OpenAI API key not configured');
    }

    // Skip hash-based gating when force=true
    if (!force && source_hash && previous_sessions_ids?.length > 0) {
      console.log('[A8:EDGE_NOCHANGE]', { 
        request_id,
        source_hash,
        message: 'Hash comparison logic would go here'
      });
    }

    const systemPrompt = `Eres un diseñador curricular experto que crea sesiones de aprendizaje para secundaria en Perú. 
Generas sesiones completas con estructura pedagógica (inicio, desarrollo, cierre) siguiendo los momentos estándar: activación de saberes previos, conflicto cognitivo, construcción del aprendizaje, evaluación formativa, y metacognición.
Cada sesión debe incluir una mini-rúbrica observacional con exactamente 3 niveles (Inicio, Proceso, Logro) y entre 2-8 criterios observables.
Responde SIEMPRE en formato JSON válido, sin markdown ni comentarios adicionales.

Estructura JSON requerida:
{
  "sessions": [
    {
      "titulo": "string",
      "inicio": "string (actividades de motivación y saberes previos)",
      "desarrollo": "string (construcción del aprendizaje)",
      "cierre": "string (consolidación y evaluación)",
      "evidencias": ["string array de productos observables"],
      "rubrica_sesion": {
        "levels": ["Inicio", "Proceso", "Logro"],
        "criteria": ["criterio 1", "criterio 2", ...] // 2-8 criterios observables
      }
    }
  ]
}`;

    const tema = unidadData.tema_transversal || unidadData.titulo || '';
    const diag = unidadData.diagnostico_text || '';
    const recs = typeof unidadData.ia_recomendaciones === 'string'
      ? unidadData.ia_recomendaciones
      : JSON.stringify(unidadData.ia_recomendaciones || {});

    console.log('[A8:EDGE_CONTEXT]', { tema, diag_len: diag.length, has_recs: !!recs });

    // Add variation for regeneration
    const variationPrompt = force ? 
      `\n\nVARIACIÓN: Explora enfoques alternativos y nuevos ejemplos manteniendo el mismo tema. Usa diferentes estrategias pedagógicas, materiales distintos, y actividades variadas. Cambia los ejemplos específicos pero mantén la coherencia temática con "${tema}".` 
      : '';

    console.log('[A8:EDGE_CALL]', { request_id, model: 'gpt-5-2025-08-07', has_variation: !!force });

    const userPrompt = `Diseña ${unidadData.numero_sesiones} sesiones completas de ${unidadData.duracion_min} minutos cada una para la siguiente unidad de aprendizaje:

DATOS DE LA UNIDAD:
Título: ${unidadData.titulo}
Área: ${unidadData.area_curricular} 
Grado: ${unidadData.grado}
Propósito: ${unidadData.proposito}
Competencias: ${unidadData.competencias_ids}

CONTEXTO TEMÁTICO:
- Tema central: ${tema}
- Síntesis de diagnóstico (texto del docente): ${diag.slice(0, 1500)}
- Recomendaciones previas (IA/A6): ${recs.slice(0, 800)}

Alinea cada sesión (inicio, desarrollo, cierre, evidencias y mini-rúbrica) a «${tema}». Incluye ejemplos, problemas, recursos y evaluaciones relacionados explícitamente con ${tema}.

Cada sesión debe:
- Tener un título específico y descriptivo contextualizado a ${tema}
- Incluir actividades concretas para inicio, desarrollo y cierre relacionadas con ${tema}
- Proporcionar evidencias observables del aprendizaje vinculadas a ${tema}
- Tener una mini-rúbrica con 2-8 criterios específicos y observables sobre ${tema}
- Seguir la secuencia pedagógica apropiada para el área y grado
- Incorporar ejemplos, materiales y situaciones específicos de ${tema}${variationPrompt}`;

    const fullPrompt = systemPrompt + `\n\nContextualiza TODAS las actividades a la temática central: «${tema}». Usa el diagnóstico y recomendaciones provistas para aterrizar ejemplos, materiales, situaciones y evaluación.${variationPrompt}`;
    
    console.log('[A8:EDGE_AI_PROMPT]', { 
      request_id, 
      tema, 
      has_diagnostico: diag.length > 0,
      has_recomendaciones: !!recs,
      prompt_preview: fullPrompt.slice(0, 300) + '...'
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { 
            role: 'system', 
            content: fullPrompt
          },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.log('[A8:EDGE_AI_ERROR]', {
        request_id,
        status: response.status,
        error: errorData.slice(0, 500)
      });
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('[A8:EDGE_AI_RESPONSE]', {
      request_id,
      response_length: aiResponse?.length || 0,
      response_preview: aiResponse?.slice(0, 200) + '...' || 'empty'
    });

    let sessionStructure;
    try {
      sessionStructure = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      throw new Error('Invalid AI response format');
    }

    // Enhanced validation for expected structure
    if (!sessionStructure.sessions || !Array.isArray(sessionStructure.sessions)) {
      console.log('[A8:EDGE_INVALID]', { 
        request_id,
        error: 'Missing or invalid sessions array',
        received: Object.keys(sessionStructure)
      });
      throw new Error('AI response missing sessions array');
    }

    // Validate each session
    for (const session of sessionStructure.sessions) {
      if (!session.titulo && !session.inicio && !session.desarrollo && !session.cierre) {
        throw new Error('Session missing required content fields');
      }
      
      if (!session.rubrica_sesion?.criteria || !Array.isArray(session.rubrica_sesion.criteria)) {
        throw new Error('Session missing valid rubric criteria');
      }
      
      if (session.rubrica_sesion.criteria.length < 2 || session.rubrica_sesion.criteria.length > 8) {
        throw new Error('Session rubric must have between 2-8 criteria');
      }
      
      // Ensure standard evaluation levels
      session.rubrica_sesion.levels = ['Inicio', 'Proceso', 'Logro'];
    }

    // Validate thematic contextualization
    const allMentionTema = sessionStructure.sessions.every(
      s => JSON.stringify(s).toLowerCase().includes((tema||'').toLowerCase())
    );
    
    console.log('[A8:EDGE_VALID_CONTEXT]', { allMentionTema });
    
    if (!allMentionTema) {
      throw new Error('INVALID_CONTEXT: sesiones sin mención explícita al tema transversal/central');
    }

    console.log('[A8:EDGE_OK]', { 
      request_id: request_id || 'unknown',
      sessions_generated: sessionStructure.sessions.length,
      total_criteria: sessionStructure.sessions.reduce((acc: number, s: any) => acc + s.rubrica_sesion.criteria.length, 0)
    });

    return new Response(JSON.stringify({
      success: true,
      sessions: sessionStructure.sessions
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorRequestId = request_id || crypto.randomUUID();
    
    console.log('[A8:EDGE_ERROR]', {
      request_id: errorRequestId,
      error: error.message,
      stack: error.stack?.substring(0, 400)
    });
    
    const errorPreview = error.message.substring(0, 200);
    
    // Determine error type and status
    const isValidationError = error.message.includes('Session missing') || 
                             error.message.includes('rubric must have') ||
                             error.message.includes('sessions array') ||
                             error.message.includes('INVALID_CONTEXT');
    
    const status = isValidationError ? 400 : 500;
    const errorCode = error.message.includes('Missing required') ? 'INVALID_INPUT' :
                     error.message.includes('Session missing') || isValidationError ? 'INVALID_STRUCTURE' :
                     error.message.includes('Invalid AI response') ? 'SHAPE_MISMATCH' :
                     error.message.includes('INVALID_CONTEXT') ? 'INVALID_CONTEXT' :
                     error.message.includes('API key') ? 'CONFIG_ERROR' : 
                     error.message.includes('Parse') ? 'PARSE_ERROR' : 'UNKNOWN_ERROR';
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      error_code: errorCode,
      request_id: errorRequestId,
      error_preview: errorPreview
    }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});