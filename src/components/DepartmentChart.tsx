import React, { useMemo } from 'react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { type WeekEntry, type ChartDataPoint } from '../types';
import { formatNumber } from '../lib/utils';

interface Props {
  department: string;
  entries: WeekEntry[];
}

function buildChartData(entries: WeekEntry[]): ChartDataPoint[] {
  const weekMap = new Map<string, { workload: number; cap40: number; cap50: number; cap60: number }>();

  for (const e of entries) {
    const existing = weekMap.get(e.weekLabel);
    if (existing) {
      existing.workload += e.workloadHours;
      existing.cap40 += e.headcount * 40;
      existing.cap50 += e.headcount * 50;
      existing.cap60 += e.headcount * 60;
    } else {
      weekMap.set(e.weekLabel, {
        workload: e.workloadHours,
        cap40: e.headcount * 40,
        cap50: e.headcount * 50,
        cap60: e.headcount * 60,
      });
    }
  }

  return Array.from(weekMap.entries()).map(([weekLabel, d]) => ({
    weekLabel,
    ...d,
  }));
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: p.color }} />
          <span className="text-slate-600">{p.name}:</span>
          <span className="font-medium text-slate-800">{p.value.toFixed(0)} hrs</span>
        </div>
      ))}
    </div>
  );
};

export default function DepartmentChart({ department, entries }: Props) {
  const data = useMemo(() => buildChartData(entries), [entries]);

  const tableRows = useMemo(() => {
    if (data.length === 0) return null;
    const avgWorkload = data.reduce((s, d) => s + d.workload, 0) / data.length;
    const avgCap40 = data.reduce((s, d) => s + d.cap40, 0) / data.length;
    const avgCap50 = data.reduce((s, d) => s + d.cap50, 0) / data.length;
    const avgCap60 = data.reduce((s, d) => s + d.cap60, 0) / data.length;
    const avgExcess = avgCap50 - avgWorkload;
    return { avgWorkload, avgCap40, avgCap50, avgCap60, avgExcess };
  }, [data]);

  if (entries.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="section-title mb-1">{department}</h3>
        <p className="text-slate-400 text-sm">No data available for this department.</p>
      </div>
    );
  }

  return (
    <div className="card p-6 print:break-inside-avoid">
      <h3 className="text-base font-bold text-slate-800 mb-4 uppercase tracking-wide">
        {department}
      </h3>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="weekLabel"
              tick={{ fontSize: 10, fill: '#64748b' }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              width={45}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="line"
              wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
            />
            <Area
              type="monotone"
              dataKey="workload"
              name="Workload"
              fill="#ef4444"
              fillOpacity={0.7}
              stroke="#dc2626"
              strokeWidth={1.5}
            />
            <Line
              type="monotone"
              dataKey="cap40"
              name="Cap @ 40 hrs/wk"
              stroke="#1d4ed8"
              strokeWidth={2}
              dot={false}
              strokeDasharray="4 2"
            />
            <Line
              type="monotone"
              dataKey="cap50"
              name="Cap @ 50 hrs/wk"
              stroke="#15803d"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="cap60"
              name="Cap @ 60 hrs/wk"
              stroke="#9333ea"
              strokeWidth={2}
              dot={false}
              strokeDasharray="4 2"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {tableRows && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="px-3 py-2 text-left font-semibold text-slate-600 border border-slate-200">
                  WORKLOAD
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600 border border-slate-200">
                  CAPACITY @ 40 HRS
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600 border border-slate-200">
                  CAPACITY @ 50 HRS
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600 border border-slate-200">
                  CAPACITY @ 60 HRS
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600 border border-slate-200">
                  AVG EXCESS CAP
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white">
                <td className="px-3 py-2 border border-slate-200 text-slate-800 font-medium">
                  {formatNumber(tableRows.avgWorkload)} hrs
                </td>
                <td className="px-3 py-2 border border-slate-200 text-blue-700 font-medium">
                  {formatNumber(tableRows.avgCap40)} hrs
                </td>
                <td className="px-3 py-2 border border-slate-200 text-green-700 font-medium">
                  {formatNumber(tableRows.avgCap50)} hrs
                </td>
                <td className="px-3 py-2 border border-slate-200 text-purple-700 font-medium">
                  {formatNumber(tableRows.avgCap60)} hrs
                </td>
                <td className={`px-3 py-2 border border-slate-200 font-semibold ${tableRows.avgExcess >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                  {tableRows.avgExcess >= 0 ? '+' : ''}{formatNumber(tableRows.avgExcess)} hrs
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {data.length > 0 && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-2 py-1.5 text-left font-medium text-slate-500 border border-slate-100">Week</th>
                <th className="px-2 py-1.5 text-right font-medium text-slate-500 border border-slate-100">Workload</th>
                <th className="px-2 py-1.5 text-right font-medium text-slate-500 border border-slate-100">Cap@40</th>
                <th className="px-2 py-1.5 text-right font-medium text-slate-500 border border-slate-100">Cap@50</th>
                <th className="px-2 py-1.5 text-right font-medium text-slate-500 border border-slate-100">Cap@60</th>
                <th className="px-2 py-1.5 text-right font-medium text-slate-500 border border-slate-100">Excess</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => {
                const excess = row.cap50 - row.workload;
                return (
                  <tr key={row.weekLabel} className="hover:bg-slate-50">
                    <td className="px-2 py-1 border border-slate-100 text-slate-700">{row.weekLabel}</td>
                    <td className="px-2 py-1 border border-slate-100 text-right text-red-700 font-medium">{row.workload.toFixed(0)}</td>
                    <td className="px-2 py-1 border border-slate-100 text-right text-blue-700">{row.cap40.toFixed(0)}</td>
                    <td className="px-2 py-1 border border-slate-100 text-right text-green-700">{row.cap50.toFixed(0)}</td>
                    <td className="px-2 py-1 border border-slate-100 text-right text-purple-700">{row.cap60.toFixed(0)}</td>
                    <td className={`px-2 py-1 border border-slate-100 text-right font-semibold ${excess >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                      {excess >= 0 ? '+' : ''}{excess.toFixed(0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
