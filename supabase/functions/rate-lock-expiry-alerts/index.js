import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

Deno.serve(async () => {
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const warningCutoff = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

  const { data: locks, error } = await supabase
    .from("rate_locks")
    .select(
      "id, loan_application_id, rate, expires_at, loan_applications!inner(id, organization_id, loan_officer_id)",
    )
    .eq("status", "active")
    .is("deleted_at", null)
    .lte("expires_at", warningCutoff);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  for (const lock of locks ?? []) {
    const loan = Array.isArray(lock.loan_applications)
      ? lock.loan_applications[0]
      : lock.loan_applications;

    if (!loan?.loan_officer_id) {
      continue;
    }

    await supabase.from("notifications").insert({
      organization_id: loan.organization_id,
      recipient_id: loan.loan_officer_id,
      type: "rate_lock_expiring",
      title: "Rate lock expiring soon",
      body: `A ${lock.rate}% lock expires on ${lock.expires_at}.`,
      resource_type: "loan",
      resource_id: lock.loan_application_id,
      action_url: `/staff/loans/${lock.loan_application_id}/pricing`,
      sent_via: ["in_app"],
    });
  }

  return new Response(JSON.stringify({ processed: locks?.length ?? 0 }), {
    headers: { "Content-Type": "application/json" },
  });
});
