
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
    const { headers, rows: dataRows } = CSVParser.parseCSV(text);
    
    console.log('Parsed CSV - Headers:', headers);
    console.log('Parsed CSV - Data rows:', dataRows.length);

    // Validate headers
    await this.validateHeaders(headers, options.tableName);

    const mappedHeaders = headers.map(header => ({
      original: header,
      mapped: this.mapHeader(header)
    }));

    const validHeaders = mappedHeaders.filter(h => h.mapped !== null);
    const invalidHeaders = mappedHeaders.filter(h => h.mapped === null);
    
    if (validHeaders.length === 0) {
      throw new Error('No valid headers found. Please ensure CSV headers match the expected field names.');
    }
    
    this.handleInvalidHeaders(invalidHeaders);

    return this.processRows(dataRows, mappedHeaders, options);
  }

  private async validateHeaders(headers: string[], tableName: string) {
    if (tableName === 'deals') {
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
    let successCount = 0;
    let errorCount = 0;
    let duplicateCount = 0;
    let updateCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      try {
        const record = this.mapRowToRecord(dataRows[i], mappedHeaders, i);
        
        if (!record) {
          errorCount++;
          continue;
        }

        const result = await this.processRecord(record, i, options);
        
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
        if (i % 10 === 0 && i > 0) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }

      } catch (rowError: any) {
        console.error(`Row ${i + 1}: Error processing row:`, rowError);
        errors.push(`Row ${i + 1}: Processing error - ${rowError.message}`);
        errorCount++;
      }
    }

    return { successCount, updateCount, duplicateCount, errorCount, errors };
  }

  private mapRowToRecord(row: string[], mappedHeaders: any[], rowIndex: number) {
    const record: any = {};
    
    mappedHeaders.forEach((headerMap, index) => {
      if (headerMap.mapped && index < row.length) {
        const rawValue = row[index];
        if (rawValue !== undefined && rawValue !== null && String(rawValue).trim() !== '') {
          const validatedValue = this.validateAndConvertValue(headerMap.mapped, String(rawValue).trim());
          if (validatedValue !== null && validatedValue !== undefined) {
            record[headerMap.mapped] = validatedValue;
          }
        }
      }
    });
    
    console.log(`Row ${rowIndex + 1} processed record:`, record);
    return record;
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
    const missingRequired = this.config.required.filter((field: string) => !record[field] || String(record[field]).trim() === '');
    
    if (missingRequired.length > 0) {
      // Set defaults for some missing fields
      missingRequired.forEach((field: string) => {
        if (field === 'contact_name') {
          record[field] = `Contact ${rowIndex + 1}`;
        } else if (field === 'lead_name') {
          record[field] = `Lead ${rowIndex + 1}`;
        } else if (field === 'title') {
          record[field] = `Meeting ${rowIndex + 1}`;
        }
      });
      
      // Check again after setting defaults
      const stillMissing = this.config.required.filter((field: string) => !record[field] || String(record[field]).trim() === '');
      if (stillMissing.length > 0) {
        return {
          type: 'error' as const,
          error: `Row ${rowIndex + 1}: Missing required fields: ${stillMissing.join(', ')}`
        };
      }
    }

    record.created_by = options.userId;
    if (options.tableName !== 'meetings') {
      record.modified_by = options.userId;
    }

    return { type: 'valid' as const, record };
  }

  private async handleDuplicate(record: any, rowIndex: number, options: ProcessOptions) {
    console.log(`Found duplicate record ${rowIndex + 1}: ${record.deal_name || 'Unknown'}, attempting update...`);
    
    if (options.tableName === 'deals') {
      return await this.updateDuplicateDeal(record, rowIndex, options);
    } else {
      console.log(`Row ${rowIndex + 1}: Skipping duplicate record: ${record.contact_name || record.lead_name || 'Unknown'}`);
      return { type: 'duplicate' as const };
    }
  }

  private async updateDuplicateDeal(record: any, rowIndex: number, options: ProcessOptions) {
    try {
      let updateData = { ...record };
      delete updateData.id;
      updateData.modified_by = options.userId;
      updateData.modified_at = new Date().toISOString();

      console.log(`Row ${rowIndex + 1}: Update data prepared:`, updateData);

      let updateResult;
      if (record.id && record.id.trim() !== '') {
        updateResult = await supabase
          .from('deals')
          .update(updateData)
          .eq('id', record.id.trim())
          .select('id, deal_name');
      } else {
        updateResult = await supabase
          .from('deals')
          .update(updateData)
          .eq('deal_name', record.deal_name)
          .select('id, deal_name');
      }

      if (updateResult.error) {
        console.error(`Row ${rowIndex + 1}: Error updating record:`, updateResult.error);
        return {
          type: 'error' as const,
          error: `Row ${rowIndex + 1}: Update failed for "${record.deal_name}" - ${updateResult.error.message}`
        };
      } else if (updateResult.data && updateResult.data.length > 0) {
        console.log(`Row ${rowIndex + 1}: Successfully updated existing record:`, updateResult.data[0]);
        return { type: 'update' as const };
      } else {
        console.log(`Row ${rowIndex + 1}: No records updated, treating as duplicate skip`);
        return { type: 'duplicate' as const };
      }
    } catch (updateError: any) {
      console.error(`Row ${rowIndex + 1}: Error updating duplicate record:`, updateError);
      return {
        type: 'error' as const,
        error: `Row ${rowIndex + 1}: Update error for "${record.deal_name}" - ${updateError.message}`
      };
    }
  }

  private async insertRecord(record: any, rowIndex: number, options: ProcessOptions) {
    try {
      // Set user ID for new records
      record.created_by = options.userId;
      record.modified_by = options.userId;

      console.log(`Row ${rowIndex + 1}: Inserting new record:`, record);
      
      const insertResult = await this.performInsert(record, options.tableName);

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
      return {
        type: 'error' as const,
        error: `Row ${rowIndex + 1}: Insert error - ${error.message}`
      };
    }
  }

  private async performInsert(record: any, tableName: string) {
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
          .select('id');
      
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
