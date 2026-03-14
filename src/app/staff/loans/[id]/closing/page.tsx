import { getClosingWorkspace } from "@/lib/closing/queries";
import { FUNDING_CHECKLIST_ITEMS } from "@/components/closing/funding-checklist";
import { ClosingOrderForm } from "@/components/closing/closing-order-form";
import { EsignSection } from "@/components/closing/esign-section";
import { FundingChecklist } from "@/components/closing/funding-checklist";
import { MarkFundedButton } from "@/components/closing/mark-funded-button";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils/cn";

type ClosingStep = {
  key: string;
  label: string;
  statuses: string[];
};

const CLOSING_STEPS: ClosingStep[] = [
  { key: "scheduled", label: "Scheduled", statuses: ["scheduled"] },
  { key: "docs_out", label: "Docs Out", statuses: ["docs_out"] },
  { key: "signed", label: "Signed", statuses: ["signed"] },
  { key: "funded", label: "Funded", statuses: ["funded"] },
  { key: "completed", label: "Completed", statuses: ["completed"] },
];

function getStepIndex(status: string | null): number {
  if (!status || status === "pending" || status === "cancelled") return -1;
  return CLOSING_STEPS.findIndex((step) => step.statuses.includes(status));
}

function ClosingTimeline({ status }: { status: string | null }) {
  const activeIndex = getStepIndex(status);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        {CLOSING_STEPS.map((step, index) => {
          const isCompleted = index < activeIndex;
          const isActive = index === activeIndex;
          const isPending = index > activeIndex;

          return (
            <div key={step.key} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                    isCompleted
                      ? "bg-success-500 text-white"
                      : isActive
                        ? "bg-primary-600 text-white ring-2 ring-primary-200"
                        : "bg-gray-100 text-gray-400",
                  )}
                >
                  {isCompleted ? (
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium whitespace-nowrap",
                    isCompleted
                      ? "text-success-600"
                      : isActive
                        ? "text-primary-700"
                        : "text-gray-400",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < CLOSING_STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-1 h-0.5 flex-1 transition-colors",
                    index < activeIndex ? "bg-success-400" : "bg-gray-200",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default async function StaffLoanClosingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workspace = await getClosingWorkspace(id);
  const { closingOrder, esignEnvelopes, loan } = workspace;

  const checkedItems: string[] =
    (closingOrder?.wire_instructions?.checklist as string[] | undefined) ?? [];

  const allFundingItemsChecked = checkedItems.length === FUNDING_CHECKLIST_ITEMS.length;

  return (
    <main id="main-content" className="space-y-6">
      <PageHeader
        breadcrumbs={["Staff", "Loans", loan.loan_number ?? "Application", "Closing"]}
        title="Closing & Title"
        subtitle="Schedule closing, manage e-sign envelopes, and track pre-funding requirements."
      />

      <ClosingTimeline status={closingOrder?.status ?? null} />

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <ClosingOrderForm loanId={id} existing={closingOrder} />

        <div className="space-y-6">
          <EsignSection loanId={id} envelopes={esignEnvelopes} />

          {closingOrder && (
            <>
              <FundingChecklist
                closingOrderId={closingOrder.id}
                checkedItems={checkedItems}
              />

              {closingOrder.status !== "funded" && closingOrder.status !== "completed" && (
                <MarkFundedButton
                  loanId={id}
                  closingOrderId={closingOrder.id}
                  allChecked={allFundingItemsChecked}
                  loanAmount={loan.loan_amount}
                />
              )}

              {(closingOrder.status === "funded" || closingOrder.status === "completed") && (
                <div className="rounded-xl border border-success-200 bg-success-50 p-6">
                  <p className="text-sm font-semibold text-success-700">
                    This loan has been funded.
                  </p>
                  {closingOrder.funding_amount && (
                    <p className="mt-1 text-sm text-success-600">
                      Funding amount:{" "}
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(Number(closingOrder.funding_amount))}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
