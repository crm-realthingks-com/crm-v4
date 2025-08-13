
import { toast } from '@/hooks/use-toast';
import { CSVParser } from '@/utils/csvParser';
import { getColumnConfig } from './columnConfig';

export class CSVExporter {
  private config: any;

  constructor(tableName: string) {
    this.config = getColumnConfig(tableName);
  }

  async exportToCSV(data: any[], filename: string) {
    if (data.length === 0) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "No data to export",
      });
      return;
    }

    const headers = this.config.allowedColumns;
    console.log('Exporting with headers:', headers);
    console.log('Sample data:', data[0]);

    const processedData = this.processDataForExport(data, headers);
    const csvContent = CSVParser.toCSV(processedData, headers);

    this.downloadCSV(csvContent, filename);

    console.log(`Export completed: ${data.length} records exported to ${filename}`);
    toast({
      title: "Export completed",
      description: `Successfully exported ${data.length} records to ${filename}`,
    });
  }

  private processDataForExport(data: any[], headers: string[]) {
    return data.map(row => {
      const processedRow: any = {};
      
      headers.forEach(header => {
        let value = row[header];
        
        if (value === null || value === undefined) {
          processedRow[header] = '';
          return;
        }
        
        if ((header.includes('time') || header.includes('date')) && !header.includes('_id')) {
          if (value) {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              processedRow[header] = date.toISOString();
            } else {
              processedRow[header] = '';
            }
          } else {
            processedRow[header] = '';
          }
        } else if (Array.isArray(value)) {
          processedRow[header] = value.join(', ');
        } else if (typeof value === 'boolean') {
          processedRow[header] = value ? 'true' : 'false';
        } else {
          processedRow[header] = String(value);
        }
      });
      
      return processedRow;
    });
  }

  private downloadCSV(csvContent: string, filename: string) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}
