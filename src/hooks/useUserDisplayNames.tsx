
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

        console.log('useUserDisplayNames: Fetching uncached user IDs:', uncachedIds);

        // Try direct profiles table query first as fallback
        console.log('useUserDisplayNames: Trying direct profiles query...');
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, "Email ID"')
          .in('id', uncachedIds);

        console.log('useUserDisplayNames: Profiles query result:', { 
          data: profilesData, 
          error: profilesError 
        });

        const newDisplayNames: Record<string, string> = {};

        if (!profilesError && profilesData) {
          profilesData.forEach((profile) => {
            const displayName = profile.full_name || profile["Email ID"] || "User";
            newDisplayNames[profile.id] = displayName;
            displayNameCache.set(profile.id, displayName);
            console.log(`useUserDisplayNames: Set display name from profiles for ${profile.id}: ${displayName}`);
          });
        }

        // For any still missing users, set fallback
        uncachedIds.forEach(id => {
          if (!newDisplayNames[id]) {
            newDisplayNames[id] = "Unknown User";
            displayNameCache.set(id, "Unknown User");
            console.log(`useUserDisplayNames: Set fallback name for ${id}: Unknown User`);
          }
        });

        console.log('useUserDisplayNames: Final result:', newDisplayNames);
        setDisplayNames(prev => ({ ...prev, ...newDisplayNames }));
        
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
