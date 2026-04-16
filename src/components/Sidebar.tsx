import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Upload,
  BarChart3,
  Users,
  ClipboardList,
  PenLine,
  Settings,
  ChevronRight,
  Activity,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

export default function Sidebar({ collapsed }: { collapsed: boolean }) {
  const { files, workloadEntries } = useStore();

  const nav: NavItem[] = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/upload', label: 'Upload Files', icon: Upload, badge: files.length },
    { to: '/charts', label: 'Charts', icon: BarChart3 },
    { to: '/capacity', label: 'Capacity', icon: Users },
    { to: '/workload', label: 'Workload', icon: ClipboardList, badge: workloadEntries.length || undefined },
    { to: '/entry', label: 'Manual Entry', icon: PenLine },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={cn(
        'flex flex-col bg-ink-900 text-white transition-all duration-300 select-none',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-ink-700">
        <div className="flex-shrink-0 w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
          <Activity size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-sm font-bold leading-tight truncate">Manpower</div>
            <div className="text-[10px] text-ink-400 uppercase tracking-widest">Dashboard</div>
          </div>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ to, label, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                isActive
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-ink-300 hover:bg-ink-800 hover:text-white',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={cn('flex-shrink-0', isActive ? 'text-white' : 'text-ink-400 group-hover:text-white')} />
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate">{label}</span>
                    {badge !== undefined && badge > 0 && (
                      <span className="bg-brand-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {badge}
                      </span>
                    )}
                    {isActive && (
                      <ChevronRight size={14} className="text-white/60" />
                    )}
                  </>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-4 border-t border-ink-700">
          <div className="text-[10px] text-ink-500 uppercase tracking-widest">
            Engineering Dept.
          </div>
          <div className="text-xs text-ink-400 mt-0.5">
            {new Date().getFullYear()} · All Rights Reserved
          </div>
        </div>
      )}
    </aside>
  );
}
