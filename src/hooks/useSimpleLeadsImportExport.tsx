
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface LeadRow {
  id?: string;
  lead_name: string;
  company_name?: string;
  position?: string;
  email?: string;
  phone_no?: string;
  linkedin?: string;
  website?: string;
  contact_source?: string;
  lead_status?: string;
  industry?: string;
  country?: string;
  description?: string;
  contact_owner?: string;
  created_by?: string;
  modified_by?: string;
  created_time?: string;
  modified_time?: string;
}

export const useSimpleLeadsImportExport = (onRefresh: () => void) => {
  const { user } = useAuth();
  const [isImporting, setIsImporting] = useState(false);

  const parseCSV = (text: string): LeadRow[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data: LeadRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0) continue;

      const row: any = {};
      headers.forEach((header, index) => {
        if (values[index] !== undefined) {
          row[header] = values[index].trim();
        }
      });

      if (row.lead_name) {
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
      const leads = parseCSV(text);
      
      if (leads.length === 0) {
        toast({
          title: "Error",
          description: "No valid leads found in file",
          variant: "destructive",
        });
        return;
      }

      let successCount = 0;
      let updateCount = 0;
      let errorCount = 0;

      for (const lead of leads) {
        try {
          const now = new Date().toISOString();
          lead.created_by = lead.created_by || user.id;
          lead.modified_by = user.id;
          lead.modified_time = now;
          
          if (lead.id) {
            // Try to update existing lead
            const { error } = await supabase
              .from('leads')
              .update({
                lead_name: lead.lead_name,
                company_name: lead.company_name || null,
                position: lead.position || null,
                email: lead.email || null,
                phone_no: lead.phone_no || null,
                linkedin: lead.linkedin || null,
                website: lead.website || null,
                contact_source: lead.contact_source || null,
                lead_status: lead.lead_status || 'New',
                industry: lead.industry || null,
                country: lead.country || null,
                description: lead.description || null,
                contact_owner: lead.contact_owner || null,
                modified_by: user.id,
                modified_time: now
              })
              .eq('id', lead.id);

            if (error) {
              // If update fails, try insert
              const insertData = {
                lead_name: lead.lead_name,
                company_name: lead.company_name || null,
                position: lead.position || null,
                email: lead.email || null,
                phone_no: lead.phone_no || null,
                linkedin: lead.linkedin || null,
                website: lead.website || null,
                contact_source: lead.contact_source || null,
                lead_status: lead.lead_status || 'New',
                industry: lead.industry || null,
                country: lead.country || null,
                description: lead.description || null,
                contact_owner: lead.contact_owner || user.id,
                created_by: user.id,
                modified_by: user.id,
                created_time: now,
                modified_time: now
              };

              const { error: insertError } = await supabase
                .from('leads')
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
            // Insert new lead
            const insertData = {
              lead_name: lead.lead_name,
              company_name: lead.company_name || null,
              position: lead.position || null,
              email: lead.email || null,
              phone_no: lead.phone_no || null,
              linkedin: lead.linkedin || null,
              website: lead.website || null,
              contact_source: lead.contact_source || null,
              lead_status: lead.lead_status || 'New',
              industry: lead.industry || null,
              country: lead.country || null,
              description: lead.description || null,
              contact_owner: lead.contact_owner || user.id,
              created_by: user.id,
              modified_by: user.id,
              created_time: now,
              modified_time: now
            };

            const { error } = await supabase
              .from('leads')
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
        description: error.message || "Failed to import leads",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = async () => {
    try {
      const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_time', { ascending: false });

      if (error) throw error;

      if (!leads || leads.length === 0) {
        toast({
          title: "No Data",
          description: "No leads to export",
          variant: "destructive",
        });
        return;
      }

      // Create CSV content
      const headers = [
        'id', 'lead_name', 'company_name', 'position', 'email', 'phone_no',
        'linkedin', 'website', 'contact_source', 'lead_status', 'industry', 'country',
        'description', 'contact_owner', 'created_by', 'modified_by',
        'created_time', 'modified_time'
      ];

      const csvRows = leads.map(lead => 
        headers.map(header => {
          const value = lead[header];
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
      link.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `${leads.length} leads exported`,
      });

    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: "Export Error",
        description: error.message || "Failed to export leads",
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
