"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { randomUUID, createHash } from "node:crypto";

import { runAutomaticAnalyses } from "@/lib/ai/analyses";
import { analyzeDocumentUpload } from "@/lib/ai/document-extraction";
import {
  getDocumentCategory,
  getDocumentExpiryDays,
  type DocumentType,
} from "@/lib/documents/config";
import { getResendClient } from "@/lib/email/resend";
import { applyDefaultFees } from "@/lib/pricing/calculator";
import {
  documentUploadSchema,
  messageSchema,
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
  step6Schema,
  type DocumentUploadInput,
  type MessageInput,
  type Step1Input,
  type Step2Input,
  type Step3Input,
  type Step4Input,
  type Step5Input,
  type Step6Input,
} from "@/lib/validations/application";
import {
  getAppSecretKey,
  getAppUrl,
  getResendFromEmail,
} from "@/lib/supabase/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionResult, Profile } from "@/types/auth";

async function requireBorrowerContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be signed in to continue.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, organization_id, role, first_name, last_name, phone, avatar_url, is_active")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "borrower") {
    throw new Error("Borrower access is required.");
  }

  return { supabase, user, profile: profile as Profile };
}

async function getOwnedLoan(
  loanId: string,
  profileId: string,
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
) {
  const { data, error } = await supabase
    .from("loan_applications")
    .select("id, organization_id, borrower_id, co_borrower_id, status, loan_number, loan_type")
    .eq("id", loanId)
    .or(`borrower_id.eq.${profileId},co_borrower_id.eq.${profileId}`)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    throw new Error("Loan application not found.");
  }

  return data;
}

async function getOrCreateBorrowerProfileId(
  loanId: string,
  profileId: string,
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
) {
  const { data } = await supabase
    .from("borrower_profiles")
    .select("id")
    .eq("loan_application_id", loanId)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (data?.id) {
    return data.id;
  }

  const secret = getAppSecretKey();
  const { data: rpcData, error } = await supabase.rpc("upsert_borrower_profile_secure", {
    p_loan_application_id: loanId,
    p_secret: secret,
  });

  if (error || !rpcData) {
    throw new Error(error?.message ?? "Unable to create the borrower profile.");
  }

  return rpcData as string;
}

function normalizeStepError(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Try again.";
}

