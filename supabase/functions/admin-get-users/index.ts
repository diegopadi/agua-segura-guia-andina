import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    console.log('Fetching all users with admin privileges...');

    // Get all profiles with their user data
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    console.log(`Found ${profiles?.length || 0} profiles`);

    // Get accelerator sessions count for each user
    const userIds = profiles?.map(p => p.user_id) || [];
    
    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from('acelerador_sessions')
      .select('user_id, acelerador_number, status')
      .in('user_id', userIds);

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
    }

    // Get files count for each user
    const { data: files, error: filesError } = await supabaseAdmin
      .from('files')
      .select('user_id')
      .in('user_id', userIds);

    if (filesError) {
      console.error('Error fetching files:', filesError);
    }

    // Combine data
    const usersData = profiles?.map(profile => {
      const userSessions = sessions?.filter(s => s.user_id === profile.user_id) || [];
      const userFiles = files?.filter(f => f.user_id === profile.user_id) || [];
      
      return {
        id: profile.id,
        user_id: profile.user_id,
        full_name: profile.full_name,
        ie_name: profile.ie_name,
        ie_region: profile.ie_region,
        ie_province: profile.ie_province,
        ie_district: profile.ie_district,
        ie_country: profile.ie_country,
        area_docencia: profile.area_docencia,
        phone: profile.phone,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        acelerador1_progress: userSessions.find(s => s.acelerador_number === 1)?.status || 'not_started',
        acelerador2_progress: userSessions.find(s => s.acelerador_number === 2)?.status || 'not_started',
        acelerador3_progress: userSessions.find(s => s.acelerador_number === 3)?.status || 'not_started',
        total_files: userFiles.length
      };
    }) || [];

    console.log(`Returning ${usersData.length} users with complete data`);

    return new Response(
      JSON.stringify({ users: usersData }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in admin-get-users:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: 'Failed to fetch users with admin privileges'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});