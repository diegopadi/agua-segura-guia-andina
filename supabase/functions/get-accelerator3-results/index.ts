import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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
    const { session_id } = await req.json();

    if (!session_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Session ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Retrieving Accelerator 3 results for session: ${session_id}`);

    // Get current session to find user_id
    const { data: currentSession, error: sessionError } = await supabase
      .from('acelerador_sessions')
      .select('user_id')
      .eq('id', session_id)
      .single();

    if (sessionError || !currentSession) {
      console.error('Error finding current session:', sessionError);
      return new Response(
        JSON.stringify({ success: false, error: 'Session not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Find Accelerator 3 session for the same user
    const { data: accelerator3Session, error: acc3Error } = await supabase
      .from('acelerador_sessions')
      .select('*')
      .eq('user_id', currentSession.user_id)
      .eq('acelerador_number', 3)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (acc3Error || !accelerator3Session) {
      console.error('Error finding Accelerator 3 session:', acc3Error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No completed Accelerator 3 session found. Please complete Accelerator 3 first.' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extract priorities from Accelerator 3 session data
    const sessionData = accelerator3Session.session_data || {};
    
    // Try to extract priorities from different possible locations in the data structure
    let priorities = [];
    
    // Check if priorities are in priority_analysis
    if (sessionData.priority_analysis?.priorities) {
      priorities = sessionData.priority_analysis.priorities;
    }
    // Check if priorities are in the root
    else if (sessionData.priorities) {
      priorities = sessionData.priorities;
    }
    // Check if we have a priority_report with structured content
    else if (sessionData.priority_report) {
      // If we have a priority report but no explicit priorities array, 
      // we'll create default priorities based on common patterns
      priorities = [
        {
          id: 'priority_1',
          title: 'Mejora de la Calidad del Agua',
          description: 'Asegurar que el agua utilizada por los estudiantes sea potable y segura, estableciendo un sistema de monitoreo constante.',
          impact_score: 9,
          feasibility_score: 7
        },
        {
          id: 'priority_2', 
          title: 'Capacitación en Prácticas de Conservación',
          description: 'Desarrollar un programa de capacitación para estudiantes y docentes sobre prácticas de conservación de agua.',
          impact_score: 8,
          feasibility_score: 8
        },
        {
          id: 'priority_3',
          title: 'Fortalecimiento de Infraestructura Hídrica',
          description: 'Mejorar las instalaciones y servicios de agua de la institución educativa.',
          impact_score: 7,
          feasibility_score: 6
        }
      ];
    }

    // Convert priorities to expected format
    const formattedPriorities = priorities.map((priority: any, index: number) => ({
      id: priority.id || `priority_${index + 1}`,
      title: priority.title || priority.name || `Prioridad ${index + 1}`,
      description: priority.description || priority.justification || '',
      impact_score: priority.impact_score || priority.impact || 8,
      feasibility_score: priority.feasibility_score || priority.feasibility || 7
    }));

    console.log(`Found ${formattedPriorities.length} priorities from Accelerator 3`);

    return new Response(
      JSON.stringify({
        success: true,
        accelerator3_data: sessionData,
        priorities: formattedPriorities,
        accelerator3_session_id: accelerator3Session.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in get-accelerator3-results function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});