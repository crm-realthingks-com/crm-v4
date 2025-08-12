
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Activity, Search } from "lucide-react";
import { ActivityItem } from "@/components/feeds/ActivityItem";
import { RevertConfirmDialog } from "@/components/feeds/RevertConfirmDialog";

// Sample static data
const sampleActivities = [
  {
    id: "1",
    type: "deal_updated",
    title: "Deal Updated",
    description: "Office 22 moved to Offered stage",
    user: "Unknown",
    time: "0 minutes ago",
    details: "€0 - Realthings 22",
    isNew: true
  },
  {
    id: "2",
    type: "deal_updated",
    title: "Deal Updated", 
    description: "RFQ22 moved to RFQ stage",
    user: "Unknown",
    time: "1 minutes ago",
    details: "€0 - Realthings 22",
    isNew: false
  },
  {
    id: "3",
    type: "deal_updated",
    title: "Deal Updated",
    description: "Qualified 22 moved to Qualified stage", 
    user: "Unknown",
    time: "4 minutes ago",
    details: "€0 - Realthings 22",
    isNew: false
  },
  {
    id: "4",
    type: "deal_updated",
    title: "Deal Updated",
    description: "Discussion 22 moved to Discussions stage",
    user: "Unknown", 
    time: "5 minutes ago",
    details: "€0 - Realthings 22",
    isNew: false
  },
  {
    id: "5",
    type: "deal_updated",
    title: "Deal Updated",
    description: "New deal 22 moved to Lead stage",
    user: "Unknown",
    time: "6 minutes ago", 
    details: "€0 - Realthings India 22",
    isNew: false
  },
  {
    id: "6",
    type: "contact_added",
    title: "New Contact Added",
    description: "Deepak Dongare from Comp1 added to contacts",
    user: "RT AI",
    time: "14 minutes ago",
    details: "CIO",
    isNew: false
  },
  {
    id: "7", 
    type: "contact_added",
    title: "New Contact Added",
    description: "Contact One from Realthings India added to contacts",
    user: "Retur blacham",
    time: "2 hours ago",
    details: "IT Manager",
    isNew: false
  }
];

const Feeds = () => {
  const [activities, setActivities] = useState(sampleActivities);
  const [searchQuery, setSearchQuery] = useState("");
  const [revertDialogOpen, setRevertDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);

  // Filter activities based on search query
  const filteredActivities = activities.filter(activity =>
    activity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    activity.details.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleActivityClick = (activityId: string) => {
    console.log(`Redirecting to related record for activity: ${activityId}`);
    // Simulate redirect - in real app this would navigate to the specific record
  };

  const handleRevertClick = (activityId: string) => {
    setSelectedActivity(activityId);
    setRevertDialogOpen(true);
  };

  const handleRevertConfirm = () => {
    if (selectedActivity) {
      console.log(`Reverting changes for activity: ${selectedActivity}`);
      // Simulate revert action - in real app this would call backend
      
      // Remove the reverted activity from the list
      setActivities(prev => prev.filter(activity => activity.id !== selectedActivity));
    }
    setRevertDialogOpen(false);
    setSelectedActivity(null);
  };

  const handleRevertCancel = () => {
    setRevertDialogOpen(false);
    setSelectedActivity(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Activity Feeds</h1>
          <p className="text-muted-foreground">Track all business activities and updates</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search activities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredActivities.length > 0 ? (
              filteredActivities.map((activity) => (
                <ActivityItem
                  key={activity.id}
                  {...activity}
                  onClick={() => handleActivityClick(activity.id)}
                  onRevert={() => handleRevertClick(activity.id)}
                />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? 'No activities match your search' : 'No recent activity to display'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Revert Confirmation Dialog */}
      <RevertConfirmDialog
        open={revertDialogOpen}
        onConfirm={handleRevertConfirm}
        onCancel={handleRevertCancel}
      />
    </div>
  );
};

export default Feeds;
