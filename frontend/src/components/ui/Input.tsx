import { cn } from '@/lib/cn';
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-lmdr-dark">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          'w-full rounded-lg px-4 py-2.5 text-sm bg-beige text-lmdr-dark',
          'shadow-[inset_4px_4px_8px_#C8B896,inset_-4px_-4px_8px_#FFFFF5]',
          'focus:outline-none focus:ring-2 focus:ring-lmdr-blue/40',
          'placeholder:text-tan',
          error && 'ring-2 ring-status-suspended/40',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-status-suspended">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';
