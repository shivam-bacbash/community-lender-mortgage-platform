"use client";

import { useDraggable } from "@dnd-kit/core";

import { cn } from "@/lib/utils/cn";
import { formatCurrencyCompact } from "@/lib/utils/format";

export function KanbanCard({
  id,
  borrowerName,
  loanAmount,
  loanNumber,
  children,
}: {
  id: string;
  borrowerName: string;
  loanAmount: number;
  loanNumber: string;
  children?: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "cursor-grab rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all duration-150 ease-in-out active:cursor-grabbing hover:border-gray-300 hover:shadow-sm",
        isDragging && "rotate-1 scale-[1.02] border-gray-300 shadow-md opacity-90",
      )}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-mono text-gray-400">{loanNumber}</span>
      </div>
      <p className="mt-2 text-sm font-semibold text-gray-900">{borrowerName}</p>
      <p className="mt-1 text-sm text-gray-500">{formatCurrencyCompact(loanAmount)}</p>
      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}
