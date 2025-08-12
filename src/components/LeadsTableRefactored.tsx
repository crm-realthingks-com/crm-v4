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
import { LeadColumn } from "@/types/columns";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  title: string;
  city: string;
  country: string;
  leadScore: number;
  status: 'open' | 'qualified' | 'closed';
}

const sampleLeads: Lead[] = [
  {
    id: "1",
    name: "Richard Hendricks",
    email: "richard@piedpiper.com",
    phone: "123-456-7890",
    company: "Pied Piper",
    title: "CEO",
    city: "Palo Alto",
    country: "USA",
    leadScore: 95,
    status: "qualified",
  },
  {
    id: "2",
    name: "Erlich Bachman",
    email: "erlich@aviato.com",
    phone: "987-654-3210",
    company: "Aviato",
    title: "Founder",
    city: "Palo Alto",
    country: "USA",
    leadScore: 60,
    status: "open",
  },
  {
    id: "3",
    name: "Monica Hall",
    email: "monica@raviga.com",
    phone: "555-123-4567",
    company: "Raviga Capital",
    title: "Partner",
    city: "Menlo Park",
    country: "USA",
    leadScore: 80,
    status: "qualified",
  },
  {
    id: "4",
    name: "Jared Dunn",
    email: "jared@piedpiper.com",
    phone: "111-222-3333",
    company: "Pied Piper",
    title: "Head of Business Development",
    city: "Palo Alto",
    country: "USA",
    leadScore: 75,
    status: "open",
  },
  {
    id: "5",
    name: "Dinesh Chugtai",
    email: "dinesh@piedpiper.com",
    phone: "444-555-6666",
    company: "Pied Piper",
    title: "Senior Programmer",
    city: "Mountain View",
    country: "USA",
    leadScore: 85,
    status: "qualified",
  },
];

interface LeadsTableProps {
  columns: LeadColumn[];
  leads?: Lead[];
}

const LeadsTableRefactored = ({ columns, leads = sampleLeads }: LeadsTableProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Filter leads based on search query
  const filteredLeads = leads.filter(lead =>
    Object.values(lead).some(value =>
      typeof value === 'string' && value.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Handle checkbox change for a single lead
  const handleCheckboxChange = (leadId: string) => {
    setSelectedLeads(prev => {
      if (prev.includes(leadId)) {
        return prev.filter(id => id !== leadId);
      } else {
        return [...prev, leadId];
      }
    });
  };

  // Handle select all checkbox change
  const handleSelectAllChange = () => {
    setSelectAll(prev => !prev);
    if (!selectAll) {
      setSelectedLeads(filteredLeads.map(lead => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleDeleteSelected = () => {
    console.log('Deleting selected leads:', selectedLeads);
    setSelectedLeads([]);
  };

  const handleExportSelected = () => {
    console.log('Exporting selected leads:', selectedLeads);
  };

  const handleClearSelection = () => {
    setSelectedLeads([]);
    setSelectAll(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leads</CardTitle>
      </CardHeader>
      <CardContent>
        {selectedLeads.length > 0 && (
          <BulkActionsBar 
            selectedCount={selectedLeads.length} 
            onDelete={handleDeleteSelected}
            onExport={handleExportSelected}
            onClearSelection={handleClearSelection}
          />
        )}
        <div className="grid gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search leads..."
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
                {filteredLeads.map(lead => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">
                      <Checkbox
                        checked={selectedLeads.includes(lead.id)}
                        onCheckedChange={() => handleCheckboxChange(lead.id)}
                      />
                    </TableCell>
                    {columns.filter(column => column.visible).map(column => (
                      <TableCell key={`${lead.id}-${column.key}`}>
                        {column.key === 'status' ? (
                          <Badge variant={lead.status === 'open' ? 'secondary' : lead.status === 'qualified' ? 'default' : 'outline'}>
                            {lead.status}
                          </Badge>
                        ) : (
                          lead[column.key as keyof Lead]?.toString() || ''
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
                {filteredLeads.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={columns.filter(column => column.visible).length + 2} className="text-center">
                      No leads found.
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

export default LeadsTableRefactored;
