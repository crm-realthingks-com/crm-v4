
import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { LeadColumn } from "@/types/columns";

interface LeadsHeaderProps {
  onAddLead: () => void;
  columns: LeadColumn[];
  onColumnsChange: (columns: LeadColumn[]) => void;
}

const LeadsHeader = ({ onAddLead, columns, onColumnsChange }: LeadsHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Leads</h1>
        <p className="text-muted-foreground">Manage your sales leads</p>
      </div>
      <div className="flex items-center gap-4">
        <Button onClick={onAddLead} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Lead
        </Button>
      </div>
    </div>
  );
};

export default LeadsHeader;
