
import { downloadCSV } from '@/utils/csvUtils';
import { DateFormatUtils } from '@/utils/dateFormatUtils';

export class GenericCSVExporter {
  
  async exportToCSV(data: any[], filename: string, fieldsOrder: string[]) {
    console.log(`GenericCSVExporter: Starting export of ${data.length} records`);
    
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    // Create CSV header row - exact field order
    const headers = fieldsOrder;

    // Convert data to CSV rows with proper date formatting
    const csvRows = data.map((record, index) => {
      console.log(`GenericCSVExporter: Processing record ${index + 1}`);
      return fieldsOrder.map(field => {
        const value = record[field];
        // Use centralized date formatting logic
        return DateFormatUtils.processFieldForExport(field, value);
      });
    });

    // Combine headers and data
    const allRows = [headers, ...csvRows];

    // Convert to CSV string with proper escaping
    const csvContent = allRows
      .map(row => 
        row.map(field => {
          const str = String(field || '');
          // If field contains comma, quote, or newline, wrap in quotes and escape quotes
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(',')
      )
      .join('\n');

    console.log(`GenericCSVExporter: CSV content generated, length:`, csvContent.length);
    
    // Download the CSV file
    const success = downloadCSV(csvContent, filename);
    
    if (!success) {
      throw new Error('Failed to download CSV file');
    }
    
    console.log(`GenericCSVExporter: Export completed successfully`);
  }
}
