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
    const { infoData, situationData, competenciesData, sessionsData, feedbackData } = await req.json();

    console.log('Received data for materials generation:', {
      infoData: !!infoData,
      situationData: !!situationData,
      competenciesData: !!competenciesData,
      sessionsData: !!sessionsData,
      feedbackData: !!feedbackData
    });

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Build the JSON input for the AI
    const jsonInput = {
      ua_datos_informativos: infoData,
      ua_contexto_unidad: situationData,
      ua_competencias: competenciesData?.competencias || [],
      ua_enfoques: competenciesData?.enfoques || [],
      ua_estructura_sesiones: sessionsData?.estructura || [],
      ua_retroalimentacion: feedbackData?.feedback || ""
    };

    const prompt = `Rol: Actúa como especialista en diseño curricular y recursos educativos del nivel secundario en Perú, con experiencia en adaptar materiales a contextos rurales y urbanos, y con enfoque en la temática de seguridad hídrica.

Objetivo: Analizar todos los insumos recopilados hasta ahora en el Acelerador 5 y proponer una lista preliminar de materiales y recursos básicos para implementar la Unidad de Aprendizaje, adaptada a la realidad de la institución educativa.

Insumos:

${JSON.stringify(jsonInput, null, 2)}

Instrucciones para la IA:

1. Analiza todas las sesiones y actividades propuestas para identificar los materiales mínimos requeridos.
2. Incluye recursos físicos y digitales, así como insumos para trabajo de campo, experimentos o prototipos si son pertinentes.
3. Asegura que:
   • Sean materiales realistas según el contexto (urbano/rural, recursos disponibles en la institución).
   • Favorezcan la inclusión y la participación activa de los estudiantes.
   • Integren la temática de seguridad hídrica cuando corresponda.
4. No incluyas elementos innecesarios o muy costosos si no son críticos para la actividad.
5. La descripción debe explicar brevemente el uso pedagógico del material.
6. Prioriza reutilización y sostenibilidad (material reciclado, reutilizable, etc.).

Formato de salida obligatorio:

Responde únicamente con un arreglo JSON con objetos de dos campos:

[
  {
    "nombre": "Cartulinas",
    "descripcion": "Para mapas conceptuales y afiches."
  },
  {
    "nombre": "Botellas recicladas",
    "descripcion": "Para prototipos relacionados al uso responsable del agua."
  }
]

Reglas:

• nombre: breve, máximo 5 palabras.
• descripcion: breve y clara (20–25 palabras máx.).
• Longitud sugerida: 6–12 materiales.
• No repitas materiales innecesariamente; agrupa por tipo cuando sea posible.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const materialsText = data.choices[0].message.content.trim();

    console.log('Raw AI response:', materialsText);

    // Parse the JSON response
    let materialsArray;
    try {
      // Try to extract JSON from the response if it contains markdown code blocks
      const jsonMatch = materialsText.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
      if (jsonMatch) {
        materialsArray = JSON.parse(jsonMatch[1]);
      } else {
        // Try to parse directly if it's plain JSON
        materialsArray = JSON.parse(materialsText);
      }
    } catch (parseError) {
      console.error('Error parsing AI response as JSON:', parseError);
      console.error('AI response was:', materialsText);
      throw new Error('Invalid JSON response from AI');
    }

    // Validate the structure
    if (!Array.isArray(materialsArray)) {
      throw new Error('AI response is not an array');
    }

    for (const material of materialsArray) {
      if (!material.nombre || !material.descripcion) {
        throw new Error('Invalid material structure - missing nombre or descripcion');
      }
    }

    console.log('Generated materials successfully');

    return new Response(
      JSON.stringify({ materials: materialsArray }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-materials-ac5 function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});