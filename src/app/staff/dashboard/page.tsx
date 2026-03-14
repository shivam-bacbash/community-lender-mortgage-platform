import Link from "next/link";

import { ActivityFeed } from "@/components/shared/activity-feed";
import { MetricCard } from "@/components/shared/metric-card";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { getStaffDashboardData } from "@/lib/staff/queries";
import { formatDate } from "@/lib/utils/format";

export default async function StaffDashboardPage() {
  const { metrics, recentActivity, myTasks } = await getStaffDashboardData();

  return (
    <main id="main-content" className="space-y-6">
      <PageHeader
        breadcrumbs={["Staff", "Dashboard"]}
        title="Staff dashboard"
        subtitle="Track workload, recent changes, and the tasks that need action today."
        actions={
          <Link href="/staff/pipeline" className="text-sm font-semibold text-primary-700">
            Open pipeline
          </Link>
        }
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
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <ActivityFeed items={recentActivity} />
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">My open tasks</h2>
            <span className="text-sm text-gray-500">{myTasks.length}</span>
          </div>
          <div className="mt-5 space-y-4">
            {myTasks.length ? (
              myTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/staff/loans/${task.loan_application_id}/tasks`}
                  className="block rounded-xl bg-gray-25 px-4 py-3"
                >
                  <p className="text-sm font-semibold text-gray-900">{task.title}</p>
                  <p className="mt-1 text-sm text-gray-600">
                    {task.loan_number ?? "Loan"} • {task.priority}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {task.due_date ? formatDate(task.due_date) : "No due date"}
                  </p>
                </Link>
              ))
            ) : (
              <p className="text-sm text-gray-600">No open tasks assigned to you.</p>
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}
