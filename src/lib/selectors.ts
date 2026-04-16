/**
 * Derives DepartmentDataset[] from raw store state.
 * This is the core calculation layer — used by Charts, Dashboard, Capacity pages.
 */
import type { AppState, DepartmentDataset, DeptKey, PeriodPoint } from '../types';
import { DEPT_LABELS, DEPT_COLOR } from '../types';
import { calcCapacity, avg, sum } from './utils';
import { periodSorter, selectPeriods } from '../store';

const CHART_DEPT_KEYS: DeptKey[] = [
  'SL',
  'SIM',
  'PROC',
  'DESIGNERS',
  'ENGINEERING',
  'GDLS_DESIGNER',
];

export function buildDepartmentDatasets(
  state: AppState,
  weeksPerMonth = 4,
): DepartmentDataset[] {
  const periods = selectPeriods(state).sort(periodSorter);
  const datasets: DepartmentDataset[] = [];

  for (const key of CHART_DEPT_KEYS) {
    const points: PeriodPoint[] = periods.map((period) => {
      // Sum headcount across all rows for this dept
      const headcount = state.capacityRows
        .filter((r) => r.deptKey === key)
        .reduce((s, r) => s + (r.periods[period] ?? 0), 0);

      // Sum workload hours for this dept
      const workload = state.workloadEntries
        .filter((e) => e.deptKey === key)
        .reduce((s, e) => s + (e.periods[period] ?? 0), 0);

      const capacity40 = calcCapacity(headcount, 40, weeksPerMonth);
      const capacity50 = calcCapacity(headcount, 50, weeksPerMonth);
      const capacity60 = calcCapacity(headcount, 60, weeksPerMonth);

      return {
        period,
        workload,
        headcount,
        capacity40,
        capacity50,
        capacity60,
        excessCap40: capacity40 - workload,
        excessCap50: capacity50 - workload,
        excessCap60: capacity60 - workload,
      };
    });

    const workloads = points.map((p) => p.workload);
    const excess50 = points.map((p) => p.excessCap50);

    datasets.push({
      key,
      label: DEPT_LABELS[key],
      color: DEPT_COLOR[key],
      points,
      totalWorkload: sum(workloads),
      avgExcessCap40: avg(points.map((p) => p.excessCap40)),
      avgExcessCap50: avg(excess50),
      avgExcessCap60: avg(points.map((p) => p.excessCap60)),
    });
  }

  // Total Engineering — aggregate all depts
  const totalPoints: PeriodPoint[] = periods.map((period) => {
    const headcount = state.capacityRows.reduce(
      (s, r) => s + (r.periods[period] ?? 0),
      0,
    );
    const workload = state.workloadEntries.reduce(
      (s, e) => s + (e.periods[period] ?? 0),
      0,
    );
    const capacity40 = calcCapacity(headcount, 40, weeksPerMonth);
    const capacity50 = calcCapacity(headcount, 50, weeksPerMonth);
    const capacity60 = calcCapacity(headcount, 60, weeksPerMonth);
    return {
      period,
      workload,
      headcount,
      capacity40,
      capacity50,
      capacity60,
      excessCap40: capacity40 - workload,
      excessCap50: capacity50 - workload,
      excessCap60: capacity60 - workload,
    };
  });

  datasets.push({
    key: 'TOTAL',
    label: DEPT_LABELS['TOTAL'],
    color: DEPT_COLOR['TOTAL'],
    points: totalPoints,
    totalWorkload: sum(totalPoints.map((p) => p.workload)),
    avgExcessCap40: avg(totalPoints.map((p) => p.excessCap40)),
    avgExcessCap50: avg(totalPoints.map((p) => p.excessCap50)),
    avgExcessCap60: avg(totalPoints.map((p) => p.excessCap60)),
  });

  return datasets;
}
