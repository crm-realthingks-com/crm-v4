
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
    console.log('Admin users function called with method:', req.method);

    // Create admin client
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

    // Verify the user making the request is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: user, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user.user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authenticated:', user.user.email);

    if (req.method === 'GET') {
      // List all users
      console.log('Listing users...');
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();

      if (error) {
        console.error('Error listing users:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Users fetched successfully:', data.users.length);
      return new Response(
        JSON.stringify({ users: data.users }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (req.method === 'POST') {
      // Create new user
      const { email, displayName, role, password } = await req.json();
      console.log('Creating user:', email, 'with role:', role);

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        user_metadata: {
          full_name: displayName,
          role: role
        },
        email_confirm: true
      });

      if (error) {
        console.error('Error creating user:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('User created successfully:', data.user?.email);
      return new Response(
        JSON.stringify({ user: data.user }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (req.method === 'PUT') {
      // Update user
      const { userId, displayName, role, action } = await req.json();
      console.log('Updating user:', userId, 'action:', action);

      let updateData: any = {};

      if (displayName !== undefined) {
        updateData.user_metadata = { full_name: displayName };
      }

      if (role !== undefined) {
        updateData.user_metadata = { 
          ...updateData.user_metadata,
          role: role 
        };
      }

      if (action === 'activate') {
        updateData.ban_duration = 'none';
      } else if (action === 'deactivate') {
        updateData.ban_duration = '876000h';
      }

      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        updateData
      );

      if (error) {
        console.error('Error updating user:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('User updated successfully:', data.user?.email);
      return new Response(
        JSON.stringify({ user: data.user }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (req.method === 'DELETE') {
      // Delete user
      const { userId } = await req.json();
      console.log('Deleting user:', userId);

      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (error) {
        console.error('Error deleting user:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('User deleted successfully');
      return new Response(
        JSON.stringify({ success: true }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
