
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { DealForm } from "./DealForm";

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

  const initialDealData = {
    stage: 'Lead',
    lead_name: lead.lead_name,
    customer_name: lead.company_name || '',
    region: lead.country || '',
    lead_owner: lead.contact_owner || '',
  };

  const handleSuccess = () => {
    toast({
      title: "Success",
      description: "Lead converted to deal successfully",
    });
    onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Convert Lead to Deal</DialogTitle>
        </DialogHeader>
        <DealForm 
          initialData={initialDealData}
          onSuccess={handleSuccess}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};
