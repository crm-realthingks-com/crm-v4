
import { supabase } from '@/integrations/supabase/client';
import { DateFormatUtils } from '@/utils/dateFormatUtils';

interface GenericProcessOptions {
  tableName: string;
  userId: string;
  onProgress?: (processed: number, total: number) => void;
}

export class GenericCSVProcessor {
  
  async processCSV(csvText: string, options: GenericProcessOptions) {
    console.log(`GenericCSVProcessor: Starting CSV processing for ${options.tableName}`);
    
    try {
      const lines = csvText.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        throw new Error('CSV must contain at least a header row and one data row');
      }

      const headers = this.parseCSVRow(lines[0]);
      const dataRows = lines.slice(1).map(line => this.parseCSVRow(line));
      
      console.log(`GenericCSVProcessor: Headers:`, headers);
      console.log(`GenericCSVProcessor: Data rows:`, dataRows.length);

      return await this.processRows(dataRows, headers, options);
    } catch (error) {
      console.error(`GenericCSVProcessor: Error:`, error);
      throw error;
    }
  }

  private parseCSVRow(row: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      
      if (char === '"') {
        if (inQuotes && row[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  private async processRows(dataRows: string[][], headers: string[], options: GenericProcessOptions) {
    console.log(`GenericCSVProcessor: Processing ${dataRows.length} rows for ${options.tableName}`);
    
    let successCount = 0;
    let updateCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      try {
        const row = dataRows[i];
        if (row.length === 0 || row.every(cell => !cell.trim())) {
          continue; // Skip empty rows
        }

        const record = this.mapRowToRecord(row, headers);
        const hasId = record.id && record.id.trim() !== '';
        
        console.log(`GenericCSVProcessor: Row ${i + 1} - Processing record:`, {
          id: record.id || 'NEW',
          hasId
        });
        
        // Use upsert for efficient update/insert
        const result = await this.upsertRecord(record, options.userId, options.tableName, hasId);
        
        if (hasId) {
          updateCount++;
          console.log(`GenericCSVProcessor: Row ${i + 1}: Updated record ID ${record.id}`);
        } else {
          successCount++;
          console.log(`GenericCSVProcessor: Row ${i + 1}: Inserted new record`);
        }

        if (options.onProgress) {
          options.onProgress(i + 1, dataRows.length);
        }

      } catch (rowError: any) {
        console.error(`GenericCSVProcessor: Row ${i + 1}: Error:`, rowError);
        errors.push(`Row ${i + 1}: ${rowError.message}`);
        errorCount++;
      }
    }

    const result = { successCount, updateCount, duplicateCount: 0, errorCount, errors };
    console.log(`GenericCSVProcessor: Final result for ${options.tableName}:`, result);
    
    return result;
  }

  private mapRowToRecord(row: string[], headers: string[]): any {
    const record: any = {};
    
    headers.forEach((header, index) => {
      if (index < row.length) {
        const value = row[index];
        // Only set value if it's not empty
        if (value && value.trim() !== '') {
          // Use centralized date conversion logic
          const processedValue = DateFormatUtils.processFieldForImport(header, value);
          if (processedValue !== null) {
            record[header] = processedValue;
          }
        }
      }
    });
    
    return record;
  }

  private async upsertRecord(record: any, userId: string, tableName: string, isUpdate: boolean) {
    // Prepare record for upsert
    const upsertData = { ...record };
    
    // Set tracking fields
    upsertData.modified_by = userId;
    upsertData.modified_at = new Date().toISOString();
    
    // For contacts and leads, use modified_time instead of modified_at
    if (tableName === 'contacts' || tableName === 'leads') {
      upsertData.modified_time = upsertData.modified_at;
      delete upsertData.modified_at;
    }
    
    // For new records (no ID), set created_by and timestamps
    if (!isUpdate) {
      upsertData.created_by = userId;
      const now = new Date().toISOString();
      
      if (tableName === 'contacts' || tableName === 'leads') {
        if (!upsertData.created_time) {
          upsertData.created_time = now;
        }
      } else {
        if (!upsertData.created_at) {
          upsertData.created_at = now;
        }
      }
      
      delete upsertData.id; // Remove empty/undefined id for insert
    }

    console.log(`GenericCSVProcessor: Upserting ${tableName}:`, isUpdate ? `UPDATE ID ${record.id}` : 'INSERT NEW');
    console.log(`GenericCSVProcessor: Upsert data:`, upsertData);
    
    // Use a more specific approach to avoid TypeScript issues
    const { data, error } = await supabase
      .from(tableName as any)
      .upsert([upsertData], { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select('*');

    if (error) {
      console.error(`GenericCSVProcessor: Upsert error for ${tableName}:`, error);
      throw new Error(`${isUpdate ? 'Update' : 'Insert'} failed: ${error.message}`);
    }

    // Return the first record from the result, but don't rely on accessing 'id' specifically
    return data && data.length > 0 ? data[0] : null;
  }
}
