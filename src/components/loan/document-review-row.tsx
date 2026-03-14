"use client";

import { useState, useTransition } from "react";
import { ExternalLink } from "lucide-react";

import { reviewDocument } from "@/lib/actions/loans";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import type { StaffLoanDocument } from "@/types/staff";

export function DocumentReviewRow({
  document,
  signedUrl,
}: {
  document: StaffLoanDocument;
  signedUrl: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 p-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-sm font-semibold text-gray-900">{document.file_name}</p>
        <p className="mt-1 text-sm text-gray-600">
          {document.document_type.replaceAll("_", " ")} • uploaded by {document.uploaded_by_name}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={document.status} />
        {signedUrl ? (
          <a
            href={signedUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700"
          >
            View
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        ) : null}
        <Button
          size="sm"
          variant="secondary"
          loading={isPending}
          onClick={() =>
            startTransition(async () => {
              await reviewDocument({ documentId: document.id, action: "accept" });
            })
          }
        >
          Accept
        </Button>
        <Button size="sm" variant="destructive" onClick={() => setOpen(true)}>
          Reject
        </Button>
      </div>
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
                    documentId: document.id,
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
    </div>
  );
}
