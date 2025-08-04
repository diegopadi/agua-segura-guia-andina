import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { finalHtml, sessionData, userProfile } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    console.log('Fetching template: plantilla14_documento_final_ac5');

    // Obtener plantilla
    const { data: template, error: templateError } = await supabaseClient
      .from('templates')
      .select('content')
      .eq('name', 'plantilla14_documento_final_ac5')
      .single();

    if (templateError) {
      console.error('Template error:', templateError);
      throw new Error(`Template not found: ${templateError.message}`);
    }

    const templateContent = template.content.template;

    console.log('Processing template with session data');

    // Extraer datos del HTML final para llenar la plantilla
    const extractSectionContent = (html: string, sectionTitle: string): string => {
      const regex = new RegExp(`<h[1-6][^>]*>${sectionTitle}[^<]*</h[1-6]>([\\s\\S]*?)(?=<h[1-6]|$)`, 'i');
      const match = html.match(regex);
      return match ? match[1].trim() : 'No disponible';
    };

    // Extraer información específica de la sesión
    const { insumos } = sessionData;
    const selectedCompetencia = insumos?.selectedCompetencies?.[0] || {};
    
    // Variables para la plantilla
    const templateVars = {
      competencia_codigo: selectedCompetencia.codigo || 'N/A',
      competencia_nombre: selectedCompetencia.nombre || 'N/A',
      titulo_pci: 'Proyecto Curricular Institucional',
      fecha_pci: new Date().toLocaleDateString('es-PE'),
      contexto: insumos?.contextQuestions?.map((q: any) => `${q.pregunta}: ${q.respuesta}`).join('; ') || 'Contexto general',
      fecha_actual: new Date().toLocaleDateString('es-PE'),
      nombre_docente: userProfile?.full_name || 'Docente',
      resumen_ejecutivo: extractSectionContent(finalHtml, 'Resumen Ejecutivo'),
      situacion: extractSectionContent(finalHtml, 'Situación Significativa'),
      capacidades: selectedCompetencia.descripcion || 'Capacidades específicas',
      secuencia: ['Actividad 1: Exploración', 'Actividad 2: Desarrollo', 'Actividad 3: Consolidación'],
      criterios: extractSectionContent(finalHtml, 'Criterios e Indicadores'),
      recursos: extractSectionContent(finalHtml, 'Recursos y Evidencias'),
      puntos_seguimiento: [
        'Verificar comprensión de la situación significativa',
        'Monitorear desarrollo de capacidades',
        'Evaluar evidencias de aprendizaje',
        'Revisar uso de recursos'
      ]
    };

    // Procesar la plantilla (simple reemplazo de variables)
    let finalDocument = templateContent;
    
    Object.entries(templateVars).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      if (Array.isArray(value)) {
        finalDocument = finalDocument.replace(regex, value.map(item => `- ${item}`).join('\n'));
      } else {
        finalDocument = finalDocument.replace(regex, String(value));
      }
    });

    // Procesar bucles especiales ({{#each secuencia}})
    const eachRegex = /{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g;
    finalDocument = finalDocument.replace(eachRegex, (match, arrayName, template) => {
      const array = templateVars[arrayName as keyof typeof templateVars];
      if (Array.isArray(array)) {
        return array.map(item => template.replace(/{{this}}/g, item)).join('');
      }
      return '';
    });

    console.log('Final document generated successfully');

    // Generar metadatos adicionales para Acelerador 6
    const acelerador6Data = {
      competencia: selectedCompetencia,
      estrategias_implementacion: [
        'Implementación gradual por fases',
        'Monitoreo continuo de indicadores',
        'Adaptación según contexto local'
      ],
      puntos_monitoreo: templateVars.puntos_seguimiento,
      evidencias_requeridas: [
        'Registros de participación estudiantil',
        'Productos de aprendizaje',
        'Evaluaciones formativas',
        'Reflexiones docentes'
      ]
    };

    return new Response(
      JSON.stringify({
        success: true,
        finalDocument: finalDocument,
        metadata: {
          titulo: `Unidad de Aprendizaje - ${selectedCompetencia.nombre}`,
          area: selectedCompetencia.area || 'General',
          grado: '3ro-5to Secundaria',
          duracion: '4-6 semanas',
          actividades: templateVars.secuencia.length
        },
        acelerador6_data: acelerador6Data,
        raw_response: finalDocument
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Function error:', error);
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