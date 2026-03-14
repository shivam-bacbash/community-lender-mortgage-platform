"use client";

import { useDroppable } from "@dnd-kit/core";

import { LoanCard } from "@/components/pipeline/LoanCard";
import { cn } from "@/lib/utils/cn";
import type { PipelineLoan, PipelineStageSummary } from "@/types/staff";

export function KanbanColumn({
  stage,
  loans,
}: {
  stage: PipelineStageSummary;
  loans: PipelineLoan[];
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: stage.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[24rem] flex-col rounded-2xl border border-gray-200 bg-gray-25 p-3",
        isOver && "border-primary-300 bg-primary-25",
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3 px-2 py-1">
        <div className="flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: stage.color }}
            aria-hidden="true"
          />
          <p className="text-sm font-semibold text-gray-900">{stage.name}</p>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-600">
          {loans.length}
        </span>
      </div>
      <div className="space-y-3">
        {loans.map((loan) => (
          <LoanCard key={loan.id} loan={loan} stage={stage} />
        ))}
      </div>
    </div>
  );
}
