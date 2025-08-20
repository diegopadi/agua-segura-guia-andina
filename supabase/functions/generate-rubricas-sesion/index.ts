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
    const { sesion_id, session_index, area, grado, competencias_ids, capacidades } = await req.json();

    console.log('Generating rubrics for session:', sesion_id, 'index:', session_index);

    // Get session data
    const { data: sessionData, error: sessionError } = await supabase
      .from('sesiones_clase')
      .select('*')
      .eq('id', sesion_id)
      .single();

    if (sessionError) {
      throw new Error(`Error fetching session: ${sessionError.message}`);
    }

    const prompt = `[SYSTEM]
Eres un asistente pedagógico que genera instrumentos de evaluación de sesión. Basas tus criterios en el CNEB y en la sesión seleccionada. Tu salida es referencial, no normativa, y debe ser validada por el docente.

[DEBE-HACER]
Genera TRES instrumentos para la sesión:
1) Rúbrica pedagógica de la sesión (analítica simple, 2–3 criterios alineados a la(s) capacidad(es) del CNEB). 
   - Niveles: 1–4 con descriptores claros (Inicio / En proceso / Logro / Destacado).
   - Indicadores concretos (observables en 1 clase).
2) Encuesta satisfacción estudiantes (NPS sencillo).
   - 1 pregunta central (escala 1–5) + 1 comentario abierto (opcional).
3) Auto-NPS del docente.
   - 1 pregunta central (escala 1–5) + 1 campo "qué mejoraría" (opcional).

Incluye SIEMPRE un DISCLAIMER:
"Instrumento generado automáticamente. Puede contener errores. Valídelo y ajústelo antes de aplicarlo."

[ENTRADAS]
- Sesión: ${sessionData.titulo}
- Propósito: ${sessionData.proposito}
- Área: ${area}
- Grado: ${grado}
- Competencias: ${JSON.stringify(competencias_ids)}
- Capacidades: ${JSON.stringify(capacidades)}
- Duración: ${sessionData.duracion_min} minutos

Genera el JSON con la estructura exacta solicitada para las 3 rúbricas.`;

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
            content: 'Genera las 3 rúbricas siguiendo la estructura JSON especificada.' 
          }
        ],
        max_tokens: 3000,
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
        rubricas: [
          {
            tipo: "pedagogica",
            estructura_json: {
              criterios: [
                {
                  criterio: "Comprensión del contenido",
                  indicadores: ["Demuestra comprensión básica", "Aplica conocimientos"],
                  niveles: [
                    { nivel: 1, descriptor: "Inicio: Comprensión mínima" },
                    { nivel: 2, descriptor: "En proceso: Comprensión parcial" },
                    { nivel: 3, descriptor: "Logro: Comprensión adecuada" },
                    { nivel: 4, descriptor: "Destacado: Comprensión completa" }
                  ],
                  ponderacion: 1
                }
              ],
              escala: "1-4",
              disclaimer: "Instrumento generado automáticamente. Puede contener errores. Valídelo y ajústelo antes de aplicarlo."
            },
            html_imprimible_nombre: `Sesion-${session_index}_Rubrica-Pedagogica.html`,
            html_imprimible: `<html><head><title>Rúbrica Pedagógica - Sesión ${session_index}</title></head><body><h1>Rúbrica Pedagógica</h1><p>Sesión: ${sessionData.titulo}</p><table border="1"><tr><th>Criterio</th><th>Inicio (1)</th><th>En proceso (2)</th><th>Logro (3)</th><th>Destacado (4)</th></tr><tr><td>Comprensión del contenido</td><td>Comprensión mínima</td><td>Comprensión parcial</td><td>Comprensión adecuada</td><td>Comprensión completa</td></tr></table><p><em>Instrumento generado automáticamente. Puede contener errores. Valídelo y ajústelo antes de aplicarlo.</em></p></body></html>`
          },
          {
            tipo: "satisfaccion_estudiante",
            estructura_json: {
              pregunta_principal: "¿Qué tan útil te pareció esta sesión para tu aprendizaje?",
              escala: [1, 2, 3, 4, 5],
              comentario_abierto: true,
              disclaimer: "Instrumento generado automáticamente. Puede contener errores. Valídelo y ajústelo antes de aplicarlo."
            },
            html_imprimible_nombre: `Sesion-${session_index}_Rubrica-Satisfaccion.html`,
            html_imprimible: `<html><head><title>Satisfacción Estudiantes - Sesión ${session_index}</title></head><body><h1>Evaluación de Satisfacción</h1><p>Sesión: ${sessionData.titulo}</p><p>¿Qué tan útil te pareció esta sesión para tu aprendizaje?</p><p>1 ( ) 2 ( ) 3 ( ) 4 ( ) 5 ( )</p><p>Comentarios: _________________________________</p><p><em>Instrumento generado automáticamente. Puede contener errores. Valídelo y ajústelo antes de aplicarlo.</em></p></body></html>`
          },
          {
            tipo: "autoevaluacion_docente",
            estructura_json: {
              pregunta_principal: "¿Qué tan bien funcionó esta sesión para ti como docente?",
              escala: [1, 2, 3, 4, 5],
              comentario_mejora: true,
              disclaimer: "Instrumento generado automáticamente. Puede contener errores. Valídelo y ajústelo antes de aplicarlo."
            },
            html_imprimible_nombre: `Sesion-${session_index}_AutoNPS-Docente.html`,
            html_imprimible: `<html><head><title>Autoevaluación Docente - Sesión ${session_index}</title></head><body><h1>Autoevaluación Docente</h1><p>Sesión: ${sessionData.titulo}</p><p>¿Qué tan bien funcionó esta sesión para ti como docente?</p><p>1 ( ) 2 ( ) 3 ( ) 4 ( ) 5 ( )</p><p>¿Qué mejorarías?: _________________________________</p><p><em>Instrumento generado automáticamente. Puede contener errores. Valídelo y ajústelo antes de aplicarlo.</em></p></body></html>`
          }
        ]
      };
    }

    // Save instruments to database
    const instrumentsToSave = result.rubricas.map((rubrica: any) => ({
      sesion_id,
      tipo: rubrica.tipo,
      estructura_json: rubrica.estructura_json,
      html_nombre: rubrica.html_imprimible_nombre,
      html_contenido: rubrica.html_imprimible
    }));

    const { error: insertError } = await supabase
      .from('instrumentos_evaluacion')
      .upsert(instrumentsToSave, { 
        onConflict: 'sesion_id,tipo'
      });

    if (insertError) {
      console.error('Error saving instruments:', insertError);
    }

    // Update session with rubrics IDs
    const { error: updateError } = await supabase
      .from('sesiones_clase')
      .update({ 
        rubricas_ids: result.rubricas.map((r: any) => r.tipo),
        estado: 'LISTA_PARA_EXPORTAR'
      })
      .eq('id', sesion_id);

    if (updateError) {
      console.error('Error updating session:', updateError);
    }

    console.log('Generated rubrics successfully');

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-rubricas-sesion function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});