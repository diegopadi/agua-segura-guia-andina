import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InfoData {
  institucion: string;
  distrito: string;
  provincia: string;
  region: string;
  director: string;
  profesor: string;
  area: string;
  grado: string;
  duracion: string;
  periodo: string;
  anio: string;
}

interface SituationPurposeData {
  situacion: string;
  proposito: string;
  reto: string;
  producto: string;
}

interface CompetencyData {
  id: string;
  nombre: string;
  capacidades: string[];
}

interface EnfoqueData {
  id: string;
  nombre: string;
}

interface SessionParams {
  numSesiones: number;
  horasPorSesion: number;
  numEstudiantes: number;
  observaciones?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      info, 
      situationPurpose, 
      competencias, 
      enfoques, 
      sessionParams 
    } = await req.json();

    console.log('Generating sessions structure with params:', sessionParams);

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Validate required inputs
    if (!sessionParams?.numSesiones || !sessionParams?.horasPorSesion || !sessionParams?.numEstudiantes) {
      return new Response(JSON.stringify({ error: "Faltan insumos para generar la estructura de sesiones." }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!competencias || competencias.length === 0) {
      return new Response(JSON.stringify({ error: "Faltan insumos para generar la estructura de sesiones." }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build prompt with all the data
    const prompt = `Rol: Actúa como especialista en diseño curricular del nivel indicado. Redacta con enfoque pedagógico, claridad y coherencia con el CNEB.

Objetivo: Generar la estructura de sesiones de la Unidad de Aprendizaje, en formato JSON estrictamente conforme al esquema especificado abajo.

## Insumos (variables)

Parámetros del paso 5:
- num_sesiones: ${sessionParams.numSesiones}
- duracion_sesion_horas: ${sessionParams.horasPorSesion}
- num_estudiantes: ${sessionParams.numEstudiantes}
- observaciones_docente: ${sessionParams.observaciones || 'Sin observaciones'}

Paso 2 – Datos informativos:
- ua_institucion: ${info?.institucion || ''}
- ua_distrito: ${info?.distrito || ''}
- ua_provincia: ${info?.provincia || ''}
- ua_region: ${info?.region || ''}
- ua_area: ${info?.area || ''}
- ua_grado: ${info?.grado || ''}
- ua_periodo: ${info?.periodo || ''}
- ua_anio: ${info?.anio || ''}

Paso 3 – Textos generados:
- ua_situacion: ${situationPurpose?.situacion || ''}
- ua_proposito: ${situationPurpose?.proposito || ''}
- ua_reto: ${situationPurpose?.reto || ''}
- ua_producto: ${situationPurpose?.producto || ''}

Paso 4 – Selecciones del CNEB:
- ua_competencias: ${JSON.stringify(competencias)}
- ua_enfoques: ${JSON.stringify(enfoques)}

## Reglas pedagógicas y de diseño

1. Coherencia: Cada sesión debe contribuir al ua_proposito y estar alineada con ua_situacion, ua_reto y ua_producto.
2. Distribución: Reparte las competencias y enfoques a lo largo de las sesiones de manera equilibrada y progresiva.
3. Capacidades: Para cada competencia usada en una sesión, selecciona 2–3 capacidades pertinentes del arreglo proporcionado.
4. Actividades: En cada sesión, detalla brevemente inicio, desarrollo y cierre con acciones factibles para ${info?.grado || ''} y el tiempo indicado (${sessionParams.horasPorSesion} h).
5. Evidencias: Propón evidencias observables y vinculadas al ua_producto.
6. Pertinencia: Integra enfoques transversales seleccionados y la temática de seguridad hídrica cuando corresponda al área/propósito.
7. Realismo: Ajusta la carga de actividades y recursos al número de estudiantes (${sessionParams.numEstudiantes}) y a la duración por sesión.
8. Claridad: Títulos de sesión breves y motivadores (máx. ~70 caracteres). Textos concisos.

## Formato de salida (obligatorio)

Devuelve solo un JSON con esta forma exacta:

{
  "estructura_sesiones": [
    {
      "numero": 1,
      "titulo": "...",
      "competencias": ["ID_COMPETENCIA_1", "ID_COMPETENCIA_2"],
      "capacidades": ["Capacidad pertinente 1", "Capacidad pertinente 2"],
      "proposito": "Propósito específico de la sesión 1...",
      "actividades": {
        "inicio": "Actividad breve de activación...",
        "desarrollo": "Actividad principal...",
        "cierre": "Cierre y metacognición..."
      },
      "recursos": "Recursos y materiales clave...",
      "evidencias": "Evidencias observables...",
      "enfoques": ["Nombre enfoque 1", "Nombre enfoque 2"]
    }
  ],
  "parametros": {
    "num_sesiones": ${sessionParams.numSesiones},
    "duracion_sesion_horas": ${sessionParams.horasPorSesion},
    "num_estudiantes": ${sessionParams.numEstudiantes}
  }
}

Reglas del esquema:
- estructura_sesiones.length debe ser igual a num_sesiones.
- numero: correlativo 1..num_sesiones.
- competencias: IDs que existan en ua_competencias.
- capacidades: textos tomados de ua_competencias[].capacidades (elige las pertinentes).
- enfoques: nombres tomados de ua_enfoques[].nombre.
- No incluyas campos adicionales ni comentarios.

Devuelve únicamente el JSON según el esquema. No incluyas explicaciones, texto adicional ni markdown.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'Eres un especialista en diseño curricular. Siempre respondes únicamente con JSON válido, sin explicaciones adicionales.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    console.log('Generated content:', generatedContent);

    // Parse JSON response
    let parsedContent;
    try {
      // Clean the response (remove markdown formatting if present)
      const cleanContent = generatedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedContent = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Validate response structure
    if (!parsedContent.estructura_sesiones || !Array.isArray(parsedContent.estructura_sesiones)) {
      throw new Error('Invalid response format from AI');
    }

    return new Response(JSON.stringify(parsedContent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-estructura-sesiones-ac5:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});