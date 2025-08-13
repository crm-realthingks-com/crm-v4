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

      // Validate headers
      await this.validateHeaders(headers, options.tableName);

      const mappedHeaders = headers.map(header => ({
        original: header,
        mapped: this.mapHeader(header)
      }));

      console.log('Mapped headers:', mappedHeaders);

      const validHeaders = mappedHeaders.filter(h => h.mapped !== null);
      const invalidHeaders = mappedHeaders.filter(h => h.mapped === null);
      
      console.log('Valid headers:', validHeaders);
      console.log('Invalid headers:', invalidHeaders);
      
      if (validHeaders.length === 0) {
        throw new Error('No valid headers found. Please ensure CSV headers match the expected field names.');
      }
      
      this.handleInvalidHeaders(invalidHeaders);

      return await this.processRows(dataRows, mappedHeaders, options);
    } catch (error) {
      console.error('CSV processing error:', error);
      throw error;
    }
  }

  private async validateHeaders(headers: string[], tableName: string) {
    console.log('Validating headers for table:', tableName);
    
    if (tableName === 'contacts' || tableName === 'contacts_module') {
      const hasRequiredHeaders = headers.some(h => {
        const mapped = this.mapHeader(h);
        console.log(`Header "${h}" maps to "${mapped}"`);
        return mapped === 'contact_name';
      });
      
      console.log('Has required contact_name header:', hasRequiredHeaders);
      
      if (!hasRequiredHeaders) {
        throw new Error('Missing required header: contact_name is required for contacts import. Please check your CSV headers.');
      }
    } else if (tableName === 'deals') {
      const hasRequiredHeaders = headers.some(h => this.mapHeader(h) === 'deal_name') && 
                                 headers.some(h => this.mapHeader(h) === 'stage');
      if (!hasRequiredHeaders) {
        throw new Error('Missing required headers: deal_name and stage are required for deals import. Please check your CSV headers.');
      }
    }
  }

  private handleInvalidHeaders(invalidHeaders: any[]) {
    if (invalidHeaders.length > 0) {
      const systemFields = ['created_at', 'modified_at', 'created_by', 'modified_by'];
      const otherIgnored = invalidHeaders.filter(h => !systemFields.includes(h.original.toLowerCase()));
      
      if (otherIgnored.length > 0) {
        console.warn('Ignoring unrecognized columns:', otherIgnored.map(h => h.original));
        toast({
          title: "Column Info",
          description: `Ignoring ${otherIgnored.length} unrecognized column(s). Import will continue with recognized fields.`,
        });
      }
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

        const result = await this.processRecord(record, i, options);
        
        console.log(`Row ${i + 1}: Processing result:`, result);
        
        switch (result.type) {
          case 'success':
            successCount++;
            break;
          case 'update':
            updateCount++;
            break;
          case 'duplicate':
            duplicateCount++;
            break;
          case 'error':
            errorCount++;
            errors.push(result.error!);
            break;
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

  private async processRecord(record: any, rowIndex: number, options: ProcessOptions) {
    // Set required defaults and validate based on table type
    const validationResult = this.validateRecord(record, rowIndex, options);
    if (validationResult.type === 'error') {
      return validationResult;
    }

    // Check for duplicates
    const isDuplicate = await this.checkDuplicate(record);
    if (isDuplicate) {
      return await this.handleDuplicate(record, rowIndex, options);
    }

    // Insert new record
    return await this.insertRecord(record, rowIndex, options);
  }

  private validateRecord(record: any, rowIndex: number, options: ProcessOptions) {
    if (options.tableName === 'deals') {
      return this.validateDealRecord(record, rowIndex);
    } else {
      return this.validateOtherRecord(record, rowIndex, options);
    }
  }

  private validateDealRecord(record: any, rowIndex: number) {
    // Ensure required fields have values
    if (!record.deal_name && record.project_name) {
      record.deal_name = record.project_name;
      console.log(`Row ${rowIndex + 1}: Using project_name as deal_name: ${record.deal_name}`);
    }
    if (!record.deal_name) {
      return {
        type: 'error' as const,
        error: `Row ${rowIndex + 1}: Missing deal_name - this field is required`
      };
    }
    if (!record.stage) {
      record.stage = 'Lead';
      console.log(`Row ${rowIndex + 1}: Setting default stage to 'Lead'`);
    }
    
    const isValid = this.validateImportRecord(record);
    if (!isValid) {
      return {
        type: 'error' as const,
        error: `Row ${rowIndex + 1}: Invalid deal data for "${record.deal_name}" - check deal_name and stage values`
      };
    }

    return { type: 'valid' as const, record };
  }

  private validateOtherRecord(record: any, rowIndex: number, options: ProcessOptions) {
    console.log(`Row ${rowIndex + 1}: Validating record:`, record);
    
    // For contacts, ensure we have at least contact_name
    if (options.tableName === 'contacts' || options.tableName === 'contacts_module') {
      if (!record.contact_name || String(record.contact_name).trim() === '') {
        record.contact_name = `Contact ${rowIndex + 1}`;
        console.log(`Row ${rowIndex + 1}: Set default contact_name: ${record.contact_name}`);
      }
    }

    // Set user information for all records
    record.created_by = options.userId;
    record.modified_by = options.userId;
    
    // Set contact_owner to the current user if not provided
    if ((options.tableName === 'contacts' || options.tableName === 'contacts_module') && !record.contact_owner) {
      record.contact_owner = options.userId;
      console.log(`Row ${rowIndex + 1}: Set contact_owner to current user: ${options.userId}`);
    }

    console.log(`Row ${rowIndex + 1}: Final validated record:`, record);
    return { type: 'valid' as const, record };
  }

  private async handleDuplicate(record: any, rowIndex: number, options: ProcessOptions) {
    console.log(`Found duplicate record ${rowIndex + 1}: ${record.deal_name || record.contact_name || 'Unknown'}, skipping...`);
    return { type: 'duplicate' as const };
  }

  private async insertRecord(record: any, rowIndex: number, options: ProcessOptions) {
    try {
      // Set timestamps for new records
      const now = new Date().toISOString();
      record.created_time = now;
      record.modified_time = now;

      console.log(`Row ${rowIndex + 1}: Inserting new record:`, record);
      
      const insertResult = await this.performInsert(record, options.tableName);

      console.log(`Row ${rowIndex + 1}: Insert result:`, insertResult);

      if (insertResult.error) {
        console.error(`Row ${rowIndex + 1}: Error inserting record:`, insertResult.error);
        return {
          type: 'error' as const,
          error: `Row ${rowIndex + 1}: Insert failed - ${insertResult.error.message}`
        };
      } else if (insertResult.data && insertResult.data.length > 0) {
        console.log(`Row ${rowIndex + 1}: Successfully inserted new record:`, insertResult.data[0]);
        return { type: 'success' as const };
      }

      return {
        type: 'error' as const,
        error: `Row ${rowIndex + 1}: Unknown insert error`
      };
    } catch (error: any) {
      console.error(`Row ${rowIndex + 1}: Insert exception:`, error);
      return {
        type: 'error' as const,
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
