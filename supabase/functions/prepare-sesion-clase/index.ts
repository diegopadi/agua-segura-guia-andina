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
    const { unidad_data, competencias_ids, duracion_min, recursos_IE, area, grado } = await req.json();

    console.log('Generating sessions with params:', { 
      n_sesiones: unidad_data?.n_sesiones, 
      duracion_min, 
      area, 
      grado 
    });

    // Construct prompt for session generation
    const prompt = `[SYSTEM]
Eres un asistente pedagógico experto en currículo CNEB y diseño de sesiones para secundaria en Perú. Tu labor es proponer sesiones de aprendizaje con lenguaje claro, acción concreta y viables con recursos limitados. Tu salida no es normativa oficial: es un formato referencial que el docente debe validar.

Requisitos generales:
- Usa SIEMPRE el CNEB proporcionado en el contexto para derivar competencias/capacidades (no inventes códigos ni definiciones). 
- Mantén coherencia con: unidad base (A5), estrategias del A4, recursos declarados por la IE y duración por sesión.
- Escribe en español (es-PE). Sé claro, breve y accionable. 
- Incluye un DISCLAIMER al final: "Este diseño ha sido generado automáticamente. Puede contener errores. Valídelo y ajústelo antes de su aplicación en aula."

[DEBE-HACER]
- Genera ${unidad_data?.n_sesiones || 6} sesiones como borradores.
- Cada sesión debe incluir campos editables:
  * titulo
  * proposito (1–2 oraciones, observable)
  * competencias_ids (referencia a CNEB provista)
  * capacidades (nombres/alias a partir del CNEB)
  * inicio / desarrollo / cierre (actividades con tiempos parciales que sumen la duración total; indica propósito breve de cada actividad)
  * evidencias (1–2 evidencias observables y de bajo costo)
  * recursos (según contexto de IE; sugiere alternativas baratas si faltan)
  * duracion_min (entero, ej. 45)
  * evaluacion_sesion_placeholder con criterios_pedagogicos_sugeridos, nps_estudiantes_pregunta, nps_docente_pregunta
- Respeta conectividad variable: prioriza estrategias ejecutables sin proyector/Internet; cuando uses recursos tecnológicos, ofrece plan B.

[ENTRADAS]
- Área: ${area}
- Grado: ${grado}
- Duración por sesión: ${duracion_min} minutos
- Número de sesiones: ${unidad_data?.n_sesiones || 6}
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
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: prompt },
          { 
            role: 'user', 
            content: `Genera ${unidad_data?.n_sesiones || 6} sesiones para ${area} de ${grado} grado, cada una de ${duracion_min} minutos, siguiendo la estructura JSON especificada.` 
          }
        ],
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    let generatedContent = data.choices[0].message.content;

    // Parse JSON response
    let result;
    try {
      // Clean the response to extract JSON
      const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      // Fallback structure
      result = {
        sesiones: Array.from({ length: unidad_data?.n_sesiones || 6 }, (_, i) => ({
          session_index: i + 1,
          titulo: `Sesión ${i + 1}: Desarrollo de competencias`,
          proposito: `Desarrollar competencias específicas del área de ${area}`,
          competencias_ids: competencias_ids || [],
          capacidades: ["Capacidad principal"],
          inicio: `Actividad de inicio (10 min): Presentación del tema`,
          desarrollo: `Actividad de desarrollo (${duracion_min - 20} min): Trabajo principal`,
          cierre: "Actividad de cierre (10 min): Reflexión y síntesis",
          evidencias: ["Participación activa", "Producto de la sesión"],
          recursos: recursos_IE || ["pizarra", "plumones"],
          duracion_min: duracion_min || 45,
          evaluacion_sesion_placeholder: {
            criterios_pedagogicos_sugeridos: ["Comprensión del tema", "Participación activa"],
            nps_estudiantes_pregunta: "¿Qué tan útil te pareció esta sesión para tu aprendizaje?",
            nps_docente_pregunta: "¿Qué tan bien funcionó esta sesión para ti como docente?"
          },
          disclaimer: "Este diseño ha sido generado automáticamente. Puede contener errores. Valídelo y ajústelo antes de su aplicación en aula."
        })),
        checklist_recursos: recursos_IE || ["pizarra", "plumones", "papel"]
      };
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