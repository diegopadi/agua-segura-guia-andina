import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { unidadId, userId, sessionData } = await req.json();
    
    if (!unidadId || !userId || !sessionData) {
      throw new Error('Missing required parameters: unidadId, userId, sessionData');
    }

    console.log(`Starting session regeneration for unidad: ${unidadId}, user: ${userId}`);

    // Step 1: Acquire advisory lock for unit-level concurrent control
    const { data: lockAcquired } = await supabase.rpc('acquire_unit_lock', {
      unidad_id_param: unidadId
    });

    if (!lockAcquired) {
      throw new Error('Unable to acquire lock for this unit. Another regeneration may be in progress.');
    }

    try {
      // Step 2: Check for A7 data (instruments, rubrics)
      const { data: a7Check } = await supabase.rpc('check_a7_data_exists', {
        unidad_id_param: unidadId,
        user_id_param: userId
      });

      console.log('A7 data check result:', a7Check);

      // Step 3: Get current active sessions for versioning
      const { data: currentSessions, error: currentError } = await supabase
        .from('sesiones_clase')
        .select('*')
        .eq('unidad_id', unidadId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('session_index');

      if (currentError) {
        throw new Error(`Error fetching current sessions: ${currentError.message}`);
      }

      const currentVersionNumber = currentSessions.length > 0 
        ? Math.max(...currentSessions.map(s => s.version_number || 1))
        : 0;
      const nextVersionNumber = currentVersionNumber + 1;

      console.log(`Current version: ${currentVersionNumber}, Next version: ${nextVersionNumber}`);

      // Step 4: Create new session versions with transaction
      const newSessionsData = sessionData.map((session: any, index: number) => ({
        user_id: userId,
        unidad_id: unidadId,
        session_index: index + 1,
        titulo: session.title || `Sesión ${index + 1}`,
        proposito: session.purpose || session.proposito || '',
        inicio: session.activities?.inicio || session.inicio || '',
        desarrollo: session.activities?.desarrollo || session.desarrollo || '',
        cierre: session.activities?.cierre || session.cierre || '',
        recursos: session.resources || session.recursos || [],
        evidencias: session.evidences || session.evidencias || [],
        competencias_ids: session.competencias_ids || [],
        capacidades: session.capacidades || [],
        duracion_min: session.duration_min || session.duracion_min || 45,
        estado: 'BORRADOR',
        rubricas_ids: [],
        is_active: true,
        version_number: nextVersionNumber,
        regenerated_at: new Date().toISOString()
      }));

      // Step 5: Validate session data structure
      for (const session of newSessionsData) {
        if (!session.titulo || !session.proposito) {
          throw new Error(`Invalid session data: missing title or purpose for session ${session.session_index}`);
        }
      }

      // Step 6: Insert new session versions
      const { data: newSessions, error: insertError } = await supabase
        .from('sesiones_clase')
        .insert(newSessionsData)
        .select();

      if (insertError) {
        throw new Error(`Error creating new session versions: ${insertError.message}`);
      }

      console.log(`Created ${newSessions.length} new session versions`);

      // Step 7: Archive previous versions (mark as inactive)
      if (currentSessions.length > 0) {
        const archiveUpdates = currentSessions.map((oldSession, index) => ({
          id: oldSession.id,
          is_active: false,
          replaced_by_session_id: newSessions[index]?.id,
          regenerated_at: new Date().toISOString()
        }));

        const { error: archiveError } = await supabase
          .from('sesiones_clase')
          .upsert(archiveUpdates);

        if (archiveError) {
          // Rollback: delete new sessions and reactivate old ones
          await supabase
            .from('sesiones_clase')
            .delete()
            .in('id', newSessions.map(s => s.id));

          throw new Error(`Error archiving previous versions: ${archiveError.message}`);
        }

        console.log(`Archived ${archiveUpdates.length} previous session versions`);
      }

      // Step 8: Log telemetry events
      const telemetryEvents = [
        {
          event_type: 'a6_regeneration_succeeded',
          metadata: {
            unidad_id: unidadId,
            user_id: userId,
            previous_version: currentVersionNumber,
            new_version: nextVersionNumber,
            sessions_count: newSessions.length,
            a7_warning_level: a7Check?.warning_level || 'none',
            timestamp: new Date().toISOString()
          }
        }
      ];

      // Log success event (you could extend this with a proper telemetry table)
      console.log('Telemetry events:', telemetryEvents);

      return new Response(JSON.stringify({
        success: true,
        message: `Successfully regenerated ${newSessions.length} sessions`,
        data: {
          newSessions,
          versionNumber: nextVersionNumber,
          a7Check,
          canRollback: true,
          rollbackUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });

    } finally {
      // Always release the advisory lock
      await supabase.rpc('release_unit_lock', {
        unidad_id_param: unidadId
      });
    }

  } catch (error) {
    console.error('Error in regenerate-sessions-versioning:', error);
    
    // Log failure telemetry
    const failureEvent = {
      event_type: 'a6_regeneration_failed',
      metadata: {
        error: error.message,
        timestamp: new Date().toISOString()
      }
    };
    console.log('Failure telemetry:', failureEvent);

    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});