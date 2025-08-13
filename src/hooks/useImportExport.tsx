
import { useAuth } from '@/hooks/useAuth';
import { getExportFilename } from '@/utils/exportUtils';
import { CSVProcessor } from './import-export/csvProcessor';
import { CSVExporter } from './import-export/csvExporter';
import { toast } from '@/hooks/use-toast';

interface ImportExportOptions {
  moduleName: string;
  onRefresh: () => void;
  tableName?: string;
}

export const useImportExport = ({ moduleName, onRefresh, tableName = 'contacts_module' }: ImportExportOptions) => {
  const { user } = useAuth();
  
  const handleImport = async (file: File) => {
    console.log('Import hook: Starting import process');
    console.log('Import hook: File details:', { name: file.name, size: file.size, type: file.type });
    console.log('Import hook: Table name:', tableName);
    console.log('Import hook: User:', user);

    if (!user?.id) {
      console.error('Import hook: No user ID available');
      toast({
        title: "Error",
        description: "User not authenticated. Please log in and try again.",
        variant: "destructive",
      });
      throw new Error('User not authenticated');
    }

    try {
      console.log(`Import hook: Starting import of ${file.name} (${file.size} bytes) into ${tableName}`);
      
      const text = await file.text();
      console.log('Import hook: File content loaded, length:', text.length);
      console.log('Import hook: First 200 characters:', text.substring(0, 200));
      
      if (!text || text.trim().length === 0) {
        throw new Error('CSV file is empty');
      }

      const processor = new CSVProcessor(tableName);
      console.log('Import hook: CSV processor created');
      
      const result = await processor.processCSV(text, {
        tableName,
        userId: user.id
      });

      console.log('Import hook: Processing complete:', result);

      const { successCount, updateCount, duplicateCount, errorCount, errors } = result;

      console.log(`Import hook: Import completed - Success: ${successCount}, Updates: ${updateCount}, Errors: ${errorCount}, Duplicates: ${duplicateCount}`);

      let message = '';
      if (successCount > 0) message += `${successCount} new records imported`;
      if (updateCount > 0) message += message ? `, ${updateCount} updated` : `${updateCount} records updated`;
      if (duplicateCount > 0) message += message ? `, ${duplicateCount} duplicates skipped` : `${duplicateCount} duplicates skipped`;
      if (errorCount > 0) message += message ? `, ${errorCount} errors` : `${errorCount} errors occurred`;

      if (successCount > 0 || updateCount > 0) {
        toast({
          title: "Import Successful",
          description: message || "Import completed successfully",
        });
      } else if (errorCount > 0) {
        toast({
          title: "Import Failed",
          description: message + (errors.length > 0 ? `. First error: ${errors[0]}` : ''),
          variant: "destructive",
        });
      } else {
        toast({
          title: "Import Info",
          description: "No new records were imported",
        });
      }

      if (errorCount > 0 && errors.length > 0) {
        console.log('Import hook: First 5 import errors:', errors.slice(0, 5));
      }
      
      console.log('Import hook: Refreshing data after import...');
      onRefresh();

    } catch (error: any) {
      console.error('Import hook: Import failed:', error);
      toast({
        title: "Import Error",
        description: error.message || "Failed to import CSV file. Please check the file format and try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleExportAll = async (data: any[]) => {
    console.log(`Exporting all data for ${tableName}:`, data?.length || 0, 'records');
    const filename = getExportFilename(moduleName, 'all');
    const exporter = new CSVExporter(tableName);
    await exporter.exportToCSV(data, filename);
  };

  const handleExportSelected = async (data: any[], selectedIds: string[]) => {
    const selectedData = data.filter(item => selectedIds.includes(item.id));
    const filename = getExportFilename(moduleName, 'selected');
    console.log(`Exporting selected data:`, selectedData.length, 'records');
    const exporter = new CSVExporter(tableName);
    await exporter.exportToCSV(selectedData, filename);
  };

  const handleExportFiltered = async (filteredData: any[]) => {
    const filename = getExportFilename(moduleName, 'filtered');
    console.log(`Exporting filtered data:`, filteredData.length, 'records');
    const exporter = new CSVExporter(tableName);
    await exporter.exportToCSV(filteredData, filename);
  };

  return {
    handleImport,
    handleExportAll,
    handleExportSelected,
    handleExportFiltered
  };
};
