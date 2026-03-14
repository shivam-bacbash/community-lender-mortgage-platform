import type { Role } from "@/types/auth";

export function getDashboardPathForRole(role: Role) {
  switch (role) {
    case "borrower":
      return "/borrower/dashboard";
    case "admin":
      return "/admin/dashboard";
    default:
      return "/staff/dashboard";
  }
}

export function isStaffRole(role: Role) {
  return role === "loan_officer" || role === "processor" || role === "underwriter";
}

export function canAccessPath(role: Role, pathname: string) {
  if (pathname.startsWith("/borrower")) {
    return role === "borrower";
  }

  if (pathname.startsWith("/staff")) {
    return isStaffRole(role);
  }

  if (pathname.startsWith("/admin")) {
    return role === "admin";
  }

  return true;
}
