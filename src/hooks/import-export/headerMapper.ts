import { getColumnConfig } from './columnConfig';

export const createHeaderMapper = (tableName: string) => {
  const config = getColumnConfig(tableName);

  return (header: string): string | null => {
    const trimmedHeader = header.trim();
    
    console.log(`Mapping header: "${trimmedHeader}"`);
    
    // For contacts, create specific field mappings
    if (tableName === 'contacts' || tableName === 'contacts_module') {
      // Direct field matches first (case-insensitive)
      const directMatch = config.allowedColumns.find(col => 
        col.toLowerCase() === trimmedHeader.toLowerCase()
      );
      if (directMatch) {
        console.log(`Direct field match found: ${trimmedHeader} -> ${directMatch}`);
        return directMatch;
      }
      
      // Contact-specific field mappings (case-insensitive)
      const contactMappings: Record<string, string> = {
        'id': 'id',
        'contact id': 'id',
        'contact_id': 'id',
        'contact_name': 'contact_name',
        'contact name': 'contact_name',
        'name': 'contact_name',
        'full name': 'contact_name',
        'company_name': 'company_name',
        'company name': 'company_name',
        'company': 'company_name',
        'organization': 'company_name',
        'position': 'position',
        'title': 'position',
        'job title': 'position',
        'email': 'email',
        'email address': 'email',
        'phone_no': 'phone_no',
        'phone': 'phone_no',
        'telephone': 'phone_no',
        'phone number': 'phone_no',
        'linkedin': 'linkedin',
        'linkedin url': 'linkedin',
        'linkedin profile': 'linkedin',
        'website': 'website',
        'website url': 'website',
        'web': 'website',
        'contact_source': 'contact_source',
        'contact source': 'contact_source',
        'source': 'contact_source',
        'lead source': 'contact_source',
        'industry': 'industry',
        'sector': 'industry',
        'region': 'region',
        'country': 'region',
        'nation': 'region',
        'description': 'description',
        'notes': 'description',
        'comments': 'description',
        'remarks': 'description',
        'contact_owner': 'contact_owner',
        'contact owner': 'contact_owner',
        'owner': 'contact_owner',
        'created_by': 'created_by',
        'created by': 'created_by',
        'creator': 'created_by',
        'modified_by': 'modified_by',
        'modified by': 'modified_by',
        'modifier': 'modified_by',
        'created_time': 'created_time',
        'created time': 'created_time',
        'created at': 'created_time',
        'creation date': 'created_time',
        'modified_time': 'modified_time',
        'modified time': 'modified_time',
        'modified at': 'modified_time',
        'modification date': 'modified_time'
      };
      
      // Check for mapping (case-insensitive)
      const lowerHeader = trimmedHeader.toLowerCase();
      for (const [key, value] of Object.entries(contactMappings)) {
        if (key.toLowerCase() === lowerHeader) {
          console.log(`Contact mapping found: ${trimmedHeader} -> ${value}`);
          return value;
        }
      }
      
      console.log(`No mapping found for contacts field: ${trimmedHeader}`);
      return null;
    }
    
    // For deals, updated mappings after field removal
    if (tableName === 'deals') {
      // Direct field matches first (case-insensitive)
      const directMatch = config.allowedColumns.find(col => 
        col.toLowerCase() === trimmedHeader.toLowerCase()
      );
      if (directMatch) {
        console.log(`Direct field match found: ${trimmedHeader} -> ${directMatch}`);
        return directMatch;
      }
      
      // Updated field mappings for deals - removed deleted fields
      const dealMappings: Record<string, string> = {
        // Core deal fields
        'deal_name': 'deal_name',
        'deal name': 'deal_name',
        'dealname': 'deal_name',
        'name': 'deal_name',
        'project_name': 'project_name',
        'project name': 'project_name',
        'project': 'project_name',
        'stage': 'stage',
        'deal stage': 'stage',
        'status': 'stage',
        'customer_name': 'customer_name',
        'customer name': 'customer_name',
        'customer': 'customer_name',
        'client': 'customer_name',
        'lead_name': 'lead_name',
        'lead name': 'lead_name',
        'lead': 'lead_name',
        'contact': 'lead_name',
        'lead_owner': 'lead_owner',
        'lead owner': 'lead_owner',
        'owner': 'lead_owner',
        'account owner': 'lead_owner',
        'sales owner': 'lead_owner',
        'assigned to': 'lead_owner',
        'region': 'region',
        'territory': 'region',
        'area': 'region',
        'priority': 'priority',
        'deal priority': 'priority',
        'internal_comment': 'internal_comment',
        'internal comment': 'internal_comment',
        'notes': 'internal_comment',
        'comments': 'internal_comment',
        
        // Discussions stage
        'customer_need': 'customer_need',
        'customer need': 'customer_need',
        'customer needs': 'customer_need',
        'need': 'customer_need',
        'requirements': 'customer_need',
        'customer_challenges': 'customer_challenges',
        'customer challenges': 'customer_challenges',
        'challenges': 'customer_challenges',
        'relationship_strength': 'relationship_strength',
        'relationship strength': 'relationship_strength',
        'relationship': 'relationship_strength',
        
        // Qualified stage
        'budget': 'budget',
        'deal budget': 'budget',
        'estimated budget': 'budget',
        'probability': 'probability',
        'win probability': 'probability',
        'chance': 'probability',
        'likelihood': 'probability',
        'expected_closing_date': 'expected_closing_date',
        'expected closing date': 'expected_closing_date',
        'closing date': 'expected_closing_date',
        'close date': 'expected_closing_date',
        'expected close': 'expected_closing_date',
        'due date': 'expected_closing_date',
        'business_value': 'business_value',
        'business value': 'business_value',
        'value proposition': 'business_value',
        'decision_maker_level': 'decision_maker_level',
        'decision maker level': 'decision_maker_level',
        'decision maker': 'decision_maker_level',
        
        // RFQ stage
        'is_recurring': 'is_recurring',
        'is recurring': 'is_recurring',
        'recurring': 'is_recurring',
        'repeat': 'is_recurring',
        'total_contract_value': 'total_contract_value',
        'total contract value': 'total_contract_value',
        'contract value': 'total_contract_value',
        'deal value': 'total_contract_value',
        'value': 'total_contract_value',
        'deal amount': 'total_contract_value',
        'currency_type': 'currency_type',
        'currency type': 'currency_type',
        'currency': 'currency_type',
        'start_date': 'start_date',
        'start date': 'start_date',
        'project start': 'start_date',
        'begin date': 'start_date',
        'end_date': 'end_date',
        'end date': 'end_date',
        'project end': 'end_date',
        'finish date': 'end_date',
        'project_duration': 'project_duration',
        'project duration': 'project_duration',
        'duration': 'project_duration',
        'length': 'project_duration',
        'action_items': 'action_items',
        'action items': 'action_items',
        'actions': 'action_items',
        'next steps': 'action_items',
        'rfq_received_date': 'rfq_received_date',
        'rfq received date': 'rfq_received_date',
        'rfq date': 'rfq_received_date',
        'proposal_due_date': 'proposal_due_date',
        'proposal due date': 'proposal_due_date',
        'proposal date': 'proposal_due_date',
        'rfq_status': 'rfq_status',
        'rfq status': 'rfq_status',
        'rfq state': 'rfq_status',
        
        // Offered stage
        'current_status': 'current_status',
        'current status': 'current_status',
        'closing': 'closing',
        'closing notes': 'closing',
        'close status': 'closing',
        
        // Won stage
        'won_reason': 'won_reason',
        'won reason': 'won_reason',
        'win reason': 'won_reason',
        'why won': 'won_reason',
        'quarterly_revenue_q1': 'quarterly_revenue_q1',
        'quarterly revenue q1': 'quarterly_revenue_q1',
        'q1 revenue': 'quarterly_revenue_q1',
        'q1': 'quarterly_revenue_q1',
        'quarterly_revenue_q2': 'quarterly_revenue_q2',
        'quarterly revenue q2': 'quarterly_revenue_q2',
        'q2 revenue': 'quarterly_revenue_q2',
        'q2': 'quarterly_revenue_q2',
        'quarterly_revenue_q3': 'quarterly_revenue_q3',
        'quarterly revenue q3': 'quarterly_revenue_q3',
        'q3 revenue': 'quarterly_revenue_q3',
        'q3': 'quarterly_revenue_q3',
        'quarterly_revenue_q4': 'quarterly_revenue_q4',
        'quarterly revenue q4': 'quarterly_revenue_q4',
        'q4 revenue': 'quarterly_revenue_q4',
        'q4': 'quarterly_revenue_q4',
        'total_revenue': 'total_revenue',
        'total revenue': 'total_revenue',
        'revenue': 'total_revenue',
        'signed_contract_date': 'signed_contract_date',
        'signed contract date': 'signed_contract_date',
        'contract date': 'signed_contract_date',
        'signature date': 'signed_contract_date',
        'implementation_start_date': 'implementation_start_date',
        'implementation start date': 'implementation_start_date',
        'implementation date': 'implementation_start_date',
        'handoff_status': 'handoff_status',
        'handoff status': 'handoff_status',
        'handoff': 'handoff_status',
        
        // Lost/Dropped stages
        'lost_reason': 'lost_reason',
        'lost reason': 'lost_reason',
        'loss reason': 'lost_reason',
        'why lost': 'lost_reason',
        'need_improvement': 'need_improvement',
        'need improvement': 'need_improvement',
        'improvement': 'need_improvement',
        'lessons learned': 'need_improvement',
        'drop_reason': 'drop_reason',
        'drop reason': 'drop_reason',
        'dropped reason': 'drop_reason',
        'why dropped': 'drop_reason'
      };
      
      // Check for mapping (case-insensitive)
      const lowerHeader = trimmedHeader.toLowerCase();
      for (const [key, value] of Object.entries(dealMappings)) {
        if (key.toLowerCase() === lowerHeader) {
          console.log(`Deal mapping found: ${trimmedHeader} -> ${value}`);
          return value;
        }
      }
      
      console.log(`No mapping found for deals field: ${trimmedHeader}`);
      return null;
    }
    
    // For other tables, use normalized matching with case-insensitive search
    const normalized = trimmedHeader.toLowerCase().replace(/[\s_-]+/g, '_');
    
    // Direct match first (case-insensitive)
    const directMatch = config.allowedColumns.find(col => 
      col.toLowerCase() === normalized || col.toLowerCase() === trimmedHeader.toLowerCase()
    );
    if (directMatch) {
      console.log(`Direct match found: ${trimmedHeader} -> ${directMatch}`);
      return directMatch;
    }
    
    // Generic mappings for other tables (case-insensitive)
    const mappings: Record<string, string> = {
      'name': tableName === 'leads' ? 'lead_name' : 'contact_name',
      'full_name': tableName === 'leads' ? 'lead_name' : 'contact_name',
      'contact': tableName === 'leads' ? 'lead_name' : 'contact_name',
      'company': 'company_name',
      'organization': 'company_name',
      'job_title': 'position',
      'title': tableName === 'meetings' ? 'title' : 'position',
      'phone': 'phone_no',
      'telephone': 'phone_no',
      'mobile': 'mobile_no',
      'cell': 'mobile_no',
      'employees': 'no_of_employees',
      'revenue': 'annual_revenue',
      'source': 'contact_source',
      'status': tableName === 'meetings' ? 'status' : 'lead_status',
      'lead': 'lead_status'
    };
    
    const lowerHeader = trimmedHeader.toLowerCase();
    for (const [key, value] of Object.entries(mappings)) {
      if (key === lowerHeader || key.replace(/[\s_-]+/g, '_') === normalized) {
        console.log(`Generic mapping found: ${trimmedHeader} -> ${value}`);
        return value;
      }
    }
    
    console.log(`No mapping found for: ${trimmedHeader}`);
    return null;
  };
};
