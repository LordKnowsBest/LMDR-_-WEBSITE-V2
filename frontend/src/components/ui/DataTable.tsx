'use client';
import { cn } from '@/lib/cn';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: string;
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <div className="skeleton-shimmer h-4 rounded" style={{ width: `${60 + Math.random() * 30}%` }} />
        </td>
      ))}
    </tr>
  );
}

export function DataTable<T extends object>({
  columns, data, onRowClick, loading, emptyMessage = 'No data found', emptyIcon = 'inbox',
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="neu rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--neu-border)' }}>
              {columns.map((col) => (
                <th key={col.key} className={cn('px-5 py-3.5 text-left', col.className)}>
                  <span className="kpi-label">{col.header}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => <SkeletonRow key={i} cols={columns.length} />)}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="neu rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--neu-border)' }}>
            {columns.map((col) => (
              <th key={col.key} className={cn('px-5 py-3.5 text-left', col.className)}>
                <span className="kpi-label">{col.header}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-5 py-16 text-center">
                <div className="flex flex-col items-center gap-3">
                  <span className="material-symbols-outlined text-4xl" style={{ color: 'var(--neu-text-muted)' }}>{emptyIcon}</span>
                  <span className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>{emptyMessage}</span>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={i}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'animate-fade-up transition-colors duration-150',
                  onRowClick && 'cursor-pointer hover:bg-[var(--neu-bg-deep)]/40'
                )}
                style={{
                  borderBottom: '1px solid var(--neu-border)',
                  animationDelay: `${i * 0.03}s`,
                }}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-5 py-3.5', col.className)} style={{ color: 'var(--neu-text)' }}>
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
