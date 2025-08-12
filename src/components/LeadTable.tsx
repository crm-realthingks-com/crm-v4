
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserDisplayNames } from "@/hooks/useUserDisplayNames";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Edit, 
  Trash2, 
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { LeadModal } from "./LeadModal";
import { LeadColumnCustomizer, LeadColumnConfig } from "./LeadColumnCustomizer";

interface Lead {
  id: string;
  lead_name: string;
  company_name?: string;
  position?: string;
  email?: string;
  phone_no?: string;
  mobile_no?: string;
  country?: string;
  city?: string;
  contact_owner?: string;
  created_time?: string;
  modified_time?: string;
  lead_status?: string;
  industry?: string;
  contact_source?: string;
  linkedin?: string;
  website?: string;
  description?: string;
  created_by?: string;
  modified_by?: string;
}

const defaultColumns: LeadColumnConfig[] = [
  { field: 'lead_name', label: 'Lead Name', visible: true, order: 0 },
  { field: 'company_name', label: 'Company Name', visible: true, order: 1 },
  { field: 'position', label: 'Position', visible: true, order: 2 },
  { field: 'email', label: 'Email', visible: true, order: 3 },
  { field: 'phone_no', label: 'Phone', visible: true, order: 4 },
  { field: 'country', label: 'Region', visible: true, order: 5 },
  { field: 'contact_owner', label: 'Lead Owner', visible: true, order: 6 },
];

interface LeadTableProps {
  showColumnCustomizer: boolean;
  setShowColumnCustomizer: (show: boolean) => void;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  selectedLeads: string[];
  setSelectedLeads: React.Dispatch<React.SetStateAction<string[]>>;
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
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);
  const [columns, setColumns] = useState(defaultColumns);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    const filtered = leads.filter(lead =>
      lead.lead_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredLeads(filtered);
    setCurrentPage(1);
  }, [leads, searchTerm]);

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
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete lead",
        variant: "destructive",
      });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pageLeads = getCurrentPageLeads().slice(0, 50);
      setSelectedLeads(pageLeads.map(l => l.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleSelectLead = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads(prev => [...prev, leadId]);
    } else {
      setSelectedLeads(prev => prev.filter(id => id !== leadId));
    }
  };

  const getCurrentPageLeads = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLeads.slice(startIndex, startIndex + itemsPerPage);
  };

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);

  // Memoize user IDs to prevent unnecessary re-fetches
  const createdByIds = useMemo(() => {
    return [...new Set(leads.map(l => l.created_by).filter(Boolean))];
  }, [leads]);

  // Use the optimized hook
  const { displayNames } = useUserDisplayNames(createdByIds);

  const visibleColumns = columns.filter(col => col.visible);
  const pageLeads = getCurrentPageLeads();

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-80"
            />
          </div>
          <Checkbox
            checked={selectedLeads.length > 0 && selectedLeads.length === Math.min(pageLeads.length, 50)}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm text-muted-foreground">Select all</span>
        </div>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedLeads.length > 0 && selectedLeads.length === Math.min(pageLeads.length, 50)}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              {visibleColumns.map((column) => (
                <TableHead key={column.field}>
                  <div className="flex items-center gap-2">
                    {column.label}
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </TableHead>
              ))}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length + 2} className="text-center py-8">
                  Loading leads...
                </TableCell>
              </TableRow>
            ) : pageLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length + 2} className="text-center py-8">
                  No leads found
                </TableCell>
              </TableRow>
            ) : (
              pageLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedLeads.includes(lead.id)}
                      onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                    />
                  </TableCell>
                  {visibleColumns.map((column) => (
                    <TableCell key={column.field}>
                      {column.field === 'lead_name' ? (
                        <button
                          onClick={() => {
                            setEditingLead(lead);
                            setShowModal(true);
                          }}
                          className="text-primary hover:underline font-medium"
                        >
                          {lead[column.field as keyof Lead]}
                        </button>
                      ) : column.field === 'contact_owner' ? (
                        <span>
                          {lead.created_by 
                            ? displayNames[lead.created_by] || "Loading..."
                            : '-'
                          }
                        </span>
                      ) : column.field === 'lead_status' && lead.lead_status ? (
                        <Badge variant={lead.lead_status === 'Qualified' ? 'default' : 'secondary'}>
                          {lead.lead_status}
                        </Badge>
                      ) : (
                        lead[column.field as keyof Lead] || '-'
                      )}
                    </TableCell>
                  ))}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingLead(lead);
                          setShowModal(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setLeadToDelete(lead.id);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredLeads.length)} of {filteredLeads.length} leads
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <LeadModal
        open={showModal}
        onOpenChange={setShowModal}
        lead={editingLead}
        onSuccess={() => {
          fetchLeads();
          setEditingLead(null);
        }}
      />

      <LeadColumnCustomizer
        open={showColumnCustomizer}
        onOpenChange={setShowColumnCustomizer}
        columns={columns}
        onColumnsChange={setColumns}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the lead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (leadToDelete) {
                  handleDelete(leadToDelete);
                  setLeadToDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
