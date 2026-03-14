function getCurrentYear() {
  return new Date().getFullYear();
}

export function mapStatusToHMDAAction(status: string) {
  switch (status) {
    case "funded":
      return 1;
    case "approved":
      return 2;
    case "denied":
      return 3;
    case "withdrawn":
      return 4;
    default:
      return null;
  }
}

export function mapLoanPurposeToHMDA(loanPurpose: string) {
  switch (loanPurpose) {
    case "purchase":
      return 1;
    case "refinance":
      return 31;
    case "cash_out":
      return 32;
    default:
      return null;
  }
}

export function mapPropertyTypeToHMDA(propertyType: string | null) {
  switch (propertyType) {
    case "sfr":
    case "townhouse":
      return 1;
    case "condo":
      return 3;
    case "2_unit":
    case "3_unit":
    case "4_unit":
      return 2;
    default:
      return null;
  }
}

export function deriveCensusTract(address: {
  zip?: string;
  state?: string;
  county?: string;
} | null) {
  if (!address) {
    return null;
  }

  const zip = address.zip?.replace(/\D/g, "").slice(0, 5);
  if (!zip) {
    return null;
  }

  return `${address.state ?? "NA"}-${zip}`;
}

export function buildHMDAInput(params: {
  organizationId: string;
  loanId: string;
  status: string;
  loanPurpose: string;
  propertyType: string | null;
  propertyAddress: { zip?: string; state?: string; county?: string } | null;
  denialReasons?: number[] | null;
  rateSpread?: number | null;
  isHOEPA?: boolean;
}) {
  return {
    loan_application_id: params.loanId,
    organization_id: params.organizationId,
    action_taken: mapStatusToHMDAAction(params.status),
    action_taken_date: new Date().toISOString().slice(0, 10),
    denial_reasons: params.denialReasons ?? [],
    census_tract: deriveCensusTract(params.propertyAddress),
    county_code: params.propertyAddress?.county ?? null,
    msa_code: params.propertyAddress?.zip?.slice(0, 3) ?? null,
    loan_purpose_hmda: mapLoanPurposeToHMDA(params.loanPurpose),
    property_type_hmda: mapPropertyTypeToHMDA(params.propertyType),
    lien_status: 1,
    hoepa_status: params.isHOEPA ? 1 : 3,
    rate_spread: params.rateSpread ?? null,
    reporting_year: getCurrentYear(),
  };
}
