
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
  company: string;
  stage: string;
  contact: string;
  value: number;
  expectedCloseDate: string;
}

const sampleLeads: Lead[] = [
  {
    id: "1",
    name: "Acme Corp - New ERP System",
    company: "Acme Corp",
    stage: "Qualified",
    contact: "John Doe",
    value: 50000,
    expectedCloseDate: "2024-03-15",
  },
  {
    id: "2",
    name: "Beta Inc - Marketing Automation",
    company: "Beta Inc",
    stage: "Contacted",
    contact: "Jane Smith",
    value: 25000,
    expectedCloseDate: "2024-04-01",
  },
  {
    id: "3",
    name: "Gamma Ltd - CRM Implementation",
    company: "Gamma Ltd",
    stage: "Proposal Sent",
    contact: "Alice Johnson",
    value: 75000,
    expectedCloseDate: "2024-03-22",
  },
  {
    id: "4",
    name: "Delta Co - Cloud Migration",
    company: "Delta Co",
    stage: "Negotiation",
    contact: "Bob Williams",
    value: 120000,
    expectedCloseDate: "2024-04-15",
  },
];

interface LeadsTableProps {
  columns: LeadColumn[];
  onColumnsChange: (columns: LeadColumn[]) => void;
}

const LeadsTable = ({ columns, onColumnsChange }: LeadsTableProps) => {
  const [leads, setLeads] = useState(sampleLeads);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

  const filteredLeads = leads.filter(lead =>
    Object.values(lead).some(value =>
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeads(prev => {
      if (prev.includes(leadId)) {
        return prev.filter(id => id !== leadId);
      } else {
        return [...prev, leadId];
      }
    });
  };

  const toggleSelectAllLeads = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(lead => lead.id));
    }
  };

  const isAllSelected = selectedLeads.length === filteredLeads.length && filteredLeads.length > 0;

  const handleDeleteSelected = () => {
    setLeads(prev => prev.filter(lead => !selectedLeads.includes(lead.id)));
    setSelectedLeads([]);
  };

  const handleClearSelection = () => {
    setSelectedLeads([]);
  };

  const handleExportSelected = () => {
    const selectedData = leads.filter(lead => selectedLeads.includes(lead.id));
    console.log('Exporting selected leads:', selectedData);
    // Export logic would go here
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leads</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {selectedLeads.length > 0 && (
          <BulkActionsBar
            selectedCount={selectedLeads.length}
            onDelete={handleDeleteSelected}
            onExport={handleExportSelected}
            onClearSelection={handleClearSelection}
          />
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={toggleSelectAllLeads}
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
              {filteredLeads.map(lead => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">
                    <Checkbox
                      checked={selectedLeads.includes(lead.id)}
                      onCheckedChange={() => toggleLeadSelection(lead.id)}
                      aria-label={`Select ${lead.name}`}
                    />
                  </TableCell>
                  {columns.filter(column => column.visible).map(column => (
                    <TableCell key={`${lead.id}-${column.key}`}>
                      {column.key === 'name' && lead.name}
                      {column.key === 'company' && lead.company}
                      {column.key === 'stage' && lead.stage}
                      {column.key === 'contact' && lead.contact}
                      {column.key === 'value' && lead.value}
                      {column.key === 'expectedCloseDate' && lead.expectedCloseDate}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-medium">
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="ghost">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
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
      </CardContent>
    </Card>
  );
};

export default LeadsTable;
