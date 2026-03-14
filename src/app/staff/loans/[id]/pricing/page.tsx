import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { FeeItemizationCard } from "@/components/pricing/fee-itemization-card";
import { PricingResultsPanel } from "@/components/pricing/pricing-results-panel";
import { getStaffPricingWorkspace } from "@/lib/pricing/queries";
import { formatCurrency, formatPercent } from "@/lib/utils/format";

export default async function StaffLoanPricingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workspace = await getStaffPricingWorkspace(id);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={["Staff", workspace.loan.loan_number ?? workspace.loan.id, "Pricing"]}
        title={`Loan Pricing${workspace.loan.loan_number ? ` — ${workspace.loan.loan_number}` : ""}`}
        subtitle="Calculate rate, review fee disclosure, and manage the active rate lock."
      />

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
          <div className="mt-4 grid gap-3 text-sm text-gray-700 sm:grid-cols-2">
            <p>Borrower: {workspace.profile.borrower_name}</p>
            <p>Loan type: {workspace.loan.loan_type}</p>
            <p>Amount: {formatCurrency(workspace.loan.loan_amount)}</p>
            <p>Down payment: {formatCurrency(workspace.loan.down_payment)}</p>
            <p>Term: {workspace.loan.term_months / 12} years</p>
            <p>FICO: {workspace.profile.credit_score ?? "Not pulled"}</p>
            <p>LTV: {workspace.profile.ltv !== null ? formatPercent(workspace.profile.ltv) : "N/A"}</p>
            <p>Occupancy: {workspace.profile.occupancy_type ?? "N/A"}</p>
            <p>Property: {workspace.profile.property_type ?? "N/A"}</p>
          </div>
        </Card>

        <PricingResultsPanel
          loanId={workspace.loan.id}
          quotes={workspace.pricingResult?.availableProducts ?? []}
          activeRateLock={workspace.activeRateLock}
        />
      </div>

      <FeeItemizationCard fees={workspace.fees} totals={workspace.feeTotals} />
    </div>
  );
}
