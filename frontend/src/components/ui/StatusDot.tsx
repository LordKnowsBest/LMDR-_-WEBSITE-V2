import { cn } from '@/lib/cn';

type StatusDotVariant = 'active' | 'warning' | 'error' | 'idle';

export function StatusDot({ status, label }: { status: StatusDotVariant; label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('status-dot', `status-dot-${status}`)} />
      {label && <span className="text-xs font-medium" style={{ color: 'var(--neu-text-muted)' }}>{label}</span>}
    </span>
  );
}
