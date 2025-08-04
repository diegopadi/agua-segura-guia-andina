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

    // Get diagnostic reports
    const { data: diagnosticReports, error: reportsError } = await supabaseAdmin
      .from('diagnostic_reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (reportsError) {
      console.error('Error fetching diagnostic reports:', reportsError);
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

    // Extract accelerator reports from sessions
    const acceleratorReports = [];
    
    if (sessions) {
      for (const session of sessions) {
        const sessionData = session.session_data || {};
        let reportFound = false;
        
        // Look for reports in various possible locations within session_data
        const reportSources = [
          { data: sessionData.final_report, type: 'final_report' },
          { data: sessionData.report_content, type: 'report_content' },
          { data: sessionData.analysis_report, type: 'analysis_report' },
          { data: sessionData.competency_report, type: 'competency_report' },
          { data: sessionData.priority_report, type: 'priority_report' }
        ];
        
        for (const source of reportSources) {
          if (source.data && (source.data.html_content || source.data.markdown_content)) {
            acceleratorReports.push({
              accelerator_number: session.acelerador_number,
              session_id: session.id,
              status: session.status,
              created_at: session.created_at,
              updated_at: session.updated_at,
              report_data: {
                html_content: source.data.html_content,
                markdown_content: source.data.markdown_content,
                document_number: source.data.document_number,
                report_type: source.type
              }
            });
            reportFound = true;
            break; // Take the first valid report found
          }
        }
        
        // If no structured report found, check for any content in session_data
        if (!reportFound) {
          // Look for any property that might contain report content
          for (const [key, value] of Object.entries(sessionData)) {
            if (value && typeof value === 'object' && 
                (value.html_content || value.markdown_content || value.content)) {
              acceleratorReports.push({
                accelerator_number: session.acelerador_number,
                session_id: session.id,
                status: session.status,
                created_at: session.created_at,
                updated_at: session.updated_at,
                report_data: {
                  html_content: value.html_content || value.content,
                  markdown_content: value.markdown_content,
                  document_number: value.document_number,
                  report_type: key
                }
              });
              break;
            }
          }
        }
        
        console.log(`Session ${session.id} (Accelerator ${session.acelerador_number}): Report found = ${reportFound}`);
      }
    }

    // Add diagnostic reports
    if (diagnosticReports) {
      for (const report of diagnosticReports) {
        if (report.metadata?.report_content || report.metadata?.html_content) {
          acceleratorReports.push({
            accelerator_number: 1, // Diagnostic reports are typically for Accelerator 1
            session_id: report.session_id,
            status: report.status,
            created_at: report.created_at,
            updated_at: report.updated_at,
            document_number: report.document_number,
            report_data: {
              html_content: report.metadata.html_content || report.metadata.report_content,
              markdown_content: report.metadata.markdown_content,
              document_number: report.document_number,
              report_type: 'diagnostic_report'
            }
          });
        }
      }
    }

    const detailedData = {
      profile,
      sessions: sessions || [],
      files: files || [],
      responses: responses,
      diagnostic_reports: diagnosticReports || [],
      accelerator_reports: acceleratorReports
    };

    console.log(`Returning detailed data for user ${userId}: ${sessions?.length || 0} sessions, ${files?.length || 0} files, ${responses.length} responses, ${acceleratorReports.length} accelerator reports`);

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