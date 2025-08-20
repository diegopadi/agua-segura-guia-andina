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

    // Extract correct parameters
    const numSesiones = unidad_data?.numSesiones || unidad_data?.n_sesiones || 6;
    const horasPorSesion = unidad_data?.horasPorSesion || duracion_min || 45;
    
    console.log('Generating sessions with params:', { 
      numSesiones, 
      horasPorSesion, 
      area, 
      grado,
      unidad_data_keys: unidad_data ? Object.keys(unidad_data) : [],
      a4_strategies_count: a4_strategies.length,
      a4_priorities_count: a4_priorities.length,
      a4_strategies_titles: a4_strategies.map(s => s.title || 'Untitled').join(', '),
      a4_priorities_titles: a4_priorities.map(p => p.title || 'Untitled').join(', ')
    });

    // Validate critical parameters
    if (horasPorSesion > 300) {
      console.error('CRITICAL: Duration seems incorrect:', horasPorSesion, 'minutes');
      return new Response(JSON.stringify({ 
        status: "error", 
        reason: "invalid_duration",
        message: `Duration ${horasPorSesion} minutes seems incorrect. Expected 45-90 minutes.`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Construct prompt for session generation
    const prompt = `[SYSTEM]
Eres un asistente pedagógico experto en currículo CNEB y diseño de sesiones para secundaria en Perú. Tu labor es proponer sesiones de aprendizaje con lenguaje claro, acción concreta y viables con recursos limitados. Tu salida no es normativa oficial: es un formato referencial que el docente debe validar.

Requisitos generales:
- Usa SIEMPRE el CNEB proporcionado en el contexto para derivar competencias/capacidades (no inventes códigos ni definiciones). 
- Mantén coherencia con: unidad base (A5), estrategias del A4, recursos declarados por la IE y duración por sesión.
- Escribe en español (es-PE). Sé claro, breve y accionable. 
- Incluye un DISCLAIMER al final: "Este diseño ha sido generado automáticamente. Puede contener errores. Valídelo y ajústelo antes de su aplicación en aula."

[INTEGRACIÓN DE ESTRATEGIAS A4]
${a4_strategies.length > 0 ? `
- ESTRATEGIAS SELECCIONADAS A4: ${JSON.stringify(a4_strategies)}
- DISTRIBUYE estas estrategias entre las ${numSesiones} sesiones de manera equilibrada
- Cada sesión debe incorporar al menos UNA estrategia específica del A4 en sus actividades
- Traduce cada estrategia en actividades concretas y prácticas para el aula
- Menciona EXPLÍCITAMENTE qué estrategia A4 está siendo aplicada en cada actividad
- Varía el uso de estrategias para crear sesiones diversas y dinámicas
` : '- No se proporcionaron estrategias específicas del A4. Genera sesiones estándar basadas en la unidad.'}

${Object.keys(profundization_responses).length > 0 ? `
[CONTEXTO DE PROFUNDIZACIÓN A4]
- Respuestas de profundización: ${JSON.stringify(profundization_responses)}
- Considera estas respuestas para adaptar las estrategias al contexto específico
` : ''}

[DEBE-HACER]
- Genera ${numSesiones} sesiones como borradores.
- Cada sesión debe incluir campos editables:
  * titulo (que refleje la estrategia A4 integrada cuando aplique)
  * proposito (1–2 oraciones, observable)
  * competencias_ids (referencia a CNEB provista)
  * capacidades (nombres/alias a partir del CNEB)
  * inicio / desarrollo / cierre (actividades con tiempos parciales que sumen la duración total; indica propósito breve de cada actividad + estrategia A4 aplicada)
  * evidencias (1–2 evidencias observables y de bajo costo)
  * recursos (según contexto de IE; sugiere alternativas baratas si faltan)
  * duracion_min (entero, ej. 45)
  * evaluacion_sesion_placeholder con criterios_pedagogicos_sugeridos, nps_estudiantes_pregunta, nps_docente_pregunta
- Respeta conectividad variable: prioriza estrategias ejecutables sin proyector/Internet; cuando uses recursos tecnológicos, ofrece plan B.

[ENTRADAS]
- Área: ${area}
- Grado: ${grado}
- Duración por sesión: ${horasPorSesion} minutos
- Número de sesiones: ${numSesiones}
- Competencias: ${JSON.stringify(competencias_ids)}
- Recursos IE: ${JSON.stringify(recursos_IE)}
- Unidad base: ${JSON.stringify(unidad_data)}

Genera el JSON con la estructura exacta solicitada para las sesiones.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: prompt },
          { 
            role: 'user', 
            content: `Genera ${numSesiones} sesiones para ${area} de ${grado} grado, cada una de ${horasPorSesion} minutos, siguiendo la estructura JSON especificada.` 
          }
        ],
        max_completion_tokens: 4000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    let generatedContent = data.choices[0].message.content;

    // Parse JSON response with improved robustness
    let result;
    try {
      console.log('Raw OpenAI response:', generatedContent);
      
      // Multiple cleaning strategies for JSON extraction
      let cleanedContent = generatedContent.trim();
      
      // Remove common prefixes that might break JSON parsing
      cleanedContent = cleanedContent.replace(/^```json\s*/, '');
      cleanedContent = cleanedContent.replace(/\s*```$/, '');
      cleanedContent = cleanedContent.replace(/^.*?(\{[\s\S]*\}).*$/s, '$1');
      
      // Try to find JSON boundaries more precisely
      const jsonStart = cleanedContent.indexOf('{');
      const jsonEnd = cleanedContent.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        const jsonString = cleanedContent.substring(jsonStart, jsonEnd + 1);
        console.log('Extracted JSON string:', jsonString);
        result = JSON.parse(jsonString);
        
        // Validate that result has the expected structure
        if (!result.sesiones || !Array.isArray(result.sesiones)) {
          throw new Error('Invalid JSON structure: missing sesiones array');
        }
        
        console.log('Successfully parsed OpenAI response with', result.sesiones.length, 'sessions');
      } else {
        throw new Error('No valid JSON boundaries found in response');
      }
    } catch (parseError) {
      console.error('CRITICAL: Failed to parse OpenAI response:', parseError);
      console.error('Raw response length:', generatedContent?.length || 0);
      console.error('Response preview:', generatedContent?.substring(0, 200) || 'No content');
      
      // Return explicit error instead of silent fallback
      return new Response(JSON.stringify({ 
        status: "error", 
        reason: "json_parse_failed",
        message: "Failed to parse OpenAI response. The generated content was not valid JSON.",
        debug_info: {
          parse_error: parseError.message,
          response_preview: generatedContent?.substring(0, 200) || 'No content'
        }
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
      
      // Enhanced fallback structure with proper parameters
      result = {
        sesiones: Array.from({ length: numSesiones }, (_, i) => {
          const strategyIndex = i % (a4_strategies.length || 1);
          const strategy = a4_strategies[strategyIndex];
          const hasStrategy = strategy && strategy.title;
          
          return {
            session_index: i + 1,
            titulo: hasStrategy 
              ? `Sesión ${i + 1}: ${area} - ${strategy.title}` 
              : `Sesión ${i + 1}: ${area} - Desarrollo de competencias`,
            proposito: hasStrategy 
              ? `Desarrollar competencias de ${area} aplicando la estrategia "${strategy.title}" en ${grado} grado`
              : `Desarrollar competencias específicas del área de ${area} para ${grado} grado`,
            competencias_ids: competencias_ids || [],
            capacidades: ["Comprende conceptos fundamentales", "Aplica conocimientos", "Comunica ideas"],
            inicio: hasStrategy 
              ? `Actividad de inicio (10 min): Motivación usando elementos de "${strategy.title}" para introducir el tema de ${area}`
              : `Actividad de inicio (10 min): Motivación y presentación del tema de ${area}`,
            desarrollo: hasStrategy 
              ? `Actividad de desarrollo (${Math.max(horasPorSesion - 20, 15)} min): Implementación de la estrategia "${strategy.title}" - ${strategy.description || 'desarrollo de actividades colaborativas y práctica guiada'}`
              : `Actividad de desarrollo (${Math.max(horasPorSesion - 20, 15)} min): Trabajo colaborativo y práctica guiada`,
            cierre: hasStrategy 
              ? `Actividad de cierre (10 min): Evaluación y reflexión sobre la aplicación de "${strategy.title}" en los aprendizajes`
              : "Actividad de cierre (10 min): Consolidación y reflexión sobre los aprendizajes",
            evidencias: ["Participación en discusiones", "Resolución de ejercicios", "Trabajo colaborativo"],
            recursos: recursos_IE || ["pizarra", "plumones", "papel", "materiales de aula"],
            duracion_min: horasPorSesion,
            evaluacion_sesion_placeholder: {
              criterios_pedagogicos_sugeridos: [
                "Logro de competencias programadas",
                hasStrategy ? `Aplicación efectiva de "${strategy.title}"` : "Participación activa y colaborativa",
                "Calidad de los productos elaborados"
              ],
              nps_estudiantes_pregunta: "¿Qué tan útil te pareció esta sesión para tu aprendizaje?",
              nps_docente_pregunta: "¿Qué tan bien funcionó esta sesión para lograr los objetivos programados?"
            },
            disclaimer: "Este diseño ha sido generado automáticamente. Puede contener errores. Valídelo y ajústelo antes de su aplicación en aula."
          };
        }),
        checklist_recursos: recursos_IE || ["pizarra", "plumones", "papel", "cuadernos", "materiales básicos"]
      };
      
      console.log('Fallback structure generated with', result.sesiones.length, 'sessions');
    }

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