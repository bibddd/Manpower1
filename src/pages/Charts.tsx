/**
 * Charts page — mirrors the "Chart" tab from the reference spreadsheet.
 * Shows one DepartmentChart per dept (System Layout, Simulation, Processing,
 * Designers, Engineering/GD&T/FEA, GDLS Designers, Total Capacity Engineering).
 * Red mountain workload + 3 capacity lines + data table below each chart.
 */
import { useMemo, useState } from 'react';
import { Printer, Download, Filter } from 'lucide-react';
import DepartmentChart from '../components/DepartmentChart';
import EmptyState from '../components/EmptyState';
import { useStore } from '../store';
import { buildDepartmentDatasets } from '../lib/selectors';
import { exportToExcel } from '../lib/exporter';
import toast from 'react-hot-toast';

type HoursFilter = 40 | 50 | 60 | 'all';

export default function Charts() {
  const store = useStore();
  const [hoursFilter, setHoursFilter] = useState<HoursFilter>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');

  const datasets = useMemo(
    () => buildDepartmentDatasets(store, store.settings.weeksPerMonth),
    [store],
  );

  const hasData = datasets.some((d) => d.points.some((p) => p.workload > 0 || p.capacity50 > 0));

  if (!hasData) {
    return <EmptyState title="No chart data" description="Upload your Capacity & Workload spreadsheet to generate department mountain charts." />;
  }

  const displayed = deptFilter === 'all'
    ? datasets
    : datasets.filter((d) => d.key === deptFilter);

  const handleExport = () => {
    exportToExcel(datasets);
    toast.success('Charts exported to Excel');
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-900">Department Charts</h1>
          <p className="text-sm text-ink-500 mt-1">
            Workload (red mountain) vs Capacity at 40 / 50 / 60 hrs per week
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Hours filter */}
          <div className="flex items-center gap-1 bg-white border border-ink-200 rounded-lg p-1">
            {(['all', 40, 50, 60] as HoursFilter[]).map((h) => (
              <button
                key={h}
                onClick={() => setHoursFilter(h)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  hoursFilter === h
                    ? 'bg-brand-600 text-white'
                    : 'text-ink-600 hover:bg-ink-100'
                }`}
              >
                {h === 'all' ? 'All Hrs' : `${h} Hrs`}
              </button>
            ))}
          </div>

          {/* Dept filter */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="select text-sm w-48"
          >
            <option value="all">All Departments</option>
            {datasets.map((d) => (
              <option key={d.key} value={d.key}>{d.label}</option>
            ))}
          </select>

          <button onClick={handleExport} className="btn-secondary text-sm">
            <Download size={14} /> Export
          </button>
          <button onClick={() => window.print()} className="btn-secondary text-sm">
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      {/* Charts grid */}
      <div className="space-y-8">
        {displayed.map((dataset) => (
          <DepartmentChart
            key={dataset.key}
            dataset={dataset}
            hoursFilter={hoursFilter}
          />
        ))}
      </div>
    </div>
  );
}
