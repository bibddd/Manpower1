/**
 * Parses uploaded files (xlsx, xls, csv, tsv, txt) into CapacityRow[]
 * and WorkloadEntry[] matching the reference spreadsheet format.
 *
 * CAPACITY sheet layout:
 *   Row 0: header row with month periods (Oct-20, Nov-20, ...)
 *   Subsequent rows: role name in col 0, headcount per period
 *   Role aliases map to DeptKey values
 *
 * WORKLOAD sheet layout:
 *   Col 0: Customer, Col 1: Project, Col 2: Dept (sub-rows)
 *   Col 3+: hours per period matching capacity header
 *   Sub-rows: Sim, GDLS Designer, Engineers/GD&T/FEA, Outsourced, Processing, Design
 *   Yellow "Sub-Total" rows are aggregated automatically
 */

import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import type { CapacityRow, WorkloadEntry, DeptKey } from '../types';
import { nanoid, toPeriodLabel } from './utils';

// ─── Role → DeptKey mapping ───────────────────────────────────────────────────
const ROLE_MAP: Record<string, DeptKey> = {
  sl: 'SL',
  'system layout': 'SL',
  'sys layout': 'SL',
  sim: 'SIM',
  simulation: 'SIM',
  proc: 'PROC',
  processing: 'PROC',
  offsite: 'OFFSITE',
  'tech writers': 'TECH_WRITERS',
  'tech writer': 'TECH_WRITERS',
  techwriters: 'TECH_WRITERS',
  'engineers/gd&t/fea': 'ENGINEERING',
  'engineers/gdt/fea': 'ENGINEERING',
  'engineering/gd&t/fea': 'ENGINEERING',
  'engineers/gd&t /fea': 'ENGINEERING',
  'engineers/gdt': 'ENGINEERING',
  engineering: 'ENGINEERING',
  'gdls designer': 'GDLS_DESIGNER',
  'gdls designers': 'GDLS_DESIGNER',
  gdls: 'GDLS_DESIGNER',
  designers: 'DESIGNERS',
  designer: 'DESIGNERS',
  design: 'DESIGNERS',
};

const WORKLOAD_DEPT_MAP: Record<string, DeptKey> = {
  sim: 'SIM',
  simulation: 'SIM',
  'gdls designer': 'GDLS_DESIGNER',
  'gdls designers': 'GDLS_DESIGNER',
  gdls: 'GDLS_DESIGNER',
  'engineers/gd&t/fea': 'ENGINEERING',
  'engineers/gdt/fea': 'ENGINEERING',
  'engineering/gd&t /fea': 'ENGINEERING',
  engineering: 'ENGINEERING',
  outsourced: 'OFFSITE',
  processing: 'PROC',
  proc: 'PROC',
  design: 'DESIGNERS',
  designers: 'DESIGNERS',
  sl: 'SL',
  'system layout': 'SL',
  'tech writers': 'TECH_WRITERS',
};

function normKey(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function toNum(v: unknown): number {
  if (v === null || v === undefined || v === '') return 0;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/,/g, ''));
  return isNaN(n) ? 0 : n;
}

// Detect if a string looks like a period header (e.g. "Oct-20", "Jan-21", "2021-01")
function isPeriodHeader(s: string): boolean {
  return /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{2}$/i.test(s.trim()) ||
    /^\d{4}-\d{2}$/.test(s.trim()) ||
    /^(Q[1-4])-?\d{2,4}$/i.test(s.trim()) ||
    /^Week\s*\d+/i.test(s.trim());
}

// Normalize a period string from the spreadsheet
function normPeriod(s: string): string {
  const t = s.trim();
  // Convert "2020-10" → "Oct-20"
  const iso = t.match(/^(\d{4})-(\d{2})$/);
  if (iso) {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const m = parseInt(iso[2], 10) - 1;
    return `${months[m]}-${iso[1].slice(2)}`;
  }
  // Already "Oct-20" style
  return t;
}

