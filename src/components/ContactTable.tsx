
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ContactModal } from "./ContactModal";
import { ContactColumnCustomizer } from "./ContactColumnCustomizer";
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

interface ContactColumnConfig {
  contact_name: boolean;
  company_name: boolean;
  position: boolean;
  email: boolean;
  phone_no: boolean;
  region: boolean;
  contact_owner: boolean;
}

interface ContactTableProps {
  showColumnCustomizer: boolean;
  setShowColumnCustomizer: (show: boolean) => void;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  selectedContacts: string[];
  setSelectedContacts: (contacts: string[]) => void;
}

export const ContactTable = ({ 
  showColumnCustomizer, 
  setShowColumnCustomizer, 
  showModal, 
  setShowModal,
  selectedContacts,
  setSelectedContacts
}: ContactTableProps) => {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  
  const [columns, setColumns] = useState<ContactColumnConfig>({
    contact_name: true,
    company_name: true,
    position: true,
    email: true,
    phone_no: true,
    region: true,
    contact_owner: true,
  });

  // Get unique contact owner IDs for display name lookup
  const contactOwnerIds = Array.from(new Set(
    contacts.map(contact => contact.contact_owner).filter(Boolean)
  )) as string[];
  
  const { displayNames } = useUserDisplayNames(contactOwnerIds);

  useEffect(() => {
    fetchContacts();
  }, []);

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

  if (loading) {
    return <div className="p-4">Loading contacts...</div>;
  }

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
              {columns.contact_name && <TableHead>Contact Name</TableHead>}
              {columns.company_name && <TableHead>Company Name</TableHead>}
              {columns.position && <TableHead>Position</TableHead>}
              {columns.email && <TableHead>Email</TableHead>}
              {columns.phone_no && <TableHead>Phone</TableHead>}
              {columns.region && <TableHead>Region</TableHead>}
              {columns.contact_owner && <TableHead>Contact Owner</TableHead>}
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
                {columns.contact_name && (
                  <TableCell className="font-medium">{contact.contact_name}</TableCell>
                )}
                {columns.company_name && (
                  <TableCell>{contact.company_name || '-'}</TableCell>
                )}
                {columns.position && (
                  <TableCell>{contact.position || '-'}</TableCell>
                )}
                {columns.email && (
                  <TableCell>{contact.email || '-'}</TableCell>
                )}
                {columns.phone_no && (
                  <TableCell>{contact.phone_no || '-'}</TableCell>
                )}
                {columns.region && (
                  <TableCell>{contact.region || '-'}</TableCell>
                )}
                {columns.contact_owner && (
                  <TableCell>
                    {contact.contact_owner ? (
                      displayNames[contact.contact_owner] || 'Unknown User'
                    ) : '-'}
                  </TableCell>
                )}
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
