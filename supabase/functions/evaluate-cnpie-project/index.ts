import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from "../_shared/cors.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { proyectoId, categoria, datosActuales } = await req.json();

    if (!proyectoId || !categoria || !datosActuales) {
      throw new Error('Faltan parámetros requeridos');
    }

    // Obtener rúbricas oficiales
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: rubricas, error: rubricasError } = await supabaseClient
      .from('cnpie_rubricas')
      .select('*')
      .eq('categoria', categoria)
      .order('orden', { ascending: true });

    if (rubricasError) throw rubricasError;

    // Construir prompt para IA
    const rubricasText = rubricas.map(r => 
      `${r.criterio} (${r.puntaje_maximo} pts): ${r.indicador}`
    ).join('\n');

    const systemPrompt = `Eres un evaluador experto del CNPIE 2025 (Concurso Nacional de Proyectos de Innovación Educativa).

Tu tarea es analizar un proyecto de categoría ${categoria} y asignar puntajes estimados según las rúbricas oficiales.

RÚBRICAS OFICIALES:
${rubricasText}

Debes analizar los datos proporcionados del proyecto y:
1. Asignar un puntaje estimado para cada criterio (0 hasta el máximo)
2. Calcular el porcentaje de cumplimiento por criterio
3. Identificar 3-5 fortalezas específicas
4. Identificar 3-5 áreas a mejorar
5. Proporcionar recomendaciones concretas y accionables

Sé objetivo, constructivo y específico en tu evaluación.`;

    const userPrompt = `Evalúa el siguiente proyecto CNPIE:

DATOS DEL PROYECTO:
${JSON.stringify(datosActuales, null, 2)}

Proporciona tu evaluación en formato JSON con esta estructura:
{
  "puntajes_criterios": {
    "nombre_criterio": {
      "puntaje": number,
      "maximo": number,
      "porcentaje": number,
      "justificacion": "string"
    }
  },
  "areas_fuertes": ["string"],
  "areas_mejorar": ["string"],
  "recomendaciones_ia": ["string"]
}`;

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
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error('Error en la API de OpenAI');
    }

    const data = await response.json();
    let content = data.choices[0].message.content;
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const evaluation = JSON.parse(content);

    // Calcular totales
    const puntaje_total = Object.values(evaluation.puntajes_criterios).reduce(
      (sum: number, criterio: any) => sum + criterio.puntaje, 0
    );
    const puntaje_maximo = rubricas.reduce((sum, r) => sum + r.puntaje_maximo, 0);
    const porcentaje_cumplimiento = Math.round((puntaje_total / puntaje_maximo) * 100);

    const evaluationResult = {
      puntajes_criterios: evaluation.puntajes_criterios,
      puntaje_total,
      puntaje_maximo,
      porcentaje_cumplimiento,
      areas_fuertes: evaluation.areas_fuertes,
      areas_mejorar: evaluation.areas_mejorar,
      recomendaciones_ia: evaluation.recomendaciones_ia
    };

    // Guardar evaluación en la base de datos
    const { error: insertError } = await supabaseClient
      .from('cnpie_evaluaciones_predictivas')
      .insert({
        proyecto_id: proyectoId,
        tipo_evaluacion: 'parcial',
        puntajes_criterios: evaluation.puntajes_criterios,
        puntaje_total,
        puntaje_maximo,
        porcentaje_cumplimiento,
        areas_fuertes: evaluation.areas_fuertes,
        areas_mejorar: evaluation.areas_mejorar,
        recomendaciones_ia: evaluation.recomendaciones_ia
      });

    if (insertError) {
      console.error('Error saving evaluation:', insertError);
    }

    return new Response(
      JSON.stringify({ success: true, evaluation: evaluationResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in evaluate-cnpie-project:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
