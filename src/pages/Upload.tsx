import { useState } from 'react';
import { Trash2, RefreshCw, FileSpreadsheet, Info } from 'lucide-react';
import FileDropzone, { UploadedFileItem } from '../components/FileDropzone';
import ManualEntryModal from '../components/ManualEntryModal';
import { useStore } from '../store';
import { generateSampleData } from '../lib/parser';
import toast from 'react-hot-toast';
import { nanoid } from '../lib/utils';

export default function Upload() {
  const store = useStore();
  const [showModal, setShowModal] = useState(false);

  const loadDemo = () => {
    const data = generateSampleData();
    store.addCapacityRows(data.capacityRows);
    store.addWorkloadEntries(data.workloadEntries);
    store.setPeriods(data.periods);
    store.addFile({
      id: nanoid(),
      name: 'demo-data.xlsx (sample)',
      size: 0,
      type: 'demo',
      uploadedAt: new Date().toISOString(),
      periods: data.periods,
      status: 'ready',
      rowCount: data.capacityRows.length + data.workloadEntries.length,
    });
    toast.success('Sample data loaded — explore the Charts & Dashboard pages');
  };

  const clearAll = () => {
    if (store.files.length === 0 && store.workloadEntries.length === 0) {
      toast('Nothing to clear');
      return;
    }
    if (confirm('Clear ALL uploaded data? This cannot be undone.')) {
      store.clearAll();
      toast.success('All data cleared');
    }
  };

  return (
    <div className="space-y-6 animate-in max-w-3xl">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-ink-900">Upload Files</h1>
        <p className="text-sm text-ink-500 mt-1">
          Upload your Engineering Capacity & Workload spreadsheets. The parser auto-detects CAPACITY and WORKLOAD sheets.
        </p>
      </div>

      {/* Info banner */}
      <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 flex gap-3">
        <Info size={16} className="text-brand-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-brand-800">
          <strong>Expected format:</strong> Excel files with a <em>Capacity</em> sheet (role rows × monthly period columns) and a <em>Workload</em> sheet (Customer / Project / Dept rows × same columns). CSV and TSV are also supported. You can upload multiple files — data is merged automatically.
        </div>
      </div>

      {/* Dropzone */}
      <FileDropzone />

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => setShowModal(true)} className="btn-secondary text-sm">
          <FileSpreadsheet size={14} /> Enter Manually
        </button>
        <button onClick={loadDemo} className="btn-secondary text-sm">
          <RefreshCw size={14} /> Load Sample Data
        </button>
        <div className="flex-1" />
        <button onClick={clearAll} className="btn-danger text-sm">
          <Trash2 size={14} /> Clear All Data
        </button>
      </div>

      {/* Uploaded file list */}
      {store.files.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-ink-700 mb-3">
            Uploaded Files ({store.files.length})
          </h2>
          <div className="space-y-2">
            {store.files.map((f) => (
              <UploadedFileItem
                key={f.id}
                file={f}
                onRemove={(id) => {
                  store.removeFile(id);
                  toast.success('File removed');
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      {(store.capacityRows.length > 0 || store.workloadEntries.length > 0) && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Capacity Rows', value: store.capacityRows.length },
            { label: 'Workload Entries', value: store.workloadEntries.length },
            { label: 'Periods Tracked', value: store.periods.length },
          ].map(({ label, value }) => (
            <div key={label} className="card p-4 text-center">
              <div className="text-2xl font-bold text-brand-600 tabular">{value}</div>
              <div className="text-xs text-ink-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      )}

      {showModal && <ManualEntryModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
