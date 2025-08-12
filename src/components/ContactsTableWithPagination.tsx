
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
    lastContacted: "2023-04-01",
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
    lastContacted: "2023-05-05",
    status: "inactive",
  },
  {
    id: "6",
    name: "David Garcia",
    email: "david.garcia@example.com",
    phone: "777-888-9999",
    company: "Zeta Corp",
    title: "Software Engineer",
    location: "Berlin",
    lastContacted: "2023-06-10",
    status: "pending",
  },
  {
    id: "7",
    name: "Linda Rodriguez",
    email: "linda.rodriguez@example.com",
    phone: "333-444-5555",
    company: "Eta Inc",
    title: "Data Analyst",
    location: "Madrid",
    lastContacted: "2023-07-15",
    status: "active",
  },
  {
    id: "8",
    name: "Michael Wilson",
    email: "michael.wilson@example.com",
    phone: "666-777-8888",
    company: "Theta Ltd",
    title: "HR Manager",
    location: "Rome",
    lastContacted: "2023-08-20",
    status: "inactive",
  },
  {
    id: "9",
    name: "Susan Martinez",
    email: "susan.martinez@example.com",
    phone: "888-999-0000",
    company: "Iota Co",
    title: "Financial Analyst",
    location: "Tokyo",
    lastContacted: "2023-09-01",
    status: "pending",
  },
  {
    id: "10",
    name: "Kevin Anderson",
    email: "kevin.anderson@example.com",
    phone: "222-333-4444",
    company: "Kappa Group",
    title: "Operations Manager",
    location: "Seoul",
    lastContacted: "2023-10-05",
    status: "active",
  }
];

interface ContactsTableProps {
  contacts: Contact[];
  columns: ContactColumn[];
}

const ContactsTable = ({ contacts, columns }: ContactsTableProps) => {
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
      // Select all contacts
      setSelectedContacts(filteredContacts.map(contact => contact.id));
    } else {
      // Deselect all contacts
      setSelectedContacts([]);
    }
  };

  const handleDeleteSelected = () => {
    console.log('Deleting selected contacts:', selectedContacts);
    setSelectedContacts([]);
    setSelectAll(false);
  };

  const handleExportSelected = () => {
    console.log('Exporting selected contacts:', selectedContacts);
  };

  const handleClearSelection = () => {
    setSelectedContacts([]);
    setSelectAll(false);
  };

  // Determine if a contact is selected
  const isContactSelected = (contactId: string) => selectedContacts.includes(contactId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contacts</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Bulk Actions Bar */}
        {selectedContacts.length > 0 && (
          <BulkActionsBar 
            selectedCount={selectedContacts.length}
            onDelete={handleDeleteSelected}
            onExport={handleExportSelected}
            onClearSelection={handleClearSelection}
          />
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={handleSelectAllChange}
                    aria-label="Select all"
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
                  <TableCell className="w-[50px]">
                    <Checkbox
                      checked={isContactSelected(contact.id)}
                      onCheckedChange={() => handleCheckboxChange(contact.id)}
                      aria-label={`Select ${contact.name}`}
                    />
                  </TableCell>
                  {columns.filter(column => column.visible).map(column => (
                    <TableCell key={column.key}>
                      {column.key === 'status' ? (
                        <Badge variant="secondary">{contact.status}</Badge>
                      ) : (
                        contact[column.key as keyof Contact]
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
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

interface ContactsTableWithPaginationProps {
  contacts: Contact[];
  columns: ContactColumn[];
  itemsPerPage?: number;
}

const ContactsTableWithPagination: React.FC<ContactsTableWithPaginationProps> = ({ contacts, columns, itemsPerPage = 5 }) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = contacts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Get current items
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentContacts = contacts.slice(startIndex, endIndex);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div>
      <ContactsTable contacts={currentContacts} columns={columns} />

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <Button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} variant="outline">
            Previous
          </Button>
          <Button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} variant="outline">
            Next
          </Button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of <span className="font-medium">{totalItems}</span> results
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <Button
                onClick={() => paginate(currentPage - 1)}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-500 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                disabled={currentPage === 1}
                variant="outline"
              >
                <span className="sr-only">Previous</span>
                <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
              </Button>
              {/* Current: "z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600", Default: "text-gray-900 hover:bg-gray-50 focus:outline-offset-0" */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  onClick={() => paginate(page)}
                  aria-current="page"
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${currentPage === page ? 'z-10 bg-primary text-white' : 'text-gray-500'}`}
                  variant="outline"
                >
                  {page}
                </Button>
              ))}
              <Button
                onClick={() => paginate(currentPage + 1)}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-500 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                disabled={currentPage === totalPages}
                variant="outline"
              >
                <span className="sr-only">Next</span>
                <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
              </Button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

function ChevronLeftIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M12.79 5.21a.75.75 0 01-.094 1.06l-3.215 3.219H15.75a.75.75 0 010 1.5H9.486l3.215 3.219a.75.75 0 11-1.061 1.06L7.21 10.253a.75.75 0 010-1.06l4.514-4.509a.75.75 0 011.06 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ChevronRightIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M7.21 14.79a.75.75 0 01.094-1.06l3.215-3.219H4.25a.75.75 0 010-1.5h6.279l-3.215-3.219a.75.75 0 011.06-1.06l4.514 4.509a.75.75 0 010 1.06l-4.514 4.509a.75.75 0 01-1.06 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default ContactsTableWithPagination;
