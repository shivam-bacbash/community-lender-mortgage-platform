import { DashboardShell } from "@/components/auth/dashboard-shell";

export default function StaffDashboardPage() {
  return (
    <DashboardShell
      badge="Authenticated as staff"
      title="Staff dashboard"
      description="This placeholder covers loan officer, processor, and underwriter redirects until the pipeline and loan modules are implemented."
    />
  );
}
