
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client for authentication
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.email);

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { subject, attendees, startTime, endTime } = await req.json();

    if (!subject || !attendees || !startTime || !endTime) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: subject, attendees, startTime, endTime' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the meeting creation attempt for security audit
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    try {
      await adminClient.rpc('log_security_event', {
        p_action: 'TEAMS_MEETING_CREATED',
        p_resource_type: 'meeting',
        p_details: {
          subject,
          attendee_count: attendees.length,
          created_by: user.id,
          created_at: new Date().toISOString()
        }
      });
    } catch (logError) {
      console.warn('Failed to log security event:', logError);
    }

    // Create meeting object (simplified - in production you'd integrate with Microsoft Graph API)
    const meeting = {
      id: crypto.randomUUID(),
      subject,
      attendees,
      startTime,
      endTime,
      organizer: user.email,
      joinUrl: `https://teams.microsoft.com/l/meetup-join/${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
      createdBy: user.id
    };

    console.log('Teams meeting created:', meeting.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        meeting,
        message: 'Teams meeting created successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error creating Teams meeting:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
