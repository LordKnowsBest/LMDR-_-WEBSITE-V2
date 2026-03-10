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
}

export function DataTable<T extends object>({
  columns, data, onRowClick, loading, emptyMessage = 'No data found',
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-lmdr-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-card bg-beige shadow-[6px_6px_12px_#C8B896,-6px_-6px_12px_#FFFFF5]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-tan/20">
            {columns.map((col) => (
              <th key={col.key} className={cn('px-4 py-3 text-left font-semibold text-lmdr-dark', col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-tan">{emptyMessage}</td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={i}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'border-b border-tan/10 transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-beige-d/50'
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-4 py-3 text-lmdr-dark', col.className)}>
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
