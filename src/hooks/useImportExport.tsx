
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

export const useImportExport = ({ moduleName, onRefresh, tableName = 'contacts' }: ImportExportOptions) => {
  const { user } = useAuth();
  
  const handleImport = async (file: File) => {
    console.log('useImportExport: Starting import process');
    console.log('useImportExport: File details:', { 
      name: file.name, 
      size: file.size, 
      type: file.type,
      lastModified: file.lastModified
    });
    console.log('useImportExport: Table name:', tableName);
    console.log('useImportExport: User:', user);

    if (!user?.id) {
      const errorMsg = 'User not authenticated. Please log in and try again.';
      console.error('useImportExport: No user ID available');
      toast({
        title: "Authentication Error",
        description: errorMsg,
        variant: "destructive",
      });
      throw new Error(errorMsg);
    }

    if (!file) {
      const errorMsg = 'No file provided for import';
      console.error('useImportExport:', errorMsg);
      toast({
        title: "File Error",
        description: errorMsg,
        variant: "destructive",
      });
      throw new Error(errorMsg);
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      const errorMsg = 'Please select a CSV file';
      console.error('useImportExport: Invalid file type:', file.type);
      toast({
        title: "Invalid File Type",
        description: errorMsg,
        variant: "destructive",
      });
      throw new Error(errorMsg);
    }

    try {
      console.log(`useImportExport: Starting import of ${file.name} (${file.size} bytes) into ${tableName}`);
      
      // Show initial loading toast
      toast({
        title: "Import Started",
        description: `Processing ${file.name}...`,
      });

      const text = await file.text();
      console.log('useImportExport: File content loaded, length:', text.length);
      console.log('useImportExport: First 500 characters:', text.substring(0, 500));
      
      if (!text || text.trim().length === 0) {
        throw new Error('CSV file is empty or could not be read');
      }

      // Basic CSV validation
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        throw new Error('CSV file must contain at least a header row and one data row');
      }

      console.log('useImportExport: CSV has', lines.length, 'lines');

      const processor = new CSVProcessor(tableName);
      console.log('useImportExport: CSV processor created for table:', tableName);
      
      const result = await processor.processCSV(text, {
        tableName,
        userId: user.id,
        onProgress: (processed, total) => {
          console.log(`useImportExport: Progress ${processed}/${total}`);
        }
      });

      console.log('useImportExport: Processing complete:', result);

      const { successCount, updateCount, duplicateCount, errorCount, errors } = result;

      console.log(`useImportExport: Import completed - Success: ${successCount}, Updates: ${updateCount}, Errors: ${errorCount}, Duplicates: ${duplicateCount}`);

      // Generate success message
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
        
        console.log('useImportExport: Refreshing data after successful import...');
        onRefresh();
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
        console.log('useImportExport: Import errors:', errors.slice(0, 10));
      }

      return result;

    } catch (error: any) {
      console.error('useImportExport: Import failed with error:', error);
      console.error('useImportExport: Error stack:', error.stack);
      
      const errorMessage = error.message || "Failed to import CSV file. Please check the file format and try again.";
      
      toast({
        title: "Import Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    }
  };

  const handleExportAll = async (data: any[]) => {
    console.log(`useImportExport: Exporting all data for ${tableName}:`, data?.length || 0, 'records');
    const filename = getExportFilename(moduleName, 'all');
    const exporter = new CSVExporter(tableName);
    await exporter.exportToCSV(data, filename);
  };

  const handleExportSelected = async (data: any[], selectedIds: string[]) => {
    const selectedData = data.filter(item => selectedIds.includes(item.id));
    const filename = getExportFilename(moduleName, 'selected');
    console.log(`useImportExport: Exporting selected data:`, selectedData.length, 'records');
    const exporter = new CSVExporter(tableName);
    await exporter.exportToCSV(selectedData, filename);
  };

  const handleExportFiltered = async (filteredData: any[]) => {
    const filename = getExportFilename(moduleName, 'filtered');
    console.log(`useImportExport: Exporting filtered data:`, filteredData.length, 'records');
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
