"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { inviteStaff, resendInvite, toggleUserActive } from "@/lib/actions/admin";
import type { AdminUserRecord } from "@/types/admin";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/lib/utils/format";

export function UsersManager({
  users,
  branchOptions,
}: {
  users: AdminUserRecord[];
  branchOptions: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [roleFilter, setRoleFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [invite, setInvite] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role: "loan_officer",
    branch_id: "",
    nmls_id: "",
  });
  const [isPending, startTransition] = useTransition();

  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        if (roleFilter && user.role !== roleFilter) {
          return false;
        }
        if (branchFilter && user.branch_id !== branchFilter) {
          return false;
        }
        if (statusFilter === "active" && !user.is_active) {
          return false;
        }
        if (statusFilter === "inactive" && user.is_active) {
          return false;
        }
        return true;
      }),
    [branchFilter, roleFilter, statusFilter, users],
  );

  return (
    <div className="space-y-6">
      {feedback ? <Alert tone="success" message={feedback} /> : null}
      {error ? <Alert tone="error" message={error} /> : null}

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900">Invite staff</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Input
            placeholder="First name"
            value={invite.first_name}
            onChange={(event) => setInvite((current) => ({ ...current, first_name: event.target.value }))}
          />
          <Input
            placeholder="Last name"
            value={invite.last_name}
            onChange={(event) => setInvite((current) => ({ ...current, last_name: event.target.value }))}
          />
          <Input
            placeholder="Email"
            type="email"
            value={invite.email}
            onChange={(event) => setInvite((current) => ({ ...current, email: event.target.value }))}
          />
          <Select value={invite.role} onChange={(event) => setInvite((current) => ({ ...current, role: event.target.value }))}>
            <option value="loan_officer">Loan officer</option>
            <option value="processor">Processor</option>
            <option value="underwriter">Underwriter</option>
            <option value="admin">Admin</option>
          </Select>
          <Select value={invite.branch_id} onChange={(event) => setInvite((current) => ({ ...current, branch_id: event.target.value }))}>
            <option value="">No branch</option>
            {branchOptions.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </Select>
          <Input
            placeholder="NMLS ID"
            value={invite.nmls_id}
            onChange={(event) => setInvite((current) => ({ ...current, nmls_id: event.target.value }))}
          />
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            loading={isPending}
            onClick={() =>
              startTransition(async () => {
                setFeedback(null);
                setError(null);
                const result = await inviteStaff({
                  ...invite,
                  role: invite.role as "loan_officer" | "processor" | "underwriter" | "admin",
                  branch_id: invite.branch_id || undefined,
                  nmls_id: invite.nmls_id || undefined,
                });
                if (result.error) {
                  setError(result.error);
                  return;
                }
                setFeedback("Invite sent.");
                router.refresh();
                setInvite({
                  first_name: "",
                  last_name: "",
                  email: "",
                  role: "loan_officer",
                  branch_id: "",
                  nmls_id: "",
                });
              })
            }
          >
            Invite staff
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
            <option value="">All roles</option>
            <option value="loan_officer">Loan officer</option>
            <option value="processor">Processor</option>
            <option value="underwriter">Underwriter</option>
            <option value="admin">Admin</option>
            <option value="borrower">Borrower</option>
          </Select>
          <Select value={branchFilter} onChange={(event) => setBranchFilter(event.target.value)}>
            <option value="">All branches</option>
            {branchOptions.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </Select>
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>

        <div className="mt-5 space-y-3">
          {filteredUsers.map((user) => (
            <div key={user.id} className="rounded-2xl border border-gray-200 bg-gray-25 p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {user.email ?? "No email"} • {user.role.replaceAll("_", " ")}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Branch: {user.branch_name ?? "Unassigned"} • Last active:{" "}
                    {user.last_active_at ? formatDate(user.last_active_at, "MMM d, yyyy h:mm a") : "Never"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={isPending}
                    onClick={() =>
                      startTransition(async () => {
                        setFeedback(null);
                        setError(null);
                        const result = await toggleUserActive({
                          profileId: user.id,
                          isActive: !user.is_active,
                        });
                        if (result.error) {
                          setError(result.error);
                          return;
                        }
                        setFeedback(user.is_active ? "User deactivated." : "User activated.");
                        router.refresh();
                      })
                    }
                  >
                    {user.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={isPending}
                    onClick={() =>
                      startTransition(async () => {
                        setFeedback(null);
                        setError(null);
                        const result = await resendInvite(user.id);
                        if (result.error) {
                          setError(result.error);
                          return;
                        }
                        setFeedback("Invite resent.");
                        router.refresh();
                      })
                    }
                  >
                    Resend invite
                  </Button>
                  <Link href={`/admin/users/${user.id}`} className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold text-primary-700">
                    Edit
                  </Link>
                </div>
              </div>
            </div>
          ))}
          {!filteredUsers.length ? <p className="text-sm text-gray-600">No users match the current filters.</p> : null}
        </div>
      </Card>
    </div>
  );
}
