'use client';
import { cn } from '@/lib/cn';

interface KpiCardProps {
  label: string;
  value: string;
  icon: string;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}

export function KpiCard({ label, value, icon, trend, trendUp, className }: KpiCardProps) {
  return (
    <div className={cn('neu rounded-2xl p-5 animate-fade-up transition-all duration-300', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="kpi-label">{label}</p>
          <p className="kpi-value animate-count-up">{value}</p>
          {trend && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className={cn(
                'material-symbols-outlined text-[14px]',
                trendUp ? 'text-green-500' : 'text-red-400'
              )}>
                {trendUp ? 'trending_up' : 'trending_down'}
              </span>
              <span className={cn(
                'text-[11px] font-semibold',
                trendUp ? 'text-green-500' : 'text-red-400'
              )}>
                {trend}
              </span>
            </div>
          )}
        </div>
        <div className="neu-x w-11 h-11 rounded-xl flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[22px]" style={{ color: 'var(--neu-accent)' }}>{icon}</span>
        </div>
      </div>
    </div>
  );
}
