
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

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
    const sortedCurrentIds = [...validUserIds].sort();
    const sortedPreviousIds = [...previousUserIds.current].sort();
    
    const hasChanged = sortedCurrentIds.length !== sortedPreviousIds.length || 
      !sortedCurrentIds.every((id, index) => id === sortedPreviousIds[index]);
    
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

        console.log('useUserDisplayNames: Calling edge function for uncached user IDs:', uncachedIds);

        // Call the new edge function
        const { data: functionResult, error: functionError } = await supabase.functions.invoke(
          'fetch-user-display-names',
          {
            body: { userIds: uncachedIds }
          }
        );

        console.log('useUserDisplayNames: Edge function result:', { functionResult, functionError });

        let newDisplayNames: Record<string, string> = {};

        if (!functionError && functionResult?.userDisplayNames) {
          newDisplayNames = functionResult.userDisplayNames;
          
          // Cache the results
          Object.entries(newDisplayNames).forEach(([id, name]) => {
            displayNameCache.set(id, name);
          });
          
          console.log('useUserDisplayNames: Successfully fetched from edge function:', newDisplayNames);
        } else {
          console.log('useUserDisplayNames: Edge function failed, trying direct query fallback');
          
          // Fallback to direct query if edge function fails
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, "Email ID"')
            .in('id', uncachedIds);

          console.log('useUserDisplayNames: Direct profiles query result:', { profilesData, profilesError });

          if (!profilesError && profilesData) {
            profilesData.forEach((profile) => {
              // Only use profile full_name if it doesn't look like an email and is different from Email ID
              let displayName = "Unknown User";
              
              if (profile.full_name?.trim() && 
                  !profile.full_name.includes('@') &&
                  profile.full_name !== profile["Email ID"]) {
                displayName = profile.full_name.trim();
              } else if (profile["Email ID"]) {
                displayName = profile["Email ID"].split('@')[0];
              }
              
              newDisplayNames[profile.id] = displayName;
              displayNameCache.set(profile.id, displayName);
            });
          }

          // Set fallback for any still missing users
          uncachedIds.forEach(id => {
            if (!newDisplayNames[id]) {
              newDisplayNames[id] = "Unknown User";
              displayNameCache.set(id, "Unknown User");
            }
          });
        }

        console.log('useUserDisplayNames: Final new display names:', newDisplayNames);
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
  }, [userIds.join(',')]); // Use join to create a stable dependency

  return { displayNames, loading };
};
