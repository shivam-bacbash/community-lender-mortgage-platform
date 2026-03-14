import { LoanCard } from "@/components/borrower/loan-card";
import { QuickActions } from "@/components/borrower/quick-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { getBorrowerDashboardLoans } from "@/lib/borrower/queries";

export default async function BorrowerDashboardPage() {
  const { loans, latestDraft } = await getBorrowerDashboardLoans();

  return (
    <main id="main-content" className="space-y-6">
      <PageHeader
        breadcrumbs={["Borrower", "Dashboard"]}
        title="Your loans"
        subtitle="Track active applications, upload documents, and continue saved drafts."
        actions={<QuickActions hasDraft={Boolean(latestDraft)} />}
      />

      {loans.length ? (
        <div className="grid gap-4">
          {loans.map((loan) => (
            <LoanCard key={loan.id} loan={loan} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Start your first application"
          description="Once you create a loan application, its status and required actions will appear here."
          action={<QuickActions hasDraft={false} />}
        />
      )}
    </main>
  );
}
