import { UsersManager } from "@/components/admin/users-manager";
import { PageHeader } from "@/components/shared/page-header";
import { getAdminUsersData } from "@/lib/admin/queries";

export default async function AdminUsersPage() {
  const { users, branchOptions } = await getAdminUsersData();

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={["Admin", "Users"]}
        title="Users"
        subtitle="Invite staff, review access, and filter by role, branch, or status."
      />
      <UsersManager users={users} branchOptions={branchOptions} />
    </div>
  );
}
