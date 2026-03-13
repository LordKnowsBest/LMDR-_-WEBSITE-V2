'use client';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

type AdminAlertTone = 'error' | 'warning' | 'info' | 'success';

const toneMap: Record<AdminAlertTone, { icon: string; color: string; label: string }> = {
  error: { icon: 'error', color: '#ef4444', label: 'Issue' },
  warning: { icon: 'warning', color: '#f59e0b', label: 'Attention' },
  info: { icon: 'info', color: '#2563eb', label: 'Info' },
  success: { icon: 'check_circle', color: '#10b981', label: 'Resolved' },
};

interface AdminAlertProps {
  message: string;
  tone?: AdminAlertTone;
  title?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function AdminAlert({
  message,
  tone = 'error',
  title,
  actionLabel,
  onAction,
  className,
}: AdminAlertProps) {
  const config = toneMap[tone];

  return (
    <div
      className={cn('neu-s rounded-2xl px-4 py-3.5 flex items-start gap-3 animate-fade-up', className)}
      style={{ borderLeft: `3px solid ${config.color}` }}
    >
      <div
        className="neu-x w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ color: config.color }}
      >
        <span className="material-symbols-outlined text-[18px]">{config.icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <span
          className="text-[10px] font-bold uppercase tracking-[0.18em]"
          style={{ color: config.color }}
        >
          {title || config.label}
        </span>
        <p className="text-[12px] leading-5 mt-1" style={{ color: 'var(--neu-text)' }}>
          {message}
        </p>
      </div>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" icon="refresh" onClick={onAction} className="shrink-0">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
