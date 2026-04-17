import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { type WeekEntry, type Department, DEPARTMENTS } from '../types';
import { generateId, parseNumber } from './utils';

function normalizeDept(raw: string): Department | null {
  const lower = raw.toLowerCase().trim();
  for (const dept of DEPARTMENTS) {
    if (dept.toLowerCase() === lower) return dept;
    if (lower.includes(dept.toLowerCase().split('/')[0].toLowerCase())) return dept;
  }
  // fuzzy
  if (lower.includes('system') && lower.includes('layout')) return 'System Layout';
  if (lower.includes('simulat')) return 'Simulation';
  if (lower.includes('process')) return 'Processing';
  if (lower.includes('gdls')) return 'GDLS Designers';
  if (lower.includes('gd&t') || lower.includes('fea')) return 'Engineering/GD&T/FEA';
  if (lower.includes('total') || lower.includes('capacity')) return 'Total Capacity Engineering';
  if (lower.includes('design')) return 'Designers';
  return null;
}

function detectWeekLabel(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number') {
    // Excel date serial
    try {
      const date = XLSX.SSF.parse_date_code(val);
      return `${date.y}-W${String(Math.ceil(date.d / 7)).padStart(2, '0')}`;
    } catch {
      return String(val);
    }
  }
  return String(val).trim();
}

export interface ParseResult {
  entries: WeekEntry[];
  errors: string[];
}

export function parseFile(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

    if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target!.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const result = parseWorkbook(workbook);
          resolve(result);
        } catch (err) {
          resolve({ entries: [], errors: [`Excel parse error: ${err}`] });
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target!.result as string;
        const delimiter = ext === 'tsv' ? '\t' : undefined; // auto-detect for csv/txt
        resolve(parseCsvText(text, delimiter));
      };
      reader.readAsText(file);
    }
  });
}

function parseWorkbook(workbook: XLSX.WorkBook): ParseResult {
  const entries: WeekEntry[] = [];
  const errors: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    if (rows.length < 2) continue;

    // Detect header row
    const headerRow = rows[0] as string[];
    const weekIdx = headerRow.findIndex((h) =>
      /week|date|period/i.test(String(h))
    );
    const deptIdx = headerRow.findIndex((h) =>
      /dept|department|group|team/i.test(String(h))
    );
    const headIdx = headerRow.findIndex((h) =>
      /head|count|people|staff|employee/i.test(String(h))
    );
    const workloadIdx = headerRow.findIndex((h) =>
      /workload|hours|hrs|load/i.test(String(h))
    );

    if (weekIdx === -1 && deptIdx === -1) {
      // Try alternate layout: rows are departments, columns are weeks
      const result = parseAlternateLayout(rows, sheetName);
      entries.push(...result.entries);
      errors.push(...result.errors);
      continue;
    }

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] as unknown[];
      if (!row.some((cell) => cell !== '')) continue;

      const weekRaw = weekIdx >= 0 ? row[weekIdx] : `Week ${i}`;
      const deptRaw = deptIdx >= 0 ? String(row[deptIdx] || '') : sheetName;
      const headcount = headIdx >= 0 ? parseNumber(row[headIdx]) : 1;
      const workloadHours = workloadIdx >= 0 ? parseNumber(row[workloadIdx]) : 0;

      const dept = normalizeDept(deptRaw);
      if (!dept) {
        errors.push(`Row ${i + 1}: Unknown department "${deptRaw}"`);
        continue;
      }

      const weekLabel = detectWeekLabel(weekRaw);
      entries.push({
        id: generateId(),
        week: weekLabel,
        weekLabel,
        department: dept,
        headcount,
        workloadHours,
      });
    }
  }

  return { entries, errors };
}

function parseAlternateLayout(rows: unknown[][], sheetName: string): ParseResult {
  const entries: WeekEntry[] = [];
  const errors: string[] = [];

  // First column = department names, first row = week labels
  const weekLabels = (rows[0] as unknown[]).slice(1).map((v) => detectWeekLabel(v)).filter(Boolean);

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r] as unknown[];
    const deptRaw = String(row[0] || '').trim();
    if (!deptRaw) continue;

    const dept = normalizeDept(deptRaw);
    if (!dept) {
      errors.push(`Row ${r + 1}: Unknown department "${deptRaw}"`);
      continue;
    }

    for (let c = 1; c < row.length; c++) {
      const weekLabel = weekLabels[c - 1];
      if (!weekLabel) continue;
      const val = parseNumber(row[c]);

      entries.push({
        id: generateId(),
        week: weekLabel,
        weekLabel,
        department: dept,
        headcount: 0,
        workloadHours: val,
      });
    }
  }

  return { entries, errors };
}

function parseCsvText(text: string, delimiter?: string): ParseResult {
  const entries: WeekEntry[] = [];
  const errors: string[] = [];

  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    delimiter: delimiter ?? '',
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  for (let i = 0; i < result.data.length; i++) {
    const row = result.data[i];
    const keys = Object.keys(row);

    const weekKey = keys.find((k) => /week|date|period/i.test(k)) ?? keys[0];
    const deptKey = keys.find((k) => /dept|department|group|team/i.test(k)) ?? keys[1];
    const headKey = keys.find((k) => /head|count|people|staff/i.test(k));
    const loadKey = keys.find((k) => /workload|hours|hrs|load/i.test(k)) ?? keys[keys.length - 1];

    const deptRaw = row[deptKey] ?? '';
    const dept = normalizeDept(deptRaw);
    if (!dept) {
      errors.push(`Row ${i + 2}: Unknown department "${deptRaw}"`);
      continue;
    }

    const weekLabel = String(row[weekKey] ?? `Row ${i + 1}`).trim();
    const headcount = headKey ? parseNumber(row[headKey]) : 1;
    const workloadHours = parseNumber(row[loadKey]);

    entries.push({
      id: generateId(),
      week: weekLabel,
      weekLabel,
      department: dept,
      headcount,
      workloadHours,
    });
  }

  return { entries, errors };
}

export function parsePastedText(text: string): ParseResult {
  return parseCsvText(text, '\t');
}
