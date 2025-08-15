
import { supabase } from '@/integrations/supabase/client';
import { CSVParser } from '@/utils/csvParser';
import { createHeaderMapper } from './headerMapper';
import { createRecordValidator } from './recordValidator';
import { createDuplicateChecker } from './duplicateChecker';

export interface ProcessingOptions {
  tableName: string;
  userId: string;
  onProgress?: (processed: number, total: number) => void;
}

export interface ProcessingResult {
  successCount: number;
  updateCount: number;
  duplicateCount: number;
  errorCount: number;
  errors: string[];
}

export class CSVProcessor {
  private tableName: string;
  private headerMapper: (header: string) => string | null;
  private recordValidator: (record: any) => boolean;
  private duplicateChecker: (record: any) => Promise<boolean>;

  constructor(tableName: string) {
    this.tableName = tableName;
    this.headerMapper = createHeaderMapper(tableName);
    this.recordValidator = createRecordValidator(tableName);
    this.duplicateChecker = createDuplicateChecker(tableName);
  }

  async processCSV(csvText: string, options: ProcessingOptions): Promise<ProcessingResult> {
    console.log(`CSVProcessor: Starting processing for table ${options.tableName}`);
    
    try {
      // Parse CSV
      const { headers, rows } = CSVParser.parseCSV(csvText);
      console.log(`CSVProcessor: Parsed ${rows.length} rows with headers:`, headers);

      if (rows.length === 0) {
        throw new Error('No data rows found in CSV');
      }

      // Map headers to database columns
      const columnMap: Record<string, string> = {};
      headers.forEach(header => {
        const mappedColumn = this.headerMapper(header);
        if (mappedColumn) {
          columnMap[header] = mappedColumn;
        }
      });
      console.log('CSVProcessor: Column mapping:', columnMap);

      const result: ProcessingResult = {
        successCount: 0,
        updateCount: 0,
        duplicateCount: 0,
        errorCount: 0,
        errors: []
      };

      // Process rows in batches
      const batchSize = 50;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const batchResult = await this.processBatch(batch, headers, columnMap, options);
        
        result.successCount += batchResult.successCount;
        result.updateCount += batchResult.updateCount;
        result.duplicateCount += batchResult.duplicateCount;
        result.errorCount += batchResult.errorCount;
        result.errors.push(...batchResult.errors);

        // Report progress
        if (options.onProgress) {
          options.onProgress(Math.min(i + batchSize, rows.length), rows.length);
        }
      }

      console.log('CSVProcessor: Processing complete:', result);
      return result;

    } catch (error: any) {
      console.error('CSVProcessor: Processing failed:', error);
      throw new Error(`CSV processing failed: ${error.message}`);
    }
  }

  private async processBatch(
    rows: string[][],
    headers: string[],
    columnMap: Record<string, string>,
    options: ProcessingOptions
  ): Promise<ProcessingResult> {
    
    const result: ProcessingResult = {
      successCount: 0,
      updateCount: 0, 
      duplicateCount: 0,
      errorCount: 0,
      errors: []
    };

    for (const row of rows) {
      try {
        // Convert row to object
        const rowObj: Record<string, any> = {};
        headers.forEach((header, index) => {
          const dbColumn = columnMap[header];
          if (dbColumn && row[index] !== undefined) {
            rowObj[dbColumn] = row[index];
          }
        });

        // Add metadata
        rowObj.created_by = options.userId;
        rowObj.modified_by = options.userId;

        // Validate record
        const isValid = this.recordValidator(rowObj);
        if (!isValid) {
          result.errorCount++;
          result.errors.push(`Row validation failed for record`);
          continue;
        }

        // Check for duplicates
        const isDuplicate = await this.duplicateChecker(rowObj);
        
        if (isDuplicate) {
          result.duplicateCount++;
          console.log('Duplicate record found, skipping');
          continue;
        }

        // Insert new record
        const { error: insertError } = await supabase
          .from(options.tableName as any)
          .insert([rowObj]);

        if (insertError) {
          result.errorCount++;
          result.errors.push(`Insert failed: ${insertError.message}`);
        } else {
          result.successCount++;
        }

      } catch (error: any) {
        result.errorCount++;
        result.errors.push(`Row processing error: ${error.message}`);
      }
    }

    return result;
  }
}
