"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { Search } from "lucide-react";

import { moveLoanStage } from "@/lib/actions/loans";
import { usePipelineStore } from "@/stores/use-pipeline-store";
import { usePipelineRealtime } from "@/hooks/use-pipeline-realtime";
import { useStaffPipeline } from "@/hooks/use-staff-pipeline";
import { LoanCard } from "@/components/pipeline/LoanCard";
import { KanbanColumn } from "@/components/pipeline/KanbanColumn";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { PipelineLoan, StaffPipelineData } from "@/types/staff";

export function KanbanBoard({ initialData }: { initialData: StaffPipelineData }) {
  const query = useStaffPipeline(initialData);
  const loans = usePipelineStore((state) => state.loans);
  const setLoans = usePipelineStore((state) => state.setLoans);
  const moveLoan = usePipelineStore((state) => state.moveLoan);
  const revertMove = usePipelineStore((state) => state.revertMove);
  const [search, setSearch] = useState("");
  const [loanOfficerFilter, setLoanOfficerFilter] = useState("");
  const [loanTypeFilter, setLoanTypeFilter] = useState("");
  const [loanPurposeFilter, setLoanPurposeFilter] = useState("");
  const [slaFilter, setSlaFilter] = useState("");
  const [activeLoan, setActiveLoan] = useState<PipelineLoan | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    setLoans(query.data.loans);
  }, [query.data.loans, setLoans]);

  usePipelineRealtime(query.data.organizationId);

  const stageMap = useMemo(
    () => new Map(query.data.stages.map((stage) => [stage.id, stage])),
    [query.data.stages],
  );

  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      const searchMatch =
        !search ||
        loan.borrower_name.toLowerCase().includes(search.toLowerCase()) ||
        (loan.loan_number ?? "").toLowerCase().includes(search.toLowerCase());
      const officerMatch = !loanOfficerFilter || loan.loan_officer_name === loanOfficerFilter;
      const loanTypeMatch = !loanTypeFilter || loan.loan_type === loanTypeFilter;
      const purposeMatch = !loanPurposeFilter || loan.loan_purpose === loanPurposeFilter;
      const slaMatch =
        !slaFilter ||
        (() => {
          const stage = loan.pipeline_stage_id ? stageMap.get(loan.pipeline_stage_id) : null;
          if (!stage?.sla_days) return false;
          const daysInStage = Math.floor(
            (Date.now() - new Date(loan.updated_at).getTime()) / (1000 * 60 * 60 * 24),
          );
          return slaFilter === "warning" ? daysInStage > stage.sla_days : daysInStage <= stage.sla_days;
        })();

      return searchMatch && officerMatch && loanTypeMatch && purposeMatch && slaMatch;
    });
  }, [loanOfficerFilter, loanPurposeFilter, loanTypeFilter, loans, search, slaFilter, stageMap]);

  const activeColumns = query.data.stages.filter((stage) => !stage.is_terminal);

  async function handleMove(loanId: string, previousStageId: string | null, nextStageId: string) {
    setServerError(null);
    moveLoan(loanId, nextStageId);

    startTransition(async () => {
      const result = await moveLoanStage(loanId, nextStageId);

      if (result.error) {
        revertMove(loanId, previousStageId);
        setServerError(result.error);
      }
    });
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveLoan(null);
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const loan = loans.find((item) => item.id === active.id);
    const destinationStageId = String(over.id);

    if (!loan || loan.pipeline_stage_id === destinationStageId) {
      return;
    }

    void handleMove(loan.id, loan.pipeline_stage_id, destinationStageId);
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 xl:grid-cols-[2fr_repeat(4,1fr)]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Search borrower or loan number"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Select value={loanOfficerFilter} onChange={(event) => setLoanOfficerFilter(event.target.value)}>
          <option value="">All loan officers</option>
          {query.data.staffOptions.map((option) => (
            <option key={option.id} value={option.label}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select value={loanTypeFilter} onChange={(event) => setLoanTypeFilter(event.target.value)}>
          <option value="">All loan types</option>
          <option value="conventional">Conventional</option>
          <option value="fha">FHA</option>
          <option value="va">VA</option>
          <option value="usda">USDA</option>
          <option value="jumbo">Jumbo</option>
        </Select>
        <Select value={loanPurposeFilter} onChange={(event) => setLoanPurposeFilter(event.target.value)}>
          <option value="">All purposes</option>
          <option value="purchase">Purchase</option>
          <option value="refinance">Refinance</option>
          <option value="cash_out">Cash-out</option>
          <option value="construction">Construction</option>
        </Select>
        <Select value={slaFilter} onChange={(event) => setSlaFilter(event.target.value)}>
          <option value="">All SLA states</option>
          <option value="warning">Over SLA</option>
          <option value="healthy">Within SLA</option>
        </Select>
      </div>

      {serverError ? <p className="text-sm text-error-600">{serverError}</p> : null}
      {isPending ? <p className="text-sm text-gray-500">Updating stage…</p> : null}

      {!filteredLoans.length ? (
        <EmptyState
          title="No pipeline matches"
          description="Adjust the filters or wait for more submitted applications."
          action={<Link href="/staff/dashboard" className="text-sm font-semibold text-primary-700">Back to dashboard</Link>}
        />
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={(event) => {
            const loan = loans.find((item) => item.id === event.active.id);
            setActiveLoan(loan ?? null);
          }}
          onDragEnd={onDragEnd}
        >
          <div className="grid gap-4 xl:grid-cols-4">
            {activeColumns.map((stage) => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                loans={filteredLoans.filter((loan) => loan.pipeline_stage_id === stage.id)}
              />
            ))}
          </div>
          <DragOverlay>
            {activeLoan ? (
              <LoanCard loan={activeLoan} stage={activeLoan.pipeline_stage_id ? stageMap.get(activeLoan.pipeline_stage_id) ?? null : null} />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
