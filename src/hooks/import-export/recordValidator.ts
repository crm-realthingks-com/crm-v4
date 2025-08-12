
import { getColumnConfig } from './columnConfig';

export const createRecordValidator = (tableName: string) => {
  const config = getColumnConfig(tableName);

  return (record: any): boolean => {
    console.log('Validating import record:', record);
    
    if (tableName === 'deals') {
      // Check if we have the basic required fields
      const hasValidDealName = record.deal_name && typeof record.deal_name === 'string' && record.deal_name.trim() !== '';
      const validStages = ['Lead', 'Discussions', 'Qualified', 'RFQ', 'Offered', 'Won', 'Lost', 'Dropped'];
      const hasValidStage = record.stage && validStages.includes(record.stage);
      
      console.log(`Import validation - deal_name: "${record.deal_name}", stage: "${record.stage}"`);
      console.log(`Validation results - hasValidDealName: ${hasValidDealName}, hasValidStage: ${hasValidStage}`);
      
      if (!hasValidDealName) {
        console.error('Invalid deal: missing or empty deal_name');
        return false;
      }
      
      if (!hasValidStage) {
        console.error(`Invalid deal: invalid stage "${record.stage}". Valid stages: ${validStages.join(', ')}`);
        return false;
      }
      
      // Additional validation for critical fields (but allow them to be empty for updates)
      if (record.probability !== undefined && record.probability !== null && record.probability !== '') {
        const prob = parseInt(String(record.probability));
        if (isNaN(prob) || prob < 0 || prob > 100) {
          console.error(`Invalid probability: ${record.probability}. Must be between 0-100`);
          return false;
        }
      }
      
      if (record.priority !== undefined && record.priority !== null && record.priority !== '') {
        const priority = parseInt(String(record.priority));
        if (isNaN(priority) || priority < 1 || priority > 5) {
          console.error(`Invalid priority: ${record.priority}. Must be between 1-5`);
          return false;
        }
      }
      
      console.log('Deal validation passed');
      return true;
    }
    
    // For other tables, use the existing logic but be more lenient
    const missingRequired = config.required.filter(field => {
      const value = record[field];
      return value === undefined || value === null || String(value).trim() === '';
    });
    
    if (missingRequired.length > 0) {
      console.log(`Missing required fields for ${tableName}:`, missingRequired);
      return false;
    }
    
    console.log(`Validation passed for ${tableName}`);
    return true;
  };
};
