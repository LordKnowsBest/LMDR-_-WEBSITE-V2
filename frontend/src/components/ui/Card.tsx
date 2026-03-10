import { cn } from '@/lib/cn';
import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevation?: 'flat' | 'sm' | 'md' | 'lg';
  inset?: boolean;
}

const elevations = {
  flat: '',
  sm: 'shadow-[3px_3px_6px_#C8B896,-3px_-3px_6px_#FFFFF5]',
  md: 'shadow-[6px_6px_12px_#C8B896,-6px_-6px_12px_#FFFFF5]',
  lg: 'shadow-[12px_12px_24px_#C8B896,-12px_-12px_24px_#FFFFF5]',
};

export function Card({ className, elevation = 'md', inset, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-card bg-beige p-6',
        inset
          ? 'shadow-[inset_4px_4px_8px_#C8B896,inset_-4px_-4px_8px_#FFFFF5]'
          : elevations[elevation],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
