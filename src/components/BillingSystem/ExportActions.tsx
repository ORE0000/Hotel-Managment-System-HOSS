import React from 'react';
import toast from 'react-hot-toast';
import { File as FilePdf, FileSpreadsheet, FileJson, Copy, Files } from 'lucide-react';
import { BillData, ExportFormat } from 'src/types';
import { exportToPdf, exportToExcel, exportToJson, copyToClipboard, exportMultipleBillsToPdf } from '../../lib/exportUtils';
import './Billing.css';

interface ExportActionsProps {
  billData: BillData;
  allBills?: BillData[];
}

const ExportActions: React.FC<ExportActionsProps> = ({ billData, allBills }) => {
  const handleExport = (format: ExportFormat) => {
    try {
      switch (format) {
        case 'pdf':
          exportToPdf(billData);
          toast.success('PDF generated successfully!');
          break;
        case 'excel':
          exportToExcel(billData);
          toast.success('Excel file generated successfully!');
          break;
        case 'json':
          exportToJson(billData);
          toast.success('JSON file generated successfully!');
          break;
        default:
          break;
      }
    } catch (error) {
      toast.error('Failed to export bill. Please try again.');
      console.error('Export error:', error);
    }
  };

  const handleMultipleBillsExport = async () => {
    try {
      if (allBills && allBills.length > 0) {
        await exportMultipleBillsToPdf(allBills);
        toast.success('Multiple bills PDF generated successfully!');
      }
    } catch (error) {
      toast.error('Failed to export multiple bills. Please try again.');
      console.error('Export error:', error);
    }
  };

  const handleCopy = () => {
    try {
      copyToClipboard(billData);
      toast.success('Bill details copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy bill details. Please try again.');
      console.error('Copy error:', error);
    }
  };

  return (
    <div className="flex flex-wrap gap-4 justify-center">
      <button 
        onClick={() => handleExport('pdf')}
        className="btn-primary"
        aria-label="Export to PDF"
      >
        <FilePdf size={18} />
        Export as PDF
      </button>
      
      {allBills && allBills.length > 1 && (
        <button 
          onClick={handleMultipleBillsExport}
          className="btn-primary"
          aria-label="Export all bills to PDF"
        >
          <Files size={18} />
          Export All Bills
        </button>
      )}
      
      <button 
        onClick={() => handleExport('excel')}
        className="btn-primary"
        aria-label="Export to Excel"
      >
        <FileSpreadsheet size={18} />
        Export as Excel
      </button>
      
      <button 
        onClick={() => handleExport('json')}
        className="btn-primary"
        aria-label="Export to JSON"
      >
        <FileJson size={18} />
        Export as JSON
      </button>
      
      <button 
        onClick={handleCopy}
        className="btn-secondary"
        aria-label="Copy bill details"
      >
        <Copy size={18} />
        Copy Bill Details
      </button>
    </div>
  );
};

export default ExportActions;