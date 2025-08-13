
import { useAuth } from '@/hooks/useAuth';
import { getExportFilename } from '@/utils/exportUtils';
import { CSVProcessor } from './import-export/csvProcessor';
import { CSVExporter } from './import-export/csvExporter';

interface ImportExportOptions {
  moduleName: string;
  onRefresh: () => void;
  tableName?: string;
}

export const useImportExport = ({ moduleName, onRefresh, tableName = 'contacts_module' }: ImportExportOptions) => {
  const { user } = useAuth();
  
  const handleImport = async (file: File) => {
    try {
      console.log(`Starting import of ${file.name} (${file.size} bytes) into ${tableName}`);
      console.log('Import config:', { moduleName: moduleName, tableName: tableName });
      
      const text = await file.text();
      console.log('File content loaded, length:', text.length);
      
      const processor = new CSVProcessor(tableName);
      const result = await processor.processCSV(text, {
        tableName,
        userId: user?.id || '00000000-0000-0000-0000-000000000000'
      });

      const { successCount, updateCount, duplicateCount, errorCount, errors } = result;

      console.log(`Import completed - Success: ${successCount}, Updates: ${updateCount}, Errors: ${errorCount}, Duplicates: ${duplicateCount}`);

      let message = `Import completed: ${successCount} new records`;
      if (updateCount > 0) message += `, ${updateCount} updated`;
      if (duplicateCount > 0) message += `, ${duplicateCount} duplicates skipped`;
      if (errorCount > 0) message += `, ${errorCount} errors`;

      if (successCount > 0 || updateCount > 0) {
        // Use toast from the processor's context
      }

      if (errorCount > 0) {
        console.log('First 5 import errors:', errors.slice(0, 5));
      }
      
      console.log('Refreshing data after import...');
      onRefresh();

    } catch (error: any) {
      console.error('Import failed:', error);
      // Error handling is done in the processor
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
