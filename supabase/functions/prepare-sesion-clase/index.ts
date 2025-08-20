import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { unidad_data, competencias_ids, duracion_min, recursos_IE, area, grado, a4_strategies = [], a4_priorities = [], profundization_responses = {} } = await req.json();

    // Extract parameters - SOLO usar duracion_min
    const numSesiones = unidad_data?.numSesiones || 6;
    const horasPorSesion = duracion_min; // Renombrar para compatibilidad interna
    
    console.log('Generating sessions with params:', { 
      numSesiones, 
      duracion_min,
      horasPorSesion, // Para logging
      area, 
      grado,
      unidad_data_keys: unidad_data ? Object.keys(unidad_data) : [],
      a4_strategies_count: a4_strategies.length,
      a4_priorities_count: a4_priorities.length,
      a4_strategies_titles: a4_strategies.map(s => s.title || 'Untitled').join(', '),
      a4_priorities_titles: a4_priorities.map(p => p.title || 'Untitled').join(', ')
    });

    // Validación estricta 30-180 minutos
    if (!Number.isFinite(duracion_min) || duracion_min < 30 || duracion_min > 180) {
      console.error('CRITICAL: Invalid duration_min:', duracion_min);
      return new Response(JSON.stringify({ 
        status: "error", 
        reason: "invalid_duration",
        message: `Duración ${duracion_min} minutos inválida. Debe estar entre 30-180 minutos.`,
        suggestion: "Ajusta la duración en A5 entre 1-3 horas (30-180 min)"
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Construct strict JSON prompt for session generation
    const prompt = `[SYSTEM]
Eres un especialista en diseño curricular con experiencia en el CNEB del Perú. Genera sesiones de aprendizaje con estructura JSON ESTRICTA.

[CONTEXT]
- Área: ${area}
- Grado: ${grado}  
- Duración por sesión: ${horasPorSesion} minutos
- Número de sesiones: ${numSesiones}
- Unidad: ${JSON.stringify(unidad_data)}
- Estrategias A4 (${a4_strategies.length}): ${JSON.stringify(a4_strategies)}
- Prioridades A4 (${a4_priorities.length}): ${JSON.stringify(a4_priorities)}
- Competencias seleccionadas: ${JSON.stringify(competencias_ids)}

[INSTRUCCIONES DE SALIDA ESTRICTAS]
Devuelve SOLO un objeto JSON válido (sin explicación ni texto fuera del JSON).

Estructura OBLIGATORIA por sesión:
{
  "session_index": <int>,
  "titulo": "Sesión X – <Estrategia A4>: <Título descriptivo>",
  "proposito": "<string>",
  "competencias_ids": [<string>],
  "capacidades": [<string>],
  "duracion_min": ${horasPorSesion},
  "inicio": {
    "timebox_min": <int>,
    "steps": [<string>, <string>],
    "apoya_estrategia": <boolean>
  },
  "desarrollo": {
    "timebox_min": <int>, 
    "steps": [<string>, <string>, <string>],
    "apoya_estrategia": <boolean>
  },
  "cierre": {
    "timebox_min": <int>,
    "steps": [<string>, <string>],
    "apoya_estrategia": <boolean>
  },
  "evidencias": [<string>],
  "recursos": [<string>],
  "rubricas_ids": [],
  "disclaimer": "Generado automáticamente; valide antes de usar."
}

REGLAS OBLIGATORIAS:
1. Una estrategia A4 principal por sesión y rotación entre sesiones
2. Suma de timebox_min = duracion_min ±5 minutos
3. Título incluye la estrategia A4 explícitamente
4. Mapear competencias_ids/capacidades desde el contexto proporcionado
5. Steps con verbos operativos y acciones concretas (no genéricos)
6. apoya_estrategia=true cuando el bloque usa la estrategia A4 principal
7. Idioma: es-PE, tono docente cercano
8. Incluir alternativas de bajo costo en recursos

RESPUESTA GLOBAL:
{
  "sesiones": [<estructura_sesion>, <estructura_sesion>, ...],
  "checklist_recursos": [
    {"recurso": "Pizarra", "alternativa_bajo_costo": "Papelógrafo", "offline_plan": "Tarjetas de papel"},
    {"recurso": "Proyector", "alternativa_bajo_costo": "Láminas impresas", "offline_plan": "Dibujos en pizarra"}
  ]
}

Responde ÚNICAMENTE con JSON válido, sin texto adicional.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: 'Eres un especialista en diseño curricular del CNEB. Responde ÚNICAMENTE con JSON válido estricto.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 4000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();

    // Validar estructura OpenAI
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('OpenAI response missing structure:', data);
      throw new Error('OpenAI returned malformed response structure');
    }

    let generatedContent = data.choices[0].message.content;

    // PREVIEW del content antes del parse
    console.log('OpenAI content preview (first 300 chars):', generatedContent?.substring(0, 300));
    console.log('OpenAI content length:', generatedContent?.length);

    // Validar contenido no vacío
    if (!generatedContent || typeof generatedContent !== 'string' || generatedContent.trim().length === 0) {
      console.error('CRITICAL: OpenAI returned empty content');
      console.error('Request duration was:', duracion_min);
      throw new Error(`OpenAI returned empty response with duration ${duracion_min} min`);
    }

    // Parse and validate JSON response with strict structure checking
    let result;
    try {
      // Clean the response (remove markdown formatting if present)
      const cleanContent = generatedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      result = JSON.parse(cleanContent);
      
      // Strict validation of response structure
      if (!result.sesiones || !Array.isArray(result.sesiones)) {
        throw new Error('Missing sesiones array in response');
      }

      // Validate each session structure
      for (let i = 0; i < result.sesiones.length; i++) {
        const session = result.sesiones[i];
        
        // Check if inicio/desarrollo/cierre are objects with timebox_min and steps
        if (!session.inicio || typeof session.inicio !== 'object' || 
            typeof session.inicio.timebox_min !== 'number' || 
            !Array.isArray(session.inicio.steps)) {
          return new Response(JSON.stringify({ 
            status: "error", 
            reason: "invalid_shape_blocks",
            message: `Session ${i + 1}: inicio must be an object with timebox_min (number) and steps (array)`,
            session_index: i + 1
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (!session.desarrollo || typeof session.desarrollo !== 'object' || 
            typeof session.desarrollo.timebox_min !== 'number' || 
            !Array.isArray(session.desarrollo.steps)) {
          return new Response(JSON.stringify({ 
            status: "error", 
            reason: "invalid_shape_blocks",
            message: `Session ${i + 1}: desarrollo must be an object with timebox_min (number) and steps (array)`,
            session_index: i + 1
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (!session.cierre || typeof session.cierre !== 'object' || 
            typeof session.cierre.timebox_min !== 'number' || 
            !Array.isArray(session.cierre.steps)) {
          return new Response(JSON.stringify({ 
            status: "error", 
            reason: "invalid_shape_blocks",
            message: `Session ${i + 1}: cierre must be an object with timebox_min (number) and steps (array)`,
            session_index: i + 1
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Validate timebox sum
        const totalTimebox = session.inicio.timebox_min + session.desarrollo.timebox_min + session.cierre.timebox_min;
        const expectedDuration = session.duracion_min || horasPorSesion;
        if (Math.abs(totalTimebox - expectedDuration) > 5) {
          return new Response(JSON.stringify({ 
            status: "error", 
            reason: "timebox_mismatch",
            message: `Session ${i + 1}: timebox sum (${totalTimebox}) differs from expected duration (${expectedDuration}) by more than 5 minutes`,
            session_index: i + 1,
            expected: expectedDuration,
            actual: totalTimebox
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Validate competencias and capacidades
        if (!Array.isArray(session.competencias_ids) || session.competencias_ids.length === 0) {
          return new Response(JSON.stringify({ 
            status: "error", 
            reason: "missing_competencies",
            message: `Session ${i + 1}: competencias_ids must be a non-empty array`,
            session_index: i + 1
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (!Array.isArray(session.capacidades) || session.capacidades.length === 0) {
          return new Response(JSON.stringify({ 
            status: "error", 
            reason: "missing_competencies",
            message: `Session ${i + 1}: capacidades must be a non-empty array`,
            session_index: i + 1
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Validate A4 strategy in title
        if (!session.titulo || typeof session.titulo !== 'string' || 
            (!session.titulo.toLowerCase().includes('estrategia') && !session.titulo.toLowerCase().includes('a4'))) {
          return new Response(JSON.stringify({ 
            status: "error", 
            reason: "missing_a4_strategy",
            message: `Session ${i + 1}: title must include reference to A4 strategy`,
            session_index: i + 1,
            title: session.titulo
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      console.log('Validation successful, sessions:', {
        sessions_count: result.sesiones.length,
        total_strategies: a4_strategies.length,
        duration: horasPorSesion
      });
      
    } catch (parseError) {
      console.error('CRITICAL: JSON parse failed:', parseError);
      console.error('Raw content that failed:', generatedContent?.substring(0, 500));
      console.error('Original request params:', { numSesiones, duracion_min, area, grado });
      
      return new Response(JSON.stringify({ 
        status: "error", 
        reason: "json_parse_failed",
        message: "La IA devolvió formato inválido. Intenta con duración entre 45-90 minutos.",
        suggestion: duracion_min < 45 ? 
          "Duración muy corta. Cambia a 45-90 minutos y reintenta" :
          "Verifica que la duración esté entre 45-90 minutos",
        debug_info: {
          duration_used: duracion_min,
          content_preview: generatedContent?.substring(0, 200) || 'Empty'
        }
      }), {
        status: 502, // 502 no 500
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // NO FALLBACK - If we reach here, validation passed
    console.log('Sessions generated successfully with strict validation');

    console.log('Generated content:', JSON.stringify(result, null, 2));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in prepare-sesion-clase function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});