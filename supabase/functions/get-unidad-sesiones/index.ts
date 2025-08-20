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
    const { unidad_id, user_id } = await req.json();

    if (!unidad_id || !user_id) {
      throw new Error('Missing required parameters: unidad_id, user_id');
    }

    console.log('Getting sessions for unit:', unidad_id, 'user:', user_id);

    // Get sessions for the unit
    const { data: sessions, error: sessionsError } = await supabase
      .from('sesiones_clase')
      .select(`
        id,
        session_index,
        titulo,
        proposito,
        estado,
        duracion_min,
        competencias_ids,
        rubricas_ids,
        created_at,
        updated_at
      `)
      .eq('unidad_id', unidad_id)
      .eq('user_id', user_id)
      .order('session_index', { ascending: true });

    if (sessionsError) {
      throw new Error(`Error fetching sessions: ${sessionsError.message}`);
    }

    // Get rubrics count for each session
    const sessionsWithRubrics = await Promise.all(
      (sessions || []).map(async (session) => {
        const { count, error: countError } = await supabase
          .from('instrumentos_evaluacion')
          .select('*', { count: 'exact', head: true })
          .eq('sesion_id', session.id);

        if (countError) {
          console.error('Error counting rubrics for session', session.id, ':', countError);
        }

        return {
          ...session,
          rubrics_count: count || 0,
          has_all_rubrics: (count || 0) >= 3,
          can_export: session.estado === 'LISTA_PARA_EXPORTAR' || session.estado === 'APROBADA'
        };
      })
    );

    console.log('Found', sessionsWithRubrics.length, 'sessions for unit');

    return new Response(JSON.stringify({ 
      sessions: sessionsWithRubrics,
      total_sessions: sessionsWithRubrics.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-unidad-sesiones function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});