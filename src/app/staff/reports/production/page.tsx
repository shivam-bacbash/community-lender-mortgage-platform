import { redirect } from "next/navigation";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getLOProduction } from "@/lib/reports/queries";
import { formatCurrency, formatPercent } from "@/lib/utils/format";

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

function getDefaultDates() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 90);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

export default async function LOProductionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const orgId = await requireAdmin();
  const params = await searchParams;
  const defaults = getDefaultDates();

  const startDate = params.startDate ?? defaults.startDate;
  const endDate = params.endDate ?? defaults.endDate;

  const rows = await getLOProduction(
    orgId,
    `${startDate}T00:00:00.000Z`,
    `${endDate}T23:59:59.999Z`,
  );

  // Totals row
  const totals = rows.reduce(
    (acc, row) => ({
      applications: acc.applications + row.applications,
      funded: acc.funded + row.funded,
      total_volume: acc.total_volume + row.total_volume,
    }),
    { applications: 0, funded: 0, total_volume: 0 },
  );

  const overallPullThrough =
    totals.applications > 0 ? totals.funded / totals.applications : 0;

  return (
    <main id="main-content" className="space-y-6">
      <PageHeader
        breadcrumbs={["Staff", "Reports", "LO Production"]}
        title="LO Production"
        subtitle="Loan officer performance metrics for the selected period, sorted by funded volume."
        actions={
          <Link href="/staff/reports" className="text-sm font-semibold text-primary-700">
            All reports
          </Link>
        }
      />

      {/* Date filter */}
      <Card className="p-5">
        <form method="GET" className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="startDate" className="mb-1 block text-sm font-medium text-gray-700">
              Start date
            </label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              defaultValue={startDate}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="mb-1 block text-sm font-medium text-gray-700">
              End date
            </label>
            <input
              id="endDate"
              name="endDate"
              type="date"
              defaultValue={endDate}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Apply
          </button>
        </form>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  LO Name
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Applications
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Funded
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Volume
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Pull-Through Rate
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-sm text-gray-500">
                    No loan officer data for the selected period.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.lo_name} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">
                      {row.lo_name}
                    </td>
                    <td className="px-6 py-3 text-right text-sm text-gray-700">
                      {row.applications.toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-right text-sm text-gray-700">
                      {row.funded.toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-right text-sm text-gray-900 font-medium">
                      {formatCurrency(row.total_volume)}
                    </td>
                    <td className="px-6 py-3 text-right text-sm text-gray-700">
                      {formatPercent(row.pull_through_rate)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-6 py-3 text-sm font-semibold text-gray-900">
                    Totals
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                    {totals.applications.toLocaleString()}
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                    {totals.funded.toLocaleString()}
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                    {formatCurrency(totals.total_volume)}
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                    {formatPercent(overallPullThrough)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>
    </main>
  );
}
