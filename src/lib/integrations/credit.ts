import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function pullCreditReport(
  borrowerProfileId: string,
  loanId: string,
  requestedBy: string,
) {
  const admin = createSupabaseAdminClient();
  const mockReport = {
    score: randomInt(720, 800),
    bureau: "tri_merge" as const,
    score_model: "FICO 8",
    report_data: {
      tradelines: [
        {
          type: "mortgage",
          status: "current",
          monthly_payment: 0,
        },
        {
          type: "revolving",
          status: "current",
          utilization_pct: randomInt(8, 28),
        },
      ],
      inquiries_last_12_months: randomInt(0, 4),
      derogatory_accounts: randomInt(0, 1),
    },
    reference_number: `MOCK-${Date.now()}`,
    pulled_at: new Date().toISOString(),
  };

  const { data, error } = await admin
    .from("credit_reports")
    .insert({
      borrower_profile_id: borrowerProfileId,
      loan_application_id: loanId,
      requested_by: requestedBy,
      ...mockReport,
    })
    .select("id, score, pulled_at, bureau")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to store the credit report.");
  }

  return data;
}
