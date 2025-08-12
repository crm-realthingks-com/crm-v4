export class CSVParser {
  static parseCSV(text: string): { headers: string[], rows: string[][] } {
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line);
    
    if (lines.length === 0) {
      return { headers: [], rows: [] };
    }

    const headers = this.parseCSVLine(lines[0]);
    const rows = lines.slice(1).map(line => this.parseCSVLine(line));
    
    return { headers, rows };
  }

  static parseCSVLine(line: string): string[] {
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

  static toCSV(data: any[], headers: string[]): string {
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.map(header => this.escapeCSVField(header)).join(','));
    
    // Add data rows
    data.forEach(row => {
      const csvRow = headers.map(header => {
        const value = row[header];
        return this.escapeCSVField(String(value || ''));
      });
      csvRows.push(csvRow.join(','));
    });
    
    return csvRows.join('\n');
  }

  static escapeCSVField(field: string): string {
    const str = String(field || '');
    // If field contains comma, quote, or newline, wrap in quotes and escape quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }
}