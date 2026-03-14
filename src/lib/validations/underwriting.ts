import { z } from "zod";

import { UNDERWRITING_LOAN_TYPES } from "@/lib/underwriting/constants";
import { pgUuidSchema } from "@/lib/validations/shared";

export const underwritingRuleSchema = z.object({
  id: pgUuidSchema.optional(),
  loan_type: z.enum(UNDERWRITING_LOAN_TYPES),
  rule_name: z.string().min(1).max(100),
  min: z.number().optional(),
  max: z.number().optional(),
  is_active: z.boolean().default(true),
  priority: z.number().int().min(0).max(9999).default(100),
  description: z.string().max(500).optional(),
});

export const runAutomatedUnderwritingSchema = z.object({
  loanId: pgUuidSchema,
});

export const pullCreditReportSchema = z.object({
  loanId: pgUuidSchema,
});

export type UnderwritingRuleInput = z.infer<typeof underwritingRuleSchema>;
