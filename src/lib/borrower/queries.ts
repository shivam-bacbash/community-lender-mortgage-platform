import { cache } from "react";
import { notFound, redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parsePrequalificationResult } from "@/lib/ai/results";
import type {
  BorrowerDashboardLoan,
  BorrowerDocumentListItem,
  BorrowerDraftApplication,
  BorrowerLoanDetails,
  BorrowerMessage,
} from "@/types/borrower";
import type { Profile } from "@/types/auth";

type MessageRow = {
  id: string;
  body: string;
  created_at: string;
  sender_id: string;
  channel: string;
};

async function getAuthenticatedBorrower() {
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
    .select(
      "id, organization_id, role, first_name, last_name, phone, avatar_url, is_active, created_at, updated_at",
    )
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/login?error=profile-missing");
  }

  if (profile.role !== "borrower") {
    redirect("/login");
  }

  return { supabase, user, profile: profile as Profile };
}

async function getProfileNameMap(
  senderIds: string[],
  organizationId: string,
): Promise<Map<string, { name: string; role: string }>> {
  if (!senderIds.length) {
    return new Map();
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, role")
    .eq("organization_id", organizationId)
    .in("id", senderIds);

  return new Map(
    (data ?? []).map((row) => [
      row.id,
      { name: `${row.first_name} ${row.last_name}`.trim(), role: row.role },
    ]),
  );
}

export const getBorrowerShellData = cache(async () => {
  const { profile } = await getAuthenticatedBorrower();

  return profile;
});

export async function getBorrowerDashboardLoans(): Promise<{
  profile: Profile;
  loans: BorrowerDashboardLoan[];
  latestDraft: BorrowerDashboardLoan | null;
}> {
  const { supabase, user, profile } = await getAuthenticatedBorrower();
  const { data, error } = await supabase
    .from("loan_applications")
    .select(
      "id, loan_number, status, loan_amount, loan_purpose, loan_type, created_at, updated_at, estimated_closing, pipeline_stages(name, color)",
    )
    .eq("borrower_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const loans = (data ?? []).map((loan) => {
    const stage = Array.isArray(loan.pipeline_stages)
      ? loan.pipeline_stages[0]
      : loan.pipeline_stages;

    return {
      id: loan.id,
      loan_number: loan.loan_number,
      status: loan.status,
      loan_amount: loan.loan_amount,
      loan_purpose: loan.loan_purpose,
      loan_type: loan.loan_type,
      created_at: loan.created_at,
      updated_at: loan.updated_at,
      estimated_closing: loan.estimated_closing,
      stage_name: stage?.name ?? null,
      stage_color: stage?.color ?? null,
    };
  });

  return {
    profile,
    loans,
    latestDraft: loans.find((loan) => loan.status === "draft") ?? null,
  };
}

