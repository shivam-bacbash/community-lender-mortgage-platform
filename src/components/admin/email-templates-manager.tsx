"use client";

import { useState, useTransition } from "react";

import { saveEmailTemplate } from "@/lib/actions/notifications";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { EmailTemplateRecord } from "@/types/communications";

export function EmailTemplatesManager({ templates }: { templates: EmailTemplateRecord[] }) {
  const [items, setItems] = useState(templates);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      {feedback ? <Alert tone="success" message={feedback} /> : null}
      {error ? <Alert tone="error" message={error} /> : null}
      {items.map((template) => (
        <Card key={template.id} className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-base font-semibold text-gray-900">
                {template.trigger_event.replaceAll("_", " ")}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Available variables: {template.variables.map((variable) => `{{${variable.key}}}`).join(", ") || "None"}
              </p>
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={template.is_active}
                onChange={(event) => {
                  setItems((current) =>
                    current.map((item) =>
                      item.id === template.id ? { ...item, is_active: event.target.checked } : item,
                    ),
                  );
                }}
              />
              Active
            </label>
          </div>

          <div className="mt-5 grid gap-4">
            <Field id={`${template.id}-subject`} label="Subject">
              <Input
                id={`${template.id}-subject`}
                value={template.subject}
                onChange={(event) => {
                  const nextSubject = event.target.value;
                  setItems((current) =>
                    current.map((item) =>
                      item.id === template.id ? { ...item, subject: nextSubject } : item,
                    ),
                  );
                }}
              />
            </Field>

            <Field id={`${template.id}-body-html`} label="HTML body">
              <Textarea
                id={`${template.id}-body-html`}
                className="min-h-40"
                value={template.body_html}
                onChange={(event) => {
                  const nextBody = event.target.value;
                  setItems((current) =>
                    current.map((item) =>
                      item.id === template.id ? { ...item, body_html: nextBody } : item,
                    ),
                  );
                }}
              />
            </Field>

            <Field id={`${template.id}-body-text`} label="Plain text fallback">
              <Textarea
                id={`${template.id}-body-text`}
                className="min-h-24"
                value={template.body_text ?? ""}
                onChange={(event) => {
                  const nextBodyText = event.target.value;
                  setItems((current) =>
                    current.map((item) =>
                      item.id === template.id ? { ...item, body_text: nextBodyText } : item,
                    ),
                  );
                }}
              />
            </Field>

            <Field id={`${template.id}-reply-to`} label="Reply-to">
              <Input
                id={`${template.id}-reply-to`}
                placeholder="optional@example.com"
                value={template.reply_to ?? ""}
                onChange={(event) => {
                  const nextReplyTo = event.target.value;
                  setItems((current) =>
                    current.map((item) =>
                      item.id === template.id ? { ...item, reply_to: nextReplyTo } : item,
                    ),
                  );
                }}
              />
            </Field>
          </div>

          <div className="mt-5 flex justify-end">
            <Button
              loading={isPending}
              onClick={() => {
                setFeedback(null);
                setError(null);

                startTransition(async () => {
                  const currentTemplate = items.find((item) => item.id === template.id);
                  if (!currentTemplate) {
                    return;
                  }

                  const result = await saveEmailTemplate({
                    id: currentTemplate.id,
                    trigger_event: currentTemplate.trigger_event,
                    subject: currentTemplate.subject,
                    body_html: currentTemplate.body_html,
                    body_text: currentTemplate.body_text ?? undefined,
                    reply_to: currentTemplate.reply_to ?? undefined,
                    is_active: currentTemplate.is_active,
                  });

                  if (result.error || !result.data) {
                    setError(result.error ?? "Unable to save the template.");
                    return;
                  }

                  setItems((current) =>
                    current.map((item) => (item.id === result.data.id ? result.data : item)),
                  );
                  setFeedback(`Saved ${result.data.trigger_event.replaceAll("_", " ")} template.`);
                });
              }}
            >
              Save template
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
