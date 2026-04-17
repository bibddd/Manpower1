import React, { useMemo } from 'react';
import { useApp } from '../context';
import { DEPARTMENTS } from '../types';
import { Link } from 'react-router-dom';
import { Upload } from 'lucide-react';

export default function Capacity() {
  const { state } = useApp();
  const { entries } = state;

  const rows = useMemo(() => {
    return DEPARTMENTS.map((dept) => {
      const deptEntries = entries.filter((e) => e.department === dept);
      const weeks = new Set(deptEntries.map((e) => e.weekLabel)).size;
      const totalHeadcount = deptEntries.reduce((s, e) => s + e.headcount, 0);
      const avgHead = weeks > 0 ? totalHeadcount / weeks : 0;
      const totalWorkload = deptEntries.reduce((s, e) => s + e.workloadHours, 0);
      const avgWorkload = weeks > 0 ? totalWorkload / weeks : 0;
      const avgCap40 = avgHead * 40;
      const avgCap50 = avgHead * 50;
      const avgCap60 = avgHead * 60;
      const utilization = avgCap50 > 0 ? (avgWorkload / avgCap50) * 100 : 0;
      return { dept, weeks, avgHead, avgWorkload, avgCap40, avgCap50, avgCap60, utilization };
    });
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Capacity Analysis</h1>
        <div className="card p-10 text-center max-w-sm mx-auto">
          <p className="text-slate-500 mb-4">No data available.</p>
          <Link to="/upload" className="btn-primary text-sm"><Upload size={14} /> Upload Data</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Capacity Analysis</h1>
        <p className="text-slate-500 text-sm mt-1">Average capacity and utilization by department</p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Department</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Weeks</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Avg Headcount</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Avg Workload</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Cap @ 40</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Cap @ 50</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Cap @ 60</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Utilization</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ dept, weeks, avgHead, avgWorkload, avgCap40, avgCap50, avgCap60, utilization }) => (
                <tr key={dept} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{dept}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{weeks}</td>
                  <td className="px-4 py-3 text-right text-slate-600">
                    {weeks > 0 ? avgHead.toFixed(1) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-red-600 font-medium">
                    {weeks > 0 ? `${avgWorkload.toFixed(1)} hrs` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-blue-700">
                    {weeks > 0 ? `${avgCap40.toFixed(1)} hrs` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-green-700 font-medium">
                    {weeks > 0 ? `${avgCap50.toFixed(1)} hrs` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-purple-700">
                    {weeks > 0 ? `${avgCap60.toFixed(1)} hrs` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {weeks > 0 ? (
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${utilization > 100 ? 'bg-red-500' : utilization > 80 ? 'bg-orange-400' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(utilization, 100)}%` }}
                          />
                        </div>
                        <span className={`font-semibold text-xs min-w-[3rem] text-right ${utilization > 100 ? 'text-red-600' : utilization > 80 ? 'text-orange-600' : 'text-green-700'}`}>
                          {utilization.toFixed(1)}%
                        </span>
                      </div>
                    ) : '—'}
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
