export const STAFF_NAV_ITEMS = [
  { href: "/staff/dashboard", label: "Dashboard" },
  { href: "/staff/pipeline", label: "Pipeline" },
  { href: "/staff/reports", label: "Reports" },
] as const;

export const STAFF_LOAN_TABS = [
  { href: "", label: "Overview" },
  { href: "/borrower", label: "Borrower" },
  { href: "/documents", label: "Documents" },
  { href: "/underwriting", label: "Underwriting" },
  { href: "/pricing", label: "Pricing" },
  { href: "/conditions", label: "Conditions" },
  { href: "/tasks", label: "Tasks" },
  { href: "/messages", label: "Messages" },
] as const;