export async function getBorrowerDraftApplication(): Promise<{
  profile: Profile;
  draft: BorrowerDraftApplication | null;
}> {
  const { supabase, user, profile } = await getAuthenticatedBorrower();
  const { data: draftLoan, error: loanError } = await supabase
    .from("loan_applications")
    .select(
      "id, loan_number, status, loan_amount, loan_purpose, loan_type, down_payment, term_months, created_at, updated_at",
    )
    .eq("borrower_id", user.id)
    .eq("status", "draft")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (loanError) {
    throw new Error(loanError.message);
  }

  if (!draftLoan) {
    return { profile, draft: null };
  }

  const [propertyResult, borrowerProfileResult] = await Promise.all([
    supabase
      .from("properties")
      .select("id, address, property_type, occupancy_type, purchase_price")
      .eq("loan_application_id", draftLoan.id)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("borrower_profiles")
      .select(
        "id, loan_application_id, dob, marital_status, citizenship, dependents_count, address_current, years_at_address, housing_status, monthly_housing_payment",
      )
      .eq("loan_application_id", draftLoan.id)
      .eq("profile_id", user.id)
      .is("deleted_at", null)
      .maybeSingle(),
  ]);

  const borrowerProfile = borrowerProfileResult.data;
  const borrowerProfileId = borrowerProfile?.id;

  const [employmentRows, assetRows, liabilityRows] = borrowerProfileId
    ? await Promise.all([
        supabase
          .from("employment_records")
          .select(
            "id, employer_name, employer_phone, position, employment_type, start_date, end_date, is_current, is_primary, employer_address, base_monthly_income, overtime_monthly, bonus_monthly, commission_monthly, other_monthly",
          )
          .eq("borrower_profile_id", borrowerProfileId)
          .is("deleted_at", null)
          .order("is_primary", { ascending: false }),
        supabase
          .from("assets")
          .select(
            "id, asset_type, institution_name, account_last4, balance, is_gift, gift_source",
          )
          .eq("borrower_profile_id", borrowerProfileId)
          .is("deleted_at", null),
        supabase
          .from("liabilities")
          .select(
            "id, liability_type, creditor_name, account_number_last4, monthly_payment, outstanding_balance, months_remaining, to_be_paid_off, exclude_from_dti, exclude_reason",
          )
          .eq("borrower_profile_id", borrowerProfileId)
          .is("deleted_at", null),
      ])
    : [
        { data: [] },
        { data: [] },
        { data: [] },
      ];

  return {
    profile,
    draft: {
      id: draftLoan.id,
      loan_number: draftLoan.loan_number,
      status: draftLoan.status,
      loan_amount: draftLoan.loan_amount,
      loan_purpose: draftLoan.loan_purpose,
      loan_type: draftLoan.loan_type,
      down_payment: draftLoan.down_payment,
      term_months: draftLoan.term_months,
      created_at: draftLoan.created_at,
      updated_at: draftLoan.updated_at,
      property: propertyResult.data
        ? {
            id: propertyResult.data.id,
            address: (propertyResult.data.address ?? {}) as {
              street?: string;
              city?: string;
              state?: string;
              zip?: string;
              county?: string;
            },
            property_type: propertyResult.data.property_type,
            occupancy_type: propertyResult.data.occupancy_type,
            purchase_price: propertyResult.data.purchase_price,
          }
        : null,
      borrowerProfile: borrowerProfile
        ? {
            id: borrowerProfile.id,
            loan_application_id: borrowerProfile.loan_application_id,
            dob: borrowerProfile.dob,
            marital_status: borrowerProfile.marital_status,
            citizenship: borrowerProfile.citizenship,
            dependents_count: borrowerProfile.dependents_count,
            address_current: (borrowerProfile.address_current ?? null) as {
              street?: string;
              city?: string;
              state?: string;
              zip?: string;
              county?: string;
            } | null,
            years_at_address: borrowerProfile.years_at_address,
            housing_status: borrowerProfile.housing_status,
            monthly_housing_payment: borrowerProfile.monthly_housing_payment,
          }
        : null,
      employmentRecords: employmentRows.data ?? [],
      assets: assetRows.data ?? [],
      liabilities: liabilityRows.data ?? [],
    },
  };
}

