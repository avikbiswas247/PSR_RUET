"use client";

import React from "react";

interface TableColumn {
  key: string;
  label: string;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

interface AdminTableProps {
  columns: TableColumn[];
  data: unknown[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: string;
  rowKey?: string;
  className?: string;
}

export function AdminTable({
  columns,
  data,
  loading = false,
  emptyTitle = "No records found",
  emptyDescription = "There are no records to display.",
  emptyIcon = "\u260E",
  rowKey = "id",
  className,
}: AdminTableProps) {
  const getValue = (row: unknown, key: string) =>
    (row as Record<string, unknown>)[key];

  if (loading) {
    return (
      <div className={`space-y-4 ${className || ""}`}>
        <div className="p-6 rounded-sm border line-border bg-surface">
          <div className="skeleton h2 mb-4" />
          <div className="skeleton line w-full" />
          <div className="skeleton line w-3/4 mt-2" />
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="p-6 rounded-sm border line-border bg-surface">
            <div className="skeleton h2 mb-2" />
            <div className="skeleton line w-1/2" />
            <div className="skeleton line w-3/4 mt-2" />
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-20 text-center ${className || ""}`}>
        <span className="text-6xl mb-6 opacity-50" aria-hidden="true">
          {emptyIcon}
        </span>
        <h2 className="text-[32px] tracking-tight font-bold mb-4">{emptyTitle}</h2>
        <p className="text-muted text-lg max-w-[420px]">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className={`border line-border rounded-sm bg-surface overflow-hidden ${className || ""}`}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-muted border-b border-line-border bg-surface-2"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line-border">
          {data.map((row) => (
            <tr
              key={String(getValue(row, rowKey))}
              className="hover:bg-surface-2 transition-colors group"
            >
              {columns.map((col) => {
                const value = getValue(row, col.key);
                if (col.render) {
                  return (
                    <td key={col.key} className="px-4 py-4 border-b border-line-border">
                      {col.render(value, row as Record<string, unknown>)}
                    </td>
                  );
                }
                return (
                  <td key={col.key} className="px-4 py-4 border-b border-line-border text-sm text-muted">
                    {value === null || value === undefined ? (
                      <span className="text-[10px] uppercase tracking-wider text-orange">—</span>
                    ) : (
                      String(value)
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
