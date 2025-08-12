
import { Deal, DealStage, getRequiredFieldsForStage } from "@/types/deal";

export const validateField = (field: string, value: any, stage: DealStage, formData?: Partial<Deal>): boolean => {
  const requiredFields = getRequiredFieldsForStage(stage);
  
  if (!requiredFields.includes(field)) {
    return true;
  }
  
  console.log(`Validating field ${field} with value:`, value, `(type: ${typeof value})`);
  
  // Handle dropdown/enum fields
  if (field === 'customer_need' || field === 'relationship_strength' || 
      field === 'customer_challenges' || field === 'is_recurring' || field === 'currency_type' ||
      field === 'business_value' || field === 'decision_maker_level' || field === 'rfq_status' ||
      field === 'handoff_status') {
    const isValid = value !== undefined && 
                   value !== null && 
                   value !== '' &&
                   typeof value === 'string' &&
                   value.trim() !== '';
    console.log(`Dropdown field ${field} validation result: ${isValid}`);
    return isValid;
  }
  
  // Handle numeric fields with specific ranges
  if (field === 'probability') {
    const isValid = value !== undefined && 
                   value !== null && 
                   value !== '' &&
                   typeof value === 'number' &&
                   value >= 0 && value <= 100;
    console.log(`Probability field ${field} validation result: ${isValid}`);
    return isValid;
  }
  
  if (field === 'priority') {
    const isValid = value !== undefined && 
                   value !== null && 
                   value !== '' &&
                   typeof value === 'number' &&
                   value >= 1 && value <= 5;
    console.log(`Priority field ${field} validation result: ${isValid}`);
    return isValid;
  }
  
  // Handle budget field (string in deals table)
  if (field === 'budget') {
    const isValid = value !== undefined && 
                   value !== null && 
                   value !== '' &&
                   String(value).trim() !== '';
    console.log(`Budget field ${field} validation result: ${isValid}`);
    return isValid;
  }
  
  // Handle revenue fields - must be positive numbers
  if (field === 'quarterly_revenue_q1' || field === 'quarterly_revenue_q2' || 
      field === 'quarterly_revenue_q3' || field === 'quarterly_revenue_q4') {
    const numericValue = typeof value === 'number' ? value : parseFloat(String(value));
    const isValid = value !== undefined && 
                   value !== null && 
                   !isNaN(numericValue) &&
                   numericValue >= 0;
    console.log(`Revenue field ${field} validation result: ${isValid}, numericValue: ${numericValue}`);
    return isValid;
  }
  
  // Handle total_revenue field with sum validation
  if (field === 'total_revenue') {
    const numericValue = typeof value === 'number' ? value : parseFloat(String(value));
    const isValid = value !== undefined && 
                   value !== null && 
                   !isNaN(numericValue) &&
                   numericValue >= 0;
    console.log(`Total revenue field ${field} validation result: ${isValid}, numericValue: ${numericValue}`);
    return isValid;
  }
  
  // Handle numeric fields for RFQ stage
  if (field === 'total_contract_value' || field === 'project_duration') {
    const numericValue = typeof value === 'number' ? value : parseFloat(String(value));
    const isValid = value !== undefined && 
                   value !== null && 
                   !isNaN(numericValue) &&
                   numericValue >= 0;
    console.log(`Numeric field ${field} validation result: ${isValid}, numericValue: ${numericValue}`);
    return isValid;
  }
  
  // Handle date fields
  if (field === 'start_date' || field === 'end_date' || field === 'expected_closing_date' || 
      field === 'rfq_received_date' || field === 'proposal_due_date' || 
      field === 'signed_contract_date' || field === 'implementation_start_date') {
    const isValid = value !== undefined && 
                   value !== null && 
                   value !== '' &&
                   typeof value === 'string' &&
                   value.trim() !== '';
    console.log(`Date field ${field} validation result: ${isValid}`);
    return isValid;
  }
  
  // For other fields, check for non-empty values
  const isValid = value !== undefined && 
                 value !== null && 
                 value !== '' &&
                 String(value).trim() !== '';
  console.log(`Generic field ${field} validation result: ${isValid}`);
  return isValid;
};

export const validateRequiredFields = (formData: Partial<Deal>, stage: DealStage): boolean => {
  const requiredFields = getRequiredFieldsForStage(stage);
  console.log(`=== VALIDATION DEBUG FOR STAGE: ${stage} ===`);
  console.log(`Required fields:`, requiredFields);
  console.log(`Current form data:`, formData);
  
  const validationResults = requiredFields.map(field => {
    const value = formData[field as keyof Deal];
    const isValid = validateField(field, value, stage, formData);
    console.log(`Field ${field}: value = ${JSON.stringify(value)}, isValid = ${isValid}`);
    return { field, value, isValid };
  });
  
  const allValid = validationResults.every(result => result.isValid);
  console.log(`Overall validation result: ${allValid}`);
  
  return allValid;
};