// ─── Main entry: parse a File object ─────────────────────────────────────────
export async function parseFile(file: File): Promise<{
  capacityRows: CapacityRow[];
  workloadEntries: WorkloadEntry[];
  periods: string[];
}> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

  if (ext === 'xlsx' || ext === 'xls') {
    return parseExcel(file);
  }
  if (ext === 'csv') {
    return parseCsv(file);
  }
  if (ext === 'tsv' || ext === 'txt') {
    return parseTsv(file);
  }
  // Try as CSV by default
  return parseCsv(file);
}

// ─── Excel parser ─────────────────────────────────────────────────────────────
async function parseExcel(file: File): Promise<{
  capacityRows: CapacityRow[];
  workloadEntries: WorkloadEntry[];
  periods: string[];
}> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellNF: true, cellText: false });

  let capacityRows: CapacityRow[] = [];
  let workloadEntries: WorkloadEntry[] = [];
  let periods: string[] = [];

  // Find sheets by name
  const sheetNames = wb.SheetNames.map((n) => n.toLowerCase());
  const capIdx = sheetNames.findIndex((n) => n.includes('cap'));
  const wlIdx = sheetNames.findIndex((n) => n.includes('work') || n.includes('load'));

  if (capIdx >= 0) {
    const sheet = wb.Sheets[wb.SheetNames[capIdx]];
    const result = parseCapacitySheet(XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false }));
    capacityRows = result.rows;
    periods = result.periods;
  }

  if (wlIdx >= 0 && wlIdx !== capIdx) {
    const sheet = wb.Sheets[wb.SheetNames[wlIdx]];
    const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false });
    workloadEntries = parseWorkloadSheet(raw, periods);
  }

  // If only one sheet, try to detect type
  if (capIdx < 0 && wlIdx < 0 && wb.SheetNames.length > 0) {
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false });
    const result = parseCapacitySheet(raw);
    capacityRows = result.rows;
    periods = result.periods;
    if (!capacityRows.length) {
      workloadEntries = parseWorkloadSheet(raw, periods);
    }
  }

  // Multi-sheet: parse all sheets and merge
  if (wb.SheetNames.length > 2) {
    wb.SheetNames.forEach((name, i) => {
      if (i === capIdx || i === wlIdx) return;
      const lname = name.toLowerCase();
      const sheet = wb.Sheets[name];
      const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false });
      if (lname.includes('cap')) {
        const result = parseCapacitySheet(raw);
        capacityRows.push(...result.rows);
        if (!periods.length) periods = result.periods;
      } else {
        workloadEntries.push(...parseWorkloadSheet(raw, periods));
      }
    });
  }

  return { capacityRows, workloadEntries, periods };
}

// ─── Capacity sheet parser ────────────────────────────────────────────────────
function parseCapacitySheet(rows: unknown[][]): { rows: CapacityRow[]; periods: string[] } {
  const result: CapacityRow[] = [];
  let periods: string[] = [];
  let periodStartCol = -1;

  // Find header row with period labels
  let headerRowIdx = -1;
  for (let r = 0; r < Math.min(10, rows.length); r++) {
    const row = rows[r] as string[];
    const periodCols = row.filter((c) => isPeriodHeader(String(c ?? '')));
    if (periodCols.length >= 3) {
      headerRowIdx = r;
      periods = [];
      periodStartCol = -1;
      row.forEach((cell, ci) => {
        if (isPeriodHeader(String(cell ?? ''))) {
          if (periodStartCol < 0) periodStartCol = ci;
          periods.push(normPeriod(String(cell)));
        }
      });
      break;
    }
  }

  if (!periods.length || headerRowIdx < 0) return { rows: [], periods: [] };

  // Parse data rows after header
  for (let r = headerRowIdx + 1; r < rows.length; r++) {
    const row = rows[r] as (string | number)[];
    if (!row || !row[0]) continue;
    const roleRaw = String(row[0] ?? '').trim();
    if (!roleRaw) continue;

    const norm = normKey(roleRaw);

    // Skip total/header/sub-total rows
    if (
      norm.includes('total added') ||
      norm.includes('sub-total') ||
      norm === 'total' ||
      norm.includes('hours') ||
      norm.startsWith('+/-')
    ) continue;

    const deptKey = ROLE_MAP[norm];
    if (!deptKey) continue; // skip unrecognised rows

    const periodMap: Record<string, number> = {};
    periods.forEach((period, i) => {
      const col = periodStartCol + i;
      const val = toNum(row[col]);
      periodMap[period] = val;
    });

    // Only add if there's actual headcount data
    const hasData = Object.values(periodMap).some((v) => v > 0);
    if (!hasData) continue;

    result.push({ role: roleRaw, deptKey, periods: periodMap });
  }

  return { rows: result, periods };
}