export async function readBorrowerLoanDetails(
  loanId: string,
): Promise<BorrowerLoanDetails | null> {
  const { supabase, user } = await getAuthenticatedBorrower();
  const { data: loan, error } = await supabase
    .from("loan_applications")
    .select(
      "id, organization_id, loan_number, status, loan_amount, loan_purpose, loan_type, created_at, submitted_at, estimated_closing, pipeline_stage_id",
    )
    .eq("id", loanId)
    .or(`borrower_id.eq.${user.id},co_borrower_id.eq.${user.id}`)
    .is("deleted_at", null)
    .single();

  if (error || !loan) {
    return null;
  }

  const [
    propertyResult,
    stagesResult,
    documentsResult,
    conditionsResult,
    tasksResult,
    messagesResult,
    prequalResult,
  ] = await Promise.all([
    supabase
      .from("properties")
      .select("id, address, property_type, occupancy_type, purchase_price")
      .eq("loan_application_id", loan.id)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("pipeline_stages")
      .select("id, name, color, order_index")
      .eq("organization_id", loan.organization_id)
      .is("deleted_at", null)
      .order("order_index", { ascending: true }),
    supabase
      .from("documents")
      .select("id, document_type, status, created_at, file_name")
      .eq("loan_application_id", loan.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("conditions")
      .select("id, description, status, condition_type, due_date")
      .eq("loan_application_id", loan.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("tasks")
      .select("id, title, status, due_date, task_type")
      .eq("loan_application_id", loan.id)
      .is("deleted_at", null)
      .order("due_date", { ascending: true }),
    supabase
      .from("messages")
      .select("id, body, created_at, sender_id, channel")
      .eq("loan_application_id", loan.id)
      .eq("is_internal", false)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(2),
    supabase
      .from("ai_analyses")
      .select("id, created_at, status, result")
      .eq("loan_application_id", loan.id)
      .eq("analysis_type", "prequalification")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const messageRows = (messagesResult.data ?? []) as MessageRow[];
  const profileMap = await getProfileNameMap(
    [...new Set(messageRows.map((message) => message.sender_id))],
    loan.organization_id,
  );

  const stages = stagesResult.data ?? [];
  const currentStage = stages.find((stage) => stage.id === loan.pipeline_stage_id) ?? null;

  return {
    id: loan.id,
    organization_id: loan.organization_id,
    loan_number: loan.loan_number,
    status: loan.status,
    loan_amount: loan.loan_amount,
    loan_purpose: loan.loan_purpose,
    loan_type: loan.loan_type,
    created_at: loan.created_at,
    submitted_at: loan.submitted_at,
    estimated_closing: loan.estimated_closing,
    stage: currentStage,
    stageTimeline: stages.map((stage) => ({
      ...stage,
      isCurrent: stage.id === loan.pipeline_stage_id,
      isComplete: currentStage ? stage.order_index < currentStage.order_index : false,
    })),
    property: propertyResult.data
      ? {
          id: propertyResult.data.id,
          address: (propertyResult.data.address ?? {}) as {
            street?: string;
            city?: string;
            state?: string;
            zip?: string;
            county?: string;
          },
          property_type: propertyResult.data.property_type,
          occupancy_type: propertyResult.data.occupancy_type,
          purchase_price: propertyResult.data.purchase_price,
        }
      : null,
    documents: documentsResult.data ?? [],
    conditions: conditionsResult.data ?? [],
    tasks: tasksResult.data ?? [],
    lastMessages: messageRows.map((message) => ({
      id: message.id,
      body: message.body,
      created_at: message.created_at,
      sender_name: profileMap.get(message.sender_id)?.name ?? "Loan team",
    })),
    prequalification: prequalResult.data
      ? {
          ...prequalResult.data,
          parsed_result: parsePrequalificationResult(prequalResult.data.result),
        }
      : null,
  };
}

export async function getBorrowerLoanDetails(loanId: string): Promise<BorrowerLoanDetails> {
  const loan = await readBorrowerLoanDetails(loanId);

  if (!loan) {
    notFound();
  }

  return loan;
}

export async function getBorrowerLoanDocuments(
  loanId: string,
): Promise<{ loan: BorrowerLoanDetails; documents: BorrowerDocumentListItem[] }> {
  const loan = await getBorrowerLoanDetails(loanId);
  const { supabase } = await getAuthenticatedBorrower();
  const { data, error } = await supabase
    .from("documents")
    .select("id, document_type, status, created_at, file_name, storage_path")
    .eq("loan_application_id", loanId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const signedUrls = await Promise.all(
    (data ?? []).map(async (document) => {
      const { data: signedData } = await supabase.storage
        .from("documents")
        .createSignedUrl(document.storage_path, 3600);

      return {
        id: document.id,
        document_type: document.document_type,
        status: document.status,
        created_at: document.created_at,
        file_name: document.file_name,
        signed_url: signedData?.signedUrl ?? null,
      };
    }),
  );

  return { loan, documents: signedUrls };
}

export async function getBorrowerLoanMessages(loanId: string): Promise<{
  loan: BorrowerLoanDetails;
  messages: BorrowerMessage[];
}> {
  const loan = await getBorrowerLoanDetails(loanId);
  const { supabase } = await getAuthenticatedBorrower();
  const { data, error } = await supabase
    .from("messages")
    .select("id, body, created_at, sender_id, channel")
    .eq("loan_application_id", loanId)
    .eq("is_internal", false)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const messageRows = (data ?? []) as MessageRow[];
  const profileMap = await getProfileNameMap(
    [...new Set(messageRows.map((message) => message.sender_id))],
    loan.organization_id,
  );

  const messages = messageRows.map((message) => ({
    id: message.id,
    body: message.body,
    created_at: message.created_at,
    sender_id: message.sender_id,
    sender_name: profileMap.get(message.sender_id)?.name ?? "Loan team",
    sender_role: profileMap.get(message.sender_id)?.role ?? "staff",
    channel: message.channel,
  }));

  return { loan, messages };
}
