import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn, fmtBytes } from '../lib/utils';
import { parseFile } from '../lib/parser';
import { useStore } from '../store';
import { nanoid } from '../lib/utils';
import toast from 'react-hot-toast';

const ACCEPTED_TYPES = {
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'text/csv': ['.csv'],
  'text/tab-separated-values': ['.tsv'],
  'text/plain': ['.txt'],
};

export default function FileDropzone() {
  const { addFile, addCapacityRows, addWorkloadEntries, setPeriods, periods } = useStore();
  const [processing, setProcessing] = useState<string[]>([]);

  const processFile = useCallback(
    async (file: File) => {
      const id = nanoid();
      setProcessing((p) => [...p, id]);

      addFile({
        id,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        periods: [],
        status: 'processing',
        rowCount: 0,
      });

      try {
        const result = await parseFile(file);
        const rowCount = result.capacityRows.length + result.workloadEntries.length;

        // Merge periods
        const existingPeriods = periods.length ? periods : [];
        const merged = Array.from(new Set([...existingPeriods, ...result.periods]));
        if (merged.length) setPeriods(merged);

        addCapacityRows(result.capacityRows);
        addWorkloadEntries(result.workloadEntries);

        // Update file record to ready
        useStore.setState((s) => ({
          files: s.files.map((f) =>
            f.id === id
              ? { ...f, status: 'ready', periods: result.periods, rowCount }
              : f,
          ),
        }));

        toast.success(
          `${file.name} imported — ${result.capacityRows.length} capacity rows, ${result.workloadEntries.length} workload entries`,
        );
      } catch (err) {
        useStore.setState((s) => ({
          files: s.files.map((f) =>
            f.id === id
              ? { ...f, status: 'error', errorMsg: String(err) }
              : f,
          ),
        }));
        toast.error(`Failed to parse ${file.name}: ${String(err)}`);
      } finally {
        setProcessing((p) => p.filter((x) => x !== id));
      }
    },
    [addCapacityRows, addFile, addWorkloadEntries, periods, setPeriods],
  );

  const onDrop = useCallback(
    (accepted: File[]) => {
      accepted.forEach(processFile);
    },
    [processFile],
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: 50 * 1024 * 1024, // 50 MB
    multiple: true,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'relative border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 group',
        isDragActive && !isDragReject && 'border-brand-500 bg-brand-50',
        isDragReject && 'border-red-500 bg-red-50',
        !isDragActive && 'border-ink-200 bg-white hover:border-brand-400 hover:bg-brand-50/30',
      )}
    >
      <input {...getInputProps()} />

      {/* Icon */}
      <div className={cn(
        'w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-all',
        isDragActive ? 'bg-brand-100 scale-110' : 'bg-ink-100 group-hover:bg-brand-100',
      )}>
        <Upload
          size={28}
          className={cn(
            'transition-colors',
            isDragActive ? 'text-brand-600' : 'text-ink-400 group-hover:text-brand-500',
          )}
        />
      </div>

      {isDragActive ? (
        <p className="text-lg font-semibold text-brand-600">Drop files here</p>
      ) : (
        <>
          <p className="text-base font-semibold text-ink-800 mb-1">
            Drag & drop files, or click to browse
          </p>
          <p className="text-sm text-ink-500 mb-4">
            Supports Excel (.xlsx, .xls), CSV, TSV, and TXT files up to 50 MB
          </p>
          <div className="flex items-center gap-3">
            <span className="chip bg-green-100 text-green-700">
              <FileSpreadsheet size={12} />
              .xlsx / .xls
            </span>
            <span className="chip bg-blue-100 text-blue-700">
              <FileText size={12} />
              .csv
            </span>
            <span className="chip bg-amber-100 text-amber-700">
              <FileText size={12} />
              .tsv / .txt
            </span>
          </div>
        </>
      )}

      {processing.length > 0 && (
        <div className="mt-4 flex items-center gap-2 text-sm text-brand-600">
          <Loader2 size={15} className="animate-spin" />
          Processing {processing.length} file{processing.length > 1 ? 's' : ''}…
        </div>
      )}
    </div>
  );
}

// ─── Uploaded file list item ──────────────────────────────────────────────────
export function UploadedFileItem({ file, onRemove }: { file: { id: string; name: string; size: number; status: string; rowCount: number; errorMsg?: string; uploadedAt: string }; onRemove: (id: string) => void }) {
  const isReady = file.status === 'ready';
  const isError = file.status === 'error';
  const isLoading = file.status === 'processing';

  return (
    <div className="flex items-center gap-4 p-4 bg-white border border-ink-200 rounded-xl">
      {/* Icon */}
      <div className={cn(
        'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
        isReady ? 'bg-green-100' : isError ? 'bg-red-100' : 'bg-ink-100',
      )}>
        {isLoading ? (
          <Loader2 size={18} className="text-ink-500 animate-spin" />
        ) : isReady ? (
          <CheckCircle size={18} className="text-green-600" />
        ) : isError ? (
          <AlertCircle size={18} className="text-red-600" />
        ) : (
          <FileSpreadsheet size={18} className="text-ink-500" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink-800 truncate">{file.name}</p>
        <p className="text-xs text-ink-400 mt-0.5">
          {fmtBytes(file.size)} ·{' '}
          {isLoading ? 'Processing…' : isReady ? `${file.rowCount} rows imported` : file.errorMsg}
        </p>
      </div>

      {/* Status chip */}
      <span className={cn(
        'chip text-xs',
        isReady ? 'bg-green-100 text-green-700' : isError ? 'bg-red-100 text-red-700' : 'bg-ink-100 text-ink-500',
      )}>
        {isLoading ? 'Processing' : isReady ? 'Ready' : 'Error'}
      </span>

      {/* Remove */}
      <button
        onClick={() => onRemove(file.id)}
        className="btn-ghost p-1.5 rounded-lg text-ink-400 hover:text-red-500"
        aria-label="Remove file"
      >
        <X size={15} />
      </button>
    </div>
  );
}
