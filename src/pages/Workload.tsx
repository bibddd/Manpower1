import React, { useMemo, useState } from 'react';
import { useApp } from '../context';
import { DEPARTMENTS, type Department } from '../types';
import { Link } from 'react-router-dom';
import { Upload, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Workload() {
  const { state, deleteEntry } = useApp();
  const { entries } = state;
  const [filterDept, setFilterDept] = useState<Department | 'ALL'>('ALL');
  const [filterWeek, setFilterWeek] = useState('');

  const weeks = useMemo(() => {
    const s = new Set(entries.map((e) => e.weekLabel));
    return Array.from(s).sort();
  }, [entries]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (filterDept !== 'ALL' && e.department !== filterDept) return false;
      if (filterWeek && !e.weekLabel.toLowerCase().includes(filterWeek.toLowerCase())) return false;
      return true;
    });
  }, [entries, filterDept, filterWeek]);

  const handleDelete = (id: string) => {
    deleteEntry(id);
    toast.success('Entry removed.');
  };

  if (entries.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Workload Data</h1>
        <div className="card p-10 text-center max-w-sm mx-auto">
          <p className="text-slate-500 mb-4">No workload data yet.</p>
          <Link to="/upload" className="btn-primary text-sm"><Upload size={14} /> Upload Data</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Workload Data</h1>
        <p className="text-slate-500 text-sm mt-1">{entries.length} total records</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <select
          className="input w-64"
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value as Department | 'ALL')}
        >
          <option value="ALL">All Departments</option>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <input
          className="input w-48"
          placeholder="Filter by week..."
          value={filterWeek}
          onChange={(e) => setFilterWeek(e.target.value)}
        />
        <span className="text-sm text-slate-400 self-center">{filtered.length} rows</span>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Week</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Department</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Headcount</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Workload (hrs)</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Cap @ 40</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Cap @ 50</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Cap @ 60</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Excess (50)</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => {
                const cap50 = e.headcount * 50;
                const excess = cap50 - e.workloadHours;
                return (
                  <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-slate-700">{e.weekLabel}</td>
                    <td className="px-4 py-2.5 text-slate-700">{e.department}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">{e.headcount}</td>
                    <td className="px-4 py-2.5 text-right text-red-600 font-medium">{e.workloadHours}</td>
                    <td className="px-4 py-2.5 text-right text-blue-700">{(e.headcount * 40).toFixed(0)}</td>
                    <td className="px-4 py-2.5 text-right text-green-700">{cap50.toFixed(0)}</td>
                    <td className="px-4 py-2.5 text-right text-purple-700">{(e.headcount * 60).toFixed(0)}</td>
                    <td className={`px-4 py-2.5 text-right font-semibold ${excess >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                      {excess >= 0 ? '+' : ''}{excess.toFixed(0)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
