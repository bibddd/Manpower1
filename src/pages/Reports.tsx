import React from 'react';
import { Download, Printer, FileSpreadsheet, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { useApp } from '../context';
import { exportToExcel, exportToCsv, printDashboard } from '../lib/exporter';

export default function Reports() {
  const { state } = useApp();
  const { entries } = state;

  const handleExcelExport = () => {
    if (entries.length === 0) { toast.error('No data to export.'); return; }
    exportToExcel(entries);
    toast.success('Excel file downloaded.');
  };

  const handleCsvExport = () => {
    if (entries.length === 0) { toast.error('No data to export.'); return; }
    exportToCsv(entries);
    toast.success('CSV file downloaded.');
  };

  const handlePrint = () => {
    printDashboard();
  };

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Reports & Export</h1>
        <p className="text-slate-500 text-sm mt-1">
          Download data or print the dashboard — {entries.length} records loaded
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={handleExcelExport}
          className="card p-6 text-left hover:shadow-md transition-shadow group cursor-pointer"
        >
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-200 transition-colors">
            <FileSpreadsheet size={24} className="text-emerald-700" />
          </div>
          <h3 className="font-semibold text-slate-800">Export to Excel</h3>
          <p className="text-slate-400 text-xs mt-1">
            Downloads .xlsx with all departments as separate sheets
          </p>
        </button>

        <button
          onClick={handleCsvExport}
          className="card p-6 text-left hover:shadow-md transition-shadow group cursor-pointer"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
            <FileText size={24} className="text-blue-700" />
          </div>
          <h3 className="font-semibold text-slate-800">Export to CSV</h3>
          <p className="text-slate-400 text-xs mt-1">
            Downloads a flat .csv file with all records
          </p>
        </button>

        <button
          onClick={handlePrint}
          className="card p-6 text-left hover:shadow-md transition-shadow group cursor-pointer"
        >
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-slate-200 transition-colors">
            <Printer size={24} className="text-slate-700" />
          </div>
          <h3 className="font-semibold text-slate-800">Print / PDF</h3>
          <p className="text-slate-400 text-xs mt-1">
            Opens the browser print dialog — save as PDF
          </p>
        </button>
      </div>

      {entries.length > 0 && (
        <div className="mt-8 card p-5">
          <h2 className="section-title mb-4">Summary Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-slate-400 text-xs">Total Records</p>
              <p className="font-bold text-slate-800 text-lg">{entries.length}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Unique Weeks</p>
              <p className="font-bold text-slate-800 text-lg">
                {new Set(entries.map((e) => e.weekLabel)).size}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Departments</p>
              <p className="font-bold text-slate-800 text-lg">
                {new Set(entries.map((e) => e.department)).size}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Total Workload</p>
              <p className="font-bold text-slate-800 text-lg">
                {entries.reduce((s, e) => s + e.workloadHours, 0).toLocaleString()} hrs
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
