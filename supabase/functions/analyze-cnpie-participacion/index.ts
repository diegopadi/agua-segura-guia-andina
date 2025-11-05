import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      participacionEstudiantes, 
      numeroEstudiantes,
      participacionFamilias,
      numeroFamilias,
      participacionDocentes,
      numeroDocentes,
      participacionComunidad,
      alianzas
    } = await req.json();

    console.log('Analyzing community participation...');

    const prompt = `Eres un experto evaluador de proyectos educativos del CNPIE (Concurso Nacional de Proyectos de Innovación Educativa) de Perú.

Analiza la PARTICIPACIÓN COMUNITARIA del siguiente proyecto consolidado (Proyecto 2A):

**Participación de Estudiantes:**
${participacionEstudiantes}
Número: ${numeroEstudiantes || 'No especificado'}

**Participación de Familias:**
${participacionFamilias || 'No especificada'}
Número: ${numeroFamilias || 'No especificado'}

**Participación de Docentes:**
${participacionDocentes || 'No especificada'}
Número: ${numeroDocentes || 'No especificado'}

**Participación Comunitaria:**
${participacionComunidad || 'No especificada'}

**Alianzas:**
${alianzas || 'No especificadas'}

Proporciona un análisis estructurado en formato JSON con:
1. puntaje_estimado (0-20): Puntaje según rúbrica CNPIE
2. completitud (0-100): Porcentaje de completitud de la información
3. fortalezas: Array de 3-5 fortalezas específicas
4. areas_mejorar: Array de 3-5 áreas que necesitan mejora
5. sugerencias: Array de 5-7 sugerencias concretas para fortalecer la participación

Criterios de evaluación CNPIE para Participación (20 pts):
- Rol activo y protagónico de los estudiantes
- Involucramiento efectivo de familias
- Compromiso del equipo docente
- Participación de actores comunitarios
- Alianzas estratégicas establecidas
- Cobertura y alcance de la participación`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Eres un evaluador experto de proyectos educativos CNPIE. Respondes siempre en JSON válido.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    const data = await response.json();
    const analysisText = data.choices[0].message.content;
    const analysis = JSON.parse(analysisText);

    console.log('Participation analysis completed');

    return new Response(JSON.stringify({ 
      success: true, 
      analysis 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-cnpie-participacion:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
