
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
    console.log('get-user-names: Function called');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    console.log('get-user-names: Environment check - URL exists:', !!supabaseUrl);
    console.log('get-user-names: Environment check - Service key exists:', !!supabaseServiceKey);
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('get-user-names: Missing environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create a Supabase client with service role key for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userIds } = await req.json();
    console.log('get-user-names: Received user IDs:', userIds);

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      console.log('get-user-names: No valid user IDs provided');
      return new Response(
        JSON.stringify({ error: 'No valid user IDs provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const userDisplayNames: Record<string, string> = {};

    // Try profiles table first (this is more reliable)
    console.log('get-user-names: Fetching from profiles table');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, "Email ID"')
      .in('id', userIds);

    console.log('get-user-names: Profiles result:', { 
      count: profiles?.length || 0, 
      error: profilesError 
    });

    if (!profilesError && profiles) {
      profiles.forEach((profile: any) => {
        const displayName = profile.full_name || profile["Email ID"] || "User";
        userDisplayNames[profile.id] = displayName;
        console.log(`get-user-names: Set display name from profiles for ${profile.id}: ${displayName}`);
      });
    }

    // For any missing users, try auth.users as fallback
    const missingIds = userIds.filter((id: string) => !userDisplayNames[id]);
    
    if (missingIds.length > 0) {
      console.log('get-user-names: Fetching missing users from auth.users:', missingIds);
      
      try {
        const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
        
        console.log('get-user-names: Auth users result:', { 
          count: authData?.users?.length || 0, 
          error: authError 
        });

        if (!authError && authData?.users) {
          authData.users.forEach((user: any) => {
            if (missingIds.includes(user.id)) {
              const displayName = user.user_metadata?.full_name || 
                               user.user_metadata?.display_name || 
                               user.email ||
                               "User";
              userDisplayNames[user.id] = displayName;
              console.log(`get-user-names: Set display name from auth for ${user.id}: ${displayName}`);
            }
          });
        }
      } catch (authError) {
        console.error('get-user-names: Auth query failed:', authError);
      }
    }

    // Set fallback for any still missing users
    userIds.forEach((id: string) => {
      if (!userDisplayNames[id]) {
        userDisplayNames[id] = "Unknown User";
        console.log(`get-user-names: Set fallback name for ${id}: Unknown User`);
      }
    });

    console.log('get-user-names: Final result:', userDisplayNames);

    return new Response(
      JSON.stringify({ userDisplayNames }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('get-user-names: Function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
