import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import type { EmailTemplateRecord } from "@/types/communications";

type DefaultTemplate = Omit<EmailTemplateRecord, "id" | "organization_id" | "updated_at">;

export const DEFAULT_EMAIL_TEMPLATES: DefaultTemplate[] = [
  {
    trigger_event: "application_submitted",
    subject: "We received your application — {{loan_number}}",
    body_html:
      "<p>Hi {{borrower_name}},</p><p>Your mortgage application {{loan_number}} has been received and is being reviewed.</p><p>Your loan officer {{lo_name}} will be in touch shortly.</p><p><a href=\"{{portal_url}}\">Open your borrower portal</a></p>",
    body_text:
      "Hi {{borrower_name}}, your mortgage application {{loan_number}} has been received and is being reviewed. Your loan officer {{lo_name}} will be in touch shortly. Track it at {{portal_url}}.",
    reply_to: null,
    variables: [
      { key: "borrower_name" },
      { key: "loan_number" },
      { key: "lo_name" },
      { key: "portal_url" },
    ],
    is_active: true,
    is_default: true,
  },
  {
    trigger_event: "status_changed",
    subject: "Loan update — {{loan_number}} is now {{loan_status}}",
    body_html:
      "<p>Hi {{borrower_name}},</p><p>Your loan {{loan_number}} is now <strong>{{loan_status}}</strong>.</p><p><a href=\"{{portal_url}}\">View the latest status</a></p>",
    body_text:
      "Hi {{borrower_name}}, your loan {{loan_number}} is now {{loan_status}}. View the latest status at {{portal_url}}.",
    reply_to: null,
    variables: [
      { key: "borrower_name" },
      { key: "loan_number" },
      { key: "loan_status" },
      { key: "portal_url" },
    ],
    is_active: true,
    is_default: true,
  },
  {
    trigger_event: "document_requested",
    subject: "Document needed for {{loan_number}}",
    body_html:
      "<p>Hi {{borrower_name}},</p><p>We need {{document_type}} for loan {{loan_number}}.</p><p>{{request_message}}</p><p><a href=\"{{portal_url}}\">Upload documents</a></p>",
    body_text:
      "Hi {{borrower_name}}, we need {{document_type}} for loan {{loan_number}}. {{request_message}} Upload it at {{portal_url}}.",
    reply_to: null,
    variables: [
      { key: "borrower_name" },
      { key: "loan_number" },
      { key: "document_type" },
      { key: "request_message" },
      { key: "portal_url" },
    ],
    is_active: true,
    is_default: true,
  },
  {
    trigger_event: "document_accepted",
    subject: "Document accepted for {{loan_number}}",
    body_html:
      "<p>Hi {{borrower_name}},</p><p>Your {{document_type}} for loan {{loan_number}} has been accepted.</p><p><a href=\"{{portal_url}}\">Review your file</a></p>",
    body_text:
      "Hi {{borrower_name}}, your {{document_type}} for loan {{loan_number}} has been accepted. Review your file at {{portal_url}}.",
    reply_to: null,
    variables: [
      { key: "borrower_name" },
      { key: "loan_number" },
      { key: "document_type" },
      { key: "portal_url" },
    ],
    is_active: true,
    is_default: true,
  },
  {
    trigger_event: "loan_approved",
    subject: "Great news — your loan has been approved!",
    body_html:
      "<p>Hi {{borrower_name}},</p><p>Congratulations. Your loan {{loan_number}} has been approved for {{loan_amount}}.</p><p><a href=\"{{portal_url}}\">View next steps</a></p>",
    body_text:
      "Hi {{borrower_name}}, congratulations. Your loan {{loan_number}} has been approved for {{loan_amount}}. View next steps at {{portal_url}}.",
    reply_to: null,
    variables: [
      { key: "borrower_name" },
      { key: "loan_number" },
      { key: "loan_amount" },
      { key: "portal_url" },
    ],
    is_active: true,
    is_default: true,
  },
  {
    trigger_event: "loan_denied",
    subject: "Update on your loan application — {{loan_number}}",
    body_html:
      "<p>Hi {{borrower_name}},</p><p>Your loan {{loan_number}} was not approved.</p><p><a href=\"{{portal_url}}\">Review the latest update</a></p>",
    body_text:
      "Hi {{borrower_name}}, your loan {{loan_number}} was not approved. Review the latest update at {{portal_url}}.",
    reply_to: null,
    variables: [
      { key: "borrower_name" },
      { key: "loan_number" },
      { key: "portal_url" },
    ],
    is_active: true,
    is_default: true,
  },
  {
    trigger_event: "rate_lock_expiring",
    subject: "Rate lock expiring soon — {{loan_number}}",
    body_html:
      "<p>Hi {{lo_name}},</p><p>The rate lock for {{borrower_name}} on loan {{loan_number}} expires on {{lock_expiration_date}}.</p><p><a href=\"{{portal_url}}\">Open pricing</a></p>",
    body_text:
      "Hi {{lo_name}}, the rate lock for {{borrower_name}} on loan {{loan_number}} expires on {{lock_expiration_date}}. Open pricing at {{portal_url}}.",
    reply_to: null,
    variables: [
      { key: "lo_name" },
      { key: "borrower_name" },
      { key: "loan_number" },
      { key: "lock_expiration_date" },
      { key: "portal_url" },
    ],
    is_active: true,
    is_default: true,
  },
  {
    trigger_event: "task_assigned",
    subject: "New task assigned — {{task_title}}",
    body_html:
      "<p>Hi {{assignee_name}},</p><p>You have a new task for loan {{loan_number}}: {{task_title}}.</p><p><a href=\"{{portal_url}}\">Open the file</a></p>",
    body_text:
      "Hi {{assignee_name}}, you have a new task for loan {{loan_number}}: {{task_title}}. Open the file at {{portal_url}}.",
    reply_to: null,
    variables: [
      { key: "assignee_name" },
      { key: "loan_number" },
      { key: "task_title" },
      { key: "portal_url" },
    ],
    is_active: true,
    is_default: true,
  },
  {
    trigger_event: "condition_added",
    subject: "New condition for {{loan_number}}",
    body_html:
      "<p>Hi {{borrower_name}},</p><p>A new condition was added to loan {{loan_number}}: {{condition_description}}.</p><p><a href=\"{{portal_url}}\">Review conditions</a></p>",
    body_text:
      "Hi {{borrower_name}}, a new condition was added to loan {{loan_number}}: {{condition_description}}. Review conditions at {{portal_url}}.",
    reply_to: null,
    variables: [
      { key: "borrower_name" },
      { key: "loan_number" },
      { key: "condition_description" },
      { key: "portal_url" },
    ],
    is_active: true,
    is_default: true,
  },
];

export function mergeTemplate(template: string, variables: Record<string, string | number | null | undefined>) {
  return template.replace(/{{\s*([\w.]+)\s*}}/g, (_, key: string) => {
    const value = variables[key];
    return value == null ? "" : String(value);
  });
}

export async function ensureDefaultEmailTemplates(organizationId: string) {
  const admin = createSupabaseAdminClient();
  const { data: existing, error } = await admin
    .from("email_templates")
    .select("trigger_event")
    .eq("organization_id", organizationId)
    .is("deleted_at", null);

  if (error) {
    throw new Error(error.message);
  }

  const existingEvents = new Set((existing ?? []).map((item) => item.trigger_event));
  const missingTemplates = DEFAULT_EMAIL_TEMPLATES.filter(
    (template) => !existingEvents.has(template.trigger_event),
  ).map((template) => ({
    organization_id: organizationId,
    ...template,
  }));

  if (!missingTemplates.length) {
    return;
  }

  const { error: insertError } = await admin.from("email_templates").insert(missingTemplates);

  if (insertError) {
    throw new Error(insertError.message);
  }
}
