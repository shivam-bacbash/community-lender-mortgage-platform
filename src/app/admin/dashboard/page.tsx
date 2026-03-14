import { DashboardShell } from "@/components/auth/dashboard-shell";

export default function AdminDashboardPage() {
  return (
    <DashboardShell
      badge="Authenticated as admin"
      title="Admin dashboard"
      description="This placeholder confirms admin-only routing so settings, user management, and product configuration can build on top of it."
    />
  );
}
