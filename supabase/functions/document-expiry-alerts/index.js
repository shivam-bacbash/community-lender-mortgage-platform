import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

Deno.serve(async () => {
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const warningCutoff = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: expiringDocuments, error } = await supabase
    .from("documents")
    .select(
      "id, organization_id, loan_application_id, document_type, file_name, expires_at, loan_applications!inner(id, borrower_id, loan_officer_id)",
    )
    .eq("is_latest", true)
    .eq("status", "accepted")
    .is("deleted_at", null)
    .not("expires_at", "is", null)
    .lte("expires_at", warningCutoff);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  for (const document of expiringDocuments ?? []) {
    const loan = Array.isArray(document.loan_applications)
      ? document.loan_applications[0]
      : document.loan_applications;

    if (!loan?.borrower_id && !loan?.loan_officer_id) {
      continue;
    }

    const notifications = [
      loan?.borrower_id
        ? {
            organization_id: document.organization_id,
            recipient_id: loan.borrower_id,
            type: "doc_expiring",
            title: "Document expiring soon",
            body: `${document.file_name} expires on ${document.expires_at}.`,
            resource_type: "document",
            resource_id: document.id,
            action_url: `/borrower/loans/${document.loan_application_id}/documents`,
            sent_via: ["in_app"],
          }
        : null,
      loan?.loan_officer_id
        ? {
            organization_id: document.organization_id,
            recipient_id: loan.loan_officer_id,
            type: "doc_expiring",
            title: "Borrower document expiring soon",
            body: `${document.file_name} expires on ${document.expires_at}.`,
            resource_type: "document",
            resource_id: document.id,
            action_url: `/staff/loans/${document.loan_application_id}/documents`,
            sent_via: ["in_app"],
          }
        : null,
    ].filter(Boolean);

    if (notifications.length) {
      await supabase.from("notifications").insert(notifications);
    }
  }

  return new Response(JSON.stringify({ processed: expiringDocuments?.length ?? 0 }), {
    headers: { "Content-Type": "application/json" },
  });
});
