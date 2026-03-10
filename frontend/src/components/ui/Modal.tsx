'use client';
import { cn } from '@/lib/cn';
import { useEffect, useRef } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) ref.current?.showModal();
    else ref.current?.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className={cn(
        'rounded-card bg-beige p-0 backdrop:bg-lmdr-dark/40 shadow-[12px_12px_24px_#C8B896,-12px_-12px_24px_#FFFFF5]',
        'max-w-lg w-full',
        className
      )}
    >
      <div className="p-6">
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-lmdr-dark">{title}</h2>
            <button onClick={onClose} className="text-tan hover:text-lmdr-dark text-xl leading-none">&times;</button>
          </div>
        )}
        {children}
      </div>
    </dialog>
  );
}
