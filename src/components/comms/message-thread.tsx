"use client";

import { useEffect, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { MessageAttachment, MessageThreadItem } from "@/types/communications";

import { MessageInput } from "./message-input";
import { MessageBubble } from "./message-bubble";

type AttachmentOption = MessageAttachment;

function buildAttachments(attachmentIds: string[] | null, documents: AttachmentOption[]) {
  if (!attachmentIds?.length) {
    return [];
  }

  const attachmentMap = new Map(documents.map((document) => [document.id, document]));
  return attachmentIds.flatMap((attachmentId: string) => {
    const attachment = attachmentMap.get(attachmentId);
    return attachment ? [attachment] : [];
  });
}

export function MessageThread({
  loanId,
  currentUserId,
  viewer,
  initialMessages,
  attachmentOptions,
}: {
  loanId: string;
  currentUserId: string;
  viewer: "borrower" | "staff";
  initialMessages: MessageThreadItem[];
  attachmentOptions: AttachmentOption[];
}) {
  const [messages, setMessages] = useState(initialMessages);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const participantMap = new Map(
      initialMessages.map((message) => [message.sender_id, { name: message.sender_name, role: message.sender_role }]),
    );

    const channel = supabase
      .channel(`messages:${loanId}:${viewer}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `loan_application_id=eq.${loanId}`,
        },
        (payload) => {
          const nextMessage = payload.new as {
            id: string;
            body: string;
            created_at: string;
            sender_id: string;
            channel: string;
            is_internal: boolean;
            attachment_ids: string[] | null;
          };

          if (viewer === "borrower" && nextMessage.is_internal) {
            return;
          }

          setMessages((current) => {
            if (current.some((message) => message.id === nextMessage.id)) {
              return current;
            }

            const participant = participantMap.get(nextMessage.sender_id);
            const senderName =
              nextMessage.sender_id === currentUserId
                ? viewer === "borrower"
                  ? "You"
                  : "You"
                : participant?.name ?? (viewer === "borrower" ? "Loan team" : "Team member");
            const senderRole =
              nextMessage.sender_id === currentUserId
                ? viewer === "borrower"
                  ? "borrower"
                  : "staff"
                : participant?.role ?? "staff";

            return [
              ...current,
              {
                id: nextMessage.id,
                body: nextMessage.body,
                created_at: nextMessage.created_at,
                sender_id: nextMessage.sender_id,
                sender_name: senderName,
                sender_role: senderRole,
                channel: nextMessage.channel,
                is_internal: nextMessage.is_internal,
                attachment_ids: nextMessage.attachment_ids ?? [],
                attachments: buildAttachments(nextMessage.attachment_ids ?? [], attachmentOptions),
              },
            ];
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [attachmentOptions, currentUserId, initialMessages, loanId, viewer]);

  return (
    <div className="space-y-6">
      <MessageInput
        loanId={loanId}
        viewer={viewer}
        attachmentOptions={attachmentOptions}
        onSent={(message) => {
          setMessages((current) => {
            if (current.some((item) => item.id === message.id)) {
              return current;
            }

            return [...current, message];
          });
        }}
      />

      <div className="space-y-4">
        {messages.length ? (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              currentUserId={currentUserId}
              viewer={viewer}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500">
            No messages yet.
          </div>
        )}
      </div>
    </div>
  );
}