// ─── Workload sheet parser ────────────────────────────────────────────────────
function parseWorkloadSheet(rows: unknown[][], periods: string[]): WorkloadEntry[] {
  const result: WorkloadEntry[] = [];
  if (!rows.length) return result;

  // Find header row
  let headerRowIdx = -1;
  let periodStartCol = -1;
  let localPeriods: string[] = periods;

  for (let r = 0; r < Math.min(5, rows.length); r++) {
    const row = rows[r] as string[];
    const pCols = row.filter((c) => isPeriodHeader(String(c ?? '')));
    if (pCols.length >= 2) {
      headerRowIdx = r;
      localPeriods = [];
      periodStartCol = -1;
      row.forEach((cell, ci) => {
        if (isPeriodHeader(String(cell ?? ''))) {
          if (periodStartCol < 0) periodStartCol = ci;
          localPeriods.push(normPeriod(String(cell)));
        }
      });
      break;
    }
  }

  if (headerRowIdx < 0) return result;

  let currentCustomer = '';
  let currentProject = '';

  for (let r = headerRowIdx + 1; r < rows.length; r++) {
    const row = rows[r] as (string | number)[];
    if (!row) continue;

    const col0 = String(row[0] ?? '').trim();
    const col1 = String(row[1] ?? '').trim();
    const col2 = String(row[2] ?? '').trim();

    if (col0 && !col0.toLowerCase().includes('total')) currentCustomer = col0;
    if (col1) currentProject = col1;

    const deptRaw = col2 || col1 || col0;
    const deptNorm = normKey(deptRaw);

    // Skip sub-total / total rows
    if (
      deptNorm.includes('sub-total') ||
      deptNorm === 'total' ||
      deptNorm.includes('totals') ||
      !deptNorm
    ) continue;

    const deptKey = WORKLOAD_DEPT_MAP[deptNorm];
    if (!deptKey) continue;

    const periodMap: Record<string, number> = {};
    let total = 0;
    localPeriods.forEach((period, i) => {
      const col = periodStartCol + i;
      const val = toNum(row[col]);
      periodMap[period] = val;
      total += val;
    });

    if (total === 0) continue;

    result.push({
      id: nanoid(),
      customer: currentCustomer || 'Unknown',
      project: currentProject || 'Unknown',
      deptKey,
      periods: periodMap,
      totalHours: total,
    });
  }

  return result;
}

// ─── CSV parser ───────────────────────────────────────────────────────────────
async function parseCsv(file: File): Promise<{
  capacityRows: CapacityRow[];
  workloadEntries: WorkloadEntry[];
  periods: string[];
}> {
  const text = await file.text();
  const { data } = Papa.parse<string[]>(text, { skipEmptyLines: true });
  const capResult = parseCapacitySheet(data as unknown[][]);
  const workload = parseWorkloadSheet(data as unknown[][], capResult.periods);
  return { capacityRows: capResult.rows, workloadEntries: workload, periods: capResult.periods };
}

// ─── TSV / TXT parser ─────────────────────────────────────────────────────────
async function parseTsv(file: File): Promise<{
  capacityRows: CapacityRow[];
  workloadEntries: WorkloadEntry[];
  periods: string[];
}> {
  const text = await file.text();
  const rows = text.split('\n').map((line) => line.split('\t'));
  const capResult = parseCapacitySheet(rows as unknown[][]);
  const workload = parseWorkloadSheet(rows as unknown[][], capResult.periods);
  return { capacityRows: capResult.rows, workloadEntries: workload, periods: capResult.periods };
}

