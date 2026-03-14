"use client";

import { useTransition, useState } from "react";

import { sendForEsign, voidEsignEnvelope } from "@/lib/actions/closing";
import type { EsignEnvelope } from "@/lib/closing/queries";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";

type SigningEvent = "initial_disclosures" | "loan_estimate" | "closing_docs";

const SIGNING_EVENT_LABELS: Record<SigningEvent, string> = {
  initial_disclosures: "Initial Disclosures",
  loan_estimate: "Loan Estimate",
  closing_docs: "Closing Documents",
};

function VoidModal({
  envelopeId,
  onClose,
  onVoided,
}: {
  envelopeId: string;
  onClose: () => void;
  onVoided: () => void;
}) {
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleVoid() {
    if (!reason.trim()) {
      setError("Please provide a reason for voiding this envelope.");
      return;
    }
    startTransition(async () => {
      const res = await voidEsignEnvelope(envelopeId, reason);
      if (res.error) {
        setError(res.error);
      } else {
        onVoided();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
        <h3 className="text-base font-semibold text-gray-900">Void envelope</h3>
        <p className="mt-1 text-sm text-gray-500">
          Provide a reason for voiding this signing envelope.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="mt-3 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          placeholder="Enter reason..."
        />
        {error && (
          <p className="mt-2 text-sm font-medium text-error-600">{error}</p>
        )}
        <div className="mt-4 flex gap-3">
          <Button variant="destructive" size="sm" onClick={handleVoid} loading={isPending}>
            Void envelope
          </Button>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

export function EsignSection({
  loanId,
  envelopes,
}: {
  loanId: string;
  envelopes: EsignEnvelope[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SigningEvent>("closing_docs");
  const [isPending, startTransition] = useTransition();
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [localEnvelopes, setLocalEnvelopes] = useState<EsignEnvelope[]>(envelopes);

  function handleSend() {
    startTransition(async () => {
      const res = await sendForEsign(loanId, selectedEvent);
      if (res.error) {
        setSendResult({ success: false, message: res.error });
      } else {
        setSendResult({ success: true, message: `Envelope sent for ${SIGNING_EVENT_LABELS[selectedEvent]}.` });
        setShowForm(false);
      }
    });
  }

  function handleVoided() {
    setLocalEnvelopes((prev) =>
      prev.map((env) =>
        env.id === voidingId ? { ...env, status: "voided" } : env,
      ),
    );
    setVoidingId(null);
  }

  return (
    <>
      {voidingId && (
        <VoidModal
          envelopeId={voidingId}
          onClose={() => setVoidingId(null)}
          onVoided={handleVoided}
        />
      )}
      <Card className="p-6">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">E-sign envelopes</h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowForm((v) => !v);
                setSendResult(null);
              }}
            >
              {showForm ? "Cancel" : "Send for signature"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showForm && (
            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-3 text-sm font-medium text-gray-700">Select signing event</p>
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value as SigningEvent)}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                {(Object.entries(SIGNING_EVENT_LABELS) as [SigningEvent, string][]).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
              {sendResult && (
                <p
                  className={cn(
                    "mt-2 text-sm font-medium",
                    sendResult.success ? "text-success-700" : "text-error-600",
                  )}
                >
                  {sendResult.message}
                </p>
              )}
              <Button
                className="mt-3"
                size="sm"
                onClick={handleSend}
                loading={isPending}
              >
                Confirm &amp; send
              </Button>
            </div>
          )}

          {localEnvelopes.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">No signing envelopes have been sent yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-2 pr-4 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Event
                    </th>
                    <th className="pb-2 pr-4 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Provider
                    </th>
                    <th className="pb-2 pr-4 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Status
                    </th>
                    <th className="pb-2 pr-4 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Sent
                    </th>
                    <th className="pb-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Completed
                    </th>
                    <th className="pb-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {localEnvelopes.map((env) => (
                    <tr key={env.id} className="hover:bg-gray-50">
                      <td className="py-2.5 pr-4 text-gray-900">
                        {env.signing_event
                          ? SIGNING_EVENT_LABELS[env.signing_event as SigningEvent] ??
                            env.signing_event.replaceAll("_", " ")
                          : "—"}
                      </td>
                      <td className="py-2.5 pr-4 capitalize text-gray-700">{env.provider}</td>
                      <td className="py-2.5 pr-4">
                        <StatusBadge status={env.status} />
                      </td>
                      <td className="py-2.5 pr-4 text-gray-500">
                        {env.sent_at ? formatDate(env.sent_at, "MMM d, h:mm a") : "—"}
                      </td>
                      <td className="py-2.5 text-gray-500">
                        {env.completed_at ? formatDate(env.completed_at, "MMM d, h:mm a") : "—"}
                      </td>
                      <td className="py-2.5">
                        {env.status !== "voided" && env.status !== "completed" && (
                          <button
                            onClick={() => setVoidingId(env.id)}
                            className="text-xs font-medium text-error-600 hover:text-error-800"
                          >
                            Void
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
