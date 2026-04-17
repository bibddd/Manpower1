import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { type WeekEntry, type Department, DEPARTMENTS } from '../types';

function entriesToRows(entries: WeekEntry[]) {
  return entries.map((e) => ({
    Week: e.weekLabel,
    Department: e.department,
    Headcount: e.headcount,
    'Workload Hours': e.workloadHours,
    'Cap @ 40 hrs': e.headcount * 40,
    'Cap @ 50 hrs': e.headcount * 50,
    'Cap @ 60 hrs': e.headcount * 60,
    'Excess Cap (50 hrs)': e.headcount * 50 - e.workloadHours,
  }));
}

export function exportToExcel(entries: WeekEntry[], filename = 'manpower-data.xlsx') {
  const rows = entriesToRows(entries);
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Manpower Data');

  // Per-department sheets
  for (const dept of DEPARTMENTS) {
    const deptEntries = entries.filter((e) => e.department === dept);
    if (deptEntries.length === 0) continue;
    const deptRows = entriesToRows(deptEntries);
    const deptWs = XLSX.utils.json_to_sheet(deptRows);
    XLSX.utils.book_append_sheet(wb, deptWs, dept.slice(0, 31));
  }

  XLSX.writeFile(wb, filename);
}

export function exportToCsv(entries: WeekEntry[], filename = 'manpower-data.csv') {
  const rows = entriesToRows(entries);
  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function printDashboard() {
  window.print();
}
