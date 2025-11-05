import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { unidad_data, rubrica_data, sesiones_data } = await req.json();

    if (!unidad_data || !rubrica_data || !sesiones_data) {
      return new Response(
        JSON.stringify({ error: 'Faltan datos requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY no está configurada');
    }

    // Prepare the prompt for AI analysis
    const systemPrompt = `Eres un experto en diseño curricular y pedagogía. 
Analiza la coherencia entre la unidad de aprendizaje, la rúbrica de evaluación y las sesiones de clase.
Debes evaluar:
1. Si las sesiones desarrollan realmente las competencias declaradas en la unidad
2. Si la rúbrica evalúa lo que se enseña en las sesiones
3. Si el tiempo asignado es realista
4. Si los materiales y estrategias son apropiados

Devuelve un análisis en formato JSON con:
- coherence_score (0-100)
- fortalezas (array de strings)
- areas_mejora (array de strings)
- recomendaciones (array de strings)`;

    const userPrompt = `Analiza la siguiente unidad de aprendizaje:

UNIDAD:
- Título: ${unidad_data.titulo}
- Área: ${unidad_data.area_curricular}
- Grado: ${unidad_data.grado}
- Sesiones: ${unidad_data.numero_sesiones}
- Duración: ${unidad_data.duracion_min} min/sesión
- Propósito: ${unidad_data.proposito}
- Evidencias: ${unidad_data.evidencias}

RÚBRICA:
${JSON.stringify(rubrica_data.estructura, null, 2)}

SESIONES (${sesiones_data.length} sesiones):
${sesiones_data.map((s: any, i: number) => `
Sesión ${i + 1}: ${s.titulo}
- Inicio: ${s.inicio?.substring(0, 200)}...
- Desarrollo: ${s.desarrollo?.substring(0, 200)}...
- Cierre: ${s.cierre?.substring(0, 200)}...
`).join('\n')}

Analiza la coherencia pedagógica y devuelve tu evaluación en el formato JSON especificado.`;

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
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content;
    const analysis = JSON.parse(analysisText);

    // Validate the response structure
    if (!analysis.coherence_score || !analysis.fortalezas || !analysis.areas_mejora || !analysis.recomendaciones) {
      throw new Error('Respuesta de IA con formato inválido');
    }

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in validate-etapa3-coherence:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
