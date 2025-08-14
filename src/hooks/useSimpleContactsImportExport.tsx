
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface ContactRow {
  id?: string;
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
  description?: string;
  contact_owner?: string;
  created_by?: string;
  modified_by?: string;
  created_time?: string;
  modified_time?: string;
}

export const useSimpleContactsImportExport = (onRefresh: () => void) => {
  const { user } = useAuth();
  const [isImporting, setIsImporting] = useState(false);

  const parseCSV = (text: string): ContactRow[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data: ContactRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0) continue;

      const row: any = {};
      headers.forEach((header, index) => {
        if (values[index] !== undefined) {
          row[header] = values[index].trim();
        }
      });

      if (row.contact_name) {
        data.push(row);
      }
    }

    return data;
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result.map(field => field.replace(/^"|"$/g, ''));
  };

  const handleImport = async (file: File) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    
    try {
      const text = await file.text();
      const contacts = parseCSV(text);
      
      if (contacts.length === 0) {
        toast({
          title: "Error",
          description: "No valid contacts found in file",
          variant: "destructive",
        });
        return;
      }

      let successCount = 0;
      let updateCount = 0;
      let errorCount = 0;

      for (const contact of contacts) {
        try {
          // Set user info and timestamps
          const now = new Date().toISOString();
          contact.created_by = contact.created_by || user.id;
          contact.modified_by = user.id;
          contact.modified_time = now;
          
          if (contact.id) {
            // Try to update existing contact
            const { error } = await supabase
              .from('contacts')
              .update({
                contact_name: contact.contact_name,
                company_name: contact.company_name || null,
                position: contact.position || null,
                email: contact.email || null,
                phone_no: contact.phone_no || null,
                linkedin: contact.linkedin || null,
                website: contact.website || null,
                contact_source: contact.contact_source || null,
                industry: contact.industry || null,
                region: contact.region || null,
                description: contact.description || null,
                contact_owner: contact.contact_owner || null,
                modified_by: user.id,
                modified_time: now
              })
              .eq('id', contact.id);

            if (error) {
              // If update fails, try insert
              const insertData = {
                contact_name: contact.contact_name,
                company_name: contact.company_name || null,
                position: contact.position || null,
                email: contact.email || null,
                phone_no: contact.phone_no || null,
                linkedin: contact.linkedin || null,
                website: contact.website || null,
                contact_source: contact.contact_source || null,
                industry: contact.industry || null,
                region: contact.region || null,
                description: contact.description || null,
                contact_owner: contact.contact_owner || user.id,
                created_by: user.id,
                modified_by: user.id,
                created_time: now,
                modified_time: now
              };

              const { error: insertError } = await supabase
                .from('contacts')
                .insert([insertData]);

              if (insertError) {
                console.error('Insert error:', insertError);
                errorCount++;
              } else {
                successCount++;
              }
            } else {
              updateCount++;
            }
          } else {
            // Insert new contact
            const insertData = {
              contact_name: contact.contact_name,
              company_name: contact.company_name || null,
              position: contact.position || null,
              email: contact.email || null,
              phone_no: contact.phone_no || null,
              linkedin: contact.linkedin || null,
              website: contact.website || null,
              contact_source: contact.contact_source || null,
              industry: contact.industry || null,
              region: contact.region || null,
              description: contact.description || null,
              contact_owner: contact.contact_owner || user.id,
              created_by: user.id,
              modified_by: user.id,
              created_time: now,
              modified_time: now
            };

            const { error } = await supabase
              .from('contacts')
              .insert([insertData]);

            if (error) {
              console.error('Insert error:', error);
              errorCount++;
            } else {
              successCount++;
            }
          }
        } catch (error) {
          console.error('Processing error:', error);
          errorCount++;
        }
      }

      const message = `Import completed: ${successCount} new, ${updateCount} updated, ${errorCount} errors`;
      
      if (successCount > 0 || updateCount > 0) {
        toast({
          title: "Import Successful",
          description: message,
        });
        onRefresh();
      } else {
        toast({
          title: "Import Failed",
          description: message,
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Import Error",
        description: error.message || "Failed to import contacts",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = async () => {
    try {
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_time', { ascending: false });

      if (error) throw error;

      if (!contacts || contacts.length === 0) {
        toast({
          title: "No Data",
          description: "No contacts to export",
          variant: "destructive",
        });
        return;
      }

      // Create CSV content
      const headers = [
        'id', 'contact_name', 'company_name', 'position', 'email', 'phone_no',
        'linkedin', 'website', 'contact_source', 'industry', 'region',
        'description', 'contact_owner', 'created_by', 'modified_by',
        'created_time', 'modified_time'
      ];

      const csvRows = contacts.map(contact => 
        headers.map(header => {
          const value = contact[header];
          if (value === null || value === undefined) return '';
          const str = String(value);
          // Escape quotes and wrap in quotes if contains comma
          if (str.includes(',') || str.includes('"')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(',')
      );

      const csvContent = [headers.join(','), ...csvRows].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contacts-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `${contacts.length} contacts exported`,
      });

    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: "Export Error",
        description: error.message || "Failed to export contacts",
        variant: "destructive",
      });
    }
  };

  return {
    handleImport,
    handleExport,
    isImporting
  };
};
