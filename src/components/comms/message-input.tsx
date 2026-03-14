"use client";

import { useMemo, useState, useTransition } from "react";

import { sendBorrowerMessage } from "@/lib/actions/borrower-portal";
import { sendStaffMessage } from "@/lib/actions/loans";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { MessageAttachment, MessageThreadItem } from "@/types/communications";

export function MessageInput({
  loanId,
  viewer,
  attachmentOptions,
  onSent,
}: {
  loanId: string;
  viewer: "borrower" | "staff";
  attachmentOptions: MessageAttachment[];
  onSent: (message: MessageThreadItem) => void;
}) {
  const [body, setBody] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedAttachmentIds, setSelectedAttachmentIds] = useState<string[]>([]);
  const [showAttachments, setShowAttachments] = useState(false);

  const canSubmit = useMemo(() => body.trim().length > 0, [body]);

  return (
    <form
      className="rounded-2xl border border-gray-200 bg-white p-5"
      onSubmit={(event) => {
        event.preventDefault();
        setServerError(null);

        startTransition(async () => {
          const result =
            viewer === "borrower"
              ? await sendBorrowerMessage({
                  loanId,
                  body,
                  attachmentIds: selectedAttachmentIds,
                })
              : await sendStaffMessage({
                  loanId,
                  body,
                  isInternal,
                  attachmentIds: selectedAttachmentIds,
                });

          if (result.error || !result.data) {
            setServerError(result.error ?? "Unable to send the message.");
            return;
          }

          onSent(result.data.message);
          setBody("");
          setIsInternal(false);
          setSelectedAttachmentIds([]);
          setShowAttachments(false);
        });
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {viewer === "borrower" ? "Message your loan team" : "Send a message"}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {viewer === "borrower"
              ? "Questions, updates, and file-related notes stay attached to this loan."
              : "Use internal notes for staff-only context. Borrowers never see those messages."}
          </p>
        </div>
        {attachmentOptions.length ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setShowAttachments((value) => !value)}
          >
            {showAttachments ? "Hide attachments" : "Attach documents"}
          </Button>
        ) : null}
      </div>

      <div className="mt-4">
        <Textarea
          id={`${viewer}-message`}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={viewer === "borrower" ? "Ask a question or share an update." : "Share context with the borrower or your team."}
        />
      </div>

      {viewer === "staff" ? (
        <label className="mt-3 inline-flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={isInternal} onChange={(event) => setIsInternal(event.target.checked)} />
          Internal note only
        </label>
      ) : null}

      {showAttachments ? (
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-25 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Attach existing documents</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {attachmentOptions.map((attachment) => {
              const checked = selectedAttachmentIds.includes(attachment.id);

              return (
                <label
                  key={attachment.id}
                  className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => {
                      setSelectedAttachmentIds((current) =>
                        event.target.checked
                          ? [...current, attachment.id]
                          : current.filter((id) => id !== attachment.id),
                      );
                    }}
                  />
                  <span>
                    <span className="block font-medium text-gray-900">{attachment.file_name}</span>
                    <span className="block text-xs text-gray-500">{attachment.document_type.replaceAll("_", " ")}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ) : null}

      {serverError ? (
        <div className="mt-4">
          <Alert tone="error" message={serverError} />
        </div>
      ) : null}

      <div className="mt-4 flex justify-end">
        <Button type="submit" loading={isPending} disabled={!canSubmit}>
          Send message
        </Button>
      </div>
    </form>
  );
}
