"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { saveBranch } from "@/lib/actions/admin";
import type { AdminBranchRecord } from "@/types/admin";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function BranchesManager({
  branches,
  managerOptions,
}: {
  branches: AdminBranchRecord[];
  managerOptions: Array<{ id: string; label: string }>;
}) {
  const router = useRouter();
  const [newBranch, setNewBranch] = useState({
    name: "",
    nmls_id: "",
    phone: "",
    manager_id: "",
    is_active: true,
    address_street: "",
    address_city: "",
    address_state: "",
    address_zip: "",
  });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      {feedback ? <Alert tone="success" message={feedback} /> : null}
      {error ? <Alert tone="error" message={error} /> : null}

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900">Create branch</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Input placeholder="Branch name" value={newBranch.name} onChange={(event) => setNewBranch((current) => ({ ...current, name: event.target.value }))} />
          <Input placeholder="NMLS ID" value={newBranch.nmls_id} onChange={(event) => setNewBranch((current) => ({ ...current, nmls_id: event.target.value }))} />
          <Input placeholder="Phone" value={newBranch.phone} onChange={(event) => setNewBranch((current) => ({ ...current, phone: event.target.value }))} />
          <Select value={newBranch.manager_id} onChange={(event) => setNewBranch((current) => ({ ...current, manager_id: event.target.value }))}>
            <option value="">No manager</option>
            {managerOptions.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.label}
              </option>
            ))}
          </Select>
          <Input placeholder="Street" value={newBranch.address_street} onChange={(event) => setNewBranch((current) => ({ ...current, address_street: event.target.value }))} />
          <Input placeholder="City" value={newBranch.address_city} onChange={(event) => setNewBranch((current) => ({ ...current, address_city: event.target.value }))} />
          <Input placeholder="State" value={newBranch.address_state} onChange={(event) => setNewBranch((current) => ({ ...current, address_state: event.target.value }))} />
          <Input placeholder="ZIP" value={newBranch.address_zip} onChange={(event) => setNewBranch((current) => ({ ...current, address_zip: event.target.value }))} />
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            loading={isPending}
            onClick={() =>
              startTransition(async () => {
                setFeedback(null);
                setError(null);
                const result = await saveBranch({
                  ...newBranch,
                  manager_id: newBranch.manager_id || undefined,
                });
                if (result.error) {
                  setError(result.error);
                  return;
                }
                setFeedback("Branch saved.");
                router.refresh();
                setNewBranch({
                  name: "",
                  nmls_id: "",
                  phone: "",
                  manager_id: "",
                  is_active: true,
                  address_street: "",
                  address_city: "",
                  address_state: "",
                  address_zip: "",
                });
              })
            }
          >
            Save branch
          </Button>
        </div>
      </Card>

      <div className="space-y-3">
        {branches.map((branch) => (
          <Card key={branch.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">{branch.name}</p>
                <p className="mt-1 text-sm text-gray-600">
                  {branch.member_count} members • Manager: {branch.manager_name ?? "Unassigned"}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {branch.nmls_id ?? "No NMLS"} • {branch.is_active ? "Active" : "Inactive"}
                </p>
              </div>
              <Link href={`/admin/branches/${branch.id}`} className="text-sm font-semibold text-primary-700">
                Manage
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
