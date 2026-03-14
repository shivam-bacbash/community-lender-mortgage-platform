"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { STAFF_LOAN_TABS } from "@/lib/staff/constants";
import { cn } from "@/lib/utils/cn";

export function LoanTabsNav({ loanId }: { loanId: string }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-2">
      {STAFF_LOAN_TABS.map((tab) => {
        const href = `/staff/loans/${loanId}${tab.href}`;
        const isActive = pathname === href;

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
