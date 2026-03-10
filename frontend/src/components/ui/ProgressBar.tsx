import { cn } from '@/lib/cn';

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple';
  label?: string;
  showValue?: boolean;
  className?: string;
}

const colors = {
  blue: 'bg-[var(--neu-accent)]',
  green: 'bg-green-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
};

export function ProgressBar({ value, max = 100, color = 'blue', label, showValue, className }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn('space-y-1.5', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-[11px] font-semibold" style={{ color: 'var(--neu-text-muted)' }}>{label}</span>}
          {showValue && <span className="text-[11px] font-bold" style={{ color: 'var(--neu-text)' }}>{Math.round(pct)}%</span>}
        </div>
      )}
      <div className="progress-bar neu-ins">
        <div
          className={cn('progress-bar-fill', colors[color])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
