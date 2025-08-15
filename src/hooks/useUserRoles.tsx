
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export type AppRole = 'admin' | 'moderator' | 'user';

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  created_by?: string;
}

export const useUserRoles = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkUserRole = async (userId: string, role: AppRole): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: role
      });

      if (error) {
        console.error('Error checking user role:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('Error in checkUserRole:', error);
      return false;
    }
  };

  const checkCurrentUserAdmin = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase.rpc('is_current_user_admin');
      
      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }
      
      return data || false;
    } catch (error) {
      console.error('Error in checkCurrentUserAdmin:', error);
      return false;
    }
  };

  const assignRole = async (userId: string, role: AppRole): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: role,
          created_by: user?.id
        });

      if (error) {
        console.error('Error assigning role:', error);
        toast({
          title: "Error",
          description: "Failed to assign role",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Success",
        description: `Role ${role} assigned successfully`,
      });

      await fetchUserRoles();
      return true;
    } catch (error) {
      console.error('Error in assignRole:', error);
      return false;
    }
  };

  const removeRole = async (userId: string, role: AppRole): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) {
        console.error('Error removing role:', error);
        toast({
          title: "Error",
          description: "Failed to remove role",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Success",
        description: `Role ${role} removed successfully`,
      });

      await fetchUserRoles();
      return true;
    } catch (error) {
      console.error('Error in removeRole:', error);
      return false;
    }
  };

  const fetchUserRoles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user roles:', error);
        return;
      }

      setUserRoles(data || []);
    } catch (error) {
      console.error('Error in fetchUserRoles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserRoles();
      
      // Check if current user is admin
      checkCurrentUserAdmin().then(setIsAdmin);
    }
  }, [user]);

  return {
    userRoles,
    loading,
    isAdmin,
    checkUserRole,
    checkCurrentUserAdmin,
    assignRole,
    removeRole,
    fetchUserRoles
  };
};
