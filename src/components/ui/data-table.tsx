"use client";

import type { ReactNode } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils/cn";

import { EmptyState } from "./empty-state";

export function DataTable<TData>({
  columns,
  data,
  rowCountLabel,
  emptyTitle = "No records yet",
  emptyDescription = "This table will populate once data is available.",
  onRowClick,
}: {
  columns: ColumnDef<TData>[];
  data: TData[];
  rowCountLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: TData) => void;
}) {
  // TanStack Table is an approved project dependency; this hook is intentionally used here.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!data.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="space-y-3">
      {rowCountLabel ? <p className="text-sm text-gray-500">{rowCountLabel}</p> : null}
      <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
                  >
                    {header.isPlaceholder ? null : (
                      <div className="inline-flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() ? (
                          header.column.getIsSorted() === "desc" ? (
                            <ChevronDown aria-hidden="true" className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronUp aria-hidden="true" className="h-3.5 w-3.5" />
                          )
                        ) : null}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  "transition-colors duration-100",
                  onRowClick ? "cursor-pointer hover:bg-gray-50" : undefined,
                )}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4 text-sm text-gray-700">
                    {flexRender(cell.column.columnDef.cell, cell.getContext()) as ReactNode}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
