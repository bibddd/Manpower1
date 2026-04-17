import React, { useMemo, useState } from 'react';
import { useApp } from '../context';
import { DEPARTMENTS, type Department } from '../types';
import DepartmentChart from '../components/DepartmentChart';
import { Link } from 'react-router-dom';
import { Upload } from 'lucide-react';

export default function Charts() {
  const { state } = useApp();
  const { entries } = state;

  const [selectedDepts, setSelectedDepts] = useState<Set<Department>>(new Set(DEPARTMENTS));

  const toggleDept = (dept: Department) => {
    setSelectedDepts((prev) => {
      const next = new Set(prev);
      if (next.has(dept)) {
        if (next.size === 1) return prev;
        next.delete(dept);
      } else {
        next.add(dept);
      }
      return next;
    });
  };

  const activeDepts = DEPARTMENTS.filter((d) => selectedDepts.has(d));

  if (entries.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Department Charts</h1>
        <div className="card p-10 text-center max-w-sm mx-auto">
          <p className="text-slate-500 mb-4">No data to chart yet.</p>
          <Link to="/upload" className="btn-primary text-sm">
            <Upload size={14} /> Upload Data
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Department Charts</h1>
        <p className="text-slate-500 text-sm mt-1">
          Workload vs. Capacity — red area = workload, lines = capacity thresholds
        </p>
      </div>

      <div className="mb-6 card p-4">
        <p className="text-xs font-medium text-slate-600 mb-2">Filter Departments</p>
        <div className="flex flex-wrap gap-2">
          {DEPARTMENTS.map((dept) => (
            <button
              key={dept}
              onClick={() => toggleDept(dept)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                selectedDepts.has(dept)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {activeDepts.map((dept) => (
          <DepartmentChart
            key={dept}
            department={dept}
            entries={entries.filter((e) => e.department === dept)}
          />
        ))}
      </div>
    </div>
  );
}
