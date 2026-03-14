"use client";

import { useState, useTransition } from "react";

import { sendStaffMessage } from "@/lib/actions/loans";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { StaffLoanWorkspace } from "@/types/staff";
import { formatDate } from "@/lib/utils/format";

export function StaffMessageThread({ workspace }: { workspace: StaffLoanWorkspace }) {
  const [body, setBody] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <label htmlFor="staffMessage" className="text-sm font-medium text-gray-700">
          Send a message
        </label>
        <textarea
          id="staffMessage"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          className="mt-2 block min-h-28 w-full rounded-xl border border-gray-300 px-3.5 py-3 text-sm text-gray-900"
        />
        <label className="mt-3 inline-flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={isInternal} onChange={(event) => setIsInternal(event.target.checked)} />
          Internal note only
        </label>
        <div className="mt-4 flex justify-end">
          <Button
            loading={isPending}
            onClick={() =>
              startTransition(async () => {
                await sendStaffMessage({
                  loanId: workspace.header.id,
                  body,
                  isInternal,
                });
                setBody("");
                setIsInternal(false);
              })
            }
          >
            Send message
          </Button>
        </div>
      </Card>
      <div className="space-y-4">
        {workspace.messages.map((message) => (
          <Card key={message.id} className="p-5">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-900">{message.sender_name}</p>
              <span className="text-xs uppercase tracking-[0.16em] text-gray-500">
                {message.sender_role.replaceAll("_", " ")}
              </span>
              {message.is_internal ? (
                <span className="rounded-full bg-warning-25 px-2.5 py-1 text-xs font-medium text-warning-700">
                  Internal
                </span>
              ) : null}
            </div>
            <p className="mt-3 text-sm text-gray-700">{message.body}</p>
            <p className="mt-3 text-xs text-gray-500">{formatDate(message.created_at, "MMM d, yyyy h:mm a")}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
