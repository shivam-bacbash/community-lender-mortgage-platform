import { getHMDARecords } from "./queries";
import type { Json } from "@/types/database";

function extractJsonField(data: unknown, field: string): string {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return "";
  }
  const obj = data as Record<string, Json | undefined>;
  const value = obj[field];
  if (value === null || value === undefined) return "";
  return String(value);
}

function formatLoanType(loanType: string | null): string {
  if (!loanType) return "";
  const map: Record<string, string> = {
    conventional: "1",
    fha: "2",
    va: "3",
    usda: "4",
    jumbo: "1",
  };
  return map[loanType] ?? "";
}

function formatLoanPurpose(purpose: string | null): string {
  if (!purpose) return "";
  const map: Record<string, string> = {
    purchase: "1",
    refinance: "31",
    cash_out: "32",
    construction: "2",
  };
  return map[purpose] ?? "";
}

export async function generateHMDAExport(orgId: string, year: number): Promise<string> {
  const records = await getHMDARecords(orgId, year);

  const HEADER =
    "# HMDA LAR Export | Fields: loan_type|loan_purpose|occupancy|loan_amount|action_taken|state|county|census_tract|ethnicity|race|sex|income|lien_status";

  if (records.length === 0) {
    return [HEADER, "# No HMDA records found for the selected year."].join("\n");
  }

  const lines = records.map((rec) => {
    const loanType = formatLoanType(rec.loan_type) || String(rec.property_type_hmda ?? "");
    const loanPurpose =
      formatLoanPurpose(rec.loan_purpose) || String(rec.loan_purpose_hmda ?? "");
    const occupancy = "1"; // default owner-occupied
    const loanAmount = rec.loan_amount !== null ? String(Math.round(Number(rec.loan_amount) / 1000)) : "";
    const actionTaken = rec.action_taken !== null ? String(rec.action_taken) : "";
    const state = ""; // not stored separately
    const county = rec.county_code ?? "";
    const censusTract = rec.census_tract ?? "";
    const ethnicity = extractJsonField(rec.ethnicity_data, "ethnicity_1");
    const race = extractJsonField(rec.race_data, "race_1");
    const sex = extractJsonField(rec.sex_data, "sex");
    const income = ""; // not stored in hmda_records
    const lienStatus = rec.lien_status !== null ? String(rec.lien_status) : "";

    return [
      loanType,
      loanPurpose,
      occupancy,
      loanAmount,
      actionTaken,
      state,
      county,
      censusTract,
      ethnicity,
      race,
      sex,
      income,
      lienStatus,
    ].join("|");
  });

  return [HEADER, ...lines].join("\n");
}
