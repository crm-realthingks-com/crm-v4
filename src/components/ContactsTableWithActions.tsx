
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Search, Edit, Trash2, Phone, Mail, Calendar, MapPin, Building, User } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { BulkActionsBar } from "@/components/BulkActionsBar";
import { ContactColumn } from "@/types/columns";

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  title: string;
  location: string;
  lastContacted: string;
  status: 'active' | 'inactive' | 'pending';
}

const sampleContacts: Contact[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "123-456-7890",
    company: "Acme Corp",
    title: "CEO",
    location: "New York",
    lastContacted: "2023-01-01",
    status: "active",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    phone: "987-654-3210",
    company: "Beta Inc",
    title: "CTO",
    location: "San Francisco",
    lastContacted: "2023-02-15",
    status: "inactive",
  },
  {
    id: "3",
    name: "Alice Johnson",
    email: "alice.johnson@example.com",
    phone: "555-123-4567",
    company: "Gamma Ltd",
    title: "Marketing Manager",
    location: "London",
    lastContacted: "2023-03-20",
    status: "pending",
  },
  {
    id: "4",
    name: "Bob Williams",
    email: "bob.williams@example.com",
    phone: "111-222-3333",
    company: "Delta Co",
    title: "Sales Director",
    location: "Sydney",
    lastContacted: "2023-04-10",
    status: "active",
  },
  {
    id: "5",
    name: "Emily Brown",
    email: "emily.brown@example.com",
    phone: "444-555-6666",
    company: "Epsilon Group",
    title: "Project Manager",
    location: "Toronto",
    lastContacted: "2023-05-01",
    status: "inactive",
  },
];

interface ContactsTableProps {
  columns: ContactColumn[];
}

const ContactsTable = ({ columns }: ContactsTableProps) => {
  const [contacts, setContacts] = useState(sampleContacts);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  // Filter contacts based on search query
  const filteredContacts = contacts.filter(contact =>
    Object.values(contact).some(value =>
      typeof value === 'string' && value.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts(prev => {
      if (prev.includes(contactId)) {
        return prev.filter(id => id !== contactId);
      } else {
        return [...prev, contactId];
      }
    });
  };

  const isAllSelected = filteredContacts.length > 0 && selectedContacts.length === filteredContacts.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map(contact => contact.id));
    }
  };

  const handleEditContact = (contactId: string) => {
    console.log(`Editing contact with ID: ${contactId}`);
    // Implement edit logic here
  };

  const handleDeleteContact = (contactId: string) => {
    console.log(`Deleting contact with ID: ${contactId}`);
    // Implement delete logic here
  };

  const handleDeleteSelected = () => {
    selectedContacts.forEach(id => handleDeleteContact(id));
    setSelectedContacts([]);
  };

  const handleExportSelected = () => {
    console.log('Exporting selected contacts:', selectedContacts);
  };

  const handleClearSelection = () => {
    setSelectedContacts([]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contacts</CardTitle>
      </CardHeader>
      <CardContent>
        {selectedContacts.length > 0 && (
          <BulkActionsBar 
            selectedCount={selectedContacts.length}
            onDelete={handleDeleteSelected}
            onExport={handleExportSelected}
            onClearSelection={handleClearSelection}
          />
        )}
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                {columns.filter(column => column.visible).map(column => (
                  <TableHead key={column.key}>{column.label}</TableHead>
                ))}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map(contact => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">
                    <Checkbox
                      checked={selectedContacts.includes(contact.id)}
                      onCheckedChange={() => toggleContactSelection(contact.id)}
                    />
                  </TableCell>
                  {columns.filter(column => column.visible).map(column => (
                    <TableCell key={`${contact.id}-${column.key}`}>
                      {column.key === 'name' && contact.name}
                      {column.key === 'email' && contact.email}
                      {column.key === 'phone' && contact.phone}
                      {column.key === 'company' && contact.company}
                      {column.key === 'title' && contact.title}
                      {column.key === 'location' && contact.location}
                      {column.key === 'lastContacted' && contact.lastContacted}
                      {column.key === 'status' && (
                        <Badge variant={contact.status === 'active' ? 'default' : contact.status === 'inactive' ? 'secondary' : 'outline'}>
                          {contact.status}
                        </Badge>
                      )}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEditContact(contact.id)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteContact(contact.id)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredContacts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} className="text-center">
                    No contacts found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContactsTable;
