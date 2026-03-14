import { LoanStatusClient } from "@/components/borrower/loan-status-client";
import { PageHeader } from "@/components/shared/page-header";
import { getBorrowerLoanDetails } from "@/lib/borrower/queries";

export default async function BorrowerLoanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const loan = await getBorrowerLoanDetails(id);

  return (
    <main id="main-content" className="space-y-6">
      <PageHeader
        breadcrumbs={["Borrower", "Loans", loan.loan_number ?? "Application"]}
        title={loan.loan_number ?? "Loan application"}
        subtitle="Monitor progress, review conditions, and stay aligned with your loan team."
      />
      <LoanStatusClient loanId={id} initialLoan={loan} />
    </main>
  );
}
