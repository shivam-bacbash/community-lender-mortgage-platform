import Link from "next/link";
import { FilePlus2, RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils/cn";

const linkClass =
  "inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors";

export function QuickActions({ hasDraft }: { hasDraft: boolean }) {
  return (
    <div className="flex flex-wrap gap-3">
      <Link
        href="/borrower/apply"
        className={cn(linkClass, "bg-primary-600 text-white hover:bg-primary-700")}
      >
        <FilePlus2 className="h-4 w-4" aria-hidden="true" />
        New application
      </Link>
      {hasDraft ? (
        <Link
          href="/borrower/apply/1"
          className={cn(linkClass, "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50")}
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Continue draft
        </Link>
      ) : null}
    </div>
  );
}
