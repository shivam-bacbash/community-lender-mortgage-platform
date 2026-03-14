import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminShellData } from "@/lib/admin/queries";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const profile = await getAdminShellData();

  return <AdminShell profile={profile}>{children}</AdminShell>;
}
