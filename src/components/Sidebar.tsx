import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Upload,
  BarChart3,
  Users,
  Settings,
  Activity,
  FileText,
} from 'lucide-react';
import { cn } from '../lib/utils';

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/upload', label: 'Upload Data', icon: Upload },
  { to: '/charts', label: 'Charts', icon: BarChart3 },
  { to: '/capacity', label: 'Capacity', icon: Activity },
  { to: '/workload', label: 'Workload', icon: Users },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="w-60 bg-slate-900 flex flex-col min-h-screen shrink-0">
      <div className="px-6 py-5 border-b border-slate-700/50">
        <h1 className="text-white font-bold text-base leading-tight">
          Manpower<br />
          <span className="text-blue-400 font-semibold">Tracking Dashboard</span>
        </h1>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-slate-700/50">
        <p className="text-slate-500 text-xs">v1.0.0 · Enterprise Edition</p>
      </div>
    </aside>
  );
}
