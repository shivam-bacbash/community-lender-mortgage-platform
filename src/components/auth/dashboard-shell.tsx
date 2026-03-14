import { Building2 } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/shared/page-header";

import { SignOutButton } from "./sign-out-button";

export function DashboardShell({
  badge,
  title,
  description,
}: {
  badge: string;
  title: string;
  description: string;
}) {
  return (
    <main id="main-content" className="min-h-screen bg-gray-50 px-6 py-10 sm:px-10 lg:px-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <PageHeader
          breadcrumbs={["Dashboard"]}
          title={title}
          subtitle={description}
          actions={<SignOutButton />}
        />
        <Card className="p-6">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status="processing" />
            <span className="text-sm font-medium text-gray-600">{badge}</span>
          </div>
          <div className="mt-4 flex items-start gap-3 rounded-lg bg-primary-25 p-4">
            <Building2 aria-hidden="true" className="mt-0.5 h-5 w-5 text-primary-600" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Baseline route protection is active</p>
              <p className="mt-1 text-sm text-gray-600">
                This landing page exists so redirects, wrong-role handling, and sign-out work
                before the role-specific modules are implemented.
              </p>
            </div>
          </div>
        </Card>
        <EmptyState
          title="Module scaffold ready"
          description="Add role-specific dashboard components here next. The shared design-system primitives and auth guardrails are already in place."
        />
      </div>
    </main>
  );
}