export const validateDateLogic = (formData: Partial<Deal>): { isValid: boolean; error?: string } => {
  if (formData.start_date && formData.end_date) {
    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    
    if (startDate > endDate) {
      return {
        isValid: false,
        error: 'Start date cannot be after end date'
      };
    }
  }
  
  if (formData.rfq_received_date && formData.proposal_due_date) {
    const rfqDate = new Date(formData.rfq_received_date);
    const proposalDate = new Date(formData.proposal_due_date);
    
    if (rfqDate > proposalDate) {
      return {
        isValid: false,
        error: 'RFQ received date cannot be after proposal due date'
      };
    }
  }
  
  // Validate Won stage specific date logic
  if (formData.signed_contract_date) {
    const signedDate = new Date(formData.signed_contract_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to compare dates only
    
    if (signedDate > today) {
      return {
        isValid: false,
        error: 'Signed contract date cannot be in the future'
      };
    }
  }
  
  if (formData.implementation_start_date) {
    const implementationDate = new Date(formData.implementation_start_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to compare dates only
    
    if (implementationDate > today) {
      return {
        isValid: false,
        error: 'Implementation start date cannot be in the future'
      };
    }
    
    // Check if handoff_status is required when implementation_start_date is set
    if (!formData.handoff_status || formData.handoff_status.trim() === '') {
      return {
        isValid: false,
        error: 'Handoff status is required when implementation start date is set'
      };
    }
  }
  
  return { isValid: true };
};

export const validateRevenueSum = (formData: Partial<Deal>): { isValid: boolean; error?: string } => {
  const q1 = Number(formData.quarterly_revenue_q1) || 0;
  const q2 = Number(formData.quarterly_revenue_q2) || 0;
  const q3 = Number(formData.quarterly_revenue_q3) || 0;
  const q4 = Number(formData.quarterly_revenue_q4) || 0;
  const total = Number(formData.total_revenue) || 0;
  
  // If any quarterly revenue is filled, check if total matches sum
  if (q1 > 0 || q2 > 0 || q3 > 0 || q4 > 0) {
    const expectedTotal = q1 + q2 + q3 + q4;
    if (Math.abs(total - expectedTotal) > 0.01) { // Allow for small floating point differences
      return {
        isValid: false,
        error: `Total revenue (${total}) must equal sum of quarterly revenues (${expectedTotal})`
      };
    }
  }
  
  return { isValid: true };
};

export const getFieldErrors = (formData: Partial<Deal>, stage: DealStage): Record<string, string> => {
  const requiredFields = getRequiredFieldsForStage(stage);
  const errors: Record<string, string> = {};
  
  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      // Lead stage fields
      project_name: 'Project Name',
      customer_name: 'Customer Name',
      lead_name: 'Lead Name',
      lead_owner: 'Lead Owner',
      region: 'Region',
      priority: 'Priority',
      // Discussion stage fields
      customer_need: 'Customer Need',
      relationship_strength: 'Relationship Strength',
      internal_comment: 'Internal Comment',
      // Qualified stage fields
      customer_challenges: 'Customer Challenges',
      budget: 'Budget',
      probability: 'Probability (%)',
      expected_closing_date: 'Expected Closing Date',
      is_recurring: 'Is Recurring?',
      business_value: 'Business Value',
      decision_maker_level: 'Decision Maker Level',
      // RFQ stage fields
      total_contract_value: 'Total Contract Value',
      currency_type: 'Currency Type',
      start_date: 'Start Date',
      end_date: 'End Date',
      project_duration: 'Project Duration (months)',
      rfq_received_date: 'RFQ Received Date',
      proposal_due_date: 'Proposal Due Date',
      rfq_status: 'RFQ Status',
      action_items: 'Action Items',
      // Offered stage fields
      current_status: 'Current Status',
      closing: 'Closing',
      // Won stage fields
      won_reason: 'Won Reason',
      quarterly_revenue_q1: 'Q1 Revenue',
      quarterly_revenue_q2: 'Q2 Revenue',
      quarterly_revenue_q3: 'Q3 Revenue',
      quarterly_revenue_q4: 'Q4 Revenue',
      total_revenue: 'Total Revenue',
      signed_contract_date: 'Signed Contract Date',
      implementation_start_date: 'Implementation Start Date',
      handoff_status: 'Handoff Status',
      // Final stage fields
      lost_reason: 'Lost Reason',
      need_improvement: 'Need Improvement',
      drop_reason: 'Drop Reason',
      // System fields
      deal_name: 'Deal Name',
    };
    return labels[field] || field;
  };
  
  requiredFields.forEach(field => {
    const value = formData[field as keyof Deal];
    
    if (!validateField(field, value, stage, formData)) {
      errors[field] = `${getFieldLabel(field)} is required`;
    }
  });
  
  // Add date logic validation
  const dateValidation = validateDateLogic(formData);
  if (!dateValidation.isValid && dateValidation.error) {
    if (dateValidation.error.includes('Start date')) {
      errors['start_date'] = dateValidation.error;
    } else if (dateValidation.error.includes('RFQ received date')) {
      errors['rfq_received_date'] = dateValidation.error;
    } else if (dateValidation.error.includes('Signed contract date')) {
      errors['signed_contract_date'] = dateValidation.error;
    } else if (dateValidation.error.includes('Implementation start date')) {
      errors['implementation_start_date'] = dateValidation.error;
    } else if (dateValidation.error.includes('Handoff status')) {
      errors['handoff_status'] = dateValidation.error;
    }
  }
  
  // Add revenue sum validation for Won stage
  if (stage === 'Won') {
    const revenueValidation = validateRevenueSum(formData);
    if (!revenueValidation.isValid && revenueValidation.error) {
      errors['total_revenue'] = revenueValidation.error;
    }
  }
  
  return errors;
};
