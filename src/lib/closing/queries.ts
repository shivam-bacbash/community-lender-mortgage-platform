import { cache } from "react";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const CLOSING_STAFF_ROLES = ["loan_officer", "processor", "underwriter", "admin"] as const;

export type ClosingOrder = {
  id: string;
  loan_application_id: string;
  ordered_by: string | null;
  title_company_name: string | null;
  title_company_phone: string | null;
  settlement_agent: string | null;
  settlement_agent_email: string | null;
  closing_date: string | null;
  closing_location: {
    type?: string;
    address?: string;
    video_link?: string;
  } | null;
  status: string;
  wire_instructions: {
    checklist?: string[];
    [key: string]: unknown;
  } | null;
  docs_sent_at: string | null;
  signed_at: string | null;
  funded_at: string | null;
  disbursed_at: string | null;
  funding_amount: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type EsignEnvelope = {
  id: string;
  loan_application_id: string;
  created_by_profile: string | null;
  provider: string;
  envelope_id: string;
  signing_event: string | null;
  status: string;
  sent_at: string | null;
  viewed_at: string | null;
  completed_at: string | null;
  voided_at: string | null;
  void_reason: string | null;
  created_at: string;
};

export type ClosingLoan = {
  id: string;
  loan_number: string | null;
  status: string;
  borrower_id: string;
  loan_amount: number | null;
};

export type ClosingWorkspace = {
  closingOrder: ClosingOrder | null;
  esignEnvelopes: EsignEnvelope[];
  loan: ClosingLoan;
};

async function requireStaffContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, organization_id, role, first_name, last_name")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || !CLOSING_STAFF_ROLES.includes(profile.role as typeof CLOSING_STAFF_ROLES[number])) {
    redirect("/login");
  }

  return { supabase, profile };
}

export const getClosingWorkspace = cache(async (loanId: string): Promise<ClosingWorkspace> => {
  const { supabase, profile } = await requireStaffContext();

  const [loanResult, closingOrderResult, esignResult] = await Promise.all([
    supabase
      .from("loan_applications")
      .select("id, loan_number, status, borrower_id, loan_amount")
      .eq("id", loanId)
      .eq("organization_id", profile.organization_id)
      .single(),
    supabase
      .from("closing_orders")
      .select(
        "id, loan_application_id, ordered_by, title_company_name, title_company_phone, settlement_agent, settlement_agent_email, closing_date, closing_location, status, wire_instructions, docs_sent_at, signed_at, funded_at, disbursed_at, funding_amount, notes, created_at, updated_at",
      )
      .eq("loan_application_id", loanId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("esign_envelopes")
      .select(
        "id, loan_application_id, created_by_profile, provider, envelope_id, signing_event, status, sent_at, viewed_at, completed_at, voided_at, void_reason, created_at",
      )
      .eq("loan_application_id", loanId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
  ]);

  if (loanResult.error || !loanResult.data) {
    redirect("/staff/pipeline");
  }

  return {
    loan: loanResult.data as ClosingLoan,
    closingOrder: (closingOrderResult.data as ClosingOrder | null) ?? null,
    esignEnvelopes: (esignResult.data ?? []) as EsignEnvelope[],
  };
});
