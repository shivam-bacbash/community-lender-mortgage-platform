export const ROLES = [
  "borrower",
  "loan_officer",
  "processor",
  "underwriter",
  "admin",
] as const;

export type Role = (typeof ROLES)[number];

export interface Profile {
  id: string;
  organization_id: string;
  role: Role;
  first_name: string;
  last_name: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };
