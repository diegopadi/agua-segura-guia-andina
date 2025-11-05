import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      estrategiasSostenibilidad,
      institucionalizacion,
      capacidadesDesarrolladas,
      recursosNecesarios,
      presupuesto,
      escalabilidad,
      replicabilidad,
      tienePresupuesto,
      tienePlanEscalamiento,
      etapa1Data
    } = await req.json();

    console.log('Analyzing sustainability for CNPIE project...');

    const systemPrompt = `Eres un experto evaluador de proyectos del CNPIE (Concurso Nacional de Proyectos de Innovación Educativa) de Perú, especializado en el criterio de SOSTENIBILIDAD (20 puntos).

CRITERIO OFICIAL:
- El proyecto tiene estrategias claras de sostenibilidad
- Está institucionalizado (PEI, PAT, documentos de gestión)
- Ha desarrollado capacidades en el equipo docente
- Cuenta con recursos asignados o plan de gestión de recursos
- Es escalable y replicable

RÚBRICA DE PUNTAJE:
- 17-20 pts: Muy sostenible, institucionalizado, recursos asegurados, capacidades desarrolladas
- 13-16 pts: Sostenibilidad alta, en proceso de institucionalización, recursos parciales
- 9-12 pts: Sostenibilidad media, institucionalización débil, recursos limitados
- 0-8 pts: Sostenibilidad baja, sin institucionalización, dependencia externa

Responde SOLO con un JSON válido con esta estructura exacta:
{
  "puntaje_estimado": number (0-20),
  "completitud": number (0-100),
  "fortalezas": ["string", "string", ...],
  "areas_mejorar": ["string", "string", ...],
  "sugerencias": ["string", "string", ...]
}`;

    const userPrompt = `Analiza la sostenibilidad de este proyecto educativo:

**ESTRATEGIAS DE SOSTENIBILIDAD:**
${estrategiasSostenibilidad || 'No especificadas'}

**INSTITUCIONALIZACIÓN:**
${institucionalizacion || 'No especificada'}

**CAPACIDADES DESARROLLADAS:**
${capacidadesDesarrolladas || 'No especificadas'}

**RECURSOS NECESARIOS:**
${recursosNecesarios || 'No especificados'}
¿Tiene presupuesto asignado?: ${tienePresupuesto === 'si' ? 'Sí' : 'No'}
${tienePresupuesto === 'si' ? `Detalle: ${presupuesto || 'No especificado'}` : ''}

**ESCALABILIDAD:**
${escalabilidad || 'No especificada'}
¿Tiene plan de escalamiento?: ${tienePlanEscalamiento === 'si' ? 'Sí' : 'No'}

**REPLICABILIDAD:**
${replicabilidad || 'No especificada'}

**CONTEXTO DEL PROYECTO:**
Problema: ${etapa1Data?.problemaDescripcion || 'No especificado'}
Objetivo: ${etapa1Data?.objetivo || 'No especificado'}

Proporciona un análisis detallado del criterio de sostenibilidad.`;

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
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI error:', errorText);
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content;
    const analysis = JSON.parse(analysisText);

    console.log('Sustainability analysis completed. Score:', analysis.puntaje_estimado);

    return new Response(JSON.stringify({ 
      success: true, 
      analysis 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-cnpie-sostenibilidad:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
