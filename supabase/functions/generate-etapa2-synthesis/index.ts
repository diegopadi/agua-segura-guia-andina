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
    const { proyectoId, datosEtapa2, reflexion } = await req.json();

    console.log('Generating Etapa 2 synthesis for project:', proyectoId);

    const acelerador4 = datosEtapa2.etapa2_acelerador4 || {};
    const acelerador5 = datosEtapa2.etapa2_acelerador5 || {};
    const acelerador6 = datosEtapa2.etapa2_acelerador6 || {};
    const acelerador7 = datosEtapa2.etapa2_acelerador7 || {};
    const acelerador8 = datosEtapa2.etapa2_acelerador8 || {};

    const prompt = `Eres un experto en sistematización de proyectos educativos del CNPIE (Concurso Nacional de Proyectos de Innovación Educativa) de Perú.

Genera una SÍNTESIS INTEGRAL DE LA ETAPA 2: ACELERACIÓN del siguiente proyecto consolidado (2A).

**DATOS RECOPILADOS EN ETAPA 2:**

**Acelerador 4 - Vinculación al CNEB:**
- Área: ${acelerador4.areaCurricular || 'No especificada'}
- Grado: ${acelerador4.grado || 'No especificado'}
- Competencias CNEB: ${acelerador4.competenciasCNEB?.length || 0} seleccionadas
- Estrategias metodológicas: ${acelerador4.estrategiasMetodologicas || 'No especificadas'}

**Acelerador 5 - Impacto y Resultados:**
- Descripción del impacto: ${acelerador5.descripcionImpacto?.substring(0, 200) || 'No especificada'}...
- Indicadores registrados: ${acelerador5.indicadores?.length || 0}

**Acelerador 6 - Participación Comunitaria:**
- Estudiantes: ${acelerador6.numeroEstudiantes || 'No especificado'}
- Familias: ${acelerador6.numeroFamilias || 'No especificado'}
- Docentes: ${acelerador6.numeroDocentes || 'No especificado'}

**Acelerador 7 - Sostenibilidad:**
- Estrategias de sostenibilidad: ${acelerador7.estrategiasSostenibilidad?.substring(0, 150) || 'No especificadas'}...
- Institucionalización: ${acelerador7.institucionalizacion?.substring(0, 150) || 'No especificada'}...

**Acelerador 8 - Pertinencia Pedagógica:**
- Fundamentación: ${acelerador8.fundamentacionPedagogica?.substring(0, 150) || 'No especificada'}...
- Enfoque: ${acelerador8.enfoquePedagogico?.substring(0, 100) || 'No especificado'}...

**Acelerador 9 - Reflexión:**
- Desafíos: ${reflexion.desafiosEnfrentados?.substring(0, 150) || 'No especificados'}...
- Lecciones aprendidas: ${reflexion.leccionesAprendidas?.substring(0, 150) || 'No especificadas'}...
- Proyección futura: ${reflexion.proyeccionFuturo?.substring(0, 150) || 'No especificada'}...

Genera una síntesis integral en formato JSON con:
1. resumen_ejecutivo: Resumen de máximo 300 palabras
2. logros_principales: Array de 5-7 logros destacados de la Etapa 2
3. areas_fortaleza: Array de 4-5 áreas donde el proyecto muestra fortaleza
4. oportunidades_mejora: Array de 3-4 oportunidades de mejora identificadas
5. recomendaciones_etapa3: Array de 5-6 recomendaciones para la Etapa 3 (Evaluación y Cierre)
6. resumen_html: Versión HTML del resumen ejecutivo con formato

La síntesis debe ser profesional, positiva pero realista, y orientar al docente hacia la Etapa 3.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Eres un experto en sistematización de proyectos educativos CNPIE. Respondes siempre en JSON válido.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    const data = await response.json();
    const synthesisText = data.choices[0].message.content;
    const synthesis = JSON.parse(synthesisText);

    console.log('Etapa 2 synthesis generated successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      synthesis 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-etapa2-synthesis:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