// ─── Parse pasted tab-separated text ─────────────────────────────────────────
export function parsePastedText(text: string): {
  capacityRows: CapacityRow[];
  workloadEntries: WorkloadEntry[];
  periods: string[];
} {
  const rows = text.trim().split('\n').map((line) => line.split('\t'));
  const capResult = parseCapacitySheet(rows as unknown[][]);
  const workload = parseWorkloadSheet(rows as unknown[][], capResult.periods);
  return { capacityRows: capResult.rows, workloadEntries: workload, periods: capResult.periods };
}

// ─── Generate sample data for demo purposes ───────────────────────────────────
export function generateSampleData(): {
  capacityRows: CapacityRow[];
  workloadEntries: WorkloadEntry[];
  periods: string[];
} {
  const periods = [
    'Oct-20','Nov-20','Dec-20','Jan-21','Feb-21','Mar-21',
    'Apr-21','May-21','Jun-21','Jul-21','Aug-21','Sep-21',
    'Oct-21','Nov-21','Dec-21',
  ];

  const headcounts: Record<DeptKey, number[]> = {
    SL: [6,6,6,6,6,6,6,6,6,6,6,6,6,6,6],
    SIM: [7,7,8,8,8,8,8,8,8,8,8,8,8,8,8],
    PROC: [7,7,8,8,7,7,7,7,7,7,7,7,7,7,7],
    OFFSITE: [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
    TECH_WRITERS: [6,6,6,6,6,6,6,6,6,6,6,6,6,6,6],
    ENGINEERING: [3,3,3,5,5,5,5,5,5,5,5,5,5,5,5],
    GDLS_DESIGNER: [8,8,8,11,11,11,11,11,11,11,11,11,11,11,11],
    DESIGNERS: [29,29,30,31,31,31,31,31,31,31,31,31,31,31,31],
    TOTAL: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  };

  // Workload curves: low → peak → valley → rising again (matches screenshots)
  const workloadCurves: Partial<Record<DeptKey, number[]>> = {
    SL: [300,300,300,447,1790,967,967,967,300,967,967,967,300,460,738],
    SIM: [0,0,0,0,330,882,1382,1158,0,0,2040,1852,1295,392,0],
    PROC: [0,0,500,985,332,332,960,332,0,0,1212,963,485,100,0],
    ENGINEERING: [480,480,320,640,800,800,800,800,0,800,800,800,800,800,800],
    GDLS_DESIGNER: [0,0,0,0,0,0,0,0,0,0,0,0,1120,1120,2720],
    DESIGNERS: [300,300,2365,3360,2365,1780,3685,3685,2365,3685,5250,3582,3060,1040,5100],
  };

  const capacityRows: CapacityRow[] = [];
  const keys: DeptKey[] = ['SL','SIM','PROC','OFFSITE','TECH_WRITERS','ENGINEERING','GDLS_DESIGNER','DESIGNERS'];
  for (const key of keys) {
    const hc = headcounts[key];
    const pm: Record<string,number> = {};
    periods.forEach((p, i) => { pm[p] = hc[i] ?? 0; });
    capacityRows.push({ role: key, deptKey: key, periods: pm });
  }

  const customers = ['KUKA', 'GM', 'GM/KUKA', 'GDLS', 'CUPERTINO', 'UAB'];
  const projects = ['GM BTTXX SUV', 'GM PARMA T1XX', 'SIMULATOR AUTONOMOUS', 'HYDRAULIC', 'OMFV', 'DESIGN VERIFICATION'];
  const workloadEntries: WorkloadEntry[] = [];

  let eIdx = 0;
  for (const deptKey of ['SL','SIM','PROC','ENGINEERING','GDLS_DESIGNER','DESIGNERS'] as DeptKey[]) {
    const curve = workloadCurves[deptKey] ?? new Array(periods.length).fill(0);
    const pm: Record<string,number> = {};
    periods.forEach((p, i) => { pm[p] = curve[i] ?? 0; });
    workloadEntries.push({
      id: nanoid(),
      customer: customers[eIdx % customers.length],
      project: projects[eIdx % projects.length],
      deptKey,
      periods: pm,
      totalHours: curve.reduce((a, b) => a + b, 0),
    });
    eIdx++;
  }

  return { capacityRows, workloadEntries, periods };
}
