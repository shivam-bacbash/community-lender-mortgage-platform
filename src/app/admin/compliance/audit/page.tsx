import Link from "next/link";

import { getAdminAuditLogs } from "@/lib/compliance/queries";
import { cn } from "@/lib/utils/cn";
import { AuditLogTable } from "@/components/compliance/audit-log-table";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function buildQueryString(searchParams: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });
  return params.toString();
}

export default async function AdminComplianceAuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1");
  const auditPage = await getAdminAuditLogs({
    page,
    pageSize: 25,
    action: params.action,
    actor: params.actor,
    resource: params.resource,
    from: params.from,
    to: params.to,
  });

  const prevQuery = buildQueryString({
    ...params,
    page: String(Math.max(1, auditPage.page - 1)),
  });
  const nextQuery = buildQueryString({
    ...params,
    page: String(auditPage.page + 1),
  });
  const csvQuery = buildQueryString({
    action: params.action,
    actor: params.actor,
    resource: params.resource,
    from: params.from,
    to: params.to,
  });

  return (
    <main id="main-content" className="min-h-screen bg-gray-50 px-6 py-10 sm:px-10 lg:px-12">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          breadcrumbs={["Admin", "Compliance", "Audit"]}
          title="Audit log"
          subtitle="Read-only history of state changes across loans and supporting records."
          actions={
            <a href={`/api/admin/compliance/audit?${csvQuery}`} className="text-sm font-semibold text-primary-700">
              Export CSV
            </a>
          }
        />

        <Card className="p-6">
          <form className="grid gap-4 md:grid-cols-5">
            <Input name="actor" placeholder="Actor" defaultValue={params.actor ?? ""} />
            <Input name="action" placeholder="Action" defaultValue={params.action ?? ""} />
            <Input name="resource" placeholder="Resource type" defaultValue={params.resource ?? ""} />
            <Input name="from" type="date" defaultValue={params.from ?? ""} />
            <Input name="to" type="date" defaultValue={params.to ?? ""} />
            <div className="md:col-span-5 flex gap-3">
              <Button type="submit">Apply filters</Button>
              <Link
                href="/admin/compliance/audit"
                className={cn(
                  "inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors",
                  "hover:bg-gray-50 hover:text-gray-900",
                )}
              >
                Reset
              </Link>
            </div>
          </form>
        </Card>

        <Card className="p-6">
          <AuditLogTable rows={auditPage.rows} />
          <div className="mt-4 flex items-center justify-between gap-3 text-sm text-gray-600">
            <p>
              Page {auditPage.page} • {auditPage.totalCount} total rows
            </p>
            <div className="flex gap-3">
              <Link
                href={`/admin/compliance/audit?${prevQuery}`}
                className={cn(
                  "inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 font-semibold text-gray-700 shadow-sm transition-colors",
                  "hover:bg-gray-50 hover:text-gray-900",
                  auditPage.page === 1 && "pointer-events-none opacity-50",
                )}
              >
                Previous
              </Link>
              <Link
                href={`/admin/compliance/audit?${nextQuery}`}
                className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-900"
              >
                Next
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
