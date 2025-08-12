
import { supabase } from '@/integrations/supabase/client';

export const createDuplicateChecker = (tableName: string) => {
  return async (record: any): Promise<boolean> => {
    try {
      if (tableName === 'deals') {
        console.log('Checking for duplicate deal:', {
          id: record.id,
          deal_name: record.deal_name,
          stage: record.stage,
          customer_name: record.customer_name,
          project_name: record.project_name
        });

        // If the record has an ID, check if it exists in the database
        if (record.id && record.id.trim() !== '') {
          console.log('Checking by ID:', record.id);
          const { data: existingById, error: idError } = await supabase
            .from('deals')
            .select('id, deal_name, stage')
            .eq('id', record.id.trim())
            .maybeSingle();

          if (idError) {
            console.error('Error checking deal by ID:', idError);
            // Don't treat database errors as duplicates
            return false;
          }

          if (existingById) {
            console.log('Duplicate found by ID:', record.id, 'existing deal:', existingById.deal_name);
            return true;
          } else {
            console.log('No existing deal found with ID:', record.id);
          }
        }

        // Check for duplicates based on deal_name (only if no ID or ID doesn't exist)
        if (record.deal_name && record.deal_name.trim() !== '') {
          console.log('Checking by deal_name:', record.deal_name);
          const { data: existingDeals, error } = await supabase
            .from('deals')
            .select('id, deal_name, stage, customer_name, project_name')
            .eq('deal_name', record.deal_name.trim());

          if (error) {
            console.error('Error checking deal duplicates by name:', error);
            return false;
          }

          if (existingDeals && existingDeals.length > 0) {
            console.log(`Found ${existingDeals.length} existing deals with same deal_name`);
            
            // Check for exact match
            const exactMatch = existingDeals.find(existing => 
              existing.deal_name?.toLowerCase().trim() === record.deal_name?.toLowerCase().trim()
            );

            if (exactMatch) {
              console.log('Duplicate found - exact deal_name match:', exactMatch.deal_name);
              return true;
            }
          }
        }

        // Fallback: check by project_name + customer_name combination (only if both exist)
        if (record.project_name && record.customer_name && 
            record.project_name.trim() !== '' && record.customer_name.trim() !== '') {
          console.log('Checking by project_name + customer_name:', record.project_name, record.customer_name);
          const { data: projectCustomerMatch, error: projectError } = await supabase
            .from('deals')
            .select('id, project_name, customer_name, deal_name')
            .eq('project_name', record.project_name.trim())
            .eq('customer_name', record.customer_name.trim());

          if (!projectError && projectCustomerMatch && projectCustomerMatch.length > 0) {
            console.log('Duplicate found by project_name + customer_name combination:', projectCustomerMatch[0]);
            return true;
          }
        }

        console.log('No duplicates found for deal');
        return false;
      }
      
      // For other tables, use original logic with improved error handling
      const keyFields = tableName === 'contacts_module' || tableName === 'contacts' 
        ? ['email', 'contact_name'] 
        : tableName === 'leads'
        ? ['email', 'lead_name']
        : tableName === 'meetings'
        ? ['title', 'start_time']
        : ['deal_name'];

      // Build query dynamically
      let query = supabase.from(tableName as any).select('id');
      
      let hasValidFields = false;
      keyFields.forEach(field => {
        if (record[field] && String(record[field]).trim() !== '') {
          query = query.eq(field, String(record[field]).trim());
          hasValidFields = true;
        }
      });

      // If no valid fields to check against, not a duplicate
      if (!hasValidFields) {
        console.log('No valid key fields to check for duplicates');
        return false;
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error checking duplicate for', tableName, ':', error);
        return false;
      }
      
      const isDuplicate = data && data.length > 0;
      
      if (isDuplicate) {
        console.log(`Duplicate found for record with ${keyFields.join(', ')}:`, keyFields.map(f => record[f]).join(', '));
      }
      
      return isDuplicate;
    } catch (error) {
      console.error('Error checking duplicate:', error);
      return false;
    }
  };
};
