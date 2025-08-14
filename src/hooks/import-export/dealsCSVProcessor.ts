import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CSVParser } from '@/utils/csvParser';

interface DealsProcessOptions {
  userId: string;
  onProgress?: (processed: number, total: number) => void;
}

// Updated field mapping after database field removal - removed deleted fields
const DEALS_FIELDS = [
  'deal_name', 'stage', 'internal_comment', 'project_name', 'lead_name',
  'customer_name', 'region', 'lead_owner', 'priority', 'customer_need', 
  'relationship_strength', 'budget', 'probability', 'expected_closing_date', 
  'is_recurring', 'customer_challenges', 'business_value', 'decision_maker_level', 
  'total_contract_value', 'currency_type', 'start_date', 'end_date', 
  'project_duration', 'action_items', 'rfq_received_date', 'proposal_due_date', 
  'rfq_status', 'current_status', 'closing', 'won_reason', 'quarterly_revenue_q1', 
  'quarterly_revenue_q2', 'quarterly_revenue_q3', 'quarterly_revenue_q4', 
  'total_revenue', 'signed_contract_date', 'implementation_start_date', 
  'handoff_status', 'lost_reason', 'need_improvement', 'drop_reason'
];

export class DealsCSVProcessor {
  
  async processCSV(text: string, options: DealsProcessOptions) {
    console.log('DealsCSVProcessor: Starting CSV processing');
    
    try {
      const { headers, rows: dataRows } = CSVParser.parseCSV(text);
      
      console.log('DealsCSVProcessor: Headers:', headers);
      console.log('DealsCSVProcessor: Data rows:', dataRows.length);

      if (headers.length === 0) {
        throw new Error('No headers found in CSV file');
      }

      if (dataRows.length === 0) {
        throw new Error('No data rows found in CSV file');
      }

      return await this.processRows(dataRows, headers, options);
    } catch (error) {
      console.error('DealsCSVProcessor: Error:', error);
      throw error;
    }
  }

