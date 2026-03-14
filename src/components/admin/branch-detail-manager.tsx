"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { addBranchMember, removeBranchMember, saveBranch } from "@/lib/actions/admin";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function BranchDetailManager({
  branch,
  members,
  staffOptions,
}: {
  branch: {
    id: string;
    name: string;
    nmls_id: string | null;
    phone: string | null;
    is_active: boolean;
    manager_id: string | null;
    address: { street?: string; city?: string; state?: string; zip?: string } | null;
  };
  members: Array<{ id: string; profile_id: string; name: string; role: string; is_primary: boolean; email: string | null }>;
  staffOptions: Array<{ id: string; label: string; role: string }>;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState({
    name: branch.name,
    nmls_id: branch.nmls_id ?? "",
    phone: branch.phone ?? "",
    manager_id: branch.manager_id ?? "",
    is_active: branch.is_active,
    address_street: branch.address?.street ?? "",
    address_city: branch.address?.city ?? "",
    address_state: branch.address?.state ?? "",
    address_zip: branch.address?.zip ?? "",
  });
  const [staffId, setStaffId] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      {feedback ? <Alert tone="success" message={feedback} /> : null}
      {error ? <Alert tone="error" message={error} /> : null}

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900">Branch settings</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
          <Input value={draft.nmls_id} onChange={(event) => setDraft((current) => ({ ...current, nmls_id: event.target.value }))} />
          <Input value={draft.phone} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} />
          <Select value={draft.manager_id} onChange={(event) => setDraft((current) => ({ ...current, manager_id: event.target.value }))}>
            <option value="">No manager</option>
            {staffOptions.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.label}
              </option>
            ))}
          </Select>
          <Input value={draft.address_street} onChange={(event) => setDraft((current) => ({ ...current, address_street: event.target.value }))} placeholder="Street" />
          <Input value={draft.address_city} onChange={(event) => setDraft((current) => ({ ...current, address_city: event.target.value }))} placeholder="City" />
          <Input value={draft.address_state} onChange={(event) => setDraft((current) => ({ ...current, address_state: event.target.value }))} placeholder="State" />
          <Input value={draft.address_zip} onChange={(event) => setDraft((current) => ({ ...current, address_zip: event.target.value }))} placeholder="ZIP" />
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            loading={isPending}
            onClick={() =>
              startTransition(async () => {
                setFeedback(null);
                setError(null);
                const result = await saveBranch({
                  id: branch.id,
                  ...draft,
                  manager_id: draft.manager_id || undefined,
                });
                if (result.error) {
                  setError(result.error);
                  return;
                }
                setFeedback("Branch updated.");
                router.refresh();
              })
            }
          >
            Save branch
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">Add member</p>
            <Select value={staffId} onChange={(event) => setStaffId(event.target.value)} className="mt-2">
              <option value="">Select staff</option>
              {staffOptions.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.label} • {staff.role.replaceAll("_", " ")}
                </option>
              ))}
            </Select>
          </div>
          <Button
            loading={isPending}
            onClick={() =>
              startTransition(async () => {
                setFeedback(null);
                setError(null);
                if (!staffId) {
                  setError("Choose a staff member first.");
                  return;
                }
                const result = await addBranchMember({ branchId: branch.id, profileId: staffId, isPrimary: false });
                if (result.error) {
                  setError(result.error);
                  return;
                }
                setFeedback("Member added.");
                setStaffId("");
                router.refresh();
              })
            }
          >
            Add member
          </Button>
        </div>

        <div className="mt-5 space-y-3">
          {members.map((member) => (
            <div key={member.id} className="rounded-2xl border border-gray-200 bg-gray-25 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {member.name} {member.is_primary ? "• Primary" : ""}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {member.role.replaceAll("_", " ")} • {member.email ?? "No email"}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  loading={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      setFeedback(null);
                      setError(null);
                      const result = await removeBranchMember(branch.id, member.profile_id);
                      if (result.error) {
                        setError(result.error);
                        return;
                      }
                      setFeedback("Member removed.");
                      router.refresh();
                    })
                  }
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
