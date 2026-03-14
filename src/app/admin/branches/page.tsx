import { BranchesManager } from "@/components/admin/branches-manager";
import { PageHeader } from "@/components/shared/page-header";
import { getAdminBranchesData } from "@/lib/admin/queries";

export default async function AdminBranchesPage() {
  const { branches, managerOptions } = await getAdminBranchesData();

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={["Admin", "Branches"]}
        title="Branches"
        subtitle="Manage branch setup, managers, contact details, and branch-level membership."
      />
      <BranchesManager branches={branches} managerOptions={managerOptions} />
    </div>
  );
}
