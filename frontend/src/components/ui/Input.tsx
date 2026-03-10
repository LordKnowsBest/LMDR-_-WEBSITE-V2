import { cn } from '@/lib/cn';
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, id, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="kpi-label">{label}</label>
      )}
      <div className="relative">
        {icon && (
          <span
            className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px]"
            style={{ color: 'var(--neu-text-muted)' }}
          >
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full rounded-xl px-4 py-2.5 text-sm neu-in',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neu-accent)]/30',
            'transition-shadow duration-200',
            icon && 'pl-10',
            error && 'ring-2 ring-red-400/40',
            className
          )}
          style={{
            color: 'var(--neu-text)',
            fontFamily: "'Inter', sans-serif",
          }}
          {...props}
        />
      </div>
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500">
          <span className="material-symbols-outlined text-[14px]">error</span>
          {error}
        </p>
      )}
    </div>
  )
);
Input.displayName = 'Input';
