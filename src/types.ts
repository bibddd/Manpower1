// ─── Period / time helpers ────────────────────────────────────────────────────
export type Period = string; // e.g. "Oct-20", "Jan-21", "Week 1"

// ─── Dept keys that map to the spreadsheet rows ───────────────────────────────
export type DeptKey =
  | 'SL'
  | 'SIM'
  | 'PROC'
  | 'OFFSITE'
  | 'TECH_WRITERS'
  | 'ENGINEERING'
  | 'GDLS_DESIGNER'
  | 'DESIGNERS'
  | 'TOTAL';

export const DEPT_LABELS: Record<DeptKey, string> = {
  SL: 'System Layout',
  SIM: 'Simulation',
  PROC: 'Processing',
  OFFSITE: 'Offsite',
  TECH_WRITERS: 'Tech Writers',
  ENGINEERING: 'Engineering / GD&T / FEA',
  GDLS_DESIGNER: 'GDLS Designers',
  DESIGNERS: 'Designers',
  TOTAL: 'Total Capacity Engineering',
};

export const DEPT_COLOR: Record<DeptKey, string> = {
  SL: '#3b82f6',
  SIM: '#8b5cf6',
  PROC: '#f59e0b',
  OFFSITE: '#06b6d4',
  TECH_WRITERS: '#ec4899',
  ENGINEERING: '#10b981',
  GDLS_DESIGNER: '#f97316',
  DESIGNERS: '#6366f1',
  TOTAL: '#1e3a8a',
};

// ─── One data-point for a dept in a period ────────────────────────────────────
export interface PeriodPoint {
  period: Period;
  workload: number;       // hours from workload sheet
  headcount: number;      // people on roster
  capacity40: number;     // headcount × 40 × 4
  capacity50: number;     // headcount × 50 × 4
  capacity60: number;     // headcount × 60 × 4
  excessCap40: number;    // capacity40 - workload
  excessCap50: number;
  excessCap60: number;
}

// ─── Full dataset per department ──────────────────────────────────────────────
export interface DepartmentDataset {
  key: DeptKey;
  label: string;
  color: string;
  points: PeriodPoint[];
  totalWorkload: number;
  avgExcessCap40: number;
  avgExcessCap50: number;
  avgExcessCap60: number;
}

// ─── Capacity worksheet row ───────────────────────────────────────────────────
export interface CapacityRow {
  role: string;
  deptKey: DeptKey;
  periods: Record<Period, number>; // period -> headcount
}

// ─── Workload worksheet row ───────────────────────────────────────────────────
export interface WorkloadEntry {
  id: string;
  customer: string;
  project: string;
  deptKey: DeptKey;
  periods: Record<Period, number>; // period -> hours
  totalHours: number;
}

// ─── Uploaded file record ─────────────────────────────────────────────────────
export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  periods: Period[];
  status: 'processing' | 'ready' | 'error';
  errorMsg?: string;
  rowCount: number;
}

// ─── Manual entry form ────────────────────────────────────────────────────────
export interface ManualWorkloadEntry {
  customer: string;
  project: string;
  deptKey: DeptKey;
  period: Period;
  hours: number;
}

export interface ManualCapacityEntry {
  deptKey: DeptKey;
  period: Period;
  headcount: number;
}

// ─── App-wide settings ────────────────────────────────────────────────────────
export interface AppSettings {
  companyName: string;
  defaultHoursPerWeek: 40 | 50 | 60;
  weeksPerMonth: number;
  fiscalYearStart: number; // 0 = Jan
  theme: 'light' | 'dark';
  currency: string;
  showOffsite: boolean;
}

// ─── Store shape ──────────────────────────────────────────────────────────────
export interface AppState {
  files: UploadedFile[];
  capacityRows: CapacityRow[];
  workloadEntries: WorkloadEntry[];
  periods: Period[];
  settings: AppSettings;

  // actions
  addFile: (file: UploadedFile) => void;
  removeFile: (id: string) => void;
  setCapacityRows: (rows: CapacityRow[]) => void;
  addCapacityRows: (rows: CapacityRow[]) => void;
  setWorkloadEntries: (entries: WorkloadEntry[]) => void;
  addWorkloadEntries: (entries: WorkloadEntry[]) => void;
  addManualWorkload: (entry: ManualWorkloadEntry) => void;
  addManualCapacity: (entry: ManualCapacityEntry) => void;
  setPeriods: (periods: Period[]) => void;
  updateSettings: (s: Partial<AppSettings>) => void;
  clearAll: () => void;
}
