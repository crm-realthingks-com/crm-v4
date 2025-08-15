
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Deal, DealStage, getNextStage, getFinalStageOptions, getStageIndex, DEAL_STAGES } from "@/types/deal";
import { useToast } from "@/hooks/use-toast";
import { validateRequiredFields, getFieldErrors, validateDateLogic, validateRevenueSum } from "./deal-form/validation";
import { DealStageForm } from "./deal-form/DealStageForm";

interface DealFormProps {
  deal: Deal | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (dealData: Partial<Deal>) => Promise<void>;
  onRefresh?: () => Promise<void>;
  isCreating?: boolean;
  initialStage?: DealStage;
}

export const DealForm = ({ deal, isOpen, onClose, onSave, isCreating = false, initialStage, onRefresh }: DealFormProps) => {
  const [formData, setFormData] = useState<Partial<Deal>>({});
  const [loading, setLoading] = useState(false);
  const [showPreviousStages, setShowPreviousStages] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (deal) {
      console.log("Setting form data from deal:", deal);
      // Initialize revenue fields with 0 if they are null
      const initializedDeal = {
        ...deal,
        quarterly_revenue_q1: deal.quarterly_revenue_q1 ?? 0,
        quarterly_revenue_q2: deal.quarterly_revenue_q2 ?? 0,
        quarterly_revenue_q3: deal.quarterly_revenue_q3 ?? 0,
        quarterly_revenue_q4: deal.quarterly_revenue_q4 ?? 0,
      };
      setFormData(initializedDeal);
      setShowValidationErrors(false);
    } else if (isCreating && initialStage) {
      // Set default values for new deals
      const defaultData: Partial<Deal> = {
        stage: initialStage,
        currency_type: 'EUR', // Default to EUR
        quarterly_revenue_q1: 0,
        quarterly_revenue_q2: 0,
        quarterly_revenue_q3: 0,
        quarterly_revenue_q4: 0,
      };
      setFormData(defaultData);
      setShowValidationErrors(false);
    }
    setShowPreviousStages(false);
  }, [deal, isCreating, initialStage, isOpen]);

  const currentStage = formData.stage || 'Lead';

  // No field errors since validation is removed
  useEffect(() => {
    setFieldErrors({});
  }, [formData, currentStage, showValidationErrors]);

  const handleFieldChange = (field: string, value: any) => {
    console.log(`=== FIELD UPDATE DEBUG ===`);
    console.log(`Updating field: ${field}`);
    console.log(`New value:`, value, `(type: ${typeof value})`);
    console.log(`Current formData before update:`, formData);
    
    setFormData(prev => {
      const updated = { ...prev };
      // Use type assertion to bypass strict type checking for dynamic assignment
      (updated as any)[field] = value;
      return updated;
    });
  };

  const handleLeadSelect = (lead: any) => {
    console.log("Selected lead:", lead);
    // The lead selection is handled in the FormFieldRenderer component
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("=== DEAL FORM SUBMIT DEBUG ===");
      console.log("Current stage:", currentStage);
      console.log("Form data before save:", formData);
      
      // No validation - allow saving with any data
      const saveData = {
        ...formData,
        deal_name: formData.project_name || formData.deal_name || 'Untitled Deal',
        modified_at: new Date().toISOString(),
        modified_by: deal?.created_by || formData.created_by
      };
      
      console.log("Save data:", saveData);
      
      await onSave(saveData);
      
      console.log("Save successful");
      toast({
        title: "Success",
        description: isCreating ? "Deal created successfully" : "Deal updated successfully",
      });
      
      if (onRefresh) {
        await onRefresh();
      }
      
      onClose();
    } catch (error) {
      console.error("=== DEAL FORM SAVE ERROR ===");
      console.error("Error details:", error);
      
      toast({
        title: "Error",
        description: `Failed to save deal: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToNextStage = async () => {
    setLoading(true);
    
    try {
      const nextStage = getNextStage(currentStage);
      if (nextStage) {
        console.log(`Moving deal from ${currentStage} to ${nextStage}`);
        
        const updatedData = {
          ...formData,
          stage: nextStage,
          deal_name: formData.project_name || formData.deal_name || 'Untitled Deal',
          modified_at: new Date().toISOString(),
          modified_by: deal?.created_by || formData.created_by
        };
        
        await onSave(updatedData);
        
        toast({
          title: "Success",
          description: `Deal moved to ${nextStage} stage`,
        });
        
        onClose();
        if (onRefresh) {
          setTimeout(() => onRefresh(), 200);
        }
      }
    } catch (error) {
      console.error("Error moving deal to next stage:", error);
      toast({
        title: "Error",
        description: "Failed to move deal to next stage",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToFinalStage = async (finalStage: DealStage) => {
    setLoading(true);
    
    try {
      console.log(`Moving deal to final stage: ${finalStage}`);
      
      const updatedData = {
        ...formData,
        stage: finalStage,
        deal_name: formData.project_name || formData.deal_name || 'Untitled Deal',
        modified_at: new Date().toISOString(),
        modified_by: deal?.created_by || formData.created_by
      };
      
      setFormData(updatedData);
      await onSave(updatedData);
      
      toast({
        title: "Success",
        description: `Deal moved to ${finalStage} stage`,
      });
      
      onClose();
      if (onRefresh) {
        setTimeout(() => onRefresh(), 200);
      }
    } catch (error) {
      console.error("Error moving deal to final stage:", error);
      toast({
        title: "Error",
        description: `Failed to move deal to ${finalStage} stage`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToSpecificStage = async (targetStage: DealStage) => {
    setLoading(true);
    
    try {
      console.log(`Moving deal from ${currentStage} to ${targetStage}`);
      
      const updatedData = {
        ...formData,
        stage: targetStage,
        deal_name: formData.project_name || formData.deal_name || 'Untitled Deal',
        modified_at: new Date().toISOString(),
        modified_by: deal?.created_by || formData.created_by
      };
      
      setFormData(updatedData);
      await onSave(updatedData);
      
      toast({
        title: "Success",
        description: `Deal moved to ${targetStage} stage`,
      });
      
      onClose();
      if (onRefresh) {
        setTimeout(() => onRefresh(), 200);
      }
    } catch (error) {
      console.error("Error moving deal to stage:", error);
      toast({
        title: "Error",
        description: `Failed to move deal to ${targetStage} stage`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Allow movement to any stage - no restrictions
  const getAvailableStagesForMoveTo = (): DealStage[] => {
    const allStages: DealStage[] = ['Lead', 'Discussions', 'Qualified', 'RFQ', 'Offered', 'Won', 'Lost', 'Dropped'];
    return allStages.filter(stage => stage !== currentStage);
  };

  // No validation - always allow movement and saving
  const canMoveToNextStage = !isCreating && getNextStage(currentStage) !== null;
  const canMoveToFinalStage = !isCreating;
  const canSave = true; // Always allow saving

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">
                {isCreating ? 'Create New Deal' : formData.project_name || 'Edit Deal'}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-sm px-3 py-1">
                  {currentStage}
                </Badge>
                {!isCreating && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      console.log("Toggle button clicked! Current state:", showPreviousStages);
                      setShowPreviousStages(!showPreviousStages);
                      console.log("New state will be:", !showPreviousStages);
                    }}
                  >
                    {showPreviousStages ? 'Hide Previous Stages' : 'Show All Stages'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <DealStageForm
            formData={formData}
            onFieldChange={handleFieldChange}
            onLeadSelect={handleLeadSelect}
            fieldErrors={fieldErrors}
            stage={currentStage}
            showPreviousStages={showPreviousStages}
          />

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="btn-primary">
                {loading ? "Saving..." : "Save"}
              </Button>
            </div>

            <div className="flex gap-2">
              {/* Move to Stage Dropdown - Allow movement to any stage */}
              {!isCreating && getAvailableStagesForMoveTo().length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Move to:</span>
                  <Select
                    value=""
                    onValueChange={(value) => {
                      handleMoveToSpecificStage(value as DealStage);
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select stage..." />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableStagesForMoveTo().map(stage => (
                        <SelectItem key={stage} value={stage}>
                          {stage}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
