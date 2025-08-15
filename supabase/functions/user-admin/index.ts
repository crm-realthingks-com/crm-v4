
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
    console.log('User admin function called with method:', req.method);

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

    // GET - List all users
    if (req.method === 'GET') {
      console.log('Fetching users list...');
      
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();

      if (error) {
        console.error('Error listing users:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Users fetched successfully:', data?.users?.length || 0);
      return new Response(
        JSON.stringify({ users: data.users }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // POST - Create new user
    if (req.method === 'POST') {
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

      // Create profile record
      try {
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: data.user?.id,
            full_name: displayName,
            'Email ID': email
          });

        if (profileError) {
          console.warn('Profile creation failed:', profileError);
        }
      } catch (profileErr) {
        console.warn('Profile creation error:', profileErr);
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

    // PUT - Update user
    if (req.method === 'PUT') {
      const { userId, displayName, role, action } = await req.json();
      console.log('Updating user:', userId, 'action:', action, 'role:', role);

      // Prepare update data
      let updateData: any = {};

      if (displayName !== undefined) {
        updateData.user_metadata = { 
          ...updateData.user_metadata,
          full_name: displayName 
        };
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

      console.log('Update data prepared:', updateData);

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

      // Update profile record if display name changed
      if (displayName !== undefined) {
        try {
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({ full_name: displayName })
            .eq('id', userId);

          if (profileError) {
            console.warn('Profile update failed:', profileError);
          }
        } catch (profileErr) {
          console.warn('Profile update error:', profileErr);
        }
      }

      console.log('User updated successfully');
      return new Response(
        JSON.stringify({ 
          success: true,
          user: data.user,
          message: 'User updated successfully'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // DELETE - Delete user
    if (req.method === 'DELETE') {
      const { userId } = await req.json();
      
      if (!userId) {
        console.error('No userId provided for deletion');
        return new Response(
          JSON.stringify({ error: 'User ID is required for deletion' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Attempting to delete user:', userId);

      try {
        // First delete profile record
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('id', userId);

        if (profileError) {
          console.warn('Profile deletion warning:', profileError.message);
        } else {
          console.log('Profile deleted successfully for user:', userId);
        }

        // Then delete the auth user
        const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (authDeleteError) {
          console.error('Error deleting auth user:', authDeleteError);
          return new Response(
            JSON.stringify({ 
              error: `Failed to delete user: ${authDeleteError.message}` 
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('User deleted successfully:', userId);
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'User deleted successfully',
            userId: userId 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );

      } catch (deleteError) {
        console.error('Unexpected error during user deletion:', deleteError);
        return new Response(
          JSON.stringify({ 
            error: `Unexpected error during deletion: ${deleteError.message || 'Unknown error'}` 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in user-admin function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message || 'Unknown error occurred'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
