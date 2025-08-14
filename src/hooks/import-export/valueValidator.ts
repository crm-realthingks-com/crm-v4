
import { getColumnConfig } from './columnConfig';

export const createValueValidator = (tableName: string) => {
  const config = getColumnConfig(tableName);

  return (key: string, value: string) => {
    if (!value || value.trim() === '') return null;

    console.log(`Validating field ${key} with value: ${value}`);

    // Handle enum validations with exact matching
    if (key in config.enums) {
      const enumValues = config.enums[key];
      if (enumValues && enumValues.includes(value)) {
        return value;
      }
      // Try case-insensitive match
      const normalizedValue = value.trim();
      const matchedValue = enumValues.find(enumVal => enumVal.toLowerCase() === normalizedValue.toLowerCase());
      if (matchedValue) {
        return matchedValue;
      }
      // For critical fields like stage, return null if invalid
      if (key === 'stage') {
        console.warn(`Invalid stage value: ${value}, available values: ${enumValues.join(', ')}`);
        return null;
      }
      // For other enums, return null to avoid setting invalid values
      console.warn(`Invalid enum value for ${key}: ${value}, available values: ${enumValues.join(', ')}`);
      return null;
    }

    // Handle specific field types for deals - updated for remaining fields only
    if (tableName === 'deals') {
      switch (key) {
        case 'priority':
          if (value === '' || value === 'null' || value === 'undefined') return null;
          const priority = parseInt(value);
          return isNaN(priority) ? null : Math.max(1, Math.min(5, priority));
        
        case 'probability':
          if (value === '' || value === 'null' || value === 'undefined') return null;
          const prob = parseInt(value);
          return isNaN(prob) ? null : Math.max(0, Math.min(100, prob));
        
        case 'project_duration':
          if (value === '' || value === 'null' || value === 'undefined') return null;
          const duration = parseInt(value);
          return isNaN(duration) ? null : Math.max(0, duration);
        
        case 'total_contract_value':
        case 'quarterly_revenue_q1':
        case 'quarterly_revenue_q2':
        case 'quarterly_revenue_q3':
        case 'quarterly_revenue_q4':
        case 'total_revenue':
          if (value === '' || value === 'null' || value === 'undefined') return null;
          const revenue = parseFloat(value.replace(/[€$,]/g, ''));
          return isNaN(revenue) ? null : Math.max(0, revenue);
        
        case 'start_date':
        case 'end_date':
        case 'expected_closing_date':
        case 'rfq_received_date':
        case 'proposal_due_date':
        case 'signed_contract_date':
        case 'implementation_start_date':
          if (value === '' || value === 'null' || value === 'undefined') return null;
          // Handle exported date format (YYYY-MM-DD)
          const date = new Date(value);
          return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
        
        // Text fields - only remaining ones
        case 'deal_name':
        case 'project_name':
        case 'lead_name':
        case 'customer_name':
        case 'region':
        case 'lead_owner':
        case 'budget':
        case 'internal_comment':
        case 'customer_need':
        case 'action_items':
        case 'current_status':
        case 'closing':
        case 'won_reason':
        case 'lost_reason':
        case 'need_improvement':
        case 'drop_reason':
          if (value === '' || value === 'null' || value === 'undefined') return null;
          return value.trim();
        
        default:
          if (value === '' || value === 'null' || value === 'undefined') return null;
          return value.trim();
      }
    }

    // Handle specific field types for other tables
    switch (key) {
      case 'no_of_employees':
        const employees = parseInt(value);
        return isNaN(employees) ? null : employees;
      
      case 'annual_revenue':
      case 'amount':
      case 'rfq_value':
        const revenue = parseFloat(value.replace(/[$,]/g, ''));
        return isNaN(revenue) ? null : revenue;
      
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) ? value : null;
      
      // Time fields for meetings
      case 'start_time':
      case 'end_time':
        if (tableName === 'meetings') {
          const date = new Date(value);
          return isNaN(date.getTime()) ? null : date.toISOString();
        }
        return value.trim();
      
      case 'participants':
        // Handle comma-separated email list
        if (tableName === 'meetings') {
          return value.split(',').map(email => email.trim()).filter(email => email);
        }
        return value.trim();
        
      case 'tags':
        // Handle comma-separated tags list
        if (tableName === 'meetings') {
          return value.split(',').map(tag => tag.trim()).filter(tag => tag);
        }
        return value.trim();
        
      case 'follow_up_required':
        if (tableName === 'meetings') {
          return ['yes', 'true', '1', 'on'].includes(value.toLowerCase());
        }
        return value.trim();
      
      default:
        return value.trim();
    }
  };
};
