
import { useAuth } from '@/hooks/useAuth';
import { getExportFilename } from '@/utils/exportUtils';
import { SimpleDealsCSVProcessor } from './import-export/simpleDealsCSVProcessor';
import { DealsCSVExporter } from './import-export/dealsCSVExporter';
import { toast } from '@/hooks/use-toast';

interface DealsImportExportOptions {
  onRefresh: () => void;
}

export const useDealsImportExport = ({ onRefresh }: DealsImportExportOptions) => {
  const { user } = useAuth();
  
  const handleImport = async (file: File) => {
    console.log('useDealsImportExport: Starting import process with centralized logic');

    if (!user?.id) {
      const errorMsg = 'User not authenticated. Please log in and try again.';
      console.error('useDealsImportExport: No user ID available');
      toast({
        title: "Authentication Error",
        description: errorMsg,
        variant: "destructive",
      });
      throw new Error(errorMsg);
    }

    if (!file) {
      const errorMsg = 'No file provided for import';
      console.error('useDealsImportExport:', errorMsg);
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
      console.error('useDealsImportExport: Invalid file type:', file.type);
      toast({
        title: "Invalid File Type",
        description: errorMsg,
        variant: "destructive",
      });
      throw new Error(errorMsg);
    }

    try {
      console.log(`useDealsImportExport: Starting import of ${file.name} (${file.size} bytes)`);
      
      // Show initial loading toast
      toast({
        title: "Import Started",
        description: `Processing ${file.name} with global date format...`,
      });

      const text = await file.text();
      console.log('useDealsImportExport: File content loaded, length:', text.length);
      
      if (!text || text.trim().length === 0) {
        throw new Error('CSV file is empty or could not be read');
      }

      // Basic CSV validation
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        throw new Error('CSV file must contain at least a header row and one data row');
      }

      console.log('useDealsImportExport: CSV has', lines.length, 'lines (including header)');

      const processor = new SimpleDealsCSVProcessor();
      console.log('useDealsImportExport: Starting processing with centralized date conversion logic');
      
      const result = await processor.processCSV(text, {
        userId: user.id,
        onProgress: (processed, total) => {
          console.log(`useDealsImportExport: Progress ${processed}/${total}`);
        }
      });

      console.log('useDealsImportExport: Processing complete:', result);

      const { successCount, updateCount, duplicateCount, errorCount, errors } = result;

      // Generate success message
      let message = '';
      if (successCount > 0) message += `${successCount} new deals imported`;
      if (updateCount > 0) message += message ? `, ${updateCount} updated` : `${updateCount} deals updated`;
      if (duplicateCount > 0) message += message ? `, ${duplicateCount} duplicates skipped` : `${duplicateCount} duplicates skipped`;
      if (errorCount > 0) message += message ? `, ${errorCount} errors` : `${errorCount} errors occurred`;

      if (successCount > 0 || updateCount > 0) {
        toast({
          title: "Import Successful",
          description: message || "Import completed successfully",
        });
        
        console.log('useDealsImportExport: Import successful - triggering real-time refresh...');
        
        // Trigger immediate refresh for both List & Kanban views
        onRefresh();
        
        // Dispatch custom event for real-time updates in other components
        window.dispatchEvent(new CustomEvent('deals-data-updated', {
          detail: { successCount, updateCount, source: 'csv-import' }
        }));
      } else if (errorCount > 0) {
        toast({
          title: "Import Failed",
          description: message + (errors.length > 0 ? `. First error: ${errors[0]}` : ''),
          variant: "destructive",
        });
      } else {
        toast({
          title: "Import Info",
          description: "No new deals were imported",
        });
      }

      if (errorCount > 0 && errors.length > 0) {
        console.log('useDealsImportExport: Import errors:', errors.slice(0, 10));
      }

      return result;

    } catch (error: any) {
      console.error('useDealsImportExport: Import failed with error:', error);
      console.error('useDealsImportExport: Error stack:', error.stack);
      
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
    console.log(`useDealsImportExport: Exporting all deals with global date format:`, data?.length || 0, 'records');
    const filename = getExportFilename('deals', 'all');
    const exporter = new DealsCSVExporter();
    await exporter.exportToCSV(data, filename);
  };

  const handleExportSelected = async (data: any[], selectedIds: string[]) => {
    const selectedData = data.filter(item => selectedIds.includes(item.id));
    const filename = getExportFilename('deals', 'selected');
    console.log(`useDealsImportExport: Exporting selected deals with global date format:`, selectedData.length, 'records');
    const exporter = new DealsCSVExporter();
    await exporter.exportToCSV(selectedData, filename);
  };

  const handleExportFiltered = async (filteredData: any[]) => {
    const filename = getExportFilename('deals', 'filtered');
    console.log(`useDealsImportExport: Exporting filtered deals with global date format:`, filteredData.length, 'records');
    const exporter = new DealsCSVExporter();
    await exporter.exportToCSV(filteredData, filename);
  };

  return {
    handleImport,
    handleExportAll,
    handleExportSelected,
    handleExportFiltered
  };
};
