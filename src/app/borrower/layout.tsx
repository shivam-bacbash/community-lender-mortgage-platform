import type { ReactNode } from "react";

import { BorrowerShell } from "@/components/borrower/borrower-shell";
import { getBorrowerShellData } from "@/lib/borrower/queries";

export default async function BorrowerLayout({ children }: { children: ReactNode }) {
  const profile = await getBorrowerShellData();

  return <BorrowerShell profile={profile}>{children}</BorrowerShell>;
}
