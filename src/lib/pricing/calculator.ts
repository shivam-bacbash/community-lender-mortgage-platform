import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  buildDefaultRateMatrix,
  DEFAULT_FEE_TEMPLATES,
  DEFAULT_PRODUCTS,
  FICO_BUCKETS,
  LTV_BUCKETS,
} from "@/lib/pricing/constants";
import type {
  PricingProduct,
  PricingRateSheet,
  PricingResult,
  ProductRateQuote,
} from "@/types/pricing";

export interface PricingInput {
  loanAmount: number;
  creditScore: number;
  ltv: number;
  loanType: string;
  termMonths: number;
  occupancyType: string;
  propertyType: string;
}

function asNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function getLTVBucket(ltv: number) {
  const percentage = ltv <= 1 ? ltv * 100 : ltv;
  return LTV_BUCKETS.find((bucket) => percentage <= bucket) ?? LTV_BUCKETS[LTV_BUCKETS.length - 1];
}

function getFICOBucket(score: number) {
  return [...FICO_BUCKETS].reverse().find((bucket) => score >= bucket) ?? FICO_BUCKETS[0];
}

function calculateMonthlyPayment(rate: number, principal: number, termMonths: number) {
  const monthlyRate = rate / 100 / 12;
  return principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -termMonths));
}

function calculateAPR(rate: number, loanAmount: number, totalFees: number, termMonths: number) {
  const termYears = Math.max(termMonths / 12, 1);
  return Math.round((rate + ((totalFees / Math.max(loanAmount, 1)) / termYears) * 100) * 1000) / 1000;
}

function applyPriceAdjustors(baseRate: number, input: PricingInput) {
  let adjustedRate = baseRate;

  if (input.occupancyType === "investment") {
    adjustedRate += 0.5;
  } else if (input.occupancyType === "second_home") {
    adjustedRate += 0.25;
  }

  if (["condo", "multi_family"].includes(input.propertyType)) {
    adjustedRate += 0.125;
  }

  if (input.loanAmount > 766550) {
    adjustedRate += 0.2;
  }

  return adjustedRate;
}

export async function ensureDefaultPricingSetup(organizationId: string) {
  const admin = createSupabaseAdminClient();
  const { count, error: countError } = await admin
    .from("loan_products")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .is("deleted_at", null);

  if (countError) {
    throw new Error(countError.message);
  }

  if ((count ?? 0) === 0) {
    const { data: insertedProducts, error: productError } = await admin
      .from("loan_products")
      .insert(
        DEFAULT_PRODUCTS.map((product) => ({
          organization_id: organizationId,
          name: product.name,
          loan_type: product.loan_type,
          term_months: product.term_months,
          amortization_type: product.amortization_type,
          guidelines: product.guidelines,
          description: product.description,
          is_active: true,
          display_order: product.display_order,
        })),
      )
      .select("id, loan_type");

    if (productError) {
      throw new Error(productError.message);
    }

    if (insertedProducts?.length) {
      const { error: rateSheetError } = await admin.from("rate_sheets").insert(
        insertedProducts.map((product) => {
          const productDefaults = DEFAULT_PRODUCTS.find((item) => item.loan_type === product.loan_type);
          return {
            organization_id: organizationId,
            loan_product_id: product.id,
            effective_date: new Date().toISOString().slice(0, 10),
            rate_data: buildDefaultRateMatrix(productDefaults?.base_rate ?? 6.75),
            margin: productDefaults?.margin ?? 0.125,
            is_active: true,
          };
        }),
      );

      if (rateSheetError) {
        throw new Error(rateSheetError.message);
      }
    }

    return;
  }

  const { data: products, error: productReadError } = await admin
    .from("loan_products")
    .select("id, loan_type")
    .eq("organization_id", organizationId)
    .is("deleted_at", null);

  if (productReadError) {
    throw new Error(productReadError.message);
  }

  const { data: rateSheets, error: rateSheetReadError } = await admin
    .from("rate_sheets")
    .select("id, loan_product_id")
    .eq("organization_id", organizationId)
    .is("deleted_at", null);

  if (rateSheetReadError) {
    throw new Error(rateSheetReadError.message);
  }

  const productIdsWithRates = new Set((rateSheets ?? []).map((sheet) => sheet.loan_product_id));
  const missingRateSheets = (products ?? []).filter((product) => !productIdsWithRates.has(product.id));

  if (missingRateSheets.length) {
    const { error: rateSheetError } = await admin.from("rate_sheets").insert(
      missingRateSheets.map((product) => {
        const productDefaults = DEFAULT_PRODUCTS.find((item) => item.loan_type === product.loan_type);
        return {
          organization_id: organizationId,
          loan_product_id: product.id,
          effective_date: new Date().toISOString().slice(0, 10),
          rate_data: buildDefaultRateMatrix(productDefaults?.base_rate ?? 6.75),
          margin: productDefaults?.margin ?? 0.125,
          is_active: true,
        };
      }),
    );

    if (rateSheetError) {
      throw new Error(rateSheetError.message);
    }
  }
}

