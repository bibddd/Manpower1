import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AppState,
  AppSettings,
  CapacityRow,
  WorkloadEntry,
  UploadedFile,
  Period,
  ManualWorkloadEntry,
  ManualCapacityEntry,
  DeptKey,
} from './types';
import { nanoid } from './lib/utils';

const DEFAULT_SETTINGS: AppSettings = {
  companyName: 'Engineering Department',
  defaultHoursPerWeek: 50,
  weeksPerMonth: 4,
  fiscalYearStart: 0,
  theme: 'light',
  currency: 'USD',
  showOffsite: true,
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      files: [],
      capacityRows: [],
      workloadEntries: [],
      periods: [],
      settings: DEFAULT_SETTINGS,

      addFile: (file) =>
        set((s) => ({ files: [file, ...s.files] })),

      removeFile: (id) =>
        set((s) => ({ files: s.files.filter((f) => f.id !== id) })),

      setCapacityRows: (rows) => set({ capacityRows: rows }),

      addCapacityRows: (rows) =>
        set((s) => {
          const existing = s.capacityRows;
          // Merge by role key — replace if same role+dept exists
          const merged = [...existing];
          for (const row of rows) {
            const idx = merged.findIndex(
              (r) => r.role === row.role && r.deptKey === row.deptKey,
            );
            if (idx >= 0) {
              merged[idx] = {
                ...merged[idx],
                periods: { ...merged[idx].periods, ...row.periods },
              };
            } else {
              merged.push(row);
            }
          }
          return { capacityRows: merged };
        }),

      setWorkloadEntries: (entries) => set({ workloadEntries: entries }),

      addWorkloadEntries: (entries) =>
        set((s) => ({
          workloadEntries: [
            ...s.workloadEntries.filter(
              (e) => !entries.find((n) => n.id === e.id),
            ),
            ...entries,
          ],
        })),

      addManualWorkload: (entry: ManualWorkloadEntry) => {
        const { workloadEntries } = get();
        const existing = workloadEntries.find(
          (e) =>
            e.customer === entry.customer &&
            e.project === entry.project &&
            e.deptKey === entry.deptKey,
        );
        if (existing) {
          set((s) => ({
            workloadEntries: s.workloadEntries.map((e) =>
              e.id === existing.id
                ? {
                    ...e,
                    periods: {
                      ...e.periods,
                      [entry.period]: (e.periods[entry.period] ?? 0) + entry.hours,
                    },
                    totalHours: Object.values({
                      ...e.periods,
                      [entry.period]: (e.periods[entry.period] ?? 0) + entry.hours,
                    }).reduce((a, b) => a + b, 0),
                  }
                : e,
            ),
          }));
        } else {
          const newEntry: WorkloadEntry = {
            id: nanoid(),
            customer: entry.customer,
            project: entry.project,
            deptKey: entry.deptKey,
            periods: { [entry.period]: entry.hours },
            totalHours: entry.hours,
          };
          set((s) => ({ workloadEntries: [...s.workloadEntries, newEntry] }));
        }
      },

      addManualCapacity: (entry: ManualCapacityEntry) => {
        const { capacityRows } = get();
        const existing = capacityRows.find(
          (r) => r.deptKey === entry.deptKey,
        );
        if (existing) {
          set((s) => ({
            capacityRows: s.capacityRows.map((r) =>
              r.deptKey === entry.deptKey
                ? {
                    ...r,
                    periods: {
                      ...r.periods,
                      [entry.period]: entry.headcount,
                    },
                  }
                : r,
            ),
          }));
        } else {
          const newRow: CapacityRow = {
            role: entry.deptKey as string,
            deptKey: entry.deptKey,
            periods: { [entry.period]: entry.headcount },
          };
          set((s) => ({ capacityRows: [...s.capacityRows, newRow] }));
        }
      },

      setPeriods: (periods) => set({ periods }),

      updateSettings: (s) =>
        set((state) => ({ settings: { ...state.settings, ...s } })),

      clearAll: () =>
        set({
          files: [],
          capacityRows: [],
          workloadEntries: [],
          periods: [],
        }),
    }),
    {
      name: 'manpower-store-v1',
      partialize: (state) => ({
        files: state.files,
        capacityRows: state.capacityRows,
        workloadEntries: state.workloadEntries,
        periods: state.periods,
        settings: state.settings,
      }),
    },
  ),
);

// ─── Derived selectors ────────────────────────────────────────────────────────
export function selectPeriods(state: AppState): Period[] {
  if (state.periods.length) return state.periods;
  const all = new Set<string>();
  state.capacityRows.forEach((r) => Object.keys(r.periods).forEach((p) => all.add(p)));
  state.workloadEntries.forEach((e) => Object.keys(e.periods).forEach((p) => all.add(p)));
  return Array.from(all).sort(periodSorter);
}

export function selectWorkloadByDept(
  state: AppState,
  deptKey: DeptKey,
  period: Period,
): number {
  return state.workloadEntries
    .filter((e) => e.deptKey === deptKey)
    .reduce((sum, e) => sum + (e.periods[period] ?? 0), 0);
}

export function selectHeadcountByDept(
  state: AppState,
  deptKey: DeptKey,
  period: Period,
): number {
  return state.capacityRows
    .filter((r) => r.deptKey === deptKey)
    .reduce((sum, r) => sum + (r.periods[period] ?? 0), 0);
}

// Sort period strings chronologically
const MONTH_ORDER: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

export function periodSorter(a: string, b: string): number {
  const parseP = (p: string): number => {
    const parts = p.split('-');
    if (parts.length === 2) {
      const month = MONTH_ORDER[parts[0]] ?? 0;
      const year = parseInt(parts[1], 10);
      return year * 100 + month;
    }
    return 0;
  };
  const diff = parseP(a) - parseP(b);
  return diff !== 0 ? diff : a.localeCompare(b);
}
