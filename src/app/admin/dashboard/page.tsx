import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { getAdminDashboardData } from "@/lib/admin/queries";
import { formatDate } from "@/lib/utils/format";

export default async function AdminDashboardPage() {
  const { metrics, recentUsers } = await getAdminDashboardData();

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={["Admin", "Dashboard"]}
        title="Admin dashboard"
        subtitle="Organization-wide control center for users, branches, products, and workflow settings."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-gray-500">{metric.label}</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{metric.value}</p>
            <p className="mt-2 text-sm text-gray-600">{metric.helper}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Recently added users</h2>
          <Link href="/admin/users" className="text-sm font-semibold text-primary-700">
            View all users
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {recentUsers.map((user) => (
            <div key={user.id} className="rounded-2xl border border-gray-200 bg-gray-25 p-4">
              <p className="text-sm font-semibold text-gray-900">
                {user.first_name} {user.last_name}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                {user.email ?? "No email"} • {user.role.replaceAll("_", " ")}
              </p>
              <p className="mt-1 text-xs text-gray-500">Created {formatDate(user.created_at, "MMM d, yyyy h:mm a")}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
