import { UserDetailManager } from "@/components/admin/user-detail-manager";
import { PageHeader } from "@/components/shared/page-header";
import { getAdminUserDetail } from "@/lib/admin/queries";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const { user, branches, memberships, nmls_id } = await getAdminUserDetail(userId);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={["Admin", "Users", `${user.first_name} ${user.last_name}`]}
        title={`${user.first_name} ${user.last_name}`}
        subtitle="Update role assignment, branch membership, and account status."
      />
      <UserDetailManager user={user} branches={branches} memberships={memberships} nmlsId={nmls_id} />
    </div>
  );
}
