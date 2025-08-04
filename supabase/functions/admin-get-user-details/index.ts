import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Initialize Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log(`Fetching detailed data for user: ${userId}`);

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      throw profileError;
    }

    // Get accelerator sessions
    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from('acelerador_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
    }

    // Get files
    const { data: files, error: filesError } = await supabaseAdmin
      .from('files')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filesError) {
      console.error('Error fetching files:', filesError);
    }

    // Get form responses
    const sessionIds = sessions?.map(s => s.id) || [];
    let responses = [];
    
    if (sessionIds.length > 0) {
      const { data: formResponses, error: responsesError } = await supabaseAdmin
        .from('form_responses')
        .select('*')
        .in('session_id', sessionIds)
        .order('created_at', { ascending: false });

      if (responsesError) {
        console.error('Error fetching responses:', responsesError);
      } else {
        responses = formResponses || [];
      }
    }

    const detailedData = {
      profile,
      sessions: sessions || [],
      files: files || [],
      responses: responses
    };

    console.log(`Returning detailed data for user ${userId}: ${sessions?.length || 0} sessions, ${files?.length || 0} files, ${responses.length} responses`);

    return new Response(
      JSON.stringify(detailedData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in admin-get-user-details:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: 'Failed to fetch user details with admin privileges'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});