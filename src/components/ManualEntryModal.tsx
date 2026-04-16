import { useState } from 'react';
import { X, Plus, Clipboard, ChevronDown } from 'lucide-react';
import { useStore } from '../store';
import { parsePastedText } from '../lib/parser';
import { DEPT_LABELS } from '../types';
import type { DeptKey } from '../types';
import toast from 'react-hot-toast';
import { cn, generatePeriodRange } from '../lib/utils';

type Tab = 'workload' | 'capacity' | 'paste';

interface Props {
  onClose: () => void;
}

const DEPT_KEYS: DeptKey[] = ['SL','SIM','PROC','OFFSITE','TECH_WRITERS','ENGINEERING','GDLS_DESIGNER','DESIGNERS'];

export default function ManualEntryModal({ onClose }: Props) {
  const { addManualWorkload, addManualCapacity, addCapacityRows, addWorkloadEntries, setPeriods, periods } = useStore();
  const [tab, setTab] = useState<Tab>('workload');

  // Workload form
  const [wlCustomer, setWlCustomer] = useState('');
  const [wlProject, setWlProject] = useState('');
  const [wlDept, setWlDept] = useState<DeptKey>('SL');
  const [wlPeriod, setWlPeriod] = useState(periods[0] ?? 'Jan-25');
  const [wlHours, setWlHours] = useState('');

  // Capacity form
  const [capDept, setCapDept] = useState<DeptKey>('SL');
  const [capPeriod, setCapPeriod] = useState(periods[0] ?? 'Jan-25');
  const [capHeadcount, setCapHeadcount] = useState('');

  // Paste
  const [pasteText, setPasteText] = useState('');

  // Period picker — use existing or generate next 12 months
  const availPeriods = periods.length
    ? periods
    : generatePeriodRange('Jan-25', 12);

  const handleAddWorkload = () => {
    if (!wlCustomer || !wlProject || !wlHours) {
      toast.error('Fill in all workload fields');
      return;
    }
    const hrs = parseFloat(wlHours);
    if (isNaN(hrs) || hrs < 0) { toast.error('Invalid hours'); return; }
    addManualWorkload({ customer: wlCustomer, project: wlProject, deptKey: wlDept, period: wlPeriod, hours: hrs });
    toast.success(`Added ${hrs} hrs for ${wlProject} / ${DEPT_LABELS[wlDept]}`);
    setWlHours('');
  };

  const handleAddCapacity = () => {
    if (!capHeadcount) { toast.error('Enter headcount'); return; }
    const hc = parseInt(capHeadcount, 10);
    if (isNaN(hc) || hc < 0) { toast.error('Invalid headcount'); return; }
    addManualCapacity({ deptKey: capDept, period: capPeriod, headcount: hc });
    toast.success(`Set ${hc} headcount for ${DEPT_LABELS[capDept]} / ${capPeriod}`);
    setCapHeadcount('');
  };

  const handlePaste = () => {
    if (!pasteText.trim()) { toast.error('Paste some data first'); return; }
    try {
      const result = parsePastedText(pasteText);
      addCapacityRows(result.capacityRows);
      addWorkloadEntries(result.workloadEntries);
      if (result.periods.length) setPeriods(result.periods);
      toast.success(`Imported ${result.capacityRows.length} capacity rows + ${result.workloadEntries.length} workload entries`);
      setPasteText('');
    } catch (e) {
      toast.error('Could not parse pasted data — make sure it is tab-separated');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-card-lg w-full max-w-2xl mx-4 overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-200">
          <h2 className="text-base font-bold text-ink-800">Add Data Manually</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg text-ink-400 hover:text-ink-700">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-ink-200 px-6">
          {(['workload','capacity','paste'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-4 py-3 text-sm font-medium border-b-2 -mb-px capitalize transition-colors',
                tab === t
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-ink-500 hover:text-ink-800',
              )}
            >
              {t === 'paste' ? 'Paste Import' : t === 'workload' ? 'Workload Hours' : 'Headcount'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-6">
          {/* ── Workload tab ─────────────────────────────────────── */}
          {tab === 'workload' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Customer</label>
                  <input className="input" placeholder="e.g. GM, KUKA" value={wlCustomer} onChange={(e) => setWlCustomer(e.target.value)} />
                </div>
                <div>
                  <label className="label">Project Name</label>
                  <input className="input" placeholder="e.g. GM PARMA T1XX" value={wlProject} onChange={(e) => setWlProject(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Department</label>
                  <div className="relative">
                    <select className="select" value={wlDept} onChange={(e) => setWlDept(e.target.value as DeptKey)}>
                      {DEPT_KEYS.map((k) => (
                        <option key={k} value={k}>{DEPT_LABELS[k]}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">Period</label>
                  <div className="relative">
                    <select className="select" value={wlPeriod} onChange={(e) => setWlPeriod(e.target.value)}>
                      {availPeriods.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">Hours</label>
                  <input className="input" type="number" min="0" step="10" placeholder="e.g. 960" value={wlHours} onChange={(e) => setWlHours(e.target.value)} />
                </div>
              </div>
              <button onClick={handleAddWorkload} className="btn-primary w-full">
                <Plus size={15} /> Add Workload Entry
              </button>
            </div>
          )}

          {/* ── Capacity tab ──────────────────────────────────────── */}
          {tab === 'capacity' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Department</label>
                  <select className="select" value={capDept} onChange={(e) => setCapDept(e.target.value as DeptKey)}>
                    {DEPT_KEYS.map((k) => (
                      <option key={k} value={k}>{DEPT_LABELS[k]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Period</label>
                  <select className="select" value={capPeriod} onChange={(e) => setCapPeriod(e.target.value)}>
                    {availPeriods.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Headcount</label>
                  <input className="input" type="number" min="0" step="1" placeholder="e.g. 8" value={capHeadcount} onChange={(e) => setCapHeadcount(e.target.value)} />
                </div>
              </div>
              <p className="text-xs text-ink-400">
                Capacity hours are calculated automatically:
                headcount × 40/50/60 hrs × {useStore.getState().settings.weeksPerMonth} weeks/month
              </p>
              <button onClick={handleAddCapacity} className="btn-primary w-full">
                <Plus size={15} /> Set Headcount
              </button>
            </div>
          )}

          {/* ── Paste tab ─────────────────────────────────────────── */}
          {tab === 'paste' && (
            <div className="space-y-4">
              <p className="text-sm text-ink-600">
                Copy cells from Excel or Google Sheets and paste below.
                The app auto-detects CAPACITY and WORKLOAD formats using tab-separated values.
              </p>
              <div>
                <label className="label">Pasted Data</label>
                <textarea
                  className="input font-mono text-xs h-40 resize-y"
                  placeholder="Paste spreadsheet data here (tab-separated)…"
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <button onClick={handlePaste} className="btn-primary flex-1">
                  <Clipboard size={15} /> Import Pasted Data
                </button>
                <button onClick={() => setPasteText('')} className="btn-secondary">
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
