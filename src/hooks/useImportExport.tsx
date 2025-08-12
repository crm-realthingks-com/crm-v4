import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CSVParser } from '@/utils/csvParser';
import { getExportFilename } from '@/utils/exportUtils';
import { getColumnConfig } from './import-export/columnConfig';
import { createHeaderMapper } from './import-export/headerMapper';
import { createValueValidator } from './import-export/valueValidator';
import { createDuplicateChecker } from './import-export/duplicateChecker';
import { createRecordValidator } from './import-export/recordValidator';

interface ImportExportOptions {
  moduleName: string;
  onRefresh: () => void;
  tableName?: string;
}

export const useImportExport = ({ moduleName, onRefresh, tableName = 'contacts_module' }: ImportExportOptions) => {
  const { user } = useAuth();
  const config = getColumnConfig(tableName);
  
  // Create utility functions for this table
  const mapHeader = createHeaderMapper(tableName);
  const validateAndConvertValue = createValueValidator(tableName);
  const checkDuplicate = createDuplicateChecker(tableName);
  const validateImportRecord = createRecordValidator(tableName);

  const handleImport = async (file: File) => {
    try {
      console.log(`Starting import of ${file.name} (${file.size} bytes) into ${tableName}`);
      console.log('Import config:', { moduleName: moduleName, tableName: tableName });
      console.log('Expected columns for deals:', config.allowedColumns);
      
      const text = await file.text();
      console.log('File content loaded, length:', text.length);
      
      const { headers, rows: dataRows } = CSVParser.parseCSV(text);
      
      console.log('Parsed CSV - Headers:', headers);
      console.log('Parsed CSV - Data rows:', dataRows.length);
      
      if (dataRows.length > 0) {
        console.log('First data row:', dataRows[0]);
        console.log('First data row length:', dataRows[0].length);
        console.log('Headers length:', headers.length);
      }

      // Validate headers for deals
      if (tableName === 'deals') {
        // Check if we have minimum required headers
        const hasRequiredHeaders = headers.some(h => mapHeader(h) === 'deal_name') && 
                                   headers.some(h => mapHeader(h) === 'stage');
        if (!hasRequiredHeaders) {
          throw new Error('Missing required headers: deal_name and stage are required for deals import. Please check your CSV headers.');
        }
      }

      const mappedHeaders = headers.map(header => ({
        original: header,
        mapped: mapHeader(header)
      }));

      const validHeaders = mappedHeaders.filter(h => h.mapped !== null);
      const invalidHeaders = mappedHeaders.filter(h => h.mapped === null);
      
      console.log('Valid headers:', validHeaders);
      console.log('Invalid headers:', invalidHeaders);
      
      if (validHeaders.length === 0) {
        throw new Error('No valid headers found. Please ensure CSV headers match the expected field names.');
      }
      
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

      console.log('Header mappings:', mappedHeaders);
      console.log(`Processing ${dataRows.length} rows for ${tableName}`);

      let successCount = 0;
      let errorCount = 0;
      let duplicateCount = 0;
      let updateCount = 0;
      const errors: string[] = [];

      // Process records one by one with enhanced error handling
      for (let i = 0; i < dataRows.length; i++) {
        try {
          const row = dataRows[i];
          const record: any = {};
          
          // Map headers to values with proper validation
          mappedHeaders.forEach((headerMap, index) => {
            if (headerMap.mapped && index < row.length) {
              const rawValue = row[index];
              if (rawValue !== undefined && rawValue !== null && String(rawValue).trim() !== '') {
                const validatedValue = validateAndConvertValue(headerMap.mapped, String(rawValue).trim());
                if (validatedValue !== null && validatedValue !== undefined) {
                  record[headerMap.mapped] = validatedValue;
                }
              }
            }
          });
          
          console.log(`Row ${i + 1} processed record:`, record);
          
          // Set required defaults based on table type
          if (tableName === 'deals') {
            // Ensure required fields have values
            if (!record.deal_name && record.project_name) {
              record.deal_name = record.project_name;
              console.log(`Row ${i + 1}: Using project_name as deal_name: ${record.deal_name}`);
            }
            if (!record.deal_name) {
              errors.push(`Row ${i + 1}: Missing deal_name - this field is required`);
              console.error(`Row ${i + 1}: Missing deal_name`);
              errorCount++;
              continue;
            }
            if (!record.stage) {
              record.stage = 'Lead';
              console.log(`Row ${i + 1}: Setting default stage to 'Lead'`);
            }
            
            // Validate the record structure
            const isValid = validateImportRecord(record);
            
            if (!isValid) {
              errors.push(`Row ${i + 1}: Invalid deal data for "${record.deal_name}" - check deal_name and stage values`);
              console.log(`Row ${i + 1}: Validation failed for deal`, record);
              errorCount++;
              continue;
            }
            
            // Enhanced duplicate checking with update capability
            console.log(`Checking for duplicates before processing row ${i + 1}...`);
            
            const isDuplicate = await checkDuplicate(record);
            if (isDuplicate) {
              console.log(`Found duplicate record ${i + 1}: ${record.deal_name}, attempting update...`);
              
              // If it's a duplicate, try to update instead of skipping
              try {
                let updateData = { ...record };
                delete updateData.id; // Don't update the ID field itself
                updateData.modified_by = user?.id || '00000000-0000-0000-0000-000000000000';
                updateData.modified_at = new Date().toISOString();

                console.log(`Row ${i + 1}: Update data prepared:`, updateData);

                let updateResult;
                if (record.id && record.id.trim() !== '') {
                  // Update by ID if available
                  console.log(`Row ${i + 1}: Updating by ID: ${record.id}`);
                  updateResult = await supabase
                    .from('deals')
                    .update(updateData)
                    .eq('id', record.id.trim())
                    .select('id, deal_name');
                } else {
                  // Update by deal_name if no ID
                  console.log(`Row ${i + 1}: Updating by deal_name: ${record.deal_name}`);
                  updateResult = await supabase
                    .from('deals')
                    .update(updateData)
                    .eq('deal_name', record.deal_name)
                    .select('id, deal_name');
                }

                if (updateResult.error) {
                  console.error(`Row ${i + 1}: Error updating record:`, updateResult.error);
                  errors.push(`Row ${i + 1}: Update failed for "${record.deal_name}" - ${updateResult.error.message}`);
                  errorCount++;
                } else if (updateResult.data && updateResult.data.length > 0) {
                  updateCount++;
                  console.log(`Row ${i + 1}: Successfully updated existing record:`, updateResult.data[0]);
                } else {
                  console.log(`Row ${i + 1}: No records updated, treating as duplicate skip`);
                  duplicateCount++;
                }
              } catch (updateError: any) {
                console.error(`Row ${i + 1}: Error updating duplicate record:`, updateError);
                errors.push(`Row ${i + 1}: Update error for "${record.deal_name}" - ${updateError.message}`);
                errorCount++;
              }
              continue;
            }
            
            // Set user ID for new records
            record.created_by = user?.id || '00000000-0000-0000-0000-000000000000';
            record.modified_by = user?.id || '00000000-0000-0000-0000-000000000000';
            
          } else {
            // For other tables, handle required fields
            const missingRequired = config.required.filter(field => !record[field] || String(record[field]).trim() === '');
            
            if (missingRequired.length > 0) {
              // Set defaults for some missing fields
              missingRequired.forEach(field => {
                if (field === 'contact_name') {
                  record[field] = `Contact ${i + 1}`;
                } else if (field === 'lead_name') {
                  record[field] = `Lead ${i + 1}`;
                } else if (field === 'title') {
                  record[field] = `Meeting ${i + 1}`;
                }
              });
              
              // Check again after setting defaults
              const stillMissing = config.required.filter(field => !record[field] || String(record[field]).trim() === '');
              if (stillMissing.length > 0) {
                errors.push(`Row ${i + 1}: Missing required fields: ${stillMissing.join(', ')}`);
                errorCount++;
                continue;
              }
            }
            
            record.created_by = user?.id || '00000000-0000-0000-0000-000000000000';
            if (tableName !== 'meetings') {
              record.modified_by = user?.id || null;
            }

            // Check for duplicates before insertion
            const isDuplicate = await checkDuplicate(record);
            if (isDuplicate) {
              console.log(`Row ${i + 1}: Skipping duplicate record: ${record.contact_name || record.lead_name || 'Unknown'}`);
              duplicateCount++;
              continue;
            }
          }

          // Insert single record with proper type handling
          console.log(`Row ${i + 1}: Inserting new record:`, record);
          
          // Type-safe table insertion
          let insertResult;
          if (tableName === 'deals') {
            insertResult = await supabase
              .from('deals')
              .insert([record])
              .select('id, deal_name');
          } else if (tableName === 'contacts' || tableName === 'contacts_module') {
            insertResult = await supabase
              .from('contacts')
              .insert([record])
              .select('id');
          } else if (tableName === 'leads') {
            insertResult = await supabase
              .from('leads')
              .insert([record])
              .select('id');
          } else if (tableName === 'meetings') {
            insertResult = await supabase
              .from('meetings')
              .insert([record])
              .select('id');
          } else {
            throw new Error(`Unsupported table: ${tableName}`);
          }

          if (insertResult.error) {
            console.error(`Row ${i + 1}: Error inserting record:`, insertResult.error);
            errors.push(`Row ${i + 1}: Insert failed - ${insertResult.error.message}`);
            errorCount++;
          } else if (insertResult.data && insertResult.data.length > 0) {
            successCount++;
            console.log(`Row ${i + 1}: Successfully inserted new record:`, insertResult.data[0]);
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

      console.log(`Import completed - Success: ${successCount}, Updates: ${updateCount}, Errors: ${errorCount}, Duplicates: ${duplicateCount}`);
      console.log('Import errors:', errors);

      let message = `Import completed: ${successCount} new records`;
      if (updateCount > 0) message += `, ${updateCount} updated`;
      if (duplicateCount > 0) message += `, ${duplicateCount} duplicates skipped`;
      if (errorCount > 0) message += `, ${errorCount} errors`;

      if (successCount > 0 || updateCount > 0) {
        toast({
          title: "Import successful",
          description: message,
        });
      }

      if (errorCount > 0) {
        console.log('First 5 import errors:', errors.slice(0, 5));
        toast({
          variant: "destructive",
          title: "Import completed with errors",
          description: `${message}. Check console for details.`,
        });
      } else if (duplicateCount > 0 && successCount === 0 && updateCount === 0) {
        toast({
          title: "Import completed - no changes",
          description: "All records were duplicates, no new data was added.",
        });
      }
      
      console.log('Refreshing data after import...');
      onRefresh();

    } catch (error: any) {
      console.error('Import failed:', error);
      toast({
        variant: "destructive",
        title: "Import failed",
        description: error.message,
      });
    }
  };

  const handleExportAll = async (data: any[]) => {
    console.log(`Exporting all data for ${tableName}:`, data?.length || 0, 'records');
    const filename = getExportFilename(moduleName, 'all');
    exportToCSV(data, filename);
  };

  const handleExportSelected = (data: any[], selectedIds: string[]) => {
    const selectedData = data.filter(item => selectedIds.includes(item.id));
    const filename = getExportFilename(moduleName, 'selected');
    console.log(`Exporting selected data:`, selectedData.length, 'records');
    exportToCSV(selectedData, filename);
  };

  const handleExportFiltered = (filteredData: any[]) => {
    const filename = getExportFilename(moduleName, 'filtered');
    console.log(`Exporting filtered data:`, filteredData.length, 'records');
    exportToCSV(filteredData, filename);
  };

  const exportToCSV = async (data: any[], filename: string) => {
    if (data.length === 0) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "No data to export",
      });
      return;
    }

    const headers = config.allowedColumns;

    console.log('Exporting with headers:', headers);
    console.log('Sample data:', data[0]);

    const processedData = data.map(row => {
      const processedRow: any = {};
      
      headers.forEach(header => {
        let value = row[header];
        
        if (value === null || value === undefined) {
          processedRow[header] = '';
          return;
        }
        
        if ((header.includes('time') || header.includes('date')) && !header.includes('_id')) {
          if (value) {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              processedRow[header] = date.toISOString();
            } else {
              processedRow[header] = '';
            }
          } else {
            processedRow[header] = '';
          }
        } else if (Array.isArray(value)) {
          processedRow[header] = value.join(', ');
        } else if (typeof value === 'boolean') {
          processedRow[header] = value ? 'true' : 'false';
        } else {
          processedRow[header] = String(value);
        }
      });
      
      return processedRow;
    });

    const csvContent = CSVParser.toCSV(processedData, headers);

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    console.log(`Export completed: ${data.length} records exported to ${filename}`);
    toast({
      title: "Export completed",
      description: `Successfully exported ${data.length} records to ${filename}`,
    });
  };

  return {
    handleImport,
    handleExportAll,
    handleExportSelected,
    handleExportFiltered
  };
};
