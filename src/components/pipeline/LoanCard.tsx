"use client";

import Link from "next/link";
import { useDraggable } from "@dnd-kit/core";

import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils/cn";
import { formatCurrencyCompact } from "@/lib/utils/format";
import type { PipelineLoan, PipelineStageSummary } from "@/types/staff";

function getRiskTone(score: number | null) {
  if (score === null) return "bg-gray-100 text-gray-600";
  if (score >= 75) return "bg-success-25 text-success-700";
  if (score >= 50) return "bg-warning-25 text-warning-700";
  return "bg-error-25 text-error-700";
}

export function LoanCard({
  loan,
  stage,
}: {
  loan: PipelineLoan;
  stage: PipelineStageSummary | null;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: loan.id,
    data: { stageId: loan.pipeline_stage_id },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const daysInStage = loan.days_in_stage;
  const slaWarning =
    stage?.sla_days !== null && stage?.sla_days !== undefined && daysInStage > stage.sla_days;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-gray-300",
        isDragging && "rotate-1 border-primary-300 shadow-lg opacity-90",
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-mono text-gray-500">{loan.loan_number ?? "Draft"}</p>
          <Link
            href={`/staff/loans/${loan.id}`}
            className="mt-1 block text-sm font-semibold text-gray-900 hover:text-primary-700"
          >
            {loan.borrower_name}
          </Link>
        </div>
        <StatusBadge status={loan.status} />
      </div>
      <p className="mt-3 text-lg font-semibold text-gray-900">
        {loan.loan_amount ? formatCurrencyCompact(loan.loan_amount) : "TBD"}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium capitalize text-gray-700">
          {loan.loan_type}
        </span>
        <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium capitalize text-gray-700">
          {loan.loan_purpose.replaceAll("_", " ")}
        </span>
        <span className={cn("rounded-full px-2.5 py-1 font-medium", getRiskTone(loan.ai_risk_score))}>
          AI {loan.ai_risk_score ?? "n/a"}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span>{daysInStage}d in stage</span>
        {slaWarning ? <span className="font-medium text-warning-700">SLA warning</span> : null}
      </div>
    </div>
  );
}
