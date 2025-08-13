import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

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

interface A4Inputs {
  priorities: Array<{ id: string; title: string; description?: string; impact_score?: number; feasibility_score?: number }>;
  strategies: Array<{ id: string; title: string; description?: string }>;
  source?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in Supabase secrets');
    }

    const { info, a4_inputs, a3_context } = await req.json();

    const infoData: InfoData | undefined = info;
    const a4: A4Inputs | undefined = a4_inputs;
    const a3Context: string = a3_context || '';

    if (!infoData) throw new Error('Missing info data from Step 2');

    const prioritiesText = (a4?.priorities || [])
      .map(p => `- ${p.title}${p.description ? `: ${p.description}` : ''}`)
      .join('\n');

    const strategiesText = (a4?.strategies || [])
      .map(s => `- ${s.title}${s.description ? `: ${s.description}` : ''}`)
      .join('\n');

    const datosUA = `
Institución: ${infoData.institucion}
Distrito: ${infoData.distrito}
Provincia: ${infoData.provincia}
Región: ${infoData.region}
Director(a): ${infoData.director}
Profesor(a): ${infoData.profesor}
Área: ${infoData.area}
Grado: ${infoData.grado}
Duración: ${infoData.duracion}
Periodo: ${infoData.periodo}
Año: ${infoData.anio}
`.trim();

    const systemPrompt = `Eres especialista en diseño curricular peruano. Redactas con lenguaje claro, profesional y orientado a aprendizaje por competencias.`;

    const userPrompt = `Actúa como especialista en diseño curricular del nivel educativo indicado.\n\nCon base en la siguiente información:\n\n- Datos de la Unidad de Aprendizaje:\n${datosUA}\n\n- Prioridades seleccionadas:\n${prioritiesText || '(no disponibles)'}\n\n- Estrategias pedagógicas adaptadas:\n${strategiesText || '(no disponibles)'}\n\n- Contexto pedagógico (del Acelerador 3, puede estar en HTML):\n${a3Context || '(no disponible)'}\n\nRedacta:\n1. Situación significativa: 2 párrafos que expliquen, desde un enfoque pedagógico, por qué la IE debe trabajar estas prioridades, conectando con el contexto y hallazgos del Acelerador 3.\n2. Propósito: 1 párrafo que describa lo que los estudiantes lograrán, alineado al área, grado y competencias esperadas.\n3. Reto: 1 pregunta desafiante y factible sobre cómo la comunidad escolar puede contribuir a la seguridad hídrica.\n4. Producto: 1 párrafo que explique el resultado tangible esperado de la unidad y cómo se vincula a las estrategias pedagógicas.\n\nResponde usando este formato exacto (sin comentarios adicionales):\nSituación significativa: ...\nPropósito: ...\nReto: ...\nProducto: ...`;

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
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenAI API error:', errText);
      throw new Error(`OpenAI request failed: ${response.status}`);
    }

    const data = await response.json();
    const content: string = data.choices?.[0]?.message?.content || '';

    // Try JSON-first parsing
    const stripCodeFences = (t: string) => t.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
    const tryParseJSON = (t: string): any | null => {
      try {
        const cleaned = stripCodeFences(t);
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (!match) return JSON.parse(cleaned);
        return JSON.parse(match[0]);
      } catch (_) {
        return null;
      }
    };

    const normalize = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '');

    let situacion = '';
    let proposito = '';
    let reto = '';
    let producto = '';

    const asJson = tryParseJSON(content);
    if (asJson) {
      situacion = (asJson.situacion ?? '').toString().trim();
      proposito = (asJson.proposito ?? '').toString().trim();
      reto = (asJson.reto ?? '').toString().trim();
      producto = (asJson.producto ?? '').toString().trim();
    }

    // Fallback: label-based parsing (diacritics and case-insensitive)
    if (!situacion && !proposito && !reto && !producto) {
      const contentN = normalize(content);
      const parseSection = (label: string) => {
        const regex = new RegExp(`${label}:\\s*([\\s\\S]*?)(?=\\n[^\\n]*?:|$)`, 'i');
        const match = contentN.match(regex);
        return match ? match[1].trim() : '';
      };
      situacion = parseSection('Situacion significativa');
      proposito = parseSection('Proposito');
      reto = parseSection('Reto');
      producto = parseSection('Producto');
    }

    const result = { situacion, proposito, reto, producto, raw: content };

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in generate-situation-purpose-ac5:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
