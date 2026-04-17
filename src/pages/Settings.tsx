import React from 'react';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useApp } from '../context';
import { DEPARTMENTS } from '../types';

export default function Settings() {
  const { state, clearAll, setViewMode } = useApp();

  const handleClear = () => {
    if (state.entries.length === 0) { toast.error('No data to clear.'); return; }
    if (!confirm(`Delete all ${state.entries.length} records? This cannot be undone.`)) return;
    clearAll();
    toast.success('All data cleared.');
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Configure dashboard preferences</p>
      </div>

      <div className="space-y-6">
        <div className="card p-6">
          <h2 className="section-title mb-4">Display</h2>
          <div>
            <label className="label">View Mode</label>
            <div className="flex gap-3 mt-1">
              <button
                onClick={() => setViewMode('weekly')}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  state.viewMode === 'weekly'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setViewMode('monthly')}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  state.viewMode === 'monthly'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="section-title mb-1">Departments</h2>
          <p className="text-xs text-slate-400 mb-4">Tracked departments (fixed per enterprise configuration)</p>
          <div className="space-y-2">
            {DEPARTMENTS.map((dept) => {
              const count = state.entries.filter((e) => e.department === dept).length;
              return (
                <div key={dept} className="flex items-center justify-between py-1.5 border-b border-slate-50">
                  <span className="text-sm text-slate-700">{dept}</span>
                  <span className="text-xs text-slate-400">{count} records</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-6 border-red-100">
          <h2 className="text-lg font-semibold text-red-600 mb-2">Danger Zone</h2>
          <p className="text-sm text-slate-500 mb-4">
            Clear all imported data. This action cannot be undone.
          </p>
          <button onClick={handleClear} className="btn-danger">
            <Trash2 size={15} /> Clear All Data ({state.entries.length} records)
          </button>
        </div>
      </div>
    </div>
  );
}
