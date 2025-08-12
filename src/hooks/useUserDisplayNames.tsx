
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

        // Create the fetch promise
        const fetchPromise = supabase.functions.invoke('admin-list-users')
          .then(({ data, error }) => {
            if (error) throw error;

            const userDisplayNames: Record<string, string> = {};
            
            data.users?.forEach((user: any) => {
              if (uncachedIds.includes(user.id)) {
                const displayName = user.user_metadata?.display_name || 
                                   user.user_metadata?.full_name || 
                                   "Unknown";
                userDisplayNames[user.id] = displayName;
                // Cache the result
                displayNameCache.set(user.id, displayName);
              }
            });

            // Mark missing users as "Unknown" and cache that too
            uncachedIds.forEach(id => {
              if (!userDisplayNames[id]) {
                userDisplayNames[id] = "Unknown";
                displayNameCache.set(id, "Unknown");
              }
            });

            return userDisplayNames;
          });

        // Store the promise to prevent duplicate fetches
        pendingFetches.set(cacheKey, fetchPromise);

        const newNames = await fetchPromise;
        
        // Clean up the pending fetch
        pendingFetches.delete(cacheKey);

        setDisplayNames(prev => ({ ...prev, ...newNames }));
        
      } catch (error) {
        console.error('Error fetching user display names:', error);
        // Set fallback names and cache them
        const fallbackNames: Record<string, string> = {};
        userIds.forEach(id => {
          if (!displayNameCache.has(id)) {
            fallbackNames[id] = "Unknown";
            displayNameCache.set(id, "Unknown");
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
