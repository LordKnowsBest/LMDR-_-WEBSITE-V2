import { cn } from '@/lib/cn';
import { ButtonHTMLAttributes, forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, icon, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-bold transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neu-accent)]/30',
        {
          primary: 'btn-glow text-white',
          secondary: 'neu-x hover:translate-y-[-1px] active:neu-ins active:scale-[0.98]',
          ghost: 'bg-transparent hover:bg-[var(--neu-accent)]/5',
          danger: 'bg-gradient-to-br from-red-500 to-red-700 text-white shadow-[0_6px_14px_rgba(239,68,68,0.28)] hover:shadow-[0_8px_20px_rgba(239,68,68,0.4)] hover:translate-y-[-1px] active:scale-[0.98]',
        }[variant],
        {
          sm: 'px-3 py-1.5 text-xs',
          md: 'px-4 py-2 text-[13px]',
          lg: 'px-6 py-2.5 text-sm',
        }[size],
        (loading || disabled) && 'opacity-50 cursor-not-allowed pointer-events-none',
        className
      )}
      style={{
        color: variant === 'secondary' ? 'var(--neu-text)' : variant === 'ghost' ? 'var(--neu-accent)' : undefined,
        fontFamily: "'Inter', sans-serif",
      }}
      disabled={loading || disabled}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {icon && !loading && (
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      )}
      {children}
    </button>
  )
);
Button.displayName = 'Button';
