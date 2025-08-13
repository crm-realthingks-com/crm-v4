
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { DealForm } from "./DealForm";
import { supabase } from "@/integrations/supabase/client";
import { Deal } from "@/types/deal";

interface Lead {
  id: string;
  lead_name: string;
  company_name?: string;
  country?: string;
  contact_owner?: string;
}

interface ConvertToDealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  onSuccess: () => void;
}

export const ConvertToDealModal = ({ open, onOpenChange, lead, onSuccess }: ConvertToDealModalProps) => {
  const { toast } = useToast();

  if (!lead) return null;

  const handleSaveDeal = async (dealData: Partial<Deal>) => {
    try {
      console.log("Converting lead to deal with data:", dealData);
      
      const { error } = await supabase
        .from('deals')
        .insert([dealData]);

      if (error) throw error;

      // Update lead status to 'Converted'
      const { error: leadUpdateError } = await supabase
        .from('leads')
        .update({ lead_status: 'Converted' })
        .eq('id', lead.id);

      if (leadUpdateError) {
        console.error("Error updating lead status:", leadUpdateError);
        // Don't throw here as the deal was created successfully
      }

      toast({
        title: "Success",
        description: "Lead converted to deal successfully",
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error converting lead to deal:", error);
      toast({
        title: "Error",
        description: "Failed to convert lead to deal",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Create initial deal data based on lead
  const initialDeal: Partial<Deal> = {
    stage: 'Lead',
    lead_name: lead.lead_name,
    customer_name: lead.company_name || '',
    region: lead.country || '',
    lead_owner: lead.contact_owner || '',
    project_name: lead.lead_name, // Use lead name as project name initially
    priority: 3, // Default priority
    created_by: 'current-user-id', // This should be replaced with actual user ID
    created_at: new Date().toISOString(),
    modified_at: new Date().toISOString(),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Convert Lead to Deal</DialogTitle>
        </DialogHeader>
        <DealForm 
          deal={initialDeal}
          isOpen={true}
          onClose={() => onOpenChange(false)}
          onSave={handleSaveDeal}
          isCreating={true}
          initialStage="Lead"
        />
      </DialogContent>
    </Dialog>
  );
};
