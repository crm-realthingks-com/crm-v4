
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: string;
  email: string;
  displayName: string;
}

export const useAllUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      console.log('useAllUsers: Fetching all users from auth');
      
      // First try to get from profiles table
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, "Email ID"');

      console.log('useAllUsers: Profiles result:', { profiles, profilesError });

      let userList: User[] = [];

      if (!profilesError && profiles) {
        userList = profiles.map(profile => ({
          id: profile.id,
          email: profile["Email ID"] || '',
          displayName: profile.full_name || profile["Email ID"] || "Unknown User"
        }));
      }

      // If we don't have enough users from profiles, try auth users as fallback
      if (userList.length === 0) {
        console.log('useAllUsers: Fetching from auth users as fallback');
        
        try {
          const { data: authData, error: authError } = await supabase.functions.invoke('admin-list-users');
          
          if (!authError && authData?.users) {
            userList = authData.users.map((user: any) => ({
              id: user.id,
              email: user.email || '',
              displayName: user.user_metadata?.full_name || 
                         user.user_metadata?.display_name || 
                         user.email ||
                         "Unknown User"
            }));
          }
        } catch (authError) {
          console.error('useAllUsers: Auth query failed:', authError);
        }
      }

      console.log('useAllUsers: Final user list:', userList);
      setUsers(userList);
      
    } catch (error) {
      console.error('useAllUsers: Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  return { users, loading, refetch: fetchAllUsers };
};
