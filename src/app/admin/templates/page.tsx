import { EmailTemplatesManager } from "@/components/admin/email-templates-manager";
import { PageHeader } from "@/components/shared/page-header";
import { getAdminEmailTemplates } from "@/lib/admin/queries";

export default async function AdminTemplatesPage() {
  const { templates } = await getAdminEmailTemplates();

  return (
    <main id="main-content" className="space-y-6 p-6">
      <PageHeader
        breadcrumbs={["Admin", "Templates"]}
        title="Email templates"
        subtitle="Customize org-level transactional emails used by borrower and staff notifications."
      />
      <EmailTemplatesManager templates={templates} />
    </main>
  );
}
