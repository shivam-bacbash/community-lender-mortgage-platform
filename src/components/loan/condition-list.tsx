"use client";

import { useState, useTransition } from "react";

import { addCondition, resolveCondition } from "@/lib/actions/loans";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import type { StaffLoanWorkspace } from "@/types/staff";

export function ConditionList({ workspace }: { workspace: StaffLoanWorkspace }) {
  const [conditionType, setConditionType] = useState<"PTD" | "PTC" | "PTFUND" | "GENERAL">("PTD");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <h3 className="text-lg font-semibold text-gray-900">Add condition</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Field id="conditionType" label="Type">
            <Select value={conditionType} onChange={(event) => setConditionType(event.target.value as typeof conditionType)}>
              <option value="PTD">PTD</option>
              <option value="PTC">PTC</option>
              <option value="PTFUND">PTFUND</option>
              <option value="GENERAL">General</option>
            </Select>
          </Field>
          <Field id="conditionDescription" label="Description" className="md:col-span-2">
            <Input value={description} onChange={(event) => setDescription(event.target.value)} />
          </Field>
          <Field id="conditionAssignee" label="Assign to">
            <Select value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)}>
              <option value="">Unassigned</option>
              {workspace.staffMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            loading={isPending}
            onClick={() =>
              startTransition(async () => {
                await addCondition({
                  loanId: workspace.header.id,
                  condition_type: conditionType,
                  description,
                  assigned_to: assignedTo || undefined,
                });
                setDescription("");
                setAssignedTo("");
              })
            }
          >
            Add condition
          </Button>
        </div>
      </Card>

      <div className="space-y-4">
        {workspace.conditions.map((condition) => (
          <Card key={condition.id} className="p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm font-semibold text-gray-900">{condition.description}</p>
                  <StatusBadge status={condition.status} />
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  {condition.condition_type} • {condition.assigned_to_name ?? "Unassigned"}
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  size="sm"
                  variant="secondary"
                  loading={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      await resolveCondition(condition.id, "satisfy");
                    })
                  }
                >
                  Mark satisfied
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  loading={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      await resolveCondition(condition.id, "waive", "Waived by staff review.");
                    })
                  }
                >
                  Waive
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
