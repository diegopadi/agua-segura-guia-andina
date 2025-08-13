import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
      infoData, 
      situationData, 
      competenciesData, 
      sessionsData 
    } = await req.json();

    console.log('Received data for feedback generation:', {
      infoData: !!infoData,
      situationData: !!situationData,
      competenciesData: !!competenciesData,
      sessionsData: !!sessionsData
    });

    // Validar que tenemos los datos necesarios
    if (!infoData || !situationData || !competenciesData || !sessionsData) {
      throw new Error('Faltan datos de pasos anteriores para generar la retroalimentación');
    }

    // Construir el JSON con todos los insumos del Acelerador 5
    const jsonAcelerador5 = {
      ua_datos_informativos: {
        institucion: infoData.institucion || '',
        distrito: infoData.distrito || '',
        provincia: infoData.provincia || '',
        region: infoData.region || '',
        director: infoData.director || '',
        profesor: infoData.profesor || '',
        area: infoData.area || '',
        grado: infoData.grado || '',
        duracion: infoData.duracion || '',
        periodo: infoData.periodo || '',
        anio: infoData.anio || ''
      },
      ua_contexto_unidad: {
        situacion_significativa: situationData.situacion || '',
        proposito: situationData.proposito || '',
        reto: situationData.reto || '',
        producto: situationData.producto || ''
      },
      ua_competencias: competenciesData.competencias || [],
      ua_enfoques: competenciesData.enfoques || [],
      ua_estructura_sesiones: sessionsData.sessions || []
    };

    const prompt = `Rol: Eres un especialista en educación secundaria del Perú, con dominio del Currículo Nacional de la Educación Básica (CNEB), evaluación formativa y planificación de unidades de aprendizaje.

Objetivo: Analizar la información de la unidad de aprendizaje que te proveo en formato JSON y generar retroalimentación pedagógica personalizada para fortalecerla antes de su implementación.

---

### Insumo

Aquí tienes el contenido completo de la unidad de aprendizaje en JSON:

${JSON.stringify(jsonAcelerador5, null, 2)}

---

### Instrucciones para el análisis

1. **Revisa la coherencia interna**:
   - Propósito de la unidad vs. situación significativa.
   - Competencias y capacidades vs. actividades de las sesiones.
   - Evidencias vs. producto final esperado.

2. **Evalúa la pertinencia pedagógica**:
   - Inclusión y balance de las competencias seleccionadas.
   - Integración de enfoques transversales.
   - Uso adecuado de recursos y evidencias.
   - Pertinencia cultural y lingüística según región.
   - Incorporación del tema seguridad hídrica cuando sea relevante.

3. **Identifica mejoras concretas**:
   - Ajustes en secuencia y progresión de sesiones.
   - Oportunidades para fortalecer evaluación formativa.
   - Actividades que podrían enriquecer la experiencia de aprendizaje.

---

### Formato de salida obligatorio

Responde con un texto en español, organizado en tres secciones claras:

**1. Fortalezas detectadas**
- Lista breve con viñetas, resaltando lo más logrado.

**2. Oportunidades de mejora**
- Lista breve con viñetas, señalando ajustes posibles.

**3. Recomendaciones específicas**
- Lista de sugerencias prácticas y contextualizadas, indicando en qué parte de la unidad se podrían aplicar.

---

### Reglas

- Usa un tono constructivo, motivador y claro.
- No repitas textualmente los insumos; sintetiza y analiza.
- Evita generalidades vacías como "Todo está bien" o "Revisar actividades".
- La extensión total no debe superar 400–500 palabras.
- Responde únicamente con el texto organizado en las 3 secciones (sin encabezados extra ni explicaciones técnicas).`;

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      }),
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const openAIData = await openAIResponse.json();
    const feedback = openAIData.choices[0].message.content;

    console.log('Generated feedback successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        feedback,
        raw_response: openAIData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in generate-feedback-ac5 function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});