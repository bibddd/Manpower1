import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Users, Clock, AlertTriangle, Upload, BarChart3 } from 'lucide-react';
import { useApp } from '../context';
import { DEPARTMENTS, type Department } from '../types';

interface KPI {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: string;
}

export default function Dashboard() {
  const { state } = useApp();
  const { entries } = state;

  const stats = useMemo(() => {
    const totalEntries = entries.length;
    const totalWorkload = entries.reduce((s, e) => s + e.workloadHours, 0);
    const totalHeadcount = entries.reduce((s, e) => s + e.headcount, 0);
    const avgWorkload = totalEntries > 0 ? totalWorkload / totalEntries : 0;
    const avgCap50 = totalEntries > 0
      ? entries.reduce((s, e) => s + e.headcount * 50, 0) / totalEntries
      : 0;
    const overloaded = entries.filter((e) => e.workloadHours > e.headcount * 50).length;
    return { totalEntries, totalWorkload, totalHeadcount, avgWorkload, avgCap50, overloaded };
  }, [entries]);

  const deptSummary = useMemo(() => {
    return DEPARTMENTS.map((dept) => {
      const deptEntries = entries.filter((e) => e.department === dept);
      const count = deptEntries.length;
      const avgLoad = count > 0
        ? deptEntries.reduce((s, e) => s + e.workloadHours, 0) / count
        : 0;
      const avgCap = count > 0
        ? deptEntries.reduce((s, e) => s + e.headcount * 50, 0) / count
        : 0;
      const excess = avgCap - avgLoad;
      return { dept, count, avgLoad, avgCap, excess };
    });
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Manpower & Workload Tracking</p>
        </div>
        <div className="card p-12 text-center max-w-lg mx-auto">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload size={36} className="text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-700 mb-2">No data yet</h2>
          <p className="text-slate-400 text-sm mb-6">
            Upload an Excel or CSV file, or add entries manually to get started.
          </p>
          <div className="flex justify-center gap-3">
            <Link to="/upload" className="btn-primary">
              <Upload size={16} /> Upload File
            </Link>
            <Link to="/charts" className="btn-secondary">
              <BarChart3 size={16} /> View Charts
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const kpis: KPI[] = [
    {
      label: 'Total Records',
      value: stats.totalEntries.toLocaleString(),
      sub: 'data entries',
      icon: TrendingUp,
      color: 'bg-blue-500',
    },
    {
      label: 'Total Headcount',
      value: stats.totalHeadcount.toLocaleString(),
      sub: 'person-weeks',
      icon: Users,
      color: 'bg-emerald-500',
    },
    {
      label: 'Avg Workload',
      value: `${stats.avgWorkload.toFixed(0)} hrs`,
      sub: 'per entry',
      icon: Clock,
      color: 'bg-orange-500',
    },
    {
      label: 'Overloaded Entries',
      value: stats.overloaded.toLocaleString(),
      sub: `> 50 hrs/person`,
      icon: AlertTriangle,
      color: stats.overloaded > 0 ? 'bg-red-500' : 'bg-slate-400',
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Manpower & Workload Tracking</p>
        </div>
        <div className="flex gap-3">
          <Link to="/upload" className="btn-secondary text-xs">
            <Upload size={14} /> Upload More
          </Link>
          <Link to="/charts" className="btn-primary text-xs">
            <BarChart3 size={14} /> View Charts
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="card p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg ${kpi.color} flex items-center justify-center shrink-0`}>
              <kpi.icon size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500">{kpi.label}</p>
              <p className="text-xl font-bold text-slate-800 leading-tight">{kpi.value}</p>
              {kpi.sub && <p className="text-xs text-slate-400">{kpi.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="section-title">Department Summary</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Department</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Entries</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Avg Workload</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Avg Cap@50</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Avg Excess</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {deptSummary.map(({ dept, count, avgLoad, avgCap, excess }) => (
                <tr key={dept} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{dept}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{count}</td>
                  <td className="px-4 py-3 text-right text-red-600 font-medium">
                    {count > 0 ? `${avgLoad.toFixed(1)} hrs` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-green-700">
                    {count > 0 ? `${avgCap.toFixed(1)} hrs` : '—'}
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold ${count === 0 ? 'text-slate-400' : excess >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {count > 0 ? `${excess >= 0 ? '+' : ''}${excess.toFixed(1)} hrs` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {count === 0 ? (
                      <span className="badge bg-slate-100 text-slate-500">No data</span>
                    ) : excess >= 0 ? (
                      <span className="badge bg-green-100 text-green-700">OK</span>
                    ) : (
                      <span className="badge bg-red-100 text-red-700">Overloaded</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
