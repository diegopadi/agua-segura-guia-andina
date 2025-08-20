import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { sesion_id, incluir_rubricas = true } = await req.json();

    console.log('Exporting session HTML:', sesion_id, 'with rubrics:', incluir_rubricas);

    // Get session data
    const { data: sessionData, error: sessionError } = await supabase
      .from('sesiones_clase')
      .select('*')
      .eq('id', sesion_id)
      .single();

    if (sessionError) {
      throw new Error(`Error fetching session: ${sessionError.message}`);
    }

    // Get rubrics if requested
    let rubrics = [];
    if (incluir_rubricas) {
      const { data: rubricsData, error: rubricsError } = await supabase
        .from('instrumentos_evaluacion')
        .select('*')
        .eq('sesion_id', sesion_id);

      if (!rubricsError) {
        rubrics = rubricsData || [];
      }
    }

    // Generate HTML
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sesión ${sessionData.session_index}: ${sessionData.titulo}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
            line-height: 1.6;
        }
        .header { 
            border-bottom: 2px solid #333; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
        }
        .disclaimer { 
            background-color: #fff3cd; 
            border: 1px solid #ffeaa7; 
            padding: 15px; 
            margin: 20px 0; 
            border-radius: 5px;
            font-style: italic;
        }
        .section { 
            margin: 20px 0; 
            padding: 15px; 
            border-left: 4px solid #007bff;
            background-color: #f8f9fa;
        }
        .section h3 { 
            margin-top: 0; 
            color: #007bff;
        }
        .rubrica { 
            margin: 30px 0; 
            padding: 20px; 
            border: 1px solid #ddd; 
            border-radius: 8px;
            page-break-inside: avoid;
        }
        .rubrica h3 { 
            background-color: #007bff; 
            color: white; 
            padding: 10px; 
            margin: -20px -20px 15px -20px;
            border-radius: 8px 8px 0 0;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 10px 0; 
        }
        th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left; 
        }
        th { 
            background-color: #f2f2f2; 
        }
        .recursos { 
            display: flex; 
            flex-wrap: wrap; 
            gap: 10px; 
        }
        .recurso { 
            background-color: #e9ecef; 
            padding: 5px 10px; 
            border-radius: 15px; 
            font-size: 0.9em;
        }
        @media print {
            body { margin: 0; padding: 15px; }
            .page-break { page-break-before: always; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Sesión de Aprendizaje ${sessionData.session_index}</h1>
        <h2>${sessionData.titulo}</h2>
        <p><strong>Duración:</strong> ${sessionData.duracion_min} minutos</p>
        <p><strong>Competencias:</strong> ${JSON.stringify(sessionData.competencias_ids)}</p>
    </div>

    <div class="disclaimer">
        <strong>Importante:</strong> Este diseño ha sido generado automáticamente. Puede contener errores. 
        Valídelo y ajústelo antes de su aplicación en aula.
    </div>

    <div class="section">
        <h3>Propósito de la Sesión</h3>
        <p>${sessionData.proposito}</p>
    </div>

    <div class="section">
        <h3>Inicio</h3>
        <p>${sessionData.inicio}</p>
    </div>

    <div class="section">
        <h3>Desarrollo</h3>
        <p>${sessionData.desarrollo}</p>
    </div>

    <div class="section">
        <h3>Cierre</h3>
        <p>${sessionData.cierre}</p>
    </div>

    <div class="section">
        <h3>Evidencias de Aprendizaje</h3>
        <ul>
            ${Array.isArray(sessionData.evidencias) 
              ? sessionData.evidencias.map(e => `<li>${e}</li>`).join('') 
              : '<li>Sin evidencias definidas</li>'}
        </ul>
    </div>

    <div class="section">
        <h3>Recursos Necesarios</h3>
        <div class="recursos">
            ${Array.isArray(sessionData.recursos) 
              ? sessionData.recursos.map(r => `<span class="recurso">${r}</span>`).join('') 
              : '<span class="recurso">Sin recursos definidos</span>'}
        </div>
    </div>

    ${incluir_rubricas && rubrics.length > 0 ? `
    <div class="page-break"></div>
    <h2>Instrumentos de Evaluación</h2>
    
    ${rubrics.map(rubrica => `
    <div class="rubrica">
        <h3>${rubrica.tipo === 'pedagogica' ? 'Rúbrica Pedagógica' : 
              rubrica.tipo === 'satisfaccion_estudiante' ? 'Satisfacción de Estudiantes' : 
              'Autoevaluación Docente'}</h3>
        
        ${rubrica.html_contenido ? 
          rubrica.html_contenido.replace(/<html>.*?<body>/gs, '').replace(/<\/body>.*?<\/html>/gs, '') :
          '<p>Contenido no disponible</p>'
        }
    </div>
    `).join('')}
    ` : ''}

    <div class="disclaimer" style="margin-top: 40px;">
        <p><strong>Nota:</strong> Este documento es una propuesta pedagógica generada automáticamente. 
        El docente debe revisar, ajustar y validar todos los contenidos antes de su implementación en el aula.</p>
        <p><strong>Fecha de generación:</strong> ${new Date().toLocaleDateString('es-PE')}</p>
    </div>
</body>
</html>`;

    // Update session with exported HTML
    const { error: updateError } = await supabase
      .from('sesiones_clase')
      .update({ 
        html_export: html,
        estado: 'APROBADA'
      })
      .eq('id', sesion_id);

    if (updateError) {
      console.error('Error updating session with HTML:', updateError);
    }

    const filename = `Unidad-${sessionData.unidad_id || 'Sin-ID'}-Sesion-${sessionData.session_index}.html`;

    console.log('Generated HTML export successfully');

    return new Response(JSON.stringify({ 
      filename, 
      html 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in exportar-sesion-html function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});