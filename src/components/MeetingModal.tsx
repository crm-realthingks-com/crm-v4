import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

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
}

interface Lead {
  id: string;
  lead_name: string;
}

interface MeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting?: Meeting | null;
  leads: Lead[];
}

const timezones = [
  "UTC", "EST", "CST", "MST", "PST", "GMT", "CET", "JST", "IST", "AEST"
];

const durations = [
  { value: "30 min", label: "30 minutes" },
  { value: "1 hour", label: "1 hour" },
  { value: "1.5 hours", label: "1.5 hours" },
  { value: "2 hours", label: "2 hours" },
];

export const MeetingModal = ({ isOpen, onClose, meeting, leads }: MeetingModalProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    meeting_title: "",
    date: new Date(),
    start_time: "",
    duration: "30 min",
    location: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    description: "",
    participants: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (meeting) {
      setFormData({
        meeting_title: meeting.meeting_title,
        date: new Date(meeting.date),
        start_time: meeting.start_time,
        duration: meeting.duration,
        location: meeting.location,
        timezone: meeting.timezone,
        description: meeting.description || "",
        participants: meeting.participants || [],
      });
    } else {
      setFormData({
        meeting_title: "",
        date: new Date(),
        start_time: "",
        duration: "30 min",
        location: "",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        description: "",
        participants: [],
      });
    }
    setErrors({});
  }, [meeting, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.meeting_title.trim()) {
      newErrors.meeting_title = "Meeting title is required";
    }
    if (!formData.start_time) {
      newErrors.start_time = "Start time is required";
    }
    if (!formData.location.trim()) {
      newErrors.location = "Location is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!user) return;

    setLoading(true);

    try {
      let teamsLink = "";

      // Create Teams meeting for new meetings only
      if (!meeting) {
        toast({
          title: "Creating meeting...",
          description: "Setting up Microsoft Teams meeting",
        });

        // Calculate meeting end time
        const startDateTime = new Date(`${formData.date.toISOString().split('T')[0]}T${formData.start_time}:00`);
        const durationInMinutes = formData.duration === "30 min" ? 30 : 
                                  formData.duration === "1 hour" ? 60 :
                                  formData.duration === "1.5 hours" ? 90 : 120;
        const endDateTime = new Date(startDateTime.getTime() + (durationInMinutes * 60000));

        try {
          const { data: teamsData, error: teamsError } = await supabase.functions.invoke('create-teams-meeting', {
            body: {
              title: formData.meeting_title,
              startDateTime: startDateTime.toISOString(),
              endDateTime: endDateTime.toISOString(),
              subject: formData.meeting_title,
              bodyContent: formData.description || formData.meeting_title,
            },
          });

          if (teamsError) {
            console.error("Teams meeting creation error:", teamsError);
            toast({
              title: "Error",
              description: "Failed to create Microsoft Teams meeting. Meeting saved without Teams link.",
              variant: "destructive",
            });
            teamsLink = ""; // Don't include Teams link if creation failed
          } else if (teamsData?.success && teamsData?.joinUrl) {
            teamsLink = teamsData.joinUrl;
            toast({
              title: "Teams meeting created",
              description: "Microsoft Teams meeting link generated successfully",
            });
          } else {
            console.error("Invalid response from Teams API:", teamsData);
            toast({
              title: "Warning",
              description: "Meeting created but Teams link could not be generated",
              variant: "destructive",
            });
            teamsLink = "";
          }
        } catch (teamsError) {
          console.error("Teams meeting creation failed:", teamsError);
          toast({
            title: "Error",
            description: "Failed to create Microsoft Teams meeting. Meeting saved without Teams link.",
            variant: "destructive",
          });
          teamsLink = "";
        }
      }

      const meetingData = {
        meeting_title: formData.meeting_title,
        date: formData.date.toISOString().split('T')[0],
        start_time: formData.start_time,
        duration: formData.duration,
        location: formData.location,
        timezone: formData.timezone,
        description: formData.description,
        participants: formData.participants,
        teams_link: meeting ? meeting.teams_link : teamsLink, // Keep existing link for updates
        ...(meeting ? {} : { created_by: user.id }),
      };

      if (meeting) {
        const { error } = await supabase
          .from("meetings")
          .update(meetingData)
          .eq("id", meeting.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Meeting updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("meetings")
          .insert([meetingData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: teamsLink ? "Meeting created with Teams link" : "Meeting created successfully",
        });
      }

      onClose();
    } catch (error) {
      console.error("Error saving meeting:", error);
      toast({
        title: "Error",
        description: "Failed to save meeting",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleParticipantToggle = (leadId: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        participants: [...prev.participants, leadId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        participants: prev.participants.filter(id => id !== leadId)
      }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {meeting ? "Edit Meeting" : "Add New Meeting"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Meeting Title */}
          <div className="space-y-2">
            <Label htmlFor="meeting_title">Meeting Title *</Label>
            <Input
              id="meeting_title"
              value={formData.meeting_title}
              onChange={(e) => setFormData(prev => ({ ...prev, meeting_title: e.target.value }))}
              placeholder="Enter meeting title"
              className={errors.meeting_title ? "border-destructive" : ""}
            />
            {errors.meeting_title && (
              <p className="text-sm text-destructive">{errors.meeting_title}</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.date ? format(formData.date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.date}
                  onSelect={(date) => date && setFormData(prev => ({ ...prev, date }))}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Start Time and Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time *</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                className={errors.start_time ? "border-destructive" : ""}
              />
              {errors.start_time && (
                <p className="text-sm text-destructive">{errors.start_time}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Duration</Label>
              <Select value={formData.duration} onValueChange={(value) => setFormData(prev => ({ ...prev, duration: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {durations.map((duration) => (
                    <SelectItem key={duration.value} value={duration.value}>
                      {duration.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location and Timezone */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Online, Conference Room A"
                className={errors.location ? "border-destructive" : ""}
              />
              {errors.location && (
                <p className="text-sm text-destructive">{errors.location}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select value={formData.timezone} onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Organizer (read-only) */}
          <div className="space-y-2">
            <Label>Organizer</Label>
            <Input
              value={user?.user_metadata?.display_name || user?.email || "Current User"}
              disabled
              className="bg-muted"
            />
          </div>

          {/* Participants */}
          <div className="space-y-2">
            <Label>Participants</Label>
            <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2">
              {leads.map((lead) => (
                <div key={lead.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={lead.id}
                    checked={formData.participants.includes(lead.id)}
                    onCheckedChange={(checked) => handleParticipantToggle(lead.id, checked as boolean)}
                  />
                  <Label htmlFor={lead.id} className="cursor-pointer">
                    {lead.lead_name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Meeting agenda or notes"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : meeting ? "Save Meeting" : "Create Meeting"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};