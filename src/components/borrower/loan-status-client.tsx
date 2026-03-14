"use client";

import Link from "next/link";
import { Clock3, FileText, MessageSquare, TriangleAlert } from "lucide-react";

import { AIPrequalCard } from "@/components/loan/ai-prequal-card";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useBorrowerLoan } from "@/hooks/use-borrower-loan";
import { useLoanRealtime } from "@/hooks/use-loan-realtime";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { BorrowerLoanDetails } from "@/types/borrower";

export function LoanStatusClient({
  loanId,
  initialLoan,
}: {
  loanId: string;
  initialLoan: BorrowerLoanDetails;
}) {
  const query = useBorrowerLoan(loanId, initialLoan);
  const loan = query.data;
  useLoanRealtime(loanId);
  const prequalification = loan.prequalification?.parsed_result ?? null;
  const isPrequalPending = !prequalification && query.isPollingPrequalification;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-semibold text-gray-900">
                {loan.loan_number ?? "Loan application"}
              </h2>
              <StatusBadge status={loan.status} />
            </div>
            <p className="mt-2 text-sm text-gray-600">
              {loan.loan_type} {loan.loan_purpose.replaceAll("_", " ")} mortgage for{" "}
              {loan.loan_amount ? formatCurrency(loan.loan_amount) : "TBD"}
            </p>
          </div>
          <div className="rounded-2xl bg-primary-25 px-4 py-3 text-sm text-gray-700">
            <p className="font-medium">Estimated closing</p>
            <p className="mt-1 font-semibold text-gray-900">
              {loan.estimated_closing ? formatDate(loan.estimated_closing) : "Not set yet"}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3">
          <Clock3 className="h-5 w-5 text-primary-600" aria-hidden="true" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Pipeline status</h3>
            <p className="text-sm text-gray-600">
              Current stage: {loan.stage?.name ?? "Application"}
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {loan.stageTimeline.map((stage) => (
            <div
              key={stage.id}
              className={`rounded-2xl border p-4 ${
                stage.isCurrent
                  ? "border-primary-300 bg-primary-25"
                  : stage.isComplete
                    ? "border-success-200 bg-success-25"
                    : "border-gray-200 bg-white"
              }`}
            >
              <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Stage {stage.order_index}</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{stage.name}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <AIPrequalCard
          loading={isPrequalPending}
          score={prequalification?.score ?? null}
          recommendation={prequalification?.recommendation ?? null}
          strengths={prequalification?.strengths ?? []}
          concerns={prequalification?.concerns ?? []}
          estimatedDti={prequalification?.estimated_dti ?? null}
          estimatedLtv={prequalification?.estimated_ltv ?? null}
          rationale={prequalification?.rationale ?? null}
          disclaimer="This is an automated pre-assessment, not a final credit decision."
        />

        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary-600" aria-hidden="true" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
                  <p className="text-sm text-gray-600">Upload and track requested files.</p>
                </div>
              </div>
              <Link href={`/borrower/loans/${loan.id}/documents`} className="text-sm font-semibold text-primary-700">
                Open
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {loan.documents.length ? (
                loan.documents.slice(0, 4).map((document) => (
                  <div key={document.id} className="flex items-center justify-between gap-3 rounded-xl bg-gray-25 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{document.file_name}</p>
                      <p className="text-xs text-gray-500">{formatDate(document.created_at)}</p>
                    </div>
                    <StatusBadge status={document.status} />
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600">No documents uploaded yet.</p>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <TriangleAlert className="h-5 w-5 text-warning-600" aria-hidden="true" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Action items</h3>
                <p className="text-sm text-gray-600">Open borrower tasks and visible conditions.</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {[...loan.tasks, ...loan.conditions].length ? (
                <>
                  {loan.tasks.map((task) => (
                    <div key={task.id} className="rounded-xl bg-warning-25 px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{task.title}</p>
                      <p className="mt-1 text-xs text-gray-600">
                        {task.status.replaceAll("_", " ")}
                        {task.due_date ? ` • due ${formatDate(task.due_date)}` : ""}
                      </p>
                    </div>
                  ))}
                  {loan.conditions.map((condition) => (
                    <div key={condition.id} className="rounded-xl bg-warning-25 px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{condition.description}</p>
                      <p className="mt-1 text-xs text-gray-600">
                        {condition.status.replaceAll("_", " ")}
                        {condition.due_date ? ` • due ${formatDate(condition.due_date)}` : ""}
                      </p>
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-sm text-gray-600">No open borrower action items.</p>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-primary-600" aria-hidden="true" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Messages</h3>
                  <p className="text-sm text-gray-600">Latest updates from your loan team.</p>
                </div>
              </div>
              <Link href={`/borrower/loans/${loan.id}/messages`} className="text-sm font-semibold text-primary-700">
                View thread
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {loan.lastMessages.length ? (
                loan.lastMessages.map((message) => (
                  <div key={message.id} className="rounded-xl bg-gray-25 px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{message.sender_name}</p>
                    <p className="mt-1 text-sm text-gray-600">{message.body}</p>
                    <p className="mt-2 text-xs text-gray-500">{formatDate(message.created_at)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600">No messages yet.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
