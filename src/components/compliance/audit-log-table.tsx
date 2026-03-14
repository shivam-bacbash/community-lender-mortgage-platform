"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/ui/data-table";
import { formatDate } from "@/lib/utils/format";
import type { AuditLogRecord } from "@/types/compliance";

export function AuditLogTable({ rows }: { rows: AuditLogRecord[] }) {
  const columns = useMemo<ColumnDef<AuditLogRecord, unknown>[]>(
    () => [
      {
        accessorKey: "created_at",
        header: "Timestamp",
        cell: (info) => formatDate(String(info.getValue()), "MMM d, yyyy h:mm a"),
      },
      {
        accessorKey: "actor_name",
        header: "Actor",
        cell: (info) => {
          const row = info.row.original as AuditLogRecord;
          return `${String(info.getValue())}${row.actor_role ? ` (${row.actor_role.replaceAll("_", " ")})` : ""}`;
        },
      },
      {
        accessorKey: "action",
        header: "Action",
      },
      {
        accessorKey: "resource_type",
        header: "Resource",
        cell: (info) => {
          const row = info.row.original as AuditLogRecord;
          return `${String(info.getValue())} • ${row.resource_id.slice(0, 8)}`;
        },
      },
      {
        id: "diff",
        header: "Before / After",
        cell: (info) => {
          const row = info.row.original as AuditLogRecord;
          return (
            <div className="space-y-1 font-mono text-xs text-gray-600">
              <p>Before: {JSON.stringify(row.before_state ?? {})}</p>
              <p>After: {JSON.stringify(row.after_state ?? {})}</p>
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      data={rows}
      rowCountLabel={`${rows.length} audit rows`}
      emptyTitle="No audit activity"
      emptyDescription="Audit rows will appear as users and system actions mutate loan data."
    />
  );
}
