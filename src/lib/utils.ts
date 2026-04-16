// ─── Nano ID ──────────────────────────────────────────────────────────────────
export function nanoid(len = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < len; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

// ─── Number formatting ────────────────────────────────────────────────────────
export function fmtNum(n: number, decimals = 0): string {
  if (!isFinite(n)) return '—';
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function fmtHours(n: number): string {
  return fmtNum(n) + ' hrs';
}

export function fmtPct(n: number): string {
  return n.toFixed(1) + '%';
}

// ─── Class names ──────────────────────────────────────────────────────────────
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ─── File size ────────────────────────────────────────────────────────────────
export function fmtBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function toPeriodLabel(date: Date): string {
  return `${SHORT_MONTHS[date.getMonth()]}-${String(date.getFullYear()).slice(2)}`;
}

export function generatePeriodRange(startPeriod: string, count: number): string[] {
  const parts = startPeriod.split('-');
  if (parts.length !== 2) return [];
  const monthIdx = SHORT_MONTHS.indexOf(parts[0]);
  if (monthIdx < 0) return [];
  let year = parseInt('20' + parts[1], 10);
  let month = monthIdx;
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(`${SHORT_MONTHS[month]}-${String(year).slice(2)}`);
    month++;
    if (month > 11) { month = 0; year++; }
  }
  return result;
}

// ─── Capacity math ────────────────────────────────────────────────────────────
export function calcCapacity(headcount: number, hoursPerWeek: number, weeksPerMonth = 4): number {
  return headcount * hoursPerWeek * weeksPerMonth;
}

// ─── Color utilities ──────────────────────────────────────────────────────────
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─── Misc ─────────────────────────────────────────────────────────────────────
export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

export function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

export function avg(arr: number[]): number {
  if (!arr.length) return 0;
  return sum(arr) / arr.length;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
