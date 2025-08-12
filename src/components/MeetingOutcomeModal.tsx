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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Meeting {
  id: string;
  meeting_title: string;
  date: string;
  start_time: string;
}

interface MeetingOutcome {
  id?: string;
  outcome_type: string;
  summary: string;
  next_steps: string;
  interested_in_deal: boolean;
  meeting_id: string;
}

interface MeetingOutcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: Meeting | null;
}

const outcomeTypes = [
  { value: "positive", label: "Positive" },
  { value: "negative", label: "Negative" },
  { value: "neutral", label: "Neutral" },
  { value: "follow_up_required", label: "Follow-up Required" },
  { value: "closed", label: "Closed" },
];

export const MeetingOutcomeModal = ({ isOpen, onClose, meeting }: MeetingOutcomeModalProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    outcome_type: "",
    summary: "",
    next_steps: "",
    interested_in_deal: "no",
  });
  const [existingOutcome, setExistingOutcome] = useState<MeetingOutcome | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (meeting && isOpen) {
      fetchExistingOutcome();
    }
  }, [meeting, isOpen]);

  const fetchExistingOutcome = async () => {
    if (!meeting) return;

    try {
      const { data, error } = await supabase
        .from("meeting_outcomes")
        .select("*")
        .eq("meeting_id", meeting.id)
        .single();

      if (error && error.code !== "PGRST116") { // PGRST116 is "not found"
        throw error;
      }

      if (data) {
        setExistingOutcome(data);
        setFormData({
          outcome_type: data.outcome_type,
          summary: data.summary || "",
          next_steps: data.next_steps || "",
          interested_in_deal: data.interested_in_deal ? "yes" : "no",
        });
      } else {
        setExistingOutcome(null);
        setFormData({
          outcome_type: "",
          summary: "",
          next_steps: "",
          interested_in_deal: "no",
        });
      }
    } catch (error) {
      console.error("Error fetching meeting outcome:", error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.outcome_type) {
      newErrors.outcome_type = "Outcome type is required";
    }
    if (!formData.summary.trim()) {
      newErrors.summary = "Summary is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !meeting || !user) return;

    setLoading(true);

    try {
      const outcomeData = {
        outcome_type: formData.outcome_type,
        summary: formData.summary,
        next_steps: formData.next_steps,
        interested_in_deal: formData.interested_in_deal === "yes",
        meeting_id: meeting.id,
        ...(existingOutcome ? {} : { created_by: user.id }),
      };

      if (existingOutcome) {
        const { error } = await supabase
          .from("meeting_outcomes")
          .update(outcomeData)
          .eq("id", existingOutcome.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Meeting outcome updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("meeting_outcomes")
          .insert([outcomeData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Meeting outcome logged successfully",
        });
      }

      onClose();
    } catch (error) {
      console.error("Error saving meeting outcome:", error);
      toast({
        title: "Error",
        description: "Failed to save meeting outcome",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLinkToDeals = () => {
    onClose();
    navigate("/deals");
  };

  if (!meeting) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {existingOutcome ? "Edit Meeting Outcome" : "Log Meeting Outcome"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Meeting: {meeting.meeting_title}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Outcome Type */}
          <div className="space-y-2">
            <Label>Outcome Type *</Label>
            <Select 
              value={formData.outcome_type} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, outcome_type: value }))}
            >
              <SelectTrigger className={errors.outcome_type ? "border-destructive" : ""}>
                <SelectValue placeholder="Select outcome type" />
              </SelectTrigger>
              <SelectContent>
                {outcomeTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.outcome_type && (
              <p className="text-sm text-destructive">{errors.outcome_type}</p>
            )}
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <Label htmlFor="summary">Notes/Summary *</Label>
            <Textarea
              id="summary"
              value={formData.summary}
              onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
              placeholder="Describe the meeting outcome, key points discussed, decisions made..."
              rows={4}
              className={errors.summary ? "border-destructive" : ""}
            />
            {errors.summary && (
              <p className="text-sm text-destructive">{errors.summary}</p>
            )}
          </div>

          {/* Next Steps */}
          <div className="space-y-2">
            <Label htmlFor="next_steps">Next Steps</Label>
            <Textarea
              id="next_steps"
              value={formData.next_steps}
              onChange={(e) => setFormData(prev => ({ ...prev, next_steps: e.target.value }))}
              placeholder="What are the next actions to be taken?"
              rows={3}
            />
          </div>

          {/* Interested in Deal */}
          <div className="space-y-3">
            <Label>Interested in Deal?</Label>
            <RadioGroup
              value={formData.interested_in_deal}
              onValueChange={(value) => setFormData(prev => ({ ...prev, interested_in_deal: value }))}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="deal-yes" />
                <Label htmlFor="deal-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="deal-no" />
                <Label htmlFor="deal-no">No</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Link to Deals Button */}
          {formData.interested_in_deal === "yes" && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                This prospect is interested in a deal. You can create a new deal opportunity.
              </p>
              <Button type="button" variant="outline" onClick={handleLinkToDeals}>
                Link to Deals Pipeline
              </Button>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : existingOutcome ? "Update Outcome" : "Log Outcome"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};