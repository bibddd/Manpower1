export const DEPARTMENTS = [
  'System Layout',
  'Simulation',
  'Processing',
  'Designers',
  'Engineering/GD&T/FEA',
  'GDLS Designers',
  'Total Capacity Engineering',
] as const;

export type Department = typeof DEPARTMENTS[number];

export interface WeekEntry {
  id: string;
  week: string;       // e.g. "2024-W01" or "Jan 6"
  weekLabel: string;  // display label
  department: Department;
  headcount: number;
  workloadHours: number;
}

export interface DepartmentSummary {
  department: Department;
  entries: WeekEntry[];
  avgWorkload: number;
  avgCap40: number;
  avgCap50: number;
  avgCap60: number;
  avgExcessCap: number;
}

export interface ChartDataPoint {
  weekLabel: string;
  workload: number;
  cap40: number;
  cap50: number;
  cap60: number;
}

export type ViewMode = 'weekly' | 'monthly';
