
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserDisplayName {
  id: string;
  display_name: string;
}

// Create a global cache to prevent duplicate fetches
const displayNameCache = new Map<string, string>();
const pendingFetches = new Map<string, Promise<any>>();

export const useUserDisplayNames = (userIds: string[]) => {
  const [displayNames, setDisplayNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const previousUserIds = useRef<string[]>([]);

  useEffect(() => {
    // Filter out empty/null userIds
    const validUserIds = userIds.filter(id => id && id.trim() !== '');
    
    if (validUserIds.length === 0) {
      setDisplayNames({});
      setLoading(false);
      return;
    }

    // Check if userIds actually changed to prevent unnecessary fetches
    const hasChanged = validUserIds.length !== previousUserIds.current.length || 
      !validUserIds.every(id => previousUserIds.current.includes(id));
    
    if (!hasChanged) return;

    previousUserIds.current = validUserIds;

    const fetchDisplayNames = async () => {
      setLoading(true);
      console.log('Fetching display names for user IDs:', validUserIds);
      
      try {
        // Check cache first for immediate display
        const cachedNames: Record<string, string> = {};
        const uncachedIds: string[] = [];
        
        validUserIds.forEach(id => {
          if (displayNameCache.has(id)) {
            cachedNames[id] = displayNameCache.get(id)!;
          } else {
            uncachedIds.push(id);
          }
        });

        // Set cached names immediately to prevent flickering
        if (Object.keys(cachedNames).length > 0) {
          console.log('Using cached names:', cachedNames);
          setDisplayNames(prev => ({ ...prev, ...cachedNames }));
        }

        // Only fetch uncached IDs
        if (uncachedIds.length === 0) {
          setLoading(false);
          return;
        }

        console.log('Fetching uncached user IDs:', uncachedIds);

        // Try to get user data from profiles table first
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, "Email ID"')
          .in('id', uncachedIds);

        console.log('Profiles query result:', { data: profiles, error: profilesError });

        const userDisplayNames: Record<string, string> = {};

        if (!profilesError && profiles && profiles.length > 0) {
          profiles.forEach((profile: any) => {
            const displayName = profile.full_name || profile["Email ID"] || "User";
            userDisplayNames[profile.id] = displayName;
            displayNameCache.set(profile.id, displayName);
            console.log(`Set display name for ${profile.id}: ${displayName}`);
          });
        }

        // For any missing profiles, try the edge function as fallback
        const missingIds = uncachedIds.filter(id => !userDisplayNames[id]);
        
        if (missingIds.length > 0) {
          console.log('Fetching missing user display names via edge function for:', missingIds);
          
          try {
            const { data, error } = await supabase.functions.invoke('admin-list-users');
            
            if (!error && data?.users) {
              console.log('Edge function returned users:', data.users.length);
              
              data.users.forEach((user: any) => {
                if (missingIds.includes(user.id) && !userDisplayNames[user.id]) {
                  const displayName = user.user_metadata?.full_name || 
                                     user.user_metadata?.display_name || 
                                     user.email ||
                                     "User";
                  userDisplayNames[user.id] = displayName;
                  displayNameCache.set(user.id, displayName);
                  console.log(`Set display name from edge function for ${user.id}: ${displayName}`);
                }
              });
            } else {
              console.warn('Edge function error:', error);
            }
          } catch (edgeError) {
            console.warn('Failed to fetch user display names via edge function:', edgeError);
          }

          // Mark any still missing users with fallback
          missingIds.forEach(id => {
            if (!userDisplayNames[id]) {
              userDisplayNames[id] = "Unknown User";
              displayNameCache.set(id, "Unknown User");
              console.log(`Set fallback name for ${id}: Unknown User`);
            }
          });
        }

        console.log('Final user display names:', userDisplayNames);
        setDisplayNames(prev => ({ ...prev, ...userDisplayNames }));
        
      } catch (error) {
        console.error('Error fetching user display names:', error);
        // Set fallback names and cache them
        const fallbackNames: Record<string, string> = {};
        validUserIds.forEach(id => {
          if (!displayNameCache.has(id)) {
            fallbackNames[id] = "Unknown User";
            displayNameCache.set(id, "Unknown User");
          }
        });
        setDisplayNames(prev => ({ ...prev, ...fallbackNames }));
      } finally {
        setLoading(false);
      }
    };

    fetchDisplayNames();
  }, [userIds]);

  return { displayNames, loading };
};