export async function applyDefaultFees(loanId: string, loanType: string) {
  const admin = createSupabaseAdminClient();
  const template = DEFAULT_FEE_TEMPLATES[loanType] ?? DEFAULT_FEE_TEMPLATES.conventional;
  const { count, error: countError } = await admin
    .from("loan_fees")
    .select("id", { count: "exact", head: true })
    .eq("loan_application_id", loanId)
    .is("deleted_at", null);

  if (countError) {
    throw new Error(countError.message);
  }

  if ((count ?? 0) > 0) {
    return;
  }

  const { error } = await admin.from("loan_fees").insert(
    template.map((fee) => ({
      loan_application_id: loanId,
      fee_type: fee.fee_type,
      fee_name: fee.fee_name,
      amount: fee.amount,
      paid_by: "borrower",
      disclosure_section: fee.disclosure_section,
      tolerance_bucket: fee.tolerance_bucket,
      can_increase: fee.tolerance_bucket !== "zero",
    })),
  );

  if (error) {
    throw new Error(error.message);
  }
}

async function getActiveRateSheets(
  loanType: string,
  organizationId: string,
  termMonths: number,
) {
  await ensureDefaultPricingSetup(organizationId);
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("loan_products")
    .select(
      "id, organization_id, name, loan_type, term_months, amortization_type, arm_initial_period, guidelines, description, is_active, display_order, rate_sheets!inner(id, effective_date, expiry_date, rate_data, margin, is_active)",
    )
    .eq("organization_id", organizationId)
    .eq("loan_type", loanType)
    .eq("term_months", termMonths)
    .eq("is_active", true)
    .is("deleted_at", null);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).flatMap((product) => {
    const activeSheets = (Array.isArray(product.rate_sheets) ? product.rate_sheets : [product.rate_sheets]).filter(
      (sheet) => sheet && sheet.is_active,
    );

    return activeSheets.map((sheet) => ({
      product: {
        id: product.id,
        organization_id: product.organization_id,
        name: product.name,
        loan_type: product.loan_type,
        term_months: product.term_months,
        amortization_type: product.amortization_type,
        arm_initial_period: product.arm_initial_period,
        guidelines: product.guidelines,
        description: product.description,
        is_active: product.is_active,
        display_order: product.display_order,
      } satisfies PricingProduct,
      rateSheet: {
        id: sheet.id,
        loan_product_id: product.id,
        effective_date: sheet.effective_date,
        expiry_date: sheet.expiry_date,
        rate_data: sheet.rate_data,
        margin: sheet.margin,
        is_active: sheet.is_active,
      } satisfies PricingRateSheet,
    }));
  });
}

function getRateQuoteForProduct(
  input: PricingInput,
  product: PricingProduct,
  rateSheet: PricingRateSheet,
  totalFees: number,
): ProductRateQuote | null {
  const ltvBucket = getLTVBucket(input.ltv);
  const ficoBucket = getFICOBucket(input.creditScore);
  const key = `ltv_${ltvBucket}_fico_${ficoBucket}`;
  const matrix = rateSheet.rate_data as Record<string, { rate?: number; points?: number }>;
  const bucketData = matrix[key];

  if (!bucketData?.rate) {
    return null;
  }

  const adjustedRate = applyPriceAdjustors(asNumber(bucketData.rate), input);
  const finalRate = Math.round((adjustedRate + asNumber(rateSheet.margin)) * 1000) / 1000;
  const points = asNumber(bucketData.points);
  const apr = calculateAPR(finalRate, input.loanAmount, totalFees, input.termMonths);
  const monthlyPayment = calculateMonthlyPayment(finalRate, input.loanAmount, input.termMonths);

  return {
    product_id: product.id,
    product_name: product.name,
    loan_type: product.loan_type,
    term_months: product.term_months,
    rate_sheet_id: rateSheet.id,
    rate: finalRate,
    apr,
    monthlyPayment,
    points,
  };
}

export async function calculateRate(
  input: PricingInput,
  organizationId: string,
  totalFees = 0,
): Promise<PricingResult> {
  const candidates = await getActiveRateSheets(input.loanType, organizationId, input.termMonths);
  const availableProducts = candidates
    .map(({ product, rateSheet }) => getRateQuoteForProduct(input, product, rateSheet, totalFees))
    .filter(Boolean)
    .sort((left, right) => (left?.rate ?? 999) - (right?.rate ?? 999)) as ProductRateQuote[];

  if (!availableProducts.length) {
    throw new Error("No rate available for this profile.");
  }

  const best = availableProducts[0];

  return {
    rate: best.rate,
    apr: best.apr,
    monthlyPayment: best.monthlyPayment,
    points: best.points,
    availableProducts,
  };
}
