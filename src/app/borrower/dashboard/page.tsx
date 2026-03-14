import { DashboardShell } from "@/components/auth/dashboard-shell";

export default function BorrowerDashboardPage() {
  return (
    <DashboardShell
      badge="Authenticated as borrower"
      title="Borrower dashboard"
      description="This placeholder confirms borrower-only access and gives the rest of Phase 1 a stable post-login landing page."
    />
  );
}
