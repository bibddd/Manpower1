import { type ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  label: string;
  value: string;
  sub?: string;
  trend?: number; // positive = up, negative = down
  icon?: ReactNode;
  color?: 'blue' | 'green' | 'red' | 'amber' | 'violet';
  onClick?: () => void;
}

const COLOR_MAP = {
  blue: 'bg-blue-50 text-blue-600 border-blue-100',
  green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  red: 'bg-red-50 text-red-600 border-red-100',
  amber: 'bg-amber-50 text-amber-600 border-amber-100',
  violet: 'bg-violet-50 text-violet-600 border-violet-100',
};

export default function KPICard({ label, value, sub, trend, icon, color = 'blue', onClick }: Props) {
  const hasTrend = trend !== undefined;
  const trendUp = (trend ?? 0) > 0;
  const trendFlat = (trend ?? 0) === 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        'card p-5 flex flex-col gap-3 transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-card-lg hover:-translate-y-0.5',
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider">{label}</p>
        {icon && (
          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center border', COLOR_MAP[color])}>
            {icon}
          </div>
        )}
      </div>

      <div>
        <div className="kpi-number text-ink-900">{value}</div>
        {sub && <p className="text-xs text-ink-400 mt-0.5">{sub}</p>}
      </div>

      {hasTrend && (
        <div className={cn(
          'flex items-center gap-1 text-xs font-medium',
          trendFlat ? 'text-ink-400' : trendUp ? 'text-emerald-600' : 'text-red-500',
        )}>
          {trendFlat ? <Minus size={13} /> : trendUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          <span>
            {trendFlat ? 'No change' : `${trendUp ? '+' : ''}${trend?.toFixed(1)}% vs prev period`}
          </span>
        </div>
      )}
    </div>
  );
}
