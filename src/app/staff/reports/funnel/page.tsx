import { redirect } from "next/navigation";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getApplicationFunnel } from "@/lib/reports/queries";
import { formatPercent } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

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

// Generate a blue→green gradient class based on position in funnel
function getBarColor(index: number, total: number): string {
  const ratio = total > 1 ? index / (total - 1) : 0;

  if (ratio < 0.25) return "bg-blue-500";
  if (ratio < 0.5) return "bg-cyan-500";
  if (ratio < 0.75) return "bg-teal-500";
  return "bg-green-500";
}

export default async function ApplicationFunnelPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const orgId = await requireAdmin();
  const params = await searchParams;
  const defaults = getDefaultDates();

  const startDate = params.startDate ?? defaults.startDate;
  const endDate = params.endDate ?? defaults.endDate;

  const rows = await getApplicationFunnel(
    orgId,
    `${startDate}T00:00:00.000Z`,
    `${endDate}T23:59:59.999Z`,
  );

  const maxCount = Math.max(...rows.map((r) => r.count), 1);

  return (
    <main id="main-content" className="space-y-6">
      <PageHeader
        breadcrumbs={["Staff", "Reports", "Application Funnel"]}
        title="Application Funnel"
        subtitle="Loan counts through each pipeline stage and conversion from initial submissions."
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

      {/* Funnel visualization */}
      <Card className="p-6">
        <h2 className="mb-6 text-base font-semibold text-gray-900">Funnel chart</h2>
        {rows.length === 0 ? (
          <p className="text-sm text-gray-500">No data for the selected period.</p>
        ) : (
          <div className="space-y-2">
            {rows.map((row, index) => {
              const widthPct = Math.max(4, (row.count / maxCount) * 100);
              const barColor = getBarColor(index, rows.length);
              const prevCount = index > 0 ? rows[index - 1].count : row.count;
              const stepConversion =
                prevCount > 0 ? row.count / prevCount : 1;

              return (
                <div key={row.stage_name} className="group flex items-center gap-3">
                  <span className="w-40 flex-shrink-0 truncate text-sm text-gray-600">
                    {row.stage_name}
                  </span>
                  <div className="flex-1 rounded bg-gray-100" style={{ height: "32px" }}>
                    <div
                      className={cn("rounded transition-all", barColor)}
                      style={{ width: `${widthPct}%`, height: "32px" }}
                    />
                  </div>
                  <div className="flex w-40 flex-shrink-0 items-center justify-end gap-3 text-sm">
                    <span className="font-semibold text-gray-900">
                      {row.count.toLocaleString()}
                    </span>
                    <span className="text-gray-500">
                      {index === 0 ? "100%" : formatPercent(stepConversion)}
                    </span>
                  </div>
                </div>
              );
            })}
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
                  Count
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  From Initial
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  From Prev Stage
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
                rows.map((row, index) => {
                  const prevCount = index > 0 ? rows[index - 1].count : row.count;
                  const stepConversion = prevCount > 0 ? row.count / prevCount : 1;

                  return (
                    <tr key={row.stage_name} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">
                        {row.stage_name}
                      </td>
                      <td className="px-6 py-3 text-right text-sm text-gray-900">
                        {row.count.toLocaleString()}
                      </td>
                      <td className="px-6 py-3 text-right text-sm text-gray-700">
                        {index === 0 ? "—" : formatPercent(row.conversion_rate)}
                      </td>
                      <td className="px-6 py-3 text-right text-sm text-gray-700">
                        {index === 0 ? "—" : formatPercent(stepConversion)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}
