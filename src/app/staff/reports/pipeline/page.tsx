import { redirect } from "next/navigation";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPipelineVelocity } from "@/lib/reports/queries";

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

export default async function PipelineVelocityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const orgId = await requireAdmin();
  const params = await searchParams;
  const defaults = getDefaultDates();

  const startDate = params.startDate ?? defaults.startDate;
  const endDate = params.endDate ?? defaults.endDate;

  const rows = await getPipelineVelocity(
    orgId,
    `${startDate}T00:00:00.000Z`,
    `${endDate}T23:59:59.999Z`,
  );

  const maxCount = Math.max(...rows.map((r) => r.loan_count), 1);

  return (
    <main id="main-content" className="space-y-6">
      <PageHeader
        breadcrumbs={["Staff", "Reports", "Pipeline Velocity"]}
        title="Pipeline Velocity"
        subtitle="Loan count and estimated average days at each stage for the selected period."
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

      {/* Bar chart */}
      <Card className="p-6">
        <h2 className="mb-5 text-base font-semibold text-gray-900">
          Loans per stage
        </h2>
        {rows.length === 0 ? (
          <p className="text-sm text-gray-500">No data for the selected period.</p>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <div key={row.stage_name} className="flex items-center gap-3">
                <span className="w-36 flex-shrink-0 truncate text-sm text-gray-600">
                  {row.stage_name}
                </span>
                <div className="flex-1 rounded-full bg-gray-100" style={{ height: "24px" }}>
                  <div
                    className="rounded-full bg-primary-500 transition-all"
                    style={{
                      width: `${Math.max(2, (row.loan_count / maxCount) * 100)}%`,
                      height: "24px",
                    }}
                  />
                </div>
                <span className="w-24 flex-shrink-0 text-right text-sm text-gray-700">
                  {row.loan_count} loans
                </span>
                <span className="w-20 flex-shrink-0 text-right text-sm text-gray-500">
                  ~{row.avg_days}d avg
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Stage
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Order
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Loan Count
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Avg Days
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-sm text-gray-500">
                    No data available.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.stage_name} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">
                      {row.stage_name}
                    </td>
                    <td className="px-6 py-3 text-right text-sm text-gray-600">
                      {row.stage_order}
                    </td>
                    <td className="px-6 py-3 text-right text-sm text-gray-900">
                      {row.loan_count.toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-right text-sm text-gray-600">
                      {row.avg_days}d
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
