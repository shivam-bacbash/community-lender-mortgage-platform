import { OrganizationSettingsForm } from "@/components/admin/organization-settings-form";
import { PageHeader } from "@/components/shared/page-header";
import { getAdminOrganizationSettings } from "@/lib/admin/queries";

export default async function AdminSettingsPage() {
  const { organization } = await getAdminOrganizationSettings();

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={["Admin", "Settings"]}
        title="Organization settings"
        subtitle="Update branding, plan settings, assignment defaults, and feature flags."
      />
      <OrganizationSettingsForm organization={organization} />
    </div>
  );
}
