
// CSV utility functions for import/export

export interface ContactCSVRow {
  'id': string;
  'contact_name': string;
  'company_name': string;
  'position': string;
  'email': string;
  'phone_no': string;
  'linkedin': string;
  'website': string;
  'contact_source': string;
  'industry': string;
  'country': string;
  'description': string;
  'contact_owner': string;
  'created_by': string;
  'modified_by': string;
  'created_time': string;
  'modified_time': string;
}

export const exportContactsToCSV = (contacts: any[]) => {
  console.log('exportContactsToCSV called with:', contacts.length, 'contacts');
  
  if (!contacts || contacts.length === 0) {
    throw new Error('No contacts to export');
  }

  // Define headers in the exact sequence from the Supabase table
  const headers = [
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
    'country',
    'description',
    'contact_owner',
    'created_by',
    'modified_by',
    'created_time',
    'modified_time'
  ];

  // Convert contacts to CSV rows
  const csvRows = contacts.map(contact => [
    contact.id || '',
    contact.contact_name || '',
    contact.company_name || '',
    contact.position || '',
    contact.email || '',
    contact.phone_no || '',
    contact.linkedin || '',
    contact.website || '',
    contact.contact_source || '',
    contact.industry || '',
    contact.country || '',
    contact.description || '',
    contact.contact_owner || '',
    contact.created_by || '',
    contact.modified_by || '',
    contact.created_time || '',
    contact.modified_time || ''
  ]);

  // Combine headers and data
  const allRows = [headers, ...csvRows];

  // Convert to CSV string
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

  console.log('CSV content generated, length:', csvContent.length);
  return csvContent;
};

export const downloadCSV = (csvContent: string, filename: string) => {
  console.log('downloadCSV called with filename:', filename);
  console.log('CSV content length:', csvContent.length);
  
  try {
    // Create blob with UTF-8 BOM for better Excel compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { 
      type: 'text/csv;charset=utf-8;' 
    });
    
    console.log('Blob created, size:', blob.size);

    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.error('Not in browser environment');
      return false;
    }

    // For modern browsers, use the download attribute
    if (window.navigator && (window.navigator as any).msSaveOrOpenBlob) {
      // IE specific method
      (window.navigator as any).msSaveOrOpenBlob(blob, filename);
      console.log('IE download method used');
      return true;
    }

    // Standard method for other browsers
    const url = window.URL.createObjectURL(blob);
    console.log('Blob URL created:', url);
    
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    
    // Add to DOM, click, then remove
    document.body.appendChild(link);
    console.log('Link added to DOM, triggering click...');
    
    // Force the download
    link.click();
    
    // Small delay before cleanup to ensure download starts
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      console.log('Cleanup completed');
    }, 100);
    
    console.log('Download initiated successfully');
    return true;
    
  } catch (error) {
    console.error('Download failed:', error);
    return false;
  }
};

export const parseCSVFile = async (file: File): Promise<ContactCSVRow[]> => {
  console.log('parseCSVFile called with file:', file.name);
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        console.log('File content length:', text.length);
        
        // Split lines and clean them
        const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line);
        console.log('Total lines:', lines.length);
        
        if (lines.length < 2) {
          reject(new Error('CSV file must have at least a header and one data row'));
          return;
        }

        // Parse header - handle quoted headers
        const headerLine = lines[0];
        const headers = parseCSVLine(headerLine);
        console.log('CSV headers:', headers);

        // Parse data rows
        const rows: ContactCSVRow[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (!line) continue;

          const values = parseCSVLine(line);
          console.log(`Row ${i} values:`, values);

          // Create contact object mapping headers to values
          const contact: any = {};
          headers.forEach((header, index) => {
            const value = values[index] || '';
            contact[header] = value;
          });

          // Map to our expected format with exact field matching
          const mappedContact: ContactCSVRow = {
            'id': contact['id'] || '',
            'contact_name': contact['contact_name'] || contact['Contact Name'] || contact['name'] || '',
            'company_name': contact['company_name'] || contact['Company Name'] || contact['company'] || '',
            'position': contact['position'] || contact['Position'] || contact['title'] || '',
            'email': contact['email'] || contact['Email'] || '',
            'phone_no': contact['phone_no'] || contact['Phone'] || contact['phone'] || '',
            'linkedin': contact['linkedin'] || contact['LinkedIn'] || '',
            'website': contact['website'] || contact['Website'] || '',
            'contact_source': contact['contact_source'] || contact['Contact Source'] || contact['source'] || '',
            'industry': contact['industry'] || contact['Industry'] || '',
            'country': contact['country'] || contact['Country'] || '',
            'description': contact['description'] || contact['Description'] || '',
            'contact_owner': contact['contact_owner'] || '',
            'created_by': contact['created_by'] || '',
            'modified_by': contact['modified_by'] || '',
            'created_time': contact['created_time'] || '',
            'modified_time': contact['modified_time'] || ''
          };

          console.log('Mapped contact:', mappedContact);

          if (mappedContact['contact_name']) {
            rows.push(mappedContact);
          }
        }

        console.log('Successfully parsed', rows.length, 'contacts from CSV');
        resolve(rows);
      } catch (error) {
        console.error('CSV parsing error:', error);
        reject(error);
      }
    };

    reader.onerror = () => {
      console.error('File reading error');
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file, 'utf-8');
  });
};

// Helper function to parse a CSV line properly handling quotes and commas
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  result.push(current.trim());
  return result.map(field => field.replace(/^"|"$/g, '')); // Remove surrounding quotes
}
