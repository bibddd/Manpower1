import React, { useState } from 'react';
import { Trash2, Upload as UploadIcon, ClipboardPaste, PenSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import FileUpload from '../components/FileUpload';
import ManualEntryForm from '../components/ManualEntryForm';
import PasteImport from '../components/PasteImport';
import { useApp } from '../context';

type Tab = 'file' | 'manual' | 'paste';

export default function Upload() {
  const { state, clearAll } = useApp();
  const [tab, setTab] = useState<Tab>('file');

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'file', label: 'File Upload', icon: UploadIcon },
    { id: 'manual', label: 'Manual Entry', icon: PenSquare },
    { id: 'paste', label: 'Paste from Excel', icon: ClipboardPaste },
  ];

  const handleClear = () => {
    if (state.entries.length === 0) return;
    if (!confirm(`Delete all ${state.entries.length} records? This cannot be undone.`)) return;
    clearAll();
    toast.success('All data cleared.');
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Upload Data</h1>
          <p className="text-slate-500 text-sm mt-1">
            {state.entries.length} records loaded
          </p>
        </div>
        {state.entries.length > 0 && (
          <button onClick={handleClear} className="btn-danger text-xs">
            <Trash2 size={14} /> Clear All Data
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 flex">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === id
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'file' && <FileUpload />}
          {tab === 'manual' && <ManualEntryForm />}
          {tab === 'paste' && <PasteImport />}
        </div>
      </div>

      {state.entries.length > 0 && (
        <div className="mt-6 card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="section-title">Recent Entries</h2>
            <span className="text-xs text-slate-400">{state.entries.length} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 py-2.5 text-left font-medium text-slate-500">Week</th>
                  <th className="px-4 py-2.5 text-left font-medium text-slate-500">Department</th>
                  <th className="px-4 py-2.5 text-right font-medium text-slate-500">Headcount</th>
                  <th className="px-4 py-2.5 text-right font-medium text-slate-500">Workload</th>
                  <th className="px-4 py-2.5 text-right font-medium text-slate-500">Cap@50</th>
                </tr>
              </thead>
              <tbody>
                {state.entries.slice(-50).reverse().map((e) => (
                  <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-2 text-slate-700">{e.weekLabel}</td>
                    <td className="px-4 py-2 text-slate-700">{e.department}</td>
                    <td className="px-4 py-2 text-right text-slate-600">{e.headcount}</td>
                    <td className="px-4 py-2 text-right text-red-600 font-medium">{e.workloadHours} hrs</td>
                    <td className="px-4 py-2 text-right text-green-700">{(e.headcount * 50).toFixed(0)} hrs</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
