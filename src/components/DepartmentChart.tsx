/**
 * DepartmentChart — replicates the reference "Chart" tab layout exactly:
 *   - Centered title
 *   - Red filled area for WORKLOAD (mountain chart)
 *   - Three capacity lines: 40hr (light blue), 50hr (dark blue/grey), 60hr (green)
 *   - X-axis: monthly periods
 *   - Below the chart: styled data table with WORKLOAD, CAP@40/50/60, AVG EXCESS CAP
 */
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
import type { DepartmentDataset } from '../types';
import { fmtNum } from '../lib/utils';

interface Props {
  dataset: DepartmentDataset;
  hoursFilter?: 40 | 50 | 60 | 'all';
}

const CAP_COLORS = {
  cap40: '#38bdf8', // light blue
  cap50: '#475569', // slate / dark
  cap60: '#22c55e', // green
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-ink-900 text-white text-xs rounded-lg p-3 shadow-xl border border-ink-700 min-w-[160px]">
      <p className="font-semibold mb-2 text-ink-300 uppercase tracking-wide">{label}</p>
      {payload.map((item, i) => (
        <div key={i} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
            <span className="text-ink-300">{item.name}</span>
          </div>
          <span className="font-mono font-semibold">{fmtNum(item.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function DepartmentChart({ dataset, hoursFilter = 'all' }: Props) {
  const { label, points, avgExcessCap40, avgExcessCap50, avgExcessCap60 } = dataset;
  if (!points.length) return null;

  // Build recharts data array
  const data = points.map((p) => ({
    period: p.period,
    Workload: p.workload,
    'Cap @ 40 Hrs': p.capacity40,
    'Cap @ 50 Hrs': p.capacity50,
    'Cap @ 60 Hrs': p.capacity60,
  }));

  // Y-axis domain with 10% headroom
  const maxVal = Math.max(
    ...points.map((p) => Math.max(p.workload, p.capacity60)),
    100,
  );
  const yMax = Math.ceil((maxVal * 1.1) / 500) * 500;

  const show40 = hoursFilter === 'all' || hoursFilter === 40;
  const show50 = hoursFilter === 'all' || hoursFilter === 50;
  const show60 = hoursFilter === 'all' || hoursFilter === 60;

  // Table rows
  const totalWorkload = points.reduce((s, p) => s + p.workload, 0);
  const totalCap40 = points.reduce((s, p) => s + p.capacity40, 0);
  const totalCap50 = points.reduce((s, p) => s + p.capacity50, 0);
  const totalCap60 = points.reduce((s, p) => s + p.capacity60, 0);

  return (
    <div className="card overflow-hidden print:break-inside-avoid">
      {/* Chart title */}
      <div className="px-6 pt-5 pb-0 text-center">
        <h3 className="text-sm font-bold text-ink-800 uppercase tracking-widest">
          {label}
        </h3>
      </div>

      {/* Mountain chart */}
      <div className="px-4 pt-4 pb-2" style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id={`redFill-${dataset.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#dc2626" stopOpacity={0.9} />
                <stop offset="95%" stopColor="#dc2626" stopOpacity={0.5} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="2 4" stroke="#e2e8f0" vertical={false} />

            <XAxis
              dataKey="period"
              tick={{ fontSize: 9, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              interval="preserveStartEnd"
            />

            <YAxis
              tick={{ fontSize: 9, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
              domain={[0, yMax]}
              width={36}
            />

            <Tooltip content={<CustomTooltip />} />

            <Legend
              iconType="circle"
              iconSize={7}
              wrapperStyle={{ fontSize: 10, paddingTop: 4 }}
            />

            {/* Red workload mountain */}
            <Area
              type="monotone"
              dataKey="Workload"
              stroke="#dc2626"
              strokeWidth={1.5}
              fill={`url(#redFill-${dataset.key})`}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />

            {/* Capacity lines */}
            {show40 && (
              <Line
                type="monotone"
                dataKey="Cap @ 40 Hrs"
                stroke={CAP_COLORS.cap40}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3 }}
              />
            )}
            {show50 && (
              <Line
                type="monotone"
                dataKey="Cap @ 50 Hrs"
                stroke={CAP_COLORS.cap50}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3 }}
              />
            )}
            {show60 && (
              <Line
                type="monotone"
                dataKey="Cap @ 60 Hrs"
                stroke={CAP_COLORS.cap60}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ── Data table below chart (mirrors reference spreadsheet) ── */}
      <div className="overflow-x-auto border-t border-ink-100">
        <table className="w-full text-[10px] tabular">
          <thead>
            <tr className="bg-brand-700 text-white">
              <th className="sticky left-0 bg-brand-700 px-3 py-1.5 text-left font-bold uppercase tracking-wide whitespace-nowrap">
                {label}
              </th>
              {points.map((p) => (
                <th key={p.period} className="px-2 py-1.5 text-center font-semibold whitespace-nowrap">
                  {p.period}
                </th>
              ))}
              <th className="px-2 py-1.5 text-center font-semibold bg-brand-800">Total</th>
            </tr>
          </thead>
          <tbody>
            {/* WORKLOAD */}
            <tr className="bg-white hover:bg-ink-50 border-b border-ink-100">
              <td className="sticky left-0 bg-white px-3 py-1 font-semibold text-ink-700 whitespace-nowrap">WORKLOAD</td>
              {points.map((p) => (
                <td key={p.period} className="px-2 py-1 text-center text-ink-600">
                  {p.workload ? fmtNum(p.workload) : '·'}
                </td>
              ))}
              <td className="px-2 py-1 text-center font-semibold text-ink-800 bg-ink-50">
                {fmtNum(totalWorkload)}
              </td>
            </tr>

            {/* CAP @ 40 */}
            <tr className="bg-sky-50 hover:bg-sky-100 border-b border-ink-100">
              <td className="sticky left-0 bg-sky-50 px-3 py-1 font-semibold text-sky-700 whitespace-nowrap">
                CAPACITY @ 40 HOURS
              </td>
              {points.map((p) => (
                <td key={p.period} className="px-2 py-1 text-center text-sky-700">
                  {p.capacity40 ? fmtNum(p.capacity40) : '·'}
                </td>
              ))}
              <td className="px-2 py-1 text-center font-semibold text-sky-800 bg-sky-100">
                {fmtNum(totalCap40)}
              </td>
            </tr>

            {/* CAP @ 50 */}
            <tr className="bg-white hover:bg-ink-50 border-b border-ink-100">
              <td className="sticky left-0 bg-white px-3 py-1 font-semibold text-ink-700 whitespace-nowrap">
                CAPACITY @ 50 HOURS
              </td>
              {points.map((p) => (
                <td key={p.period} className="px-2 py-1 text-center text-ink-600">
                  {p.capacity50 ? fmtNum(p.capacity50) : '·'}
                </td>
              ))}
              <td className="px-2 py-1 text-center font-semibold text-ink-800 bg-ink-50">
                {fmtNum(totalCap50)}
              </td>
            </tr>

            {/* CAP @ 60 */}
            <tr className="bg-green-50 hover:bg-green-100 border-b border-ink-100">
              <td className="sticky left-0 bg-green-50 px-3 py-1 font-semibold text-green-700 whitespace-nowrap">
                CAPACITY @ 60 HOURS
              </td>
              {points.map((p) => (
                <td key={p.period} className="px-2 py-1 text-center text-green-700">
                  {p.capacity60 ? fmtNum(p.capacity60) : '·'}
                </td>
              ))}
              <td className="px-2 py-1 text-center font-semibold text-green-800 bg-green-100">
                {fmtNum(totalCap60)}
              </td>
            </tr>

            {/* AVG EXCESS CAP */}
            <tr className="bg-ink-800 text-white">
              <td className="sticky left-0 bg-ink-800 px-3 py-1.5 font-bold whitespace-nowrap uppercase tracking-wide">
                Average Excess Cap
              </td>
              {points.map((p) => {
                const excess = p.excessCap50;
                return (
                  <td
                    key={p.period}
                    className={`px-2 py-1.5 text-center font-semibold ${
                      excess < 0 ? 'text-red-400' : 'text-green-400'
                    }`}
                  >
                    {fmtNum(excess)}
                  </td>
                );
              })}
              <td className={`px-2 py-1.5 text-center font-bold bg-ink-900 ${avgExcessCap50 < 0 ? 'text-red-400' : 'text-green-400'}`}>
                {fmtNum(avgExcessCap50 * points.length)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
