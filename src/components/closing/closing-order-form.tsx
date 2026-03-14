"use client";

import { useTransition, useState } from "react";

import { scheduleClosing } from "@/lib/actions/closing";
import type { ClosingOrder } from "@/lib/closing/queries";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

type LocationType = "in_person" | "remote" | "hybrid";

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}

const inputClass =
  "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50";

export function ClosingOrderForm({
  loanId,
  existing,
}: {
  loanId: string;
  existing?: ClosingOrder | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const existingLocation = existing?.closing_location ?? null;
  const existingLocationType = (existingLocation?.type as LocationType) ?? "in_person";

  const [locationType, setLocationType] = useState<LocationType>(existingLocationType);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    const data = {
      title_company_name: (fd.get("title_company_name") as string) || undefined,
      title_company_phone: (fd.get("title_company_phone") as string) || undefined,
      settlement_agent: (fd.get("settlement_agent") as string) || undefined,
      settlement_agent_email: (fd.get("settlement_agent_email") as string) || undefined,
      closing_date: (fd.get("closing_date") as string) || undefined,
      closing_location_type: locationType,
      closing_address: (fd.get("closing_address") as string) || undefined,
      video_link: (fd.get("video_link") as string) || undefined,
      notes: (fd.get("notes") as string) || undefined,
    };

    startTransition(async () => {
      const res = await scheduleClosing(loanId, data);
      if (res.error) {
        setResult({ success: false, message: res.error });
      } else {
        setResult({ success: true, message: existing ? "Closing order updated." : "Closing scheduled successfully." });
      }
    });
  }

  const showAddress = locationType === "in_person" || locationType === "hybrid";
  const showVideoLink = locationType === "remote" || locationType === "hybrid";

  return (
    <Card className="p-6">
      <CardHeader>
        <h2 className="text-lg font-semibold text-gray-900">
          {existing ? "Edit closing order" : "Schedule closing"}
        </h2>
        <p className="text-sm text-gray-500">
          Enter title company and closing details for this loan file.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title company name">
              <input
                name="title_company_name"
                className={inputClass}
                placeholder="First American Title"
                defaultValue={existing?.title_company_name ?? ""}
              />
            </Field>
            <Field label="Title company phone">
              <input
                name="title_company_phone"
                type="tel"
                className={inputClass}
                placeholder="(555) 555-5555"
                defaultValue={existing?.title_company_phone ?? ""}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Settlement agent">
              <input
                name="settlement_agent"
                className={inputClass}
                placeholder="Jane Smith"
                defaultValue={existing?.settlement_agent ?? ""}
              />
            </Field>
            <Field label="Settlement agent email">
              <input
                name="settlement_agent_email"
                type="email"
                className={inputClass}
                placeholder="agent@titleco.com"
                defaultValue={existing?.settlement_agent_email ?? ""}
              />
            </Field>
          </div>

          <Field label="Closing date & time">
            <input
              name="closing_date"
              type="datetime-local"
              className={inputClass}
              defaultValue={
                existing?.closing_date
                  ? new Date(existing.closing_date).toISOString().slice(0, 16)
                  : ""
              }
            />
          </Field>

          <Field label="Location type">
            <select
              name="closing_location_type"
              className={inputClass}
              value={locationType}
              onChange={(e) => setLocationType(e.target.value as LocationType)}
            >
              <option value="in_person">In person</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </Field>

          {showAddress && (
            <Field label="Closing address">
              <input
                name="closing_address"
                className={inputClass}
                placeholder="123 Main St, City, State 00000"
                defaultValue={existingLocation?.address ?? ""}
              />
            </Field>
          )}

          {showVideoLink && (
            <Field label="Video conference link">
              <input
                name="video_link"
                type="url"
                className={inputClass}
                placeholder="https://zoom.us/j/..."
                defaultValue={existingLocation?.video_link ?? ""}
              />
            </Field>
          )}

          <Field label="Notes">
            <textarea
              name="notes"
              rows={3}
              className={inputClass}
              placeholder="Any special instructions or notes for this closing..."
              defaultValue={existing?.notes ?? ""}
            />
          </Field>

          {result && (
            <p
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium",
                result.success
                  ? "bg-success-50 text-success-700"
                  : "bg-error-50 text-error-700",
              )}
            >
              {result.message}
            </p>
          )}

          <Button type="submit" loading={isPending} className="w-full">
            {existing ? "Update closing order" : "Schedule closing"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
