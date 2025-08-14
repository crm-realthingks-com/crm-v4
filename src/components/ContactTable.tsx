
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ContactModal } from "./ContactModal";
import { ContactColumnCustomizer, ContactColumnConfig } from "./ContactColumnCustomizer";
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
import { Edit, Trash2, ExternalLink, Users } from "lucide-react";

interface Contact {
  id: string;
  contact_name: string;
  company_name?: string;
  position?: string;
  email?: string;
  phone_no?: string;
  linkedin?: string;
  website?: string;
  contact_source?: string;
  industry?: string;
  region?: string;
  contact_owner?: string;
  description?: string;
  created_time?: string;
  modified_time?: string;
}

interface ContactTableProps {
  showColumnCustomizer: boolean;
  setShowColumnCustomizer: (show: boolean) => void;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  selectedContacts: string[];
  setSelectedContacts: (contacts: string[]) => void;
  refreshTrigger?: number;
}

export const ContactTable = ({ 
  showColumnCustomizer, 
  setShowColumnCustomizer, 
  showModal, 
  setShowModal,
  selectedContacts,
  setSelectedContacts,
  refreshTrigger
}: ContactTableProps) => {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const { users } = useAllUsers();
  
  const [columns, setColumns] = useState<ContactColumnConfig[]>([
    { field: 'contact_name', label: 'Contact Name', visible: true, order: 0 },
    { field: 'company_name', label: 'Company Name', visible: true, order: 1 },
    { field: 'position', label: 'Position', visible: true, order: 2 },
    { field: 'email', label: 'Email', visible: true, order: 3 },
    { field: 'phone_no', label: 'Phone', visible: true, order: 4 },
    { field: 'region', label: 'Region', visible: true, order: 5 },
    { field: 'contact_owner', label: 'Contact Owner', visible: true, order: 6 },
  ]);

  // Get unique contact owner IDs for display name lookup
  const contactOwnerIds = Array.from(new Set(
    contacts.map(contact => contact.contact_owner).filter(Boolean)
  )) as string[];
  
  const { displayNames } = useUserDisplayNames(contactOwnerIds);

  useEffect(() => {
    fetchContacts();
  }, [refreshTrigger]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_time', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch contacts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Contact deleted successfully",
      });
      
      fetchContacts();
      setSelectedContacts(selectedContacts.filter(contactId => contactId !== id));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete contact",
        variant: "destructive",
      });
    }
  };

  const handleContactOwnerChange = async (contactId: string, newOwnerId: string) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ contact_owner: newOwnerId })
        .eq('id', contactId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Contact owner updated successfully",
      });
      
      fetchContacts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update contact owner",
        variant: "destructive",
      });
    }
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === contacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(contacts.map(contact => contact.id));
    }
  };

  const handleSelectContact = (contactId: string) => {
    if (selectedContacts.includes(contactId)) {
      setSelectedContacts(selectedContacts.filter(id => id !== contactId));
    } else {
      setSelectedContacts([...selectedContacts, contactId]);
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
    setEditingContact(null);
  };

  const getVisibleColumns = () => {
    return columns.filter(col => col.visible).sort((a, b) => a.order - b.order);
  };

  if (loading) {
    return <div className="p-4">Loading contacts...</div>;
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
                  checked={selectedContacts.length === contacts.length && contacts.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              {visibleColumns.map((column) => (
                <TableHead key={column.field}>{column.label}</TableHead>
              ))}
              <TableHead className="w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedContacts.includes(contact.id)}
                    onCheckedChange={() => handleSelectContact(contact.id)}
                  />
                </TableCell>
                {visibleColumns.map((column) => (
                  <TableCell key={column.field}>
                    {column.field === 'contact_name' && (
                      <span className="font-medium">{contact.contact_name}</span>
                    )}
                    {column.field === 'company_name' && (contact.company_name || '-')}
                    {column.field === 'position' && (contact.position || '-')}
                    {column.field === 'email' && (contact.email || '-')}
                    {column.field === 'phone_no' && (contact.phone_no || '-')}
                    {column.field === 'region' && (contact.region || '-')}
                    {column.field === 'contact_owner' && (
                      <Select
                        value={contact.contact_owner || ""}
                        onValueChange={(value) => handleContactOwnerChange(contact.id, value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Select owner">
                            {contact.contact_owner ? (
                              displayNames[contact.contact_owner] || 'Unknown User'
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
                  </TableCell>
                ))}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(contact)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(contact.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    {contact.linkedin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openLinkedIn(contact.linkedin!)}
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                    )}
                    {contact.website && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openWebsite(contact.website!)}
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
        <ContactColumnCustomizer
          open={showColumnCustomizer}
          onOpenChange={setShowColumnCustomizer}
          columns={columns}
          onColumnsChange={setColumns}
        />
      )}

      <ContactModal
        open={showModal}
        onOpenChange={handleModalClose}
        contact={editingContact}
        onSuccess={fetchContacts}
      />
    </>
  );
};
