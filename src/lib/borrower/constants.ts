export const BORROWER_NAV_ITEMS = [
  { href: "/borrower/dashboard", label: "Dashboard" },
  { href: "/borrower/apply", label: "Apply" },
] as const;

export const APPLICATION_STEPS = [
  { step: 1, title: "Loan details" },
  { step: 2, title: "Personal info" },
  { step: 3, title: "Current address" },
  { step: 4, title: "Employment" },
  { step: 5, title: "Assets" },
  { step: 6, title: "Liabilities" },
] as const;

export const STAFF_ROLES = ["loan_officer", "processor", "underwriter"] as const;
