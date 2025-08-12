import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Edit, Trash2, ArrowUpDown, MoreHorizontal, UserPlus } from "lucide-react";
import { useUserDisplayNames } from "@/hooks/useUserDisplayNames";
import { ContactColumnConfig } from "../ContactColumnCustomizer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Contact {
  id: string;
  contact_name: string;
  company_name?: string;
  position?: string;
  email?: string;
  phone_no?: string;
  country?: string;
  contact_owner?: string;
  lead_status?: string;
  created_by?: string;
  [key: string]: any;
}

interface ContactTableBodyProps {
  loading: boolean;
  pageContacts: Contact[];
  visibleColumns: ContactColumnConfig[];
  selectedContacts: string[];
  setSelectedContacts: React.Dispatch<React.SetStateAction<string[]>>;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
  searchTerm: string;
  onRefresh?: () => void;
}

export const ContactTableBody = ({
  loading,
  pageContacts,
  visibleColumns,
  selectedContacts,
  setSelectedContacts,
  onEdit,
  onDelete,
  searchTerm,
  onRefresh
}: ContactTableBodyProps) => {
  const { toast } = useToast();
  const createdByIds = [...new Set(pageContacts.map(c => c.created_by).filter(Boolean))];
  const { displayNames } = useUserDisplayNames(createdByIds);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pageContactIds = pageContacts.slice(0, 50).map(c => c.id);
      setSelectedContacts(pageContactIds);
    } else {
      setSelectedContacts([]);
    }
  };

  const handleSelectContact = (contactId: string, checked: boolean) => {
    if (checked) {
      setSelectedContacts(prev => [...prev, contactId]);
    } else {
      setSelectedContacts(prev => prev.filter(id => id !== contactId));
    }
  };

  const handleConvertToLead = async (contact: Contact) => {
    try {
      // Create a new lead with contact information
      const leadData = {
        lead_name: contact.contact_name,
        company_name: contact.company_name,
        position: contact.position,
        email: contact.email,
        phone_no: contact.phone_no,
        mobile_no: contact.mobile_no,
        linkedin: contact.linkedin,
        website: contact.website,
        contact_source: contact.contact_source,
        lead_status: contact.lead_status || 'New',
        industry: contact.industry,
        city: contact.city,
        country: contact.country,
        description: contact.description,
        contact_owner: contact.contact_owner,
        created_by: contact.created_by,
        created_time: new Date().toISOString(),
        modified_time: new Date().toISOString()
      };

      const { error } = await supabase
        .from('leads')
        .insert([leadData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Contact "${contact.contact_name}" has been converted to a lead successfully.`,
      });

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error converting contact to lead:', error);
      toast({
        title: "Error",
        description: "Failed to convert contact to lead. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Table>
        <TableBody>
          <TableRow>
            <TableCell colSpan={visibleColumns.length + 2} className="text-center py-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
                Loading contacts...
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  if (pageContacts.length === 0) {
    return (
      <Table>
        <TableBody>
          <TableRow>
            <TableCell colSpan={visibleColumns.length + 2} className="text-center py-8">
              <div className="flex flex-col items-center gap-2">
                <p className="text-muted-foreground">No contacts found</p>
                {searchTerm && (
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search terms
                  </p>
                )}
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox
              checked={selectedContacts.length > 0 && selectedContacts.length === Math.min(pageContacts.length, 50)}
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
        {pageContacts.map((contact) => (
          <TableRow key={contact.id}>
            <TableCell>
              <Checkbox
                checked={selectedContacts.includes(contact.id)}
                onCheckedChange={(checked) => handleSelectContact(contact.id, checked as boolean)}
              />
            </TableCell>
            {visibleColumns.map((column) => (
              <TableCell key={column.field}>
                {column.field === 'contact_name' ? (
                  <button
                    onClick={() => onEdit(contact)}
                    className="text-primary hover:underline font-medium"
                  >
                    {contact[column.field as keyof Contact]}
                  </button>
                ) : column.field === 'contact_owner' ? (
                  // Always show the display name or fallback without any loading state
                  contact.created_by ? (
                    displayNames[contact.created_by] || "Unknown"
                  ) : (
                    '-'
                  )
                ) : column.field === 'lead_status' && contact.lead_status ? (
                  <Badge variant={contact.lead_status === 'Converted' ? 'default' : 'secondary'}>
                    {contact.lead_status}
                  </Badge>
                ) : (
                  contact[column.field as keyof Contact] || '-'
                )}
              </TableCell>
            ))}
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(contact)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleConvertToLead(contact)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Convert to Lead
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDelete(contact.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
