import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LeadColumn } from "@/types/columns";

interface Lead {
  id: string;
  name: string;
  stage: string;
  value: number;
  company: string;
  contact: string;
  probability: number;
  expectedCloseDate: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
}

const sampleLeads: Lead[] = [
  {
    id: "1",
    name: "New Lead 1",
    stage: "Qualified",
    value: 1000,
    company: "Company A",
    contact: "John Doe",
    probability: 0.75,
    expectedCloseDate: "2024-03-15",
    owner: "Alice Smith",
    createdAt: "2024-01-20",
    updatedAt: "2024-02-01",
  },
  {
    id: "2",
    name: "Potential Lead 2",
    stage: "Contact Made",
    value: 2500,
    company: "Company B",
    contact: "Jane Smith",
    probability: 0.5,
    expectedCloseDate: "2024-04-01",
    owner: "Bob Johnson",
    createdAt: "2024-01-25",
    updatedAt: "2024-02-05",
  },
  {
    id: "3",
    name: "Hot Lead 3",
    stage: "Proposal Sent",
    value: 5000,
    company: "Company C",
    contact: "Mike Brown",
    probability: 0.9,
    expectedCloseDate: "2024-03-20",
    owner: "Alice Smith",
    createdAt: "2024-02-01",
    updatedAt: "2024-02-10",
  },
];

const defaultColumns: LeadColumn[] = [
  { key: 'name', label: 'Name', visible: true },
  { key: 'stage', label: 'Stage', visible: true },
  { key: 'value', label: 'Value', visible: true, type: 'number' },
  { key: 'company', label: 'Company', visible: true },
  { key: 'contact', label: 'Contact', visible: true },
  { key: 'probability', label: 'Probability', visible: true, type: 'number' },
  { key: 'expectedCloseDate', label: 'Expected Close Date', visible: true, type: 'date' },
  { key: 'owner', label: 'Owner', visible: true },
];

const useLeadsModule = () => {
  const [leads, setLeads] = useState<Lead[]>(sampleLeads);
  const [columns, setColumns] = useState<LeadColumn[]>(defaultColumns);

  // const { data: leads, error, isLoading } = useQuery('leads', async () => {
  //   const { data, error } = await supabase
  //     .from('leads')
  //     .select('*');

  //   if (error) {
  //     throw new Error(error.message);
  //   }

  //   return data;
  // });

  // if (error) {
  //   console.error("Error fetching leads:", error);
  // }

  const addLead = (newLead: Lead) => {
    setLeads([...leads, newLead]);
  };

  const updateLead = (updatedLead: Lead) => {
    setLeads(leads.map(lead => lead.id === updatedLead.id ? updatedLead : lead));
  };

  const deleteLead = (leadId: string) => {
    setLeads(leads.filter(lead => lead.id !== leadId));
  };

  const setColumnVisibility = (key: string, visible: boolean) => {
    setColumns(prevColumns =>
      prevColumns.map(column =>
        column.key === key ? { ...column, visible } : column
      )
    );
  };

  return {
    leads,
    addLead,
    updateLead,
    deleteLead,
    columns,
    setColumns,
    setColumnVisibility
  };
};

export default useLeadsModule;
