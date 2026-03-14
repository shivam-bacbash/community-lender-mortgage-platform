import { redirect } from "next/navigation";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { MetricCard } from "@/components/shared/metric-card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getReportSummary } from "@/lib/reports/queries";
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

const REPORT_CARDS = [
  {
    href: "/staff/reports/pipeline",
    title: "Pipeline Velocity",
    description: "Average days loans spend at each pipeline stage and loan count per stage.",
    icon: (
      <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    href: "/staff/reports/production",
    title: "LO Production",
    description: "Loan officer performance metrics: applications, funded loans, volume, and pull-through rate.",
    icon: (
      <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    href: "/staff/reports/funnel",
    title: "Application Funnel",
    description: "Visual funnel showing loan counts and conversion rates through each pipeline stage.",
    icon: (
      <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
      </svg>
    ),
  },
  {
    href: "/staff/reports/hmda",
    title: "HMDA Export",
    description: "Home Mortgage Disclosure Act records by year with LAR file download.",
    icon: (
      <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
    ),
  },
];

export default async function ReportsHubPage() {
  const orgId = await requireAdmin();
  const summary = await getReportSummary(orgId);

  const metrics = [
    {
      label: "Total Loans",
      value: summary.total_loans.toLocaleString(),
      helper: "All-time loan applications",
    },
    {
      label: "Funded YTD",
      value: summary.funded_ytd.toLocaleString(),
      helper: "Funded loans this calendar year",
    },
    {
      label: "Volume YTD",
      value: formatCurrency(summary.total_volume_ytd),
      helper: "Total funded volume this year",
    },
    {
      label: "Avg Days to Close",
      value: summary.avg_days_to_close > 0 ? `${summary.avg_days_to_close}d` : "—",
      helper: "From submission to funding (YTD)",
    },
  ];

  return (
    <main id="main-content" className="space-y-6">
      <PageHeader
        breadcrumbs={["Staff", "Reports"]}
        title="Reports & Analytics"
        subtitle="Organization-wide lending performance, pipeline analytics, and HMDA compliance exports."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            helper={metric.helper}
          />
        ))}
      </div>

      <div>
        <h2 className="mb-4 text-base font-semibold text-gray-900">Available Reports</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {REPORT_CARDS.map((report) => (
            <Link key={report.href} href={report.href} className="group block">
              <Card className="h-full p-5 transition-shadow hover:shadow-md">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50">
                    {report.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-700">
                      {report.title}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">{report.description}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
