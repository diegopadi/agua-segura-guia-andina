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
    const { session_id, session_data, template_id } = await req.json();

    console.log('Generating strategies report for session:', session_id);

    // Get template from database
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const templateResponse = await fetch(`${supabaseUrl}/rest/v1/templates?name=eq.${template_id}&select=*`, {
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      }
    });

    if (!templateResponse.ok) {
      throw new Error('Error fetching template');
    }

    const templates = await templateResponse.json();
    if (templates.length === 0) {
      throw new Error(`Template ${template_id} not found`);
    }

    const template = templates[0].content;

    // Get Accelerator 3 results for context
    const getAc3ResultsResponse = await fetch(`${supabaseUrl}/functions/v1/get-accelerator3-results`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ session_id })
    });

    let ac3Context = {
      grado: session_data?.grado || 'Sin información disponible',
      area: session_data?.area || 'Sin información disponible',
      competencia: session_data?.competencia || 'Sin información disponible',
    } as any;
    let prioridades: any[] = [];
    let ac3Data: any = null;
    if (getAc3ResultsResponse.ok) {
      ac3Data = await getAc3ResultsResponse.json();
      prioridades = ac3Data.priorities || [];
    }
    const selectedPriorities = Array.isArray(session_data?.priorities) ? session_data.priorities : [];
    const prioridadesToUse = (selectedPriorities.length > 0 ? selectedPriorities : prioridades) as any[];

    console.log('Priorities selected for report:', (prioridadesToUse || []).map((p: any) => p.title || p.descripcion || p.name || 'Prioridad'));

    // Compile all session data with improved strategy handling (A4)
    // 1) Estrategias: tomar máximo 5 desde strategies_result.strategies o strategies_selected
    type RepoStrategy = {
      id?: string;
      nombre?: string; // title alt
      descripcion?: string; // description alt
      referencia?: string; // reference alt
      tipo_estrategia?: string; // momento/tipo
      momento_sugerido?: string;
      etiquetas?: string[];
      title?: string;
      description?: string;
      reference?: string;
      momento?: string;
      tags?: string[];
    };

    let strategies: RepoStrategy[] = [];
    
    // Debug: Log all available strategy sources for troubleshooting
    console.log('[A4][Report] Available strategy sources:', {
      strategies_result: session_data?.strategies_result,
      strategies_selected: session_data?.strategies_selected,
      refined_result: session_data?.refined_result,
      ai_analysis_result: session_data?.ai_analysis_result
    });
    
    if (Array.isArray(session_data?.strategies_result?.strategies)) {
      strategies = session_data.strategies_result.strategies as RepoStrategy[];
      console.log('[A4][Report] Using strategies_result.strategies:', strategies.length);
    } else if (Array.isArray(session_data?.strategies_selected)) {
      strategies = session_data.strategies_selected as RepoStrategy[];
      console.log('[A4][Report] Using strategies_selected:', strategies.length);
    } else if (Array.isArray(session_data?.refined_result?.strategies)) {
      strategies = session_data.refined_result.strategies as RepoStrategy[];
      console.log('[A4][Report] Using refined_result.strategies:', strategies.length);
    } else if (Array.isArray(session_data?.ai_analysis_result?.strategies)) {
      strategies = session_data.ai_analysis_result.strategies as RepoStrategy[];
      console.log('[A4][Report] Using ai_analysis_result.strategies:', strategies.length);
    }

    // Debug: Log raw strategies before normalization
    console.log('[A4][Report] Raw strategies found:', strategies.map((s, i) => ({
      index: i,
      id: s.id,
      nombre: s.nombre,
      title: s.title,
      descripcion: s.descripcion,
      description: s.description
    })));

    // Limitar a 5 y normalizar campos - mejorar mapeo para RepoItem
    const strategiesNormalized = (strategies || []).slice(0, 5)
      .filter(s => s && (s.nombre || s.title)) // Filtrar estrategias válidas
      .map((s: RepoStrategy, i: number) => {
        const normalized = {
          title: s.title || s.nombre || `Estrategia ${i + 1}`,
          description: s.description || s.descripcion || '',
          reference: s.reference || s.referencia || 'EEPE - Enseñanza de Ecología en el Patio de la Escuela',
          momento: s.momento || s.momento_sugerido || s.tipo_estrategia || 'desarrollo',
          tags: s.tags || s.etiquetas || [],
        };
        
        console.log(`[A4][Report] Normalized strategy ${i}:`, normalized);
        return normalized;
      });

    console.log('A4 strategies (normalized):', strategiesNormalized.map(s => s.title));

    // 2) Contexto: preferir objeto "contexto" y caer en context_data
    const contextoRaw = session_data?.contexto || {};
    const contextData = session_data?.context_data || {};
    const contexto = {
      tipo_aula: contextoRaw.tipo_aula || contextData[1] || 'Sin información disponible',
      modalidad: contextoRaw.modalidad || contextData[2] || 'Sin información disponible',
      recursos_tic: contextoRaw.recursos_tic || contextData[3] || 'Sin información disponible',
    };

    // 3) Respuestas globales de profundización (5 universales)
    const prof = session_data?.profundization_global || {};
    const respuestasProfundizacion = [
      { key: 'pertinencia', label: 'Pertinencia Contextual' },
      { key: 'viabilidad', label: 'Viabilidad y Recursos (TIC/No TIC)' },
      { key: 'riesgos', label: 'Riesgos y Mitigación' },
      { key: 'evaluacion', label: 'Evaluación y Evidencias' },
      { key: 'inclusion', label: 'Inclusión y Participación' },
    ].map(({ key, label }) => `• ${label}: ${prof[key] || 'Sin respuesta'}`).join('\n');

    // 4) Prioridades del AC3 (ya recuperadas)
    const prioridadesAc3 = (prioridadesToUse || []).map((p: any, index: number) =>
      `${index + 1}. ${p.title || p.nombre || `Prioridad ${index + 1}`}: ${p.description || p.descripcion || 'Sin información disponible'}`
    ).join('\n') || 'Sin información disponible';

    // 5) Texto de estrategias detallado para el prompt
    const estrategiasText = strategiesNormalized.length > 0
      ? strategiesNormalized.map((s, idx) => (
          `${idx + 1}. ${s.title}\n` +
          `   Momento/tipo: ${s.momento}\n` +
          `   Referencia: ${s.reference}\n` +
          `   Tags: ${(s.tags || []).join(', ') || '—'}\n` +
          `   Descripción: ${s.description || 'Sin información disponible'}`
        )).join('\n\n')
      : 'Sin información disponible';

    // 6) Ensamble de contexto legible
    const contextoCompleto = `Aula: ${contexto.tipo_aula}\nModalidad: ${contexto.modalidad}\nRecursos TIC: ${contexto.recursos_tic}`;

    // Replace template variables
    let userPrompt = template.user_prompt
      .replace('{{grado}}', ac3Context.grado)
      .replace('{{area}}', ac3Context.area) 
      .replace('{{competencia}}', ac3Context.competencia)
      .replace('{{contexto}}', contextoCompleto)
      .replace('{{estrategias}}', estrategiasText)
      .replace('{{respuestas_profundizacion}}', respuestasProfundizacion)
      .replace('{{prioridades_ac3}}', prioridadesAc3);

    // Enforce clean, neutral formatting (no emojis, no colors, no boxes)
    userPrompt += `\n\nFORMATO ESTRICTO DEL INFORME (NO USAR EMOJIS NI ESTILOS):\n- Redacta en lenguaje técnico y claro.\n- No incluyas emojis, íconos, bullets decorativos ni caracteres especiales.\n- No uses estilos inline, colores, cajas, bordes ni fondos.\n- Usa solo estructura simple: Título (H1), subtítulos (H2/H3), párrafos, listas con guiones o numeradas y tablas sencillas.\n- No incluyas bloques de código ni backticks.\n- No agregues cabeceras o pies de página; el sistema los añade.\n- Entrega el contenido directo, listo para ser impreso en formato tipo documento.`;


    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: template.system_prompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.6
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Error from OpenAI API');
    }

    const reportContent = data.choices[0].message.content;

    // Remove common emoji ranges to keep output clean
    const cleanContent = reportContent.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}]/gu, '');

    // Generate HTML version
    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Informe de Estrategias Metodológicas - Acelerador 4</title>
    <style>
        /* Estilo neutro y limpio tipo documento */
        html, body { background: #fff; }
        body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; line-height: 1.6; color: #000; margin: 40px; }
        h1, h2, h3 { margin: 1.2em 0 0.6em; font-weight: 700; color: #000; }
        h1 { font-size: 1.8rem; }
        h2 { font-size: 1.4rem; }
        h3 { font-size: 1.15rem; }
        p { margin: 0 0 1em; }
        ul, ol { margin: 0 0 1em 1.2em; }
        table { width: 100%; border-collapse: collapse; margin: 1em 0; }
        th, td { border: 1px solid #ddd; padding: 8px 10px; text-align: left; }
        th { font-weight: 600; background: #f5f5f5; }
        hr { border: none; border-top: 1px solid #ddd; margin: 2em 0; }
        @media print { body { margin: 20px; } }
    </style>
</head>
<body>
    <h1>Informe de Estrategias Metodológicas</h1>
    <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
    <p><strong>Acelerador:</strong> 4 - Selección de Estrategias Metodológicas</p>
    
    <section>
        <h2>Contexto Educativo</h2>
        <ul>
            <li><strong>Tipo de aula:</strong> ${contexto.tipo_aula}</li>
            <li><strong>Modalidad:</strong> ${contexto.modalidad}</li>
            <li><strong>Recursos TIC:</strong> ${contexto.recursos_tic}</li>
        </ul>
    </section>

    ${cleanContent.replace(/###\s(.+)/g, '<h3>$1</h3>').replace(/##\s(.+)/g, '<h2>$1</h2>').replace(/\n/g, '<br>')}
    
    <hr>
    <p><em>Este informe ha sido generado automáticamente por el sistema de IA pedagógica y está listo para ser utilizado como insumo en el Acelerador 5: Planificación y Preparación de Unidades.</em></p>
</body>
</html>`;

    // Calculate report metrics
    const wordCount = cleanContent.split(' ').length;
    const strategiesCount = strategiesNormalized.length;
    const citationsCount = (cleanContent.match(/MINEDU|Ministerio de Educación|CNEB/gi) || []).length;

    console.log('Generated strategies report successfully');

    return new Response(JSON.stringify({
      success: true,
      content: reportContent,
      html_content: htmlContent,
      summary: `Informe técnico con ${strategiesCount} estrategias metodológicas validadas y contextualizadas para ${contexto.tipo_aula} ${contexto.modalidad}.`,
      strategies_count: strategiesCount,
      citations_count: citationsCount,
      word_count: wordCount,
      ready_for_accelerator_5: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-strategies-report:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});