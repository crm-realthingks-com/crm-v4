
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LeadModal } from "./LeadModal";
import { ConvertToDealModal } from "./ConvertToDealModal";
import { LeadColumnCustomizer, LeadColumnConfig } from "./LeadColumnCustomizer";
import { useUserDisplayNames } from "@/hooks/useUserDisplayNames";
import { useAllUsers } from "@/hooks/useAllUsers";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Trash2, ExternalLink, Users, RefreshCw } from "lucide-react";

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
  contact_owner?: string;
  description?: string;
  lead_status?: string;
  created_time?: string;
  modified_time?: string;
  created_by?: string;
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
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const { users } = useAllUsers();
  
  const [columns, setColumns] = useState<LeadColumnConfig[]>([
    { field: 'lead_name', label: 'Lead Name', visible: true, order: 0 },
    { field: 'company_name', label: 'Company Name', visible: true, order: 1 },
    { field: 'position', label: 'Position', visible: true, order: 2 },
    { field: 'email', label: 'Email', visible: true, order: 3 },
    { field: 'phone_no', label: 'Phone', visible: true, order: 4 },
    { field: 'country', label: 'Region', visible: true, order: 5 },
    { field: 'created_by', label: 'Lead Owner', visible: true, order: 6 },
    { field: 'lead_status', label: 'Lead Status', visible: true, order: 7 },
  ]);

  // Get unique lead owner IDs for display name lookup
  const leadOwnerIds = Array.from(new Set(
    leads.map(lead => lead.contact_owner || lead.created_by).filter(Boolean)
  )) as string[];
  
  const { displayNames } = useUserDisplayNames(leadOwnerIds);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_time', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch leads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lead deleted successfully",
      });
      
      fetchLeads();
      setSelectedLeads(selectedLeads.filter(leadId => leadId !== id));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete lead",
        variant: "destructive",
      });
    }
  };

  const handleLeadOwnerChange = async (leadId: string, newOwnerId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ contact_owner: newOwnerId })
        .eq('id', leadId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lead owner updated successfully",
      });
      
      fetchLeads();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update lead owner",
        variant: "destructive",
      });
    }
  };

  const handleConvert = (lead: Lead) => {
    setConvertingLead(lead);
    setShowConvertModal(true);
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(leads.map(lead => lead.id));
    }
  };

  const handleSelectLead = (leadId: string) => {
    if (selectedLeads.includes(leadId)) {
      setSelectedLeads(selectedLeads.filter(id => id !== leadId));
    } else {
      setSelectedLeads([...selectedLeads, leadId]);
    }
  };

  const openLinkedIn = (url: string) => {
    window.open(url, '_blank');
  };

  const openWebsite = (url: string) => {
    window.open(url, '_blank');
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingLead(null);
  };

  const handleConvertModalClose = () => {
    setShowConvertModal(false);
    setConvertingLead(null);
  };

  const getVisibleColumns = () => {
    return columns.filter(col => col.visible).sort((a, b) => a.order - b.order);
  };

  if (loading) {
    return <div className="p-4">Loading leads...</div>;
  }

  const visibleColumns = getVisibleColumns();

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedLeads.length === leads.length && leads.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              {visibleColumns.map((column) => (
                <TableHead key={column.field}>{column.label}</TableHead>
              ))}
              <TableHead className="w-40">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedLeads.includes(lead.id)}
                    onCheckedChange={() => handleSelectLead(lead.id)}
                  />
                </TableCell>
                {visibleColumns.map((column) => (
                  <TableCell key={column.field}>
                    {column.field === 'lead_name' && (
                      <span className="font-medium">{lead.lead_name}</span>
                    )}
                    {column.field === 'company_name' && (lead.company_name || '-')}
                    {column.field === 'position' && (lead.position || '-')}
                    {column.field === 'email' && (lead.email || '-')}
                    {column.field === 'phone_no' && (lead.phone_no || '-')}
                    {column.field === 'country' && (lead.country || '-')}
                    {column.field === 'created_by' && (
                      <Select
                        value={lead.contact_owner || lead.created_by || ""}
                        onValueChange={(value) => handleLeadOwnerChange(lead.id, value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Select owner">
                            {lead.contact_owner ? (
                              displayNames[lead.contact_owner] || 'Loading...'
                            ) : lead.created_by ? (
                              displayNames[lead.created_by] || 'Loading...'
                            ) : 'No owner'}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {column.field === 'lead_status' && (
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        lead.lead_status === 'New' ? 'bg-blue-100 text-blue-800' :
                        lead.lead_status === 'Contacted' ? 'bg-yellow-100 text-yellow-800' :
                        lead.lead_status === 'Converted' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {lead.lead_status || 'New'}
                      </span>
                    )}
                  </TableCell>
                ))}
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(lead)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(lead.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleConvert(lead)}
                      title="Convert to Deal"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    {lead.linkedin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openLinkedIn(lead.linkedin!)}
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                    )}
                    {lead.website && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openWebsite(lead.website!)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {showColumnCustomizer && (
        <LeadColumnCustomizer
          open={showColumnCustomizer}
          onOpenChange={setShowColumnCustomizer}
          columns={columns}
          onColumnsChange={setColumns}
        />
      )}

      <LeadModal
        open={showModal}
        onOpenChange={handleModalClose}
        lead={editingLead}
        onSuccess={fetchLeads}
      />

      <ConvertToDealModal
        open={showConvertModal}
        onOpenChange={handleConvertModalClose}
        lead={convertingLead}
        onSuccess={fetchLeads}
      />
    </>
  );
};
