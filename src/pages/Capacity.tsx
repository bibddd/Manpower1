import { useMemo, useState } from 'react';
import { Plus, Trash2, Download } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import ManualEntryModal from '../components/ManualEntryModal';
import { useStore } from '../store';
import { buildDepartmentDatasets } from '../lib/selectors';
import { DEPT_LABELS, DEPT_COLOR } from '../types';
import type { DeptKey } from '../types';
import { fmtNum } from '../lib/utils';
import { exportToExcel } from '../lib/exporter';
import toast from 'react-hot-toast';
import { periodSorter } from '../store';

const DEPT_KEYS: DeptKey[] = ['SL','SIM','PROC','OFFSITE','TECH_WRITERS','ENGINEERING','GDLS_DESIGNER','DESIGNERS'];

export default function Capacity() {
  const store = useStore();
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState<40 | 50 | 60>(50);

  const datasets = useMemo(
    () => buildDepartmentDatasets(store, store.settings.weeksPerMonth),
    [store],
  );

  const periods = useMemo(
    () => [...store.periods].sort(periodSorter),
    [store.periods],
  );

  const hasData = store.capacityRows.length > 0;
  if (!hasData) {
    return (
      <>
        <EmptyState title="No capacity data" description="Upload a spreadsheet with a Capacity sheet, or enter headcount manually." />
        {showModal && <ManualEntryModal onClose={() => setShowModal(false)} />}
      </>
    );
  }

  // Build headcount table: row = dept, col = period
  const hcTable: Record<DeptKey, Record<string, number>> = {} as never;
  DEPT_KEYS.forEach((k) => { hcTable[k] = {}; });
  store.capacityRows.forEach((row) => {
    if (!hcTable[row.deptKey]) hcTable[row.deptKey] = {};
    periods.forEach((p) => {
      hcTable[row.deptKey][p] = (hcTable[row.deptKey][p] ?? 0) + (row.periods[p] ?? 0);
    });
  });

  // Cap hours per dept/period at selected hours rate
  const wks = store.settings.weeksPerMonth;
  const capHrs = (hc: number) => hc * tab * wks;

  // Totals per period
  const periodTotals: Record<string, { hc: number; hrs: number }> = {};
  periods.forEach((p) => {
    const totalHc = DEPT_KEYS.reduce((s, k) => s + (hcTable[k][p] ?? 0), 0);
    periodTotals[p] = { hc: totalHc, hrs: capHrs(totalHc) };
  });

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-900">Capacity</h1>
          <p className="text-sm text-ink-500 mt-1">Headcount roster and calculated capacity hours per department</p>
        </div>
        <div className="flex gap-2">
          {/* Hours tab */}
          <div className="flex items-center gap-1 bg-white border border-ink-200 rounded-lg p-1">
            {([40, 50, 60] as const).map((h) => (
              <button
                key={h}
                onClick={() => setTab(h)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${tab === h ? 'bg-brand-600 text-white' : 'text-ink-600 hover:bg-ink-100'}`}
              >
                {h} hrs
              </button>
            ))}
          </div>
          <button onClick={() => setShowModal(true)} className="btn-secondary text-sm">
            <Plus size={14} /> Add
          </button>
          <button onClick={() => { exportToExcel(datasets); toast.success('Exported'); }} className="btn-secondary text-sm">
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* Capacity table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs tabular">
            <thead>
              <tr className="bg-ink-800 text-white">
                <th className="sticky left-0 bg-ink-800 px-4 py-3 text-left font-bold uppercase tracking-wide whitespace-nowrap">
                  Department / Role
                </th>
                {periods.map((p) => (
                  <th key={p} className="px-3 py-3 text-center font-semibold whitespace-nowrap">{p}</th>
                ))}
                <th className="px-3 py-3 text-center font-semibold bg-ink-900">Total</th>
              </tr>
            </thead>
            <tbody>
              {DEPT_KEYS.map((key, ri) => {
                const hcRow = hcTable[key] ?? {};
                const totalHc = periods.reduce((s, p) => s + (hcRow[p] ?? 0), 0);
                if (totalHc === 0) return null;
                return (
                  <tr key={key} className={ri % 2 === 0 ? 'bg-white hover:bg-ink-50' : 'bg-ink-50/50 hover:bg-ink-100'}>
                    <td className={`sticky left-0 px-4 py-2.5 font-semibold whitespace-nowrap ${ri % 2 === 0 ? 'bg-white' : 'bg-ink-50'}`}>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: DEPT_COLOR[key] }} />
                        <span className="text-ink-700">{DEPT_LABELS[key]}</span>
                      </div>
                    </td>
                    {periods.map((p) => {
                      const hc = hcRow[p] ?? 0;
                      return (
                        <td key={p} className="px-3 py-2.5 text-center">
                          <div className="font-semibold text-ink-700">{hc || '·'}</div>
                          {hc > 0 && (
                            <div className="text-[9px] text-ink-400 mt-0.5">{fmtNum(capHrs(hc))}</div>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2.5 text-center bg-ink-50 font-bold text-ink-800">
                      {fmtNum(periods.reduce((s, p) => s + (hcRow[p] ?? 0), 0))}
                    </td>
                  </tr>
                );
              })}

              {/* Totals row */}
              <tr className="bg-ink-700 text-white font-bold text-xs">
                <td className="sticky left-0 bg-ink-700 px-4 py-3 uppercase tracking-wide">TOTAL</td>
                {periods.map((p) => (
                  <td key={p} className="px-3 py-3 text-center">
                    <div>{periodTotals[p]?.hc ?? 0}</div>
                    <div className="text-[9px] text-ink-300 mt-0.5">{fmtNum(periodTotals[p]?.hrs ?? 0)}</div>
                  </td>
                ))}
                <td className="px-3 py-3 text-center bg-ink-900">
                  {fmtNum(periods.reduce((s, p) => s + (periodTotals[p]?.hc ?? 0), 0))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-dept summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {datasets
          .filter((d) => d.key !== 'TOTAL' && d.points.some((p) => p.headcount > 0))
          .map((d) => {
            const latest = d.points[d.points.length - 1];
            const cap = tab === 40 ? latest?.capacity40 : tab === 50 ? latest?.capacity50 : latest?.capacity60;
            return (
              <div key={d.key} className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="text-xs font-semibold text-ink-600 truncate">{d.label}</span>
                </div>
                <div className="text-xl font-bold text-ink-900 tabular">{fmtNum(latest?.headcount ?? 0)}</div>
                <div className="text-xs text-ink-400 mt-0.5">people · {fmtNum(cap ?? 0)} hrs cap</div>
              </div>
            );
          })}
      </div>

      {showModal && <ManualEntryModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
