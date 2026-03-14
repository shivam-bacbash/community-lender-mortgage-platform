"use client";

import { useState, useTransition } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { sendBorrowerMessage } from "@/lib/actions/borrower-portal";

export function MessageComposer({ loanId }: { loanId: string }) {
  const [body, setBody] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="rounded-2xl border border-gray-200 bg-white p-5"
      onSubmit={(event) => {
        event.preventDefault();
        setServerError(null);

        startTransition(async () => {
          const result = await sendBorrowerMessage({ loanId, body });

          if (result.error) {
            setServerError(result.error);
            return;
          }

          setBody("");
        });
      }}
    >
      <label htmlFor="message" className="text-sm font-medium text-gray-700">
        Message your loan team
      </label>
      <textarea
        id="message"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        className="mt-2 block min-h-28 w-full rounded-xl border border-gray-300 px-3.5 py-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
        placeholder="Ask a question or send an update."
      />
      {serverError ? <div className="mt-4"><Alert tone="error" message={serverError} /></div> : null}
      <div className="mt-4 flex justify-end">
        <Button type="submit" loading={isPending}>
          Send message
        </Button>
      </div>
    </form>
  );
}
