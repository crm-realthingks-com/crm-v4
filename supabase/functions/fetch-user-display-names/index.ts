
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

    // First, try to get from auth.users to get the actual display names
    console.log('fetch-user-display-names: Fetching from auth.users first');
    
    try {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (!authError && authUsers?.users) {
        authUsers.users.forEach((user) => {
          if (userIds.includes(user.id)) {
            // Prioritize metadata full_name, then display_name, then clean email
            let displayName = "Unknown User";
            
            if (user.user_metadata?.full_name?.trim() && 
                !user.user_metadata.full_name.includes('@')) {
              displayName = user.user_metadata.full_name.trim();
            } else if (user.user_metadata?.display_name?.trim() && 
                       !user.user_metadata.display_name.includes('@')) {
              displayName = user.user_metadata.display_name.trim();
            } else if (user.email) {
              displayName = user.email.split('@')[0];
            }
            
            userDisplayNames[user.id] = displayName;
            console.log(`fetch-user-display-names: Found auth user for ${user.id}: ${displayName}`);
          }
        });
      }
    } catch (authError) {
      console.error('fetch-user-display-names: Auth query failed:', authError);
    }

    // For any missing users, try to get from profiles table as fallback
    const missingUserIds = userIds.filter((id: string) => !userDisplayNames[id]);
    
    if (missingUserIds.length > 0) {
      console.log('fetch-user-display-names: Fetching missing users from profiles:', missingUserIds);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, "Email ID"')
        .in('id', missingUserIds);

      console.log('fetch-user-display-names: Profiles query result:', { profiles, profilesError });

      if (!profilesError && profiles) {
        profiles.forEach((profile) => {
          // Only use profile full_name if it doesn't look like an email and is different from Email ID
          let displayName = "Unknown User";
          
          if (profile.full_name?.trim() && 
              !profile.full_name.includes('@') &&
              profile.full_name !== profile["Email ID"]) {
            displayName = profile.full_name.trim();
          } else if (profile["Email ID"]) {
            displayName = profile["Email ID"].split('@')[0];
          }
          
          userDisplayNames[profile.id] = displayName;
          console.log(`fetch-user-display-names: Found profile for ${profile.id}: ${displayName}`);
        });
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
