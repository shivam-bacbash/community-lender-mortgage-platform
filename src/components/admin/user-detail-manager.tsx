"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { addBranchMember, changeUserRole, resendInvite, toggleUserActive } from "@/lib/actions/admin";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";

export function UserDetailManager({
  user,
  branches,
  memberships,
  nmlsId,
}: {
  user: {
    id: string;
    first_name: string;
    last_name: string;
    role: string;
    email: string | null;
    is_active: boolean;
  };
  branches: Array<{ id: string; name: string }>;
  memberships: Array<{ id: string; branch_id: string; branch_name: string; is_primary: boolean }>;
  nmlsId: string | null;
}) {
  const router = useRouter();
  const [role, setRole] = useState(user.role);
  const [branchId, setBranchId] = useState(memberships.find((item) => item.is_primary)?.branch_id ?? "");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      {feedback ? <Alert tone="success" message={feedback} /> : null}
      {error ? <Alert tone="error" message={error} /> : null}

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900">User access</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {user.first_name} {user.last_name}
            </p>
            <p className="mt-1 text-sm text-gray-600">{user.email ?? "No email"}</p>
            <p className="mt-1 text-sm text-gray-600">NMLS ID: {nmlsId ?? "N/A"}</p>
          </div>
          <div className="space-y-3">
            <Select value={role} onChange={(event) => setRole(event.target.value)}>
              <option value="loan_officer">Loan officer</option>
              <option value="processor">Processor</option>
              <option value="underwriter">Underwriter</option>
              <option value="admin">Admin</option>
            </Select>
            <Select value={branchId} onChange={(event) => setBranchId(event.target.value)}>
              <option value="">No primary branch</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </Select>
            <div className="flex flex-wrap gap-3">
              <Button
                loading={isPending}
                onClick={() =>
                  startTransition(async () => {
                    setFeedback(null);
                    setError(null);
                    const roleResult = await changeUserRole({
                      profileId: user.id,
                      newRole: role as "loan_officer" | "processor" | "underwriter" | "admin",
                    });
                    if (roleResult.error) {
                      setError(roleResult.error);
                      return;
                    }
                    if (branchId) {
                      const branchResult = await addBranchMember({
                        branchId,
                        profileId: user.id,
                        isPrimary: true,
                      });
                      if (branchResult.error) {
                        setError(branchResult.error);
                        return;
                      }
                    }
                    setFeedback("User settings saved.");
                    router.refresh();
                  })
                }
              >
                Save changes
              </Button>
              <Button
                variant="secondary"
                loading={isPending}
                onClick={() =>
                  startTransition(async () => {
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
                loading={isPending}
                onClick={() =>
                  startTransition(async () => {
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
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900">Branch memberships</h2>
        <div className="mt-4 space-y-3">
          {memberships.map((membership) => (
            <div key={membership.id} className="rounded-2xl border border-gray-200 bg-gray-25 p-4 text-sm text-gray-700">
              {membership.branch_name} {membership.is_primary ? "• Primary" : ""}
            </div>
          ))}
          {!memberships.length ? <p className="text-sm text-gray-600">No branch membership assigned yet.</p> : null}
        </div>
      </Card>
    </div>
  );
}
