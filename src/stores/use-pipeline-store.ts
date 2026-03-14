"use client";

import { create } from "zustand";

import type { PipelineLoan } from "@/types/staff";

interface PipelineStore {
  loans: PipelineLoan[];
  setLoans: (loans: PipelineLoan[]) => void;
  moveLoan: (loanId: string, newStageId: string | null) => void;
  revertMove: (loanId: string, previousStageId: string | null) => void;
  upsertLoan: (loan: Partial<PipelineLoan> & { id: string; pipeline_stage_id?: string | null }) => void;
}

export const usePipelineStore = create<PipelineStore>((set) => ({
  loans: [],
  setLoans: (loans) => set({ loans }),
  moveLoan: (loanId, newStageId) =>
    set((state) => ({
      loans: state.loans.map((loan) =>
        loan.id === loanId ? { ...loan, pipeline_stage_id: newStageId } : loan,
      ),
    })),
  revertMove: (loanId, previousStageId) =>
    set((state) => ({
      loans: state.loans.map((loan) =>
        loan.id === loanId ? { ...loan, pipeline_stage_id: previousStageId } : loan,
      ),
    })),
  upsertLoan: (partialLoan) =>
    set((state) => ({
      loans: state.loans.map((loan) =>
        loan.id === partialLoan.id ? { ...loan, ...partialLoan } : loan,
      ),
    })),
}));
