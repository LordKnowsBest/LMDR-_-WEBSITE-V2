import { cn } from '@/lib/cn';
import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevation?: 'flat' | 'xs' | 'sm' | 'md' | 'lg';
  inset?: boolean;
  hover?: boolean;
}

export function Card({ className, elevation = 'md', inset, hover, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl p-5',
        inset ? 'neu-in' : {
          'flat': '',
          'xs': 'neu-x',
          'sm': 'neu-s',
          'md': 'neu',
          'lg': 'neu-lg',
        }[elevation],
        hover && 'neu-hover cursor-pointer',
        'transition-all duration-300',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
