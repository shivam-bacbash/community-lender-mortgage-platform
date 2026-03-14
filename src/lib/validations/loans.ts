import { z } from "zod";

export const moveLoanStageSchema = z.object({
  loanId: z.string().uuid(),
  newStageId: z.string().uuid(),
});

export const underwritingDecisionSchema = z.object({
  decision: z.enum(["approved", "approved_with_conditions", "suspended", "denied"]),
  approved_amount: z.number().min(0).optional(),
  notes: z.string().max(5000).optional(),
  denial_reasons: z.array(z.number().int()).optional(),
});

export const documentRequestSchema = z.object({
  loanId: z.string().uuid(),
  documentType: z.enum([
    "paystub",
    "w2",
    "tax_return",
    "bank_statement",
    "photo_id",
    "social_security",
    "gift_letter",
    "purchase_contract",
    "title_commitment",
    "appraisal_report",
    "flood_cert",
    "homeowners_insurance",
    "loan_estimate",
    "closing_disclosure",
    "deed_of_trust",
    "promissory_note",
    "voe",
    "voa",
    "credit_auth",
    "other",
  ]),
  message: z.string().max(2000).optional(),
  dueDate: z.string().optional(),
});

export const documentReviewSchema = z.object({
  documentId: z.string().uuid(),
  action: z.enum(["accept", "reject"]),
  rejectionReason: z.string().max(2000).optional(),
});

export const conditionSchema = z.object({
  loanId: z.string().uuid(),
  condition_type: z.enum(["PTD", "PTC", "PTFUND", "GENERAL"]),
  source: z.enum(["underwriter", "processor", "compliance", "investor"]).optional(),
  description: z.string().min(1).max(3000),
  due_date: z.string().optional(),
  assigned_to: z.string().uuid().optional(),
});

export const resolveConditionSchema = z.object({
  conditionId: z.string().uuid(),
  action: z.enum(["satisfy", "waive"]),
  reason: z.string().max(2000).optional(),
});

export const taskSchema = z.object({
  loanId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  due_date: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  task_type: z.enum(["doc_collection", "verification", "review", "disclosure", "condition", "general"]).optional(),
  assigned_to: z.string().uuid().optional(),
});

export const completeTaskSchema = z.object({
  taskId: z.string().uuid(),
});

export const staffMessageSchema = z.object({
  loanId: z.string().uuid(),
  body: z.string().min(1).max(4000),
  isInternal: z.boolean().default(false),
  attachmentIds: z.array(z.string().uuid()).max(5).optional(),
});

export type UnderwritingDecisionInput = z.infer<typeof underwritingDecisionSchema>;
export type DocumentRequestInput = z.infer<typeof documentRequestSchema>;
export type DocumentReviewInput = z.infer<typeof documentReviewSchema>;
export type ConditionInput = z.infer<typeof conditionSchema>;
export type ResolveConditionInput = z.infer<typeof resolveConditionSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type StaffMessageInput = z.infer<typeof staffMessageSchema>;
