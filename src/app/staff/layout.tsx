import type { ReactNode } from "react";

import { StaffShell } from "@/components/staff/staff-shell";
import { getStaffShellData } from "@/lib/staff/queries";

export default async function StaffLayout({ children }: { children: ReactNode }) {
  const profile = await getStaffShellData();

  return <StaffShell profile={profile}>{children}</StaffShell>;
}
