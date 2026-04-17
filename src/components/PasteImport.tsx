import React, { useState } from 'react';
import { ClipboardPaste, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { parsePastedText } from '../lib/parser';
import { useApp } from '../context';

export default function PasteImport() {
  const { addEntries } = useApp();
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<{ count: number; errors: string[] } | null>(null);

  const handlePreview = () => {
    if (!text.trim()) {
      toast.error('Please paste some data first.');
      return;
    }
    const result = parsePastedText(text);
    setPreview({ count: result.entries.length, errors: result.errors });
  };

  const handleImport = () => {
    if (!text.trim()) return;
    const result = parsePastedText(text);
    if (result.entries.length === 0) {
      toast.error('No valid rows found. Check the format and column headers.');
      return;
    }
    addEntries(result.entries);
    toast.success(`Imported ${result.entries.length} records.`);
    setText('');
    setPreview(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Paste tab-separated data from Excel</label>
        <p className="text-xs text-slate-400 mb-2">
          Expected columns: <code className="bg-slate-100 px-1 rounded">Week | Department | Headcount | Workload Hours</code>
        </p>
        <textarea
          className="input h-48 font-mono text-xs resize-y"
          placeholder={"Week\tDepartment\tHeadcount\tWorkload Hours\nWeek 1\tSimulation\t5\t220\nWeek 2\tSimulation\t5\t245"}
          value={text}
          onChange={(e) => { setText(e.target.value); setPreview(null); }}
        />
      </div>

      {preview && (
        <div className={`p-3 rounded-lg border text-sm ${preview.count > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className={preview.count > 0 ? 'text-green-600' : 'text-red-600'} />
            <span className={preview.count > 0 ? 'text-green-700' : 'text-red-700'}>
              Found <strong>{preview.count}</strong> valid records
              {preview.errors.length > 0 && `, ${preview.errors.length} rows skipped`}
            </span>
          </div>
          {preview.errors.slice(0, 3).map((err, i) => (
            <p key={i} className="text-xs text-red-600 mt-1 ml-6">{err}</p>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={handlePreview} className="btn-secondary">
          <ClipboardPaste size={14} /> Preview
        </button>
        <button type="button" onClick={handleImport} className="btn-primary">
          Import Data
        </button>
      </div>
    </div>
  );
}
