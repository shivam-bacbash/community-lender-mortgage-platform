import { z } from "zod";

const colorHex = z.string().regex(/^#([A-Fa-f0-9]{6})$/, "Use a 6-digit hex color.");

export const inviteStaffSchema = z.object({
  email: z.string().email(),
  role: z.enum(["loan_officer", "processor", "underwriter", "admin"]),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  branch_id: z.string().uuid().optional(),
  nmls_id: z.string().max(50).optional(),
});

export const changeUserRoleSchema = z.object({
  profileId: z.string().uuid(),
  newRole: z.enum(["loan_officer", "processor", "underwriter", "admin"]),
});

export const toggleUserActiveSchema = z.object({
  profileId: z.string().uuid(),
  isActive: z.boolean(),
});

export const branchSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  nmls_id: z.string().max(50).optional(),
  phone: z.string().max(30).optional(),
  manager_id: z.string().uuid().optional(),
  is_active: z.boolean(),
  address_street: z.string().max(200).optional(),
  address_city: z.string().max(120).optional(),
  address_state: z.string().max(2).optional(),
  address_zip: z.string().max(10).optional(),
});

export const branchMemberSchema = z.object({
  branchId: z.string().uuid(),
  profileId: z.string().uuid(),
  isPrimary: z.boolean().default(false),
});

export const stageSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  color: colorHex,
  description: z.string().max(500).optional(),
  sla_days: z.number().int().min(0).max(365).optional(),
  is_terminal: z.boolean(),
  terminal_outcome: z.enum(["funded", "denied", "withdrawn", "cancelled"]).optional(),
});

export const reorderStagesSchema = z.object({
  stageIds: z.array(z.string().uuid()).min(1),
});

export const organizationSettingsSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(2).max(80),
  plan: z.enum(["starter", "pro", "enterprise"]),
  primary_color: colorHex,
  secondary_color: colorHex,
  accent_color: colorHex,
  nmls_id: z.string().max(50).optional(),
  default_assignment_mode: z.enum(["round_robin", "manual"]),
  ai_prequalification: z.boolean(),
  sms_notifications: z.boolean(),
  secondary_market: z.boolean(),
});

export type InviteStaffInput = z.infer<typeof inviteStaffSchema>;
export type ChangeUserRoleInput = z.infer<typeof changeUserRoleSchema>;
export type ToggleUserActiveInput = z.infer<typeof toggleUserActiveSchema>;
export type BranchInput = z.infer<typeof branchSchema>;
export type BranchMemberInput = z.infer<typeof branchMemberSchema>;
export type StageInput = z.infer<typeof stageSchema>;
export type ReorderStagesInput = z.infer<typeof reorderStagesSchema>;
export type OrganizationSettingsInput = z.infer<typeof organizationSettingsSchema>;
