import Link from "next/link";

import { getAdminComplianceOverview } from "@/lib/compliance/queries";
import { formatDate } from "@/lib/utils/format";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";

export default async function AdminCompliancePage() {
  const overview = await getAdminComplianceOverview();

  return (
    <main id="main-content" className="min-h-screen bg-gray-50 px-6 py-10 sm:px-10 lg:px-12">
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader
          breadcrumbs={["Admin", "Compliance"]}
          title="Compliance overview"
          subtitle="Org-wide disclosure timing, HMDA coverage, and flagged files."
          actions={
            <Link href="/admin/compliance/audit" className="text-sm font-semibold text-primary-700">
              Open audit log
            </Link>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {overview.metrics.map((metric) => (
            <Card key={metric.label} className="p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-gray-500">{metric.label}</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{metric.value}</p>
              <p className="mt-2 text-sm text-gray-600">{metric.helper}</p>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming disclosures</h2>
            <div className="mt-4 space-y-3">
              {overview.upcomingDisclosures.length ? (
                overview.upcomingDisclosures.map((row) => (
                  <div key={row.id} className="rounded-2xl border border-gray-200 bg-gray-25 p-4">
                    <p className="text-sm font-semibold text-gray-900">
                      {row.disclosure_type} • {row.loan_number ?? row.loan_application_id}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      Due {row.deadline ? formatDate(row.deadline, "MMM d, yyyy") : "N/A"} • {row.status}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600">No pending disclosures are due soon.</p>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900">Flagged files</h2>
            <div className="mt-4 space-y-3">
              {overview.flaggedLoans.length ? (
                overview.flaggedLoans.map((loan) => (
                  <div key={loan.loan_application_id} className="rounded-2xl border border-gray-200 bg-gray-25 p-4">
                    <p className="text-sm font-semibold text-gray-900">
                      {loan.loan_number ?? loan.loan_application_id} • {loan.borrower_name}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      QM: {loan.qm_status} • AI: {loan.compliance_status ?? "unknown"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600">No active compliance flags across the current pipeline.</p>
              )}
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900">HMDA records</h2>
          <div className="mt-4 space-y-3">
            {overview.hmdaRecords.length ? (
              overview.hmdaRecords.map((record) => (
                <div key={record.id} className="rounded-2xl border border-gray-200 bg-gray-25 p-4 text-sm text-gray-700">
                  <p className="font-semibold text-gray-900">Reporting year {record.reporting_year}</p>
                  <p className="mt-1">
                    Action taken: {record.action_taken ?? "N/A"} • Action date: {record.action_taken_date ?? "N/A"}
                  </p>
                  <p className="mt-1">
                    Census tract: {record.census_tract ?? "N/A"} • Rate spread: {record.rate_spread ?? "N/A"}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-600">No HMDA records have been captured for the current reporting year yet.</p>
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}
