import { useMemo, useState } from 'react';
import { Plus, Search, Trash2, Download, ChevronDown, ChevronUp } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import ManualEntryModal from '../components/ManualEntryModal';
import { useStore } from '../store';
import { DEPT_LABELS, DEPT_COLOR } from '../types';
import type { DeptKey } from '../types';
import { fmtNum } from '../lib/utils';
import { periodSorter } from '../store';
import toast from 'react-hot-toast';

export default function Workload() {
  const store = useStore();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [sortCol, setSortCol] = useState<'totalHours' | 'customer' | 'project'>('totalHours');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const periods = useMemo(() => [...store.periods].sort(periodSorter), [store.periods]);

  const filtered = useMemo(() => {
    let rows = [...store.workloadEntries];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.customer.toLowerCase().includes(q) ||
          r.project.toLowerCase().includes(q),
      );
    }
    if (deptFilter !== 'all') rows = rows.filter((r) => r.deptKey === deptFilter);
    rows.sort((a, b) => {
      const av = sortCol === 'totalHours' ? a.totalHours : a[sortCol];
      const bv = sortCol === 'totalHours' ? b.totalHours : b[sortCol];
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return rows;
  }, [store.workloadEntries, search, deptFilter, sortCol, sortDir]);

  const hasData = store.workloadEntries.length > 0;
  if (!hasData) {
    return (
      <>
        <EmptyState title="No workload data" description="Upload a spreadsheet with a Workload sheet, or add project hours manually." />
        {showModal && <ManualEntryModal onClose={() => setShowModal(false)} />}
      </>
    );
  }

  const toggleSort = (col: typeof sortCol) => {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortCol(col); setSortDir('desc'); }
  };

  const SortIcon = ({ col }: { col: typeof sortCol }) =>
    sortCol === col ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : null;

  // Grand totals per period
  const grandTotals: Record<string, number> = {};
  periods.forEach((p) => {
    grandTotals[p] = store.workloadEntries.reduce((s, e) => s + (e.periods[p] ?? 0), 0);
  });
  const grandTotal = store.workloadEntries.reduce((s, e) => s + e.totalHours, 0);

  // Dept summary
  const deptSummary: Record<string, number> = {};
  store.workloadEntries.forEach((e) => {
    deptSummary[e.deptKey] = (deptSummary[e.deptKey] ?? 0) + e.totalHours;
  });

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-900">Workload</h1>
          <p className="text-sm text-ink-500 mt-1">
            Project hours by customer, department, and period
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowModal(true)} className="btn-secondary text-sm">
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      {/* Dept summary chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setDeptFilter('all')}
          className={`chip px-3 py-1.5 text-xs border transition-all ${deptFilter === 'all' ? 'bg-ink-800 text-white border-ink-800' : 'bg-white border-ink-200 text-ink-600 hover:border-ink-400'}`}
        >
          All Departments
        </button>
        {Object.entries(deptSummary).map(([key, hrs]) => (
          <button
            key={key}
            onClick={() => setDeptFilter(deptFilter === key ? 'all' : key)}
            className={`chip px-3 py-1.5 text-xs border transition-all ${deptFilter === key ? 'text-white border-transparent' : 'bg-white border-ink-200 text-ink-600 hover:border-ink-400'}`}
            style={deptFilter === key ? { background: DEPT_COLOR[key as DeptKey] ?? '#3b82f6', borderColor: DEPT_COLOR[key as DeptKey] } : {}}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: DEPT_COLOR[key as DeptKey] ?? '#94a3b8' }} />
            {DEPT_LABELS[key as DeptKey] ?? key} · {fmtNum(hrs)}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            className="input pl-8 text-sm"
            placeholder="Search customer or project…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="text-xs text-ink-400">{filtered.length} of {store.workloadEntries.length} entries</span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs tabular">
            <thead>
              <tr className="bg-brand-700 text-white">
                <th
                  className="sticky left-0 bg-brand-700 px-4 py-3 text-left font-bold cursor-pointer hover:bg-brand-800 whitespace-nowrap"
                  onClick={() => toggleSort('customer')}
                >
                  <span className="flex items-center gap-1">Customer <SortIcon col="customer" /></span>
                </th>
                <th
                  className="px-3 py-3 text-left font-bold cursor-pointer hover:bg-brand-800 whitespace-nowrap"
                  onClick={() => toggleSort('project')}
                >
                  <span className="flex items-center gap-1">Project <SortIcon col="project" /></span>
                </th>
                <th className="px-3 py-3 text-left font-bold whitespace-nowrap">Dept</th>
                {periods.map((p) => (
                  <th key={p} className="px-2 py-3 text-center font-semibold whitespace-nowrap">{p}</th>
                ))}
                <th
                  className="px-3 py-3 text-center font-bold cursor-pointer hover:bg-brand-800 bg-brand-800 whitespace-nowrap"
                  onClick={() => toggleSort('totalHours')}
                >
                  <span className="flex items-center justify-center gap-1">Total <SortIcon col="totalHours" /></span>
                </th>
                <th className="px-2 py-3 text-center font-semibold" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry, ri) => (
                <tr
                  key={entry.id}
                  className={`border-b border-ink-100 ${ri % 2 === 0 ? 'bg-white hover:bg-ink-50' : 'bg-ink-50/50 hover:bg-ink-100'} transition-colors`}
                >
                  <td className={`sticky left-0 px-4 py-2.5 font-semibold text-ink-800 whitespace-nowrap ${ri % 2 === 0 ? 'bg-white' : 'bg-ink-50'}`}>
                    {entry.customer}
                  </td>
                  <td className="px-3 py-2.5 text-ink-700 max-w-[180px] truncate" title={entry.project}>
                    {entry.project}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className="chip text-white text-[9px] px-2 py-0.5"
                      style={{ background: DEPT_COLOR[entry.deptKey] ?? '#64748b' }}
                    >
                      {entry.deptKey}
                    </span>
                  </td>
                  {periods.map((p) => {
                    const v = entry.periods[p] ?? 0;
                    return (
                      <td key={p} className="px-2 py-2.5 text-center text-ink-600">
                        {v ? fmtNum(v) : <span className="text-ink-200">·</span>}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2.5 text-center font-bold text-ink-800 bg-ink-50">
                    {fmtNum(entry.totalHours)}
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${entry.project}" entry?`)) {
                          useStore.setState((s) => ({
                            workloadEntries: s.workloadEntries.filter((e) => e.id !== entry.id),
                          }));
                          toast.success('Entry deleted');
                        }
                      }}
                      className="btn-ghost p-1 text-ink-300 hover:text-red-500 rounded"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}

              {/* Grand total row */}
              <tr className="bg-ink-800 text-white font-bold">
                <td className="sticky left-0 bg-ink-800 px-4 py-3 uppercase tracking-wide" colSpan={3}>
                  TOTAL WORKLOAD
                </td>
                {periods.map((p) => (
                  <td key={p} className="px-2 py-3 text-center">
                    {grandTotals[p] ? fmtNum(grandTotals[p]) : '·'}
                  </td>
                ))}
                <td className="px-3 py-3 text-center bg-ink-900">{fmtNum(grandTotal)}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {showModal && <ManualEntryModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
