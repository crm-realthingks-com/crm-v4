
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
    
    console.log('get-user-names: Creating admin client');
    
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

    // Try to get user data from auth.users (using service role)
    console.log('get-user-names: Fetching users from auth.users');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    console.log('get-user-names: Auth users result:', { 
      count: authUsers?.users?.length || 0, 
      error: authError 
    });

    const userDisplayNames: Record<string, string> = {};

    if (!authError && authUsers?.users) {
      // Filter for requested user IDs and extract display names
      authUsers.users.forEach((user: any) => {
        if (userIds.includes(user.id)) {
          const displayName = user.user_metadata?.full_name || 
                             user.user_metadata?.display_name || 
                             user.email ||
                             "User";
          userDisplayNames[user.id] = displayName;
          console.log(`get-user-names: Set display name for ${user.id}: ${displayName}`);
        }
      });
    }

    // For any missing users, try profiles table as fallback
    const missingIds = userIds.filter((id: string) => !userDisplayNames[id]);
    
    if (missingIds.length > 0) {
      console.log('get-user-names: Fetching missing users from profiles:', missingIds);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, "Email ID"')
        .in('id', missingIds);

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
