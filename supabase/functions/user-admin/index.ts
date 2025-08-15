import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('User admin function called with method:', req.method);

    // Create admin client with service role key for full access
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
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: user, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user.user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // NOTE: Admin role requirement removed — any authenticated user can proceed.
    console.log('Authenticated request by:', user.user.email, 'Proceeding without admin role check.');

    // GET - List all users
    if (req.method === 'GET') {
      console.log('Fetching users list...');
      
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();

      if (error) {
        console.error('Error listing users:', error);
        return new Response(
          JSON.stringify({ error: `Failed to fetch users: ${error.message}` }),
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

    // POST - Create new user or reset password
    if (req.method === 'POST') {
      const body = await req.json();
      
      // Handle password reset
      if (body.action === 'reset-password') {
        const { email } = body;
        if (!email) {
          return new Response(
            JSON.stringify({ error: 'Email is required for password reset' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Resetting password for:', email);

        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: email,
        });

        if (error) {
          console.error('Error generating reset link:', error);
          return new Response(
            JSON.stringify({ error: `Password reset failed: ${error.message}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Password reset link generated successfully');
        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'Password reset email sent successfully'
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Handle user creation
      const { email, displayName, role, password } = body;
      
      if (!email || !password || !displayName) {
        return new Response(
          JSON.stringify({ error: 'Email, password, and display name are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Creating user:', email, 'with role:', role || 'user');

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        user_metadata: {
          full_name: displayName
        },
        email_confirm: true
      });

      if (error) {
        console.error('Error creating user:', error);
        return new Response(
          JSON.stringify({ error: `User creation failed: ${error.message}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create profile record and set role
      if (data.user) {
        try {
          // Create profile
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
              id: data.user.id,
              full_name: displayName,
              'Email ID': email
            });

          if (profileError) {
            console.warn('Profile creation failed:', profileError);
          } else {
            console.log('Profile created successfully for:', email);
          }

          // Set user role using server-controlled system
          const { error: roleError } = await supabaseAdmin
            .from('user_roles')
            .insert({
              user_id: data.user.id,
              role: role || 'user',
              assigned_by: user.user.id
            });

          if (roleError) {
            console.warn('Role assignment failed:', roleError);
          } else {
            console.log('Role assigned successfully:', role || 'user');
          }
        } catch (err) {
          console.warn('Setup error:', err);
        }
      }

      console.log('User created successfully:', data.user?.email);
      return new Response(
        JSON.stringify({ 
          success: true,
          user: data.user,
          message: 'User created successfully'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // PUT - Update user (including role changes, activation/deactivation)
    if (req.method === 'PUT') {
      const { userId, displayName, role, action } = await req.json();
      
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'User ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Updating user:', userId, 'action:', action, 'role:', role, 'displayName:', displayName);

      // Prepare update data for auth.users
      let updateData: any = {};

      // Handle display name updates
      if (displayName !== undefined) {
        updateData.user_metadata = { full_name: displayName };
      }

      // Handle user activation/deactivation
      if (action === 'activate') {
        updateData.ban_duration = 'none';
        console.log('Activating user:', userId);
      } else if (action === 'deactivate') {
        updateData.ban_duration = '876000h'; // ~100 years
        console.log('Deactivating user:', userId);
      }

      // Update auth user if needed
      if (Object.keys(updateData).length > 0) {
        console.log('Update data prepared:', JSON.stringify(updateData, null, 2));

        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          updateData
        );

        if (error) {
          console.error('Error updating user:', error);
          return new Response(
            JSON.stringify({ error: `User update failed: ${error.message}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Update profile if display name changed
      if (displayName !== undefined) {
        try {
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({ full_name: displayName })
            .eq('id', userId);

          if (profileError) {
            console.warn('Profile update failed:', profileError);
          } else {
            console.log('Profile updated successfully for user:', userId);
          }
        } catch (profileErr) {
          console.warn('Profile update error:', profileErr);
        }
      }

      // Update role using server-controlled system
      if (role !== undefined) {
        try {
          const { error: roleError } = await supabaseAdmin
            .from('user_roles')
            .update({ 
              role,
              assigned_by: user.user.id,
              assigned_at: new Date().toISOString()
            })
            .eq('user_id', userId);

          if (roleError) {
            console.warn('Role update failed:', roleError);
          } else {
            console.log('Role updated successfully for user:', userId, 'to:', role);
          }
        } catch (roleErr) {
          console.warn('Role update error:', roleErr);
        }
      }

      console.log('User updated successfully:', userId);
      return new Response(
        JSON.stringify({ 
          success: true,
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
        return new Response(
          JSON.stringify({ error: 'User ID is required for deletion' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Deleting user:', userId);

      try {
        // First delete role record
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .delete()
          .eq('user_id', userId);

        if (roleError) {
          console.warn('Role deletion warning:', roleError.message);
        } else {
          console.log('Role deleted successfully for user:', userId);
        }

        // Then delete profile record
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('id', userId);

        if (profileError) {
          console.warn('Profile deletion warning:', profileError.message);
        } else {
          console.log('Profile deleted successfully for user:', userId);
        }

        // Finally delete the auth user
        const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (authDeleteError) {
          console.error('Error deleting auth user:', authDeleteError);
          return new Response(
            JSON.stringify({ 
              error: `User deletion failed: ${authDeleteError.message}` 
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

      } catch (deleteError: any) {
        console.error('Unexpected error during user deletion:', deleteError);
        return new Response(
          JSON.stringify({ 
            error: `Deletion failed: ${deleteError.message || 'Unknown error'}` 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Method not allowed
    return new Response(
      JSON.stringify({ error: `Method ${req.method} not allowed` }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Unexpected error in user-admin function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message || 'An unexpected error occurred'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
