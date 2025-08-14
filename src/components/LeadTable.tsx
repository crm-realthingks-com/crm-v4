
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LeadColumnCustomizer } from "./LeadColumnCustomizer";
import { LeadModal } from "./LeadModal";
import { ConvertToDealModal } from "./ConvertToDealModal";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Edit, Trash2, TrendingUp } from "lucide-react";
import { useUserDisplayNames } from "@/hooks/useUserDisplayNames";

interface Lead {
  id: string;
  lead_name: string;
  company_name?: string;
  position?: string;
  email?: string;
  phone_no?: string;
  linkedin?: string;
  website?: string;
  contact_source?: string;
  industry?: string;
  country?: string;
  description?: string;
  lead_status?: string;
  created_by?: string;
  contact_owner?: string;
  created_time?: string;
  modified_time?: string;
}

interface LeadTableProps {
  showColumnCustomizer: boolean;
  setShowColumnCustomizer: (show: boolean) => void;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  selectedLeads: string[];
  setSelectedLeads: (leads: string[]) => void;
}

export const LeadTable = ({ 
  showColumnCustomizer, 
  setShowColumnCustomizer, 
  showModal, 
  setShowModal,
  selectedLeads,
  setSelectedLeads
}: LeadTableProps) => {
  const { toast } = useToast();
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);
  const [visibleColumns, setVisibleColumns] = useState({
    lead_name: true,
    company_name: true,
    position: true,
    email: true,
    phone_no: true,
    country: true,
    lead_status: true,
    created_by: true,
  });
  const [editingCell, setEditingCell] = useState<{leadId: string, field: string} | null>(null);
  const [tempValue, setTempValue] = useState<string>("");
  
  // Get all unique lead owner IDs for display name resolution
  const [leadOwnerIds, setLeadOwnerIds] = useState<string[]>([]);
  const { displayNames } = useUserDisplayNames(leadOwnerIds);

  const { data: leads = [], refetch, isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_time', { ascending: false });

      if (error) throw error;
      
      // Extract unique owner IDs for display name resolution
      const uniqueOwnerIds = Array.from(new Set(
        data.map(lead => lead.created_by).filter(Boolean)
      ));
      setLeadOwnerIds(uniqueOwnerIds);
      
      return data;
    },
  });

  // Fetch all lead owners for the dropdown
  const [allLeadOwners, setAllLeadOwners] = useState<string[]>([]);
  const { displayNames: allOwnerDisplayNames } = useUserDisplayNames(allLeadOwners);

  useEffect(() => {
    const fetchAllLeadOwners = async () => {
      try {
        const { data: leads, error } = await supabase
          .from('leads')
          .select('created_by')
          .not('created_by', 'is', null);

        if (error) {
          console.error('Error fetching lead owners:', error);
          return;
        }

        const uniqueUserIds = Array.from(new Set(leads.map(lead => lead.created_by).filter(Boolean)));
        setAllLeadOwners(uniqueUserIds);
      } catch (error) {
        console.error('Error in fetchAllLeadOwners:', error);
      }
    };

    fetchAllLeadOwners();
  }, []);

  const handleDelete = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lead deleted successfully",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete lead",
        variant: "destructive",
      });
    }
  };

  const handleSelectLead = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads([...selectedLeads, leadId]);
    } else {
      setSelectedLeads(selectedLeads.filter(id => id !== leadId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(leads.map(lead => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const startEditing = (leadId: string, field: string, currentValue: any) => {
    setEditingCell({ leadId, field });
    setTempValue(currentValue?.toString() || "");
  };

  const saveEdit = async () => {
    if (!editingCell) return;

    try {
      const updateData: any = {
        [editingCell.field]: tempValue,
        modified_time: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', editingCell.leadId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lead updated successfully",
      });
      
      refetch();
      setEditingCell(null);
      setTempValue("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update lead",
        variant: "destructive",
      });
    }
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setTempValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const handleOwnerChange = async (leadId: string, newOwnerDisplayName: string) => {
    try {
      // Find the user ID that corresponds to this display name
      const ownerId = Object.entries(allOwnerDisplayNames).find(
        ([_, displayName]) => displayName === newOwnerDisplayName
      )?.[0];

      if (!ownerId) {
        toast({
          title: "Error",
          description: "Invalid owner selected",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('leads')
        .update({ 
          created_by: ownerId,
          modified_time: new Date().toISOString(),
        })
        .eq('id', leadId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lead owner updated successfully",
      });
      
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update lead owner",
        variant: "destructive",
      });
    }
  };

  const renderCell = (lead: Lead, field: string) => {
    const isEditing = editingCell?.leadId === lead.id && editingCell?.field === field;
    const value = lead[field as keyof Lead];

    if (field === 'created_by') {
      // Show dropdown for lead owner field
      const currentDisplayName = lead.created_by ? displayNames[lead.created_by] || 'Unknown User' : 'Unassigned';
      
      return (
        <Select
          value={currentDisplayName}
          onValueChange={(newValue) => handleOwnerChange(lead.id, newValue)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {allLeadOwners.map(ownerId => (
              <SelectItem key={ownerId} value={allOwnerDisplayNames[ownerId] || 'Unknown User'}>
                {allOwnerDisplayNames[ownerId] || 'Unknown User'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (isEditing) {
      return (
        <Input
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={saveEdit}
          onKeyDown={handleKeyPress}
          className="w-full"
          autoFocus
        />
      );
    }

    return (
      <div 
        className="cursor-pointer hover:bg-gray-50 p-1 rounded min-h-[2rem] flex items-center"
        onClick={() => startEditing(lead.id, field, value)}
      >
        {value?.toString() || '-'}
      </div>
    );
  };

  if (isLoading) {
    return <div className="p-4">Loading leads...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">
                  <Checkbox
                    checked={selectedLeads.length === leads.length && leads.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                {visibleColumns.lead_name && <th className="p-3 text-left font-medium">Lead Name</th>}
                {visibleColumns.company_name && <th className="p-3 text-left font-medium">Company</th>}
                {visibleColumns.position && <th className="p-3 text-left font-medium">Position</th>}
                {visibleColumns.email && <th className="p-3 text-left font-medium">Email</th>}
                {visibleColumns.phone_no && <th className="p-3 text-left font-medium">Phone</th>}
                {visibleColumns.country && <th className="p-3 text-left font-medium">Country</th>}
                {visibleColumns.lead_status && <th className="p-3 text-left font-medium">Status</th>}
                {visibleColumns.created_by && <th className="p-3 text-left font-medium">Lead Owner</th>}
                <th className="p-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">
                    <Checkbox
                      checked={selectedLeads.includes(lead.id)}
                      onCheckedChange={(checked) => handleSelectLead(lead.id, !!checked)}
                    />
                  </td>
                  {visibleColumns.lead_name && (
                    <td className="p-3">{renderCell(lead, 'lead_name')}</td>
                  )}
                  {visibleColumns.company_name && (
                    <td className="p-3">{renderCell(lead, 'company_name')}</td>
                  )}
                  {visibleColumns.position && (
                    <td className="p-3">{renderCell(lead, 'position')}</td>
                  )}
                  {visibleColumns.email && (
                    <td className="p-3">{renderCell(lead, 'email')}</td>
                  )}
                  {visibleColumns.phone_no && (
                    <td className="p-3">{renderCell(lead, 'phone_no')}</td>
                  )}
                  {visibleColumns.country && (
                    <td className="p-3">{renderCell(lead, 'country')}</td>
                  )}
                  {visibleColumns.lead_status && (
                    <td className="p-3">{renderCell(lead, 'lead_status')}</td>
                  )}
                  {visibleColumns.created_by && (
                    <td className="p-3">{renderCell(lead, 'created_by')}</td>
                  )}
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingLead(lead)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConvertingLead(lead)}
                      >
                        <TrendingUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(lead.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <LeadColumnCustomizer
        open={showColumnCustomizer}
        onOpenChange={setShowColumnCustomizer}
        visibleColumns={visibleColumns}
        onColumnVisibilityChange={(column, visible) => 
          setVisibleColumns(prev => ({ ...prev, [column]: visible }))
        }
      />

      <LeadModal
        open={showModal || !!editingLead}
        onOpenChange={(open) => {
          if (!open) {
            setShowModal(false);
            setEditingLead(null);
          }
        }}
        lead={editingLead}
        onSuccess={() => {
          refetch();
          setEditingLead(null);
          setShowModal(false);
        }}
      />

      <ConvertToDealModal
        open={!!convertingLead}
        onOpenChange={(open) => {
          if (!open) setConvertingLead(null);
        }}
        lead={convertingLead}
        onSuccess={() => {
          refetch();
          setConvertingLead(null);
        }}
      />
    </div>
  );
};
