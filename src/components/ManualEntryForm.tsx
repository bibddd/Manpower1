import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useApp } from '../context';
import { DEPARTMENTS, type Department } from '../types';

interface Row {
  week: string;
  department: Department;
  headcount: string;
  workloadHours: string;
}

const emptyRow = (): Row => ({
  week: '',
  department: DEPARTMENTS[0],
  headcount: '1',
  workloadHours: '',
});

export default function ManualEntryForm() {
  const { addEntries } = useApp();
  const [rows, setRows] = useState<Row[]>([emptyRow()]);

  const updateRow = (idx: number, field: keyof Row, value: string) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);

  const removeRow = (idx: number) => {
    if (rows.length === 1) return;
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valid = rows.filter((r) => r.week.trim() && r.workloadHours.trim());
    if (valid.length === 0) {
      toast.error('Please fill in at least one row with week and workload hours.');
      return;
    }
    addEntries(
      valid.map((r) => ({
        id: '',
        week: r.week.trim(),
        weekLabel: r.week.trim(),
        department: r.department,
        headcount: Number(r.headcount) || 1,
        workloadHours: Number(r.workloadHours) || 0,
      }))
    );
    toast.success(`Added ${valid.length} entries.`);
    setRows([emptyRow()]);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-3 py-2 text-left font-medium text-slate-600">Week / Period</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Department</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Headcount</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Workload (hrs)</th>
              <th className="px-3 py-2 w-8" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-b border-slate-100">
                <td className="px-2 py-1.5">
                  <input
                    className="input"
                    placeholder="e.g. Week 1"
                    value={row.week}
                    onChange={(e) => updateRow(idx, 'week', e.target.value)}
                    required
                  />
                </td>
                <td className="px-2 py-1.5">
                  <select
                    className="input"
                    value={row.department}
                    onChange={(e) => updateRow(idx, 'department', e.target.value)}
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-1.5">
                  <input
                    className="input w-24"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="1"
                    value={row.headcount}
                    onChange={(e) => updateRow(idx, 'headcount', e.target.value)}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    className="input w-28"
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="0"
                    value={row.workloadHours}
                    onChange={(e) => updateRow(idx, 'workloadHours', e.target.value)}
                    required
                  />
                </td>
                <td className="px-2 py-1.5">
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                    disabled={rows.length === 1}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button type="button" onClick={addRow} className="btn-secondary text-xs">
          <Plus size={14} /> Add Row
        </button>
        <button type="submit" className="btn-primary text-xs">
          Save Entries
        </button>
      </div>
    </form>
  );
}
