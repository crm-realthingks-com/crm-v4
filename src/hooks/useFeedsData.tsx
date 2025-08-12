
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserDisplayNames } from "@/hooks/useUserDisplayNames";

interface ActivityData {
  type: string;
  title: string;
  description: string;
  user_id: string;
  time: string;
  details: string;
  created_at: string;
}

export const useFeedsData = () => {
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [stats, setStats] = useState({
    todayCount: 0,
    dealUpdates: 0,
    newContacts: 0,
    meetings: 0
  });
  const [loading, setLoading] = useState(true);
  
  // Use refs to track subscription status and prevent duplicate subscriptions
  const subscriptionsRef = useRef<any[]>([]);
  const lastFetchRef = useRef<number>(0);
  const FETCH_THROTTLE_MS = 5000; // Throttle API calls to max once per 5 seconds

  // Extract user IDs from activities
  const userIds = activities.map(activity => activity.user_id);
  const { displayNames } = useUserDisplayNames(userIds);

  // Memoized fetch function with throttling
  const fetchActivityData = useCallback(async () => {
    const now = Date.now();
    
    // Throttle API calls to prevent excessive requests
    if (now - lastFetchRef.current < FETCH_THROTTLE_MS) {
      return;
    }
    
    lastFetchRef.current = now;

    try {
      setLoading(true);
      
      // Fetch recent deals - limit to reduce data transfer
      const { data: deals } = await supabase
        .from('deals')
        .select('id, deal_name, stage, customer_name, amount, modified_at, created_by')
        .order('modified_at', { ascending: false })
        .limit(3); // Reduced from 5 to 3

      // Fetch recent contacts - limit to reduce data transfer
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, contact_name, company_name, position, created_time, created_by')
        .order('created_time', { ascending: false })
        .limit(3); // Reduced from 5 to 3

      // Fetch recent meetings - limit to reduce data transfer
      const { data: meetings } = await supabase
        .from('meetings')
        .select('id, meeting_title, start_time, location, created_at, created_by')
        .order('updated_at', { ascending: false })
        .limit(3); // Reduced from 5 to 3

      // Transform data into activity format
      const activitiesData: ActivityData[] = [];

      // Add deal activities
      deals?.forEach(deal => {
        activitiesData.push({
          type: 'deal_update',
          title: 'Deal Updated',
          description: `${deal.deal_name} moved to ${deal.stage} stage`,
          user_id: deal.created_by || '',
          time: formatTime(deal.modified_at),
          details: `€${deal.amount?.toLocaleString() || 0} - ${deal.customer_name || 'Unknown Customer'}`,
          created_at: deal.modified_at
        });
      });

      // Add contact activities
      contacts?.forEach(contact => {
        activitiesData.push({
          type: 'contact_added',
          title: 'New Contact Added',
          description: `${contact.contact_name} from ${contact.company_name} added to contacts`,
          user_id: contact.created_by || '',
          time: formatTime(contact.created_time),
          details: contact.position || 'Contact',
          created_at: contact.created_time
        });
      });

      // Add meeting activities
      meetings?.forEach(meeting => {
        activitiesData.push({
          type: 'meeting',
          title: 'Meeting Scheduled',
          description: `${meeting.meeting_title} scheduled`,
          user_id: meeting.created_by || '',
          time: formatTime(meeting.created_at),
          details: `${meeting.start_time} - ${meeting.location || 'Online'}`,
          created_at: meeting.created_at
        });
      });

      // Sort all activities by time
      activitiesData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setActivities(activitiesData);

      // Calculate stats
      const today = new Date().toDateString();
      const todayActivities = activitiesData.filter(activity => 
        new Date(activity.created_at).toDateString() === today
      );

      setStats({
        todayCount: todayActivities.length,
        dealUpdates: activitiesData.filter(a => a.type.includes('deal')).length,
        newContacts: activitiesData.filter(a => a.type === 'contact_added').length,
        meetings: activitiesData.filter(a => a.type.includes('meeting')).length
      });

    } catch (error) {
      console.error('Error fetching activity data:', error);
    } finally {
      setLoading(false);
    }
  }, []); // Stable function reference

  useEffect(() => {
    // Initial fetch
    fetchActivityData();
    
    // Clean up any existing subscriptions first
    subscriptionsRef.current.forEach(subscription => {
      supabase.removeChannel(subscription);
    });
    subscriptionsRef.current = [];

    // Set up throttled real-time listeners with reduced frequency
    const dealsChannel = supabase
      .channel('deals-changes-throttled')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'deals'
      }, () => {
        // Throttled update
        setTimeout(fetchActivityData, 2000);
      })
      .subscribe();

    const contactsChannel = supabase
      .channel('contacts-changes-throttled')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'contacts'
      }, () => {
        // Throttled update
        setTimeout(fetchActivityData, 2000);
      })
      .subscribe();

    const meetingsChannel = supabase
      .channel('meetings-changes-throttled')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'meetings'
      }, () => {
        // Throttled update
        setTimeout(fetchActivityData, 2000);
      })
      .subscribe();

    // Store subscriptions for cleanup
    subscriptionsRef.current = [dealsChannel, contactsChannel, meetingsChannel];

    return () => {
      // Cleanup subscriptions
      subscriptionsRef.current.forEach(subscription => {
        supabase.removeChannel(subscription);
      });
      subscriptionsRef.current = [];
    };
  }, [fetchActivityData]);

  const formatTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} days ago`;
    }
  }, []);

  const activitiesWithNames = activities.map(activity => ({
    ...activity,
    user: displayNames[activity.user_id] || 'Unknown User'
  }));

  return { activities: activitiesWithNames, stats, loading };
};
