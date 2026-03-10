'use client';
import { cn } from '@/lib/cn';
import { useEffect, useRef } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  icon?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, icon, children, className }: ModalProps) {
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
        'neu-lg rounded-2xl p-0 border-0',
        'backdrop:bg-[#0f172a]/50 backdrop:backdrop-blur-sm',
        'max-w-lg w-full',
        'animate-spot-in',
        className
      )}
    >
      <div className="p-6">
        {title && (
          <div className="flex items-center justify-between mb-5" style={{ borderBottom: '1px solid var(--neu-border)', paddingBottom: '12px' }}>
            <div className="flex items-center gap-2">
              {icon && <span className="material-symbols-outlined text-[20px]" style={{ color: 'var(--neu-accent)' }}>{icon}</span>}
              <h2 className="text-base font-bold" style={{ color: 'var(--neu-text)' }}>{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="neu-x w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-105 active:neu-ins active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--neu-text-muted)' }}>close</span>
            </button>
          </div>
        )}
        {children}
      </div>
    </dialog>
  );
}
