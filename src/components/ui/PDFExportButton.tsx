import { useState } from 'react';
import { FileText, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { generatePDFFromData } from '../../utils/pdfExport';

interface PDFExportButtonProps {
  data: Array<Record<string, string | number | boolean | null | undefined>>;
  columns: Array<{ header: string; accessor: string; width?: number }>;
  filename?: string;
  label?: string;
  className?: string;
  variant?: 'purple' | 'primary' | 'secondary' | 'outline' | 'success';
  icon?: boolean;
  onExportStart?: () => void;
  onExportComplete?: () => void;
}

export function PDFExportButton({
  data,
  columns,
  filename = 'export',
  label = 'Shortlist Report',
  className = '',
  variant = 'purple',
  icon = true,
  onExportStart,
  onExportComplete,
}: PDFExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (isExporting) return;
    
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }

    if (!columns || columns.length === 0) {
      toast.error('No columns defined');
      return;
    }

    console.log('Exporting data:', data.length, 'rows');
    console.log('Columns:', columns);

    setIsExporting(true);
    onExportStart?.();
    const toastId = toast.loading('Generating PDF...');

    try {
      await generatePDFFromData(data, columns, {
        filename: filename || `export_${new Date().toISOString().split('T')[0]}`,
        title: label || 'Shortlist Report',
        orientation: 'landscape',
      });

      toast.success('PDF generated successfully', { id: toastId });
      onExportComplete?.();
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate PDF', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const variantStyles = {
    purple: 'bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-700 dark:hover:bg-purple-800',
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-700 dark:hover:bg-indigo-800',
    secondary: 'bg-slate-600 hover:bg-slate-700 text-white dark:bg-slate-700 dark:hover:bg-slate-800',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-700 dark:hover:bg-emerald-800',
    outline: 'border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isExporting || data.length === 0}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variantStyles[variant]} ${className}`}
    >
      {isExporting ? (
        <LoaderCircle className="h-4 w-4 animate-spin" />
      ) : icon ? (
        <FileText className="h-4 w-4" />
      ) : null}
      {isExporting ? 'Generating...' : label}
    </button>
  );
}