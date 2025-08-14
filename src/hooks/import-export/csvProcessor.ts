import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CSVParser } from '@/utils/csvParser';
import { getColumnConfig } from './columnConfig';
import { createHeaderMapper } from './headerMapper';
import { createValueValidator } from './valueValidator';
import { createDuplicateChecker } from './duplicateChecker';
import { createRecordValidator } from './recordValidator';

interface ProcessOptions {
  tableName: string;
  userId: string;
  onProgress?: (processed: number, total: number) => void;
}

type ProcessResult = {
  type: 'success' | 'update' | 'duplicate' | 'error';
  error?: string;
};

export class CSVProcessor {
  private config: any;
  private mapHeader: (header: string) => string | null;
  private validateAndConvertValue: (key: string, value: string) => any;
  private checkDuplicate: (record: any) => Promise<boolean>;
  private validateImportRecord: (record: any) => boolean;

  constructor(tableName: string) {
    this.config = getColumnConfig(tableName);
    this.mapHeader = createHeaderMapper(tableName);
    this.validateAndConvertValue = createValueValidator(tableName);
    this.checkDuplicate = createDuplicateChecker(tableName);
    this.validateImportRecord = createRecordValidator(tableName);
  }

  async processCSV(text: string, options: ProcessOptions) {
    console.log('Starting CSV processing for table:', options.tableName);
    console.log('CSV content length:', text.length);
    console.log('User ID:', options.userId);

    try {
      const { headers, rows: dataRows } = CSVParser.parseCSV(text);
      
      console.log('Parsed CSV - Headers:', headers);
      console.log('Parsed CSV - Data rows:', dataRows.length);

      if (headers.length === 0) {
        throw new Error('No headers found in CSV file');
      }

      if (dataRows.length === 0) {
        throw new Error('No data rows found in CSV file');
      }

      const mappedHeaders = headers.map(header => ({
        original: header,
        mapped: this.mapHeader(header)
      }));

      console.log('Mapped headers:', mappedHeaders);

      return await this.processRows(dataRows, mappedHeaders, options);
    } catch (error) {
      console.error('CSV processing error:', error);
      throw error;
    }
  }


  private async processRows(dataRows: string[][], mappedHeaders: any[], options: ProcessOptions) {
    console.log('Processing rows:', dataRows.length);
    
    let successCount = 0;
    let errorCount = 0;
    let duplicateCount = 0;
    let updateCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      try {
        console.log(`Processing row ${i + 1}:`, dataRows[i]);
        
        const record = this.mapRowToRecord(dataRows[i], mappedHeaders, i);
        
        if (!record || Object.keys(record).length === 0) {
          console.log(`Row ${i + 1}: Skipping empty record`);
          errorCount++;
          continue;
        }

        console.log(`Row ${i + 1}: Mapped record:`, record);

        const result = await this.insertRecord(record, i, options);
        
        console.log(`Row ${i + 1}: Processing result:`, result);
        
        if (result.type === 'success') {
          successCount++;
        } else {
          errorCount++;
          errors.push(result.error!);
        }

        if (options.onProgress) {
          options.onProgress(i + 1, dataRows.length);
        }

        // Small delay to prevent overwhelming the database
        if (i % 5 === 0 && i > 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (rowError: any) {
        console.error(`Row ${i + 1}: Error processing row:`, rowError);
        errors.push(`Row ${i + 1}: Processing error - ${rowError.message}`);
        errorCount++;
      }
    }

    const result = { successCount, updateCount, duplicateCount, errorCount, errors };
    console.log('Final processing result:', result);
    
    return result;
  }

  private mapRowToRecord(row: string[], mappedHeaders: any[], rowIndex: number) {
    const record: any = {};
    let hasValidData = false;
    
    mappedHeaders.forEach((headerMap, index) => {
      if (headerMap.mapped && index < row.length) {
        const rawValue = row[index];
        if (rawValue !== undefined && rawValue !== null && String(rawValue).trim() !== '') {
          const validatedValue = this.validateAndConvertValue(headerMap.mapped, String(rawValue).trim());
          if (validatedValue !== null && validatedValue !== undefined) {
            record[headerMap.mapped] = validatedValue;
            hasValidData = true;
          }
        }
      }
    });
    
    console.log(`Row ${rowIndex + 1} processed record:`, record);
    console.log(`Row ${rowIndex + 1} has valid data:`, hasValidData);
    
    return hasValidData ? record : null;
  }


  private async insertRecord(record: any, rowIndex: number, options: ProcessOptions): Promise<ProcessResult> {
    try {
      // Set user information and timestamps
      record.created_by = options.userId;
      record.modified_by = options.userId;
      
      // Set correct timestamp column names based on table
      const now = new Date().toISOString();
      if (options.tableName === 'deals') {
        record.created_at = now;
        record.modified_at = now;
      } else {
        record.created_time = now;
        record.modified_time = now;
      }

      console.log(`Row ${rowIndex + 1}: Inserting new record:`, record);
      
      const insertResult = await this.performInsert(record, options.tableName);

      console.log(`Row ${rowIndex + 1}: Insert result:`, insertResult);

      if (insertResult.error) {
        console.error(`Row ${rowIndex + 1}: Error inserting record:`, insertResult.error);
        return {
          type: 'error',
          error: `Row ${rowIndex + 1}: Insert failed - ${insertResult.error.message}`
        };
      } else if (insertResult.data && insertResult.data.length > 0) {
        console.log(`Row ${rowIndex + 1}: Successfully inserted new record:`, insertResult.data[0]);
        return { type: 'success' };
      }

      return {
        type: 'error',
        error: `Row ${rowIndex + 1}: Unknown insert error`
      };
    } catch (error: any) {
      console.error(`Row ${rowIndex + 1}: Insert exception:`, error);
      return {
        type: 'error',
        error: `Row ${rowIndex + 1}: Insert error - ${error.message}`
      };
    }
  }

  private async performInsert(record: any, tableName: string) {
    console.log('Performing insert for table:', tableName, 'with record:', record);
    
    switch (tableName) {
      case 'deals':
        return await supabase
          .from('deals')
          .insert([record])
          .select('id, deal_name');
      
      case 'contacts':
      case 'contacts_module':
        return await supabase
          .from('contacts')
          .insert([record])
          .select('id, contact_name');
      
      case 'leads':
        return await supabase
          .from('leads')
          .insert([record])
          .select('id');
      
      case 'meetings':
        return await supabase
          .from('meetings')
          .insert([record])
          .select('id');
      
      default:
        throw new Error(`Unsupported table: ${tableName}`);
    }
  }
}
