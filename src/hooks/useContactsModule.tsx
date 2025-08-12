import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ContactColumn } from "@/types/columns";

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  country: string;
  city: string;
  address: string;
  linkedin: string;
  createdAt: string;
  updatedAt: string;
}

const sampleContacts: Contact[] = [
  {
    id: "1",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "123-456-7890",
    company: "Acme Corp",
    position: "CEO",
    country: "USA",
    city: "New York",
    address: "123 Main St",
    linkedin: "linkedin.com/in/johndoe",
    createdAt: "2024-01-22T12:00:00.000Z",
    updatedAt: "2024-01-22T12:00:00.000Z",
  },
  {
    id: "2",
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@example.com",
    phone: "987-654-3210",
    company: "Beta Inc",
    position: "CTO",
    country: "Canada",
    city: "Toronto",
    address: "456 Elm St",
    linkedin: "linkedin.com/in/janesmith",
    createdAt: "2024-01-22T12:00:00.000Z",
    updatedAt: "2024-01-22T12:00:00.000Z",
  },
  {
    id: "3",
    firstName: "Alice",
    lastName: "Johnson",
    email: "alice.johnson@example.com",
    phone: "111-222-3333",
    company: "Gamma Ltd",
    position: "CFO",
    country: "UK",
    city: "London",
    address: "789 Oak St",
    linkedin: "linkedin.com/in/alicejohnson",
    createdAt: "2024-01-22T12:00:00.000Z",
    updatedAt: "2024-01-22T12:00:00.000Z",
  },
];

const initialColumns: ContactColumn[] = [
  { key: 'firstName', label: 'First Name', visible: true },
  { key: 'lastName', label: 'Last Name', visible: true },
  { key: 'email', label: 'Email', visible: true, type: 'email' },
  { key: 'phone', label: 'Phone', visible: true, type: 'phone' },
  { key: 'company', label: 'Company', visible: true },
  { key: 'position', label: 'Position', visible: false },
  { key: 'country', label: 'Country', visible: false },
  { key: 'city', label: 'City', visible: false },
  { key: 'address', label: 'Address', visible: false },
  { key: 'linkedin', label: 'LinkedIn', visible: false },
  { key: 'createdAt', label: 'Created At', visible: false, type: 'date' },
  { key: 'updatedAt', label: 'Updated At', visible: false, type: 'date' },
];

export const useContactsModule = () => {
  const [contacts, setContacts] = useState<Contact[]>(sampleContacts);
  const [columns, setColumns] = useState<ContactColumn[]>(initialColumns);

  // const { data: contacts, error, isLoading } = useQuery('contacts', async () => {
  //   const { data, error } = await supabase
  //     .from('contacts')
  //     .select('*');

  //   if (error) {
  //     throw new Error(error.message);
  //   }

  //   return data;
  // });

  // if (error) {
  //   console.error("Error fetching contacts:", error.message);
  // }

  const addContact = (newContact: Contact) => {
    setContacts([...contacts, newContact]);
  };

  const updateContact = (updatedContact: Contact) => {
    setContacts(
      contacts.map((contact) =>
        contact.id === updatedContact.id ? updatedContact : contact
      )
    );
  };

  const deleteContact = (id: string) => {
    setContacts(contacts.filter((contact) => contact.id !== id));
  };

  const setVisibleColumns = (newColumns: ContactColumn[]) => {
    setColumns(newColumns);
  };

  return {
    contacts,
    // isLoading,
    addContact,
    updateContact,
    deleteContact,
    columns,
    setVisibleColumns,
  };
};
