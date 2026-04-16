import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  Search,
  Download,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { useStore } from '../store';
import { buildDepartmentDatasets } from '../lib/selectors';
import { exportToExcel, exportToCsv } from '../lib/exporter';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';

const ROUTE_LABELS: Record<string, string> = {
  '/': 'Dashboard',
  '/upload': 'Upload Files',
  '/charts': 'Charts',
  '/capacity': 'Capacity',
  '/workload': 'Workload',
  '/entry': 'Manual Entry',
  '/settings': 'Settings',
};

interface Props {
  onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const store = useStore();
  const [showExport, setShowExport] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  const label = ROUTE_LABELS[location.pathname] ?? 'Manpower Dashboard';

  const handleExport = (format: 'xlsx' | 'csv') => {
    const datasets = buildDepartmentDatasets(store, store.settings.weeksPerMonth);
    if (!datasets.some((d) => d.points.length > 0)) {
      toast.error('No data to export — upload a file first');
      setShowExport(false);
      return;
    }
    if (format === 'xlsx') exportToExcel(datasets);
    else exportToCsv(datasets);
    toast.success(`Exported as ${format.toUpperCase()}`);
    setShowExport(false);
  };

  const routes = Object.keys(ROUTE_LABELS).filter((r) =>
    r.toLowerCase().includes(searchVal.toLowerCase()) ||
    ROUTE_LABELS[r].toLowerCase().includes(searchVal.toLowerCase()),
  );

  return (
    <header className="h-14 flex-shrink-0 bg-white border-b border-ink-200 flex items-center px-4 gap-3 z-10">
      {/* Sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        className="btn-ghost p-2 rounded-lg"
        aria-label="Toggle sidebar"
      >
        <Menu size={18} />
      </button>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm">
        <span className="text-ink-400">Engineering</span>
        <ChevronRight size={14} className="text-ink-300" />
        <span className="font-semibold text-ink-800">{label}</span>
      </div>

      <div className="flex-1" />

      {/* Search */}
      <div className="relative">
        {searchOpen ? (
          <div className="relative">
            <input
              autoFocus
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onBlur={() => { setSearchOpen(false); setSearchVal(''); }}
              placeholder="Jump to page..."
              className="input w-48 pr-8 text-sm"
            />
            <Search size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
            {searchVal && (
              <div className="absolute top-full mt-1 left-0 w-48 bg-white border border-ink-200 rounded-lg shadow-card-lg overflow-hidden z-50">
                {routes.map((r) => (
                  <button
                    key={r}
                    onMouseDown={() => { navigate(r); setSearchOpen(false); setSearchVal(''); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-ink-50 transition-colors"
                  >
                    {ROUTE_LABELS[r]}
                  </button>
                ))}
                {!routes.length && (
                  <div className="px-3 py-2 text-sm text-ink-400">No results</div>
                )}
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="btn-ghost p-2 rounded-lg"
            aria-label="Search"
          >
            <Search size={18} />
          </button>
        )}
      </div>

      {/* Refresh */}
      <button
        onClick={() => { window.location.reload(); }}
        className="btn-ghost p-2 rounded-lg"
        aria-label="Refresh"
      >
        <RefreshCw size={18} />
      </button>

      {/* Export */}
      <div className="relative">
        <button
          onClick={() => setShowExport(!showExport)}
          className="btn-secondary text-sm gap-2"
        >
          <Download size={15} />
          Export
        </button>
        {showExport && (
          <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-ink-200 rounded-xl shadow-card-lg z-50 overflow-hidden animate-fade-in">
            <button
              onClick={() => handleExport('xlsx')}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-ink-50 transition-colors"
            >
              Export as Excel (.xlsx)
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-ink-50 transition-colors"
            >
              Export as CSV
            </button>
            <button
              onClick={() => { window.print(); setShowExport(false); }}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-ink-50 transition-colors"
            >
              Print / Save PDF
            </button>
          </div>
        )}
      </div>

      {/* Notifications */}
      <button className="btn-ghost p-2 rounded-lg relative" aria-label="Notifications">
        <Bell size={18} />
        {store.files.length > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full" />
        )}
      </button>
    </header>
  );
}
