
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
  city: string;
  country: string;
  lastActivity: string;
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
    city: "New York",
    country: "USA",
    lastActivity: "2023-01-01",
    status: "active",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    phone: "987-654-3210",
    company: "Beta Inc",
    title: "CTO",
    city: "San Francisco",
    country: "USA",
    lastActivity: "2023-02-15",
    status: "inactive",
  },
  {
    id: "3",
    name: "Alice Johnson",
    email: "alice.johnson@example.com",
    phone: "555-123-4567",
    company: "Gamma Ltd",
    title: "Marketing Manager",
    city: "London",
    country: "UK",
    lastActivity: "2023-03-20",
    status: "pending",
  },
  {
    id: "4",
    name: "Bob Williams",
    email: "bob.williams@example.com",
    phone: "111-222-3333",
    company: "Delta Co",
    title: "Sales Director",
    city: "Sydney",
    country: "Australia",
    lastActivity: "2023-04-01",
    status: "active",
  },
  {
    id: "5",
    name: "Eve Brown",
    email: "eve.brown@example.com",
    phone: "444-555-6666",
    company: "Epsilon LLC",
    title: "Project Manager",
    city: "Toronto",
    country: "Canada",
    lastActivity: "2023-05-05",
    status: "inactive",
  },
];

interface ContactsTableProps {
  columns: ContactColumn[];
  contacts?: Contact[];
}

const ContactsTableRefactored = ({ columns, contacts = sampleContacts }: ContactsTableProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Filter contacts based on search query
  const filteredContacts = contacts.filter(contact =>
    Object.values(contact).some(value =>
      typeof value === 'string' && value.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Handle checkbox change for a single contact
  const handleCheckboxChange = (contactId: string) => {
    setSelectedContacts(prev => {
      if (prev.includes(contactId)) {
        return prev.filter(id => id !== contactId);
      } else {
        return [...prev, contactId];
      }
    });
  };

  // Handle select all checkbox change
  const handleSelectAllChange = () => {
    setSelectAll(prev => !prev);
    if (!selectAll) {
      setSelectedContacts(filteredContacts.map(contact => contact.id));
    } else {
      setSelectedContacts([]);
    }
  };

  const handleDeleteSelected = () => {
    console.log('Deleting selected contacts:', selectedContacts);
    setSelectedContacts([]);
  };

  const handleExportSelected = () => {
    console.log('Exporting selected contacts:', selectedContacts);
  };

  const handleClearSelection = () => {
    setSelectedContacts([]);
    setSelectAll(false);
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
        <div className="grid gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={handleSelectAllChange}
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
                        onCheckedChange={() => handleCheckboxChange(contact.id)}
                      />
                    </TableCell>
                    {columns.filter(column => column.visible).map(column => (
                      <TableCell key={`${contact.id}-${column.key}`}>
                        {column.key === 'status' ? (
                          <Badge variant={contact.status === 'active' ? 'default' : contact.status === 'inactive' ? 'secondary' : 'outline'}>
                            {contact.status}
                          </Badge>
                        ) : (
                          contact[column.key as keyof Contact]?.toString() || ''
                        )}
                      </TableCell>
                    ))}
                    <TableCell className="text-right font-medium">
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredContacts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={columns.filter(column => column.visible).length + 2} className="text-center">
                      No contacts found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContactsTableRefactored;
