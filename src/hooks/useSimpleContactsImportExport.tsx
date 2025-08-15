
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { GenericCSVProcessor } from './import-export/genericCSVProcessor';
import { GenericCSVExporter } from './import-export/genericCSVExporter';
import { getExportFilename } from '@/utils/exportUtils';

// Contacts field order
const CONTACTS_EXPORT_FIELDS = [
  'id', 'contact_name', 'company_name', 'position', 'email', 'phone_no',
  'linkedin', 'website', 'contact_source', 'industry', 'region',
  'description', 'contact_owner', 'created_by', 'modified_by',
  'created_time', 'modified_time'
];

export const useSimpleContactsImportExport = (onRefresh: () => void) => {
  const { user } = useAuth();
  const [isImporting, setIsImporting] = useState(false);

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
      const processor = new GenericCSVProcessor();
      
      const result = await processor.processCSV(text, {
        tableName: 'contacts',
        userId: user.id,
        onProgress: (processed, total) => {
          console.log(`Progress: ${processed}/${total}`);
        }
      });

      const { successCount, updateCount, errorCount } = result;
      const message = `Import completed: ${successCount} new, ${updateCount} updated, ${errorCount} errors`;
      
      if (successCount > 0 || updateCount > 0) {
        toast({
          title: "Import Successful",
          description: message,
        });
        
        // Trigger real-time refresh
        onRefresh();
        
        // Dispatch custom event for real-time updates
        window.dispatchEvent(new CustomEvent('contacts-data-updated', {
          detail: { successCount, updateCount, source: 'csv-import' }
        }));
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

      const filename = getExportFilename('contacts', 'all');
      const exporter = new GenericCSVExporter();
      await exporter.exportToCSV(contacts, filename, CONTACTS_EXPORT_FIELDS);

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
