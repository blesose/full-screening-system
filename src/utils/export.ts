/**
 * Export data to CSV format with BOM for Excel compatibility
 * @param data - Array of objects to export
 * @param filename - Name of the file (without extension)
 */
export const exportToCSV = <T extends Record<string, unknown>>(
  data: T[],
  filename: string
): void => {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]) as Array<keyof T>;
  
  // Create CSV rows
  const rows = data.map((obj) =>
    headers.map((key) => {
      const value = obj[key] ?? '';
      // Handle objects/arrays
      if (typeof value === 'object') {
        return JSON.stringify(value).replace(/,/g, ';');
      }
      // Handle strings with commas
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return String(value);
    })
  );

  // Build CSV content with BOM for Excel compatibility
  const csvContent =
    '\uFEFF' +
    [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export data to CSV with custom column mapping (display names)
 * @param data - Array of objects to export
 * @param columnMap - Mapping of object keys to display names
 * @param filename - Name of the file (without extension)
 */
export const exportToCSVWithMapping = <T extends Record<string, unknown>>(
  data: T[],
  columnMap: Record<keyof T, string>,
  filename: string
): void => {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  const headers = Object.keys(columnMap) as Array<keyof T>;
  const displayHeaders = headers.map((key) => columnMap[key]);

  const rows = data.map((obj) =>
    headers.map((key) => {
      const value = obj[key] ?? '';
      if (typeof value === 'object') {
        return JSON.stringify(value).replace(/,/g, ';');
      }
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return String(value);
    })
  );

  const csvContent =
    '\uFEFF' +
    [displayHeaders.join(','), ...rows.map((row) => row.join(','))].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export data to JSON format
 * @param data - Data to export
 * @param filename - Name of the file (without extension)
 */
export const exportToJSON = <T>(data: T, filename: string): void => {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export data to TXT format (plain text)
 * @param content - Text content to export
 * @param filename - Name of the file (without extension)
 */
export const exportToTXT = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.txt`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};


export const downloadBlob = (blob: Blob, filename: string): void => {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};