import { z } from "zod";
import { pgUuidSchema } from "@/lib/validations/shared";

export const pricingProductSchema = z.object({
  id: pgUuidSchema.optional(),
  name: z.string().min(1).max(200),
  loan_type: z.enum(["conventional", "fha", "va", "usda", "jumbo"]),
  term_months: z.number().int().min(60).max(480),
  amortization_type: z.enum(["fixed", "arm"]),
  description: z.string().max(1000).optional(),
  is_active: z.boolean().default(true),
  display_order: z.number().int().min(0).max(999).default(0),
  guidelines_json: z.string().min(2),
});

export const rateSheetSchema = z.object({
  id: pgUuidSchema.optional(),
  loan_product_id: pgUuidSchema,
  effective_date: z.string().min(1),
  expiry_date: z.string().optional(),
  margin: z.number().min(0).max(5),
  is_active: z.boolean().default(true),
  rate_data_json: z.string().min(2),
});

export const rateLockSchema = z.object({
  loanId: pgUuidSchema,
  loanProductId: pgUuidSchema,
  rate: z.number().min(0),
  apr: z.number().min(0),
  points: z.number().min(0),
  lockPeriodDays: z.number().int().min(1).max(90),
});

export const recalculatePricingSchema = z.object({
  loanId: pgUuidSchema,
});