  private async processRows(dataRows: string[][], headers: string[], options: DealsProcessOptions) {
    console.log('DealsCSVProcessor: Processing rows:', dataRows.length);
    
    let successCount = 0;
    let updateCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Create header mapping - normalize headers to match our field names
    const headerMap = this.createHeaderMapping(headers);
    console.log('DealsCSVProcessor: Header mapping:', headerMap);

    for (let i = 0; i < dataRows.length; i++) {
      try {
        console.log(`DealsCSVProcessor: Processing row ${i + 1}:`, dataRows[i]);
        
        const record = this.mapRowToRecord(dataRows[i], headerMap, i);
        
        if (!record || Object.keys(record).length === 0) {
          console.log(`DealsCSVProcessor: Row ${i + 1}: Skipping empty record`);
          errorCount++;
          continue;
        }

        console.log(`DealsCSVProcessor: Row ${i + 1}: Mapped record:`, record);

        // Ensure we have a valid deal name for duplicate checking
        if (!record.deal_name || record.deal_name.trim() === '') {
          record.deal_name = record.project_name || `Deal ${i + 1}`;
        }

        // Check if deal with same deal_name already exists
        const existingDeal = await this.findExistingDealByName(record.deal_name);
        
        if (existingDeal) {
          // Update existing deal
          await this.updateDeal(existingDeal.id, record, options.userId);
          updateCount++;
          console.log(`DealsCSVProcessor: Row ${i + 1}: Updated existing deal "${record.deal_name}"`);
        } else {
          // Create new deal
          await this.insertDeal(record, options.userId);
          successCount++;
          console.log(`DealsCSVProcessor: Row ${i + 1}: Inserted new deal "${record.deal_name}"`);
        }

        if (options.onProgress) {
          options.onProgress(i + 1, dataRows.length);
        }

        // Small delay to prevent overwhelming the database
        if (i % 5 === 0 && i > 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (rowError: any) {
        console.error(`DealsCSVProcessor: Row ${i + 1}: Error:`, rowError);
        errors.push(`Row ${i + 1}: ${rowError.message}`);
        errorCount++;
      }
    }

    const result = { successCount, updateCount, duplicateCount: 0, errorCount, errors };
    console.log('DealsCSVProcessor: Final result:', result);
    
    return result;
  }

  private createHeaderMapping(headers: string[]): Record<number, string> {
    const mapping: Record<number, string> = {};
    
    headers.forEach((header, index) => {
      const normalized = this.normalizeHeader(header);
      if (DEALS_FIELDS.includes(normalized)) {
        mapping[index] = normalized;
      }
    });
    
    return mapping;
  }

  private normalizeHeader(header: string): string {
    // Normalize header to match our field names exactly
    const normalized = header.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
    
    // Direct mapping for remaining fields only
    const mappings: Record<string, string> = {
      'deal_name': 'deal_name',
      'name': 'deal_name',
      'title': 'deal_name',
      'stage': 'stage',
      'internal_comment': 'internal_comment',
      'comment': 'internal_comment',
      'comments': 'internal_comment',
      'project_name': 'project_name',
      'project': 'project_name',
      'lead_name': 'lead_name',
      'lead': 'lead_name',
      'customer_name': 'customer_name',
      'customer': 'customer_name',
      'client': 'customer_name',
      'region': 'region',
      'lead_owner': 'lead_owner',
      'owner': 'lead_owner',
      'priority': 'priority',
      'customer_need': 'customer_need',
      'need': 'customer_need',
      'relationship_strength': 'relationship_strength',
      'budget': 'budget',
      'probability': 'probability',
      'expected_closing_date': 'expected_closing_date',
      'closing_date': 'expected_closing_date',
      'is_recurring': 'is_recurring',
      'recurring': 'is_recurring',
      'customer_challenges': 'customer_challenges',
      'challenges': 'customer_challenges',
      'business_value': 'business_value',
      'value': 'business_value',
      'decision_maker_level': 'decision_maker_level',
      'total_contract_value': 'total_contract_value',
      'contract_value': 'total_contract_value',
      'currency_type': 'currency_type',
      'currency': 'currency_type',
      'start_date': 'start_date',
      'end_date': 'end_date',
      'project_duration': 'project_duration',
      'duration': 'project_duration',
      'action_items': 'action_items',
      'actions': 'action_items',
      'rfq_received_date': 'rfq_received_date',
      'proposal_due_date': 'proposal_due_date',
      'rfq_status': 'rfq_status',
      'current_status': 'current_status',
      'status': 'current_status',
      'closing': 'closing',
      'won_reason': 'won_reason',
      'quarterly_revenue_q1': 'quarterly_revenue_q1',
      'q1': 'quarterly_revenue_q1',
      'quarterly_revenue_q2': 'quarterly_revenue_q2',
      'q2': 'quarterly_revenue_q2',
      'quarterly_revenue_q3': 'quarterly_revenue_q3',
      'q3': 'quarterly_revenue_q3',
      'quarterly_revenue_q4': 'quarterly_revenue_q4',
      'q4': 'quarterly_revenue_q4',
      'total_revenue': 'total_revenue',
      'revenue': 'total_revenue',
      'signed_contract_date': 'signed_contract_date',
      'implementation_start_date': 'implementation_start_date',
      'handoff_status': 'handoff_status',
      'lost_reason': 'lost_reason',
      'need_improvement': 'need_improvement',
      'drop_reason': 'drop_reason'
    };
    
    return mappings[normalized] || normalized;
  }

  private mapRowToRecord(row: string[], headerMap: Record<number, string>, rowIndex: number) {
    const record: any = {};
    let hasValidData = false;
    
    Object.entries(headerMap).forEach(([indexStr, fieldName]) => {
      const index = parseInt(indexStr);
      if (index < row.length) {
        const rawValue = row[index];
        if (rawValue !== undefined && rawValue !== null && String(rawValue).trim() !== '') {
          record[fieldName] = this.convertValue(fieldName, String(rawValue).trim());
          hasValidData = true;
        }
      }
    });
    
    console.log(`DealsCSVProcessor: Row ${rowIndex + 1} processed record:`, record);
    
    return hasValidData ? record : null;
  }

  private convertValue(fieldName: string, value: string): any {
    // No validation - just basic type conversion
    if (!value || value === '') return null;
    
    // Numbers - only for remaining numeric fields
    if (['probability', 'total_contract_value', 'quarterly_revenue_q1', 
         'quarterly_revenue_q2', 'quarterly_revenue_q3', 'quarterly_revenue_q4', 
         'total_revenue', 'project_duration'].includes(fieldName)) {
      const num = parseFloat(value);
      return isNaN(num) ? null : num;
    }
    
    // Just return the string value for everything else
    return value;
  }

  private async findExistingDealByName(dealName: string): Promise<{ id: string } | null> {
    if (!dealName || dealName.trim() === '') {
      return null;
    }

    try {
      const trimmedName = dealName.trim();
      console.log('DealsCSVProcessor: Checking for existing deal with name (case-insensitive):', trimmedName);
      
      // Use ilike for case-insensitive exact match
      const { data, error } = await supabase
        .from('deals')
        .select('id, deal_name, stage')
        .ilike('deal_name', trimmedName)
        .limit(1);

      if (error) {
        console.error('DealsCSVProcessor: Error checking for existing deal:', error);
        return null;
      }

      if (data && data.length > 0) {
        console.log('DealsCSVProcessor: Found existing deal:', data[0]);
        return data[0];
      }

      console.log('DealsCSVProcessor: No existing deal found with name:', trimmedName);
      return null;
    } catch (error) {
      console.error('DealsCSVProcessor: Exception checking for existing deal:', error);
      return null;
    }
  }

  private async updateDeal(dealId: string, record: any, userId: string) {
    // Set user information and timestamps
    record.modified_by = userId;
    record.modified_at = new Date().toISOString();

    console.log('DealsCSVProcessor: Updating deal:', dealId, 'with data:', record);
    
    const { data, error } = await supabase
      .from('deals')
      .update(record)
      .eq('id', dealId)
      .select('id, deal_name');

    if (error) {
      console.error('DealsCSVProcessor: Update error:', error);
      throw new Error(`Update failed - ${error.message}`);
    }

    console.log('DealsCSVProcessor: Successfully updated:', data[0]);
    return data[0];
  }

  private async insertDeal(record: any, userId: string) {
    // Set user information and timestamps
    record.created_by = userId;
    record.modified_by = userId;
    record.created_at = new Date().toISOString();
    record.modified_at = new Date().toISOString();

    console.log('DealsCSVProcessor: Inserting new deal:', record);
    
    const { data, error } = await supabase
      .from('deals')
      .insert([record])
      .select('id, deal_name');

    if (error) {
      console.error('DealsCSVProcessor: Insert error:', error);
      throw new Error(`Insert failed - ${error.message}`);
    }

    console.log('DealsCSVProcessor: Successfully inserted:', data[0]);
    return data[0];
  }
}
