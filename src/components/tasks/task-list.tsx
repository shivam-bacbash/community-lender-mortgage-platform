"use client";

import { useState, useTransition } from "react";

import { completeTask, createTask } from "@/lib/actions/loans";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import type { StaffLoanWorkspace } from "@/types/staff";

export function TaskList({ workspace }: { workspace: StaffLoanWorkspace }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>Add task</Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {["pending", "in_progress", "completed"].map((status) => (
          <Card key={status} className="p-5">
            <h3 className="text-base font-semibold capitalize text-gray-900">
              {status.replaceAll("_", " ")}
            </h3>
            <div className="mt-4 space-y-3">
              {workspace.tasks
                .filter((task) => task.status === status)
                .map((task) => (
                  <div key={task.id} className="rounded-2xl bg-gray-25 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{task.title}</p>
                        <p className="mt-1 text-sm text-gray-600">
                          {task.assigned_to_name ?? "Unassigned"}
                        </p>
                      </div>
                      <StatusBadge status={task.priority} />
                    </div>
                    {task.status !== "completed" ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="mt-4"
                        loading={isPending}
                        onClick={() =>
                          startTransition(async () => {
                            await completeTask(task.id);
                          })
                        }
                      >
                        Complete
                      </Button>
                    ) : null}
                  </div>
                ))}
            </div>
          </Card>
        ))}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Add task">
        <div className="space-y-4">
          <Field id="taskTitle" label="Title">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
          </Field>
          <Field id="taskAssignee" label="Assignee">
            <Select value={assignee} onChange={(event) => setAssignee(event.target.value)}>
              <option value="">Unassigned</option>
              {workspace.staffMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="taskPriority" label="Priority">
            <Select value={priority} onChange={(event) => setPriority(event.target.value as typeof priority)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>
          </Field>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={isPending}
              onClick={() =>
                startTransition(async () => {
                  await createTask({
                    loanId: workspace.header.id,
                    title,
                    priority,
                    assigned_to: assignee || undefined,
                  });
                  setTitle("");
                  setAssignee("");
                  setPriority("medium");
                  setOpen(false);
                })
              }
            >
              Create task
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
