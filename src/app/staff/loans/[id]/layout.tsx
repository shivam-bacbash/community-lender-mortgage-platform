import type { ReactNode } from "react";

import { LoanTabsNav } from "@/components/loan/loan-tabs-nav";
import { PageHeader } from "@/components/shared/page-header";
import { getStaffLoanHeader } from "@/lib/staff/queries";

export default async function StaffLoanLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const loan = await getStaffLoanHeader(id);

  return (
    <main id="main-content" className="space-y-6">
      <PageHeader
        breadcrumbs={["Staff", "Loans", loan.loan_number ?? "Application"]}
        title={loan.loan_number ?? "Loan application"}
        subtitle={`${loan.borrower_name} • ${loan.loan_type} ${loan.loan_purpose.replaceAll("_", " ")}`}
      />
      <LoanTabsNav loanId={id} />
      {children}
    </main>
  );
}
