import { redirect } from "next/navigation";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { HMDADownloadButton } from "@/components/reports/hmda-download-button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHMDARecords } from "@/lib/reports/queries";
import { formatCurrency } from "@/lib/utils/format";

async function requireAdmin(): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/staff/dashboard");

  return profile.organization_id;
}

const ACTION_TAKEN_LABELS: Record<number, string> = {
  1: "Loan originated",
  2: "Application approved, not accepted",
  3: "Application denied",
  4: "Application withdrawn",
  5: "File closed for incompleteness",
  6: "Purchased loan",
  7: "Pre-approval request denied",
  8: "Pre-approval request approved, not accepted",
};

const LIEN_STATUS_LABELS: Record<number, string> = {
  1: "First lien",
  2: "Subordinate lien",
};

export default async function HMDAPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const orgId = await requireAdmin();
  const params = await searchParams;
  const currentYear = new Date().getFullYear();
  const year = params.year ? parseInt(params.year, 10) : currentYear;

  const records = await getHMDARecords(orgId, year);

  const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

  return (
    <main id="main-content" className="space-y-6">
      <PageHeader
        breadcrumbs={["Staff", "Reports", "HMDA Export"]}
        title="HMDA Export"
        subtitle="Home Mortgage Disclosure Act records for regulatory reporting."
        actions={
          <Link href="/staff/reports" className="text-sm font-semibold text-primary-700">
            All reports
          </Link>
        }
      />

      {/* Year selector and download */}
      <Card className="p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <form method="GET" className="flex items-end gap-4">
            <div>
              <label htmlFor="year" className="mb-1 block text-sm font-medium text-gray-700">
                Reporting year
              </label>
              <select
                id="year"
                name="year"
                defaultValue={year}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
            >
              Load
            </button>
          </form>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {records.length} record{records.length !== 1 ? "s" : ""}
            </span>
            <HMDADownloadButton year={year} />
          </div>
        </div>
      </Card>

      {/* Records table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Loan ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Action Taken
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Action Date
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Loan Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Lien Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  County Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Census Tract
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-sm text-gray-500">
                    No HMDA records found for {year}.
                  </td>
                </tr>
              ) : (
                records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs font-mono text-gray-600">
                      {rec.loan_application_id.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {rec.action_taken !== null
                        ? (ACTION_TAKEN_LABELS[rec.action_taken] ?? String(rec.action_taken))
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {rec.action_taken_date
                        ? new Date(rec.action_taken_date).toLocaleDateString("en-US")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900">
                      {rec.loan_amount !== null ? formatCurrency(Number(rec.loan_amount)) : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {rec.lien_status !== null
                        ? (LIEN_STATUS_LABELS[rec.lien_status] ?? String(rec.lien_status))
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {rec.county_code ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {rec.census_tract ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}
