import { cn } from '@/lib/cn';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

const variants: Record<BadgeVariant, string> = {
  default: 'bg-neutral-light text-neutral-mid',
  success: 'bg-green-50 text-sg',
  warning: 'bg-amber-50 text-status-pending',
  error: 'bg-red-50 text-status-suspended',
  info: 'bg-blue-50 text-lmdr-blue',
};

export function Badge({ variant = 'default', children, className }: { variant?: BadgeVariant; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  );
}
