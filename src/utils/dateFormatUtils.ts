
// Centralized date conversion utilities for import/export

export class DateFormatUtils {
  
  // Convert date from YYYY-MM-DD or ISO format to DD-MM-YYYY for export
  static formatDateForExport(dateValue: any): string {
    if (!dateValue) return '';
    
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return '';
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}-${month}-${year}`;
    } catch (error) {
      console.warn('DateFormatUtils: Invalid date for export:', dateValue);
      return '';
    }
  }
  
  // Convert datetime from ISO format to DD-MM-YYYY HH:mm:ss for export
  static formatDateTimeForExport(dateValue: any): string {
    if (!dateValue) return '';
    
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return '';
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      
      return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
      console.warn('DateFormatUtils: Invalid datetime for export:', dateValue);
      return '';
    }
  }
  
  // Convert date from DD-MM-YYYY format to YYYY-MM-DD for database import
  static convertDateForImport(dateValue: string): string | null {
    if (!dateValue || dateValue.trim() === '') return null;
    
    const trimmedValue = dateValue.trim();
    
    // Handle DD-MM-YYYY format
    const ddmmyyyyMatch = trimmedValue.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (ddmmyyyyMatch) {
      const [, day, month, year] = ddmmyyyyMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Handle DD-MM-YYYY HH:mm:ss format
    const ddmmyyyyTimeMatch = trimmedValue.match(/^(\d{1,2})-(\d{1,2})-(\d{4})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})$/);
    if (ddmmyyyyTimeMatch) {
      const [, day, month, year, hours, minutes, seconds] = ddmmyyyyTimeMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
    }
    
    // Handle YYYY-MM-DD format (already correct)
    const yyyymmddMatch = trimmedValue.match(/^\d{4}-\d{1,2}-\d{1,2}$/);
    if (yyyymmddMatch) {
      return trimmedValue;
    }
    
    // Handle ISO datetime format (preserve as is)
    if (trimmedValue.includes('T') || (trimmedValue.includes(' ') && trimmedValue.includes(':'))) {
      try {
        const date = new Date(trimmedValue);
        if (!isNaN(date.getTime())) {
          return trimmedValue;
        }
      } catch (error) {
        // Fall through to warning
      }
    }
    
    console.warn(`DateFormatUtils: Unknown date format: ${trimmedValue}`);
    return null;
  }
  
  // Get field type for proper conversion
  static getFieldType(fieldName: string): 'date' | 'datetime' | 'other' {
    const dateFields = [
      'expected_closing_date', 'start_date', 'end_date', 
      'signed_contract_date', 'implementation_start_date', 
      'rfq_received_date', 'proposal_due_date'
    ];
    
    const datetimeFields = [
      'created_at', 'modified_at', 'created_time', 'modified_time'
    ];
    
    if (dateFields.includes(fieldName)) return 'date';
    if (datetimeFields.includes(fieldName)) return 'datetime';
    return 'other';
  }
  
  // Process field for export based on its type
  static processFieldForExport(fieldName: string, value: any): string {
    const fieldType = this.getFieldType(fieldName);
    
    switch (fieldType) {
      case 'date':
        return this.formatDateForExport(value);
      case 'datetime':
        return this.formatDateTimeForExport(value);
      default:
        return value !== undefined && value !== null ? String(value) : '';
    }
  }
  
  // Process field for import based on its type
  static processFieldForImport(fieldName: string, value: string): string | null {
    const fieldType = this.getFieldType(fieldName);
    
    if (fieldType === 'date' || fieldType === 'datetime') {
      return this.convertDateForImport(value);
    }
    
    return value && value.trim() !== '' ? value.trim() : null;
  }
}