export async function saveLoanStep1(
  values: Step1Input,
  applicationId: string | null,
): Promise<ActionResult<{ applicationId: string; nextPath: string }>> {
  try {
    const parsed = step1Schema.parse(values);
    const { supabase, profile } = await requireBorrowerContext();

    let loanId = applicationId;

    if (loanId) {
      const loan = await getOwnedLoan(loanId, profile.id, supabase);

      if (loan.status !== "draft") {
        return { data: null, error: "Only draft applications can be edited." };
      }

      const { error: updateError } = await supabase
        .from("loan_applications")
        .update({
          loan_purpose: parsed.loan_purpose,
          loan_type: parsed.loan_type,
          loan_amount: parsed.loan_amount,
          down_payment: parsed.down_payment,
        })
        .eq("id", loanId);

      if (updateError) {
        throw new Error(updateError.message);
      }
    } else {
      const { data: firstStage, error: stageError } = await supabase
        .from("pipeline_stages")
        .select("id")
        .eq("organization_id", profile.organization_id)
        .is("deleted_at", null)
        .order("order_index", { ascending: true })
        .limit(1)
        .single();

      if (stageError || !firstStage) {
        throw new Error("No pipeline stages are configured for this organization.");
      }

      const { data: createdLoan, error: insertError } = await supabase
        .from("loan_applications")
        .insert({
          organization_id: profile.organization_id,
          borrower_id: profile.id,
          pipeline_stage_id: firstStage.id,
          status: "draft",
          loan_purpose: parsed.loan_purpose,
          loan_type: parsed.loan_type,
          loan_amount: parsed.loan_amount,
          down_payment: parsed.down_payment,
        })
        .select("id")
        .single();

      if (insertError || !createdLoan) {
        throw new Error(insertError?.message ?? "Unable to create the loan application.");
      }

      loanId = createdLoan.id;
      await applyDefaultFees(createdLoan.id, parsed.loan_type);
    }

    const { data: existingProperty } = await supabase
      .from("properties")
      .select("id")
      .eq("loan_application_id", loanId)
      .is("deleted_at", null)
      .maybeSingle();

    const propertyPayload = {
      loan_application_id: loanId,
      address: {
        street: parsed.property_street,
        city: parsed.property_city,
        state: parsed.property_state.toUpperCase(),
        zip: parsed.property_zip,
      },
      property_type: parsed.property_type,
      occupancy_type: parsed.occupancy_type,
      purchase_price: parsed.purchase_price ?? null,
    };

    const propertyQuery = existingProperty?.id
      ? supabase.from("properties").update(propertyPayload).eq("id", existingProperty.id)
      : supabase.from("properties").insert(propertyPayload);

    const { error: propertyError } = await propertyQuery;

    if (propertyError) {
      throw new Error(propertyError.message);
    }

    if (!loanId) {
      throw new Error("Unable to resolve the saved application.");
    }

    revalidatePath("/borrower/dashboard");
    revalidatePath("/borrower/apply");

    return {
      data: {
        applicationId: loanId,
        nextPath: "/borrower/apply/2",
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: normalizeStepError(error) };
  }
}

export async function saveLoanStep2(
  applicationId: string,
  values: Step2Input,
): Promise<ActionResult<{ applicationId: string; nextPath: string }>> {
  try {
    const parsed = step2Schema.parse(values);
    const { supabase, profile } = await requireBorrowerContext();
    const loan = await getOwnedLoan(applicationId, profile.id, supabase);

    if (loan.status !== "draft") {
      return { data: null, error: "Only draft applications can be edited." };
    }

    const secret = getAppSecretKey();
    const { error } = await supabase.rpc("upsert_borrower_profile_secure", {
      p_loan_application_id: applicationId,
      p_ssn: parsed.ssn,
      p_dob: parsed.dob,
      p_marital_status: parsed.marital_status,
      p_dependents_count: parsed.dependents_count,
      p_citizenship: parsed.citizenship,
      p_secret: secret,
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      data: { applicationId, nextPath: "/borrower/apply/3" },
      error: null,
    };
  } catch (error) {
    return { data: null, error: normalizeStepError(error) };
  }
}

export async function saveLoanStep3(
  applicationId: string,
  values: Step3Input,
): Promise<ActionResult<{ applicationId: string; nextPath: string }>> {
  try {
    const parsed = step3Schema.parse(values);
    const { supabase, profile } = await requireBorrowerContext();
    const loan = await getOwnedLoan(applicationId, profile.id, supabase);

    if (loan.status !== "draft") {
      return { data: null, error: "Only draft applications can be edited." };
    }

    const { error } = await supabase.rpc("upsert_borrower_profile_secure", {
      p_loan_application_id: applicationId,
      p_address_current: {
        street: parsed.current_street,
        city: parsed.current_city,
        state: parsed.current_state.toUpperCase(),
        zip: parsed.current_zip,
        county: parsed.current_county || null,
      },
      p_years_at_address: parsed.years_at_address,
      p_housing_status: parsed.housing_status,
      p_monthly_housing_payment: parsed.monthly_housing_payment,
      p_secret: getAppSecretKey(),
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      data: { applicationId, nextPath: "/borrower/apply/4" },
      error: null,
    };
  } catch (error) {
    return { data: null, error: normalizeStepError(error) };
  }
}

export async function saveLoanStep4(
  applicationId: string,
  values: Step4Input,
): Promise<ActionResult<{ applicationId: string; nextPath: string }>> {
  try {
    const parsed = step4Schema.parse(values);
    const { supabase, profile } = await requireBorrowerContext();
    const loan = await getOwnedLoan(applicationId, profile.id, supabase);

    if (loan.status !== "draft") {
      return { data: null, error: "Only draft applications can be edited." };
    }

    const borrowerProfileId = await getOrCreateBorrowerProfileId(applicationId, profile.id, supabase);
    const { error: deleteError } = await supabase
      .from("employment_records")
      .delete()
      .eq("borrower_profile_id", borrowerProfileId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    const records = parsed.employers.map((employer) => ({
      borrower_profile_id: borrowerProfileId,
      employer_name: employer.employer_name,
      employer_phone: employer.employer_phone || null,
      position: employer.position || null,
      employment_type: employer.employment_type,
      start_date: employer.start_date || null,
      end_date: employer.end_date || null,
      is_current: employer.is_current,
      is_primary: employer.is_primary,
      employer_address: {
        street: employer.employer_street || null,
        city: employer.employer_city || null,
        state: employer.employer_state || null,
        zip: employer.employer_zip || null,
      },
      base_monthly_income: employer.base_monthly_income,
      overtime_monthly: employer.overtime_monthly,
      bonus_monthly: employer.bonus_monthly,
      commission_monthly: employer.commission_monthly,
      other_monthly: employer.other_monthly,
    }));

    const { error: insertError } = await supabase.from("employment_records").insert(records);

    if (insertError) {
      throw new Error(insertError.message);
    }

    return {
      data: { applicationId, nextPath: "/borrower/apply/5" },
      error: null,
    };
  } catch (error) {
    return { data: null, error: normalizeStepError(error) };
  }
}

export async function saveLoanStep5(
  applicationId: string,
  values: Step5Input,
): Promise<ActionResult<{ applicationId: string; nextPath: string }>> {
  try {
    const parsed = step5Schema.parse(values);
    const { supabase, profile } = await requireBorrowerContext();
    const loan = await getOwnedLoan(applicationId, profile.id, supabase);

    if (loan.status !== "draft") {
      return { data: null, error: "Only draft applications can be edited." };
    }

    const borrowerProfileId = await getOrCreateBorrowerProfileId(applicationId, profile.id, supabase);
    const { error: deleteError } = await supabase
      .from("assets")
      .delete()
      .eq("borrower_profile_id", borrowerProfileId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    const rows = parsed.assets.map((asset) => ({
      borrower_profile_id: borrowerProfileId,
      asset_type: asset.asset_type,
      institution_name: asset.institution_name || null,
      account_last4: asset.account_last4 || null,
      balance: asset.balance,
      is_gift: asset.is_gift,
      gift_source: asset.is_gift ? asset.gift_source || null : null,
    }));

    const { error: insertError } = await supabase.from("assets").insert(rows);

    if (insertError) {
      throw new Error(insertError.message);
    }

    return {
      data: { applicationId, nextPath: "/borrower/apply/6" },
      error: null,
    };
  } catch (error) {
    return { data: null, error: normalizeStepError(error) };
  }
}

export async function saveLoanStep6(
  applicationId: string,
  values: Step6Input,
): Promise<ActionResult<{ applicationId: string; nextPath: string }>> {
  try {
    const parsed = step6Schema.parse(values);
    const { supabase, profile } = await requireBorrowerContext();
    const loan = await getOwnedLoan(applicationId, profile.id, supabase);

    if (loan.status !== "draft") {
      return { data: null, error: "Only draft applications can be edited." };
    }

    const borrowerProfileId = await getOrCreateBorrowerProfileId(applicationId, profile.id, supabase);
    const { error: deleteError } = await supabase
      .from("liabilities")
      .delete()
      .eq("borrower_profile_id", borrowerProfileId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    if (parsed.liabilities.length) {
      const rows = parsed.liabilities.map((liability) => ({
        borrower_profile_id: borrowerProfileId,
        liability_type: liability.liability_type,
        creditor_name: liability.creditor_name || null,
        account_number_last4: liability.account_number_last4 || null,
        monthly_payment: liability.monthly_payment,
        outstanding_balance: liability.outstanding_balance ?? null,
        months_remaining: liability.months_remaining ?? null,
        to_be_paid_off: liability.to_be_paid_off,
        exclude_from_dti: liability.exclude_from_dti,
        exclude_reason: liability.exclude_from_dti ? liability.exclude_reason || null : null,
      }));

      const { error: insertError } = await supabase.from("liabilities").insert(rows);

      if (insertError) {
        throw new Error(insertError.message);
      }
    }

    return {
      data: { applicationId, nextPath: "/borrower/apply/review" },
      error: null,
    };
  } catch (error) {
    return { data: null, error: normalizeStepError(error) };
  }
}

export async function submitBorrowerApplication(
  applicationId: string,
): Promise<ActionResult<{ loanId: string; redirectTo: string }>> {
  try {
    const { supabase, profile, user } = await requireBorrowerContext();
    const loan = await getOwnedLoan(applicationId, profile.id, supabase);

    if (loan.status !== "draft") {
      return { data: null, error: "Only draft applications can be submitted." };
    }

    const { error } = await supabase
      .from("loan_applications")
      .update({
        status: "submitted",
        submitted_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (error) {
      throw new Error(error.message);
    }

    await applyDefaultFees(applicationId, loan.loan_type);

    revalidatePath("/borrower/dashboard");
    revalidatePath(`/borrower/loans/${applicationId}`);

    after(async () => {
      try {
        await runAutomaticAnalyses(applicationId, profile.id);
      } catch {
        // Individual analysis functions persist failed rows. Nothing else should block the borrower.
      }

      try {
        if (process.env.RESEND_API_KEY) {
          const resend = getResendClient();
          await resend.emails.send({
            from: getResendFromEmail(),
            to: user.email ?? getResendFromEmail(),
            subject: `Application ${loan.loan_number ?? applicationId} submitted`,
            html: `
              <p>Your mortgage application has been submitted.</p>
              <p>Track progress at <a href="${getAppUrl()}/borrower/loans/${applicationId}">${getAppUrl()}/borrower/loans/${applicationId}</a></p>
            `,
          });
        }
      } catch {
        // Best-effort transactional email.
      }
    });

    return {
      data: {
        loanId: applicationId,
        redirectTo: `/borrower/loans/${applicationId}`,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: normalizeStepError(error) };
  }
}

async function ensureDocumentsBucket() {
  const admin = createSupabaseAdminClient();
  const { data } = await admin.storage.getBucket("documents");

  if (!data) {
    await admin.storage.createBucket("documents", {
      public: false,
      fileSizeLimit: 25 * 1024 * 1024,
      allowedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
    });
  }

  return admin;
}

function revalidateBorrowerLoanPaths(loanId: string) {
  revalidatePath(`/borrower/loans/${loanId}`);
  revalidatePath(`/borrower/loans/${loanId}/documents`);
  revalidatePath(`/staff/loans/${loanId}`);
  revalidatePath(`/staff/loans/${loanId}/documents`);
}

export async function uploadBorrowerDocument(
  values: DocumentUploadInput,
  file: File | null,
): Promise<ActionResult<{ documentId: string }>> {
  try {
    const parsed = documentUploadSchema.parse(values);
    const { supabase, profile } = await requireBorrowerContext();
    const loan = await getOwnedLoan(parsed.loanId, profile.id, supabase);

    if (!file) {
      return { data: null, error: "Choose a file to upload." };
    }

    if (file.size > 25 * 1024 * 1024) {
      return { data: null, error: "Files must be 25MB or smaller." };
    }

    if (!["application/pdf", "image/jpeg", "image/png"].includes(file.type)) {
      return { data: null, error: "Only PDF, JPG, and PNG files are allowed." };
    }

    const admin = await ensureDocumentsBucket();
    const extensionSafeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const storagePath = `documents/${loan.organization_id}/${parsed.loanId}/${randomUUID()}-${extensionSafeName}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const checksum = createHash("sha256").update(fileBuffer).digest("hex");
    const documentType = parsed.documentType as DocumentType;

    const { data: storageData, error: uploadError } = await admin.storage
      .from("documents")
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError || !storageData) {
      throw new Error(uploadError?.message ?? "Unable to upload the file.");
    }

    const { data: existingLatest, error: latestError } = await supabase
      .from("documents")
      .select("id, version, parent_document_id")
      .eq("loan_application_id", parsed.loanId)
      .eq("document_type", parsed.documentType)
      .eq("is_latest", true)
      .is("deleted_at", null)
      .maybeSingle();

    if (latestError) {
      throw new Error(latestError.message);
    }

    if (existingLatest?.id) {
      const { error: versionError } = await supabase
        .from("documents")
        .update({ is_latest: false })
        .eq("id", existingLatest.id);

      if (versionError) {
        throw new Error(versionError.message);
      }
    }

    const expiryDays = getDocumentExpiryDays(documentType);
    const expiresAt =
      expiryDays === null ? null : new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString();

    const { data: documentRow, error: insertError } = await supabase
      .from("documents")
      .insert({
        organization_id: loan.organization_id,
        loan_application_id: parsed.loanId,
        uploaded_by: profile.id,
        document_type: parsed.documentType,
        document_category: getDocumentCategory(documentType),
        file_name: file.name,
        storage_path: storageData.path,
        file_size_bytes: file.size,
        mime_type: file.type,
        checksum,
        version: existingLatest ? Number(existingLatest.version ?? 1) + 1 : 1,
        parent_document_id: existingLatest
          ? existingLatest.parent_document_id ?? existingLatest.id
          : null,
        expires_at: expiresAt,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError || !documentRow) {
      throw new Error(insertError?.message ?? "Unable to record the uploaded document.");
    }

    const { data: pendingRequest } = await supabase
      .from("document_requests")
      .select("id")
      .eq("loan_application_id", parsed.loanId)
      .eq("document_type", parsed.documentType)
      .eq("status", "pending")
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (pendingRequest?.id) {
      const { error: requestError } = await admin
        .from("document_requests")
        .update({
          status: "fulfilled",
          fulfilled_by_document_id: documentRow.id,
          fulfilled_at: new Date().toISOString(),
        })
        .eq("id", pendingRequest.id);

      if (requestError) {
        throw new Error(requestError.message);
      }
    }

    await admin.from("analytics_events").insert({
      organization_id: loan.organization_id,
      actor_id: profile.id,
      loan_application_id: parsed.loanId,
      event_name: "borrower.document_uploaded",
      properties: {
        document_type: parsed.documentType,
        version: existingLatest ? Number(existingLatest.version ?? 1) + 1 : 1,
        request_fulfilled: Boolean(pendingRequest?.id),
      },
      device_type: "desktop",
      browser: "unknown",
    });

    revalidateBorrowerLoanPaths(parsed.loanId);

    after(async () => {
      try {
        await analyzeDocumentUpload({
          documentId: documentRow.id,
          loanId: parsed.loanId,
          triggeredByProfile: profile.id,
          requestedType: parsed.documentType,
          fileName: file.name,
          mimeType: file.type,
          fileSizeBytes: file.size,
          checksum,
        });
      } catch {
        // Best-effort AI classification should never block borrower flows.
      }
    });

    return { data: { documentId: documentRow.id }, error: null };
  } catch (error) {
    return { data: null, error: normalizeStepError(error) };
  }
}

export async function sendBorrowerMessage(
  values: MessageInput,
): Promise<ActionResult<{ messageId: string }>> {
  try {
    const parsed = messageSchema.parse(values);
    const { supabase, profile } = await requireBorrowerContext();
    await getOwnedLoan(parsed.loanId, profile.id, supabase);

    const { data, error } = await supabase
      .from("messages")
      .insert({
        loan_application_id: parsed.loanId,
        sender_id: profile.id,
        body: parsed.body,
        is_internal: false,
        channel: "in_app",
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Unable to send the message.");
    }

    revalidatePath(`/borrower/loans/${parsed.loanId}`);
    revalidatePath(`/borrower/loans/${parsed.loanId}/messages`);

    return {
      data: { messageId: data.id },
      error: null,
    };
  } catch (error) {
    return { data: null, error: normalizeStepError(error) };
  }
}
