import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Clock, TrendingUp, AlertTriangle, BarChart3,
  Upload, PenLine, FileSpreadsheet,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import KPICard from '../components/KPICard';
import EmptyState from '../components/EmptyState';
import ManualEntryModal from '../components/ManualEntryModal';
import { useStore } from '../store';
import { buildDepartmentDatasets } from '../lib/selectors';
import { fmtNum, fmtHours } from '../lib/utils';
import { DEPT_COLOR } from '../types';
import type { DeptKey } from '../types';

export default function Dashboard() {
  const store = useStore();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const datasets = useMemo(
    () => buildDepartmentDatasets(store, store.settings.weeksPerMonth),
    [store],
  );

  const hasData = store.capacityRows.length > 0 || store.workloadEntries.length > 0;

  if (!hasData) {
    return (
      <>
        <EmptyState
          title="Welcome to Manpower Dashboard"
          description="Upload your Engineering Capacity & Workload spreadsheets (CAPACITY + WORKLOAD tabs). Supports .xlsx, .xls, CSV and paste-from-Excel."
          action={
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/upload')} className="btn-primary">
                <Upload size={15} /> Upload Spreadsheet
              </button>
              <button onClick={() => setShowModal(true)} className="btn-secondary">
                <PenLine size={15} /> Enter Manually
              </button>
            </div>
          }
        />
        {showModal && <ManualEntryModal onClose={() => setShowModal(false)} />}
      </>
    );
  }

  // Aggregate KPIs from Total dataset
  const total = datasets.find((d) => d.key === 'TOTAL');
  const latestPt = total?.points[total.points.length - 1];
  const prevPt = total?.points[total.points.length - 2];

  const totalHeadcount = latestPt?.headcount ?? 0;
  const totalWorkload = total?.totalWorkload ?? 0;
  const utilization = latestPt
    ? Math.round((latestPt.workload / (latestPt.capacity50 || 1)) * 100)
    : 0;
  const excess = latestPt ? latestPt.excessCap50 : 0;
  const workloadTrend = prevPt && latestPt
    ? ((latestPt.workload - prevPt.workload) / (prevPt.workload || 1)) * 100
    : 0;

  // Build combined overview chart data
  const overviewData = total?.points.map((p) => ({
    period: p.period,
    Workload: p.workload,
    'Cap @ 50 Hrs': p.capacity50,
  })) ?? [];

  // Mini breakdown — workload by dept for latest period
  const latestPeriod = store.periods[store.periods.length - 1] ?? '';
  const deptBreakdown = datasets
    .filter((d) => d.key !== 'TOTAL')
    .map((d) => {
      const pt = d.points.find((p) => p.period === latestPeriod);
      return { key: d.key as DeptKey, label: d.label, workload: pt?.workload ?? 0, headcount: pt?.headcount ?? 0, utilization: pt ? Math.round((pt.workload / (pt.capacity50 || 1)) * 100) : 0 };
    })
    .sort((a, b) => b.workload - a.workload);

  return (
    <div className="space-y-6 animate-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-900">{store.settings.companyName}</h1>
          <p className="text-sm text-ink-500 mt-0.5">
            {total?.points.length ?? 0} periods tracked · Last updated {new Date().toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowModal(true)} className="btn-secondary text-sm">
            <PenLine size={14} /> Add Data
          </button>
          <button onClick={() => navigate('/charts')} className="btn-primary text-sm">
            <BarChart3 size={14} /> View Charts
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          label="Total Headcount"
          value={fmtNum(totalHeadcount)}
          sub={`Latest period (${latestPeriod})`}
          icon={<Users size={18} />}
          color="blue"
          onClick={() => navigate('/capacity')}
        />
        <KPICard
          label="Total Workload"
          value={fmtNum(totalWorkload)}
          sub="cumulative hours"
          trend={workloadTrend}
          icon={<Clock size={18} />}
          color="violet"
          onClick={() => navigate('/workload')}
        />
        <KPICard
          label="Utilization (50 hr)"
          value={`${utilization}%`}
          sub="latest period"
          icon={<TrendingUp size={18} />}
          color={utilization > 100 ? 'red' : utilization > 80 ? 'amber' : 'green'}
        />
        <KPICard
          label="Excess Capacity"
          value={fmtNum(Math.abs(excess))}
          sub={excess >= 0 ? 'hrs available' : 'hrs OVER capacity'}
          icon={<AlertTriangle size={18} />}
          color={excess < 0 ? 'red' : 'green'}
        />
      </div>

      {/* Overview area chart */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-ink-800">Total Capacity Engineering Overview</h2>
            <p className="text-xs text-ink-400 mt-0.5">All departments combined · Workload vs Capacity @ 50 hrs</p>
          </div>
          <button onClick={() => navigate('/charts')} className="btn-ghost text-xs gap-1">
            <BarChart3 size={13} /> Full Charts
          </button>
        </div>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={overviewData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="overviewRed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.85} />
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0.3} />
                </linearGradient>
                <linearGradient id="overviewBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} width={40} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: 'none', borderRadius: 10, fontSize: 12, color: '#f8fafc' }}
                formatter={(v: number) => [fmtNum(v), '']}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="Workload" stroke="#dc2626" strokeWidth={2} fill="url(#overviewRed)" dot={false} />
              <Area type="monotone" dataKey="Cap @ 50 Hrs" stroke="#3b82f6" strokeWidth={1.5} fill="url(#overviewBlue)" dot={false} strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department breakdown */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-ink-100 flex items-center justify-between">
          <h2 className="font-semibold text-ink-800">Department Breakdown — {latestPeriod}</h2>
          <span className="text-xs text-ink-400">Workload vs Capacity @ 50 hrs</span>
        </div>
        <div className="divide-y divide-ink-100">
          {deptBreakdown.map(({ key, label, workload, headcount, utilization: util }) => (
            <div key={key} className="px-5 py-3 flex items-center gap-4 hover:bg-ink-50 transition-colors">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: DEPT_COLOR[key] }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-ink-700 truncate">{label}</span>
                  <span className="text-sm font-mono text-ink-600 ml-4">{fmtNum(workload)} hrs</span>
                </div>
                <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(util, 100)}%`,
                      background: util > 100 ? '#dc2626' : util > 80 ? '#f59e0b' : DEPT_COLOR[key],
                    }}
                  />
                </div>
              </div>
              <div className="text-right flex-shrink-0 w-20">
                <div className={`text-sm font-bold ${util > 100 ? 'text-red-600' : util > 80 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {util}%
                </div>
                <div className="text-[10px] text-ink-400">{fmtNum(headcount)} people</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent files */}
      {store.files.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-ink-800">Uploaded Files</h2>
            <button onClick={() => navigate('/upload')} className="text-xs text-brand-600 hover:underline">
              Manage →
            </button>
          </div>
          <div className="space-y-2">
            {store.files.slice(0, 4).map((f) => (
              <div key={f.id} className="flex items-center gap-3 text-sm">
                <FileSpreadsheet size={15} className="text-ink-400 flex-shrink-0" />
                <span className="flex-1 truncate text-ink-700">{f.name}</span>
                <span className={`chip text-[10px] ${f.status === 'ready' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {f.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && <ManualEntryModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
