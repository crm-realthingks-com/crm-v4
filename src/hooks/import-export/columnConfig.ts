// Simplified interface for column configuration
interface ColumnConfig {
  allowedColumns: string[];
  required: string[];
  enums: Record<string, string[]>;
}

// Define column mappings for different modules
export const getColumnConfig = (table: string): ColumnConfig => {
  const configs: Record<string, ColumnConfig> = {
    contacts_module: {
      allowedColumns: [
        'id',
        'contact_name',
        'company_name',
        'position',
        'email',
        'phone_no',
        'linkedin',
        'website',
        'contact_source',
        'industry',
        'region',
        'description',
        'contact_owner',
        'created_by',
        'modified_by',
        'created_time',
        'modified_time'
      ],
      required: ['contact_name'],
      enums: {
        contact_source: ['Website', 'Referral', 'Cold Call', 'Email', 'Social Media', 'Trade Show', 'Other'],
        industry: ['Automotive', 'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Other']
      }
    },
    contacts: {
      allowedColumns: [
        'id',
        'contact_name',
        'company_name',
        'position',
        'email',
        'phone_no',
        'linkedin',
        'website',
        'contact_source',
        'industry',
        'region',
        'description',
        'contact_owner',
        'created_by',
        'modified_by',
        'created_time',
        'modified_time'
      ],
      required: ['contact_name'],
      enums: {
        contact_source: ['Website', 'Referral', 'Cold Call', 'Email', 'Social Media', 'Trade Show', 'Other'],
        industry: ['Automotive', 'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Other']
      }
    },
    leads: {
      allowedColumns: [
        'lead_name',
        'contact_name',
        'company_name',
        'position',
        'email',
        'phone_no',
        'mobile_no',
        'linkedin',
        'website',
        'contact_source',
        'lead_status',
        'industry',
        'no_of_employees',
        'annual_revenue',
        'city',
        'state',
        'country',
        'description',
        'contact_owner',
        'lead_owner'
      ],
      required: ['lead_name', 'contact_owner'],
      enums: {
        contact_source: ['Website', 'Referral', 'Cold Call', 'Email', 'Social Media', 'Trade Show', 'Other'],
        lead_status: ['New', 'Contacted', 'Qualified', 'Lost'],
        industry: ['Automotive', 'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Other']
      }
    },
    meetings: {
      allowedColumns: [
        'title',
        'start_time',
        'end_time',
        'location',
        'agenda',
        'outcome',
        'next_action',
        'status',
        'priority',
        'participants',
        'teams_link',
        'lead_id',
        'contact_id',
        'deal_id',
        'tags',
        'follow_up_required',
        'host'
      ],
      required: ['title', 'start_time', 'end_time'],
      enums: {
        status: ['scheduled', 'in_progress', 'completed', 'cancelled'],
        priority: ['Low', 'Medium', 'High', 'Critical']
      }
    },
    deals: {
      allowedColumns: [
        'deal_name',
        'stage',
        'internal_comment',
        'project_name',
        'lead_name',
        'customer_name',
        'region',
        'lead_owner',
        'priority',
        'customer_need',
        'relationship_strength',
        'budget',
        'probability',
        'expected_closing_date',
        'is_recurring',
        'customer_challenges',
        'business_value',
        'decision_maker_level',
        'total_contract_value',
        'currency_type',
        'start_date',
        'end_date',
        'project_duration',
        'action_items',
        'rfq_received_date',
        'proposal_due_date',
        'rfq_status',
        'current_status',
        'closing',
        'won_reason',
        'quarterly_revenue_q1',
        'quarterly_revenue_q2',
        'quarterly_revenue_q3',
        'quarterly_revenue_q4',
        'total_revenue',
        'signed_contract_date',
        'implementation_start_date',
        'handoff_status',
        'lost_reason',
        'need_improvement',
        'drop_reason'
      ],
      required: ['deal_name', 'stage'],
      enums: {
        stage: ['Lead', 'Discussions', 'Qualified', 'RFQ', 'Offered', 'Won', 'Lost', 'Dropped'],
        currency_type: ['EUR', 'USD', 'INR'],
        customer_challenges: ['Open', 'Ongoing', 'Done'],
        relationship_strength: ['Low', 'Medium', 'High'],
        business_value: ['Open', 'Ongoing', 'Done'],
        decision_maker_level: ['Open', 'Ongoing', 'Done'],
        is_recurring: ['Yes', 'No', 'Unclear'],
        rfq_status: ['Drafted', 'Submitted', 'Rejected', 'Accepted'],
        handoff_status: ['Not Started', 'In Progress', 'Complete']
      }
    }
  };
  return configs[table] || configs.contacts_module;
};
