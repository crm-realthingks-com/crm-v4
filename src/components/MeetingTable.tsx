import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserDisplayNames } from "@/hooks/useUserDisplayNames";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Search, Plus, MoreHorizontal, FileUp, FileDown } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { MeetingModal } from "./MeetingModal";
import { MeetingOutcomeModal } from "./MeetingOutcomeModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Meeting {
  id: string;
  meeting_title: string;
  date: string;
  start_time: string;
  duration: string;
  location: string;
  timezone: string;
  description: string;
  teams_link: string;
  participants: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface Lead {
  id: string;
  lead_name: string;
}

export const MeetingTable = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMeetings, setSelectedMeetings] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [selectedMeetingForOutcome, setSelectedMeetingForOutcome] = useState<Meeting | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState<Meeting | null>(null);

  // Get unique user IDs for display names
  const userIds = [...new Set(meetings.map(m => m.created_by))];
  const { displayNames } = useUserDisplayNames(userIds);

  useEffect(() => {
    fetchMeetings();
    fetchLeads();
  }, []);

  const fetchMeetings = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from("meetings")
        .select("*")
        .gte("date", today.toISOString().split('T')[0])
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) throw error;
      setMeetings(data || []);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      toast({
        title: "Error",
        description: "Failed to fetch meetings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("id, lead_name")
        .order("lead_name");

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error("Error fetching leads:", error);
    }
  };

  const getParticipantNames = (participantIds: string[]) => {
    return participantIds
      .map(id => leads.find(lead => lead.id === id)?.lead_name || "Unknown")
      .join(", ");
  };

  const filteredMeetings = meetings.filter(meeting =>
    meeting.meeting_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    meeting.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getParticipantNames(meeting.participants).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const currentPageMeetings = filteredMeetings.slice(0, 50).map(m => m.id);
      setSelectedMeetings(currentPageMeetings);
    } else {
      setSelectedMeetings([]);
    }
  };

  const handleSelectMeeting = (meetingId: string, checked: boolean) => {
    if (checked) {
      setSelectedMeetings([...selectedMeetings, meetingId]);
    } else {
      setSelectedMeetings(selectedMeetings.filter(id => id !== meetingId));
    }
  };

  const handleEdit = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    setIsModalOpen(true);
  };

  const handleDelete = async (meeting: Meeting) => {
    setMeetingToDelete(meeting);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!meetingToDelete) return;

    try {
      const { error } = await supabase
        .from("meetings")
        .delete()
        .eq("id", meetingToDelete.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Meeting deleted successfully",
      });

      fetchMeetings();
      setSelectedMeetings(selectedMeetings.filter(id => id !== meetingToDelete.id));
    } catch (error) {
      console.error("Error deleting meeting:", error);
      toast({
        title: "Error",
        description: "Failed to delete meeting",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setMeetingToDelete(null);
    }
  };

  const handleLogOutcome = (meeting: Meeting) => {
    setSelectedMeetingForOutcome(meeting);
    setIsOutcomeModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingMeeting(null);
    fetchMeetings();
  };

  const handleOutcomeModalClose = () => {
    setIsOutcomeModalOpen(false);
    setSelectedMeetingForOutcome(null);
  };

  const formatDateTime = (date: string, time: string, timezone: string) => {
    try {
      const dateTime = new Date(`${date}T${time}`);
      return format(dateTime, "MMM dd, yyyy 'at' HH:mm");
    } catch {
      return `${date} at ${time}`;
    }
  };

  const getMeetingStatus = (date: string, time: string) => {
    const meetingDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    
    if (meetingDateTime < now) {
      return "Completed";
    } else if (meetingDateTime.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
      return "Upcoming";
    } else {
      return "Scheduled";
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading meetings...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Top Section */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search meetings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreHorizontal className="w-4 h-4 mr-2" />
                Import/Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <FileUp className="w-4 h-4 mr-2" />
                Import Meetings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileDown className="w-4 h-4 mr-2" />
                Export All
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Meeting
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedMeetings.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground">
            {selectedMeetings.length} meeting(s) selected
          </span>
          <Button variant="destructive" size="sm">
            Delete Selected
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedMeetings.length === Math.min(filteredMeetings.length, 50)}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Organizer</TableHead>
              <TableHead>Participants</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMeetings.slice(0, 50).map((meeting) => (
              <TableRow key={meeting.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedMeetings.includes(meeting.id)}
                    onCheckedChange={(checked) => handleSelectMeeting(meeting.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="link"
                    className="p-0 h-auto font-semibold text-left"
                    onClick={() => handleEdit(meeting)}
                  >
                    {meeting.meeting_title}
                  </Button>
                </TableCell>
                <TableCell>
                  {formatDateTime(meeting.date, meeting.start_time, meeting.timezone)}
                </TableCell>
                <TableCell>{meeting.duration}</TableCell>
                <TableCell>{displayNames[meeting.created_by] || "Unknown"}</TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {getParticipantNames(meeting.participants)}
                  {meeting.teams_link && (
                    <div className="mt-1">
                      <a 
                        href={meeting.teams_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-xs underline"
                      >
                        Join Teams Meeting
                      </a>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={getMeetingStatus(meeting.date, meeting.start_time) === "Completed" ? "secondary" : "default"}>
                    {getMeetingStatus(meeting.date, meeting.start_time)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getMeetingStatus(meeting.date, meeting.start_time) === "Completed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLogOutcome(meeting)}
                      >
                        Log Outcome
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(meeting)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(meeting)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredMeetings.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No meetings found
        </div>
      )}

      {/* Modals */}
      <MeetingModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        meeting={editingMeeting}
        leads={leads}
      />

      <MeetingOutcomeModal
        isOpen={isOutcomeModalOpen}
        onClose={handleOutcomeModalClose}
        meeting={selectedMeetingForOutcome}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Meeting</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{meetingToDelete?.meeting_title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};