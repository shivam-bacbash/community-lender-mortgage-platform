import { BranchDetailManager } from "@/components/admin/branch-detail-manager";
import { PageHeader } from "@/components/shared/page-header";
import { getAdminBranchDetail } from "@/lib/admin/queries";

export default async function AdminBranchDetailPage({
  params,
}: {
  params: Promise<{ branchId: string }>;
}) {
  const { branchId } = await params;
  const { branch, members, staffOptions } = await getAdminBranchDetail(branchId);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={["Admin", "Branches", branch.name]}
        title={branch.name}
        subtitle="Update branch configuration and manage assigned team members."
      />
      <BranchDetailManager branch={branch} members={members} staffOptions={staffOptions} />
    </div>
  );
}
