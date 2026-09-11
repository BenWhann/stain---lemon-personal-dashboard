import React, { useRef, useState } from 'react';
import { Download, Upload, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useTaskStore } from '../../store/useTaskStore';

interface DataExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataExportModal: React.FC<DataExportModalProps> = ({ isOpen, onClose }) => {
  const { uploadCsv } = useTaskStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await uploadCsv(file);
      onClose();
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExportDownload = () => {
    window.location.href = '/api/sync/export-csv';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📊 Tasks & Data Import / Export" maxWidth="md">
      <div className="space-y-4 text-xs">
        <p className="text-stone-600 dark:text-stone-300">
          Easily export your clinical tasks, deadlines, and schedule as an RFC 4180 compliant CSV file, or restore from a CSV export.
        </p>

        {/* Export Option */}
        <div className="p-4 rounded-2xl bg-cat-50/70 dark:bg-stone-800/60 border border-cat-200/80 dark:border-stone-700/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cat-500 text-white flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100">
                Export Tasks to CSV
              </h4>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Download all active and completed tasks in Master Sheet format.
              </p>
            </div>
          </div>

          <button
            onClick={handleExportDownload}
            className="px-4 py-2 rounded-xl bg-cat-500 hover:bg-cat-600 text-white font-bold cursor-pointer transition-all shadow-xs shrink-0"
          >
            Download CSV
          </button>
        </div>

        {/* Import Option */}
        <div className="p-4 rounded-2xl bg-cat-50/70 dark:bg-stone-800/60 border border-cat-200/80 dark:border-stone-700/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100">
                Import Tasks from CSV
              </h4>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Upload a CSV spreadsheet with 'Task Title' and 'Due Date' columns.
              </p>
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            className="hidden"
          />

          <button
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold cursor-pointer transition-all shadow-xs shrink-0 disabled:opacity-50 flex items-center gap-1.5"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Importing...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Upload CSV</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
