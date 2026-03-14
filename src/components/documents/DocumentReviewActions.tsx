"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { reviewDocument } from "@/lib/actions/loans";

export function DocumentReviewActions({ documentId }: { documentId: string }) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        loading={isPending}
        onClick={() =>
          startTransition(async () => {
            await reviewDocument({ documentId, action: "accept" });
          })
        }
      >
        Accept
      </Button>
      <Button size="sm" variant="destructive" onClick={() => setOpen(true)}>
        Reject
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Reject document">
        <div className="space-y-4">
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="block min-h-28 w-full rounded-xl border border-gray-300 px-3.5 py-3 text-sm text-gray-900"
            placeholder="Explain what needs to be corrected."
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={isPending}
              onClick={() =>
                startTransition(async () => {
                  await reviewDocument({
                    documentId,
                    action: "reject",
                    rejectionReason: reason,
                  });
                  setOpen(false);
                  setReason("");
                })
              }
            >
              Reject document
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
