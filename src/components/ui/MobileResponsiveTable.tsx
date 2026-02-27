import React from "react";
import { cn } from "@/lib/utils";

interface Column {
  key: string;
  label: string;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

interface MobileResponsiveTableProps {
  columns: Column[];
  data: Record<string, unknown>[];
  onRowClick?: (row: Record<string, unknown>) => void;
  emptyMessage?: string;
  className?: string;
}

function CellValue({ column, row }: { column: Column; row: Record<string, unknown> }) {
  const value = row[column.key];
  if (column.render) return <>{column.render(value, row)}</>;
  return <>{value != null ? String(value) : "\u2014"}</>;
}

export function MobileResponsiveTable({
  columns,
  data,
  onRowClick,
  emptyMessage = "No data available.",
  className,
}: MobileResponsiveTableProps) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
    );
  }

  return (
    <div className={cn(className)}>
      {/* Desktop table */}
      <div className="hidden md:block overflow-auto rounded-lg border border-border">
        <table className="w-full caption-bottom text-sm">
          <thead className="bg-muted/50">
            <tr className="border-b border-border">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr
                key={i}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  "border-b border-border transition-colors hover:bg-muted/50",
                  i % 2 === 1 && "bg-muted/20",
                  onRowClick && "cursor-pointer",
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className="p-4 align-middle text-foreground">
                    <CellValue column={col} row={row} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {data.map((row, i) => (
          <div
            key={i}
            role={onRowClick ? "button" : undefined}
            tabIndex={onRowClick ? 0 : undefined}
            onClick={() => onRowClick?.(row)}
            onKeyDown={(e) => { if (onRowClick && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onRowClick(row); } }}
            className={cn(
              "rounded-xl border border-border bg-card p-4 shadow-sm transition-all duration-200",
              "hover:-translate-y-0.5 hover:shadow-md",
              onRowClick && "cursor-pointer active:scale-[0.98]",
            )}
          >
            {columns.map((col) => (
              <div
                key={col.key}
                className="flex items-baseline justify-between gap-4 py-1.5 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-border/50"
              >
                <span className="shrink-0 text-xs font-medium text-muted-foreground">
                  {col.label}
                </span>
                <span className="text-right text-sm text-foreground">
                  <CellValue column={col} row={row} />
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
