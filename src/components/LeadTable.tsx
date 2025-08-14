
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LeadModal } from "./LeadModal";
import { ConvertToDealModal } from "./ConvertToDealModal";
import { LeadColumnCustomizer } from "./LeadColumnCustomizer";
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
import { Checkbox } from "@/components/ui/checkbox";
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

interface LeadColumnConfig {
  lead_name: boolean;
  company_name: boolean;
  position: boolean;
  email: boolean;
  phone_no: boolean;
  country: boolean;
  lead_status: boolean;
  created_by: boolean;
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
  
  const [columns, setColumns] = useState<LeadColumnConfig>({
    lead_name: true,
    company_name: true,
    position: true,
    email: true,
    phone_no: true,
    country: true,
    lead_status: true,
    created_by: true,
  });

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

  if (loading) {
    return <div className="p-4">Loading leads...</div>;
  }

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
              {columns.lead_name && <TableHead>Lead Name</TableHead>}
              {columns.company_name && <TableHead>Company Name</TableHead>}
              {columns.position && <TableHead>Position</TableHead>}
              {columns.email && <TableHead>Email</TableHead>}
              {columns.phone_no && <TableHead>Phone</TableHead>}
              {columns.country && <TableHead>Region</TableHead>}
              {columns.created_by && <TableHead>Lead Owner</TableHead>}
              {columns.lead_status && <TableHead>Lead Status</TableHead>}
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
                {columns.lead_name && (
                  <TableCell className="font-medium">{lead.lead_name}</TableCell>
                )}
                {columns.company_name && (
                  <TableCell>{lead.company_name || '-'}</TableCell>
                )}
                {columns.position && (
                  <TableCell>{lead.position || '-'}</TableCell>
                )}
                {columns.email && (
                  <TableCell>{lead.email || '-'}</TableCell>
                )}
                {columns.phone_no && (
                  <TableCell>{lead.phone_no || '-'}</TableCell>
                )}
                {columns.country && (
                  <TableCell>{lead.country || '-'}</TableCell>
                )}
                {columns.created_by && (
                  <TableCell>
                    {lead.contact_owner ? (
                      displayNames[lead.contact_owner] || 'Unknown User'
                    ) : lead.created_by ? (
                      displayNames[lead.created_by] || 'Unknown User'
                    ) : '-'}
                  </TableCell>
                )}
                {columns.lead_status && (
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      lead.lead_status === 'New' ? 'bg-blue-100 text-blue-800' :
                      lead.lead_status === 'Contacted' ? 'bg-yellow-100 text-yellow-800' :
                      lead.lead_status === 'Converted' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {lead.lead_status || 'New'}
                    </span>
                  </TableCell>
                )}
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
