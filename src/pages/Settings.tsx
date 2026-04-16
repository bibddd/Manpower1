import { useState } from 'react';
import { Save, Trash2, AlertTriangle, Info } from 'lucide-react';
import { useStore } from '../store';
import toast from 'react-hot-toast';

export default function Settings() {
  const { settings, updateSettings, clearAll, files, capacityRows, workloadEntries } = useStore();
  const [form, setForm] = useState({ ...settings });

  const handleSave = () => {
    updateSettings(form);
    toast.success('Settings saved');
  };

  const handleClear = () => {
    if (confirm('This will permanently delete ALL uploaded data, capacity rows, and workload entries. This cannot be undone.')) {
      clearAll();
      toast.success('All data cleared');
    }
  };

  const set = (k: keyof typeof form, v: unknown) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="space-y-6 animate-in max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-ink-900">Settings</h1>
        <p className="text-sm text-ink-500 mt-1">Configure the dashboard for your organization</p>
      </div>

      {/* General */}
      <div className="card p-5 space-y-4">
        <h2 className="font-semibold text-ink-800 border-b border-ink-100 pb-3">General</h2>

        <div>
          <label className="label">Company / Department Name</label>
          <input
            className="input text-sm"
            value={form.companyName}
            onChange={(e) => set('companyName', e.target.value)}
            placeholder="Engineering Department"
          />
        </div>

        <div>
          <label className="label">Fiscal Year Start Month</label>
          <select
            className="select text-sm"
            value={form.fiscalYearStart}
            onChange={(e) => set('fiscalYearStart', parseInt(e.target.value))}
          >
            {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Capacity calculation */}
      <div className="card p-5 space-y-4">
        <h2 className="font-semibold text-ink-800 border-b border-ink-100 pb-3">Capacity Calculation</h2>

        <div className="bg-brand-50 border border-brand-200 rounded-lg p-3 flex gap-2 text-sm text-brand-800">
          <Info size={15} className="flex-shrink-0 mt-0.5 text-brand-600" />
          Capacity Hours = Headcount × Hours/Week × Weeks/Month
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Default Hours/Week Baseline</label>
            <select
              className="select text-sm"
              value={form.defaultHoursPerWeek}
              onChange={(e) => set('defaultHoursPerWeek', parseInt(e.target.value) as 40 | 50 | 60)}
            >
              <option value={40}>40 hours (standard)</option>
              <option value={50}>50 hours (overtime)</option>
              <option value={60}>60 hours (crunch)</option>
            </select>
          </div>

          <div>
            <label className="label">Weeks Per Month</label>
            <input
              type="number"
              min="3"
              max="5"
              step="0.1"
              className="input text-sm"
              value={form.weeksPerMonth}
              onChange={(e) => set('weeksPerMonth', parseFloat(e.target.value))}
            />
            <p className="text-[11px] text-ink-400 mt-1">Standard is 4 weeks (used in reference spreadsheet)</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            id="showOffsite"
            type="checkbox"
            checked={form.showOffsite}
            onChange={(e) => set('showOffsite', e.target.checked)}
            className="w-4 h-4 rounded border-ink-300 text-brand-600"
          />
          <label htmlFor="showOffsite" className="text-sm text-ink-700">
            Show Offsite department in charts
          </label>
        </div>
      </div>

      {/* Save */}
      <button onClick={handleSave} className="btn-primary w-full">
        <Save size={15} /> Save Settings
      </button>

      {/* Danger zone */}
      <div className="card p-5 border border-red-200 bg-red-50 space-y-3">
        <div className="flex items-center gap-2 text-red-700">
          <AlertTriangle size={16} />
          <h2 className="font-semibold">Danger Zone</h2>
        </div>
        <p className="text-sm text-red-600">
          Clearing all data removes {files.length} file records, {capacityRows.length} capacity rows,
          and {workloadEntries.length} workload entries permanently.
        </p>
        <button onClick={handleClear} className="btn-danger text-sm">
          <Trash2 size={14} /> Clear All Data
        </button>
      </div>
    </div>
  );
}
