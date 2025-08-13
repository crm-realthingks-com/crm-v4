
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
    // Check if userIds actually changed to prevent unnecessary fetches
    const hasChanged = userIds.length !== previousUserIds.current.length || 
      !userIds.every(id => previousUserIds.current.includes(id));
    
    if (!hasChanged || userIds.length === 0) return;

    previousUserIds.current = userIds;

    const fetchDisplayNames = async () => {
      setLoading(true);
      
      try {
        // Check cache first for immediate display
        const cachedNames: Record<string, string> = {};
        const uncachedIds: string[] = [];
        
        userIds.forEach(id => {
          if (displayNameCache.has(id)) {
            cachedNames[id] = displayNameCache.get(id)!;
          } else {
            uncachedIds.push(id);
          }
        });

        // Set cached names immediately to prevent flickering
        if (Object.keys(cachedNames).length > 0) {
          setDisplayNames(prev => ({ ...prev, ...cachedNames }));
        }

        // Only fetch uncached IDs
        if (uncachedIds.length === 0) {
          setLoading(false);
          return;
        }

        // Check if we're already fetching these IDs
        const cacheKey = uncachedIds.sort().join(',');
        if (pendingFetches.has(cacheKey)) {
          const result = await pendingFetches.get(cacheKey);
          setDisplayNames(prev => ({ ...prev, ...result }));
          setLoading(false);
          return;
        }

        // Try to get user data from profiles table first
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, "Email ID"')
          .in('id', uncachedIds);

        const userDisplayNames: Record<string, string> = {};

        if (!profilesError && profiles) {
          profiles.forEach((profile: any) => {
            const displayName = profile.full_name || profile["Email ID"] || "User";
            userDisplayNames[profile.id] = displayName;
            displayNameCache.set(profile.id, displayName);
          });
        }

        // For any missing profiles, try the edge function as fallback
        const missingIds = uncachedIds.filter(id => !userDisplayNames[id]);
        
        if (missingIds.length > 0) {
          // Create the fetch promise for edge function
          const fetchPromise = supabase.functions.invoke('admin-list-users')
            .then(({ data, error }) => {
              if (error) {
                console.warn('Edge function error, using fallback:', error);
                // Set fallback names for missing users
                missingIds.forEach(id => {
                  userDisplayNames[id] = "User";
                  displayNameCache.set(id, "User");
                });
                return userDisplayNames;
              }

              data.users?.forEach((user: any) => {
                if (missingIds.includes(user.id) && !userDisplayNames[user.id]) {
                  const displayName = user.user_metadata?.display_name || 
                                     user.user_metadata?.full_name || 
                                     user.email ||
                                     "User";
                  userDisplayNames[user.id] = displayName;
                  displayNameCache.set(user.id, displayName);
                }
              });

              // Mark any still missing users
              missingIds.forEach(id => {
                if (!userDisplayNames[id]) {
                  userDisplayNames[id] = "User";
                  displayNameCache.set(id, "User");
                }
              });

              return userDisplayNames;
            })
            .catch((error) => {
              console.warn('Failed to fetch user display names:', error);
              // Set fallback names for all missing users
              missingIds.forEach(id => {
                userDisplayNames[id] = "User";
                displayNameCache.set(id, "User");
              });
              return userDisplayNames;
            });

          // Store the promise to prevent duplicate fetches
          pendingFetches.set(cacheKey, fetchPromise);

          const edgeFunctionResult = await fetchPromise;
          
          // Clean up the pending fetch
          pendingFetches.delete(cacheKey);

          // Merge with existing results
          Object.assign(userDisplayNames, edgeFunctionResult);
        }

        setDisplayNames(prev => ({ ...prev, ...userDisplayNames }));
        
      } catch (error) {
        console.error('Error fetching user display names:', error);
        // Set fallback names and cache them
        const fallbackNames: Record<string, string> = {};
        userIds.forEach(id => {
          if (!displayNameCache.has(id)) {
            fallbackNames[id] = "User";
            displayNameCache.set(id, "User");
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
