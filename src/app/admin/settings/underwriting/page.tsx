import { UnderwritingRulesManager } from "@/components/admin/underwriting-rules-manager";
import { PageHeader } from "@/components/shared/page-header";
import { getAdminUnderwritingSettings } from "@/lib/admin/queries";

export default async function AdminUnderwritingSettingsPage() {
  const { rules } = await getAdminUnderwritingSettings();

  return (
    <main id="main-content" className="space-y-6">
      <PageHeader
        breadcrumbs={["Admin", "Settings", "Underwriting"]}
        title="Underwriting rules"
        subtitle="Configure rule thresholds by loan type and control which checks are active."
      />
      <UnderwritingRulesManager rules={rules} />
    </main>
  );
}
