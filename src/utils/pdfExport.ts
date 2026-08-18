import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFOptions {
  filename?: string;
  title?: string;
  orientation?: 'portrait' | 'landscape';
  unit?: 'pt' | 'mm' | 'cm' | 'in' | 'px';
  format?: 'a4' | 'a3' | 'a5' | 'letter' | 'legal' | number[];
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface PDFTableColumn {
  header: string;
  accessor: string;
  width?: number;
}

type RowData = Record<string, string | number | boolean | null | undefined>;

const defaultOptions: PDFOptions = {
  filename: 'document',
  orientation: 'landscape',
  unit: 'mm',
  format: 'a4',
  margins: { top: 15, right: 15, bottom: 15, left: 15 },
};

/**
 * Generate a PDF from an HTML element
 */
export const generatePDFFromElement = async (
  elementId: string,
  options: PDFOptions = {}
): Promise<void> => {
  const { filename = 'document' } = { ...defaultOptions, ...options };
  const element = document.getElementById(elementId);

  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('landscape', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = pdfHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pdf.internal.pageSize.getHeight();

    while (heightLeft > 0) {
      position = heightLeft - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
    }

    pdf.save(`${filename}.pdf`);
  } catch {
    throw new Error('Failed to generate PDF. Please try again.');
  }
};

/**
 * Generate a PDF from data array with table
 */
export const generatePDFFromData = async (
  data: RowData[],
  columns: PDFTableColumn[],
  options: PDFOptions = {}
): Promise<void> => {
  const {
    filename = 'document',
    title = 'Shortlist Report',
    orientation = 'landscape',
    unit = 'mm',
    format = 'a4',
    margins = { top: 15, right: 15, bottom: 15, left: 15 },
  } = { ...defaultOptions, ...options };

  // Check if data exists
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  console.log('Generating PDF with data length:', data.length);
  console.log('Columns:', columns);

  const pdf = new jsPDF(orientation, unit, format);
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const availableWidth = pageWidth - margins.left - margins.right;
  
  // Calculate column widths - ensure they sum to 100%
  const totalWidth = columns.reduce((sum, col) => sum + (col.width || 0), 0);
  const columnWidths = columns.map((col) => {
    if (col.width) {
      return (col.width / Math.max(totalWidth, 100)) * availableWidth;
    }
    return availableWidth / columns.length;
  });

  let yPosition = margins.top;

  // Title
  if (title) {
    pdf.setFontSize(16);
    pdf.setTextColor(44, 62, 80);
    pdf.text(title, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);
    pdf.text(
      `Generated: ${new Date().toLocaleString()}`,
      pageWidth / 2,
      yPosition,
      { align: 'center' }
    );
    yPosition += 8;

    pdf.setDrawColor(200, 200, 200);
    pdf.line(margins.left, yPosition, pageWidth - margins.right, yPosition);
    yPosition += 8;
  }

  // Headers
  pdf.setFillColor(243, 244, 246);
  pdf.setDrawColor(200, 200, 200);
  pdf.setFontSize(9);
  pdf.setTextColor(31, 41, 55);
  pdf.setFont('helvetica', 'bold');

  let xPosition = margins.left;
  columns.forEach((col, index) => {
    pdf.rect(xPosition, yPosition, columnWidths[index], 8, 'FD');
    pdf.text(col.header, xPosition + 2, yPosition + 5.5);
    xPosition += columnWidths[index];
  });

  yPosition += 8;

  // Rows
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(51, 65, 85);

  let rowCount = 0;
  const rowHeight = 7;
  const maxRowsPerPage = Math.floor((pageHeight - yPosition - margins.bottom) / rowHeight);

  for (const row of data) {
    if (rowCount >= maxRowsPerPage) {
      pdf.addPage();
      yPosition = margins.top;
      rowCount = 0;

      // Re-add headers on new page
      pdf.setFont('helvetica', 'bold');
      xPosition = margins.left;
      columns.forEach((col, index) => {
        pdf.rect(xPosition, yPosition, columnWidths[index], 8, 'FD');
        pdf.text(col.header, xPosition + 2, yPosition + 5.5);
        xPosition += columnWidths[index];
      });
      yPosition += 8;
      pdf.setFont('helvetica', 'normal');
    }

    xPosition = margins.left;

    if (rowCount % 2 === 0) {
      pdf.setFillColor(255, 255, 255);
    } else {
      pdf.setFillColor(249, 250, 251);
    }

    columns.forEach((col, index) => {
      const value = row[col.accessor];
      const text = value !== undefined && value !== null && value !== '' ? String(value) : '—';

      pdf.rect(xPosition, yPosition, columnWidths[index], rowHeight, 'F');

      // Truncate long text
      const maxWidth = columnWidths[index] - 4;
      let displayText = text;
      const textWidth = pdf.getStringUnitWidth(text) * pdf.getFontSize() / 2.5;
      if (textWidth > maxWidth) {
        displayText = text.substring(0, Math.floor((maxWidth / textWidth) * text.length * 0.8)) + '...';
      }
      pdf.text(displayText, xPosition + 2, yPosition + 5);
      xPosition += columnWidths[index];
    });

    yPosition += rowHeight;
    rowCount++;
  }

  // Footer
  const totalPages = pdf.internal.pages.length - 1;
  if (totalPages > 0) {
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(7);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        `Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: 'center' }
      );
    }
  }

  // Save the PDF
  try {
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error saving PDF:', error);
    throw new Error('Failed to save PDF', { cause: error });
  }
};

/**
 * Generate a simple text report PDF
 */
export const generateTextReport = async (
  title: string,
  content: string,
  options: PDFOptions = {}
): Promise<void> => {
  const {
    filename = 'report',
    orientation = 'portrait',
    unit = 'mm',
    format = 'a4',
    margins = { top: 20, right: 20, bottom: 20, left: 20 },
  } = { ...defaultOptions, ...options };

  const pdf = new jsPDF(orientation, unit, format);
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  let yPosition = margins.top;

  pdf.setFontSize(22);
  pdf.setTextColor(44, 62, 80);
  pdf.text(title, margins.left, yPosition, { align: 'left' });
  yPosition += 14;

  pdf.setFontSize(10);
  pdf.setTextColor(100, 116, 139);
  pdf.text(
    `Generated: ${new Date().toLocaleString()}`,
    margins.left,
    yPosition
  );
  yPosition += 6;

  pdf.setDrawColor(200, 200, 200);
  pdf.line(margins.left, yPosition, pageWidth - margins.right, yPosition);
  yPosition += 10;

  const maxWidth = pageWidth - margins.left - margins.right;
  const splitText = pdf.splitTextToSize(content, maxWidth - 10);

  pdf.setFontSize(10);
  pdf.setTextColor(51, 65, 85);

  const lineHeight = 6;
  const maxLinesPerPage = Math.floor((pageHeight - margins.bottom - yPosition) / lineHeight);

  let lineIndex = 0;
  while (lineIndex < splitText.length) {
    const pageLines = splitText.slice(lineIndex, lineIndex + maxLinesPerPage);
    pageLines.forEach((line: string) => {
      pdf.text(line, margins.left + 5, yPosition);
      yPosition += lineHeight;
    });

    lineIndex += maxLinesPerPage;

    if (lineIndex < splitText.length) {
      pdf.addPage();
      yPosition = margins.top;
    }
  }

  const totalPages = pdf.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  pdf.save(`${filename}.pdf`);
};

/**
 * Generate a PDF from an HTML table element - FORCES LIGHT MODE
 */
export const generatePDFFromTable = async (
  tableId: string,
  options: PDFOptions = {}
): Promise<void> => {
  const { filename = 'table_export' } = { ...defaultOptions, ...options };
  const table = document.getElementById(tableId);

  if (!table) {
    throw new Error(`Table with id "${tableId}" not found`);
  }

  // Create a temporary container with FORCED LIGHT MODE styling
  const container = document.createElement('div');
  container.style.cssText = `
    padding: 40px;
    background: white !important;
    color: #1e293b !important;
    width: 1100px;
    margin: 0 auto;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  // Add title
  const title = document.createElement('h1');
  title.style.cssText = `
    font-size: 24px;
    font-weight: 600;
    color: #1e293b !important;
    margin-bottom: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  title.textContent = options.title || 'Shortlist Report';
  container.appendChild(title);

  // Add date
  const date = document.createElement('p');
  date.style.cssText = `
    font-size: 12px;
    color: #64748b !important;
    margin-bottom: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  date.textContent = `Generated: ${new Date().toLocaleString()}`;
  container.appendChild(date);

  // Add line
  const line = document.createElement('hr');
  line.style.cssText = `
    border: none;
    border-top: 1px solid #e2e8f0;
    margin-bottom: 20px;
  `;
  container.appendChild(line);

  // Clone table with FORCED LIGHT MODE styling
  const tableClone = table.cloneNode(true) as HTMLElement;
  tableClone.style.cssText = `
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #1e293b !important;
    background: white !important;
  `;

  // Style all cells - FORCE LIGHT MODE
  const allCells = tableClone.querySelectorAll('th, td');
  allCells.forEach((cell) => {
    const element = cell as HTMLElement;
    element.style.padding = '10px 14px';
    element.style.border = '1px solid #d1d5db';
    element.style.textAlign = 'left';
    element.style.fontSize = '12px';
    element.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    element.style.color = '#1e293b !important';
    element.style.background = 'white !important';
    element.style.whiteSpace = 'normal';
    element.style.wordBreak = 'break-word';
    element.style.maxWidth = '200px';
  });

  // Style headers - FORCE LIGHT MODE
  const headers = tableClone.querySelectorAll('th');
  headers.forEach((header) => {
    const element = header as HTMLElement;
    element.style.backgroundColor = '#f1f5f9 !important';
    element.style.fontWeight = '600';
    element.style.color = '#1e293b !important';
    element.style.fontSize = '11px';
    element.style.textTransform = 'uppercase';
    element.style.letterSpacing = '0.05em';
    element.style.background = '#f1f5f9 !important';
  });

  // Style body cells - FORCE LIGHT MODE
  const bodyCells = tableClone.querySelectorAll('td');
  bodyCells.forEach((cell) => {
    const element = cell as HTMLElement;
    element.style.color = '#1e293b !important';
    element.style.background = 'white !important';
  });

  container.appendChild(tableClone);

  // Add footer
  const footer = document.createElement('p');
  footer.style.cssText = `
    margin-top: 20px;
    font-size: 10px;
    color: #94a3b8 !important;
    text-align: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  footer.textContent = `Generated by Screening System • ${new Date().toLocaleDateString()}`;
  container.appendChild(footer);

  document.body.appendChild(container);

  try {
    await new Promise(resolve => setTimeout(resolve, 200));

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: container.scrollWidth,
      height: container.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('landscape', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${filename}.pdf`);
  } catch {
    throw new Error('Failed to generate PDF from table');
  } finally {
    document.body.removeChild(container);
  }
};