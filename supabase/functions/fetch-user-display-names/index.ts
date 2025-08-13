
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('fetch-user-display-names: Function called');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('fetch-user-display-names: Missing environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create a Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userIds } = await req.json();
    console.log('fetch-user-display-names: Received user IDs:', userIds);

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return new Response(
        JSON.stringify({ userDisplayNames: {} }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const userDisplayNames: Record<string, string> = {};

    // First try to get from profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, "Email ID"')
      .in('id', userIds);

    console.log('fetch-user-display-names: Profiles query result:', { profiles, profilesError });

    if (!profilesError && profiles) {
      profiles.forEach((profile) => {
        const displayName = profile.full_name || profile["Email ID"] || "Unknown User";
        userDisplayNames[profile.id] = displayName;
        console.log(`fetch-user-display-names: Found profile for ${profile.id}: ${displayName}`);
      });
    }

    // For any missing users, try to get from auth.users
    const missingUserIds = userIds.filter((id: string) => !userDisplayNames[id]);
    
    if (missingUserIds.length > 0) {
      console.log('fetch-user-display-names: Fetching missing users from auth:', missingUserIds);
      
      try {
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        
        if (!authError && authUsers?.users) {
          authUsers.users.forEach((user) => {
            if (missingUserIds.includes(user.id)) {
              const displayName = user.user_metadata?.full_name || 
                               user.user_metadata?.display_name || 
                               user.email ||
                               "Unknown User";
              userDisplayNames[user.id] = displayName;
              console.log(`fetch-user-display-names: Found auth user for ${user.id}: ${displayName}`);
            }
          });
        }
      } catch (authError) {
        console.error('fetch-user-display-names: Auth query failed:', authError);
      }
    }

    // Set fallback for any still missing users
    userIds.forEach((id: string) => {
      if (!userDisplayNames[id]) {
        userDisplayNames[id] = "Unknown User";
      }
    });

    console.log('fetch-user-display-names: Final result:', userDisplayNames);

    return new Response(
      JSON.stringify({ userDisplayNames }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('fetch-user-display-names: Function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
