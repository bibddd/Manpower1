import { useState } from 'react';
import { Plus, Clipboard, Users, Clock } from 'lucide-react';
import ManualEntryModal from '../components/ManualEntryModal';
import { useStore } from '../store';
import { DEPT_LABELS } from '../types';
import type { DeptKey } from '../types';
import { fmtNum, generatePeriodRange } from '../lib/utils';
import toast from 'react-hot-toast';

const DEPT_KEYS: DeptKey[] = ['SL','SIM','PROC','OFFSITE','TECH_WRITERS','ENGINEERING','GDLS_DESIGNER','DESIGNERS'];

export default function ManualEntry() {
  const store = useStore();
  const [showModal, setShowModal] = useState(false);

  const availPeriods = store.periods.length ? store.periods : generatePeriodRange('Jan-25', 12);

  // Quick batch entry: a grid of dept × period for headcount
  const [batchMode, setBatchMode] = useState<'workload' | 'capacity'>('capacity');
  const [batchPeriod, setBatchPeriod] = useState(availPeriods[0] ?? 'Jan-25');
  const [batchValues, setBatchValues] = useState<Record<DeptKey, string>>({} as never);

  const handleBatchSave = () => {
    let count = 0;
    for (const [key, raw] of Object.entries(batchValues)) {
      const val = parseFloat(raw);
      if (isNaN(val) || val < 0) continue;
      if (batchMode === 'capacity') {
        store.addManualCapacity({ deptKey: key as DeptKey, period: batchPeriod, headcount: val });
      } else {
        store.addManualWorkload({
          customer: 'Manual',
          project: `${DEPT_LABELS[key as DeptKey]} — ${batchPeriod}`,
          deptKey: key as DeptKey,
          period: batchPeriod,
          hours: val,
        });
      }
      count++;
    }
    if (count) {
      toast.success(`Saved ${count} entries for ${batchPeriod}`);
      setBatchValues({} as never);
    } else {
      toast.error('No valid values to save');
    }
  };

  return (
    <div className="space-y-6 animate-in max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-900">Manual Entry</h1>
          <p className="text-sm text-ink-500 mt-1">
            Enter data without uploading a file — batch entry, individual entries, or paste from Excel.
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary text-sm">
          <Plus size={14} /> Open Full Entry Form
        </button>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center gap-1 bg-white border border-ink-200 rounded-lg p-1 w-fit">
        <button
          onClick={() => setBatchMode('capacity')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${batchMode === 'capacity' ? 'bg-brand-600 text-white' : 'text-ink-600 hover:bg-ink-100'}`}
        >
          <Users size={14} /> Headcount
        </button>
        <button
          onClick={() => setBatchMode('workload')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${batchMode === 'workload' ? 'bg-brand-600 text-white' : 'text-ink-600 hover:bg-ink-100'}`}
        >
          <Clock size={14} /> Workload Hours
        </button>
      </div>

      {/* Batch entry grid */}
      <div className="card p-5">
        <div className="flex items-center gap-4 mb-5">
          <div>
            <label className="label">Period</label>
            <select
              className="select w-36 text-sm"
              value={batchPeriod}
              onChange={(e) => setBatchPeriod(e.target.value)}
            >
              {availPeriods.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="text-sm text-ink-500 mt-5">
            Enter {batchMode === 'capacity' ? 'headcount (number of people)' : 'workload hours'} per department
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          {DEPT_KEYS.map((key) => (
            <div key={key}>
              <label className="label">{DEPT_LABELS[key]}</label>
              <input
                type="number"
                min="0"
                step={batchMode === 'capacity' ? '1' : '40'}
                placeholder={batchMode === 'capacity' ? 'headcount' : 'hours'}
                className="input text-sm"
                value={batchValues[key] ?? ''}
                onChange={(e) => setBatchValues((prev) => ({ ...prev, [key]: e.target.value }))}
              />
            </div>
          ))}
        </div>

        <button onClick={handleBatchSave} className="btn-primary w-full">
          <Plus size={15} /> Save All Entries for {batchPeriod}
        </button>
      </div>

      {/* Paste instructions */}
      <div className="card p-5">
        <div className="flex items-center gap-3 mb-3">
          <Clipboard size={18} className="text-brand-600" />
          <h2 className="font-semibold text-ink-800">Paste from Excel / Google Sheets</h2>
        </div>
        <p className="text-sm text-ink-600 mb-4">
          Copy a block of cells directly from your spreadsheet and paste into the form below. Tab-separated values are automatically parsed.
        </p>
        <button onClick={() => setShowModal(true)} className="btn-secondary text-sm">
          <Clipboard size={14} /> Open Paste Import
        </button>
      </div>

      {/* Summary */}
      {(store.capacityRows.length > 0 || store.workloadEntries.length > 0) && (
        <div className="card p-5">
          <h2 className="font-semibold text-ink-800 mb-3">Current Data Summary</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-brand-600">{store.capacityRows.length}</div>
              <div className="text-xs text-ink-500">Capacity rows</div>
            </div>
            <div>
              <div className="text-xl font-bold text-brand-600">{store.workloadEntries.length}</div>
              <div className="text-xs text-ink-500">Workload entries</div>
            </div>
            <div>
              <div className="text-xl font-bold text-brand-600">{store.periods.length}</div>
              <div className="text-xs text-ink-500">Periods</div>
            </div>
          </div>
        </div>
      )}

      {showModal && <ManualEntryModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
