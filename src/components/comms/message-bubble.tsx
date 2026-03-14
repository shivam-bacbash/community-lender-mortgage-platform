import { Paperclip } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";
import type { MessageThreadItem } from "@/types/communications";

export function MessageBubble({
  message,
  currentUserId,
  viewer,
}: {
  message: MessageThreadItem;
  currentUserId: string;
  viewer: "borrower" | "staff";
}) {
  const isCurrentUser = message.sender_id === currentUserId;
  const isBorrowerMessage = message.sender_role === "borrower";
  const alignRight = viewer === "borrower" ? isCurrentUser : isBorrowerMessage;

  return (
    <div className={cn("flex", alignRight ? "justify-end" : "justify-start")}>
      <Card
        className={cn(
          "max-w-3xl px-5 py-4",
          message.is_internal && "border-warning-200 bg-warning-25",
          !message.is_internal && alignRight && "border-primary-200 bg-primary-25",
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-gray-900">{message.sender_name}</p>
          <span className="text-xs uppercase tracking-[0.16em] text-gray-500">
            {message.sender_role.replaceAll("_", " ")}
          </span>
          {message.is_internal ? (
            <span className="rounded-full bg-warning-100 px-2.5 py-1 text-xs font-semibold text-warning-700">
              Internal
            </span>
          ) : null}
        </div>
        <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">{message.body}</p>
        {message.attachments.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {message.attachments.map((attachment) => (
              <a
                key={attachment.id}
                href={attachment.href}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-primary-300 hover:text-primary-700"
              >
                <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />
                {attachment.file_name}
              </a>
            ))}
          </div>
        ) : null}
        <p className="mt-3 text-xs text-gray-500">{formatDate(message.created_at, "MMM d, yyyy h:mm a")}</p>
      </Card>
    </div>
  );
}
