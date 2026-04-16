import * as XLSX from 'xlsx';
import type { DepartmentDataset } from '../types';
import { fmtNum } from './utils';

// ─── Export full dashboard to Excel ──────────────────────────────────────────
export function exportToExcel(datasets: DepartmentDataset[], filename = 'manpower-report'): void {
  const wb = XLSX.utils.book_new();

  for (const ds of datasets) {
    const periods = ds.points.map((p) => p.period);
    const header = ['Metric', ...periods, 'Total'];
    const rows: (string | number)[][] = [
      header,
      ['WORKLOAD', ...ds.points.map((p) => p.workload), ds.totalWorkload],
      ['CAPACITY @ 40 HOURS', ...ds.points.map((p) => p.capacity40), ds.points.reduce((s, p) => s + p.capacity40, 0)],
      ['CAPACITY @ 50 HOURS', ...ds.points.map((p) => p.capacity50), ds.points.reduce((s, p) => s + p.capacity50, 0)],
      ['CAPACITY @ 60 HOURS', ...ds.points.map((p) => p.capacity60), ds.points.reduce((s, p) => s + p.capacity60, 0)],
      ['AVG EXCESS CAP (50 HR)', ...ds.points.map((p) => p.excessCap50), ''],
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const safeLabel = ds.label.replace(/[\\/?*[\]:]/g, '_').slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, safeLabel);
  }

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// ─── Export single sheet CSV ──────────────────────────────────────────────────
export function exportToCsv(datasets: DepartmentDataset[], filename = 'manpower-report'): void {
  const lines: string[] = [];

  for (const ds of datasets) {
    lines.push(`# ${ds.label}`);
    const periods = ds.points.map((p) => p.period);
    lines.push(['Metric', ...periods].join(','));
    lines.push(['WORKLOAD', ...ds.points.map((p) => fmtNum(p.workload))].join(','));
    lines.push(['CAPACITY @ 40 HOURS', ...ds.points.map((p) => fmtNum(p.capacity40))].join(','));
    lines.push(['CAPACITY @ 50 HOURS', ...ds.points.map((p) => fmtNum(p.capacity50))].join(','));
    lines.push(['CAPACITY @ 60 HOURS', ...ds.points.map((p) => fmtNum(p.capacity60))].join(','));
    lines.push(['AVERAGE EXCESS CAP', ...ds.points.map((p) => fmtNum(p.excessCap50))].join(','));
    lines.push('');
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Print / PDF via browser ──────────────────────────────────────────────────
export function printPage(): void {
  window.print();
}
