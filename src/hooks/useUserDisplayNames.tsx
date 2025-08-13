
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
      console.log('useUserDisplayNames: Fetching display names for user IDs:', validUserIds);
      
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
          console.log('useUserDisplayNames: Using cached names:', cachedNames);
          setDisplayNames(prev => ({ ...prev, ...cachedNames }));
        }

        // Only fetch uncached IDs
        if (uncachedIds.length === 0) {
          setLoading(false);
          return;
        }

        console.log('useUserDisplayNames: Fetching uncached user IDs via edge function:', uncachedIds);

        // Use the new edge function
        const { data, error } = await supabase.functions.invoke('get-user-names', {
          body: { userIds: uncachedIds }
        });

        console.log('useUserDisplayNames: Edge function result:', { data, error });

        if (error) {
          console.error('useUserDisplayNames: Edge function error:', error);
          throw error;
        }

        if (data?.userDisplayNames) {
          const newDisplayNames = data.userDisplayNames;
          console.log('useUserDisplayNames: Received display names:', newDisplayNames);

          // Cache the results
          Object.entries(newDisplayNames).forEach(([id, name]) => {
            displayNameCache.set(id, name as string);
          });

          setDisplayNames(prev => ({ ...prev, ...newDisplayNames }));
        } else {
          console.warn('useUserDisplayNames: No userDisplayNames in response');
          // Set fallback names
          const fallbackNames: Record<string, string> = {};
          uncachedIds.forEach(id => {
            fallbackNames[id] = "Unknown User";
            displayNameCache.set(id, "Unknown User");
          });
          setDisplayNames(prev => ({ ...prev, ...fallbackNames }));
        }
        
      } catch (error) {
        console.error('useUserDisplayNames: Error fetching user display names:', error);
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
