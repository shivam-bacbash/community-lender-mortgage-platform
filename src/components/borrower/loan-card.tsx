import Link from "next/link";
import { ArrowRight, CalendarClock, Landmark } from "lucide-react";

import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { BorrowerDashboardLoan } from "@/types/borrower";

export function LoanCard({ loan }: { loan: BorrowerDashboardLoan }) {
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-base font-semibold text-gray-900">
              {loan.loan_number ?? "Draft application"}
            </p>
            <StatusBadge status={loan.status} />
          </div>
          <p className="mt-1 text-sm text-gray-600 capitalize">
            {loan.loan_type} {loan.loan_purpose.replaceAll("_", " ")} mortgage
          </p>
        </div>
        <Link
          href={`/borrower/loans/${loan.id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700"
        >
          View status
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-5 grid gap-3 text-sm text-gray-600 sm:grid-cols-3">
        <div className="rounded-xl bg-gray-25 p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Loan amount</p>
          <p className="mt-1 text-base font-semibold text-gray-900">
            {loan.loan_amount ? formatCurrency(loan.loan_amount) : "Pending"}
          </p>
        </div>
        <div className="rounded-xl bg-gray-25 p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Current stage</p>
          <p className="mt-1 inline-flex items-center gap-2 text-base font-semibold text-gray-900">
            <Landmark className="h-4 w-4 text-primary-600" aria-hidden="true" />
            {loan.stage_name ?? "Application"}
          </p>
        </div>
        <div className="rounded-xl bg-gray-25 p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Last updated</p>
          <p className="mt-1 inline-flex items-center gap-2 text-base font-semibold text-gray-900">
            <CalendarClock className="h-4 w-4 text-primary-600" aria-hidden="true" />
            {formatDate(loan.updated_at)}
          </p>
        </div>
      </div>
    </Card>
  );
}
