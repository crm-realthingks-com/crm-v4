
import { downloadCSV } from '@/utils/csvUtils';

// Updated field order after database field removal - removed deleted fields
const DEALS_EXPORT_FIELDS = [
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

export class DealsCSVExporter {
  
  async exportToCSV(deals: any[], filename: string) {
    console.log('DealsCSVExporter: Exporting', deals.length, 'deals');
    
    if (!deals || deals.length === 0) {
      throw new Error('No deals to export');
    }

    // Create CSV header row
    const headers = DEALS_EXPORT_FIELDS;

    // Convert deals to CSV rows - exact field mapping
    const csvRows = deals.map(deal => 
      DEALS_EXPORT_FIELDS.map(field => {
        const value = deal[field];
        return value !== undefined && value !== null ? String(value) : '';
      })
    );

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

    console.log('DealsCSVExporter: CSV content generated, length:', csvContent.length);
    
    // Download the CSV file
    const success = downloadCSV(csvContent, filename);
    
    if (!success) {
      throw new Error('Failed to download CSV file');
    }
    
    console.log('DealsCSVExporter: Export completed successfully');
  }
}
